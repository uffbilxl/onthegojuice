import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabaseClient';

const S = {
  page:    { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9f6f1', fontFamily: "'Poppins', sans-serif", padding: '24px' },
  logo:    { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0a2800', textDecoration: 'none', marginBottom: '32px', letterSpacing: '-0.02em' },
  card:    { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title:   { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#0a2800', margin: '0 0 6px', letterSpacing: '-0.03em' },
  sub:     { color: '#6b7280', fontSize: '0.9rem', margin: '0 0 28px' },
  label:   { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px', marginTop: '16px' },
  input:   { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn:     { width: '100%', padding: '13px', marginTop: '24px', background: 'linear-gradient(135deg, #f77f00, #e65c00)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' },
  error:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '4px' },
  success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', padding: '12px 16px', fontSize: '0.875rem', lineHeight: 1.6 },
  back:    { display: 'block', textAlign: 'center', marginTop: '20px', color: '#f77f00', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' },
};

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Reset Password – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={S.page}>
        <a href="/" style={S.logo}>On The Go Juice</a>
        <div style={S.card}>
          <h1 style={S.title}>Forgot password?</h1>
          <p style={S.sub}>Enter your email and we'll send a reset link.</p>
          {error && <p style={S.error}>{error}</p>}
          {sent ? (
            <div style={S.success}>
              ✅ <strong>Check your inbox.</strong> We've sent a password reset link to <strong>{email}</strong>. The link expires in 1 hour.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label style={S.label}>Email address</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <a href="/login" style={S.back}>← Back to sign in</a>
        </div>
      </div>
    </>
  );
}
