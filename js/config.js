/* AMERO — Deployment configuration.
 *
 * ORDER_API_URL points checkout at the backend that validates and records
 * orders (and talks to Telegram on the server side). Your token never lives
 * on the client.
 *
 *   - Local development: leave it empty ("") — the site will use the
 *     same-origin /api/order served by `node server/server.js`.
 *   - Production (GitHub Pages + Cloudflare Worker): set it to the deployed
 *     Worker URL, e.g.
 *         const ORDER_API_URL = 'https://amero-api.your-subdomain.workers.dev';
 *
 * Update this file, commit, and push to redeploy the site.
 */
const ORDER_API_URL = 'https://amero-api.habiburrashidrohan7508.workers.dev';