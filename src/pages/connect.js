import Head from 'next/head';
import Link from 'next/link';

export default function Connect() {
  return (
    <>
      <Head>
        <title>On The Go Juice</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <main style={S.page}>
        <div style={S.hub}>

          {/* Logo */}
          <img src="/images/logo.png" alt="On The Go Juice" style={S.logo} width={120} height={120} />

          {/* Headline */}
          <p style={S.eyebrow}>Welcome</p>
          <h1 style={S.headline}>Thanks for choosing<br />On The Go Juice!</h1>
          <p style={S.sub}>What would you like to do next?</p>

          {/* Buttons */}
          <div style={S.actions}>

            {/* Leave a Review */}
            <a
              href="https://forms.cloud.microsoft/r/LN4Hcc3zp1"
              target="_blank"
              rel="noopener noreferrer"
              style={S.btnPrimary}
              onMouseEnter={e => Object.assign(e.currentTarget.style, S.btnPrimaryHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, S.btnPrimary)}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <StarIcon />
              <div style={S.btnInner}>
                <span style={S.btnLabel}>Leave a Review</span>
                <span style={S.btnHint}>Takes less than 60 seconds</span>
              </div>
            </a>

            {/* Divider */}
            <div style={S.divider}>
              <span style={S.dividerLine} />
              <span style={S.dividerText}>or</span>
              <span style={S.dividerLine} />
            </div>

            {/* Shop Our Juices */}
            <Link
              href="/"
              style={S.btnSecondary}
              onMouseEnter={e => Object.assign(e.currentTarget.style, S.btnSecondaryHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, S.btnSecondary)}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <BagIcon />
              <div style={S.btnInner}>
                <span style={S.btnLabel}>Shop Our Juices</span>
                <span style={S.btnHint}>Browse our full range</span>
              </div>
            </Link>

          </div>

          {/* Footer links */}
          <p style={S.footer}>
            <Link href="/privacy-policy.html" style={S.footerLink}>Privacy Policy</Link>
            &nbsp;·&nbsp;
            <Link href="/terms-conditions.html" style={S.footerLink}>Terms</Link>
          </p>

        </div>
      </main>
    </>
  );
}

function StarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

const S = {
  page: {
    minHeight: '100svh',
    fontFamily: "'Poppins', sans-serif",
    background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(29,108,0,0.10) 0%, transparent 70%), #f9f6f1',
    WebkitFontSmoothing: 'antialiased',
  },
  hub: {
    minHeight: '100svh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px 60px',
  },
  logo: {
    width: 120,
    height: 120,
    objectFit: 'contain',
    marginBottom: 24,
    borderRadius: 24,
    boxShadow: '0 8px 32px rgba(29,108,0,0.12)',
  },
  eyebrow: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#ff6b00',
    marginBottom: 8,
    textAlign: 'center',
  },
  headline: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 'clamp(1.5rem, 6vw, 2rem)',
    fontWeight: 900,
    textAlign: 'center',
    color: '#111111',
    lineHeight: 1.2,
    marginBottom: 8,
  },
  sub: {
    fontSize: '0.92rem',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 44,
    maxWidth: 300,
  },
  actions: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '20px 28px',
    borderRadius: 16,
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    textDecoration: 'none',
    cursor: 'pointer',
    background: '#ff6b00',
    color: '#fff',
    boxShadow: '0 8px 28px rgba(255,107,0,0.35)',
    transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s cubic-bezier(0.4,0,0.2,1), background 0.18s ease',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transform: 'scale(1)',
  },
  btnPrimaryHover: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '20px 28px',
    borderRadius: 16,
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    textDecoration: 'none',
    cursor: 'pointer',
    background: '#ff8c33',
    color: '#fff',
    boxShadow: '0 14px 36px rgba(255,107,0,0.40)',
    transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s cubic-bezier(0.4,0,0.2,1), background 0.18s ease',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transform: 'translateY(-3px) scale(1.02)',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '20px 28px',
    borderRadius: 16,
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    textDecoration: 'none',
    cursor: 'pointer',
    background: '#fff',
    color: '#1d6c00',
    border: '2.5px solid #1d6c00',
    boxShadow: '0 4px 16px rgba(29,108,0,0.10)',
    transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s cubic-bezier(0.4,0,0.2,1), background 0.18s ease',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transform: 'scale(1)',
  },
  btnSecondaryHover: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '20px 28px',
    borderRadius: 16,
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    textDecoration: 'none',
    cursor: 'pointer',
    background: '#1d6c00',
    color: '#fff',
    border: '2.5px solid #1d6c00',
    boxShadow: '0 12px 32px rgba(29,108,0,0.22)',
    transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s cubic-bezier(0.4,0,0.2,1), background 0.18s ease',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transform: 'translateY(-3px) scale(1.02)',
  },
  btnInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  btnLabel: {
    lineHeight: 1,
  },
  btnHint: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.72rem',
    fontWeight: 400,
    opacity: 0.80,
    letterSpacing: 0,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#ddd',
  },
  dividerText: {
    color: '#ccc',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 48,
    fontSize: '0.7rem',
    color: '#bbb',
    textAlign: 'center',
  },
  footerLink: {
    color: '#bbb',
    textDecoration: 'none',
  },
};
