import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Connect() {
  const [reviewPressed, setReviewPressed] = useState(false);
  const [shopPressed, setShopPressed] = useState(false);

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

      <main className="page">
        {/* Background blobs */}
        <div className="blob blob-1" aria-hidden="true" />
        <div className="blob blob-2" aria-hidden="true" />

        <div className="hub">

          {/* Logo */}
          <div className="logo-wrap">
            <img src="/images/logo.png" alt="On The Go Juice" className="logo" width={130} height={130} />
          </div>

          {/* Headline */}
          <p className="eyebrow">Welcome</p>
          <h1 className="headline">Thanks for choosing<br />On The Go Juice!</h1>
          <p className="sub">What would you like to do next?</p>

          {/* Buttons */}
          <div className="actions">

            {/* Leave a Review */}
            <a
              href="https://forms.cloud.microsoft/r/LN4Hcc3zp1"
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-primary${reviewPressed ? ' pressed' : ''}`}
              onTouchStart={() => setReviewPressed(true)}
              onTouchEnd={() => setReviewPressed(false)}
              onMouseDown={() => setReviewPressed(true)}
              onMouseUp={() => setReviewPressed(false)}
              onMouseLeave={() => setReviewPressed(false)}
            >
              <span className="btn-icon-wrap">
                <StarIcon />
              </span>
              <span className="btn-inner">
                <span className="btn-label">Leave a Review</span>
                <span className="btn-hint">Takes less than 60 seconds</span>
              </span>
              <span className="btn-arrow">→</span>
            </a>

            {/* Divider */}
            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">or</span>
              <span className="divider-line" />
            </div>

            {/* Shop Our Juices */}
            <Link
              href="/"
              className={`btn btn-secondary${shopPressed ? ' pressed' : ''}`}
              onTouchStart={() => setShopPressed(true)}
              onTouchEnd={() => setShopPressed(false)}
              onMouseDown={() => setShopPressed(true)}
              onMouseUp={() => setShopPressed(false)}
              onMouseLeave={() => setShopPressed(false)}
            >
              <span className="btn-icon-wrap">
                <BagIcon />
              </span>
              <span className="btn-inner">
                <span className="btn-label">Shop Our Juices</span>
                <span className="btn-hint">Browse our full range</span>
              </span>
              <span className="btn-arrow">→</span>
            </Link>

          </div>

          {/* Footer */}
          <p className="footer">
            <Link href="/privacy-policy.html" className="footer-link">Privacy Policy</Link>
            &nbsp;·&nbsp;
            <Link href="/terms-conditions.html" className="footer-link">Terms</Link>
          </p>

        </div>
      </main>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow-x: hidden; }
      `}</style>

      <style jsx>{`
        /* ─── KEYFRAMES ─────────────────────────────────────── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes blobDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 8px 28px rgba(255,107,0,0.35), 0 0 0 0 rgba(255,107,0,0.30); }
          70%  { box-shadow: 0 8px 28px rgba(255,107,0,0.35), 0 0 0 14px rgba(255,107,0,0); }
          100% { box-shadow: 0 8px 28px rgba(255,107,0,0.35), 0 0 0 0 rgba(255,107,0,0); }
        }

        /* ─── PAGE ──────────────────────────────────────────── */
        .page {
          position: relative;
          min-height: 100svh;
          background: #f4f1ec;
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        /* ─── BACKGROUND BLOBS ──────────────────────────────── */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(29,108,0,0.13) 0%, transparent 70%);
          top: -120px;
          right: -80px;
          animation: blobDrift 12s ease-in-out infinite;
        }
        .blob-2 {
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 70%);
          bottom: -80px;
          left: -60px;
          animation: blobDrift 16s ease-in-out infinite reverse;
        }

        /* ─── HUB CONTAINER ─────────────────────────────────── */
        .hub {
          position: relative;
          z-index: 1;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px 64px;
        }

        /* ─── LOGO ──────────────────────────────────────────── */
        .logo-wrap {
          margin-bottom: 28px;
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both,
                     float 6s ease-in-out 0.8s infinite;
          will-change: transform;
        }
        .logo {
          width: 130px;
          height: 130px;
          object-fit: contain;
          border-radius: 28px;
          box-shadow:
            0 12px 40px rgba(29,108,0,0.15),
            0 2px 8px rgba(0,0,0,0.06);
          display: block;
        }

        /* ─── TEXT ──────────────────────────────────────────── */
        .eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #ff6b00;
          margin-bottom: 10px;
          text-align: center;
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both;
        }
        .headline {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(1.65rem, 7vw, 2.1rem);
          font-weight: 900;
          text-align: center;
          color: #0f1f0a;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s both;
        }
        .sub {
          font-size: 0.9rem;
          color: #7a8068;
          text-align: center;
          margin-bottom: 40px;
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.35s both;
        }

        /* ─── ACTIONS ───────────────────────────────────────── */
        .actions {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ─── SHARED BUTTON ─────────────────────────────────── */
        .btn {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 22px 24px;
          border-radius: 20px;
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition:
            transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.22s ease,
            background 0.2s ease,
            color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
        }
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(255,255,255,0.12);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .btn:hover::after { opacity: 1; }
        .btn:hover { transform: translateY(-4px) scale(1.015); }
        .btn.pressed { transform: scale(0.95) !important; }

        /* ─── PRIMARY BUTTON ────────────────────────────────── */
        .btn-primary {
          background: linear-gradient(135deg, #ff6b00 0%, #ff8c33 100%);
          color: #fff;
          animation:
            fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.45s both,
            pulse-ring 2.8s ease-out 1.5s infinite;
        }
        .btn-primary:hover {
          box-shadow: 0 16px 40px rgba(255,107,0,0.45);
        }

        /* ─── SECONDARY BUTTON ──────────────────────────────── */
        .btn-secondary {
          background: #fff;
          color: #1d6c00;
          border: 2px solid #1d6c00;
          box-shadow: 0 4px 16px rgba(29,108,0,0.08);
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.55s both;
        }
        .btn-secondary:hover {
          background: #1d6c00;
          color: #fff;
          box-shadow: 0 16px 36px rgba(29,108,0,0.25);
        }

        /* ─── BUTTON INTERNALS ──────────────────────────────── */
        .btn-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.18);
          flex-shrink: 0;
          transition: background 0.2s ease;
        }
        .btn-secondary .btn-icon-wrap {
          background: rgba(29,108,0,0.08);
          transition: background 0.2s ease;
        }
        .btn-secondary:hover .btn-icon-wrap {
          background: rgba(255,255,255,0.15);
        }
        .btn-inner {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
          flex: 1;
        }
        .btn-label {
          line-height: 1;
          font-size: 1rem;
        }
        .btn-hint {
          font-family: 'Poppins', sans-serif;
          font-size: 0.71rem;
          font-weight: 400;
          opacity: 0.75;
        }
        .btn-arrow {
          font-size: 1.1rem;
          opacity: 0.55;
          margin-left: auto;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .btn:hover .btn-arrow {
          transform: translateX(4px);
          opacity: 0.9;
        }

        /* ─── DIVIDER ───────────────────────────────────────── */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.50s both;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(0,0,0,0.10);
        }
        .divider-text {
          color: #aaa;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        /* ─── FOOTER ────────────────────────────────────────── */
        .footer {
          margin-top: 44px;
          font-size: 0.68rem;
          color: #c0bab0;
          text-align: center;
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.65s both;
        }
        .footer-link {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: #7a8068; }

        /* ─── MOBILE ────────────────────────────────────────── */
        @media (max-width: 390px) {
          .hub { padding: 36px 18px 52px; }
          .logo { width: 110px; height: 110px; }
          .headline { font-size: 1.55rem; }
          .btn { padding: 20px 18px; gap: 12px; }
          .btn-icon-wrap { width: 40px; height: 40px; }
          .btn-label { font-size: 0.95rem; }
        }
        @media (max-width: 320px) {
          .headline { font-size: 1.35rem; }
          .btn { padding: 18px 16px; }
        }
      `}</style>
    </>
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
