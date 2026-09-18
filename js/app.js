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
  else if (/^\+8801[3-9]\d{8}$/.test(p)) p = p.slice(1);
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

function findProduct(id) {
  return products.find(p => p.id === id);
}

// ---------- CART STATE (localStorage) ----------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('amero_cart')) || [];
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
  const el = document.getElementById('navCartCount');
  if (!el) return;
  const count = getCartItemCount();
  el.textContent = count;
  el.classList.toggle('visible', count > 0);
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
  return `
    <a href="product.html?id=${p.id}" class="product-card reveal" data-id="${p.id}">
      <div class="product-img">
        <img ${imgAttr(p.img, p.name, sizesAttr || '(max-width: 640px) 45vw, 25vw')}>
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
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('open') ? 'true' : 'false');
    });
    navLinks.querySelectorAll('.nav-link, .nav-cart').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
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
});