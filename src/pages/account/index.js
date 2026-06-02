import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabaseClient';

const BOTTLES_NEEDED = 7;

export default function AccountPage() {
  const [view,       setView]       = useState('login');
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message,    setMessage]    = useState('');

  const loadProfile = useCallback(async (token) => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('otgj_user', JSON.stringify({
            email:  data.email,
            points: data.loyalty_points || 0,
          }));
        }
        setView('dashboard');
      } else {
        setView('login');
      }
    } catch { setView('login'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await loadProfile(session.access_token);
      else setLoading(false);
    })();
  }, [loadProfile]);

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
      setMessage('Account created! Check your inbox for the verification link, then sign in.');
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

  const fontHead = (
    <Head>
      <title>My Account – On The Go Juice</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </Head>
  );

  if (loading) {
    return <>{fontHead}<AccountStyles /><div className="acc-loading"><div className="acc-spinner" /></div></>;
  }

  return (
    <>
      {fontHead}
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
        {view === 'dashboard' && profile && (
          <Dashboard profile={profile} onLogout={handleLogout} onRefresh={async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) await loadProfile(session.access_token);
          }} />
        )}

        {view === 'login' && (
          <div className="acc-card">
            <h1 className="acc-title">Sign In</h1>
            <p className="acc-subtitle">Access your rewards, progress, and discount codes.</p>
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
                Create a free account
              </button>
            </p>
          </div>
        )}

        {view === 'register' && (
          <div className="acc-card">
            <div className="acc-register-perks">
              <div className="acc-perk"><span className="acc-perk-icon">🎁</span><span>20% off your first order</span></div>
              <div className="acc-perk"><span className="acc-perk-icon">🍾</span><span>Free bottle every 7 you buy</span></div>
            </div>
            <h1 className="acc-title">Create Account</h1>
            <p className="acc-subtitle">Join for free to unlock exclusive rewards.</p>
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
                {submitting ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>
            <p className="acc-switch">
              Already have an account?{' '}
              <button onClick={() => { setView('login'); setError(''); }} className="acc-link">Sign in</button>
            </p>
          </div>
        )}
      </main>
    </>
  );
}

/* ── Dashboard sub-component ─────────────────────────────────────── */
function Dashboard({ profile, onLogout, onRefresh }) {
  const [claiming,    setClaiming]    = useState(false);
  const [claimError,  setClaimError]  = useState('');
  const [copiedCode,  setCopiedCode]  = useState(null);

  const progress   = profile.bottle_progress ?? 0;
  const pct        = Math.round((progress / BOTTLES_NEEDED) * 100);
  const remaining  = BOTTLES_NEEDED - progress;
  const canClaim   = profile.email_verified && !profile.welcome_discount_claimed;

  async function claimWelcome() {
    setClaiming(true); setClaimError('');
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/account/claim-welcome-discount', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    setClaiming(false);
    if (!res.ok) { setClaimError(data.error || 'Something went wrong. Please try again.'); return; }
    await onRefresh();
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  }

  const welcomeReward   = profile.rewards?.find(r => r.type === 'welcome_20pct');
  const freeBottleRewards = profile.rewards?.filter(r => r.type === 'free_bottle') || [];

  return (
    <div className="acc-dashboard-wrap">

      {/* ── Profile header ──────────────────────────────────────── */}
      <div className="acc-card acc-profile-card">
        <div className="acc-welcome-row">
          <div className="acc-avatar">{profile.email[0].toUpperCase()}</div>
          <div className="acc-welcome-info">
            <h1 className="acc-title" style={{ marginBottom: 4 }}>My Rewards</h1>
            <p className="acc-email">{profile.email}</p>
            <p className="acc-since">Member since {new Date(profile.member_since).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Email verification warning */}
        {!profile.email_verified && (
          <div className="acc-verify-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Check your inbox — verify your email to unlock your 20% welcome discount.
          </div>
        )}
      </div>

      {/* ── Welcome discount ────────────────────────────────────── */}
      <div className={`acc-card acc-reward-card${profile.welcome_discount_claimed && !welcomeReward ? ' acc-reward-used' : ''}`}>
        <div className="acc-reward-header">
          <div className="acc-reward-badge acc-reward-badge--welcome">20% OFF</div>
          <h2 className="acc-reward-title">Welcome Discount</h2>
        </div>
        <p className="acc-reward-desc">Your first-order reward — 20% off any order over £10.</p>

        {welcomeReward ? (
          <div className="acc-code-block">
            <span className="acc-code-label">Your code</span>
            <div className="acc-code-row">
              <span className="acc-code-str">{welcomeReward.promo_code}</span>
              <button className="acc-copy-btn" onClick={() => copyCode(welcomeReward.promo_code)}>
                {copiedCode === welcomeReward.promo_code ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="acc-code-hint">Enter this at checkout — single use, already linked to your account.</p>
          </div>
        ) : canClaim ? (
          <>
            {claimError && <p className="acc-error" style={{ marginBottom: 12 }}>{claimError}</p>}
            <button className="acc-btn-primary" onClick={claimWelcome} disabled={claiming}>
              {claiming ? 'Generating your code…' : 'Claim 20% Discount →'}
            </button>
          </>
        ) : profile.welcome_discount_claimed && !welcomeReward ? (
          <div className="acc-reward-redeemed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Code redeemed — thank you for your order!
          </div>
        ) : !profile.email_verified ? (
          <p className="acc-reward-desc" style={{ color: '#9ca3af', fontStyle: 'italic' }}>Verify your email above to unlock this.</p>
        ) : null}
      </div>

      {/* ── Bottle progress ─────────────────────────────────────── */}
      <div className="acc-card">
        <div className="acc-reward-header">
          <div className="acc-reward-badge acc-reward-badge--bottle">BUY 7 GET 1 FREE</div>
          <h2 className="acc-reward-title">Free Bottle Tracker</h2>
        </div>
        <p className="acc-reward-desc">
          {progress === 0
            ? `Buy ${BOTTLES_NEEDED} bottles and your next one is on us.`
            : progress === BOTTLES_NEEDED - 1
            ? `One more bottle and your next one is FREE!`
            : `${remaining} more bottle${remaining !== 1 ? 's' : ''} until your next free one.`}
        </p>

        {/* Stamp card */}
        <div className="acc-stamp-card">
          {Array.from({ length: BOTTLES_NEEDED }).map((_, i) => (
            <div key={i} className={`acc-stamp${i < progress ? ' acc-stamp--filled' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={i < progress ? '#fff' : 'none'} stroke={i < progress ? '#fff' : '#d1d5db'} strokeWidth="1.5">
                <path d="M8 2h8l1 5H7L8 2zM7 7c0 0-2 2-2 7a7 7 0 0 0 14 0c0-5-2-7-2-7"/>
              </svg>
            </div>
          ))}
          <div className="acc-stamp acc-stamp--gift">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={progress >= BOTTLES_NEEDED ? '#fff' : '#d1d5db'} strokeWidth="1.5">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="acc-progress-wrap">
          <div className="acc-progress-bar">
            <div className="acc-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="acc-progress-label">{progress} / {BOTTLES_NEEDED} bottles</span>
        </div>

        {profile.lifetime_bottles_bought > 0 && (
          <p className="acc-lifetime">
            {profile.lifetime_bottles_bought} bottle{profile.lifetime_bottles_bought !== 1 ? 's' : ''} purchased lifetime
          </p>
        )}
      </div>

      {/* ── Free bottle rewards ──────────────────────────────────── */}
      {freeBottleRewards.length > 0 && (
        <div className="acc-card">
          <div className="acc-reward-header">
            <div className="acc-reward-badge acc-reward-badge--bottle">FREE BOTTLE</div>
            <h2 className="acc-reward-title">
              {freeBottleRewards.length} Free Bottle {freeBottleRewards.length === 1 ? 'Reward' : 'Rewards'} Waiting!
            </h2>
          </div>
          <div className="acc-rewards-list">
            {freeBottleRewards.map(r => (
              <div key={r.id} className="acc-code-block">
                <span className="acc-code-label">Free bottle code</span>
                <div className="acc-code-row">
                  <span className="acc-code-str">{r.promo_code}</span>
                  <button className="acc-copy-btn" onClick={() => copyCode(r.promo_code)}>
                    {copiedCode === r.promo_code ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="acc-code-hint">Up to £4.99 off — no minimum spend. Enter at checkout.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="acc-card acc-actions-card">
        <a href="/checkout" className="acc-btn-primary">Shop Now →</a>
        <button onClick={onLogout} className="acc-btn-ghost">Sign Out</button>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────── */
function AccountStyles() {
  return (
    <style jsx global>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --green: #1d6c00; --green-dark: #154f00; --orange: #ff6b00;
        --black: #111;    --off-white: #f9f6f1;
        --grey: #6b7280;  --border: #e5e7eb;
        --font-main: 'Poppins', sans-serif;
        --font-accent: 'Montserrat', sans-serif;
      }
      body { font-family: var(--font-main); background: var(--off-white); color: var(--black); -webkit-font-smoothing: antialiased; }

      /* Header */
      .acc-header { background: var(--black); padding: 18px 5vw; display: flex; align-items: center; justify-content: space-between; }
      .acc-logo-link { display: flex; align-items: center; gap: 10px; text-decoration: none; }
      .acc-logo { height: 36px; object-fit: contain; }
      .acc-logo-text { color: #fff; font-family: var(--font-accent); font-weight: 900; font-size: 1.1rem; }
      .acc-back { color: rgba(255,255,255,0.65); font-size: 0.82rem; text-decoration: none; transition: color 0.2s; }
      .acc-back:hover { color: #fff; }

      /* Loading */
      .acc-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--off-white); }
      .acc-spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--green); border-radius: 50%; animation: spin 0.7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Layout */
      .acc-main { min-height: calc(100vh - 72px); display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px 60px; }
      .acc-dashboard-wrap { display: flex; flex-direction: column; gap: 18px; max-width: 560px; width: 100%; }

      /* Card */
      .acc-card { background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); max-width: 560px; width: 100%; }
      .acc-title { font-family: var(--font-accent); font-size: 1.55rem; font-weight: 900; margin-bottom: 6px; }
      .acc-subtitle { color: var(--grey); font-size: 0.88rem; margin-bottom: 28px; }

      /* Register perks */
      .acc-register-perks { display: flex; gap: 10px; margin-bottom: 24px; }
      .acc-perk { display: flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; padding: 10px 14px; font-size: 0.8rem; font-weight: 600; color: #15803d; flex: 1; }
      .acc-perk-icon { font-size: 1.1rem; flex-shrink: 0; }

      /* Profile header */
      .acc-profile-card { padding: 28px 32px; }
      .acc-welcome-row { display: flex; align-items: center; gap: 16px; }
      .acc-avatar { width: 52px; height: 52px; background: var(--green); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-accent); font-size: 1.3rem; font-weight: 900; flex-shrink: 0; }
      .acc-welcome-info { min-width: 0; }
      .acc-email { font-weight: 600; font-size: 0.92rem; color: var(--black); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .acc-since { color: var(--grey); font-size: 0.78rem; }

      /* Verify banner */
      .acc-verify-banner { display: flex; align-items: center; gap: 10px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 12px 16px; font-size: 0.82rem; font-weight: 500; color: #92400e; margin-top: 18px; line-height: 1.5; }
      .acc-verify-banner svg { flex-shrink: 0; }

      /* Reward cards */
      .acc-reward-card { transition: opacity 0.2s; }
      .acc-reward-used { opacity: 0.6; }
      .acc-reward-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
      .acc-reward-title { font-family: var(--font-accent); font-size: 1.05rem; font-weight: 800; }
      .acc-reward-desc { font-size: 0.84rem; color: var(--grey); margin-bottom: 18px; line-height: 1.55; }
      .acc-reward-redeemed { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; color: #15803d; }

      /* Badges */
      .acc-reward-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-family: var(--font-accent); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.1em; }
      .acc-reward-badge--welcome { background: var(--orange); color: #fff; }
      .acc-reward-badge--bottle  { background: var(--green);  color: #fff; }

      /* Code block */
      .acc-code-block { background: #f9f6f1; border: 1.5px solid var(--border); border-radius: 12px; padding: 18px 20px; }
      .acc-code-label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--grey); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
      .acc-code-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .acc-code-str { font-family: 'Courier New', monospace; font-size: 1.35rem; font-weight: 900; color: var(--green); letter-spacing: 0.15em; flex: 1; word-break: break-all; }
      .acc-copy-btn { flex-shrink: 0; padding: 7px 16px; background: var(--green); color: #fff; border: none; border-radius: 8px; font-family: var(--font-main); font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
      .acc-copy-btn:hover { background: var(--green-dark); }
      .acc-code-hint { font-size: 0.75rem; color: #9ca3af; line-height: 1.5; }

      /* Rewards list */
      .acc-rewards-list { display: flex; flex-direction: column; gap: 14px; }

      /* Stamp card */
      .acc-stamp-card { display: flex; gap: 8px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
      .acc-stamp { width: 42px; height: 42px; border-radius: 10px; background: #f3f4f6; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
      .acc-stamp--filled { background: var(--green); border-color: var(--green); box-shadow: 0 2px 8px rgba(29,108,0,0.3); }
      .acc-stamp--gift { background: #fff7ed; border-color: #fed7aa; }
      .acc-stamp--gift svg { stroke: #c2410c; }

      /* Progress bar */
      .acc-progress-wrap { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
      .acc-progress-bar { flex: 1; height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
      .acc-progress-fill { height: 100%; background: linear-gradient(90deg, var(--green), #4ade80); border-radius: 999px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
      .acc-progress-label { font-size: 0.8rem; font-weight: 700; color: var(--green); white-space: nowrap; }
      .acc-lifetime { font-size: 0.75rem; color: #9ca3af; margin-top: 4px; }

      /* Form */
      .acc-message { background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #15803d; border-radius: 10px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 20px; line-height: 1.5; }
      .acc-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
      .acc-field { display: flex; flex-direction: column; gap: 5px; }
      .acc-field label { font-size: 0.78rem; font-weight: 600; }
      .acc-hint { font-weight: 400; color: var(--grey); margin-left: 4px; }
      .acc-field input { padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-family: var(--font-main); font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
      .acc-field input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(29,108,0,0.1); }
      .acc-error { color: #b91c1c; font-size: 0.82rem; }

      /* Buttons */
      .acc-actions-card { display: flex; gap: 12px; }
      .acc-btn-primary { display: inline-flex; align-items: center; justify-content: center; padding: 13px 28px; background: var(--green); color: #fff; border: none; border-radius: 10px; font-family: var(--font-accent); font-weight: 700; font-size: 0.9rem; cursor: pointer; text-decoration: none; transition: background 0.2s; white-space: nowrap; }
      .acc-btn-primary:hover { background: var(--green-dark); }
      .acc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .acc-btn-full { width: 100%; }
      .acc-btn-ghost { padding: 13px 24px; background: transparent; color: var(--grey); border: 1.5px solid var(--border); border-radius: 10px; font-family: var(--font-main); font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
      .acc-btn-ghost:hover { border-color: var(--black); color: var(--black); }
      .acc-switch { font-size: 0.83rem; color: var(--grey); text-align: center; }
      .acc-link { background: none; border: none; color: var(--green); font-family: var(--font-main); font-size: inherit; font-weight: 600; cursor: pointer; text-decoration: underline; }

      @media (max-width: 520px) {
        .acc-card { padding: 24px 20px; }
        .acc-stamp { width: 36px; height: 36px; border-radius: 8px; }
        .acc-stamp svg { width: 18px; height: 18px; }
        .acc-code-str { font-size: 1.1rem; }
        .acc-actions-card { flex-direction: column; }
        .acc-register-perks { flex-direction: column; }
        .acc-welcome-row { gap: 12px; }
      }
    `}</style>
  );
}
