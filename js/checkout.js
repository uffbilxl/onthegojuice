'use strict';

/* ─── HTML ESCAPING ─────────────────────────────────────────────── */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── STRIPE CONFIG ─────────────────────────────────────────────── */
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
    '.Input': { border: '1.5px solid #e5e7eb', boxShadow: 'none', padding: '12px 14px' },
    '.Input:focus': { border: '1.5px solid #1d6c00', boxShadow: '0 0 0 3px rgba(29,108,0,0.12)', outline: 'none' },
    '.Label': { fontFamily: '"Poppins", sans-serif', fontSize: '0.78rem', fontWeight: '500', color: '#6b7280', marginBottom: '6px' },
    '.Tab': { borderRadius: '8px', border: '1.5px solid #e5e7eb' },
    '.Tab--selected': { borderColor: '#1d6c00', color: '#1d6c00', boxShadow: '0 0 0 2px rgba(29,108,0,0.2)' },
    '.Tab:hover': { borderColor: '#1d6c00', color: '#1d6c00' },
  },
};

/* ─── CART ─────────────────────────────────────────────────────── */
const cart = JSON.parse(localStorage.getItem('otgj_cart') || '[]');

/* ─── DISCOUNT STATE ────────────────────────────────────────────── */
let appliedDiscount      = null;  // { code, discountPence }
let activePromos         = [];
let studentDiscountActive = false;
let redeemLoyaltyPoints  = false;
let userLoyaltyPoints    = 0;     // from localStorage otgj_user

async function loadPromos() {
  try {
    const res = await fetch('/api/promotions-public');
    if (res.ok) activePromos = await res.json();
  } catch { activePromos = []; }
}

/* ─── BUNDLE MATH (mirrors src/lib/bundleCalculator.js) ─────────── */
function calcBundles(totalQty, promos, avgSinglePence) {
  if (!promos.length || totalQty === 0) return null;

  const sorted    = [...promos].sort((a, b) => b.min_qty - a.min_qty);
  let remaining   = totalQty;
  let totalPence  = 0;
  const breakdown = [];

  for (const b of sorted) {
    const packs = Math.floor(remaining / b.min_qty);
    if (packs > 0) {
      totalPence += packs * b.total_price_pence;
      remaining  -= packs * b.min_qty;
      breakdown.push({ label: b.badge_text || b.name, packs, priceEach: b.total_price_pence });
    }
  }

  if (remaining > 0) {
    totalPence += remaining * avgSinglePence;
    breakdown.push({ label: `Single bottle${remaining > 1 ? 's' : ''}`, packs: remaining, priceEach: avgSinglePence });
  }

  return { totalPence, breakdown };
}

function getCartBundleResult() {
  if (!activePromos.length || !cart.length) return null;
  const standardPence  = Math.round(cart.reduce((s, i) => s + i.price * i.qty, 0) * 100);
  const totalQty       = cart.reduce((s, i) => s + i.qty, 0);
  const avgSinglePence = Math.round(standardPence / totalQty);
  return calcBundles(totalQty, activePromos, avgSinglePence);
}

function cartSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function bundleAdjustedSubtotal() {
  const result = getCartBundleResult();
  return result ? result.totalPence / 100 : cartSubtotal();
}

/* ─── ORDER SUMMARY ────────────────────────────────────────────── */
function renderSummary() {
  const container = document.getElementById('co-summary-items');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<div class="co-summary-empty">Your cart is empty. <a href="index.html#products">Shop now</a></div>';
    return;
  }

  container.innerHTML = cart.map(item => {
    const price = Number(item.price) || 0;
    const qty   = parseInt(item.qty, 10) || 0;
    return `
    <div class="co-summary-item">
      <img class="co-summary-item-img" src="${esc(item.image)}" alt="${esc(item.name)}"
        onerror="this.src='images/products/placeholder.jpg';this.onerror=null;" />
      <div class="co-summary-item-info">
        <p class="co-summary-item-name">${esc(item.name)}</p>
        <p class="co-summary-item-qty">Qty: ${qty}</p>
      </div>
      <span class="co-summary-item-price">£${(price * qty).toFixed(2)}</span>
    </div>
  `;
  }).join('');

  updateBundleSummary();
}

function updateBundleSummary() {
  const standardTotal = cartSubtotal();
  const bundleResult  = getCartBundleResult();
  const adjustedTotal = bundleResult ? bundleResult.totalPence / 100 : standardTotal;
  const savingsPence  = Math.round((standardTotal - adjustedTotal) * 100);

  const subtotalEl    = document.getElementById('co-subtotal');
  const originalEl    = document.getElementById('co-subtotal-original');
  const bundleRow     = document.getElementById('co-bundle-row');
  const bundleLabel   = document.getElementById('co-bundle-label');
  const bundleAmount  = document.getElementById('co-bundle-amount');

  if (subtotalEl) subtotalEl.textContent = `£${adjustedTotal.toFixed(2)}`;

  if (savingsPence > 0 && bundleResult) {
    if (originalEl) { originalEl.textContent = `£${standardTotal.toFixed(2)}`; originalEl.style.display = 'inline'; }
    if (bundleRow)  bundleRow.style.display  = '';
    if (bundleLabel) bundleLabel.textContent = bundleResult.breakdown
      .filter(b => !b.label.startsWith('Single bottle'))
      .map(b => `${b.packs}× ${b.label}`).join(', ') || 'Bundle Discount';
    if (bundleAmount) bundleAmount.textContent = `–£${(savingsPence / 100).toFixed(2)}`;
  } else {
    if (originalEl) originalEl.style.display = 'none';
    if (bundleRow)  bundleRow.style.display   = 'none';
  }
}

function updateDeliveryTotal() {
  const sub          = bundleAdjustedSubtotal();
  const isDelivery   = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
  const deliveryCost = isDelivery && sub < 10 ? 1.50 : 0;
  const discountAmt  = appliedDiscount ? appliedDiscount.discountPence / 100 : 0;

  let running = sub + deliveryCost - discountAmt;

  // Student discount: 20% off the running total
  const studentAmt = studentDiscountActive ? running * 0.2 : 0;
  running -= studentAmt;

  // Loyalty points: 1 point = £0.01
  const loyaltyAmt = redeemLoyaltyPoints
    ? Math.min(userLoyaltyPoints / 100, Math.max(0, running - 0.50))
    : 0;
  running -= loyaltyAmt;

  const total = Math.max(0.50, running);

  const deliveryCostEl   = document.getElementById('co-delivery-cost');
  const discountRow      = document.getElementById('co-discount-row');
  const discountLabel    = document.getElementById('co-discount-label');
  const discountAmountEl = document.getElementById('co-discount-amount');
  const studentRow       = document.getElementById('co-student-row');
  const studentAmountEl  = document.getElementById('co-student-amount');
  const loyaltyRow       = document.getElementById('co-loyalty-row');
  const loyaltyAmountEl  = document.getElementById('co-loyalty-amount');
  const totalEl          = document.getElementById('co-total');

  updateBundleSummary();

  if (deliveryCostEl) deliveryCostEl.textContent = deliveryCost === 0 ? 'Free' : `£${deliveryCost.toFixed(2)}`;

  if (discountRow) {
    if (appliedDiscount) {
      discountRow.style.display = '';
      if (discountLabel)    discountLabel.textContent    = appliedDiscount.code;
      if (discountAmountEl) discountAmountEl.textContent = `–£${discountAmt.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (studentRow) {
    if (studentAmt > 0) {
      studentRow.style.display = '';
      if (studentAmountEl) studentAmountEl.textContent = `–£${studentAmt.toFixed(2)}`;
    } else {
      studentRow.style.display = 'none';
    }
  }

  if (loyaltyRow) {
    if (loyaltyAmt > 0) {
      loyaltyRow.style.display = '';
      if (loyaltyAmountEl) loyaltyAmountEl.textContent = `–£${loyaltyAmt.toFixed(2)}`;
    } else {
      loyaltyRow.style.display = 'none';
    }
  }

  if (totalEl) totalEl.textContent = `£${total.toFixed(2)}`;

  // Update the pay button text if Stripe is already loaded
  const payBtnText = document.querySelector('.pay-btn-text');
  if (payBtnText && !document.getElementById('pay-btn')?.disabled) {
    payBtnText.textContent = `Pay £${total.toFixed(2)}`;
  }
}

/* ─── STUDENT DISCOUNT DETECTION ───────────────────────────────── */
function initStudentDiscount() {
  const emailInput = document.getElementById('email');
  const banner     = document.getElementById('student-banner');
  if (!emailInput || !banner) return;

  function check() {
    const email = emailInput.value.trim().toLowerCase();
    studentDiscountActive = email.endsWith('.ac.uk');
    banner.style.display  = studentDiscountActive ? 'flex' : 'none';
    updateDeliveryTotal();
  }

  emailInput.addEventListener('input', check);
  emailInput.addEventListener('change', check);
}

/* ─── LOYALTY POINTS TOGGLE ─────────────────────────────────────── */
function initLoyaltyPoints() {
  try {
    const stored = localStorage.getItem('otgj_user');
    if (!stored) return;
    const user = JSON.parse(stored);
    if (!user?.points || user.points <= 0) return;
    userLoyaltyPoints = user.points;
  } catch { return; }

  const section    = document.getElementById('loyalty-section');
  const balanceEl  = document.getElementById('loyalty-balance');
  const toggle     = document.getElementById('loyalty-toggle');
  const knobTrack  = document.getElementById('loyalty-knob-track');
  const knob       = document.getElementById('loyalty-knob');
  if (!section || !toggle) return;

  section.style.display = 'block';
  if (balanceEl) {
    const worth = (userLoyaltyPoints / 100).toFixed(2);
    balanceEl.textContent = `${userLoyaltyPoints.toLocaleString()} points — worth £${worth} off`;
  }

  toggle.addEventListener('change', () => {
    redeemLoyaltyPoints = toggle.checked;
    if (knobTrack) knobTrack.style.background = toggle.checked ? '#7c3aed' : '#d1d5db';
    if (knob)      knob.style.transform       = toggle.checked ? 'translateX(20px)' : 'translateX(0)';
    updateDeliveryTotal();
  });
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
    if (btn.id === 'pay-btn') return;

    btn.addEventListener('click', () => {
      const currentSection = btn.closest('.co-section');
      const nextId = btn.dataset.next;
      if (!nextId) return;

      if (currentSection.id === 'section-delivery') {
        const selected = document.querySelector('input[name="delivery"]:checked')?.value;
        if (!selected) {
          const resultEl = document.getElementById('postcode-result');
          if (resultEl) {
            resultEl.className = 'postcode-result invalid';
            resultEl.textContent = 'Please select a delivery method before continuing.';
          }
          return;
        }
        if (selected === 'delivery') {
          const pc       = document.getElementById('postcode-input')?.value?.trim() || '';
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

      if (nextId === 'section-payment') {
        initStripePayment();
      }

      const nextEl = document.getElementById(nextId);
      if (nextEl) setTimeout(() => nextEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    });
  });

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
  const R    = 3958.8;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function validatePostcode(postcode) {
  const clean = postcode.trim().replace(/\s+/g, '').toUpperCase();
  const res   = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
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
  const input    = document.getElementById('postcode-input');
  const resultEl = document.getElementById('postcode-result');
  if (!checkBtn || !input) return;

  checkBtn.addEventListener('click', async () => {
    const postcode = input.value.trim();
    if (!postcode) {
      resultEl.className  = 'postcode-result invalid';
      resultEl.textContent = 'Please enter a postcode.';
      return;
    }

    checkBtn.disabled    = true;
    checkBtn.textContent = 'Checking…';
    resultEl.className   = 'postcode-result checking';
    resultEl.textContent = 'Checking your postcode…';

    try {
      const miles = await validatePostcode(postcode);
      if (miles <= MAX_MILES) {
        resultEl.className   = 'postcode-result valid';
        resultEl.textContent = `Great news — we deliver to your area! (${miles.toFixed(1)} miles from Birmingham)`;
        const addrPostcode = document.getElementById('postcode-addr');
        if (addrPostcode && !addrPostcode.value) addrPostcode.value = postcode.trim().toUpperCase();
      } else {
        resultEl.className   = 'postcode-result invalid';
        resultEl.textContent = `Sorry, we only deliver within 10 miles of Birmingham (your postcode is ${miles.toFixed(1)} miles away).`;
      }
    } catch {
      resultEl.className   = 'postcode-result invalid';
      resultEl.textContent = 'Postcode not found. Please double-check and try again.';
    } finally {
      checkBtn.disabled    = false;
      checkBtn.textContent = 'Check';
    }
  });

  input.addEventListener('input', () => {
    resultEl.className   = 'postcode-result';
    resultEl.textContent = '';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); checkBtn.click(); }
  });
}

/* ─── DELIVERY / PICKUP TOGGLE ──────────────────────────────────── */
function initDeliveryToggle() {
  const postcodeWrap     = document.getElementById('postcode-wrap');
  const pickupAddr       = document.getElementById('pickup-address');
  const deliveryNextBtn  = document.getElementById('delivery-next-btn');

  document.querySelectorAll('input[name="delivery"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isDelivery = radio.value === 'delivery';
      if (postcodeWrap) postcodeWrap.style.display = isDelivery ? 'block' : 'none';
      if (pickupAddr)   pickupAddr.style.display   = isDelivery ? 'none' : 'block';

      if (deliveryNextBtn) {
        deliveryNextBtn.dataset.next = isDelivery ? 'section-address' : 'section-payment';
        deliveryNextBtn.textContent  = isDelivery ? 'Continue to Address' : 'Continue to Payment';
      }

      updateDeliveryTotal();
    });
  });

  if (postcodeWrap) postcodeWrap.style.display = 'none';
  if (pickupAddr)   pickupAddr.style.display   = 'none';
}

/* ─── PROMO CODE ────────────────────────────────────────────────── */
function initPromoCode() {
  const toggleBtn = document.getElementById('co-promo-toggle');
  const promoBody = document.getElementById('co-promo-body');
  const applyBtn  = document.getElementById('promo-apply-btn');
  const input     = document.getElementById('promo-input');
  const resultEl  = document.getElementById('promo-result');
  if (!toggleBtn || !promoBody || !applyBtn || !input) return;

  toggleBtn.addEventListener('click', () => {
    const open = promoBody.style.display === 'none';
    promoBody.style.display = open ? 'block' : 'none';
    if (open) input.focus();
  });

  async function applyCode() {
    const code = input.value.trim().toUpperCase();
    if (!code) {
      resultEl.className   = 'co-promo-result invalid';
      resultEl.textContent = 'Please enter a code.';
      return;
    }

    applyBtn.disabled    = true;
    applyBtn.textContent = 'Checking…';
    resultEl.className   = 'co-promo-result';
    resultEl.textContent = '';

    try {
      const subtotalPence = Math.round(cartSubtotal() * 100);
      const res  = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalPence }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        resultEl.className   = 'co-promo-result invalid';
        resultEl.textContent = data.error || 'Invalid code.';
        appliedDiscount = null;
      } else {
        appliedDiscount      = { code: data.code, discountPence: data.discountPence };
        resultEl.className   = 'co-promo-result valid';
        resultEl.textContent = data.message;
        input.value          = data.code;
        updateDeliveryTotal();
      }
    } catch {
      resultEl.className   = 'co-promo-result invalid';
      resultEl.textContent = 'Could not validate code. Please try again.';
    } finally {
      applyBtn.disabled    = false;
      applyBtn.textContent = 'Apply';
    }
  }

  applyBtn.addEventListener('click', applyCode);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } });
}

/* ─── STRIPE ELEMENTS ───────────────────────────────────────────── */
let stripeInstance = null;
let stripeElements = null;

async function initStripePayment() {
  if (stripeInstance) return;

  const loadingEl = document.getElementById('payment-loading');
  const paymentEl = document.getElementById('payment-element');
  const errorEl   = document.getElementById('payment-error');
  const payBtn    = document.getElementById('pay-btn');

  if (!paymentEl) return;

  if (loadingEl) loadingEl.style.display = 'flex';

  if (cart.length === 0) {
    if (loadingEl) loadingEl.style.display = 'none';
    paymentEl.innerHTML = '<p style="text-align:center;color:var(--grey);padding:20px">Your cart is empty. <a href="index.html#products" style="color:var(--green)">Go back to shop</a></p>';
    return;
  }

  const isDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
  const firstName  = document.getElementById('first-name')?.value?.trim() || '';
  const lastName   = document.getElementById('last-name')?.value?.trim() || '';

  const customer = {
    name:  [firstName, lastName].filter(Boolean).join(' '),
    email: document.getElementById('email')?.value?.trim() || '',
    phone: document.getElementById('phone')?.value?.trim() || '',
  };

  const address = {
    line1:    document.getElementById('address1')?.value?.trim() || '',
    line2:    document.getElementById('address2')?.value?.trim() || '',
    city:     document.getElementById('city')?.value?.trim() || 'Birmingham',
    postcode: document.getElementById('postcode-addr')?.value?.trim()
              || document.getElementById('postcode-input')?.value?.trim() || '',
  };

  try {
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items:         cart.map(i => ({ id: i.id, name: i.name, qty: i.qty })),
        deliveryMethod: isDelivery ? 'local_delivery' : 'pickup',
        customer,
        address,
        discountCode:  appliedDiscount?.code || null,
        redeemPoints:  redeemLoyaltyPoints,
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
        const textEl = payBtn.querySelector('.pay-btn-text');
        if (textEl) textEl.textContent = `Pay £${(data.totalPence / 100).toFixed(2)}`;
      }
    });

  } catch (err) {
    console.error('[initStripePayment]', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent   = err.message || 'Payment initialization failed. Please refresh and try again.';
    }
  }
}

function initPayButton() {
  const payBtn = document.getElementById('pay-btn');
  if (!payBtn) return;

  payBtn.addEventListener('click', async () => {
    if (!stripeInstance || !stripeElements || payBtn.disabled) return;

    payBtn.disabled = true;
    const textEl    = payBtn.querySelector('.pay-btn-text');
    const spinnerEl = payBtn.querySelector('.pay-btn-spinner');
    if (textEl)    textEl.textContent        = 'Processing…';
    if (spinnerEl) spinnerEl.style.display   = 'inline-block';

    const errorEl = document.getElementById('payment-error');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    const email = document.getElementById('email')?.value?.trim() || undefined;

    const { error } = await stripeInstance.confirmPayment({
      elements: stripeElements,
      confirmParams: {
        return_url:    `${window.location.origin}/order-confirmed`,
        receipt_email: email,
      },
    });

    if (error) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent   = error.message || 'Payment failed. Please try again.';
      }
      const total = document.getElementById('co-total')?.textContent || '';
      if (textEl)    textEl.textContent       = `Pay ${total}`;
      if (spinnerEl) spinnerEl.style.display  = 'none';
      payBtn.disabled = false;
    }
  });
}

/* ─── INIT ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadPromos();

  renderSummary();
  initAccordion();
  initPostcodeChecker();
  initDeliveryToggle();
  initPromoCode();
  initPayButton();
  initStudentDiscount();
  initLoyaltyPoints();

  document.querySelectorAll('input[name="delivery"]').forEach(r => {
    r.addEventListener('change', updateDeliveryTotal);
  });
});
