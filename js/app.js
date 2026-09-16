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
    img: 'images/product-1/front.jpg.jpeg',
    images: [
      'images/product-1/front.jpg.jpeg',
      'images/product-1/back.jpg.jpeg',
      'images/product-1/side.jpg.jpeg'
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
    img: 'images/product-2/front.jpg.jpeg',
    images: [
      'images/product-2/front.jpg.jpeg',
      'images/product-2/back.jpg.jpeg',
      'images/product-2/side.jpg.jpeg'
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
    img: 'images/product-3/front.jpg.jpeg',
    images: [
      'images/product-3/front.jpg.jpeg',
      'images/product-3/back.jpg.jpeg',
      'images/product-3/side.jpg.jpeg'
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
    img: 'images/product-4/front.jpg.jpeg',
    images: [
      'images/product-4/front.jpg.jpeg',
      'images/product-4/back.jpg.jpeg',
      'images/product-4/side.jpg.jpeg'
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
    img: 'images/product-5/front.jpg.jpeg',
    images: [
      'images/product-5/front.jpg.jpeg',
      'images/product-5/side.jpg.jpeg',
      'images/product-5/close.jpg.jpeg'
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
    img: 'images/product-6/front.jpg.jpg',
    images: [
      'images/product-6/front.jpg.jpg',
      'images/product-6/close.jpg.jpg',
      'images/product-6/side.jpg.jpg'
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

const TELEGRAM_BOT_TOKEN = '8892072526:AAE-BrLlQT8Dq0OucJKFIFcNiGTmNhGLhm4';
const TELEGRAM_CHAT_ID = '8623285080';

// ---------- CART STATE (localStorage) ----------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('amero_cart')) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('amero_cart', JSON.stringify(cart));
}

let cart = getCart();

// ---------- STOCK CALCULATION ----------
function stockRemaining(productId, size) {
  const product = products.find(p => p.id === productId);
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
  const product = products.find(p => p.id === productId);
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
  return true;
}

function removeFromCart(productId, size) {
  cart = cart.filter(item => !(item.id === productId && item.size === size));
  saveCart(cart);
  updateNavCartCount();
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

// ---------- GALLERY MODAL ----------
let galleryProductId = null;
let galleryIndex = 0;

function createGalleryModal() {
  if (document.getElementById('galleryModal')) return;
  const modal = document.createElement('div');
  modal.id = 'galleryModal';
  modal.className = 'gallery-modal';
  modal.innerHTML = `
    <div class="gallery-modal-inner">
      <button class="gallery-modal-close" aria-label="Close">&times;</button>
      <button class="gallery-modal-nav gallery-modal-prev" aria-label="Previous">&#10094;</button>
      <img class="gallery-modal-main" src="" alt="">
      <button class="gallery-modal-nav gallery-modal-next" aria-label="Next">&#10095;</button>
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
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight') nextGalleryImage();
    if (e.key === 'ArrowLeft') prevGalleryImage();
  });
}

function openGallery(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.images || !product.images.length) return;
  galleryProductId = productId;
  galleryIndex = 0;
  updateGalleryView();
  document.getElementById('galleryModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  document.getElementById('galleryModal').classList.remove('open');
  document.body.style.overflow = '';
}

function updateGalleryView() {
  const product = products.find(p => p.id === galleryProductId);
  if (!product) return;
  const modal = document.getElementById('galleryModal');
  modal.querySelector('.gallery-modal-main').src = product.images[galleryIndex];
  modal.querySelector('.gallery-modal-main').alt = product.name;
  const thumbsContainer = modal.querySelector('.gallery-modal-thumbs');
  thumbsContainer.innerHTML = product.images.map((src, i) => `
    <button class="gallery-modal-thumb${i === galleryIndex ? ' active' : ''}" onclick="selectGalleryImage(${i})">
      <img src="${src}" alt="">
    </button>
  `).join('');
}

function selectGalleryImage(index) {
  galleryIndex = index;
  updateGalleryView();
}

function nextGalleryImage() {
  const product = products.find(p => p.id === galleryProductId);
  if (!product) return;
  galleryIndex = (galleryIndex + 1) % product.images.length;
  updateGalleryView();
}

function prevGalleryImage() {
  const product = products.find(p => p.id === galleryProductId);
  if (!product) return;
  galleryIndex = (galleryIndex - 1 + product.images.length) % product.images.length;
  updateGalleryView();
}

// ---------- TELEGRAM NOTIFICATION ----------
function sendTelegramNotification(message) {
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  }).catch(err => console.error('Telegram notification failed:', err));
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
