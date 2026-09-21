/* AMERO — Server-side product catalog
 *
 * Single source of truth for order validation. Prices, sizes, and stock levels
 * are enforced here; never trust what the browser sends. Keep in sync with the
 * display copy in js/app.js (client-side copy is only for rendering).
 */

const DELIVERY_FEES = {
  chittagong: 70,
  outside: 120
};

const CATALOG = [
  {
    id: 1,
    name: 'Premium Old Money Seersucker Striped Shirt',
    price: 750,
    sizes: [{ size: 'L/XXL', stock: 1 }]
  },
  {
    id: 2,
    name: 'Premium Puff-Printed T-Shirt',
    price: 450,
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ]
  },
  {
    id: 3,
    name: 'Premium Puff-Printed T-Shirt — Design II',
    price: 450,
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ]
  },
  {
    id: 4,
    name: 'Premium Puff-Printed T-Shirt — Spider-Man',
    price: 450,
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ]
  },
  {
    id: 5,
    name: 'Premium Old Money Knitted Shirt',
    price: 800,
    sizes: [{ size: 'XL', stock: 1 }]
  },
  {
    id: 6,
    name: 'Premium Old Money Waffle-Knit Shirt',
    price: 800,
    sizes: [{ size: 'L', stock: 1 }]
  },
  {
    id: 7,
    name: 'Brown Ribbed Half-Sleeve T-Shirt',
    price: 600,
    sizes: [{ size: 'L', stock: 1 }]
  },
  {
    id: 8,
    name: 'White Printed Drop-Shoulder T-Shirt',
    price: 450,
    sizes: [{ size: 'L', stock: 1 }]
  },
  {
    id: 9,
    name: 'Short-Sleeve T-Shirt',
    price: 450,
    sizes: [{ size: 'L', stock: 1 }]
  },
  {
    id: 10,
    name: 'Cream Ribbed Knit Polo Shirt',
    price: 499,
    sizes: [{ size: 'M', stock: 1 }]
  },
  {
    id: 11,
    name: 'Amsterdam Boxy Graphic Crew Neck T-Shirt',
    price: 450,
    sizes: [{ size: 'XL', stock: 1 }]
  },
  {
    id: 12,
    name: 'Premium Puff-Printed T-Shirt',
    price: 450,
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ]
  },
  {
    id: 13,
    name: 'Retro-Style Short-Sleeve Knitted Polo Shirt',
    price: 800,
    sizes: [{ size: 'L', stock: 1 }]
  }
];

module.exports = { CATALOG, DELIVERY_FEES };