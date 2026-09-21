/* ============================================
   AMERO — Clean Multipage E-Commerce
   Shared: Product Data, Cart, Utilities
   ============================================ */

// ---------- PRODUCT DATA ----------
const products = [
  {
    id: 1,
    name: 'Premium Old Money Seersucker Striped Shirt',
    desc: 'Chest 46 · Length 28 · Old-money striped seersucker weave. Quality 9.5/10.',
    price: 750,
    img: 'images/product-1/front.jpg',
    images: [
      'images/product-1/front.jpg',
      'images/product-1/back.jpg',
      'images/product-1/side.jpg'
    ],
    sizes: [
      { size: 'L/XXL', stock: 1 }
    ],
    category: 'shirts',
    fabric: 'Seersucker cotton blend',
    quality: '9.5/10'
  },
  {
    id: 2,
    name: 'Premium Puff-Printed T-Shirt',
    desc: '280 GSM · 100% premium feel puff-print tee.',
    price: 450,
    img: 'images/product-2/front.jpg',
    images: [
      'images/product-2/front.jpg',
      'images/product-2/back.jpg',
      'images/product-2/side.jpg'
    ],
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ],
    category: 't-shirts',
    fabric: '280 GSM cotton',
    quality: 'Premium'
  },
  {
    id: 3,
    name: 'Premium Puff-Printed T-Shirt — Design II',
    desc: '280 GSM · 100% premium feel puff-print tee.',
    price: 450,
    img: 'images/product-3/front.jpg',
    images: [
      'images/product-3/front.jpg',
      'images/product-3/back.jpg',
      'images/product-3/side.jpg'
    ],
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ],
    category: 't-shirts',
    fabric: '280 GSM cotton',
    quality: 'Premium'
  },
  {
    id: 4,
    name: 'Premium Puff-Printed T-Shirt — Spider-Man',
    desc: '280 GSM · 100% premium feel puff-print tee, Spider-Man design.',
    price: 450,
    img: 'images/product-4/front.jpg',
    images: [
      'images/product-4/front.jpg',
      'images/product-4/back.jpg',
      'images/product-4/side.jpg'
    ],
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ],
    category: 't-shirts',
    fabric: '280 GSM cotton',
    quality: 'Premium'
  },
  {
    id: 5,
    name: 'Premium Old Money Knitted Shirt',
    desc: 'Chest-44 · Length-27 · Quality top notch.',
    price: 800,
    img: 'images/product-5/front.jpg',
    images: [
      'images/product-5/front.jpg',
      'images/product-5/side.jpg',
      'images/product-5/close.jpg'
    ],
    sizes: [
      { size: 'XL', stock: 1 }
    ],
    category: 'shirts',
    fabric: 'Premium knit cotton',
    quality: 'Top notch'
  },
  {
    id: 6,
    name: 'Premium Old Money Waffle-Knit Shirt',
    desc: 'Chest-42 · Length-26 · Quality top notch.',
    price: 800,
    img: 'images/product-6/front.jpg',
    images: [
      'images/product-6/front.jpg',
      'images/product-6/close.jpg',
      'images/product-6/side.jpg'
    ],
    sizes: [
      { size: 'L', stock: 1 }
    ],
    category: 'shirts',
    fabric: 'Waffle-knit cotton',
    quality: 'Top notch'
  },
  {
    id: 7,
    name: 'Brown Ribbed Half-Sleeve T-Shirt',
    desc: 'Chest 20 · Length 27 · Ribbed knit half-sleeve tee by Mike Designs.',
    price: 600,
    img: 'images/product-7/front.jpg',
    images: [
      'images/product-7/front.jpg',
      'images/product-7/IMG_6132(1).jpg',
      'images/product-7/back.webp'
    ],
    sizes: [
      { size: 'L', stock: 1 }
    ],
    category: 't-shirts',
    fabric: 'Ribbed knit cotton',
    quality: '700'
  },
  {
    id: 8,
    name: 'White Printed Drop-Shoulder T-Shirt',
    desc: 'Chest 21 · Length 28 · White printed drop-shoulder tee.',
    price: 450,
    img: 'images/product-8/front.jpg',
    images: [
      'images/product-8/front.jpg',
      'images/product-8/IMG_6034.jpg'
    ],
    sizes: [
      { size: 'L', stock: 1 }
    ],
    category: 't-shirts',
    fabric: 'Premium cotton',
    quality: '700'
  },
  {
    id: 9,
    name: 'Short-Sleeve T-Shirt',
    desc: 'Chest 21 · Length 28.5 · Classic short-sleeve t-shirt.',
    price: 450,
    img: 'images/product-9/front.jpg',
    images: [
      'images/product-9/front.jpg',
      'images/product-9/IMG_6041.jpg'
    ],
    sizes: [
      { size: 'L', stock: 1 }
    ],
    category: 't-shirts',
    fabric: 'Premium cotton',
    quality: '700'
  },
  {
    id: 10,
    name: 'Cream Ribbed Knit Polo Shirt',
    desc: 'Chest 18 · Length 26 · Cream ribbed-knit polo shirt.',
    price: 499,
    img: 'images/product-10/front.jpg',
    images: [
      'images/product-10/front.jpg',
      'images/product-10/IMG_6145.jpg',
      'images/product-10/IMG_6143.jpg'
    ],
    sizes: [
      { size: 'M', stock: 1 }
    ],
    category: 'shirts',
    fabric: 'Ribbed knit cotton',
    quality: '700'
  },
  {
    id: 11,
    name: 'Amsterdam Boxy Graphic Crew Neck T-Shirt',
    desc: 'Chest 24 · Length 29 · Wine-colored boxy graphic crew neck from Connor Singapore.',
    price: 450,
    img: 'images/product-11/front.jpg',
    images: [
      'images/product-11/front.jpg',
      'images/product-11/IMG_6046.jpg'
    ],
    sizes: [
      { size: 'XL', stock: 1 }
    ],
    category: 't-shirts',
    fabric: 'Premium cotton',
    quality: '700'
  },
  {
    id: 12,
    name: 'Premium Puff-Printed T-Shirt',
    desc: '280 GSM · 100% premium feel puff-print tee.',
    price: 450,
    img: 'images/product-12/front.webp',
    images: [
      'images/product-12/front.webp',
      'images/product-12/IMG_6013.jpg',
      'images/product-12/IMG_6016.jpg',
      'images/product-12/IMG_6018.jpg'
    ],
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ],
    category: 't-shirts',
    fabric: '280 GSM cotton',
    quality: 'Premium'
  },
  {
    id: 13,
    name: 'Retro-Style Short-Sleeve Knitted Polo Shirt',
    desc: 'Chest 21 · Length 27.5 · Pure class retro-style knitted polo shirt.',
    price: 800,
    img: 'images/product-13/front.webp',
    images: [
      'images/product-13/front.webp',
      'images/product-13/IMG_6059.jpg',
      'images/product-13/IMG_6066.jpg'
    ],
    sizes: [
      { size: 'L', stock: 1 }
    ],
    category: 'shirts',
    fabric: 'Premium knit cotton',
    quality: '700'
  }
];

// ---------- CONSTANTS ----------
const CURRENCY = '৳';

const DELIVERY_FEES = {
  '': 0,
  chittagong: 70,
  outside: 120
};

const PAYMENT_NUMBER = '01880471287';
const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  bkash: 'bKash',
  nagad: 'Nagad'
};

const WHATSAPP_NUMBER = '8801880471287';

// ---------- HELPERS ----------
// Escapes text before it is placed into innerHTML. Always use for user input.
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Responsive WebP variants generated next to the original JPEG.
function imgSrcset(src) {
  const base = String(src).replace(/\.(jpe?g|png|webp)$/i, '');
  return base + '-640.webp 640w, ' + base + '.webp 1200w';
}

function imgAttr(src, alt, sizes) {
  return 'src="' + escapeHtml(src) + '" srcset="' + imgSrcset(src) + '"' +
    (sizes ? ' sizes="' + sizes + '"' : '') +
    ' alt="' + escapeHtml(alt) + '" decoding="async"';
}

function normalizePhone(raw) {
  let p = String(raw || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+880')) p = '0' + p.slice(4);
  else if (p.startsWith('880')) p = '0' + p.slice(3);
  else if (p.startsWith('+')) p = p.replace('+', '');
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

function findProduct(id) {
  return products.find(p => p.id === id);
}

// ---------- CART STATE (localStorage) ----------
function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem('amero_cart')) || [];
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      const p = findProduct(item.id);
      if (!p) return item;
      return Object.assign({}, item, {
        name: p.name,
        price: p.price,
        img: p.img
      });
    });
  } catch {
    return [];
  }
}

function saveCart(next) {
  localStorage.setItem('amero_cart', JSON.stringify(next));
}

let cart = getCart();

// Keeps a module-level copy of the cart in sync when another tab edits it,
// and notifies every open page so they can re-render (no desync).
window.addEventListener('storage', (e) => {
  if (e.key !== 'amero_cart' && e.key !== null) return;
  cart = getCart();
  updateNavCartCount();
  window.dispatchEvent(new Event('amero:cartchange'));
});

function notifyCartChanged() {
  window.dispatchEvent(new Event('amero:cartchange'));
}

function onCartChange(callback) {
  window.addEventListener('amero:cartchange', callback);
}

// ---------- STOCK CALCULATION ----------
function stockRemaining(productId, size) {
  const product = findProduct(productId);
  if (!product) return 0;
  const sizeInfo = product.sizes.find(s => s.size === size);
  if (!sizeInfo) return 0;
  const inCart = cart
    .filter(item => item.id === productId && item.size === size)
    .reduce((sum, item) => sum + item.qty, 0);
  return sizeInfo.stock - inCart;
}

// Raw (server) stock decides the "sold out" label; the viewer's own cart is
// intentionally ignored there so a full cart doesn't hide the real status.
function isProductSoldOut(product) {
  return product.sizes.length > 0 && product.sizes.every(s => s.stock <= 0);
}

// ---------- LIVE STOCK (source of truth: the order API) ----------
// The bundled product list ships with a "starting" stock so the site renders
// instantly, but it is never authoritative: once an order is placed the only
// accurate count lives on the server (Durable Object / stock.json). We fetch
// that snapshot on load and overwrite the local copy so no visitor is shown a
// piece that has already sold. If the API is unreachable we degrade gracefully
// to the bundled values (checkout still re-validates server-side).
function orderApiBase() {
  return (typeof ORDER_API_URL !== 'undefined' && ORDER_API_URL) ? ORDER_API_URL : '';
}

function applyLiveStock(stockMap) {
  if (!stockMap || typeof stockMap !== 'object') return false;
  let applied = false;
  for (const product of products) {
    for (const sizeInfo of product.sizes) {
      const key = product.id + ':' + sizeInfo.size;
      if (Object.prototype.hasOwnProperty.call(stockMap, key)) {
        sizeInfo.stock = Math.max(0, Number(stockMap[key]) || 0);
        applied = true;
      }
    }
  }
  if (applied) window.dispatchEvent(new Event('amero:stockchange'));
  return applied;
}

async function refreshLiveStock() {
  try {
    const res = await fetch(orderApiBase() + '/api/stock', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || !data.ok) return false;
    return applyLiveStock(data.stock);
  } catch {
    return false;
  }
}

function onStockChange(callback) {
  window.addEventListener('amero:stockchange', callback);
}

// ---------- REAL-TIME STOCK (WebSocket push, poll fallback) ----------
// The order API pushes a fresh snapshot the instant a piece sells or is
// restocked, so an open tab flips to "Sold out" immediately. If the socket
// can't be established we fall back to polling — the shop works either way.
const STOCK_REFRESH_MS = 60000;
const WS_OPEN = 1;
let stockRefreshTimer = null;
let stockSocket = null;
let stockReconnectTimer = null;
let stockReconnectDelay = 1000;

function stockSocketUrl() {
  const base = orderApiBase();
  let wsOrigin;
  if (base) {
    wsOrigin = base.replace(/^http/i, 'ws');
  } else {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    wsOrigin = proto + location.host;
  }
  return wsOrigin.replace(/\/+$/, '') + '/api/stock/ws';
}

function stockSocketLive() {
  return !!stockSocket && stockSocket.readyState === WS_OPEN;
}

let stockReconnectAttempts = 0;
const MAX_STOCK_RECONNECT_ATTEMPTS = 5;

function scheduleStockReconnect() {
  if (stockReconnectAttempts >= MAX_STOCK_RECONNECT_ATTEMPTS) return;
  clearTimeout(stockReconnectTimer);
  stockReconnectTimer = setTimeout(connectStockSocket, stockReconnectDelay);
  stockReconnectDelay = Math.min(stockReconnectDelay * 2, 30000);
}

function connectStockSocket() {
  if (typeof WebSocket === 'undefined') return;
  // If running locally without an explicit ORDER_API_URL, local node server does not serve WS
  const base = orderApiBase();
  if (!base && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    return;
  }
  if (stockReconnectAttempts >= MAX_STOCK_RECONNECT_ATTEMPTS) return;
  if (stockSocket && stockSocket.readyState <= WS_OPEN) return;
  let ws;
  try {
    ws = new WebSocket(stockSocketUrl());
  } catch {
    stockReconnectAttempts++;
    scheduleStockReconnect();
    return;
  }
  stockSocket = ws;

  ws.addEventListener('open', () => {
    stockReconnectAttempts = 0;
    stockReconnectDelay = 1000;
    refreshLiveStock(); // reconcile anything missed while disconnected
  });
  ws.addEventListener('message', (event) => {
    let msg = null;
    try { msg = JSON.parse(event.data); } catch { return; }
    if (msg && msg.type === 'stock' && msg.stock) applyLiveStock(msg.stock);
  });
  ws.addEventListener('close', () => {
    if (stockSocket === ws) stockSocket = null;
    stockReconnectAttempts++;
    scheduleStockReconnect();
  });
  ws.addEventListener('error', () => {
    try { ws.close(); } catch { /* ignore */ }
  });
}

function startStockAutoRefresh() {
  window.addEventListener('focus', () => {
    if (!stockSocketLive()) refreshLiveStock();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !stockSocketLive()) refreshLiveStock();
  });
  clearInterval(stockRefreshTimer);
  stockRefreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && !stockSocketLive()) refreshLiveStock();
  }, STOCK_REFRESH_MS);
  connectStockSocket();
}

// ---------- CART OPERATIONS ----------
function addToCart(productId, size, qty) {
  qty = qty || 1;
  const product = findProduct(productId);
  if (!product) return false;
  if (stockRemaining(productId, size) < qty) return false;

  const existing = cart.find(item => item.id === productId && item.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      size: size,
      name: product.name,
      price: product.price,
      img: product.img,
      qty: qty
    });
  }

  saveCart(cart);
  updateNavCartCount();
  notifyCartChanged();
  return true;
}

function removeFromCart(productId, size) {
  cart = cart.filter(item => !(item.id === productId && item.size === size));
  saveCart(cart);
  updateNavCartCount();
  notifyCartChanged();
}

function changeQty(productId, size, delta) {
  const item = cart.find(i => i.id === productId && i.size === size);
  if (!item) return;
  if (delta > 0 && stockRemaining(productId, size) <= 0) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId, size);
    return;
  }
  saveCart(cart);
  updateNavCartCount();
  notifyCartChanged();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function clearCart() {
  cart = [];
  saveCart(cart);
  updateNavCartCount();
  notifyCartChanged();
}

// ---------- NAV CART COUNT ----------
function updateNavCartCount() {
  const els = [
    document.getElementById('navCartCount'),
    document.getElementById('menuCartCount')
  ];
  const count = getCartItemCount();
  els.forEach(el => {
    if (!el) return;
    el.textContent = count;
    el.classList.toggle('visible', count > 0);
  });
}

// ---------- TOAST NOTIFICATION ----------
let toastTimeout;
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2400);
}

// ---------- PRODUCT CARD MARKUP (shared across pages) ----------
function productCardMarkup(p, sizesAttr) {
  const soldOut = isProductSoldOut(p);
  return `
    <a href="product.html?id=${p.id}" class="product-card reveal${soldOut ? ' sold-out' : ''}" data-id="${p.id}">
      <div class="product-img">
        <img ${imgAttr(p.img, p.name, sizesAttr || '(max-width: 640px) 45vw, 25vw')}>
        ${soldOut ? '<span class="sold-badge">Sold Out</span>' : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <span class="product-price">${CURRENCY}${p.price}</span>
      </div>
    </a>
  `;
}

// ---------- GALLERY MODAL ----------
let galleryProductId = null;
let galleryIndex = 0;
let lastFocusedElement = null;

function galleryFocusables() {
  const modal = document.getElementById('galleryModal');
  if (!modal) return [];
  return Array.from(modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.disabled && el.offsetParent !== null);
}

function createGalleryModal() {
  if (document.getElementById('galleryModal')) return;
  const modal = document.createElement('div');
  modal.id = 'galleryModal';
  modal.className = 'gallery-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Product image gallery');
  modal.innerHTML = `
    <div class="gallery-modal-inner">
      <button class="gallery-modal-close" aria-label="Close gallery">&times;</button>
      <button class="gallery-modal-nav gallery-modal-prev" aria-label="Previous image">&#10094;</button>
      <img class="gallery-modal-main" src="" alt="">
      <button class="gallery-modal-nav gallery-modal-next" aria-label="Next image">&#10095;</button>
      <div class="gallery-modal-thumbs"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.gallery-modal-close').addEventListener('click', closeGallery);
  modal.querySelector('.gallery-modal-prev').addEventListener('click', prevGalleryImage);
  modal.querySelector('.gallery-modal-next').addEventListener('click', nextGalleryImage);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeGallery();
  });
  modal.querySelector('.gallery-modal-thumbs').addEventListener('click', (e) => {
    const thumb = e.target.closest('.gallery-modal-thumb');
    if (!thumb) return;
    selectGalleryImage(parseInt(thumb.dataset.index, 10));
  });
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight') nextGalleryImage();
    if (e.key === 'ArrowLeft') prevGalleryImage();
    if (e.key === 'Tab') {
      const focusables = galleryFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

function openGallery(productId) {
  const product = findProduct(productId);
  if (!product || !product.images || !product.images.length) return;
  galleryProductId = productId;
  galleryIndex = 0;
  lastFocusedElement = document.activeElement;
  updateGalleryView();
  const modal = document.getElementById('galleryModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.gallery-modal-close').focus();
}

function closeGallery() {
  const modal = document.getElementById('galleryModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

function updateGalleryView() {
  const product = findProduct(galleryProductId);
  if (!product) return;
  const modal = document.getElementById('galleryModal');
  const main = modal.querySelector('.gallery-modal-main');
  main.src = product.images[galleryIndex];
  main.srcset = imgSrcset(product.images[galleryIndex]);
  main.alt = product.name;
  const thumbsContainer = modal.querySelector('.gallery-modal-thumbs');
  thumbsContainer.innerHTML = product.images.map((src, i) => `
    <button class="gallery-modal-thumb${i === galleryIndex ? ' active' : ''}"
            data-index="${i}"
            aria-label="View image ${i + 1} of ${product.images.length}"
            aria-pressed="${i === galleryIndex}">
      <img ${imgAttr(src, product.name + ' thumbnail', '72px')}>
    </button>
  `).join('');
}

function selectGalleryImage(index) {
  galleryIndex = index;
  updateGalleryView();
}

function nextGalleryImage() {
  const product = findProduct(galleryProductId);
  if (!product) return;
  galleryIndex = (galleryIndex + 1) % product.images.length;
  updateGalleryView();
}

function prevGalleryImage() {
  const product = findProduct(galleryProductId);
  if (!product) return;
  galleryIndex = (galleryIndex - 1 + product.images.length) % product.images.length;
  updateGalleryView();
}

// ---------- WHATSAPP ORDER FALLBACK ----------
function buildOrderText(items, customer) {
  const lines = items.map((item, i) =>
    `${i + 1}. ${item.name} — Size ${item.size} × ${item.qty} = ${CURRENCY}${item.price * item.qty}`
  );
  const parts = [
    '🛍️ NEW AMERO ORDER',
    '',
    `👤 ${customer.name}`,
    `📞 ${customer.phone}`,
    `📍 ${customer.address}`,
    '🛒 Items:',
    ...lines,
    '',
    `💰 Total: ${CURRENCY}${customer.total}`
  ];
  if (customer.notes) parts.push(`📝 Notes: ${customer.notes}`);
  return parts.join('\n');
}

function whatsappOrderUrl(orderText) {
  const number = WHATSAPP_NUMBER.replace(/\D/g, '');
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(orderText);
}

// ---------- SCROLL REVEAL ----------
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal:not(.in-view)');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => observer.observe(el));
}

// ---------- NAVBAR ----------
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  if (menuToggle && navLinks) {
    const backdrop = document.getElementById('navBackdrop');

    function setMenu(open) {
      menuToggle.classList.toggle('active', open);
      navLinks.classList.toggle('open', open);
      if (backdrop) backdrop.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeMenu() { setMenu(false); }

    menuToggle.addEventListener('click', () => {
      setMenu(!navLinks.classList.contains('open'));
    });
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
    navLinks.querySelectorAll('.nav-link, .nav-cart').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Mark active nav link
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  createGalleryModal();
  initNavbar();
  updateNavCartCount();
  initScrollReveal();

  // Only pages that render product availability need the live snapshot
  // (contact/policies have no products, so they skip the network call).
  const needsLiveStock = document.getElementById('featuredGrid') ||
    document.getElementById('productsGrid') ||
    document.getElementById('productDetail') ||
    document.getElementById('cartItems');
  if (needsLiveStock) {
    refreshLiveStock();
    startStockAutoRefresh();
  }
});