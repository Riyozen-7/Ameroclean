/* ============================================
   AMERO — Shared layout (navbar + footer)
   Injected once here instead of duplicating the
   identical markup across every page, so a nav or
   footer change edits a single source of truth.
   ============================================ */
(function () {
  const NAVBAR_HTML = `
    <nav class="navbar" id="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="nav-logo">Amero.</a>
        <div class="nav-links" id="navLinks">
      <div class="nav-menu-head">
        <span class="nav-menu-title">Menu</span>
        <span class="nav-menu-sub">Amero Essentials</span>
      </div>
      <a href="index.html" class="nav-link">Home</a>
      <a href="shop.html" class="nav-link">Shop</a>
      <a href="contact.html" class="nav-link">About</a>
      <a href="cart.html" class="nav-cart" aria-label="Shopping cart">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <span>Cart</span>
        <span class="cart-count" id="navCartCount">0</span>
      </a>
    </div>
    <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="navLinks">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="nav-backdrop" id="navBackdrop"></div>
</nav>
  `;

  const FOOTER_HTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-inner">
          <div>
            <div class="footer-brand">Amero.</div>
            <div class="footer-tagline">Simple, clean, made to last.</div>
          </div>
          <div class="footer-links">
            <a href="shop.html">Shop</a>
            <a href="policies.html#size-guide">Size Guide</a>
            <a href="policies.html#returns">Shipping &amp; Returns</a>
            <a href="contact.html">Contact</a>
          </div>
        </div>
        <div class="footer-copy">&copy; 2026 Amero. All rights reserved.</div>
      </div>
    </footer>
  `;

  function inject() {
    const navSlot = document.getElementById('site-nav');
    if (navSlot) navSlot.innerHTML = NAVBAR_HTML;
    const footerSlot = document.getElementById('site-footer');
    if (footerSlot) footerSlot.innerHTML = FOOTER_HTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();