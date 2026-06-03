import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

const S = {
  page:  { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9f6f1', fontFamily: "'Poppins', sans-serif", padding: '24px' },
  logo:  { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0a2800', textDecoration: 'none', marginBottom: '32px', letterSpacing: '-0.02em' },
  card:  { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0a2800', margin: '0 0 6px', letterSpacing: '-0.03em' },
  sub:   { color: '#6b7280', fontSize: '0.9rem', margin: '0 0 28px' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px', marginTop: '16px' },
  input: { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  btn:   { width: '100%', padding: '13px', marginTop: '24px', background: 'linear-gradient(135deg, #f77f00, #e65c00)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', letterSpacing: '0.01em' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '4px' },
  links: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', fontSize: '0.85rem', flexWrap: 'wrap' },
  link:  { color: '#f77f00', textDecoration: 'none', fontWeight: 600 },
};

export default function LoginPage() {
  const router = useRouter();
  const { redirect } = router.query;

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(redirect || '/account');
    });
  }, [redirect, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setSubmitting(false); return; }
    // Store name + email so the main site nav can show "Welcome, [name]"
    try {
      const meta = data.user?.user_metadata || {};
      localStorage.setItem('otgj_user', JSON.stringify({
        email:      data.user?.email || email,
        first_name: meta.first_name || '',
        last_name:  meta.last_name  || '',
      }));
    } catch {}
    router.replace(redirect || '/');
  }

  return (
    <>
      <Head>
        <title>Sign In – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={S.page}>
        <a href="/" style={S.logo}>On The Go Juice</a>
        <div style={S.card}>
          <h1 style={S.title}>Welcome back</h1>
          <p style={S.sub}>Sign in to your account</p>
          {error && <p style={S.error}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Email address</label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
            <button style={{ ...S.btn, opacity: submitting ? 0.7 : 1 }} type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div style={S.links}>
            <a href="/forgot-password" style={S.link}>Forgot password?</a>
            <span style={{ color: '#d1d5db' }}>·</span>
            <a href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={S.link}>Create account</a>
          </div>
        </div>
      </div>
    </>
  );
}
