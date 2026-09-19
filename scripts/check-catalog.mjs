/* ============================================
   AMERO — Catalog drift guard
   ============================================
   The storefront catalog (js/app.js) and the two validation catalogs
   (server/catalog.js and worker/worker.mjs) are hand-maintained. This script
   fails if they disagree on ids, names, prices, sizes, or default stock, so a
   restock or new product can never ship half-applied.

   Run:
     node scripts/check-catalog.mjs
   ============================================ */

import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// --- js/app.js is a classic script; load it with minimal browser stubs and
// capture the `products` array it declares lexically.
const listeners = {};
globalThis.window = {
  addEventListener(type, cb) { (listeners[type] = listeners[type] || []).push(cb); },
  dispatchEvent() { return true; }
};
globalThis.document = {
  addEventListener() {},
  getElementById() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { style: {} }; }
};
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.Event = class { constructor(type) { this.type = type; } };

const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
vm.runInThisContext(appSrc + '\n;globalThis.__ameroProducts = products;', { filename: 'js/app.js' });
const appProducts = globalThis.__ameroProducts;

const { CATALOG: serverProducts } = require(path.join(ROOT, 'server', 'catalog.js'));
const worker = await import(pathToFileURL(path.join(ROOT, 'worker', 'worker.mjs')).href);
const workerProducts = worker.CATALOG;

function shape(list) {
  return list
    .map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      sizes: p.sizes.map(s => s.size).slice().sort()
    }))
    .sort((a, b) => a.id - b.id);
}

function stockMap(list) {
  const map = {};
  for (const p of list) for (const s of p.sizes) map[p.id + ':' + s.size] = s.stock;
  return map;
}

const failures = [];
function compare(label, a, b, aName, bName) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) failures.push(`${label}: ${aName} != ${bName}\n  ${aName}: ${sa}\n  ${bName}: ${sb}`);
}

compare('catalog shape', shape(appProducts), shape(serverProducts), 'js/app.js', 'server/catalog.js');
compare('catalog shape', shape(appProducts), shape(workerProducts), 'js/app.js', 'worker/worker.mjs');
compare('default stock', stockMap(appProducts), stockMap(serverProducts), 'js/app.js', 'server/catalog.js');
compare('default stock', stockMap(appProducts), stockMap(workerProducts), 'js/app.js', 'worker/worker.mjs');

if (failures.length) {
  console.error('CATALOG DRIFT DETECTED\n');
  for (const f of failures) console.error('- ' + f + '\n');
  process.exit(1);
}

console.log(`Catalog OK — ${appProducts.length} products consistent across app.js, server, and worker.`);
