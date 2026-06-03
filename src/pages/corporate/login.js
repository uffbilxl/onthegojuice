import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

const S = {
  page:     { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a2800', fontFamily: "'Poppins', sans-serif", padding: '24px' },
  logo:     { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#fff', textDecoration: 'none', marginBottom: '6px', letterSpacing: '-0.02em' },
  tagline:  { color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginBottom: '36px' },
  badge:    { display: 'inline-block', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', padding: '5px 14px', borderRadius: '999px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.15)' },
  card:     { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 48px rgba(0,0,0,0.4)' },
  title:    { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0a2800', margin: '0 0 6px', letterSpacing: '-0.03em' },
  sub:      { color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px', lineHeight: 1.55 },
  label:    { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px', marginTop: '16px' },
  input:    { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  btn:      { width: '100%', padding: '13px', marginTop: '24px', background: '#0a2800', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'opacity 0.2s' },
  error:    { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '4px', lineHeight: 1.5 },
  perks:    { background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px' },
  perkItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#166534', fontWeight: 600, marginBottom: '6px' },
  footer:   { color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', marginTop: '24px', textAlign: 'center', lineHeight: 1.7 },
  footerLk: { color: 'rgba(255,255,255,0.65)', textDecoration: 'none' },
};

function setCorporateCookie() {
  // Soft flag cookie — real auth is verified server-side in API routes
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `otgj_corp=1; path=/; SameSite=Strict; expires=${expires}`;
}

export default function CorporateLoginPage() {
  const router = useRouter();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profile?.role === 'corporate' || profile?.role === 'admin') {
        setCorporateCookie();
        router.replace('/corporate/dashboard');
      }
    })();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) { setError(authErr.message); setSubmitting(false); return; }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role, company_name')
      .eq('id', data.user.id)
      .single();

    if (profileErr || !profile) {
      await supabase.auth.signOut();
      setError('Could not verify your account. Please contact support.');
      setSubmitting(false); return;
    }

    if (profile.role !== 'corporate' && profile.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Unauthorized: Corporate accounts only. Regular customers can sign in at /login.');
      setSubmitting(false); return;
    }

    setCorporateCookie();
    router.replace('/corporate/dashboard');
  }

  return (
    <>
      <Head>
        <title>Corporate Portal – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        <a href="/" style={S.logo}>On The Go Juice</a>
        <p style={S.tagline}>Wholesale &amp; Corporate Accounts</p>
        <span style={S.badge}>CORPORATE PORTAL</span>

        <div style={S.card}>
          <h1 style={S.title}>Corporate Sign In</h1>
          <p style={S.sub}>Access wholesale pricing and bulk ordering for your business.</p>

          <div style={S.perks}>
            {[
              ['✓', 'Wholesale pricing — up to 30% off retail'],
              ['✓', 'Bulk order dashboard with real-time totals'],
              ['✓', 'Dedicated B2B support line'],
            ].map(([icon, text]) => (
              <div key={text} style={{ ...S.perkItem, marginBottom: text === '✓ Dedicated B2B support line' ? 0 : '6px' }}>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {error && <p style={S.error}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <label style={S.label}>Business email address</label>
            <input
              style={S.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="accounts@company.com" autoComplete="email"
            />
            <label style={S.label}>Password</label>
            <input
              style={S.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••" autoComplete="current-password"
            />
            <button
              style={{ ...S.btn, opacity: submitting ? 0.7 : 1 }}
              type="submit" disabled={submitting}
            >
              {submitting ? 'Verifying account…' : 'Sign In to Portal'}
            </button>
          </form>
        </div>

        <p style={S.footer}>
          Not a corporate client yet?{' '}
          <a href="/partners" style={S.footerLk}>Apply for a wholesale account</a>
          {' '}&middot;{' '}
          <a href="/forgot-password" style={S.footerLk}>Forgot password?</a>
        </p>
      </div>
    </>
  );
}
