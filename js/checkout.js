'use strict';

/* ─── CART ─────────────────────────────────────────────────────── */
const cart = JSON.parse(localStorage.getItem('otgj_cart') || '[]');

function cartSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

/* ─── ORDER SUMMARY ────────────────────────────────────────────── */
function renderSummary() {
  const container = document.getElementById('co-summary-items');
  const subtotalEl = document.getElementById('co-subtotal');
  const totalEl = document.getElementById('co-total');
  const deliveryCostEl = document.getElementById('co-delivery-cost');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<div class="co-summary-empty">Your cart is empty. <a href="index.html#products">Shop now</a></div>';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="co-summary-item">
      <img class="co-summary-item-img" src="${item.image}" alt="${item.name}"
        onerror="this.src='images/products/placeholder.jpg';this.onerror=null;" />
      <div class="co-summary-item-info">
        <p class="co-summary-item-name">${item.name}</p>
        <p class="co-summary-item-qty">Qty: ${item.qty}</p>
      </div>
      <span class="co-summary-item-price">£${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join('');

  const sub = cartSubtotal();
  if (subtotalEl) subtotalEl.textContent = `£${sub.toFixed(2)}`;
  updateDeliveryTotal();
}

function updateDeliveryTotal() {
  const sub = cartSubtotal();
  const isDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
  const deliveryCost = isDelivery && sub < 10 ? 1.50 : 0;
  const deliveryCostEl = document.getElementById('co-delivery-cost');
  const totalEl = document.getElementById('co-total');

  if (deliveryCostEl) {
    deliveryCostEl.textContent = deliveryCost === 0 ? 'Free' : `£${deliveryCost.toFixed(2)}`;
  }
  if (totalEl) {
    totalEl.textContent = `£${(sub + deliveryCost).toFixed(2)}`;
  }
}

/* ─── ACCORDION ─────────────────────────────────────────────────── */
function openSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.classList.add('open');
  section.classList.remove('done');
}

function closeSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.classList.remove('open');
}

function markDone(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.classList.remove('open');
  section.classList.add('done');
}

function initAccordion() {
  document.querySelectorAll('.co-next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentSection = btn.closest('.co-section');
      const nextId = btn.dataset.next;

      if (nextId === 'none') {
        // Last section: don't advance, just trigger place order
        document.getElementById('co-place-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }

      // Re-validate postcode before leaving delivery section
      if (currentSection.id === 'section-delivery') {
        const isDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
        if (isDelivery) {
          const pc = document.getElementById('postcode-input')?.value?.trim() || '';
          const resultEl = document.getElementById('postcode-result');
          if (!pc) {
            resultEl.className = 'postcode-result invalid';
            resultEl.textContent = 'Please enter your postcode.';
            document.getElementById('postcode-input')?.focus();
            return;
          }
          if (!resultEl.classList.contains('valid')) {
            resultEl.className = 'postcode-result invalid';
            resultEl.textContent = 'Please check your postcode before continuing.';
            document.getElementById('postcode-check-btn')?.focus();
            return;
          }
        }
      }

      markDone(currentSection.id);
      openSection(nextId);

      // Scroll to next section smoothly
      const nextEl = document.getElementById(nextId);
      if (nextEl) {
        setTimeout(() => {
          nextEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });
  });

  // Clicking a done section head re-opens it
  document.querySelectorAll('.co-section-head').forEach(head => {
    head.addEventListener('click', () => {
      const section = head.closest('.co-section');
      if (section.classList.contains('done')) {
        openSection(section.id);
      }
    });
  });
}

/* ─── POSTCODE VALIDATION ───────────────────────────────────────── */
const BHAM_LAT = 52.4862;
const BHAM_LON = -1.8904;
const MAX_MILES = 10;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function validatePostcode(postcode) {
  const clean = postcode.trim().replace(/\s+/g, '').toUpperCase();
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid postcode');
  }
  const data = await res.json();
  const { latitude, longitude } = data.result;
  return haversineDistance(BHAM_LAT, BHAM_LON, latitude, longitude);
}

function initPostcodeChecker() {
  const checkBtn = document.getElementById('postcode-check-btn');
  const input = document.getElementById('postcode-input');
  const resultEl = document.getElementById('postcode-result');
  if (!checkBtn || !input) return;

  checkBtn.addEventListener('click', async () => {
    const postcode = input.value.trim();
    if (!postcode) {
      resultEl.className = 'postcode-result invalid';
      resultEl.textContent = 'Please enter a postcode.';
      return;
    }

    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking…';
    resultEl.className = 'postcode-result checking';
    resultEl.textContent = 'Checking your postcode…';

    try {
      const miles = await validatePostcode(postcode);
      if (miles <= MAX_MILES) {
        resultEl.className = 'postcode-result valid';
        resultEl.textContent = `Great news — we deliver to your area! (${miles.toFixed(1)} miles from Birmingham)`;
        const addrPostcode = document.getElementById('postcode-addr');
        if (addrPostcode && !addrPostcode.value) {
          addrPostcode.value = postcode.trim().toUpperCase();
        }
      } else {
        resultEl.className = 'postcode-result invalid';
        resultEl.textContent = `Sorry, we currently only deliver within 10 miles of Birmingham (your postcode is ${miles.toFixed(1)} miles away).`;
      }
    } catch {
      resultEl.className = 'postcode-result invalid';
      resultEl.textContent = 'Postcode not found. Please double-check and try again.';
    } finally {
      checkBtn.disabled = false;
      checkBtn.textContent = 'Check';
    }
  });

  // Clear result when user edits postcode
  input.addEventListener('input', () => {
    resultEl.className = 'postcode-result';
    resultEl.textContent = '';
  });

  // Allow Enter key in postcode input
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkBtn.click();
    }
  });
}

/* ─── DELIVERY / PICKUP TOGGLE ──────────────────────────────────── */
function initDeliveryToggle() {
  const postcodeWrap = document.getElementById('postcode-wrap');
  const pickupAddr = document.getElementById('pickup-address');
  const deliveryNextBtn = document.getElementById('delivery-next-btn');

  document.querySelectorAll('input[name="delivery"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isDelivery = radio.value === 'delivery';
      if (postcodeWrap) postcodeWrap.style.display = isDelivery ? 'block' : 'none';
      if (pickupAddr) pickupAddr.style.display = isDelivery ? 'none' : 'block';

      // Skip address section for pickup
      if (deliveryNextBtn) {
        deliveryNextBtn.dataset.next = isDelivery ? 'section-address' : 'none';
        deliveryNextBtn.textContent = isDelivery ? 'Continue to Address' : 'Review & Place Order';
      }

      updateDeliveryTotal();
    });
  });

  // Set initial state
  const initial = document.querySelector('input[name="delivery"]:checked')?.value;
  if (postcodeWrap) postcodeWrap.style.display = initial === 'delivery' ? 'block' : 'none';
  if (pickupAddr) pickupAddr.style.display = initial === 'pickup' ? 'block' : 'none';
}

/* ─── PLACE ORDER ───────────────────────────────────────────────── */
function generateOrderRef() {
  return `#OTGJ-${Math.floor(Math.random() * 9000) + 1000}`;
}

function initPlaceOrder() {
  const btn = document.getElementById('co-place-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (btn.classList.contains('loading') || btn.classList.contains('success')) return;
    if (cart.length === 0) return;

    btn.classList.add('loading');

    setTimeout(() => {
      btn.classList.remove('loading');
      btn.classList.add('success');

      const ref = generateOrderRef();
      const email = document.getElementById('email')?.value || 'your inbox';
      sessionStorage.setItem('otgj_order_ref', ref);
      sessionStorage.setItem('otgj_order_email', email);

      setTimeout(() => {
        window.location.href = 'thank-you.html';
      }, 900);
    }, 2000);
  });
}

/* ─── INIT ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  initAccordion();
  initPostcodeChecker();
  initDeliveryToggle();
  initPlaceOrder();

  // Update totals when delivery option changes
  document.querySelectorAll('input[name="delivery"]').forEach(r => {
    r.addEventListener('change', updateDeliveryTotal);
  });
});
