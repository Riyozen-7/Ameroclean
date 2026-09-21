/* ============================================
   AMERO — Order API for Cloudflare Workers
   ============================================
   A single Durable Object serializes every order so "one piece per size"
   cannot oversell even when two buyers hit checkout at the same instant.
   The Telegram bot token lives only in Worker secrets — never on the site.

   Deploy:
     cd worker
     wrangler deploy                     # first deploy creates the DO
     wrangler secret put TELEGRAM_BOT_TOKEN
     wrangler secret put TELEGRAM_CHAT_ID
     wrangler secret put RESTOCK_KEY     # admin key for the restock endpoint
     # optional extra allowed frontend origins (comma-separated full origins;
     # required for a custom domain — GitHub Pages and *.pages.dev are built in):
     wrangler secret put ALLOWED_ORIGINS
   Then paste the printed workers.dev URL into PROD_ORDER_API_URL (js/config.js).

   Endpoints:
     GET  <worker>/api/stock    — public live stock snapshot { ok, stock }
     WS   <worker>/api/stock/ws — real-time stock push (instant sold-out)
     POST <worker>/api/order    — place an order / admin restock

   Restock (after a sale ships):
     curl -X POST <worker>/api/order -H "X-Admin-Key: <RESTOCK_KEY>" \
          -H "Content-Type: application/json" -d '{}'                    # full restock
     -d '{"items":[{"id":2,"size":"M"}]}'                                # specific pieces
   ============================================ */

// ---------- SERVER-SIDE CATALOG (mirror of server/catalog.js) ----------
export const DELIVERY_FEES = { chittagong: 70, outside: 120 };

export const CATALOG = [
  { id: 1, name: 'Premium Old Money Seersucker Striped Shirt', price: 750, sizes: [{ size: 'L/XXL', stock: 1 }] },
  { id: 2, name: 'Premium Puff-Printed T-Shirt', price: 450, sizes: [{ size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 }] },
  { id: 3, name: 'Premium Puff-Printed T-Shirt — Design II', price: 450, sizes: [{ size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 }] },
  { id: 4, name: 'Premium Puff-Printed T-Shirt — Spider-Man', price: 450, sizes: [{ size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 }] },
  { id: 5, name: 'Premium Old Money Knitted Shirt', price: 800, sizes: [{ size: 'XL', stock: 1 }] },
  { id: 6, name: 'Premium Old Money Waffle-Knit Shirt', price: 800, sizes: [{ size: 'L', stock: 1 }] },
  { id: 7, name: 'Brown Ribbed Half-Sleeve T-Shirt', price: 600, sizes: [{ size: 'L', stock: 1 }] },
  { id: 8, name: 'White Printed Drop-Shoulder T-Shirt', price: 450, sizes: [{ size: 'L', stock: 1 }] },
  { id: 9, name: 'Short-Sleeve T-Shirt', price: 450, sizes: [{ size: 'L', stock: 1 }] },
  { id: 10, name: 'Cream Ribbed Knit Polo Shirt', price: 499, sizes: [{ size: 'M', stock: 1 }] },
  { id: 11, name: 'Amsterdam Boxy Graphic Crew Neck T-Shirt', price: 450, sizes: [{ size: 'XL', stock: 1 }] },
  { id: 12, name: 'Premium Puff-Printed T-Shirt', price: 450, sizes: [{ size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 }] },
  { id: 13, name: 'Retro-Style Short-Sleeve Knitted Polo Shirt', price: 800, sizes: [{ size: 'L', stock: 1 }] }
];

// ---------- PURE HELPERS (unit-testable in Node) ----------
export function normalizePhone(raw) {
  let p = String(raw || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+880')) p = '0' + p.slice(4);
  else if (p.startsWith('880')) p = '0' + p.slice(3);
  else if (/^\+8801[3-9]\d{8}$/.test(p)) p = p.slice(1);
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

export function stockKey(productId, size) {
  return productId + ':' + size;
}

// Constant-time string comparison for the admin restock key.
function secureEqual(a, b) {
  const x = String(a == null ? '' : a);
  const y = String(b == null ? '' : b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export function defaultStock() {
  const stock = {};
  for (const p of CATALOG) for (const s of p.sizes) stock[stockKey(p.id, s.size)] = s.stock;
  return stock;
}

export function validatePayload(payload) {
  const customer = (payload && payload.customer) || {};
  const payment = (payload && payload.payment) || {};
  const items = Array.isArray(payload && payload.items) ? payload.items : [];

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
    const id = Number(raw && raw.id);
    const size = String((raw && raw.size) || '');
    const qty = Number(raw && raw.qty);
    const product = CATALOG.find(p => p.id === id);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 10) return { error: 'One or more items are invalid.' };
    const sizeInfo = product.sizes.find(s => s.size === size);
    if (!sizeInfo) return { error: 'Size "' + size + '" is not available for this item.' };
    lines.push({ id, size, qty, price: product.price, name: product.name });
  }

  return { customer: { name, phone, address, area, notes }, payment: { method, txnId }, lines };
}

export const PAYMENT_LABELS = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad' };

export function buildOrderMessage(order, paymentLabel) {
  const itemLines = order.lines.map((l, i) =>
    `${i + 1}. ${l.name} — Size ${l.size} × ${l.qty} = ৳${l.price * l.qty}`
  ).join('\n');
  const notesLine = order.customer.notes ? `\n📝 Notes: ${order.customer.notes}` : '';
  const areaLabel = order.customer.area === 'chittagong' ? 'Inside Chittagong' : 'Outside Chittagong';
  const txn = order.payment && order.payment.method !== 'cod' && order.payment.txnId
    ? ` (Txn ID: ${order.payment.txnId})` : '';
  return `🛍️ NEW AMERO ORDER — ${order.orderId}

👤 ${order.customer.name}
📞 ${order.customer.phone}
📍 ${order.customer.address}
🚚 ${areaLabel} (৳${order.delivery})

🛒 Items:
${itemLines}

💰 Subtotal: ৳${order.subtotal}
💰 Total: ৳${order.total}
💳 Payment: ${paymentLabel}${txn}${notesLine}`;
}

/* Checks stock and returns the reserved stock map + totals. Never mutates. */
export function applyReservation(currentStock, validated) {
  const unavailable = [];
  const next = Object.assign({}, currentStock);
  for (const line of validated.lines) {
    const key = stockKey(line.id, line.size);
    const avail = next[key] === undefined ? 0 : next[key];
    if (avail < line.qty) {
      const product = CATALOG.find(p => p.id === line.id);
      unavailable.push({ id: line.id, size: line.size, name: product ? product.name : line.id });
    } else {
      next[key] = avail - line.qty;
    }
  }
  if (unavailable.length) return { ok: false, unavailable };

  const subtotal = validated.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const delivery = DELIVERY_FEES[validated.customer.area];
  const total = subtotal + delivery;
  const orderId = 'AMR-' + Date.now().toString(36).toUpperCase() + '-' +
    Math.random().toString(36).slice(2, 6).toUpperCase();

  return {
    ok: true,
    stock: next,
    order: {
      orderId,
      placedAt: new Date().toISOString(),
      customer: validated.customer,
      payment: validated.payment,
      lines: validated.lines,
      subtotal,
      delivery,
      total
    }
  };
}

// ---------- TELEGRAM (token from Worker secrets, plain text, no parse errors) ----------
async function notifyTelegram(order, paymentLabel, env) {
  const token = env.TELEGRAM_BOT_TOKEN || '';
  const chatId = env.TELEGRAM_CHAT_ID || '';
  if (!token || !chatId) {
    console.error('[amero-api] Telegram not configured — set TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
    return false;
  }
  try {
    const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildOrderMessage(order, paymentLabel),
        disable_web_page_preview: true
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      console.error('[amero-api] Telegram responded', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[amero-api] Telegram notification failed:', err.message);
    return false;
  }
}

// ---------- CORS: allow GitHub Pages + localhost + explicit origins ----------
// Custom domains (and Cloudflare Pages preview URLs) must be listed in the
// comma-separated ALLOWED_ORIGINS secret, e.g.
//   wrangler secret put ALLOWED_ORIGINS
//   -> https://amero.com,https://www.amero.com
export function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
    if (host.endsWith('.github.io') || host.endsWith('.pages.dev')) return true;
    const normalized = origin.replace(/\/+$/, '').toLowerCase();
    const custom = String(env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim().replace(/\/+$/, '').toLowerCase())
      .filter(Boolean);
    return custom.includes(normalized);
  } catch {
    return false;
  }
}

const CORS_BASE = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

// ---------- DURABLE OBJECT: single-flight order serialization ----------
export class AmeroStore {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  // Current stock map (defaults until the first order/restock writes one).
  async stockSnapshot() {
    return (await this.ctx.storage.get('stock')) || defaultStock();
  }

  // Push the latest snapshot to every connected storefront tab. Uses the
  // WebSocket Hibernation API, so idle tabs cost nothing while still getting
  // an instant update the moment a piece sells or is restocked.
  broadcastStock(stock) {
    const payload = JSON.stringify({ type: 'stock', stock, at: Date.now() });
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(payload); } catch { /* closed between getWebSockets and send */ }
    }
  }

  async fetch(request) {
    // Real-time stock channel: instant sold-out to every open tab.
    const upgrade = request.headers.get('Upgrade');
    if (upgrade && upgrade.toLowerCase() === 'websocket') {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].send(JSON.stringify({ type: 'stock', stock: await this.stockSnapshot(), at: Date.now() }));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // Live stock snapshot — read-only, served straight from the DO so the
    // storefront can show the same availability the order path enforces.
    if (request.method === 'GET') {
      return json(200, { ok: true, stock: await this.stockSnapshot() });
    }

    if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' });

    // Admin restock endpoint (guarded by the RESTOCK_KEY secret).
    //   curl -X POST <worker>/api/order -H "X-Admin-Key: <RESTOCK_KEY>" -H "Content-Type: application/json" -d '{}'
    //   -d '{"items":[{"id":2,"size":"M"},{"id":5,"size":"XL"}]}'  -> restock only those pieces
    //   -d '{}'                                                    -> full restock to catalog defaults
    if (request.headers.has('X-Admin-Key')) {
      const expected = this.env.RESTOCK_KEY || '';
      if (!expected) return json(503, { ok: false, error: 'RESTOCK_KEY is not configured on the Worker.' });
      if (!secureEqual(request.headers.get('X-Admin-Key'), expected)) return json(401, { ok: false, error: 'Unauthorized.' });

      let body = null;
      try { body = await request.json(); } catch { /* empty body -> full restock */ }
      const items = body && Array.isArray(body.items) && body.items.length ? body.items : null;

      let result = null;
      await this.ctx.blockConcurrencyWhile(async () => {
        const current = (await this.ctx.storage.get('stock')) || defaultStock();
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
        await this.ctx.storage.put('stock', next);
        result = { ok: true, message: updated.join(', '), stock: next };
      });

      this.broadcastStock(result.stock);

      return json(200, {
        ok: true,
        message: items
          ? 'Restocked: ' + result.message
          : 'Full restock complete: ' + result.message,
        stock: result.stock
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json(400, { ok: false, error: 'Invalid JSON payload.' });
    }

    const validated = validatePayload(payload);
    if (validated.error) return json(400, { ok: false, error: validated.error });

    // Atomic reserve: the DO processes this block without interleaving other
    // events, so two concurrent orders for the same piece cannot both succeed.
    let result = null;
    await this.ctx.blockConcurrencyWhile(async () => {
      const current = (await this.ctx.storage.get('stock')) || defaultStock();
      const res = applyReservation(current, validated);
      if (!res.ok) {
        result = res;
        return;
      }
      await this.ctx.storage.put('stock', res.stock);
      result = res;
    });

    if (!result || !result.ok) {
      const details = (result && result.unavailable) || [];
      const message = details.length
        ? 'Some pieces are no longer available: ' +
          details.map(u => `${u.name} — ${u.size}`).join(', ') + '. Please review your cart.'
        : 'The requested pieces are no longer available.';
      return json(409, { ok: false, code: 'OUT_OF_STOCK', error: message, unavailable: details });
    }

    // Tell every open tab the moment a piece becomes unavailable.
    this.broadcastStock(result.stock);

    const paymentLabel = PAYMENT_LABELS[validated.payment.method];
    const notified = await notifyTelegram(result.order, paymentLabel, this.env);

    // Persist the order so it survives even if Telegram is down.
    const orders = (await this.ctx.storage.get('orders')) || [];
    orders.push(Object.assign({}, result.order, { notified }));
    await this.ctx.storage.put('orders', orders.slice(-200));

    return json(200, {
      ok: true,
      orderId: result.order.orderId,
      notified,
      subtotal: result.order.subtotal,
      delivery: result.order.delivery,
      total: result.order.total,
      error: notified ? undefined : 'Your order was recorded, but the notification service is unavailable.'
    });
  }

  // WebSocket Hibernation handlers — the DO sleeps between stock changes.
  async webSocketMessage(ws, message) {
    let data = null;
    try { data = JSON.parse(message); } catch { return; }
    if (data && data.type === 'refresh') {
      try {
        ws.send(JSON.stringify({ type: 'stock', stock: await this.stockSnapshot(), at: Date.now() }));
      } catch { /* socket closed */ }
    }
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch { /* already closing */ }
  }

  async webSocketError(ws) {
    try { ws.close(1011, 'WebSocket error'); } catch { /* already closing */ }
  }
}

// ---------- ENTRY ----------
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const { pathname } = new URL(request.url);

    // CSRF guard: a browser request from an unlisted origin is rejected.
    if (origin) {
      const allow = isAllowedOrigin(origin, env);
      if (!allow) return json(403, { ok: false, error: 'Forbidden origin.' });
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: Object.assign({}, CORS_BASE, { 'Access-Control-Allow-Origin': origin })
        });
      }
    } else if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_BASE });
    }

    // Real-time stock channel — forward the WebSocket upgrade to the DO, which
    // pushes an instant snapshot whenever a piece sells or is restocked.
    if (pathname === '/api/stock/ws') {
      const id = env.AMERO_STORE.idFromName('amero');
      return env.AMERO_STORE.get(id).fetch(request);
    }

    if (request.method === 'POST') {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json(400, { ok: false, error: 'Invalid JSON payload.' });
      }

      const id = env.AMERO_STORE.idFromName('amero');
      const stub = env.AMERO_STORE.get(id);
      try {
const inner = await stub.fetch(new Request('https://amero.local/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers.has('X-Admin-Key') ? { 'X-Admin-Key': request.headers.get('X-Admin-Key') } : {})
        },
        body: JSON.stringify(payload)
      }));
        const headers = Object.assign({}, CORS_BASE);
        if (origin) headers['Access-Control-Allow-Origin'] = origin;
        return new Response(inner.body, { status: inner.status, headers });
      } catch (err) {
        console.error('[amero-api] order failed:', err.message);
        return json(500, { ok: false, error: 'Internal error — please try again or order via WhatsApp.' });
      }
    }

    if (request.method === 'GET' && pathname === '/api/stock') {
      const id = env.AMERO_STORE.idFromName('amero');
      const stub = env.AMERO_STORE.get(id);
      try {
        const inner = await stub.fetch(new Request('https://amero.local/api/stock', { method: 'GET' }));
        const headers = Object.assign({}, CORS_BASE, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        if (origin) headers['Access-Control-Allow-Origin'] = origin;
        return new Response(inner.body, { status: inner.status, headers });
      } catch (err) {
        console.error('[amero-api] stock fetch failed:', err.message);
        return json(500, { ok: false, error: 'Could not load stock.' });
      }
    }

    return json(200, { ok: true, service: 'amero-order-api' });
  }
};