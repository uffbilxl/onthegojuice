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
  label:   { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px', marginTop: '16px' },
  input:   { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn:     { width: '100%', padding: '13px', marginTop: '24px', background: 'linear-gradient(135deg, #f77f00, #e65c00)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' },
  error:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '4px' },
  success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', padding: '12px 16px', fontSize: '0.875rem', lineHeight: 1.6 },
};

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    // Supabase puts the access token in the URL hash after the email link is clicked.
    // onAuthStateChange fires with event PASSWORD_RECOVERY once the hash is consumed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionOk(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.replace('/account'), 2500);
  }

  return (
    <>
      <Head>
        <title>Set New Password – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={S.page}>
        <a href="/" style={S.logo}>On The Go Juice</a>
        <div style={S.card}>
          <h1 style={S.title}>Set new password</h1>
          <p style={S.sub}>Choose a strong password for your account.</p>
          {error && <p style={S.error}>{error}</p>}
          {done ? (
            <div style={S.success}>
              ✅ <strong>Password updated!</strong> Redirecting you to your account…
            </div>
          ) : !sessionOk ? (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Waiting for the reset link… If this page stays blank, please click the link in your email again.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label style={S.label}>New password</label>
              <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" autoComplete="new-password" />
              <label style={S.label}>Confirm new password</label>
              <input style={S.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password" autoComplete="new-password" />
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
