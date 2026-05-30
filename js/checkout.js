'use strict';

/* ─── STRIPE CONFIG ─────────────────────────────────────────────── */
// Publishable key is safe to expose in client-side code
const STRIPE_PK = 'pk_test_51TcXP15I1DB6R6KTaDOYuWcvM71JjTcDXzzXHntIAPjLd5h8xYOuGvuW9YafAaz8TekHxJOvKZNw9p0dd704unCP00g28CzoQe';

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1d6c00',
    colorBackground: '#ffffff',
    colorText: '#111111',
    colorDanger: '#dc2626',
    fontFamily: '"Poppins", system-ui, sans-serif',
    borderRadius: '10px',
    fontSizeBase: '14px',
  },
  rules: {
    '.Input': {
      border: '1.5px solid #e5e7eb',
      boxShadow: 'none',
      padding: '12px 14px',
    },
    '.Input:focus': {
      border: '1.5px solid #1d6c00',
      boxShadow: '0 0 0 3px rgba(29,108,0,0.12)',
      outline: 'none',
    },
    '.Label': {
      fontFamily: '"Poppins", sans-serif',
      fontSize: '0.78rem',
      fontWeight: '500',
      color: '#6b7280',
      marginBottom: '6px',
    },
    '.Tab': { borderRadius: '8px', border: '1.5px solid #e5e7eb' },
    '.Tab--selected': { borderColor: '#1d6c00', color: '#1d6c00', boxShadow: '0 0 0 2px rgba(29,108,0,0.2)' },
    '.Tab:hover': { borderColor: '#1d6c00', color: '#1d6c00' },
  },
};

/* ─── CART ─────────────────────────────────────────────────────── */
const cart = JSON.parse(localStorage.getItem('otgj_cart') || '[]');

function cartSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

/* ─── ORDER SUMMARY ────────────────────────────────────────────── */
function renderSummary() {
  const container = document.getElementById('co-summary-items');
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

  // Show subtotal but leave delivery as "—" until customer selects a delivery option
  const sub = cartSubtotal();
  const subtotalEl = document.getElementById('co-subtotal');
  const totalEl = document.getElementById('co-total');
  if (subtotalEl) subtotalEl.textContent = `£${sub.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `£${sub.toFixed(2)}`;
}

function updateDeliveryTotal() {
  const sub = cartSubtotal();
  const isDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
  const deliveryCost = isDelivery && sub < 10 ? 1.50 : 0;

  const deliveryCostEl = document.getElementById('co-delivery-cost');
  const subtotalEl = document.getElementById('co-subtotal');
  const totalEl = document.getElementById('co-total');

  if (subtotalEl) subtotalEl.textContent = `£${sub.toFixed(2)}`;
  if (deliveryCostEl) deliveryCostEl.textContent = deliveryCost === 0 ? 'Free' : `£${deliveryCost.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `£${(sub + deliveryCost).toFixed(2)}`;
}

/* ─── ACCORDION ─────────────────────────────────────────────────── */
function openSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.classList.add('open');
  section.classList.remove('done');
}

function markDone(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.classList.remove('open');
  section.classList.add('done');
}

function initAccordion() {
  document.querySelectorAll('.co-next-btn').forEach(btn => {
    // Skip the pay button — it has its own handler
    if (btn.id === 'pay-btn') return;

    btn.addEventListener('click', () => {
      const currentSection = btn.closest('.co-section');
      const nextId = btn.dataset.next;
      if (!nextId) return;

      // Validate postcode before leaving delivery section
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

      // If opening the payment section, initialize Stripe Elements
      if (nextId === 'section-payment') {
        initStripePayment();
      }

      const nextEl = document.getElementById(nextId);
      if (nextEl) setTimeout(() => nextEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    });
  });

  // Clicking a done section head re-opens it
  document.querySelectorAll('.co-section-head').forEach(head => {
    head.addEventListener('click', () => {
      const section = head.closest('.co-section');
      if (section.classList.contains('done')) openSection(section.id);
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
        if (addrPostcode && !addrPostcode.value) addrPostcode.value = postcode.trim().toUpperCase();
      } else {
        resultEl.className = 'postcode-result invalid';
        resultEl.textContent = `Sorry, we only deliver within 10 miles of Birmingham (your postcode is ${miles.toFixed(1)} miles away).`;
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

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); checkBtn.click(); }
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

      if (deliveryNextBtn) {
        deliveryNextBtn.dataset.next = isDelivery ? 'section-address' : 'section-payment';
        deliveryNextBtn.textContent = isDelivery ? 'Continue to Address' : 'Continue to Payment';
      }

      updateDeliveryTotal();
    });
  });

  // Set initial state
  const initial = document.querySelector('input[name="delivery"]:checked')?.value;
  if (postcodeWrap) postcodeWrap.style.display = initial === 'delivery' ? 'block' : 'none';
  if (pickupAddr) pickupAddr.style.display = initial === 'pickup' ? 'block' : 'none';
}

/* ─── STRIPE ELEMENTS ───────────────────────────────────────────── */
let stripeInstance = null;
let stripeElements = null;

async function initStripePayment() {
  if (stripeInstance) return; // Already initialized — don't re-fetch

  const loadingEl = document.getElementById('payment-loading');
  const paymentEl = document.getElementById('payment-element');
  const errorEl = document.getElementById('payment-error');
  const payBtn = document.getElementById('pay-btn');

  if (!paymentEl) return;

  if (loadingEl) loadingEl.style.display = 'flex';

  if (cart.length === 0) {
    if (loadingEl) loadingEl.style.display = 'none';
    paymentEl.innerHTML = '<p style="text-align:center;color:var(--grey);padding:20px">Your cart is empty. <a href="index.html#products" style="color:var(--green)">Go back to shop</a></p>';
    return;
  }

  const isDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
  const firstName = document.getElementById('first-name')?.value?.trim() || '';
  const lastName = document.getElementById('last-name')?.value?.trim() || '';

  const customer = {
    name: [firstName, lastName].filter(Boolean).join(' '),
    email: document.getElementById('email')?.value?.trim() || '',
    phone: document.getElementById('phone')?.value?.trim() || '',
  };

  const address = {
    line1: document.getElementById('address1')?.value?.trim() || '',
    line2: document.getElementById('address2')?.value?.trim() || '',
    city: document.getElementById('city')?.value?.trim() || 'Birmingham',
    postcode: document.getElementById('postcode-addr')?.value?.trim()
      || document.getElementById('postcode-input')?.value?.trim() || '',
  };

  try {
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty })),
        deliveryMethod: isDelivery ? 'local_delivery' : 'pickup',
        customer,
        address,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Unable to initialize payment');

    stripeInstance = Stripe(STRIPE_PK);
    stripeElements = stripeInstance.elements({ clientSecret: data.clientSecret, appearance: STRIPE_APPEARANCE });
    const paymentElement = stripeElements.create('payment');

    if (loadingEl) loadingEl.style.display = 'none';
    paymentElement.mount('#payment-element');

    paymentElement.on('ready', () => {
      if (payBtn) {
        payBtn.disabled = false;
        const total = document.getElementById('co-total')?.textContent || '';
        const textEl = payBtn.querySelector('.pay-btn-text');
        if (textEl && total) textEl.textContent = `Pay ${total}`;
      }
    });

  } catch (err) {
    console.error('[initStripePayment]', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = err.message || 'Payment initialization failed. Please refresh and try again.';
    }
  }
}

function initPayButton() {
  const payBtn = document.getElementById('pay-btn');
  if (!payBtn) return;

  payBtn.addEventListener('click', async () => {
    if (!stripeInstance || !stripeElements || payBtn.disabled) return;

    payBtn.disabled = true;
    const textEl = payBtn.querySelector('.pay-btn-text');
    const spinnerEl = payBtn.querySelector('.pay-btn-spinner');
    if (textEl) textEl.textContent = 'Processing…';
    if (spinnerEl) spinnerEl.style.display = 'inline-block';

    const errorEl = document.getElementById('payment-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    const email = document.getElementById('email')?.value?.trim() || undefined;

    const { error } = await stripeInstance.confirmPayment({
      elements: stripeElements,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you`,
        receipt_email: email,
      },
    });

    // Only runs if there's an immediate error (payment not yet confirmed)
    if (error) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = error.message || 'Payment failed. Please try again.';
      }
      const total = document.getElementById('co-total')?.textContent || '';
      if (textEl) textEl.textContent = `Pay ${total}`;
      if (spinnerEl) spinnerEl.style.display = 'none';
      payBtn.disabled = false;
    }
    // If no error, Stripe handles the redirect to return_url
  });
}

/* ─── INIT ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  initAccordion();
  initPostcodeChecker();
  initDeliveryToggle();
  initPayButton();

  document.querySelectorAll('input[name="delivery"]').forEach(r => {
    r.addEventListener('change', updateDeliveryTotal);
  });
});
