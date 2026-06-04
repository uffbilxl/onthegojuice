'use strict';

/* ─── PRODUCT DATA ──────────────────────────────────────────────── */
// Mutable — populated from /api/products-public on page load.
// Static data (images, ingredients, size, tags) lives here; DB owns name + price.
let PRODUCTS = [];

// Static metadata keyed by product id — never changes without a code deploy
const PRODUCT_STATIC = {
  1:  { ingredients: 'Carrot, Whole Milk, Nutmeg, Vanilla',                        size: '330ml', type: 'milk',  tags: ['noSugar'],                image: 'images/products/carrot-milk-no-sugar.png' },
  2:  { ingredients: 'Carrot, Beetroot, Whole Milk, Nutmeg, Vanilla',              size: '330ml', type: 'milk',  tags: ['noSugar'],                image: 'images/products/carrot-beetroot-milk-no-sugar.png' },
  3:  { ingredients: 'Mango, Whole Milk',                                           size: '330ml', type: 'milk',  tags: [],                         image: 'images/products/mango-milk.png' },
  4:  { ingredients: 'Carrot, Beetroot, Lactose Free Whole Milk, Nutmeg, Vanilla, Sugar', size: '330ml', type: 'milk', tags: ['lactoseFree'],       image: 'images/products/carrot-beetroot-milk-lactose-free.png' },
  5:  { ingredients: 'Carrot, Beetroot, Whole Milk, Nutmeg, Vanilla, Sugar',       size: '330ml', type: 'milk',  tags: [],                         image: 'images/products/carrot-beetroot-milk.png' },
  6:  { ingredients: 'Mango, Ginger, Sugar, Water',                                size: '330ml', type: 'juice', tags: [],                         image: 'images/products/mango-ginger.png' },
  7:  { ingredients: 'Carrot, Lactose Free Whole Milk, Nutmeg, Vanilla, Sugar',    size: '330ml', type: 'milk',  tags: ['lactoseFree'],            image: 'images/products/carrot-milk-lactose-free.png' },
  8:  { ingredients: 'Sorrel, Cinnamon, Pimento, Sugar, Water',                    size: '330ml', type: 'juice', tags: [],                         image: 'images/products/sorrel.png' },
  9:  { ingredients: 'Apple, Lemon, Ginger',                                        size: '60ml',  type: 'shot',  tags: [],                         image: 'images/products/go-shot-apple-ginger.png' },
  10: { ingredients: 'Carrot, Lemon, Sugar, Water',                                size: '330ml', type: 'juice', tags: [],                         image: 'images/products/carrot-lemon.png' },
  11: { ingredients: 'Breadfruit, Whole Milk, Nutmeg, Vanilla, Sugar',             size: '330ml', type: 'milk',  tags: [],                         image: 'images/products/breadfruit-milk.png' },
  12: { ingredients: 'Carrot, Grapefruit, Sugar, Water',                           size: '330ml', type: 'juice', tags: [],                         image: 'images/products/carrot-grapefruit.png' },
  13: { ingredients: 'Carrot, Ginger, Sugar, Water',                               size: '330ml', type: 'juice', tags: [],                         image: 'images/products/carrot-ginger.png' },
  14: { ingredients: 'Beetroot, Apple, Sugar, Water',                              size: '330ml', type: 'juice', tags: [],                         image: 'images/products/beetroot-apple.png' },
  15: { ingredients: 'Beetroot, Whole Milk, Nutmeg, Vanilla, Sugar',               size: '330ml', type: 'milk',  tags: [],                         image: 'images/products/beetroot-milk.png' },
  16: { ingredients: 'Lime, Sugar, Water',                                          size: '330ml', type: 'juice', tags: [],                         image: 'images/products/carrot-lime.png' },
  17: { ingredients: 'Pineapple, Lemon, Ginger',                                   size: '60ml',  type: 'shot',  tags: [],                         image: 'images/products/go-shot-pineapple-ginger.png' },
  18: { ingredients: 'Ginger, Turmeric, Lemon',                                    size: '60ml',  type: 'shot',  tags: [],                         image: 'images/products/go-shot-turmeric.png' },
  19: { ingredients: 'Carrot, Whole Milk, Nutmeg, Vanilla, Sugar',                 size: '330ml', type: 'milk',  tags: [],                         image: 'images/products/carrot-milk.png' },
};

async function loadProducts() {
  try {
    const res = await fetch('/api/products-public');
    if (!res.ok) throw new Error('failed');
    const dbProducts = await res.json();
    // Merge DB data (name, price) with static data (image, ingredients, etc.)
    PRODUCTS = dbProducts.map(p => ({
      id:    p.id,
      name:  p.name,
      price: p.price,          // from DB
      ...(PRODUCT_STATIC[p.id] || { ingredients: '', size: '330ml', type: 'juice', tags: [], image: '' }),
    }));
  } catch {
    // Fallback: use static prices so the shop still renders
    PRODUCTS = Object.entries(PRODUCT_STATIC).map(([id, s]) => ({
      id: +id, name: `Product ${id}`, price: s.type === 'shot' ? 2.99 : s.type === 'milk' ? 4.99 : 3.99, ...s,
    }));
  }
}


/* ─── FILTER & SORT STATE ────────────────────────────────────────── */
let activeCategoryFilter = 'all';
const activeDietaryFilters = new Set();
let activeSortType = 'alphabetical'; // 'alphabetical' | 'price-low' | 'price-high'

/* ─── CART STATE ────────────────────────────────────────────────── */
let cart = JSON.parse(localStorage.getItem('otgj_cart') || '[]');

function saveCart() {
  localStorage.setItem('otgj_cart', JSON.stringify(cart));
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function cartItemCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

/* ─── RENDER PRODUCTS ────────────────────────────────────────────── */
function renderProducts(categoryFilter = 'all', dietaryFilters = new Set(), sortType = activeSortType) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  let filtered = categoryFilter === 'all'
    ? [...PRODUCTS]
    : PRODUCTS.filter(p => p.type === categoryFilter);

  // Weighted sort: shots always pinned to the bottom, then apply user's sort within each group
  filtered.sort((a, b) => {
    const aIsShot = a.type === 'shot';
    const bIsShot = b.type === 'shot';
    if (aIsShot && !bIsShot) return 1;
    if (!aIsShot && bIsShot) return -1;
    if (sortType === 'price-high') return b.price - a.price;
    if (sortType === 'price-low')  return a.price - b.price;
    return a.name.localeCompare(b.name); // default: alphabetical
  });

  if (dietaryFilters.size > 0) {
    filtered = filtered.filter(p =>
      [...dietaryFilters].every(tag => p.tags.includes(tag))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="products-empty">No products match your current filters.</p>`;
    return;
  }

  filtered.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'product-card fade-up';
    card.dataset.type = p.type;
    card.style.transitionDelay = `${(idx % 8) * 0.05}s`;

    card.innerHTML = `
      <div class="card-image-wrap">
        <img
          src="${p.image}"
          alt="${p.name}"
          loading="lazy"
          onerror="this.src='images/products/placeholder.jpg';this.onerror=null;"
        />
        <div class="card-overlay">
          <span class="overlay-label">Ingredients</span>
          <p class="overlay-ingredients">${p.ingredients}</p>
          <span class="overlay-type-badge">${p.type === 'shot' ? 'Go Shot' : p.type === 'milk' ? 'Milk Blend' : 'Fresh Juice'}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-size">${p.size}</div>
        <h3 class="card-name">${p.name}</h3>
        ${p.tags.length ? `<div class="card-badges">${p.tags.map(t => `<span class="card-badge card-badge--${t}">${t === 'noSugar' ? 'No Added Sugar' : 'Lactose Free'}</span>`).join('')}</div>` : ''}
        <p class="card-ingredients-mobile">${p.ingredients}</p>
        <p class="card-price">£${p.price.toFixed(2)}</p>
        <div class="card-actions">
          <div class="qty-wrap">
            <button class="qty-btn qty-minus" data-id="${p.id}" aria-label="Decrease quantity">−</button>
            <span class="qty-num" data-id="${p.id}">1</span>
            <button class="qty-btn qty-plus" data-id="${p.id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn-cart" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll('.product-card.fade-up').forEach(el => {
      el.classList.add('visible');
    });
  });

  attachCardListeners();
}

function attachCardListeners() {
  document.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = +btn.dataset.id;
      const display = document.querySelector(`.qty-num[data-id="${id}"]`);
      let val = parseInt(display.textContent);
      if (val > 1) { val--; display.textContent = val; }
    });
  });

  document.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = +btn.dataset.id;
      const display = document.querySelector(`.qty-num[data-id="${id}"]`);
      let val = parseInt(display.textContent);
      if (val < MAX_ITEM_QTY) val++;
      display.textContent = val;
    });
  });

  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = +btn.dataset.id;
      const qty = parseInt(document.querySelector(`.qty-num[data-id="${id}"]`).textContent);
      addToCart(id, qty);
      // Reset qty
      document.querySelector(`.qty-num[data-id="${id}"]`).textContent = '1';
    });
  });
}

/* ─── CART LOGIC ─────────────────────────────────────────────────── */
const MAX_ITEM_QTY = 100; // standard customer / guest cap

function addToCart(productId, qty = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty = Math.min(MAX_ITEM_QTY, existing.qty + qty);
  } else {
    cart.push({ id: productId, name: product.name, price: product.price, image: product.image, qty: Math.min(MAX_ITEM_QTY, qty) });
  }

  saveCart();
  updateCartUI();
  openCart();
  showToast(`${product.name.split(' ').slice(0, 3).join(' ')} added to cart`);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else { saveCart(); updateCartUI(); }
}

function updateCartUI() {
  const count = cartItemCount();
  const countEl = document.getElementById('cart-count');
  countEl.textContent = count;
  countEl.classList.toggle('visible', count > 0);

  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const cartFooterEl = document.getElementById('cart-footer');

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '';
    cartEmptyEl.style.display = 'flex';
    cartFooterEl.style.display = 'none';
    updateMiniCartUI();
    return;
  }

  cartEmptyEl.style.display = 'none';
  cartFooterEl.style.display = 'block';

  cartItemsEl.innerHTML = cart.map(item => `
    <li class="cart-item" data-id="${item.id}">
      <img
        class="cart-item-img"
        src="${item.image}"
        alt="${item.name}"
        onerror="this.src='images/products/placeholder.jpg';this.onerror=null;"
      />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">£${(item.price * item.qty).toFixed(2)}</p>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" data-id="${item.id}" data-delta="-1" aria-label="Remove one">−</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="cart-qty-btn" data-id="${item.id}" data-delta="1" aria-label="Add one">+</button>
          <button class="cart-item-remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    </li>
  `).join('');

  document.getElementById('cart-total').textContent = `£${cartTotal().toFixed(2)}`;
  updateBundleUI();

  cartItemsEl.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      updateCartQty(+btn.dataset.id, +btn.dataset.delta);
    });
  });

  cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(+btn.dataset.id));
  });

  updateMiniCartUI();
}

/* ─── MINI-CART UI ───────────────────────────────────────────────── */
function updateMiniCartUI() {
  const itemsEl = document.getElementById('mini-cart-items');
  const emptyEl = document.getElementById('mini-cart-empty');
  const footerEl = document.getElementById('mini-cart-footer');
  const totalEl = document.getElementById('mini-cart-total');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'block';

  itemsEl.innerHTML = cart.map(item => `
    <li class="mini-cart-item" data-id="${item.id}">
      <img class="mini-cart-item-img" src="${item.image}" alt="${item.name}"
        onerror="this.src='images/products/placeholder.jpg';this.onerror=null;" />
      <div class="mini-cart-item-info">
        <p class="mini-cart-item-name">${item.name}</p>
        <p class="mini-cart-item-qty">Qty: ${item.qty}</p>
      </div>
      <span class="mini-cart-item-price">£${(item.price * item.qty).toFixed(2)}</span>
      <button class="mini-cart-remove" data-id="${item.id}" aria-label="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </li>
  `).join('');

  if (totalEl) totalEl.textContent = `£${cartTotal().toFixed(2)}`;

  itemsEl.querySelectorAll('.mini-cart-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(+btn.dataset.id));
  });
}

/* ─── MINI-CART HOVER ────────────────────────────────────────────── */
function initMiniCart() {
  const wrap = document.getElementById('cart-hover-wrap');
  const miniCart = document.getElementById('mini-cart');
  if (!wrap || !miniCart) return;

  let closeTimer = null;

  function openMiniCart() {
    clearTimeout(closeTimer);
    miniCart.classList.add('open');
    const items = miniCart.querySelectorAll('.mini-cart-item');
    items.forEach(item => item.classList.remove('show'));
    items.forEach((item, i) => {
      setTimeout(() => item.classList.add('show'), i * 65);
    });
  }

  function scheduleMiniCartClose() {
    closeTimer = setTimeout(() => miniCart.classList.remove('open'), 200);
  }

  wrap.addEventListener('mouseenter', openMiniCart);
  wrap.addEventListener('mouseleave', scheduleMiniCartClose);
  miniCart.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  miniCart.addEventListener('mouseleave', scheduleMiniCartClose);
}

/* ─── CART DRAWER ────────────────────────────────────────────────── */
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('visible');
  document.body.style.overflow = '';
}

/* ─── TOAST ──────────────────────────────────────────────────────── */
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ─── NAV SCROLL ─────────────────────────────────────────────────── */
function handleNavScroll() {
  const header = document.getElementById('site-header');
  header.classList.toggle('scrolled', window.scrollY > 60);
}

/* ─── FILTER TABS ────────────────────────────────────────────────── */
function initFilterTabs() {
  document.getElementById('filter-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategoryFilter = btn.dataset.filter;
    renderProducts(activeCategoryFilter, activeDietaryFilters);
  });
}

/* ─── SIGN-IN DROPDOWN ───────────────────────────────────────────── */
function initSignInDropdown() {
  const btn     = document.getElementById('nav-signin-btn');
  const menu    = document.getElementById('nav-signin-dropdown');
  const chevron = document.getElementById('nav-signin-chevron');
  if (!btn || !menu) return;

  function openMenu() {
    menu.style.display = 'block';
    btn.setAttribute('aria-expanded', 'true');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  }
  function closeMenu() {
    menu.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.style.display === 'none' ? openMenu() : closeMenu();
  });

  document.addEventListener('click', e => {
    if (!btn.parentElement.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ─── SORT CONTROLS ──────────────────────────────────────────────── */
function initSortControls() {
  const container = document.getElementById('sort-controls');
  if (!container) return;
  container.addEventListener('click', e => {
    const btn = e.target.closest('.sort-btn');
    if (!btn) return;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeSortType = btn.dataset.sort;
    renderProducts(activeCategoryFilter, activeDietaryFilters, activeSortType);
  });
}

/* ─── DIETARY FILTERS ────────────────────────────────────────────── */
function initDietaryFilters() {
  document.getElementById('dietary-filters').addEventListener('click', e => {
    const btn = e.target.closest('.dietary-btn');
    if (!btn) return;
    const tag = btn.dataset.tag;
    if (activeDietaryFilters.has(tag)) {
      activeDietaryFilters.delete(tag);
      btn.classList.remove('active');
    } else {
      activeDietaryFilters.add(tag);
      btn.classList.add('active');
    }
    renderProducts(activeCategoryFilter, activeDietaryFilters);
  });
}

/* ─── SMOOTH SCROLL FOR ANCHOR LINKS ────────────────────────────── */
function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
      // Close mobile menu
      document.getElementById('mobile-menu').classList.remove('open');
      document.getElementById('nav-burger').classList.remove('open');
      document.getElementById('site-header').classList.remove('menu-open');
    });
  });
}

/* ─── MOBILE MENU ────────────────────────────────────────────────── */
function initMobileMenu() {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('mobile-menu');
  const header = document.getElementById('site-header');
  burger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    header.classList.toggle('menu-open', isOpen);
  });
}

/* ─── REWARDS MODAL ──────────────────────────────────────────────── */
function initRewards() {
  const modal = document.getElementById('rewards-modal');
  const close = document.getElementById('rewards-modal-close');

  ['rewards-widget', 'rewards-widget-mobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => modal.classList.toggle('open'));
  });

  close.addEventListener('click', () => modal.classList.remove('open'));

  const joinBtn = modal.querySelector('.rewards-join');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      window.location.href = '/account';
    });
  }

  document.addEventListener('click', e => {
    if (
      modal.classList.contains('open') &&
      !modal.querySelector('.rewards-modal-inner').contains(e.target) &&
      !e.target.closest('#rewards-widget') &&
      !e.target.closest('#rewards-widget-mobile')
    ) {
      modal.classList.remove('open');
    }
  });
}

/* ─── NEWSLETTER FORM ────────────────────────────────────────────── */
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = e.target.querySelector('input[type="email"]');
    showToast('Thanks for subscribing!');
    input.value = '';
  });
}


/* ─── WELCOME POPUP ──────────────────────────────────────────────── */
function initPopup() {
  const popup = document.getElementById('welcome-popup');
  if (!popup) return;
  if (sessionStorage.getItem('otgj_popup_shown')) return;

  setTimeout(() => popup.classList.add('visible'), 3000);

  function closePopup() {
    popup.classList.remove('visible');
    sessionStorage.setItem('otgj_popup_shown', '1');
  }

  document.getElementById('popup-close').addEventListener('click', closePopup);
  document.getElementById('popup-skip').addEventListener('click', closePopup);

  // The popup form now routes users to the secure account page for their discount
  document.getElementById('popup-form').addEventListener('submit', e => {
    e.preventDefault();
    closePopup();
    window.location.href = '/account';
  });

  popup.addEventListener('click', e => {
    if (e.target === popup) closePopup();
  });
}

/* ─── INTERSECTION OBSERVER (fade-up) ───────────────────────────── */
function initFadeObserver() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        observer.unobserve(en.target);
      }
    }),
    { threshold: 0.12 }
  );

  document.querySelectorAll('.badge-card, .about-text, .section-intro').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
}

/* ─── PLACEHOLDER IMAGE GENERATOR ───────────────────────────────── */
function createPlaceholder(width, height, text, bg = '#1d6c00') {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(width / 12)}px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  const lineHeight = Math.floor(width / 10);
  words.forEach((word, i) => {
    ctx.fillText(word, width / 2, height / 2 + (i - (words.length - 1) / 2) * lineHeight);
  });
  return canvas.toDataURL();
}

/* ─── SPLASH SCREEN ─────────────────────────────────────────────── */
(function initSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  document.body.style.overflow = 'hidden';

  const MIN_MS = 1500;
  const t0 = Date.now();

  function hide() {
    const delay = Math.max(0, MIN_MS - (Date.now() - t0));
    setTimeout(() => {
      splash.classList.add('fade-out');
      document.body.style.overflow = '';
      setTimeout(() => splash.remove(), 600);
    }, delay);
  }

  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('load', hide, { once: true });
  }
})();

/* ─── ACTIVE PROMOTIONS ──────────────────────────────────────────── */
let ACTIVE_PROMOS = [];

async function loadActivePromos() {
  try {
    const res = await fetch('/api/promotions-public');
    if (res.ok) ACTIVE_PROMOS = await res.json();
  } catch {
    ACTIVE_PROMOS = [];
  }
}

/**
 * Cascading bundle calculator — mirrors src/lib/bundleCalculator.js exactly.
 * Greedy: largest pack first, then next largest, then singles.
 *
 * @param {number} totalQty          - total bottles in cart
 * @param {Array}  activeBundles     - from ACTIVE_PROMOS
 * @param {number} avgSinglePence    - average per-bottle price in pence
 * @returns {{ totalPence, standardPence, savingsPence, breakdown, nextBundle }}
 */
function calcBundles(totalQty, activeBundles, avgSinglePence) {
  const standardPence = totalQty * avgSinglePence;

  if (!activeBundles.length || totalQty === 0) {
    return { totalPence: standardPence, standardPence, savingsPence: 0, breakdown: [], nextBundle: null };
  }

  const sorted = [...activeBundles].sort((a, b) => b.min_qty - a.min_qty);

  let remaining  = totalQty;
  let totalPence = 0;
  const breakdown = [];

  for (const bundle of sorted) {
    const packs = Math.floor(remaining / bundle.min_qty);
    if (packs > 0) {
      const sub = packs * bundle.total_price_pence;
      totalPence += sub;
      remaining  -= packs * bundle.min_qty;
      breakdown.push({
        label:         bundle.badge_text || bundle.name,
        packs,
        priceEach:     bundle.total_price_pence,
        subtotalPence: sub,
      });
    }
  }

  if (remaining > 0) {
    const sub = remaining * avgSinglePence;
    totalPence += sub;
    breakdown.push({
      label:         `Single bottle${remaining > 1 ? 's' : ''}`,
      packs:         remaining,
      priceEach:     avgSinglePence,
      subtotalPence: sub,
    });
  }

  // Next bundle the user could still unlock
  const nextBundle = sorted.find(b => totalQty < b.min_qty) || null;
  const savingsPence = standardPence - totalPence;

  return { totalPence, standardPence, savingsPence, breakdown, nextBundle };
}

function getCartBundleResult() {
  if (!ACTIVE_PROMOS.length) return null;
  const totalQty       = cartItemCount();
  const standardPence  = Math.round(cart.reduce((s, i) => s + i.price * i.qty, 0) * 100);
  if (totalQty === 0) return null;
  const avgSinglePence = Math.round(standardPence / totalQty);
  return calcBundles(totalQty, ACTIVE_PROMOS, avgSinglePence);
}

function updateBundleUI() {
  const nudgeEl   = document.getElementById('cart-bundle-nudge');
  const breakdownEl = document.getElementById('cart-bundle-breakdown');
  const totalEl   = document.getElementById('cart-total');
  const origEl    = document.getElementById('cart-total-original');
  if (!nudgeEl) return;

  const result    = getCartBundleResult();
  const totalQty  = cartItemCount();

  // No active promos at all — reset display
  if (!result) {
    nudgeEl.style.display    = 'none';
    if (breakdownEl) breakdownEl.style.display = 'none';
    if (origEl)      origEl.style.display      = 'none';
    if (totalEl)     totalEl.textContent = `£${cartTotal().toFixed(2)}`;
    return;
  }

  const { totalPence, standardPence, savingsPence, breakdown, nextBundle } = result;
  const bundlesApplied = breakdown.some(b => b.label !== `Single bottle${totalQty > 1 ? 's' : ''}`
    && b.label !== 'Single bottle');

  // ── Display bundle breakdown ───────────────────────────────────────
  if (bundlesApplied && breakdownEl) {
    breakdownEl.innerHTML = breakdown.map(b =>
      `<div class="cart-bd-row">
        <span>${b.packs}× ${b.label}</span>
        <span>£${(b.subtotalPence / 100).toFixed(2)}</span>
      </div>`
    ).join('');

    if (savingsPence > 0) {
      breakdownEl.innerHTML += `<div class="cart-bd-saving">Bundle Discount Applied — you save £${(savingsPence / 100).toFixed(2)}</div>`;
      if (origEl) { origEl.textContent = `£${(standardPence / 100).toFixed(2)}`; origEl.style.display = 'inline'; }
    }
    breakdownEl.style.display = 'block';
    if (totalEl) totalEl.textContent = `£${(totalPence / 100).toFixed(2)}`;
  } else {
    if (breakdownEl) breakdownEl.style.display = 'none';
    if (origEl)      origEl.style.display      = 'none';
    if (totalEl)     totalEl.textContent = `£${cartTotal().toFixed(2)}`;
  }

  // ── Nudge: next unlock ─────────────────────────────────────────────
  const lowestActive = [...ACTIVE_PROMOS].sort((a, b) => a.min_qty - b.min_qty)[0];
  if (lowestActive && totalQty < lowestActive.min_qty) {
    const needed = lowestActive.min_qty - totalQty;
    nudgeEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Add <strong>${needed} more bottle${needed > 1 ? 's' : ''}</strong> to unlock the <strong>${lowestActive.badge_text}</strong>`;
    nudgeEl.style.display = 'flex';
  } else if (nextBundle) {
    const needed = nextBundle.min_qty - totalQty;
    nudgeEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Add <strong>${needed} more</strong> to also unlock the <strong>${nextBundle.badge_text}</strong>`;
    nudgeEl.style.display = 'flex';
  } else {
    nudgeEl.style.display = 'none';
  }
}

/* ─── HERO SLOGAN ROTATOR ────────────────────────────────────────── */
function initSloganRotator() {
  const slogans = document.querySelectorAll('.hero-slogan');
  if (!slogans.length) return;
  let idx = 0;
  slogans[0].classList.add('active');
  setInterval(() => {
    slogans[idx].classList.remove('active');
    idx = (idx + 1) % slogans.length;
    slogans[idx].classList.add('active');
  }, 2800);
}

/* ─── SUBSCRIBE & SAVE ───────────────────────────────────────────── */
function initSubscriptions() {
  function makeQtyControl(minusId, qtyId, plusId, min, max) {
    const minus = document.getElementById(minusId);
    const plus  = document.getElementById(plusId);
    const qty   = document.getElementById(qtyId);
    if (!minus || !plus || !qty) return;
    minus.addEventListener('click', () => {
      const v = parseInt(qty.textContent);
      if (v > min) qty.textContent = v - 1;
    });
    plus.addEventListener('click', () => {
      const v = parseInt(qty.textContent);
      if (v < max) qty.textContent = v + 1;
    });
  }

  makeQtyControl('sub-weekly-minus',  'sub-weekly-qty',  'sub-weekly-plus',  1, 10);
  makeQtyControl('sub-monthly-minus', 'sub-monthly-qty', 'sub-monthly-plus', 1, 20);

  async function subscribe(stripeInterval, qtyId, btn, flavors) {
    const qty      = parseInt(document.getElementById(qtyId)?.textContent) || 1;
    const original = btn.textContent;
    btn.disabled    = true;
    btn.textContent = 'Redirecting…';
    try {
      const res = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: stripeInterval, quantity: qty, flavors: flavors || [] }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || 'Subscription setup failed. Please try again.');
        btn.disabled    = false;
        btn.textContent = original;
      }
    } catch {
      showToast('Something went wrong. Please try again.');
      btn.disabled    = false;
      btn.textContent = original;
    }
  }

  // Subscribe buttons redirect to the dedicated /subscribe page (React)
  // which handles flavor selection before creating the Stripe session.
  document.getElementById('btn-subscribe-weekly')?.addEventListener('click', function() {
    const qty = parseInt(document.getElementById('sub-weekly-qty')?.textContent) || 3;
    window.location.href = `/subscribe?interval=week&qty=${qty}`;
  });
  document.getElementById('btn-subscribe-monthly')?.addEventListener('click', function() {
    const qty = parseInt(document.getElementById('sub-monthly-qty')?.textContent) || 10;
    window.location.href = `/subscribe?interval=month&qty=${qty}`;
  });
}

/* ─── INIT ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({ once: true, duration: 650, easing: 'ease-out-cubic', offset: 60 });
  }

  // Load DB-driven product data and active promos in parallel before first render
  await Promise.all([loadProducts(), loadActivePromos()]);
  renderProducts(activeCategoryFilter, activeDietaryFilters);
  updateCartUI();
  initSignInDropdown();
  initFilterTabs();
  initSortControls();
  initDietaryFilters();
  initAnchorLinks();
  initMobileMenu();
  initRewards();
  initNewsletter();
  initFadeObserver();
  initMiniCart();
  initPopup();
  initSloganRotator();
  initSubscriptions();

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ── Auth state in nav ─────────────────────────────────────────── */
  (function updateNavAuth() {
    try {
      const raw  = localStorage.getItem('otgj_user');
      const user = raw ? JSON.parse(raw) : null;

      const signinBtn     = document.getElementById('nav-signin-btn');
      const registerBtn   = document.getElementById('nav-register-btn');
      const welcomeWrap   = document.getElementById('nav-welcome-wrap');
      const welcomeText   = document.getElementById('nav-welcome-text');
      const mobileSignin  = document.getElementById('mobile-signin-link');
      const mobileRegister= document.getElementById('mobile-register-link');
      const mobileAccount = document.getElementById('mobile-account-link');
      const mobileLogout  = document.getElementById('mobile-logout-link');

      if (user && user.email) {
        // Logged in — show "Welcome, [Name]" + Log Out; hide Sign In / Sign Up
        const name = user.first_name || user.email.split('@')[0];
        if (signinBtn)   signinBtn.style.display    = 'none';
        if (registerBtn) registerBtn.style.display   = 'none';
        if (welcomeWrap) welcomeWrap.style.display   = 'flex';
        if (welcomeText) welcomeText.textContent     = `Welcome, ${name}`;
        if (mobileSignin)   mobileSignin.style.display   = 'none';
        if (mobileRegister) mobileRegister.style.display  = 'none';
        if (mobileAccount)  mobileAccount.style.display   = '';
        if (mobileLogout)   mobileLogout.style.display    = '';
      }
      // else: defaults (Sign In/Up visible, welcome hidden) already set in HTML
    } catch {}
  })();

  document.getElementById('cart-trigger').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  document.getElementById('cart-shop-link')?.addEventListener('click', closeCart);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCart();
      document.getElementById('rewards-modal').classList.remove('open');
      const popup = document.getElementById('welcome-popup');
      if (popup && popup.classList.contains('visible')) {
        popup.classList.remove('visible');
        sessionStorage.setItem('otgj_popup_shown', '1');
      }
    }
  });
});
