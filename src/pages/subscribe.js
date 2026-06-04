import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Mirrors the image paths from js/main.js PRODUCT_STATIC
const PRODUCT_IMAGES = {
  1:  '/images/products/carrot-milk-no-sugar.png',
  2:  '/images/products/carrot-beetroot-milk-no-sugar.png',
  3:  '/images/products/mango-milk.png',
  4:  '/images/products/carrot-beetroot-milk-lactose-free.png',
  5:  '/images/products/carrot-beetroot-milk.png',
  6:  '/images/products/mango-ginger.png',
  7:  '/images/products/carrot-milk-lactose-free.png',
  8:  '/images/products/sorrel.png',
  10: '/images/products/carrot-lemon.png',
  11: '/images/products/breadfruit-milk.png',
  12: '/images/products/carrot-grapefruit.png',
  13: '/images/products/carrot-ginger.png',
  14: '/images/products/beetroot-apple.png',
  15: '/images/products/beetroot-milk.png',
  16: '/images/products/carrot-lime.png',
  19: '/images/products/carrot-milk.png',
};

const GREEN   = '#1d6c00';
const ORANGE  = '#ff6b00';
const OFFWHITE = '#f9f6f1';

export default function SubscribePage() {
  const router = useRouter();
  const { interval, qty: qtyParam } = router.query;

  const qty           = Math.max(1, parseInt(qtyParam) || 1);
  const intervalLabel = interval === 'week' ? 'Weekly' : 'Monthly';

  const [products,   setProducts]   = useState([]);
  const [selections, setSelections] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const totalSelected = Object.values(selections).reduce((s, n) => s + n, 0);
  const remaining     = qty - totalSelected;
  const isComplete    = totalSelected === qty;

  useEffect(() => {
    fetch('/api/products-public')
      .then(r => r.json())
      .then(data => {
        setProducts((data || []).filter(p => p.category !== 'shot'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function adjust(id, delta) {
    if (delta > 0 && totalSelected >= qty) {
      setError(`You can only select ${qty} bottle${qty !== 1 ? 's' : ''} in total.`);
      return;
    }
    setError('');
    setSelections(prev => {
      const current = prev[id] || 0;
      const next    = Math.max(0, current + delta);
      if (next === 0) {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      }
      return { ...prev, [id]: next };
    });
  }

  async function handleCheckout() {
    if (!isComplete) {
      setError(`Please select exactly ${qty} bottle${qty !== 1 ? 's' : ''} to continue.`);
      return;
    }
    setSubmitting(true);
    setError('');

    // Build human-readable flavors list for Stripe metadata
    const flavors = Object.entries(selections)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => {
        const product = products.find(p => String(p.id) === String(id));
        return { name: product?.name || 'Item', count };
      });

    try {
      const res  = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ interval, quantity: qty, flavors }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  // Don't render until query params are available
  if (!router.isReady) return null;

  return (
    <>
      <Head>
        <title>Customise Your Box – On The Go Juice</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Poppins', sans-serif" }}>

        {/* Header */}
        <header style={{
          background: '#0a2800', padding: '0 6vw', height: 68,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Link href="/" style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            On The Go Juice
          </Link>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Shop
          </Link>
        </header>

        {/* Sticky progress bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '14px 6vw', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          position: 'sticky', top: 68, zIndex: 90,
        }}>
          <div>
            <p style={{ margin: 0, fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: '1rem', color: '#0a2800' }}>
              {intervalLabel} Box — {qty} bottle{qty !== 1 ? 's' : ''}
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
              {isComplete
                ? '✓ Box complete — ready to subscribe!'
                : `Add ${remaining} more bottle${remaining !== 1 ? 's' : ''} to complete your box`}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 140, height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (totalSelected / qty) * 100)}%`, height: '100%', background: isComplete ? GREEN : ORANGE, borderRadius: 999, transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: '0.9rem', color: isComplete ? GREEN : '#374151', whiteSpace: 'nowrap' }}>
              {totalSelected}/{qty}
            </span>
          </div>
        </div>

        {/* Content */}
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '36px 6vw 120px' }}>

          <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#0a2800', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            Choose Your Flavours
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 32px', lineHeight: 1.6 }}>
            Pick exactly {qty} bottle{qty !== 1 ? 's' : ''} for your {intervalLabel.toLowerCase()} delivery. Mix and match as many flavours as you like.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Loading flavours…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {products.map(product => {
                const count    = selections[product.id] || 0;
                const selected = count > 0;
                return (
                  <div key={product.id} style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: `2px solid ${selected ? GREEN : '#e5e7eb'}`,
                    overflow: 'hidden',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: selected ? `0 4px 20px rgba(29,108,0,0.15)` : '0 2px 8px rgba(0,0,0,0.05)',
                  }}>
                    {/* Product image */}
                    <div style={{ position: 'relative', background: '#f0fdf4', padding: 16, textAlign: 'center' }}>
                      <img
                        src={PRODUCT_IMAGES[product.id] || '/images/products/placeholder.jpg'}
                        alt={product.name}
                        style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                        onError={e => { e.target.src = '/images/products/placeholder.jpg'; }}
                      />
                      {count > 0 && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          background: GREEN, color: '#fff',
                          borderRadius: '50%', width: 26, height: 26,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Montserrat',sans-serif", fontWeight: 900, fontSize: '0.82rem',
                        }}>
                          {count}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '12px 14px 14px' }}>
                      <p style={{
                        margin: '0 0 4px',
                        fontFamily: "'Montserrat',sans-serif",
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: '#0a2800',
                        lineHeight: 1.3,
                      }}>
                        {product.name.replace(' Juice Drink', '').replace(' Juice', '')}
                      </p>
                      <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>
                        {product.category}
                      </p>

                      {/* +/- controls */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <button
                          onClick={() => adjust(product.id, -1)}
                          disabled={count === 0}
                          style={{
                            width: 34, height: 34, borderRadius: '50%',
                            border: `1.5px solid ${count > 0 ? GREEN : '#e5e7eb'}`,
                            background: count > 0 ? GREEN : '#fff',
                            color: count > 0 ? '#fff' : '#9ca3af',
                            fontFamily: "'Montserrat',sans-serif",
                            fontWeight: 900, fontSize: '1.1rem',
                            cursor: count > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', flexShrink: 0,
                          }}
                          aria-label={`Remove ${product.name}`}
                        >−</button>

                        <span style={{
                          fontFamily: "'Montserrat',sans-serif",
                          fontWeight: 900,
                          fontSize: '1rem',
                          color: count > 0 ? GREEN : '#d1d5db',
                          minWidth: 20,
                          textAlign: 'center',
                        }}>{count}</span>

                        <button
                          onClick={() => adjust(product.id, 1)}
                          disabled={totalSelected >= qty}
                          style={{
                            width: 34, height: 34, borderRadius: '50%',
                            border: `1.5px solid ${totalSelected < qty ? GREEN : '#e5e7eb'}`,
                            background: totalSelected < qty ? GREEN : '#f9f6f1',
                            color: totalSelected < qty ? '#fff' : '#9ca3af',
                            fontFamily: "'Montserrat',sans-serif",
                            fontWeight: 900, fontSize: '1.1rem',
                            cursor: totalSelected < qty ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', flexShrink: 0,
                          }}
                          aria-label={`Add ${product.name}`}
                        >+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Sticky bottom checkout bar */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #e5e7eb',
          padding: '16px 6vw',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          zIndex: 100,
        }}>
          <div>
            {error && (
              <p style={{ margin: 0, color: '#dc2626', fontSize: '0.84rem', fontWeight: 600 }}>{error}</p>
            )}
            {!error && (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.84rem' }}>
                {isComplete
                  ? `Your ${qty}-bottle ${intervalLabel.toLowerCase()} box is ready.`
                  : `Select ${remaining} more bottle${remaining !== 1 ? 's' : ''} to continue.`}
              </p>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={!isComplete || submitting}
            style={{
              padding: '14px 36px',
              borderRadius: 999,
              border: 'none',
              background: isComplete ? GREEN : '#d1d5db',
              color: '#fff',
              fontFamily: "'Montserrat',sans-serif",
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: isComplete && !submitting ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', gap: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {submitting ? 'Redirecting…' : `Subscribe ${intervalLabel}`}
            {!submitting && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            )}
          </button>
        </div>

      </div>
    </>
  );
}
