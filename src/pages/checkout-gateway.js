import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

const S = {
  page:    { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9f6f1', fontFamily: "'Poppins', sans-serif", padding: '24px' },
  logo:    { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0a2800', textDecoration: 'none', marginBottom: '8px', letterSpacing: '-0.02em' },
  tagline: { color: '#6b7280', fontSize: '0.85rem', marginBottom: '40px' },
  title:   { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.5rem', color: '#0a2800', textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.03em' },
  sub:     { color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', margin: '0 0 36px' },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%', maxWidth: '700px' },
  card:    { background: '#fff', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s', border: '2px solid transparent' },
  icon:    { fontSize: '2rem', marginBottom: '4px' },
  cName:   { fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0a2800' },
  cDesc:   { color: '#6b7280', fontSize: '0.8rem', lineHeight: 1.5 },
  badge:   { background: 'linear-gradient(135deg, #f77f00, #e65c00)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', letterSpacing: '0.04em' },
  cBtn:    { marginTop: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', width: '100%' },
  back:    { marginTop: '28px', color: '#9ca3af', fontSize: '0.82rem', textDecoration: 'none' },
};

const OPTIONS = [
  {
    icon:  '✨',
    name:  'Create Account',
    desc:  'Get 20% off your first order plus earn rewards on every purchase.',
    badge: '20% OFF',
    color: '#f77f00',
    bg:    'linear-gradient(135deg, #f77f00, #e65c00)',
    href:  '/register?redirect=/checkout',
  },
  {
    icon:  '👤',
    name:  'Sign In',
    desc:  'Already have an account? Earn loyalty points on this order.',
    badge: null,
    color: '#0a2800',
    bg:    '#0a2800',
    href:  '/login?redirect=/checkout',
  },
  {
    icon:  '🛒',
    name:  'Guest Checkout',
    desc:  'Continue without an account. No rewards or discounts applied.',
    badge: null,
    color: '#6b7280',
    bg:    '#f3f4f6',
    href:  '/checkout',
  },
];

export default function CheckoutGateway() {
  const router  = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Already logged in — skip gateway and go straight to checkout
        router.replace('/checkout');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  if (!ready) {
    return (
      <div style={{ ...S.page, gap: '12px' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #f77f00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={S.page}>
        <a href="/" style={S.logo}>On The Go Juice</a>
        <p style={S.tagline}>Fresh. Natural. On The Go.</p>
        <h1 style={S.title}>How would you like to continue?</h1>
        <p style={S.sub}>Create an account to unlock exclusive rewards and discounts.</p>
        <div style={S.grid}>
          {OPTIONS.map(opt => (
            <a key={opt.name} href={opt.href} style={{ textDecoration: 'none' }}>
              <div
                style={S.card}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={S.icon}>{opt.icon}</div>
                {opt.badge && <span style={S.badge}>{opt.badge}</span>}
                <p style={S.cName}>{opt.name}</p>
                <p style={S.cDesc}>{opt.desc}</p>
                <button
                  style={{
                    ...S.cBtn,
                    background: opt.bg,
                    color: opt.name === 'Guest Checkout' ? '#374151' : '#fff',
                  }}
                >
                  {opt.name}
                </button>
              </div>
            </a>
          ))}
        </div>
        <a href="/" style={S.back}>← Back to shop</a>
      </div>
    </>
  );
}
