import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ThankYouPage() {
  const [orderRef, setOrderRef] = useState('#OTGJ-...');
  const [email, setEmail] = useState('your inbox');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      const short = sessionId.slice(-4).toUpperCase();
      setOrderRef(`#OTGJ-${short}`);
    }
    const storedEmail = sessionStorage.getItem('otgj_order_email');
    if (storedEmail) setEmail(storedEmail);

    localStorage.removeItem('otgj_cart');
  }, []);

  return (
    <>
      <Head>
        <title>Order Confirmed – On The Go Juice</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #1d6c00; --green-dark: #154f00; --black: #111; --white: #fff;
          --off-white: #f9f6f1; --grey: #6b7280;
          --font-main: 'Poppins', sans-serif; --font-accent: 'Montserrat', sans-serif;
        }
        body { font-family: var(--font-main); background: var(--off-white); min-height: 100vh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      <header style={{ background: '#111', padding: '0 6vw', height: 68, display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/images/logo.png" alt="On The Go Juice" style={{ height: 52, width: 'auto' }} onError={(e) => { e.target.style.display='none'; }} />
        </Link>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 6vw' }}>
        <div style={{
          background: '#fff', borderRadius: 24, padding: '60px 48px', maxWidth: 520, width: '100%',
          textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          animation: 'cardIn 0.55s cubic-bezier(0.25,1,0.5,1) forwards',
        }}>
          <div style={{
            width: 72, height: 72, background: '#dcfce7', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-accent)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Order Confirmed!
          </h1>
          <p style={{ color: 'var(--grey)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 32 }}>
            Thank you for your order. David will be in touch shortly to confirm your delivery slot or pickup details.
          </p>
          <div style={{ background: 'var(--off-white)', borderRadius: 10, padding: '14px 20px', fontSize: '0.85rem', color: 'var(--grey)', marginBottom: 28 }}>
            Order reference: <strong style={{ color: '#111' }}>{orderRef}</strong>
          </div>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px',
            background: 'var(--green)', color: '#fff', fontFamily: 'var(--font-accent)',
            fontWeight: 700, fontSize: '0.95rem', borderRadius: 999,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Shop
          </Link>
          <p style={{ fontSize: '0.78rem', color: 'var(--grey)', marginTop: 16 }}>
            A confirmation email has been sent to <strong>{email}</strong>.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
