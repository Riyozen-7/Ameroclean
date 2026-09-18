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
     # optional extra allowed frontend origins:
     wrangler secret put ALLOWED_ORIGINS
   Then paste the printed workers.dev URL into js/config.js (ORDER_API_URL).
   ============================================ */

// ---------- SERVER-SIDE CATALOG (mirror of server/catalog.js) ----------
export const DELIVERY_FEES = { chittagong: 70, outside: 120 };

export const CATALOG = [
  { id: 1, name: 'Premium Old Money Seersucker Striped Shirt', price: 750, sizes: [{ size: 'L/XXL', stock: 1 }] },
  { id: 2, name: 'Premium Puff-Printed T-Shirt', price: 450, sizes: [{ size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 }] },
  { id: 3, name: 'Premium Puff-Printed T-Shirt — Design II', price: 450, sizes: [{ size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 }] },
  { id: 4, name: 'Premium Puff-Printed T-Shirt — Spider-Man', price: 450, sizes: [{ size: 'M', stock: 1 }, { size: 'L', stock: 1 }, { size: 'XL', stock: 1 }] },
  { id: 5, name: 'Premium Old Money Knitted Shirt', price: 800, sizes: [{ size: 'XL', stock: 1 }] },
  { id: 6, name: 'Premium Old Money Waffle-Knit Shirt', price: 800, sizes: [{ size: 'L', stock: 1 }] }
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
function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname;
    if (host === 'localhost' || host.endsWith('.github.io')) return true;
    const custom = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    return custom.includes(origin);
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

  async fetch(request) {
    if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' });

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
}

// ---------- ENTRY ----------
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');

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
          headers: { 'Content-Type': 'application/json' },
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

    return json(200, { ok: true, service: 'amero-order-api' });
  }
};