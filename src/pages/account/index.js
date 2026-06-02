import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabaseClient';

export default function AccountPage() {
  const [view,    setView]    = useState('login'); // 'login' | 'register' | 'dashboard'
  const [profile, setProfile] = useState(null);    // { email, loyalty_points, member_since }
  const [loading, setLoading] = useState(true);

  // Form state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message,  setMessage]  = useState('');

  // Check existing session on mount
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadProfile(session.access_token);
      } else {
        setLoading(false);
      }
    })();
  }, []);

  async function loadProfile(token) {
    setLoading(true);
    try {
      const res = await fetch('/api/account/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        // Sync to localStorage so checkout.js can read it
        if (typeof window !== 'undefined') {
          localStorage.setItem('otgj_user', JSON.stringify({ email: data.email, points: data.loyalty_points }));
        }
        setView('dashboard');
      }
    } catch {}
    setLoading(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setSubmitting(false); return; }
    await loadProfile(data.session.access_token);
    setSubmitting(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setError(err.message); setSubmitting(false); return; }
    if (data.session) {
      await loadProfile(data.session.access_token);
    } else {
      setMessage('Check your email to confirm your account, then log in.');
      setView('login');
    }
    setSubmitting(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') localStorage.removeItem('otgj_user');
    setProfile(null);
    setView('login');
    setEmail(''); setPassword('');
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>My Account – On The Go Juice</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        </Head>
        <AccountStyles />
        <div className="acc-loading">
          <div className="acc-spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Account – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <AccountStyles />

      <header className="acc-header">
        <a href="/" className="acc-logo-link">
          <img src="/images/logo.png" alt="On The Go Juice" className="acc-logo"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <span className="acc-logo-text" style={{ display: 'none' }}>On The Go Juice</span>
        </a>
        <a href="/" className="acc-back">← Back to shop</a>
      </header>

      <main className="acc-main">

        {/* ── DASHBOARD ─────────────────────────────────────────── */}
        {view === 'dashboard' && profile && (
          <div className="acc-card acc-dashboard">
            <div className="acc-welcome">
              <div className="acc-avatar">{profile.email[0].toUpperCase()}</div>
              <div>
                <h1 className="acc-title">Welcome back!</h1>
                <p className="acc-email">{profile.email}</p>
                <p className="acc-since">Member since {new Date(profile.member_since).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="acc-points-card">
              <div className="acc-points-icon">⭐</div>
              <div className="acc-points-body">
                <div className="acc-points-num">{profile.loyalty_points.toLocaleString()}</div>
                <div className="acc-points-label">Loyalty Points</div>
                <div className="acc-points-value">
                  Worth <strong>£{(profile.loyalty_points / 100).toFixed(2)}</strong> off your next order
                </div>
              </div>
            </div>

            <div className="acc-info-grid">
              <div className="acc-info-item">
                <span className="acc-info-label">Earning rate</span>
                <span className="acc-info-val">10 points per £1 spent</span>
              </div>
              <div className="acc-info-item">
                <span className="acc-info-label">Redemption rate</span>
                <span className="acc-info-val">100 points = £1 off</span>
              </div>
              <div className="acc-info-item">
                <span className="acc-info-label">How to redeem</span>
                <span className="acc-info-val">Toggle "Use Loyalty Points" at checkout</span>
              </div>
            </div>

            <div className="acc-actions">
              <a href="/checkout" className="acc-btn-primary">Shop Now</a>
              <button onClick={handleLogout} className="acc-btn-ghost">Sign Out</button>
            </div>
          </div>
        )}

        {/* ── LOGIN ─────────────────────────────────────────────── */}
        {view === 'login' && (
          <div className="acc-card">
            <h1 className="acc-title">Sign In</h1>
            <p className="acc-subtitle">Access your loyalty points and order history.</p>
            {message && <div className="acc-message">{message}</div>}
            <form onSubmit={handleLogin} className="acc-form">
              <div className="acc-field">
                <label>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
              </div>
              <div className="acc-field">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <p className="acc-error">{error}</p>}
              <button type="submit" className="acc-btn-primary acc-btn-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <p className="acc-switch">
              New here?{' '}
              <button onClick={() => { setView('register'); setError(''); setMessage(''); }} className="acc-link">
                Create an account
              </button>
            </p>
          </div>
        )}

        {/* ── REGISTER ──────────────────────────────────────────── */}
        {view === 'register' && (
          <div className="acc-card">
            <h1 className="acc-title">Create Account</h1>
            <p className="acc-subtitle">Join to earn loyalty points on every order.</p>
            <form onSubmit={handleRegister} className="acc-form">
              <div className="acc-field">
                <label>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
              </div>
              <div className="acc-field">
                <label>Password <span className="acc-hint">(min. 6 characters)</span></label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" required minLength={6} />
              </div>
              {error && <p className="acc-error">{error}</p>}
              <button type="submit" className="acc-btn-primary acc-btn-full" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
            <p className="acc-switch">
              Already have an account?{' '}
              <button onClick={() => { setView('login'); setError(''); }} className="acc-link">
                Sign in
              </button>
            </p>
          </div>
        )}

      </main>
    </>
  );
}

function AccountStyles() {
  return (
    <style jsx global>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --green: #1d6c00; --green-dark: #154f00; --orange: #ff6b00;
        --purple: #7c3aed; --blue: #1d4ed8;
        --black: #111; --white: #fff; --off-white: #f9f6f1;
        --grey: #6b7280; --grey-light: #f3f4f6; --border: #e5e7eb;
        --font-main: 'Poppins', sans-serif; --font-accent: 'Montserrat', sans-serif;
      }
      body { font-family: var(--font-main); background: var(--off-white); color: var(--black); -webkit-font-smoothing: antialiased; min-height: 100vh; }

      /* Header */
      .acc-header { background: var(--black); padding: 18px 5vw; display: flex; align-items: center; justify-content: space-between; }
      .acc-logo-link { display: flex; align-items: center; gap: 10px; text-decoration: none; }
      .acc-logo { height: 36px; object-fit: contain; }
      .acc-logo-text { color: #fff; font-family: var(--font-accent); font-weight: 900; font-size: 1.1rem; }
      .acc-back { color: rgba(255,255,255,0.65); font-size: 0.82rem; text-decoration: none; transition: color 0.2s; }
      .acc-back:hover { color: #fff; }

      /* Layout */
      .acc-main { min-height: calc(100vh - 72px); display: flex; align-items: center; justify-content: center; padding: 48px 20px; }
      .acc-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
      .acc-spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--green); border-radius: 50%; animation: spin 0.7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Card */
      .acc-card { background: #fff; border-radius: 20px; padding: 40px 36px; max-width: 460px; width: 100%; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
      .acc-dashboard { max-width: 520px; }
      .acc-title { font-family: var(--font-accent); font-size: 1.6rem; font-weight: 900; margin-bottom: 6px; }
      .acc-subtitle { color: var(--grey); font-size: 0.88rem; margin-bottom: 28px; }

      /* Welcome */
      .acc-welcome { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
      .acc-avatar { width: 56px; height: 56px; background: var(--green); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-accent); font-size: 1.4rem; font-weight: 900; flex-shrink: 0; }
      .acc-email { font-weight: 600; font-size: 0.95rem; margin-bottom: 2px; }
      .acc-since { color: var(--grey); font-size: 0.8rem; }

      /* Points card */
      .acc-points-card { background: linear-gradient(135deg, #1d6c00 0%, #2a9100 100%); border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 20px; margin-bottom: 24px; color: #fff; }
      .acc-points-icon { font-size: 2.2rem; flex-shrink: 0; }
      .acc-points-num { font-family: var(--font-accent); font-size: 2.4rem; font-weight: 900; line-height: 1; margin-bottom: 4px; }
      .acc-points-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin-bottom: 6px; }
      .acc-points-value { font-size: 0.85rem; opacity: 0.9; }
      .acc-points-value strong { font-weight: 700; }

      /* Info grid */
      .acc-info-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; border: 1.5px solid var(--border); border-radius: 12px; padding: 18px 20px; }
      .acc-info-item { display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 0.83rem; }
      .acc-info-label { color: var(--grey); }
      .acc-info-val { font-weight: 600; text-align: right; }

      /* Message */
      .acc-message { background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #15803d; border-radius: 10px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 20px; }

      /* Form */
      .acc-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
      .acc-field { display: flex; flex-direction: column; gap: 5px; }
      .acc-field label { font-size: 0.78rem; font-weight: 600; }
      .acc-hint { font-weight: 400; color: var(--grey); margin-left: 4px; }
      .acc-field input { padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-family: var(--font-main); font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
      .acc-field input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(29,108,0,0.1); }
      .acc-error { color: #b91c1c; font-size: 0.82rem; }

      /* Buttons */
      .acc-actions { display: flex; gap: 12px; }
      .acc-btn-primary { display: inline-flex; align-items: center; justify-content: center; padding: 13px 28px; background: var(--green); color: #fff; border: none; border-radius: 10px; font-family: var(--font-accent); font-weight: 700; font-size: 0.9rem; cursor: pointer; text-decoration: none; transition: background 0.2s; }
      .acc-btn-primary:hover { background: var(--green-dark); }
      .acc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .acc-btn-full { width: 100%; }
      .acc-btn-ghost { padding: 13px 24px; background: transparent; color: var(--grey); border: 1.5px solid var(--border); border-radius: 10px; font-family: var(--font-main); font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
      .acc-btn-ghost:hover { border-color: var(--black); color: var(--black); }
      .acc-switch { font-size: 0.83rem; color: var(--grey); text-align: center; }
      .acc-link { background: none; border: none; color: var(--green); font-family: var(--font-main); font-size: inherit; font-weight: 600; cursor: pointer; text-decoration: underline; }

      @media (max-width: 480px) {
        .acc-card { padding: 28px 20px; }
        .acc-welcome { flex-direction: column; text-align: center; }
        .acc-actions { flex-direction: column; }
        .acc-info-item { flex-direction: column; align-items: flex-start; gap: 2px; }
        .acc-info-val { text-align: left; }
      }
    `}</style>
  );
}
