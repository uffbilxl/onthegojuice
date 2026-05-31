'use strict';

/* ─── PRODUCT DATA ──────────────────────────────────────────────── */
const PRODUCTS = [
  // Row 1
  {
    id: 1,
    name: 'Carrot and Milk Juice Drink (No Added Sugar)',
    ingredients: 'Carrot, Whole Milk, Nutmeg, Vanilla',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: ['noSugar'],
    image: 'images/products/Carrot_and_Milk_Juice_Drink_Carrot-Whole_Milk-Nutmeg-Vanilla-Sugar.png',
  },
  {
    id: 2,
    name: 'Carrot, Beetroot & Milk Juice Drink (No Added Sugar)',
    ingredients: 'Carrot, Beetroot, Whole Milk, Nutmeg, Vanilla',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: ['noSugar'],
    image: 'images/products/Carrot_and_Milk_Juice_Drink_No_Added_Sugar_Carrot-Whole_Milk-Nutmeg-Vanilla.png',
  },
  {
    id: 3,
    name: 'Mango & Milk Juice Drink',
    ingredients: 'Mango, Whole Milk',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: [],
    image: 'images/products/Carrot_Beetroot_and_Milk_Juice_Drink_Carrot-Beetroot-Whole_Milk-Nutmeg-Vanilla-Sugar.png',
  },
  {
    id: 4,
    name: 'Carrot, Beetroot & Milk Juice Drink (No Added Sugar)',
    ingredients: 'Carrot, Beetroot, Lactose Free Whole Milk, Nutmeg, Vanilla, Sugar',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: ['noSugar', 'lactoseFree'],
    image: 'images/products/Carrot_Beetroot_and_Milk_Juice_Drink_No_Added_Sugar_Carrot-Beetroot-Whole_Milk-Nutmeg-Vanilla.png',
  },
  // Row 2
  {
    id: 5,
    name: 'Carrot, Beetroot & Milk Juice Drink',
    ingredients: 'Carrot, Beetroot, Whole Milk, Nutmeg, Vanilla, Sugar',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: [],
    image: 'images/products/Beetroot_and_Milk_Juice_Drink_Beetroot-Whole_Milk-Nutmeg-Vanilla-Sugar.png',
  },
  {
    id: 6,
    name: 'Mango & Ginger Juice Drink',
    ingredients: 'Mango, Ginger, Sugar, Water',
    price: 1.99,
    size: '330ml',
    type: 'juice',
    tags: [],
    image: 'images/products/Carrot_and_Milk_Lactose_Free_Juice_Drink_Carrot-Lactose_Free_Whole_Milk-Nutmeg-Vanilla-Sugar.png',
  },
  {
    id: 7,
    name: 'Carrot & Milk Juice Drink',
    ingredients: 'Carrot, Lactose Free Whole Milk, Nutmeg, Vanilla, Sugar',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: ['lactoseFree'],
    image: 'images/products/Carrot_Beetroot_and_Milk_Lactose_Free_Juice_Drink_Carrot-Beetroot-Lactose_Free_Whole_Milk-Nutmeg-Vanilla-Sugar.png',
  },
  {
    id: 8,
    name: 'Sorrel Juice Drink',
    ingredients: 'Sorrel, Cinnamon, Pimento, Sugar, Water',
    price: 1.99,
    size: '330ml',
    type: 'juice',
    tags: [],
    image: 'images/products/Mango_and_Milk_Juice_Drink_Mango-Whole_Milk.png',
  },
  // Row 3
  {
    id: 9,
    name: 'GO SHOT Ginger & Apple Ginger',
    ingredients: 'Apple, Lemon, Ginger',
    price: 1.50,
    size: '330ml',
    type: 'shot',
    tags: [],
    image: 'images/products/Breadfruit_and_Milk_Juice_Drink_Breadfruit-Whole_Milk-Nutmeg-Vanilla-Sugar.png',
  },
  {
    id: 10,
    name: 'Carrot and Lemon Juice Drink',
    ingredients: 'Carrot, Lemon, Sugar, Water',
    price: 1.99,
    size: '330ml',
    type: 'juice',
    tags: [],
    image: 'images/products/Carrot_and_Ginger_Juice_Drink_Carrot-Ginger-Sugar-Water.png',
  },
  {
    id: 11,
    name: 'Breadfruit and Milk Juice Drink',
    ingredients: 'Breadfruit, Whole Milk, Nutmeg, Vanilla, Sugar',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: [],
    image: 'images/products/Carrot_and_Lemon_Juice_Drink_Carrot-Lemon-Sugar-Water.png',
  },
  {
    id: 12,
    name: 'Carrot & Grapefruit Juice Drink',
    ingredients: 'Carrot, Grapefruit, Sugar, Water',
    price: 1.99,
    size: '330ml',
    type: 'juice',
    tags: [],
    image: 'images/products/Carrot_and_Lime_Juice_Drink_Carrot-Lime-Sugar-Water.png',
  },
  // Row 4
  {
    id: 13,
    name: 'Carrot and Ginger Juice Drink',
    ingredients: 'Carrot, Ginger, Sugar, Water',
    price: 1.99,
    size: '330ml',
    type: 'juice',
    tags: [],
    image: 'images/products/Carrot_and_Grapefruit_Juice_Drink_Carrot-Grapefruit-Sugar-Water.png',
  },
  {
    id: 14,
    name: 'Beetroot & Apple Juice Drink',
    ingredients: 'Beetroot, Apple, Sugar, Water',
    price: 1.99,
    size: '330ml',
    type: 'juice',
    tags: [],
    image: 'images/products/Mango_and_Ginger_Juice_Drink_Mango-Ginger-Sugar-Water.png',
  },
  {
    id: 15,
    name: 'Beetroot & Milk Juice Drink',
    ingredients: 'Beetroot, Whole Milk, Nutmeg, Vanilla, Sugar',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: [],
    image: 'images/products/Beetroot_and_Apple_Juice_Drink_Beetroot-Apple-Sugar-Water.png',
  },
  {
    id: 16,
    name: 'Carrot and Lime Juice Drink',
    ingredients: 'Lime, Sugar, Water, Carrot',
    price: 1.99,
    size: '330ml',
    type: 'juice',
    tags: [],
    image: 'images/products/Sorrel_Juice_Drink_Sorrel-Cinnamon-Pimento-Sugar-Water.png',
  },
  // Row 5
  {
    id: 17,
    name: 'GO Shot Ginger & Pineapple Ginger',
    ingredients: 'Pineapple, Lemon',
    price: 1.50,
    size: '330ml',
    type: 'shot',
    tags: [],
    image: 'images/products/Go_Shot_Ginger_and_Apple_Ginger_Apple-Lemon.png',
  },
  {
    id: 18,
    name: 'Ginger and Turmeric Wellness Shot',
    ingredients: 'Ginger, Turmeric, Lemon',
    price: 1.50,
    size: '330ml',
    type: 'shot',
    tags: [],
    image: 'images/products/Go_Shot_Ginger_and_Pineapple_Ginger_Pineapple-Lemon.png',
  },
  {
    id: 19,
    name: 'Carrot and Milk Juice Drink',
    ingredients: 'Carrot, Whole Milk, Nutmeg, Vanilla, Sugar',
    price: 1.99,
    size: '330ml',
    type: 'milk',
    tags: [],
    image: 'images/products/Ginger_and_Turmeric_Wellness_Shot_Ginger-Turmeric-Lemon.png',
  },
];

/* ─── FILTER STATE ──────────────────────────────────────────────── */
let activeCategoryFilter = 'all';
const activeDietaryFilters = new Set();

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
const TYPE_ORDER = { juice: 0, milk: 1, shot: 2 };

function renderProducts(categoryFilter = 'all', dietaryFilters = new Set()) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  let filtered = categoryFilter === 'all'
    ? [...PRODUCTS].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type])
    : PRODUCTS.filter(p => p.type === categoryFilter);

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
          <span class="overlay-type-badge">${p.type === 'shot' ? 'Wellness Shot' : p.type === 'milk' ? 'Milk Blend' : 'Cold-Pressed Juice'}</span>
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
      val++;
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
function addToCart(productId, qty = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, name: product.name, price: product.price, image: product.image, qty });
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
      const popup = document.getElementById('welcome-popup');
      if (popup) {
        localStorage.removeItem('otgj_popup_shown');
        popup.classList.add('visible');
      }
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
  if (localStorage.getItem('otgj_popup_shown')) return;

  setTimeout(() => popup.classList.add('visible'), 3000);

  function closePopup() {
    popup.classList.remove('visible');
    localStorage.setItem('otgj_popup_shown', '1');
  }

  document.getElementById('popup-close').addEventListener('click', closePopup);
  document.getElementById('popup-skip').addEventListener('click', closePopup);

  document.getElementById('popup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const input = e.target.querySelector('input[type="email"]');
    const email = input?.value?.trim();
    if (!email) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Something went wrong. Please try again.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Claim My Discount'; }
        return;
      }

      showToast("Code sent! Check your inbox — or spam folder if you don't see it.");
      closePopup();
    } catch {
      showToast('Something went wrong. Please try again.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Claim My Discount'; }
    }
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

/* ─── INIT ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({ once: true, duration: 650, easing: 'ease-out-cubic', offset: 60 });
  }

  renderProducts(activeCategoryFilter, activeDietaryFilters);
  updateCartUI();
  initFilterTabs();
  initDietaryFilters();
  initAnchorLinks();
  initMobileMenu();
  initRewards();
  initNewsletter();
  initFadeObserver();
  initMiniCart();
  initPopup();

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

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
        localStorage.setItem('otgj_popup_shown', '1');
      }
    }
  });
});
