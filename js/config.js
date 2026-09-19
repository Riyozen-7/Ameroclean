/* AMERO - Deployment configuration.
 *
 * ORDER_API_URL points the storefront at the backend that validates orders
 * and serves live stock (and talks to Telegram server-side). Your token never
 * lives on the client.
 *
 * The production Worker URL lives in PROD_ORDER_API_URL. Leave it as-is; the
 * deploy script rewrites it automatically. When the site is opened from
 * localhost (e.g. `node server/server.js`), ORDER_API_URL resolves to "" so
 * every request uses the same-origin API instead of production.
 *
 * Update this file, commit, and push to redeploy the site.
 */
const PROD_ORDER_API_URL = 'https://amero-api.habiburrashidrohan7508.workers.dev';

const ORDER_API_URL = (function () {
  var host = (typeof location !== 'undefined' && location.hostname) || '';
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
  return isLocal ? '' : PROD_ORDER_API_URL;
})();
