/* Smoke-test the Worker's pure order logic in Node before deploying. */
import { normalizePhone, validatePayload, applyReservation, defaultStock, buildOrderMessage, PAYMENT_LABELS, isAllowedOrigin, AmeroStore } from './worker.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log('PASS  ' + label);
  else { failures++; console.log('FAIL  ' + label); }
}

check('normalizePhone +880 with dash', normalizePhone('+880 1880-471287') === '01880471287');
check('normalizePhone plain 01', normalizePhone('01880471287') === '01880471287');
check('normalizePhone invalid', normalizePhone('12345') === null);

const validPayload = () => ({
  customer: { name: 'Test Buyer', phone: '+8801880132123', address: 'Road 4, Chittagong', area: 'chittagong', notes: '<b>after 5pm</b>' },
  payment: { method: 'bkash', txnId: 'TRX123XYZ' },
  items: [{ id: 2, size: 'M', qty: 1 }, { id: 3, size: 'L', qty: 1 }]
});

const v = validatePayload(validPayload());
check('validatePayload ok (no error)', !v.error && v.lines.length === 2);
check('validatePayload normalizes phone', v.customer.phone === '01880132123');
check('validatePayload rejects bad size', !!validatePayload({ customer: validPayload().customer, payment: { method: 'cod' }, items: [{ id: 2, size: 'XXL', qty: 1 }] }).error);
check('validatePayload rejects missing txn', !!validatePayload({ customer: validPayload().customer, payment: { method: 'nagad' }, items: [{ id: 3, size: 'M', qty: 1 }] }).error);
check('validatePayload rejects empty cart', !!validatePayload({ customer: validPayload().customer, payment: { method: 'cod' }, items: [] }).error);

const stock = defaultStock();
check('defaultStock mirrors catalog (21 size keys)', Object.keys(stock).length === 21 && stock['1:L/XXL'] === 1 && stock['6:L'] === 1 && stock['12:XL'] === 1 && stock['13:L'] === 1);
const r1 = applyReservation(stock, v);
check('applyReservation reserves both lines', r1.ok && r1.stock['2:M'] === 0 && r1.stock['3:L'] === 0);
check('applyReservation totals', r1.ok && r1.order.subtotal === 900 && r1.order.delivery === 70 && r1.order.total === 970);

const r2 = applyReservation(defaultStock(), validatePayload({ customer: validPayload().customer, payment: { method: 'cod' }, items: [{ id: 2, size: 'M', qty: 1 }] }));
const r3 = applyReservation(r2.stock, validatePayload({ customer: validPayload().customer, payment: { method: 'cod' }, items: [{ id: 2, size: 'M', qty: 1 }] }));
check('applyReservation rejects oversell', r2.ok && !r3.ok && r3.unavailable.length === 1 && r3.unavailable[0].id === 2);

const msg = buildOrderMessage(r1.order, PAYMENT_LABELS.bkash);
check('message is plain text (no HTML tags injected)', msg.includes('<b>after 5pm</b>'));
check('message contains order id', msg.includes('AMR-'));
check('message contains payment label', msg.includes('bKash (Txn ID: TRX123XYZ)'));

// Origin allowlist (CORS guard)
check('origin: localhost allowed', isAllowedOrigin('http://localhost:3000', {}) === true);
check('origin: 127.0.0.1 allowed', isAllowedOrigin('http://127.0.0.1:8080', {}) === true);
check('origin: github.io allowed', isAllowedOrigin('https://someone.github.io', {}) === true);
check('origin: pages.dev allowed', isAllowedOrigin('https://amero.pages.dev', {}) === true);
check('origin: custom domain allowed when listed', isAllowedOrigin('https://amero.com', { ALLOWED_ORIGINS: 'https://amero.com, https://www.amero.com' }) === true);
check('origin: custom domain with trailing slash matches', isAllowedOrigin('https://amero.com/', { ALLOWED_ORIGINS: 'https://amero.com' }) === true);
check('origin: unknown domain rejected', isAllowedOrigin('https://evil.example', {}) === false);
check('origin: non-http scheme rejected', isAllowedOrigin('ftp://amero.com', {}) === false);
check('origin: empty rejected', isAllowedOrigin('', {}) === false);

// Rate limiter test
const mockStore = new AmeroStore({}, {});
let rlPass = true;
for (let i = 0; i < 5; i++) {
  if (!mockStore.checkRateLimit('192.168.1.1', 5, 60000)) rlPass = false;
}
const rlBlocked = !mockStore.checkRateLimit('192.168.1.1', 5, 60000);
check('rate limiter allows first 5 requests', rlPass);
check('rate limiter throttles 6th request', rlBlocked);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
process.exit(failures ? 1 : 0);