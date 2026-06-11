import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Connect() {
  const [reviewPressed, setReviewPressed] = useState(false);
  const [shopPressed,   setShopPressed]   = useState(false);

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

      <main className="cx-page">
        <div className="cx-blob cx-blob-1" aria-hidden="true" />
        <div className="cx-blob cx-blob-2" aria-hidden="true" />

        <div className="cx-hub">

          <div className="cx-logo-wrap">
            <img src="/images/logo.png" alt="On The Go Juice" className="cx-logo" width={130} height={130} />
          </div>

          <p className="cx-eyebrow">Welcome</p>
          <h1 className="cx-headline">Thanks for choosing<br />On The Go Juice!</h1>
          <p className="cx-sub">What would you like to do next?</p>

          <div className="cx-actions">

            <a
              href="https://forms.cloud.microsoft/r/LN4Hcc3zp1"
              target="_blank"
              rel="noopener noreferrer"
              className={`cx-btn cx-btn-primary${reviewPressed ? ' cx-pressed' : ''}`}
              onMouseDown={() => setReviewPressed(true)}
              onMouseUp={() => setReviewPressed(false)}
              onMouseLeave={() => setReviewPressed(false)}
              onTouchStart={() => setReviewPressed(true)}
              onTouchEnd={() => setReviewPressed(false)}
            >
              <span className="cx-icon-wrap"><StarIcon /></span>
              <span className="cx-btn-inner">
                <span className="cx-btn-label">Leave a Review</span>
                <span className="cx-btn-hint">Takes less than 60 seconds</span>
              </span>
              <span className="cx-arrow">→</span>
            </a>

            <div className="cx-divider">
              <span className="cx-divider-line" />
              <span className="cx-divider-text">or</span>
              <span className="cx-divider-line" />
            </div>

            <Link
              href="/"
              className={`cx-btn cx-btn-secondary${shopPressed ? ' cx-pressed' : ''}`}
              onMouseDown={() => setShopPressed(true)}
              onMouseUp={() => setShopPressed(false)}
              onMouseLeave={() => setShopPressed(false)}
              onTouchStart={() => setShopPressed(true)}
              onTouchEnd={() => setShopPressed(false)}
            >
              <span className="cx-icon-wrap"><BagIcon /></span>
              <span className="cx-btn-inner">
                <span className="cx-btn-label">Shop Our Juices</span>
                <span className="cx-btn-hint">Browse our full range</span>
              </span>
              <span className="cx-arrow">→</span>
            </Link>

          </div>

          {/* App Download */}
          <div className="cx-app-section">
            <div className="cx-app-divider">
              <span className="cx-app-divider-line" />
              <span className="cx-app-divider-label">
                <PhoneIcon /> Get the app
              </span>
              <span className="cx-app-divider-line" />
            </div>

            <div className="cx-app-row">

              <a href="#" aria-disabled="true" className="cx-app-btn" tabIndex={-1}>
                <span className="cx-app-coming">Coming Soon</span>
                <AppleIcon />
                <span className="cx-app-btn-inner">
                  <span className="cx-app-store-line">Download on the</span>
                  <span className="cx-app-store-name">App Store</span>
                </span>
              </a>

              <a href="#" aria-disabled="true" className="cx-app-btn" tabIndex={-1}>
                <span className="cx-app-coming">Coming Soon</span>
                <GooglePlayIcon />
                <span className="cx-app-btn-inner">
                  <span className="cx-app-store-line">Get it on</span>
                  <span className="cx-app-store-name">Google Play</span>
                </span>
              </a>

            </div>
          </div>

          <p className="cx-footer">
            <Link href="/privacy-policy.html" className="cx-footer-link">Privacy Policy</Link>
            &nbsp;·&nbsp;
            <Link href="/terms-conditions.html" className="cx-footer-link">Terms</Link>
          </p>

        </div>
      </main>

      <style jsx global>{`
        /* ── RESET ─────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow-x: hidden; }

        /* ── KEYFRAMES ─────────────────────────────────────── */
        @keyframes cx-fadeUp {
          from { opacity: 0; transform: translateY(26px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cx-float {
          0%, 100% { transform: translateY(0px)   rotate(-1deg); }
          50%       { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes cx-blob {
          0%, 100% { transform: translate(0,0) scale(1); }
          40%       { transform: translate(28px,-18px) scale(1.06); }
          70%       { transform: translate(-18px,14px) scale(0.96); }
        }
        @keyframes cx-pulse {
          0%   { box-shadow: 0 8px 28px rgba(255,107,0,0.38), 0 0 0 0   rgba(255,107,0,0.28); }
          70%  { box-shadow: 0 8px 28px rgba(255,107,0,0.38), 0 0 0 14px rgba(255,107,0,0);   }
          100% { box-shadow: 0 8px 28px rgba(255,107,0,0.38), 0 0 0 0   rgba(255,107,0,0);   }
        }

        /* ── PAGE ──────────────────────────────────────────── */
        .cx-page {
          position: relative;
          min-height: 100svh;
          background: #f4f1ec;
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        /* ── BLOBS ─────────────────────────────────────────── */
        .cx-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(72px);
          pointer-events: none;
          z-index: 0;
        }
        .cx-blob-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(29,108,0,0.13) 0%, transparent 70%);
          top: -130px; right: -90px;
          animation: cx-blob 13s ease-in-out infinite;
        }
        .cx-blob-2 {
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 70%);
          bottom: -90px; left: -70px;
          animation: cx-blob 17s ease-in-out infinite reverse;
        }

        /* ── HUB ───────────────────────────────────────────── */
        .cx-hub {
          position: relative;
          z-index: 1;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px 64px;
        }

        /* ── LOGO ──────────────────────────────────────────── */
        .cx-logo-wrap {
          margin-bottom: 28px;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0s both,
                     cx-float  6s   ease-in-out               0.8s infinite;
          will-change: transform;
        }
        .cx-logo {
          width: 130px; height: 130px;
          object-fit: contain;
          border-radius: 28px;
          box-shadow: 0 12px 40px rgba(29,108,0,0.15), 0 2px 8px rgba(0,0,0,0.06);
          display: block;
        }

        /* ── TEXT ──────────────────────────────────────────── */
        .cx-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #ff6b00;
          margin-bottom: 10px;
          text-align: center;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s both;
        }
        .cx-headline {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(1.6rem, 7vw, 2.1rem);
          font-weight: 900;
          text-align: center;
          color: #0f1f0a;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.22s both;
        }
        .cx-sub {
          font-size: 0.9rem;
          color: #7a8068;
          text-align: center;
          margin-bottom: 40px;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.32s both;
        }

        /* ── ACTIONS ───────────────────────────────────────── */
        .cx-actions {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ── BUTTON BASE ───────────────────────────────────── */
        .cx-btn {
          display: flex !important;
          align-items: center !important;
          gap: 14px !important;
          width: 100% !important;
          padding: 20px 22px !important;
          border-radius: 20px !important;
          font-family: 'Montserrat', sans-serif !important;
          font-size: 1rem !important;
          font-weight: 800 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          border: none !important;
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.22s ease,
                      background  0.2s  ease,
                      color       0.2s  ease !important;
          -webkit-tap-highlight-color: transparent !important;
          user-select: none !important;
          position: relative !important;
          overflow: hidden !important;
        }
        .cx-btn:hover  { transform: translateY(-4px) scale(1.015) !important; }
        .cx-pressed    { transform: scale(0.95) !important; }

        /* ── PRIMARY ───────────────────────────────────────── */
        .cx-btn-primary {
          background: linear-gradient(135deg, #ff6b00 0%, #ff8c33 100%) !important;
          color: #ffffff !important;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.42s both,
                     cx-pulse  2.8s  ease-out               1.6s  infinite;
        }
        .cx-btn-primary:hover {
          box-shadow: 0 16px 40px rgba(255,107,0,0.45) !important;
        }

        /* ── SECONDARY ─────────────────────────────────────── */
        .cx-btn-secondary {
          background: #ffffff !important;
          color: #1d6c00 !important;
          border: 2px solid #1d6c00 !important;
          box-shadow: 0 4px 16px rgba(29,108,0,0.08) !important;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.52s both;
        }
        .cx-btn-secondary:hover {
          background: #1d6c00 !important;
          color: #ffffff !important;
          box-shadow: 0 16px 36px rgba(29,108,0,0.25) !important;
        }

        /* ── ICON WRAP ─────────────────────────────────────── */
        .cx-icon-wrap {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 44px !important;
          height: 44px !important;
          border-radius: 12px !important;
          background: rgba(255,255,255,0.2) !important;
          flex-shrink: 0 !important;
          transition: background 0.2s ease !important;
        }
        .cx-btn-secondary .cx-icon-wrap {
          background: rgba(29,108,0,0.09) !important;
        }
        .cx-btn-secondary:hover .cx-icon-wrap {
          background: rgba(255,255,255,0.15) !important;
        }

        /* ── BUTTON INTERNALS ──────────────────────────────── */
        .cx-btn-inner {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 3px !important;
          flex: 1 !important;
        }
        .cx-btn-label {
          line-height: 1 !important;
          font-size: 1rem !important;
          font-weight: 800 !important;
          font-family: 'Montserrat', sans-serif !important;
        }
        .cx-btn-hint {
          font-family: 'Poppins', sans-serif !important;
          font-size: 0.70rem !important;
          font-weight: 400 !important;
          opacity: 0.75 !important;
        }
        .cx-arrow {
          font-size: 1.1rem !important;
          opacity: 0.50 !important;
          margin-left: auto !important;
          transition: transform 0.2s ease, opacity 0.2s ease !important;
        }
        .cx-btn:hover .cx-arrow {
          transform: translateX(4px) !important;
          opacity: 0.9 !important;
        }

        /* ── DIVIDER ───────────────────────────────────────── */
        .cx-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.47s both;
        }
        .cx-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(0,0,0,0.10);
          display: block;
        }
        .cx-divider-text {
          color: #aaa;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        /* ── FOOTER ────────────────────────────────────────── */
        .cx-footer {
          margin-top: 44px;
          font-size: 0.68rem;
          color: #c0bab0;
          text-align: center;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.62s both;
        }
        .cx-footer-link {
          color: #c0bab0 !important;
          text-decoration: none !important;
          transition: color 0.2s !important;
        }
        .cx-footer-link:hover { color: #7a8068 !important; }

        /* ── APP SECTION ───────────────────────────────────── */
        .cx-app-section {
          width: 100%;
          max-width: 440px;
          margin-top: 28px;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.62s both;
        }
        .cx-app-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .cx-app-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(0,0,0,0.08);
          display: block;
        }
        .cx-app-divider-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #a8a097;
          white-space: nowrap;
        }

        /* ── APP BUTTONS ROW ───────────────────────────────── */
        .cx-app-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ── INDIVIDUAL APP BUTTON ─────────────────────────── */
        .cx-app-btn {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 14px 16px !important;
          border-radius: 16px !important;
          background: #1a1a1a !important;
          color: #ffffff !important;
          text-decoration: none !important;
          cursor: not-allowed !important;
          opacity: 0.55 !important;
          pointer-events: none !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18) !important;
          overflow: hidden !important;
          filter: grayscale(0.3) !important;
        }

        /* Coming Soon badge */
        .cx-app-coming {
          position: absolute !important;
          top: 7px !important;
          right: 8px !important;
          background: #ff6b00 !important;
          color: #fff !important;
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.5rem !important;
          font-weight: 800 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          padding: 2px 6px !important;
          border-radius: 6px !important;
          line-height: 1.4 !important;
        }

        .cx-app-btn-inner {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 1px !important;
        }
        .cx-app-store-line {
          font-family: 'Poppins', sans-serif !important;
          font-size: 0.6rem !important;
          font-weight: 400 !important;
          opacity: 0.7 !important;
          line-height: 1 !important;
        }
        .cx-app-store-name {
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.85rem !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          letter-spacing: -0.01em !important;
        }

        /* ── MOBILE ────────────────────────────────────────── */
        @media (max-width: 390px) {
          .cx-hub  { padding: 36px 18px 52px; }
          .cx-logo { width: 110px; height: 110px; }
          .cx-headline { font-size: 1.5rem; }
          .cx-btn  { padding: 18px 18px !important; gap: 12px !important; }
          .cx-icon-wrap { width: 40px !important; height: 40px !important; }
        }
        @media (max-width: 320px) {
          .cx-headline { font-size: 1.3rem; }
          .cx-btn { padding: 16px 14px !important; }
        }
      `}</style>
    </>
  );
}

function PhoneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-11.47-2.68-2.68L3.18 23.76z" opacity=".8" />
      <path d="M22.14 10.53l-3.06-1.76-3.06 2.78 3.06 3.06 3.09-1.78c.88-.51.88-1.79-.03-2.3z" opacity=".9" />
      <path d="M3.18.24C2.88.07 2.54 0 2.19.04L14.09 12 11.41 14.69.81 4.14 3.18.24z" opacity=".7" />
      <path d="M2.19.04C1.33.17.75.96.75 1.98v20.04c0 1.02.58 1.81 1.44 1.94L14.09 12 2.19.04z" opacity=".6" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
