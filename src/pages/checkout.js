import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/checkout.module.css';

// ── Postcode validation: must start with B + digit (Birmingham) ──
function isBirminghamPostcode(postcode) {
  return /^B\d/i.test(postcode.trim());
}

const SECTION = { CONTACT: 'contact', DELIVERY: 'delivery', ADDRESS: 'address' };

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [openSection, setOpenSection] = useState(SECTION.CONTACT);
  const [doneSection, setDoneSection] = useState([]);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [deliveryMethod, setDeliveryMethod] = useState('local_delivery');

  const [postcode, setPostcode] = useState('');
  const [postcodeError, setPostcodeError] = useState('');

  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('Birmingham');

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // ── Read cart from localStorage (same key used by the static site) ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem('otgj_cart');
      setCart(stored ? JSON.parse(stored) : []);
    } catch {
      setCart([]);
    }
  }, []);

  // ── Totals ──
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee =
    deliveryMethod === 'local_delivery' && subtotal < 10 ? 1.5 : 0;
  const total = subtotal + deliveryFee;

  // ── Accordion helpers ──
  function advanceTo(next) {
    setDoneSection((prev) =>
      prev.includes(openSection) ? prev : [...prev, openSection]
    );
    setOpenSection(next);
  }

  function reopenSection(id) {
    setDoneSection((prev) => prev.filter((s) => s !== id));
    setOpenSection(id);
  }

  // ── Place order ──
  async function handleCheckout() {
    if (cart.length === 0) return;
    setCheckoutError('');

    // Validate postcode for delivery
    if (deliveryMethod === 'local_delivery') {
      if (!postcode.trim()) {
        setPostcodeError('Please enter your postcode.');
        setOpenSection(SECTION.DELIVERY);
        return;
      }
      if (!isBirminghamPostcode(postcode)) {
        setPostcodeError(
          "Sorry! We only offer local delivery within the Birmingham area. You can still switch your option to Local Pickup."
        );
        setOpenSection(SECTION.DELIVERY);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          email,
          phone,
          deliveryMethod,
          address:
            deliveryMethod === 'local_delivery'
              ? { line1: address1, line2: address2, city, postcode }
              : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not create checkout session');
      }

      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Checkout – On The Go Juice</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <header className="co-header">
        <Link href="/" className="co-logo">
          <img
            src="/images/logo.png"
            alt="On The Go Juice"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className="co-logo-text" style={{ display: 'none' }}>
            On The Go Juice
          </span>
        </Link>
        <Link href="/" className="co-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Continue Shopping
        </Link>
      </header>

      <main className="co-page">
        {/* ── LEFT: FORM ── */}
        <div className="co-form-col">
          <h1 className="co-title">Checkout</h1>

          {/* SECTION 1: Contact */}
          <Section
            id={SECTION.CONTACT}
            num={1}
            title="Contact Information"
            open={openSection === SECTION.CONTACT}
            done={doneSection.includes(SECTION.CONTACT)}
            onReopen={() => reopenSection(SECTION.CONTACT)}
          >
            <div className="field-grid">
              <FloatLabel id="first-name" label="First Name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
              <FloatLabel id="last-name" label="Last Name" value={lastName} onChange={setLastName} autoComplete="family-name" />
            </div>
            <FloatLabel id="email" type="email" label="Email Address" value={email} onChange={setEmail} autoComplete="email" />
            <FloatLabel id="phone" type="tel" label="Phone Number" value={phone} onChange={setPhone} autoComplete="tel" />
            <button className="co-next-btn" onClick={() => advanceTo(SECTION.DELIVERY)}>
              Continue to Delivery
            </button>
          </Section>

          {/* SECTION 2: Delivery Method */}
          <Section
            id={SECTION.DELIVERY}
            num={2}
            title="Delivery Method"
            open={openSection === SECTION.DELIVERY}
            done={doneSection.includes(SECTION.DELIVERY)}
            onReopen={() => reopenSection(SECTION.DELIVERY)}
          >
            <div className="delivery-options">
              <label className={`delivery-option${deliveryMethod === 'local_delivery' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="local_delivery"
                  checked={deliveryMethod === 'local_delivery'}
                  onChange={() => { setDeliveryMethod('local_delivery'); setPostcodeError(''); }}
                />
                <div>
                  <div className="delivery-option-label">Local Delivery — Delivered by David</div>
                  <div className="delivery-option-sub">
                    Personal delivery within the Birmingham area.
                    {subtotal < 10 ? ' +£1.50 delivery fee (free over £10).' : ' Free delivery!'}
                  </div>
                </div>
              </label>

              <label className={`delivery-option${deliveryMethod === 'pickup' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => { setDeliveryMethod('pickup'); setPostcodeError(''); }}
                />
                <div>
                  <div className="delivery-option-label">Local Pickup — Free</div>
                  <div className="delivery-option-sub">
                    Collect from our Birmingham City Centre pickup point.
                  </div>
                </div>
              </label>
            </div>

            {/* Postcode checker (delivery only) */}
            {deliveryMethod === 'local_delivery' && (
              <div className="postcode-wrap">
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 10 }}>
                  Enter your postcode to confirm we deliver to your area:
                </p>
                <div className="postcode-row">
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => { setPostcode(e.target.value.toUpperCase()); setPostcodeError(''); }}
                    placeholder="e.g. B1 1BB"
                    maxLength={8}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <button
                    className="postcode-check-btn"
                    type="button"
                    onClick={() => {
                      if (!postcode.trim()) { setPostcodeError('Please enter a postcode.'); return; }
                      if (!isBirminghamPostcode(postcode)) {
                        setPostcodeError("Sorry! We only offer local delivery within the Birmingham area. You can still switch your option to Local Pickup.");
                      } else {
                        setPostcodeError('');
                      }
                    }}
                  >
                    Check
                  </button>
                </div>
                {postcodeError && (
                  <div className="postcode-result invalid" style={{ display: 'block' }}>
                    {postcodeError}
                  </div>
                )}
                {!postcodeError && postcode && isBirminghamPostcode(postcode) && (
                  <div className="postcode-result valid" style={{ display: 'block' }}>
                    Great news — we deliver to your area!
                  </div>
                )}
              </div>
            )}

            {/* Pickup address notice */}
            {deliveryMethod === 'pickup' && (
              <div className="pickup-address" style={{ display: 'block' }}>
                <strong>Pickup Address</strong><br />
                On The Go Juice Pickup Point<br />
                Birmingham City Centre, Birmingham, B1 1BB<br /><br />
                David will confirm the exact pickup location and available times by email after your order.
              </div>
            )}

            <button
              className="co-next-btn"
              style={{ marginTop: 20 }}
              onClick={() => {
                if (deliveryMethod === 'local_delivery') {
                  if (!postcode.trim()) { setPostcodeError('Please enter your postcode.'); return; }
                  if (!isBirminghamPostcode(postcode)) {
                    setPostcodeError("Sorry! We only offer local delivery within the Birmingham area. You can still switch your option to Local Pickup.");
                    return;
                  }
                  advanceTo(SECTION.ADDRESS);
                } else {
                  // Pickup: skip address section, go straight to placing order
                  setDoneSection((prev) => [...prev.filter(s => s !== SECTION.DELIVERY), SECTION.DELIVERY]);
                  setOpenSection(null);
                }
              }}
            >
              {deliveryMethod === 'local_delivery' ? 'Continue to Address' : 'Review & Place Order'}
            </button>
          </Section>

          {/* SECTION 3: Address (delivery only) */}
          {deliveryMethod === 'local_delivery' && (
            <Section
              id={SECTION.ADDRESS}
              num={3}
              title="Delivery Address"
              open={openSection === SECTION.ADDRESS}
              done={doneSection.includes(SECTION.ADDRESS)}
              onReopen={() => reopenSection(SECTION.ADDRESS)}
            >
              <FloatLabel id="address1" label="Address Line 1" value={address1} onChange={setAddress1} autoComplete="address-line1" />
              <FloatLabel id="address2" label="Address Line 2 (optional)" value={address2} onChange={setAddress2} autoComplete="address-line2" />
              <div className="field-grid">
                <FloatLabel id="city" label="City" value={city} onChange={setCity} autoComplete="address-level2" />
                <FloatLabel id="postcode-addr" label="Postcode" value={postcode} onChange={(v) => { setPostcode(v.toUpperCase()); }} autoComplete="postal-code" />
              </div>
              <button
                className="co-next-btn"
                onClick={() => {
                  setDoneSection((prev) => [...prev.filter(s => s !== SECTION.ADDRESS), SECTION.ADDRESS]);
                  setOpenSection(null);
                }}
              >
                Review &amp; Place Order
              </button>
            </Section>
          )}

          {checkoutError && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fee2e2', borderRadius: 10, color: '#b91c1c', fontSize: '0.88rem' }}>
              {checkoutError}
            </div>
          )}
        </div>

        {/* ── RIGHT: ORDER SUMMARY ── */}
        <div className="co-summary">
          <div className="co-summary-card">
            <div className="co-summary-head">Order Summary</div>
            <div className="co-summary-items">
              {cart.length === 0 ? (
                <div className="co-summary-empty">
                  Your cart is empty.{' '}
                  <a href="/" style={{ color: 'var(--green)' }}>Shop now</a>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="co-summary-item">
                    <img
                      className="co-summary-item-img"
                      src={item.image}
                      alt={item.name}
                      onError={(e) => { e.target.src = '/images/products/placeholder.jpg'; }}
                    />
                    <div className="co-summary-item-info">
                      <p className="co-summary-item-name">{item.name}</p>
                      <p className="co-summary-item-qty">Qty: {item.qty}</p>
                    </div>
                    <span className="co-summary-item-price">
                      £{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="co-summary-totals">
              <div className="co-summary-row">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="co-summary-row">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? 'Free' : `£${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="co-summary-row total">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <button
                className={`co-place-btn${loading ? ' loading' : ''}`}
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
              >
                <span className="btn-text">
                  {cart.length === 0 ? 'Cart is Empty' : 'Pay with Stripe'}
                </span>
                <span className="btn-spinner" />
                <span className="btn-check">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </button>
              <p className="co-note">
                By placing your order you agree to our{' '}
                <a href="/terms-conditions.html" style={{ color: 'var(--green)' }}>
                  Terms &amp; Conditions
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('/css/checkout-next.css');
        .delivery-option.selected {
          border-color: var(--green);
          background: rgba(29,108,0,0.03);
        }
      `}</style>
    </>
  );
}

// ── Reusable accordion section ──────────────────────────────────
function Section({ id, num, title, open, done, onReopen, children }) {
  return (
    <div className={`co-section${open ? ' open' : ''}${done ? ' done' : ''}`} id={id}>
      <div className="co-section-head" onClick={done ? onReopen : undefined}>
        <div className="co-section-label">
          <span className="co-section-num">{num}</span>
          {title}
        </div>
        <svg className="co-section-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="co-section-body">
        <div className="co-section-content">{children}</div>
      </div>
    </div>
  );
}

// ── Floating label input ────────────────────────────────────────
function FloatLabel({ id, label, value, onChange, type = 'text', autoComplete }) {
  return (
    <div className={`field-wrap${value ? ' has-value' : ''}`}>
      <input
        id={id}
        type={type}
        placeholder=" "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
