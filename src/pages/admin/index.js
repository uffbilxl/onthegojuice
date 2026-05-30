import { useState } from 'react';
import Head from 'next/head';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const FULFILLMENT_LABELS = {
  processing: 'Processing',
  out_for_delivery: 'Out for Delivery / Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLOURS = {
  processing:       { bg: '#fef9c3', text: '#854d0e' },
  out_for_delivery: { bg: '#dbeafe', text: '#1d4ed8' },
  completed:        { bg: '#dcfce7', text: '#15803d' },
  cancelled:        { bg: '#fee2e2', text: '#b91c1c' },
};

export default function AdminPage({ orders: initialOrders, authorized }) {
  const [orders, setOrders] = useState(initialOrders);
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  if (!authorized) {
    return (
      <>
        <Head><title>Admin Login – On The Go Juice</title></Head>
        <AdminStyles />
        <div className="adm-login-wrap">
          <div className="adm-login-card">
            <div className="adm-login-logo">🥤</div>
            <h1>Admin Access</h1>
            <p>On The Go Juice — Operations Dashboard</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginLoading(true);
                setLoginError('');
                const res = await fetch('/api/admin/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: loginPwd }),
                });
                if (res.ok) {
                  window.location.reload();
                } else {
                  setLoginError('Incorrect password.');
                  setLoginLoading(false);
                }
              }}
            >
              <input
                type="password"
                value={loginPwd}
                onChange={(e) => setLoginPwd(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
              {loginError && <p className="adm-login-error">{loginError}</p>}
              <button type="submit" disabled={loginLoading}>
                {loginLoading ? 'Checking…' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  async function updateFulfillment(orderId, status) {
    const res = await fetch('/api/admin/update-fulfillment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, fulfillmentStatus: status }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, fulfillment_status: status } : o))
      );
    }
  }

  async function saveNote(orderId, note) {
    const res = await fetch('/api/admin/update-fulfillment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, adminNote: note }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, admin_note: note } : o))
      );
    }
  }

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const pendingDeliveries = orders.filter(
    (o) => o.delivery_method === 'local_delivery' && o.fulfillment_status !== 'completed'
  ).length;

  return (
    <>
      <Head><title>Admin – On The Go Juice</title></Head>
      <AdminStyles />

      <div className="adm-wrap">
        {/* Header */}
        <header className="adm-header">
          <div className="adm-header-inner">
            <div>
              <h1>Operations Dashboard</h1>
              <p>On The Go Juice — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <a href="/" className="adm-back-btn">← Back to Site</a>
          </div>
        </header>

        <div className="adm-inner">
          {/* Stats row */}
          <div className="adm-stats">
            <div className="adm-stat">
              <span className="adm-stat-num">{orders.length}</span>
              <span className="adm-stat-label">Total Orders</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-num">£{totalRevenue.toFixed(2)}</span>
              <span className="adm-stat-label">Revenue</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-num">{pendingDeliveries}</span>
              <span className="adm-stat-label">Pending Deliveries</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-num">
                {orders.filter((o) => o.fulfillment_status === 'completed').length}
              </span>
              <span className="adm-stat-label">Completed</span>
            </div>
          </div>

          {/* Orders table */}
          {orders.length === 0 ? (
            <div className="adm-empty">No orders yet. They will appear here after Stripe payment confirmation.</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Method</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Note for customer</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isDelivery = order.delivery_method === 'local_delivery';
                    const col = STATUS_COLOURS[order.fulfillment_status] || STATUS_COLOURS.processing;
                    return (
                      <tr key={order.id} className={isDelivery ? 'adm-row-delivery' : 'adm-row-pickup'}>
                        <td className="adm-cell-date">
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                          <br />
                          <span className="adm-time">
                            {new Date(order.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td>
                          <strong>{order.customer_name}</strong>
                          <br />
                          <a href={`mailto:${order.customer_email}`} className="adm-email">
                            {order.customer_email}
                          </a>
                          {order.customer_phone && (
                            <>
                              <br />
                              <span className="adm-phone">{order.customer_phone}</span>
                            </>
                          )}
                        </td>
                        <td>
                          <span className={`adm-method-badge adm-method-${isDelivery ? 'delivery' : 'pickup'}`}>
                            {isDelivery ? '🚗 Delivery' : '📍 Pickup'}
                          </span>
                          {isDelivery && order.postcode && (
                            <div className="adm-postcode">{order.postcode}</div>
                          )}
                          {isDelivery && order.shipping_address && (
                            <div className="adm-address">{order.shipping_address}</div>
                          )}
                        </td>
                        <td>
                          <ul className="adm-items">
                            {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                              <li key={i}>
                                {item.qty}× {item.name || item.n}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="adm-cell-total">£{Number(order.total_amount).toFixed(2)}</td>
                        <td>
                          <span
                            className="adm-payment-badge"
                            style={{
                              background: order.payment_status === 'paid' ? '#dcfce7' : '#fee2e2',
                              color: order.payment_status === 'paid' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={order.fulfillment_status}
                            onChange={(e) => updateFulfillment(order.id, e.target.value)}
                            style={{ background: col.bg, color: col.text }}
                            className="adm-status-select"
                          >
                            {Object.entries(FULFILLMENT_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <NoteCell order={order} onSave={saveNote} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const cookie = req.cookies?.otgj_admin;
  if (cookie !== process.env.ADMIN_PASSWORD) {
    return { props: { orders: [], authorized: false } };
  }

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin] Supabase fetch error:', error);
    return { props: { orders: [], authorized: true } };
  }

  return { props: { orders: orders ?? [], authorized: true } };
}

function NoteCell({ order, onSave }) {
  const [text, setText] = useState(order.admin_note || '');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await onSave(order.id, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="adm-note-cell">
      <textarea
        className="adm-note-input"
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        placeholder="e.g. Delivering Thursday 3–5pm"
        rows={2}
      />
      <button
        className={`adm-note-save${saved ? ' adm-note-saved' : ''}`}
        onClick={handleSave}
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  );
}

function AdminStyles() {
  return (
    <style jsx global>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --green: #1d6c00; --green-dark: #154f00; --orange: #ff6b00;
        --black: #111; --white: #fff; --off-white: #f9f6f1;
        --grey: #6b7280; --grey-light: #f3f4f6;
        --font-main: 'Poppins', sans-serif; --font-accent: 'Montserrat', sans-serif;
      }
      body { font-family: var(--font-main); background: var(--off-white); color: var(--black); -webkit-font-smoothing: antialiased; }
      a { text-decoration: none; color: inherit; }

      /* Login */
      .adm-login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .adm-login-card { background: #fff; border-radius: 20px; padding: 48px 40px; max-width: 400px; width: 100%; box-shadow: 0 8px 40px rgba(0,0,0,0.1); text-align: center; }
      .adm-login-logo { font-size: 3rem; margin-bottom: 16px; }
      .adm-login-card h1 { font-family: var(--font-accent); font-size: 1.6rem; font-weight: 900; margin-bottom: 8px; }
      .adm-login-card p { color: var(--grey); font-size: 0.88rem; margin-bottom: 28px; }
      .adm-login-card input { width: 100%; padding: 14px 18px; border: 2px solid #e5e7eb; border-radius: 10px; font-family: var(--font-main); font-size: 0.95rem; outline: none; margin-bottom: 12px; transition: border-color 0.2s; }
      .adm-login-card input:focus { border-color: var(--green); }
      .adm-login-card button { width: 100%; padding: 14px; background: var(--green); color: #fff; font-family: var(--font-accent); font-weight: 700; font-size: 0.95rem; border: none; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
      .adm-login-card button:hover { background: var(--green-dark); }
      .adm-login-card button:disabled { opacity: 0.65; cursor: not-allowed; }
      .adm-login-error { color: #b91c1c; font-size: 0.82rem; margin-bottom: 10px; }

      /* Dashboard */
      .adm-wrap { min-height: 100vh; }
      .adm-header { background: var(--black); color: #fff; padding: 20px 4vw; }
      .adm-header-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .adm-header h1 { font-family: var(--font-accent); font-size: 1.4rem; font-weight: 900; }
      .adm-header p { font-size: 0.82rem; color: rgba(255,255,255,0.5); margin-top: 2px; }
      .adm-back-btn { padding: 8px 20px; background: rgba(255,255,255,0.1); color: #fff; border-radius: 999px; font-size: 0.82rem; transition: background 0.2s; white-space: nowrap; }
      .adm-back-btn:hover { background: rgba(255,255,255,0.2); }

      .adm-inner { max-width: 1400px; margin: 0 auto; padding: 32px 4vw 60px; }

      /* Stats */
      .adm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
      .adm-stat { background: #fff; border-radius: 14px; padding: 22px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
      .adm-stat-num { display: block; font-family: var(--font-accent); font-size: 1.9rem; font-weight: 900; color: var(--green); margin-bottom: 4px; }
      .adm-stat-label { font-size: 0.78rem; color: var(--grey); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }

      /* Table */
      .adm-table-wrap { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow-x: auto; }
      .adm-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      .adm-table thead { background: var(--off-white); }
      .adm-table th { padding: 14px 16px; text-align: left; font-family: var(--font-accent); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--grey); white-space: nowrap; }
      .adm-table td { padding: 14px 16px; border-top: 1px solid #f3f4f6; vertical-align: top; }
      .adm-table tr:hover td { background: #fafafa; }

      /* Row highlight: delivery = subtle orange tint, pickup = subtle green */
      .adm-row-delivery td:first-child { border-left: 3px solid var(--orange); }
      .adm-row-pickup td:first-child { border-left: 3px solid var(--green); }

      .adm-cell-date { white-space: nowrap; font-weight: 600; font-size: 0.82rem; }
      .adm-time { font-weight: 400; color: var(--grey); font-size: 0.75rem; }
      .adm-email { color: var(--green); font-size: 0.8rem; }
      .adm-phone { color: var(--grey); font-size: 0.78rem; }

      .adm-method-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
      .adm-method-delivery { background: #fff7ed; color: #c2410c; }
      .adm-method-pickup { background: #f0fdf4; color: #15803d; }
      .adm-postcode { font-size: 0.78rem; font-weight: 700; margin-top: 4px; color: var(--black); }
      .adm-address { font-size: 0.72rem; color: var(--grey); margin-top: 2px; max-width: 160px; }

      .adm-items { list-style: none; font-size: 0.8rem; color: var(--grey); }
      .adm-items li { margin-bottom: 2px; }
      .adm-cell-total { font-weight: 700; font-family: var(--font-accent); color: var(--green); white-space: nowrap; }

      .adm-payment-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; }

      .adm-status-select { padding: 6px 10px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: var(--font-main); font-size: 0.78rem; font-weight: 600; cursor: pointer; width: 100%; min-width: 180px; outline: none; transition: border-color 0.2s; }
      .adm-status-select:focus { border-color: var(--green); }

      .adm-empty { padding: 60px; text-align: center; color: var(--grey); background: #fff; border-radius: 16px; }

      .adm-note-cell { display: flex; flex-direction: column; gap: 6px; min-width: 200px; }
      .adm-note-input { width: 100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: var(--font-main); font-size: 0.78rem; resize: vertical; outline: none; transition: border-color 0.2s; }
      .adm-note-input:focus { border-color: var(--green); }
      .adm-note-save { align-self: flex-start; padding: 5px 14px; background: var(--green); color: #fff; border: none; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; font-family: var(--font-main); transition: background 0.2s; }
      .adm-note-save:hover { background: var(--green-dark); }
      .adm-note-saved { background: #15803d; }

      @media (max-width: 900px) {
        .adm-stats { grid-template-columns: repeat(2, 1fr); }
        .adm-header-inner { flex-direction: column; align-items: flex-start; }
      }
      @media (max-width: 560px) {
        .adm-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
        .adm-login-card { padding: 36px 24px; }
      }
    `}</style>
  );
}
