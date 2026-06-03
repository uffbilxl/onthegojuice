import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

const S = {
  page:    { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9f6f1', fontFamily: "'Poppins', sans-serif", padding: '24px' },
  logo:    { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0a2800', textDecoration: 'none', marginBottom: '32px', letterSpacing: '-0.02em' },
  card:    { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title:   { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0a2800', margin: '0 0 6px', letterSpacing: '-0.03em' },
  sub:     { color: '#6b7280', fontSize: '0.9rem', margin: '0 0 28px' },
  row:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  label:   { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px', marginTop: '16px' },
  input:   { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn:     { width: '100%', padding: '13px', marginTop: '24px', background: 'linear-gradient(135deg, #f77f00, #e65c00)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' },
  error:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '4px' },
  success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '4px' },
  perk:    { background: '#f9f6f1', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.82rem', color: '#374151', lineHeight: 1.5 },
  links:   { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', fontSize: '0.85rem' },
  link:    { color: '#f77f00', textDecoration: 'none', fontWeight: 600 },
};

export default function RegisterPage() {
  const router = useRouter();
  const { redirect } = router.query;

  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [message,    setMessage]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(redirect || '/account');
    });
  }, [redirect, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setSubmitting(true);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: `${origin}${redirect || '/account'}`,
      },
    });

    if (err) { setError(err.message); setSubmitting(false); return; }

    if (data.session) {
      try {
        localStorage.setItem('otgj_user', JSON.stringify({
          email:      data.user?.email || email,
          first_name: firstName,
          last_name:  lastName,
        }));
      } catch {}
      router.replace(redirect || '/');
    } else {
      setMessage('Account created! Check your inbox to verify your email, then sign in to claim your 20% welcome discount.');
    }
    setSubmitting(false);
  }

  return (
    <>
      <Head>
        <title>Create Account – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={S.page}>
        <a href="/" style={S.logo}>On The Go Juice</a>
        <div style={S.card}>
          <h1 style={S.title}>Create account</h1>
          <p style={S.sub}>Join and get 20% off your first order</p>
          <div style={S.perk}>
            🎉 <strong>Welcome perk:</strong> Verify your email to unlock an exclusive 20% off discount code — plus earn a free bottle every 7 purchases.
          </div>
          {error   && <p style={S.error}>{error}</p>}
          {message && <p style={S.success}>{message}</p>}
          {!message && (
            <form onSubmit={handleSubmit}>
              <div style={S.row}>
                <div>
                  <label style={S.label}>First name</label>
                  <input style={S.input} type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jane" autoComplete="given-name" />
                </div>
                <div>
                  <label style={S.label}>Last name</label>
                  <input style={S.input} type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Smith" autoComplete="family-name" />
                </div>
              </div>
              <label style={S.label}>Email address</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" autoComplete="new-password" />
              <button style={{ ...S.btn, opacity: submitting ? 0.7 : 1 }} type="submit" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
          <div style={S.links}>
            <span style={{ color: '#9ca3af' }}>Already have an account?</span>
            <a href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={S.link}>Sign in</a>
          </div>
        </div>
      </div>
    </>
  );
}
