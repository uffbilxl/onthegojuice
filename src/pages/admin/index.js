import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const FULFILLMENT_LABELS = {
  processing:       'Processing',
  out_for_delivery: 'Out for Delivery / Ready for Pickup',
  completed:        'Completed',
  cancelled:        'Cancelled',
};

const STATUS_COLOURS = {
  processing:       { bg: '#fef9c3', text: '#854d0e' },
  out_for_delivery: { bg: '#dbeafe', text: '#1d4ed8' },
  completed:        { bg: '#dcfce7', text: '#15803d' },
  cancelled:        { bg: '#fee2e2', text: '#b91c1c' },
};

const PARTNER_STATUS_COLOURS = {
  new:       { bg: '#dbeafe', text: '#1d4ed8' },
  contacted: { bg: '#fef9c3', text: '#854d0e' },
  active:    { bg: '#dcfce7', text: '#15803d' },
  declined:  { bg: '#fee2e2', text: '#b91c1c' },
};

export default function AdminPage({ orders: initialOrders, events: initialEvents, authorized }) {
  const [tab, setTab]       = useState('orders');
  const [orders, setOrders] = useState(initialOrders);
  const [events, setEvents] = useState(initialEvents);
  const [rsvps,  setRsvps]  = useState(null);
  const [partners, setPartners] = useState(null);

  const [loginPwd, setLoginPwd]       = useState('');
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Load RSVPs when tab opens
  useEffect(() => {
    if (tab === 'rsvps' && rsvps === null) {
      fetch('/api/admin/list-rsvps').then(r => r.json()).then(setRsvps).catch(() => setRsvps([]));
    }
    if (tab === 'partners' && partners === null) {
      fetch('/api/admin/list-partners').then(r => r.json()).then(setPartners).catch(() => setPartners([]));
    }
  }, [tab]);

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
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoginLoading(true); setLoginError('');
              const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: loginPwd }),
              });
              if (res.ok) window.location.reload();
              else { setLoginError('Incorrect password.'); setLoginLoading(false); }
            }}>
              <input type="password" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} placeholder="Enter password" autoFocus />
              {loginError && <p className="adm-login-error">{loginError}</p>}
              <button type="submit" disabled={loginLoading}>{loginLoading ? 'Checking…' : 'Log In'}</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  async function updateFulfillment(orderId, status) {
    const res = await fetch('/api/admin/update-fulfillment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, fulfillmentStatus: status }),
    });
    if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, fulfillment_status: status } : o));
  }

  async function saveNote(orderId, note) {
    const res = await fetch('/api/admin/update-fulfillment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, adminNote: note }),
    });
    if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, admin_note: note } : o));
  }

  async function updatePartnerStatus(id, status) {
    await fetch('/api/admin/list-partners', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }

  const totalRevenue      = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0);
  const pendingDeliveries = orders.filter(o => o.delivery_method === 'local_delivery' && o.fulfillment_status !== 'completed').length;

  return (
    <>
      <Head><title>Admin – On The Go Juice</title></Head>
      <AdminStyles />
      <div className="adm-wrap">
        <header className="adm-header">
          <div className="adm-header-inner">
            <div>
              <h1>Operations Dashboard</h1>
              <p>On The Go Juice — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <a href="/" className="adm-back-btn">← Back to Site</a>
          </div>
          <nav className="adm-tabs">
            {[['orders','Orders'], ['events','Events'], ['rsvps','RSVPs'], ['partners','Partners']].map(([id, label]) => (
              <button key={id} className={`adm-tab${tab === id ? ' adm-tab-active' : ''}`} onClick={() => setTab(id)}>
                {label}
                {id === 'orders'   && <span className="adm-tab-badge">{orders.length}</span>}
                {id === 'rsvps'    && Array.isArray(rsvps) && <span className="adm-tab-badge">{rsvps.length}</span>}
                {id === 'partners' && Array.isArray(partners) && <span className="adm-tab-badge">{partners.filter(p => p.status === 'new').length}</span>}
              </button>
            ))}
          </nav>
        </header>

        <div className="adm-inner">
          {/* ── ORDERS TAB ─────────────────────────────────────────── */}
          {tab === 'orders' && (
            <>
              <div className="adm-stats">
                <div className="adm-stat"><span className="adm-stat-num">{orders.length}</span><span className="adm-stat-label">Total Orders</span></div>
                <div className="adm-stat"><span className="adm-stat-num">£{totalRevenue.toFixed(2)}</span><span className="adm-stat-label">Revenue</span></div>
                <div className="adm-stat"><span className="adm-stat-num">{pendingDeliveries}</span><span className="adm-stat-label">Pending Deliveries</span></div>
                <div className="adm-stat"><span className="adm-stat-num">{orders.filter(o => o.fulfillment_status === 'completed').length}</span><span className="adm-stat-label">Completed</span></div>
              </div>
              {orders.length === 0 ? (
                <div className="adm-empty">No orders yet. They will appear here after Stripe payment confirmation.</div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr>
                      <th>Date</th><th>Customer</th><th>Method</th>
                      <th>Items</th><th>Total</th><th>Payment</th>
                      <th>Status</th><th>Note for customer</th>
                    </tr></thead>
                    <tbody>
                      {orders.map(order => {
                        const isDelivery = order.delivery_method === 'local_delivery';
                        const col = STATUS_COLOURS[order.fulfillment_status] || STATUS_COLOURS.processing;
                        return (
                          <tr key={order.id} className={isDelivery ? 'adm-row-delivery' : 'adm-row-pickup'}>
                            <td className="adm-cell-date">
                              {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              <br /><span className="adm-time">{new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td>
                              <strong>{order.customer_name}</strong><br />
                              <a href={`mailto:${order.customer_email}`} className="adm-email">{order.customer_email}</a>
                              {order.customer_phone && <><br /><span className="adm-phone">{order.customer_phone}</span></>}
                            </td>
                            <td>
                              <span className={`adm-method-badge adm-method-${isDelivery ? 'delivery' : 'pickup'}`}>{isDelivery ? '🚗 Delivery' : '📍 Pickup'}</span>
                              {isDelivery && order.postcode   && <div className="adm-postcode">{order.postcode}</div>}
                              {isDelivery && order.shipping_address && <div className="adm-address">{order.shipping_address}</div>}
                            </td>
                            <td><ul className="adm-items">{(Array.isArray(order.items) ? order.items : []).map((item, i) => <li key={i}>{item.qty}× {item.name || item.n}</li>)}</ul></td>
                            <td className="adm-cell-total">£{Number(order.total_amount).toFixed(2)}</td>
                            <td>
                              <span className="adm-payment-badge" style={{ background: order.payment_status === 'paid' ? '#dcfce7' : '#fee2e2', color: order.payment_status === 'paid' ? '#15803d' : '#b91c1c' }}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td>
                              <select value={order.fulfillment_status} onChange={e => updateFulfillment(order.id, e.target.value)} style={{ background: col.bg, color: col.text }} className="adm-status-select">
                                {Object.entries(FULFILLMENT_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                              </select>
                            </td>
                            <td><NoteCell order={order} onSave={saveNote} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── EVENTS TAB ─────────────────────────────────────────── */}
          {tab === 'events' && (
            <EventsTab events={events} setEvents={setEvents} />
          )}

          {/* ── RSVPs TAB ──────────────────────────────────────────── */}
          {tab === 'rsvps' && (
            <div>
              <div className="adm-section-header">
                <h2>Event RSVPs</h2>
                {Array.isArray(rsvps) && <span className="adm-section-count">{rsvps.reduce((s, r) => s + (parseInt(r.attendees) || 1), 0)} total attendees</span>}
              </div>
              {rsvps === null ? <div className="adm-empty">Loading…</div>
              : rsvps.length === 0 ? <div className="adm-empty">No RSVPs yet.</div>
              : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Registered</th><th>Name</th><th>Email</th><th>Attendees</th><th>Message</th></tr></thead>
                    <tbody>
                      {rsvps.map(r => (
                        <tr key={r.id}>
                          <td className="adm-cell-date">{new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                          <td><strong>{r.name}</strong></td>
                          <td><a href={`mailto:${r.email}`} className="adm-email">{r.email}</a></td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.attendees}</td>
                          <td style={{ color: '#6b7280', fontSize: '0.8rem' }}>{r.message || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PARTNERS TAB ───────────────────────────────────────── */}
          {tab === 'partners' && (
            <div>
              <div className="adm-section-header">
                <h2>Partner Inquiries</h2>
                {Array.isArray(partners) && <span className="adm-section-count">{partners.filter(p => p.status === 'new').length} new</span>}
              </div>
              {partners === null ? <div className="adm-empty">Loading…</div>
              : partners.length === 0 ? <div className="adm-empty">No partner inquiries yet.</div>
              : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Date</th><th>Business</th><th>Contact</th><th>Type</th><th>Volume / Week</th><th>Message</th><th>Status</th></tr></thead>
                    <tbody>
                      {partners.map(p => {
                        const col = PARTNER_STATUS_COLOURS[p.status] || PARTNER_STATUS_COLOURS.new;
                        return (
                          <tr key={p.id}>
                            <td className="adm-cell-date">{new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td><strong>{p.business_name}</strong></td>
                            <td>
                              {p.contact_name}<br />
                              <a href={`mailto:${p.email}`} className="adm-email">{p.email}</a><br />
                              <span className="adm-phone">{p.phone}</span>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>{p.org_type}</td>
                            <td>{p.weekly_volume}</td>
                            <td style={{ color: '#6b7280', fontSize: '0.8rem', maxWidth: 200 }}>{p.message || '—'}</td>
                            <td>
                              <select
                                value={p.status}
                                onChange={e => updatePartnerStatus(p.id, e.target.value)}
                                className="adm-status-select"
                                style={{ background: col.bg, color: col.text }}
                              >
                                {['new', 'contacted', 'active', 'declined'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Events CRUD sub-component ───────────────────────────────────── */
function EventsTab({ events, setEvents }) {
  const [editing, setEditing]   = useState(null); // null = closed, 'new' = new form, id = edit form
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState('');

  const blank = { name: '', description: '', event_date: '', location_name: '', address: '', is_active: true };
  const [form, setForm] = useState(blank);

  function openNew()  { setForm(blank); setEditing('new'); setError(''); }
  function openEdit(e){ setForm({ ...e, event_date: toLocalInput(e.event_date) }); setEditing(e.id); setError(''); }
  function close()    { setEditing(null); setError(''); }

  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError('');
    const isNew = editing === 'new';
    const res = await fetch('/api/admin/event-config', {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isNew ? form : { id: editing, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Save failed.'); return; }
    setEvents(prev => isNew ? [data, ...prev] : prev.map(ev => ev.id === data.id ? data : ev));
    close();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    const res = await fetch('/api/admin/event-config', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Delete failed. Please try again.');
      return;
    }
    setEvents(prev => prev.filter(ev => ev.id !== id));
  }

  async function toggleActive(ev) {
    const res = await fetch('/api/admin/event-config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ev.id, is_active: !ev.is_active }),
    });
    const data = await res.json();
    if (res.ok) setEvents(prev => prev.map(e => e.id === data.id ? data : e));
  }

  return (
    <div>
      <div className="adm-section-header">
        <h2>Events</h2>
        <button className="adm-btn-primary" onClick={openNew}>+ New Event</button>
      </div>

      {editing && (
        <div className="adm-form-card">
          <h3>{editing === 'new' ? 'Create New Event' : 'Edit Event'}</h3>
          <form onSubmit={handleSave} className="adm-event-form">
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label>Event Name *</label>
                <input className="adm-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Birmingham City Centre Soft Launch" required />
              </div>
              <div className="adm-form-group">
                <label>Event Date &amp; Time *</label>
                <input type="datetime-local" className="adm-input" value={form.event_date} onChange={e => setForm(f => ({...f, event_date: e.target.value}))} required />
              </div>
            </div>
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label>Location Name *</label>
                <input className="adm-input" value={form.location_name} onChange={e => setForm(f => ({...f, location_name: e.target.value}))} placeholder="Birmingham City Centre" required />
              </div>
              <div className="adm-form-group">
                <label>Address</label>
                <input className="adm-input" value={form.address || ''} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="B1 1BB" />
              </div>
            </div>
            <div className="adm-form-group">
              <label>Description</label>
              <textarea className="adm-input" rows={3} value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What attendees can expect at this event…" />
            </div>
            <div className="adm-form-group adm-form-inline">
              <label className="adm-toggle-label">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
                <span>Active (show on events page)</span>
              </label>
            </div>
            {error && <p className="adm-form-error">{error}</p>}
            <div className="adm-form-actions">
              <button type="submit" className="adm-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Event'}</button>
              <button type="button" className="adm-btn-ghost" onClick={close}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="adm-empty">No events yet. Click "+ New Event" to create one.</div>
      ) : (
        <div className="adm-events-list">
          {events.map(ev => (
            <div key={ev.id} className={`adm-event-card${ev.is_active ? '' : ' adm-event-inactive'}`}>
              <div className="adm-event-card-body">
                <div className="adm-event-meta">
                  <span className={`adm-event-status-dot${ev.is_active ? ' dot-active' : ' dot-inactive'}`} />
                  <strong className="adm-event-name">{ev.name}</strong>
                </div>
                <div className="adm-event-details">
                  <span>📅 {new Date(ev.event_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>📍 {ev.location_name}{ev.address ? ` — ${ev.address}` : ''}</span>
                </div>
                {ev.description && <p className="adm-event-desc">{ev.description}</p>}
              </div>
              <div className="adm-event-card-actions">
                <button className="adm-btn-sm" onClick={() => openEdit(ev)}>Edit</button>
                <button className="adm-btn-sm adm-btn-toggle" onClick={() => toggleActive(ev)}>
                  {ev.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="adm-btn-sm adm-btn-danger" onClick={() => handleDelete(ev.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const cookie = req.cookies?.otgj_admin;
  if (cookie !== process.env.ADMIN_PASSWORD) {
    return { props: { orders: [], events: [], authorized: false } };
  }

  const [ordersRes, eventsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('event_config').select('*').order('event_date', { ascending: false }),
  ]);

  return {
    props: {
      orders: ordersRes.data ?? [],
      events: eventsRes.data ?? [],
      authorized: true,
    },
  };
}

function NoteCell({ order, onSave }) {
  const [text, setText] = useState(order.admin_note || '');
  const [saved, setSaved] = useState(false);
  async function handleSave() { await onSave(order.id, text); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  return (
    <div className="adm-note-cell">
      <textarea className="adm-note-input" value={text} onChange={e => { setText(e.target.value); setSaved(false); }} placeholder="e.g. Delivering Thursday 3–5pm" rows={2} />
      <button className={`adm-note-save${saved ? ' adm-note-saved' : ''}`} onClick={handleSave}>{saved ? '✓ Saved' : 'Save'}</button>
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

      /* Dashboard shell */
      .adm-wrap { min-height: 100vh; }
      .adm-header { background: var(--black); color: #fff; padding: 20px 4vw 0; }
      .adm-header-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 16px; }
      .adm-header h1 { font-family: var(--font-accent); font-size: 1.4rem; font-weight: 900; }
      .adm-header p { font-size: 0.82rem; color: rgba(255,255,255,0.5); margin-top: 2px; }
      .adm-back-btn { padding: 8px 20px; background: rgba(255,255,255,0.1); color: #fff; border-radius: 999px; font-size: 0.82rem; transition: background 0.2s; white-space: nowrap; cursor: pointer; border: none; }
      .adm-back-btn:hover { background: rgba(255,255,255,0.2); }

      /* Tabs */
      .adm-tabs { max-width: 1400px; margin: 0 auto; display: flex; gap: 4px; }
      .adm-tab { padding: 10px 22px; background: transparent; color: rgba(255,255,255,0.5); border: none; border-bottom: 3px solid transparent; font-family: var(--font-accent); font-weight: 700; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: color 0.2s, border-color 0.2s; display: flex; align-items: center; gap: 8px; }
      .adm-tab:hover { color: rgba(255,255,255,0.85); }
      .adm-tab-active { color: #fff !important; border-bottom-color: var(--orange); }
      .adm-tab-badge { background: var(--orange); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; }

      .adm-inner { max-width: 1400px; margin: 0 auto; padding: 32px 4vw 60px; }

      /* Section header */
      .adm-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
      .adm-section-header h2 { font-family: var(--font-accent); font-size: 1.2rem; font-weight: 900; }
      .adm-section-count { background: #f3f4f6; color: var(--grey); font-size: 0.78rem; font-weight: 600; padding: 4px 12px; border-radius: 999px; }

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
      .adm-status-select { padding: 6px 10px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: var(--font-main); font-size: 0.78rem; font-weight: 600; cursor: pointer; width: 100%; min-width: 160px; outline: none; transition: border-color 0.2s; }
      .adm-status-select:focus { border-color: var(--green); }
      .adm-empty { padding: 60px; text-align: center; color: var(--grey); background: #fff; border-radius: 16px; }
      .adm-note-cell { display: flex; flex-direction: column; gap: 6px; min-width: 200px; }
      .adm-note-input { width: 100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-family: var(--font-main); font-size: 0.78rem; resize: vertical; outline: none; transition: border-color 0.2s; }
      .adm-note-input:focus { border-color: var(--green); }
      .adm-note-save { align-self: flex-start; padding: 5px 14px; background: var(--green); color: #fff; border: none; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; font-family: var(--font-main); transition: background 0.2s; }
      .adm-note-save:hover { background: var(--green-dark); }
      .adm-note-saved { background: #15803d; }

      /* Events */
      .adm-form-card { background: #fff; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
      .adm-form-card h3 { font-family: var(--font-accent); font-size: 1rem; font-weight: 800; margin-bottom: 20px; }
      .adm-event-form { display: flex; flex-direction: column; gap: 16px; }
      .adm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .adm-form-group { display: flex; flex-direction: column; gap: 5px; }
      .adm-form-group label { font-size: 0.78rem; font-weight: 600; color: var(--black); }
      .adm-input { padding: 11px 14px; border: 1.5px solid #d1d5db; border-radius: 8px; font-family: var(--font-main); font-size: 0.88rem; outline: none; transition: border-color 0.2s; width: 100%; }
      .adm-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(29,108,0,0.1); }
      .adm-form-inline { flex-direction: row; align-items: center; }
      .adm-toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
      .adm-toggle-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--green); cursor: pointer; }
      .adm-form-error { color: #b91c1c; font-size: 0.82rem; }
      .adm-form-actions { display: flex; gap: 10px; align-items: center; margin-top: 4px; }

      .adm-btn-primary { padding: 10px 22px; background: var(--green); color: #fff; border: none; border-radius: 8px; font-family: var(--font-accent); font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
      .adm-btn-primary:hover { background: var(--green-dark); }
      .adm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .adm-btn-ghost { padding: 10px 20px; background: transparent; color: var(--grey); border: 1.5px solid #d1d5db; border-radius: 8px; font-family: var(--font-main); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
      .adm-btn-ghost:hover { border-color: var(--black); color: var(--black); }
      .adm-btn-sm { padding: 6px 14px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: 1.5px solid #e5e7eb; background: #fff; color: var(--black); font-family: var(--font-main); transition: background 0.2s; white-space: nowrap; }
      .adm-btn-sm:hover { background: #f3f4f6; }
      .adm-btn-toggle { border-color: #d1d5db; color: var(--grey); }
      .adm-btn-danger { border-color: #fecaca; color: #b91c1c; background: #fff5f5; }
      .adm-btn-danger:hover { background: #fee2e2; }

      .adm-events-list { display: flex; flex-direction: column; gap: 12px; }
      .adm-event-card { background: #fff; border-radius: 14px; padding: 20px 22px; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1.5px solid #e5e7eb; }
      .adm-event-inactive { opacity: 0.55; }
      .adm-event-card-body { flex: 1; min-width: 0; }
      .adm-event-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
      .adm-event-status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
      .dot-active { background: #22c55e; }
      .dot-inactive { background: #d1d5db; }
      .adm-event-name { font-family: var(--font-accent); font-size: 0.95rem; font-weight: 800; }
      .adm-event-details { display: flex; flex-wrap: wrap; gap: 6px 20px; font-size: 0.8rem; color: var(--grey); margin-bottom: 8px; }
      .adm-event-desc { font-size: 0.8rem; color: #4b5563; line-height: 1.55; max-width: 600px; }
      .adm-event-card-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

      @media (max-width: 900px) {
        .adm-stats { grid-template-columns: repeat(2, 1fr); }
        .adm-header-inner { flex-direction: column; align-items: flex-start; }
        .adm-form-row { grid-template-columns: 1fr; }
        .adm-event-card { flex-direction: column; }
      }
      @media (max-width: 560px) {
        .adm-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
        .adm-login-card { padding: 36px 24px; }
        .adm-tab { padding: 10px 14px; font-size: 0.72rem; }
      }
    `}</style>
  );
}
