import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function RealReactions() {
  const [videos, setVideos]   = useState(null);
  const [error,  setError]    = useState(false);

  useEffect(() => {
    fetch('/api/testimonials/public')
      .then(r => r.json())
      .then(data => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setError(true));
  }, []);

  return (
    <>
      <Head>
        <title>Real Reactions | On The Go Juice</title>
        <meta name="description" content="Watch real people experience the taste of On The Go Juice for the very first time." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="rr-page">

        {/* ── NAV ──────────────────────────────────────────── */}
        <nav className="rr-nav">
          <Link href="/" className="rr-nav-logo">
            <img src="/images/logo.webp" alt="On The Go Juice" width={40} height={40} />
            <span>On The Go Juice</span>
          </Link>
          <Link href="/connect" className="rr-nav-cta">Share Yours →</Link>
        </nav>

        {/* ── HERO ─────────────────────────────────────────── */}
        <header className="rr-hero">
          <p className="rr-eyebrow">Unfiltered. Unscripted.</p>
          <h1 className="rr-headline">Real Reactions</h1>
          <p className="rr-tagline">
            Watch real people experience the taste of On The Go Juice<br className="rr-br" /> for the very first time.
          </p>
          <Link href="/connect" className="rr-hero-btn">
            🎬 &nbsp;Share Your Reaction
          </Link>
        </header>

        {/* ── GRID ─────────────────────────────────────────── */}
        <section className="rr-section">
          {videos === null && !error && (
            <div className="rr-loading">
              <div className="rr-spinner" />
              <p>Loading reactions…</p>
            </div>
          )}

          {error && (
            <div className="rr-empty">
              <span>⚠️</span>
              <p>Could not load videos. Please try refreshing.</p>
            </div>
          )}

          {videos !== null && videos.length === 0 && (
            <div className="rr-empty">
              <span>🎬</span>
              <p>No reactions yet — be the first to share yours!</p>
              <Link href="/connect" className="rr-empty-btn">Upload a Real Reaction</Link>
            </div>
          )}

          {videos && videos.length > 0 && (
            <div className="rr-grid">
              {videos.map(v => (
                <VideoCard key={v.id} testimonial={v} />
              ))}
            </div>
          )}
        </section>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer className="rr-footer">
          <Link href="/" className="rr-footer-link">← Back to shop</Link>
          <span>·</span>
          <Link href="/connect" className="rr-footer-link">Share your reaction</Link>
        </footer>

      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; }

        @keyframes rr-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rr-spin {
          to { transform: rotate(360deg); }
        }

        .rr-page {
          min-height: 100vh;
          background: #0d1a0a;
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #fff;
        }

        /* ── NAV ─────────────────────────────────────────── */
        .rr-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 64px;
          background: rgba(13,26,10,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .rr-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.9rem;
        }
        .rr-nav-logo img {
          border-radius: 8px;
        }
        .rr-nav-cta {
          background: #ff6b00;
          color: #fff;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 8px 18px;
          border-radius: 20px;
          letter-spacing: 0.02em;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .rr-nav-cta:hover { background: #ff8c33; transform: translateY(-1px); }

        /* ── HERO ────────────────────────────────────────── */
        .rr-hero {
          text-align: center;
          padding: 72px 24px 56px;
          animation: rr-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        .rr-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #ff6b00;
          margin-bottom: 12px;
        }
        .rr-headline {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(2.6rem, 8vw, 5rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.0;
          background: linear-gradient(135deg, #ffffff 30%, #a3e635 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
        }
        .rr-tagline {
          font-size: clamp(0.9rem, 2.5vw, 1.1rem);
          color: rgba(255,255,255,0.6);
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto 36px;
        }
        .rr-br { display: none; }
        @media (min-width: 560px) { .rr-br { display: block; } }

        .rr-hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #ff6b00, #ff8c33);
          color: #fff;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
          padding: 14px 32px;
          border-radius: 50px;
          box-shadow: 0 8px 32px rgba(255,107,0,0.35);
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
          letter-spacing: 0.01em;
        }
        .rr-hero-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 14px 40px rgba(255,107,0,0.45);
        }

        /* ── SECTION ─────────────────────────────────────── */
        .rr-section {
          padding: 0 20px 80px;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ── GRID ────────────────────────────────────────── */
        .rr-grid {
          columns: 1;
          column-gap: 16px;
        }
        @media (min-width: 560px)  { .rr-grid { columns: 2; } }
        @media (min-width: 900px)  { .rr-grid { columns: 3; } }
        @media (min-width: 1200px) { .rr-grid { columns: 4; } }

        /* ── LOADING / EMPTY ─────────────────────────────── */
        .rr-loading, .rr-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 80px 24px;
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
        }
        .rr-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #ff6b00;
          border-radius: 50%;
          animation: rr-spin 0.8s linear infinite;
        }
        .rr-empty span { font-size: 2.5rem; }
        .rr-empty-btn {
          margin-top: 8px;
          background: #ff6b00;
          color: #fff;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 12px 28px;
          border-radius: 50px;
          transition: background 0.2s ease;
        }
        .rr-empty-btn:hover { background: #ff8c33; }

        /* ── FOOTER ──────────────────────────────────────── */
        .rr-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
        }
        .rr-footer-link {
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .rr-footer-link:hover { color: rgba(255,255,255,0.75); }
      `}</style>
    </>
  );
}

function VideoCard({ testimonial }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  }

  return (
    <div className="rr-card" onClick={toggle}>
      <video
        ref={videoRef}
        src={testimonial.video_url}
        muted
        loop
        playsInline
        preload="metadata"
        className="rr-video"
      />
      <div className={`rr-play-btn${playing ? ' rr-hidden' : ''}`} aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>
      <div className="rr-card-info">
        <p className="rr-card-name">{testimonial.customer_name}</p>
        {testimonial.caption && <p className="rr-card-caption">"{testimonial.caption}"</p>}
      </div>

      <style jsx>{`
        .rr-card {
          break-inside: avoid;
          margin-bottom: 16px;
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          background: #1a2a14;
          animation: rr-fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .rr-card:hover .rr-play-btn { opacity: 1; }
        .rr-video {
          display: block;
          width: 100%;
          aspect-ratio: 9/16;
          object-fit: cover;
          border-radius: 16px;
        }
        .rr-play-btn {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.35);
          border-radius: 16px;
          opacity: 1;
          transition: opacity 0.25s ease;
        }
        .rr-play-btn svg {
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        }
        .rr-hidden { opacity: 0 !important; }
        .rr-card-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 36px 14px 14px;
          background: linear-gradient(to top, rgba(0,0,0,0.75), transparent);
          border-radius: 0 0 16px 16px;
        }
        .rr-card-name {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.85rem;
          color: #fff;
          line-height: 1.2;
        }
        .rr-card-caption {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.7);
          margin-top: 3px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
