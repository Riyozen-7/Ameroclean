/* ============================================
   AMERO — Order backend (zero dependencies)
   ============================================
   Run:
     1. Provide the bot credentials (never ship these to the browser):
          TELEGRAM_BOT_TOKEN   — Telegram bot token
          TELEGRAM_CHAT_ID     — chat/channel where orders are posted
        Copy server/.env.example to server/.env, or set the variables.
     2. Start the server from the project root:
          node server/server.js          # http://localhost:3000

   Exposes:
     GET  /            — serves the static storefront
     GET  /api/stock   — live stock snapshot { ok, stock } for the storefront
     POST /api/order   — validates + records an order, reserves stock, and
                         sends the Telegram notification. The token stays on
                         the server; prices, delivery fees, and stock are taken
                         from server/catalog.js — never from the client.

   For serverless/hosted deployments the /api/order handler is self-contained
   and can be lifted into a Netlify Function, Cloudflare Worker, or Next.js
   API route with the same env vars.
   ============================================ */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const { CATALOG, DELIVERY_FEES } = require('./catalog');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const STOCK_FILE = path.join(DATA_DIR, 'stock.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.jsonl');
const ENV_FILE = path.join(__dirname, '.env');

const PORT = process.env.PORT || 3000;
const TELEGRAM_API = 'https://api.telegram.org';

/* ---------- ENV ---------- */
function loadEnvFile() {
  try {
    const text = fs.readFileSync(ENV_FILE, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch { /* no .env file — rely on real env vars */ }
}
loadEnvFile();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.RESTOCK_KEY || '';

/* ---------- RATE LIMITING & CONCURRENCY QUEUE ---------- */
const ipRateMap = new Map();
function checkRateLimit(ip, limit = 5, windowMs = 60000) {
  if (!ip) return true;
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  if (entry.count > limit) return false;
  return true;
}

let orderMutex = Promise.resolve();
function enqueue(fn) {
  const next = orderMutex.then(fn, fn);
  orderMutex = next.catch(() => {});
  return next;
}

/* ---------- HELPERS ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, SECURITY_HEADERS));
  res.end(body);
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        const err = new Error('Request body too large');
        err.status = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function normalizePhone(raw) {
  let p = String(raw || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+880')) p = '0' + p.slice(4);
  else if (p.startsWith('880')) p = '0' + p.slice(3);
  else if (p.startsWith('+')) p = p.replace('+', '');
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

/* ---------- STOCK (persisted, single-threaded so reservation is atomic) ---------- */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function stockKey(productId, size) {
  return productId + ':' + size;
}

function loadStock() {
  try {
    return JSON.parse(fs.readFileSync(STOCK_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function defaultStock() {
  const stock = {};
  for (const p of CATALOG) {
    for (const s of p.sizes) stock[stockKey(p.id, s.size)] = s.stock;
  }
  return stock;
}

function ensureStock() {
  ensureDataDir();
  let stock = loadStock();
  const defaults = defaultStock();
  if (!stock || typeof stock !== 'object') {
    stock = defaults;
    fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2));
  } else {
    let updated = false;
    for (const [k, v] of Object.entries(defaults)) {
      if (stock[k] === undefined) {
        stock[k] = v;
        updated = true;
      }
    }
    if (updated) {
      fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2));
    }
  }
  return stock;
}

function saveStock(stock) {
  ensureDataDir();
  fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2));
}

/* ---------- TELEGRAM (token stays server-side, plain text => no parse errors) ---------- */
async function notifyTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('[order] Telegram not configured — set TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
    return false;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
      signal: controller.signal
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[order] Telegram responded', res.status, detail);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[order] Telegram notification failed:', err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- ORDER PIPELINE ---------- */
function validatePayload(body) {
  const payload = typeof body === 'object' ? body : {};
  const customer = payload.customer || {};
  const payment = payload.payment || {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  const name = String(customer.name || '').trim();
  const phone = normalizePhone(customer.phone);
  const address = String(customer.address || '').trim();
  const area = String(customer.area || '');
  const notes = String(customer.notes || '').trim();
  const method = String(payment.method || '');
  const txnId = String(payment.txnId || '').trim();

  if (!name || name.length > 120) return { error: 'A valid name is required.' };
  if (!phone) return { error: 'A valid Bangladeshi phone number is required.' };
  if (!address || address.length > 500) return { error: 'A valid delivery address is required.' };
  if (!(area in DELIVERY_FEES)) return { error: 'Please select a delivery zone.' };
  if (!['cod', 'bkash', 'nagad'].includes(method)) return { error: 'Please choose a payment method.' };
  if (method !== 'cod' && !/^[A-Za-z0-9]{4,40}$/.test(txnId)) return { error: 'A valid Transaction ID is required.' };

  if (!items.length) return { error: 'Your cart is empty.' };
  if (items.length > 50) return { error: 'Too many items.' };

  const lines = [];
  for (const raw of items) {
    const id = Number(raw.id);
    const size = String(raw.size || '');
    const qty = Number(raw.qty);
    const product = CATALOG.find(p => p.id === id);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return { error: 'One or more items are invalid.' };
    }
    const sizeInfo = product.sizes.find(s => s.size === size);
    if (!sizeInfo) return { error: `Size "${size}" is not available for this item.` };
    lines.push({ id, size, qty, price: product.price, name: product.name });
  }

  return { customer: { name, phone, address, area, notes }, payment: { method, txnId }, lines };
}

function placeOrder(payload) {
  const stock = ensureStock();
  const unavailable = [];

  for (const line of payload.lines) {
    const key = stockKey(line.id, line.size);
    const available = (stock[key] === undefined ? 0 : stock[key]);
    if (available < line.qty) {
      const product = CATALOG.find(p => p.id === line.id);
      unavailable.push({ id: line.id, size: line.size, name: product ? product.name : line.id });
    }
  }

  if (unavailable.length) {
    return {
      ok: false,
      status: 409,
      code: 'OUT_OF_STOCK',
      message: 'Some pieces are no longer available: ' +
        unavailable.map(u => `${u.name} — ${u.size}`).join(', ') + '. Please review your cart.',
      unavailable
    };
  }

  // Reserve stock (synchronous — atomic within this process).
  for (const line of payload.lines) {
    const key = stockKey(line.id, line.size);
    stock[key] -= line.qty;
  }
  saveStock(stock);

  const subtotal = payload.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const delivery = DELIVERY_FEES[payload.customer.area];
  const total = subtotal + delivery;
  const orderId = 'AMR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  const itemLines = payload.lines.map((l, i) =>
    `${i + 1}. ${l.name} — Size ${l.size} × ${l.qty} = ৳${l.price * l.qty}`
  ).join('\n');

  const notesLine = payload.customer.notes
    ? `\n📝 Notes: ${payload.customer.notes}`
    : '';

  const paymentText = payload.payment.method === 'cod'
    ? 'Cash on Delivery'
    : `${payload.payment.method === 'bkash' ? 'bKash' : 'Nagad'} (Txn ID: ${payload.payment.txnId})`;

  const areaLabel = payload.customer.area === 'chittagong' ? 'Inside Chittagong' : 'Outside Chittagong';

  const message =
`🛍️ NEW AMERO ORDER — ${orderId}

👤 ${payload.customer.name}
📞 ${payload.customer.phone}
📍 ${payload.customer.address}
🚚 ${areaLabel} (৳${delivery})

🛒 Items:
${itemLines}

💰 Subtotal: ৳${subtotal}
💰 Total: ৳${total}
💳 Payment: ${paymentText}${notesLine}`;

  const order = {
    orderId,
    placedAt: new Date().toISOString(),
    customer: payload.customer,
    payment: payload.payment,
    lines: payload.lines,
    subtotal,
    delivery,
    total
  };

  return { ok: true, status: 200, order, message, orderId, subtotal, delivery, total };
}

function recordOrder(order) {
  ensureDataDir();
  fs.appendFileSync(ORDERS_FILE, JSON.stringify(order) + '\n');
}

/* ---------- STATIC FILES ---------- */
const FORBIDDEN_PREFIXES = ['/server', '/worker', '/scripts', '/.git', '/.env', '/.wrangler'];
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss:; script-src 'self' 'unsafe-inline';"
};

function serveStatic(req, res, urlPath) {
  if (urlPath === '/') urlPath = '/index.html';

  const normalizedUrl = path.posix.normalize(urlPath);
  const isForbidden = FORBIDDEN_PREFIXES.some(prefix => normalizedUrl.startsWith(prefix) || normalizedUrl.startsWith('/' + prefix)) ||
                      normalizedUrl.split('/').some(segment => segment.startsWith('.'));

  const filePath = path.normalize(path.join(ROOT, normalizedUrl));
  if (isForbidden || (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep))) {
    res.writeHead(403, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, SECURITY_HEADERS));
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, SECURITY_HEADERS));
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, Object.assign({
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=604800'
    }, SECURITY_HEADERS));
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------- HTTP SERVER ---------- */
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  // Live stock snapshot for the storefront (read-only).
  if (req.method === 'GET' && pathname === '/api/stock') {
    sendJson(res, 200, { ok: true, stock: ensureStock() });
    return;
  }

  // Admin routes
  if (pathname.startsWith('/api/admin/')) {
    const key = req.headers['x-admin-key'];
    if (!ADMIN_KEY || !key || key !== ADMIN_KEY) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/orders') {
      const orders = [];
      try {
        if (fs.existsSync(ORDERS_FILE)) {
          const lines = fs.readFileSync(ORDERS_FILE, 'utf8').trim().split('\n');
          for (const line of lines) {
            if (line.trim()) orders.push(JSON.parse(line));
          }
        }
      } catch (err) {
        console.error('[admin] failed reading orders:', err.message);
      }
      sendJson(res, 200, { ok: true, orders });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/order/cancel') {
      let body;
      try { body = JSON.parse(await readBody(req)); } catch { body = {}; }
      const orderId = String(body.orderId || '').trim();
      if (!orderId) {
        sendJson(res, 400, { ok: false, error: 'orderId is required.' });
        return;
      }

      const result = await enqueue(async () => {
        if (!fs.existsSync(ORDERS_FILE)) return { ok: false, status: 404, error: 'Order not found.' };
        const lines = fs.readFileSync(ORDERS_FILE, 'utf8').trim().split('\n');
        const orders = lines.filter(l => l.trim()).map(l => JSON.parse(l));
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return { ok: false, status: 404, error: 'Order not found.' };
        if (order.status === 'cancelled') return { ok: false, status: 400, error: 'Order already cancelled.' };

        order.status = 'cancelled';
        order.cancelledAt = Date.now();

        const stock = ensureStock();
        for (const line of (order.lines || [])) {
          const k = stockKey(line.id, line.size);
          stock[k] = (Number(stock[k]) || 0) + (Number(line.qty) || 1);
        }
        saveStock(stock);
        fs.writeFileSync(ORDERS_FILE, orders.map(o => JSON.stringify(o)).join('\n') + '\n');
        return { ok: true, message: `Order ${orderId} cancelled and stock restored.`, stock };
      });

      sendJson(res, result.ok ? 200 : (result.status || 400), result);
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Admin endpoint not found.' });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/order') {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey) {
      if (!ADMIN_KEY || adminKey !== ADMIN_KEY) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
        return;
      }
      let body = {};
      try { body = JSON.parse(await readBody(req)); } catch {}
      const items = body && Array.isArray(body.items) && body.items.length ? body.items : null;

      const result = await enqueue(async () => {
        const current = ensureStock();
        const next = items ? Object.assign({}, current) : defaultStock();
        const updated = [];
        if (items) {
          for (const it of items) {
            const id = Number(it && it.id);
            const size = String((it && it.size) || '').trim();
            const key = stockKey(id, size);
            if (!(key in current)) continue;
            const product = CATALOG.find(p => p.id === id);
            const sizeInfo = product && product.sizes.find(s => s.size === size);
            next[key] = (sizeInfo && sizeInfo.stock) || 1;
            updated.push(key);
          }
        } else {
          for (const k of Object.keys(next)) updated.push(k);
        }
        saveStock(next);
        return { ok: true, message: updated.join(', '), stock: next };
      });

      sendJson(res, 200, {
        ok: true,
        message: items ? 'Restocked: ' + result.message : 'Full restock complete: ' + result.message,
        stock: result.stock
      });
      return;
    }

    const clientIp = req.socket.remoteAddress || '';
    if (!checkRateLimit(clientIp, 5, 60000)) {
      sendJson(res, 429, { ok: false, error: 'Too many order attempts. Please wait a minute or order via WhatsApp.' });
      return;
    }

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch (err) {
      sendJson(res, err.status || 400, { ok: false, error: err.status === 413 ? 'Request too large.' : 'Invalid JSON payload.' });
      return;
    }

    const validated = validatePayload(body);
    if (validated.error) {
      sendJson(res, 400, { ok: false, error: validated.error });
      return;
    }

    const result = await enqueue(async () => {
      const placed = placeOrder(validated);
      if (!placed.ok) return placed;

      const orderWithNotify = { ...placed.order, status: 'placed', placedAt: Date.now(), notified: false };
      try {
        orderWithNotify.notified = await notifyTelegram(placed.message);
      } catch {
        orderWithNotify.notified = false;
      }
      recordOrder(orderWithNotify);
      return Object.assign({}, placed, { notified: orderWithNotify.notified });
    });

    if (!result.ok) {
      sendJson(res, result.status, { ok: false, code: result.code, error: result.message, unavailable: result.unavailable });
      return;
    }

    console.log(`[order] ${result.orderId} — total ৳${result.total} — notified: ${result.notified}`);
    sendJson(res, 200, {
      ok: true,
      orderId: result.orderId,
      notified: result.notified,
      subtotal: result.subtotal,
      delivery: result.delivery,
      total: result.total,
      error: result.notified ? undefined : 'Your order was recorded, but the notification service is unavailable.'
    });
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res, pathname);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  const ok = BOT_TOKEN && CHAT_ID;
  console.log(`AMERO server running at http://localhost:${PORT}`);
  console.log(ok
    ? 'Telegram notifications: ENABLED'
    : 'Telegram notifications: DISABLED — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (see server/.env.example)');
});