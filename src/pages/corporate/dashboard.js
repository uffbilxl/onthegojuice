import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function CorporateDashboard() {
  const router = useRouter();

  const [profile,   setProfile]   = useState(null);   // { email, company_name }
  const [products,  setProducts]  = useState([]);
  const [qtys,      setQtys]      = useState({});      // { [productId]: qty }
  const [loading,   setLoading]   = useState(true);
  const [placing,   setPlacing]   = useState(false);
  const [error,     setError]     = useState('');
  const [authToken, setAuthToken] = useState('');

  const guardAndLoad = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.replace('/corporate/login');
      return;
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('role, company_name')
      .eq('id', session.user.id)
      .single();

    if (!prof || prof.role !== 'corporate') {
      await supabase.auth.signOut();
      router.replace('/corporate/login');
      return;
    }

    setProfile({ email: session.user.email, company_name: prof.company_name });
    setAuthToken(session.access_token);

    // Fetch products with wholesale pricing
    const res = await fetch('/api/corporate/products', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      setError('Failed to load products. Please refresh.');
      setLoading(false);
      return;
    }

    const data = await res.json();
    setProducts(data);
    // Default qty 0 for each product
    const initial = {};
    data.forEach(p => { initial[p.id] = 0; });
    setQtys(initial);
    setLoading(false);
  }, [router]);

  useEffect(() => { guardAndLoad(); }, [guardAndLoad]);

  async function handleLogout() {
    document.cookie = 'otgj_corp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await supabase.auth.signOut();
    router.replace('/corporate/login');
  }

  function setQty(id, raw) {
    const v = Math.max(0, Math.min(1000, parseInt(raw) || 0));
    setQtys(prev => ({ ...prev, [id]: v }));
  }

  const orderLines = products.filter(p => (qtys[p.id] || 0) > 0).map(p => ({
    id:           p.id,
    name:         p.name,
    qty:          qtys[p.id],
    unitPence:    p.wholesale_price_pence,
    totalPence:   p.wholesale_price_pence * qtys[p.id],
  }));

  const grandTotalPence = orderLines.reduce((s, l) => s + l.totalPence, 0);
  const grandTotalBottles = orderLines.reduce((s, l) => s + l.qty, 0);

  async function placeOrder() {
    if (orderLines.length === 0) {
      setError('Add at least one product to your order.');
      return;
    }
    setError(''); setPlacing(true);

    try {
      // Always fetch a fresh token — stored token may have expired
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) {
        router.replace('/corporate/login');
        return;
      }
      const freshToken = freshSession.access_token;

      const res = await fetch('/api/corporate/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({
          items: orderLines.map(l => ({ id: l.id, qty: l.qty })),
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.replace('/corporate/login');
        return;
      }

      if (!res.ok || !data.url) {
        setError(data.error || 'Checkout failed — please try again or contact support.');
        setPlacing(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[corporate/placeOrder]', err.message);
      setError('Network error. Please check your connection and try again.');
      setPlacing(false);
    }
  }

  if (loading) return <LoadingScreen />;

  const categories = [...new Set(products.map(p => p.category || 'Other'))].sort();

  return (
    <>
      <Head>
        <title>Wholesale Dashboard – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <DashStyles />

      {/* Header */}
      <header className="cd-header">
        <div className="cd-header-left">
          <a href="/" className="cd-logo">On The Go Juice</a>
          <span className="cd-portal-badge">CORPORATE PORTAL</span>
        </div>
        <div className="cd-header-right">
          <span className="cd-user-email">{profile?.company_name || profile?.email}</span>
          <button className="cd-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <main className="cd-main">
        {/* Page title */}
        <div className="cd-page-title">
          <div>
            <h1 className="cd-h1">Wholesale Order</h1>
            <p className="cd-subtitle">Wholesale pricing applied automatically — no codes needed.</p>
          </div>
          <div className="cd-wholesale-pill">
            <span className="cd-pill-dot" />
            Wholesale Pricing Active
          </div>
        </div>

        {error && (
          <div className="cd-alert" ref={el => el?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            {error}
          </div>
        )}

        {/* Products table by category */}
        {categories.map(cat => {
          const catProducts = products.filter(p => (p.category || 'Other') === cat);
          return (
            <section key={cat} className="cd-section">
              <h2 className="cd-section-title">{cat}</h2>
              <div className="cd-table-wrap">
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th className="cd-th cd-th-name">Product</th>
                      <th className="cd-th cd-th-price">Retail</th>
                      <th className="cd-th cd-th-price">Wholesale</th>
                      <th className="cd-th cd-th-save">Saving</th>
                      <th className="cd-th cd-th-qty">Qty</th>
                      <th className="cd-th cd-th-total">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catProducts.map(p => {
                      const q     = qtys[p.id] || 0;
                      const save  = p.price_pence - p.wholesale_price_pence;
                      const savePct = Math.round((save / p.price_pence) * 100);
                      return (
                        <tr key={p.id} className={`cd-tr${q > 0 ? ' cd-tr--active' : ''}`}>
                          <td className="cd-td cd-td-name">{p.name}</td>
                          <td className="cd-td cd-td-price cd-retail">£{(p.price_pence / 100).toFixed(2)}</td>
                          <td className="cd-td cd-td-price cd-wholesale">£{(p.wholesale_price_pence / 100).toFixed(2)}</td>
                          <td className="cd-td">
                            <span className="cd-save-badge">-{savePct}%</span>
                          </td>
                          <td className="cd-td cd-td-qty">
                            <div className="cd-qty-wrap">
                              <button
                                className="cd-qty-btn"
                                onClick={() => setQty(p.id, q - 1)}
                                disabled={q === 0}
                              >−</button>
                              <input
                                className="cd-qty-input"
                                type="number" min="0" value={q}
                                onChange={e => setQty(p.id, e.target.value)}
                              />
                              <button
                                className="cd-qty-btn"
                                onClick={() => setQty(p.id, q + 1)}
                              >+</button>
                            </div>
                          </td>
                          <td className="cd-td cd-td-total">
                            {q > 0
                              ? <span className="cd-line-total">£{((p.wholesale_price_pence * q) / 100).toFixed(2)}</span>
                              : <span className="cd-line-empty">—</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        {/* Order summary */}
        <div className="cd-summary-card">
          <h2 className="cd-summary-title">Order Summary</h2>
          {orderLines.length === 0 ? (
            <p className="cd-summary-empty">No items selected. Add quantities above to build your order.</p>
          ) : (
            <>
              <div className="cd-summary-lines">
                {orderLines.map(l => (
                  <div key={l.id} className="cd-summary-line">
                    <span className="cd-summary-name">{l.name} ×{l.qty}</span>
                    <span className="cd-summary-amt">£{(l.totalPence / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="cd-summary-divider" />
              <div className="cd-summary-total-row">
                <span className="cd-summary-total-label">
                  Total ({grandTotalBottles} bottle{grandTotalBottles !== 1 ? 's' : ''})
                </span>
                <span className="cd-summary-total-amt">£{(grandTotalPence / 100).toFixed(2)}</span>
              </div>
            </>
          )}

          <button
            className="cd-place-btn"
            onClick={placeOrder}
            disabled={placing || orderLines.length === 0}
            style={{ opacity: (placing || orderLines.length === 0) ? 0.55 : 1 }}
          >
            {placing ? 'Redirecting to payment…' : 'Proceed to Secure Checkout →'}
          </button>

          <p className="cd-summary-note">
            Wholesale prices shown. All orders include VAT where applicable.
            Delivery charges will be calculated at checkout based on your location.
          </p>
        </div>
      </main>
    </>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f6f1', fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#0a2800', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DashStyles() {
  return (
    <style jsx global>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Poppins', sans-serif; background: #f9f6f1; color: #111; -webkit-font-smoothing: antialiased; }

      /* Header */
      .cd-header {
        background: #0a2800; padding: 16px 5vw;
        display: flex; align-items: center; justify-content: space-between;
        position: sticky; top: 0; z-index: 100;
        box-shadow: 0 2px 12px rgba(0,0,0,0.25);
      }
      .cd-header-left { display: flex; align-items: center; gap: 14px; }
      .cd-logo {
        font-family: 'Montserrat',sans-serif; font-weight: 900; font-size: 1.1rem;
        color: #fff; text-decoration: none; letter-spacing: -0.02em;
      }
      .cd-portal-badge {
        background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7);
        font-size: 0.62rem; font-weight: 700; letter-spacing: 0.14em;
        padding: 3px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15);
      }
      .cd-header-right { display: flex; align-items: center; gap: 16px; }
      .cd-user-email { color: rgba(255,255,255,0.55); font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .cd-logout {
        background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
        color: rgba(255,255,255,0.75); padding: 7px 16px; border-radius: 8px;
        font-family: 'Poppins',sans-serif; font-size: 0.8rem; font-weight: 600;
        cursor: pointer; transition: background 0.15s;
      }
      .cd-logout:hover { background: rgba(255,255,255,0.14); }

      /* Main */
      .cd-main { max-width: 1100px; margin: 0 auto; padding: 36px 5vw 60px; }

      .cd-page-title {
        display: flex; align-items: flex-start; justify-content: space-between;
        flex-wrap: wrap; gap: 14px; margin-bottom: 28px;
      }
      .cd-h1 {
        font-family: 'Montserrat',sans-serif; font-weight: 900; font-size: 1.8rem;
        color: #0a2800; letter-spacing: -0.03em;
      }
      .cd-subtitle { color: #6b7280; font-size: 0.875rem; margin-top: 4px; }
      .cd-wholesale-pill {
        display: flex; align-items: center; gap: 8px;
        background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 999px;
        padding: 8px 16px; font-size: 0.78rem; font-weight: 700; color: #166534;
        white-space: nowrap; align-self: flex-start; margin-top: 4px;
      }
      .cd-pill-dot {
        width: 8px; height: 8px; background: #22c55e;
        border-radius: 50%; flex-shrink: 0;
        box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
        animation: pulse 2s ease-in-out infinite;
      }
      @keyframes pulse {
        0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
        50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
      }

      .cd-alert {
        background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
        border-radius: 10px; padding: 12px 16px; font-size: 0.875rem;
        margin-bottom: 20px; line-height: 1.5;
      }

      /* Section */
      .cd-section { margin-bottom: 32px; }
      .cd-section-title {
        font-family: 'Montserrat',sans-serif; font-weight: 800; font-size: 1rem;
        color: #374151; text-transform: uppercase; letter-spacing: 0.08em;
        margin-bottom: 12px; padding-bottom: 8px;
        border-bottom: 2px solid #e5e7eb;
      }
      .cd-table-wrap { overflow-x: auto; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
      .cd-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden; }

      .cd-th {
        background: #f9fafb; padding: 11px 14px; text-align: left;
        font-size: 0.72rem; font-weight: 700; color: #6b7280;
        text-transform: uppercase; letter-spacing: 0.08em;
        border-bottom: 1.5px solid #f3f4f6; white-space: nowrap;
      }
      .cd-th-name  { width: 35%; }
      .cd-th-price { width: 10%; }
      .cd-th-save  { width: 8%; }
      .cd-th-qty   { width: 15%; }
      .cd-th-total { width: 12%; text-align: right; }

      .cd-tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
      .cd-tr:last-child { border-bottom: none; }
      .cd-tr:hover { background: #fafafa; }
      .cd-tr--active { background: #f0fdf4 !important; }

      .cd-td { padding: 13px 14px; font-size: 0.875rem; color: #374151; vertical-align: middle; }
      .cd-td-name { font-weight: 600; color: #111; }
      .cd-retail { color: #9ca3af; text-decoration: line-through; font-size: 0.82rem; }
      .cd-wholesale { font-weight: 700; color: #166534; }
      .cd-save-badge {
        display: inline-block; background: #dcfce7; color: #166534;
        font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;
      }

      .cd-td-qty { padding: 10px 14px; }
      .cd-qty-wrap { display: flex; align-items: center; gap: 6px; }
      .cd-qty-btn {
        width: 30px; height: 30px; background: #f3f4f6; border: 1.5px solid #e5e7eb;
        border-radius: 8px; font-size: 1rem; font-weight: 700; color: #374151;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.15s; padding: 0; line-height: 1;
      }
      .cd-qty-btn:hover:not(:disabled) { background: #e5e7eb; }
      .cd-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .cd-qty-input {
        width: 48px; padding: 6px 8px; border: 1.5px solid #e5e7eb; border-radius: 8px;
        text-align: center; font-family: 'Montserrat',sans-serif; font-weight: 700;
        font-size: 0.9rem; outline: none;
      }
      .cd-qty-input:focus { border-color: #0a2800; }
      .cd-qty-input::-webkit-inner-spin-button,
      .cd-qty-input::-webkit-outer-spin-button { -webkit-appearance: none; }

      .cd-td-total { text-align: right; }
      .cd-line-total { font-family: 'Montserrat',sans-serif; font-weight: 800; color: #0a2800; font-size: 0.95rem; }
      .cd-line-empty { color: #d1d5db; }

      /* Summary */
      .cd-summary-card {
        background: #fff; border-radius: 16px; padding: 32px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        max-width: 540px; margin-left: auto;
      }
      .cd-summary-title {
        font-family: 'Montserrat',sans-serif; font-weight: 900; font-size: 1.2rem;
        color: #0a2800; margin-bottom: 20px;
      }
      .cd-summary-empty { color: #9ca3af; font-size: 0.875rem; margin-bottom: 24px; }
      .cd-summary-lines { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
      .cd-summary-line { display: flex; justify-content: space-between; align-items: baseline; }
      .cd-summary-name { font-size: 0.875rem; color: #374151; }
      .cd-summary-amt  { font-family: 'Montserrat',sans-serif; font-weight: 700; color: #111; font-size: 0.9rem; }
      .cd-summary-divider { border: none; border-top: 1.5px solid #f3f4f6; margin: 16px 0; }
      .cd-summary-total-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; }
      .cd-summary-total-label { font-weight: 700; color: #111; font-size: 0.95rem; }
      .cd-summary-total-amt   { font-family: 'Montserrat',sans-serif; font-weight: 900; font-size: 1.4rem; color: #0a2800; }

      .cd-place-btn {
        width: 100%; padding: 15px; background: #0a2800; color: #fff;
        border: none; border-radius: 12px; font-family: 'Montserrat',sans-serif;
        font-weight: 800; font-size: 1rem; cursor: pointer;
        transition: background 0.2s, opacity 0.2s; margin-bottom: 14px;
      }
      .cd-place-btn:hover:not(:disabled) { background: #154f00; }

      .cd-summary-note { font-size: 0.75rem; color: #9ca3af; line-height: 1.6; }

      @media (max-width: 640px) {
        .cd-page-title { flex-direction: column; }
        .cd-th-save { display: none; }
        .cd-td:nth-child(4) { display: none; }
        .cd-summary-card { max-width: 100%; }
        .cd-user-email { display: none; }
      }
    `}</style>
  );
}
