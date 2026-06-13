import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef } from 'react';

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME    || 'root';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'OnTheGoJuice';

export default function Connect() {
  const [reviewPressed, setReviewPressed] = useState(false);
  const [shopPressed,   setShopPressed]   = useState(false);
  const [vidPressed,    setVidPressed]    = useState(false);
  const [showModal,     setShowModal]     = useState(false);

  // Upload form state
  const [formName,    setFormName]    = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formFile,    setFormFile]    = useState(null);
  const [fileError,   setFileError]   = useState('');
  const [uploadState, setUploadState] = useState('idle'); // idle|uploading|saving|success|error
  const [uploadPct,   setUploadPct]   = useState(0);
  const [errMsg,      setErrMsg]      = useState('');
  const fileInputRef = useRef(null);

  function openModal()  { setShowModal(true);  document.body.style.overflow = 'hidden'; }
  function closeModal() {
    if (uploadState === 'uploading' || uploadState === 'saving') return;
    setShowModal(false);
    document.body.style.overflow = '';
    setFormName(''); setFormCaption(''); setFormFile(null); setFileError('');
    setUploadState('idle'); setUploadPct(0); setErrMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e) {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) { setFormFile(null); return; }
    if (!file.type.startsWith('video/')) { setFileError('Please select a video file (.mp4, .mov, etc.)'); setFormFile(null); return; }
    if (file.size > 20 * 1024 * 1024)   { setFileError('Video must be under 20 MB.'); setFormFile(null); return; }
    setFormFile(file);
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!formName.trim()) return;
    if (!formFile)        return;

    setUploadState('uploading');
    setUploadPct(0);
    setErrMsg('');

    try {
      // 1. Upload to Cloudinary via XHR for progress tracking
      const fd = new FormData();
      fd.append('file',          formFile);
      fd.append('upload_preset', UPLOAD_PRESET);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

      const cloudRes = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', ev => {
          if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 90));
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(`Cloudinary error: ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
        xhr.open('POST', cloudinaryUrl);
        xhr.send(fd);
      });

      if (!cloudRes.secure_url) throw new Error('Upload failed — no URL returned.');

      // Insert q_auto,f_auto into delivery URL
      const optimisedUrl = cloudRes.secure_url.replace('/upload/', '/upload/q_auto,f_auto/');

      setUploadPct(95);
      setUploadState('saving');

      // 2. Save to our DB
      const saveRes = await fetch('/api/testimonials/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          customer_name:        formName.trim(),
          video_url:            optimisedUrl,
          cloudinary_public_id: cloudRes.public_id,
          caption:              formCaption.trim() || null,
        }),
      });

      if (!saveRes.ok) {
        const d = await saveRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save your submission.');
      }

      setUploadPct(100);
      setUploadState('success');
    } catch (err) {
      console.error(err);
      setErrMsg(err.message || 'Something went wrong. Please try again.');
      setUploadState('error');
    }
  }

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

          {/* Divider */}
            <div className="cx-divider">
              <span className="cx-divider-line" />
              <span className="cx-divider-text">or</span>
              <span className="cx-divider-line" />
            </div>

            {/* Upload a Real Reaction */}
            <button
              type="button"
              className={`cx-btn cx-btn-video${vidPressed ? ' cx-pressed' : ''}`}
              onClick={openModal}
              onMouseDown={() => setVidPressed(true)}
              onMouseUp={() => setVidPressed(false)}
              onMouseLeave={() => setVidPressed(false)}
              onTouchStart={() => setVidPressed(true)}
              onTouchEnd={() => setVidPressed(false)}
            >
              <span className="cx-icon-wrap"><CamIcon /></span>
              <span className="cx-btn-inner">
                <span className="cx-btn-label">Upload a Real Reaction</span>
                <span className="cx-btn-hint">Share your first-taste moment</span>
              </span>
              <span className="cx-arrow">→</span>
            </button>

          </div>

          {/* ── UPLOAD MODAL ────────────────────────────────── */}
          {showModal && (
            <div className="cx-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
              <div className="cx-modal">
                <div className="cx-modal-handle" />

                {uploadState === 'success' ? (
                  <div className="cx-modal-success">
                    <div className="cx-success-icon">🎬</div>
                    <h2 className="cx-modal-title">Reaction Received!</h2>
                    <p className="cx-modal-sub">Thanks {formName.split(' ')[0]}! Your video is with our team for a quick review. Once approved, it&apos;ll appear on our Real Reactions page.</p>
                    <button className="cx-modal-submit" onClick={closeModal}>Done</button>
                  </div>
                ) : (
                  <>
                    <div className="cx-modal-header">
                      <div>
                        <h2 className="cx-modal-title">Share Your Reaction 🎬</h2>
                        <p className="cx-modal-sub">First-taste moments only. We&apos;ll review and post it.</p>
                      </div>
                      <button className="cx-modal-close" onClick={closeModal} aria-label="Close">✕</button>
                    </div>

                    <form onSubmit={handleUploadSubmit} className="cx-modal-form">

                      <label className="cx-field-label">Your Name <span className="cx-required">*</span></label>
                      <input
                        className="cx-input"
                        type="text"
                        placeholder="e.g. Sarah K."
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        required
                        disabled={uploadState !== 'idle' && uploadState !== 'error'}
                      />

                      <label className="cx-field-label" style={{ marginTop: 18 }}>
                        Your Reaction Video <span className="cx-required">*</span>
                        <span className="cx-field-hint"> · MP4 or MOV, max 20 MB</span>
                      </label>
                      <div
                        className={`cx-file-drop${formFile ? ' cx-file-has' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/mp4,video/quicktime,video/mov,video/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          disabled={uploadState !== 'idle' && uploadState !== 'error'}
                        />
                        {formFile ? (
                          <>
                            <span className="cx-file-icon">🎥</span>
                            <span className="cx-file-name">{formFile.name}</span>
                            <span className="cx-file-size">{(formFile.size / 1024 / 1024).toFixed(1)} MB</span>
                          </>
                        ) : (
                          <>
                            <span className="cx-file-icon">📱</span>
                            <span className="cx-file-prompt">Tap to choose a video</span>
                          </>
                        )}
                      </div>
                      {fileError && <p className="cx-field-error">{fileError}</p>}

                      <label className="cx-field-label" style={{ marginTop: 18 }}>
                        Caption / Quote <span className="cx-field-hint"> · Optional</span>
                      </label>
                      <textarea
                        className="cx-input cx-textarea"
                        placeholder="e.g. This is genuinely the best thing I've ever tasted..."
                        value={formCaption}
                        onChange={e => setFormCaption(e.target.value)}
                        rows={3}
                        disabled={uploadState !== 'idle' && uploadState !== 'error'}
                      />

                      {(uploadState === 'uploading' || uploadState === 'saving') && (
                        <div className="cx-progress-wrap">
                          <div className="cx-progress-bar" style={{ width: `${uploadPct}%` }} />
                          <p className="cx-progress-label">
                            {uploadState === 'uploading' ? `Uploading… ${uploadPct}%` : 'Saving your submission…'}
                          </p>
                        </div>
                      )}

                      {uploadState === 'error' && (
                        <p className="cx-field-error" style={{ marginTop: 12 }}>⚠️ {errMsg}</p>
                      )}

                      <button
                        type="submit"
                        className="cx-modal-submit"
                        disabled={!formName.trim() || !formFile || uploadState === 'uploading' || uploadState === 'saving'}
                      >
                        {uploadState === 'uploading' ? 'Uploading…'
                          : uploadState === 'saving'   ? 'Saving…'
                          : 'Submit My Reaction 🎬'}
                      </button>

                      <p className="cx-modal-note">Your video goes through a quick review before appearing publicly.</p>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

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

        /* ── VIDEO BUTTON ──────────────────────────────────── */
        .cx-btn-video {
          background: #1c1c1e !important;
          color: #ffffff !important;
          border: 2px solid rgba(255,255,255,0.12) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18) !important;
          animation: cx-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.60s both;
        }
        .cx-btn-video:hover {
          background: #2a2a2e !important;
          border-color: rgba(255,255,255,0.22) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.28) !important;
        }
        .cx-btn-video .cx-icon-wrap {
          background: rgba(255,255,255,0.08) !important;
        }
        .cx-btn-video:hover .cx-icon-wrap {
          background: rgba(255,255,255,0.14) !important;
        }

        /* ── MODAL OVERLAY ──────────────────────────────────── */
        .cx-modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          z-index: 1000 !important;
          background: rgba(0,0,0,0.60) !important;
          backdrop-filter: blur(4px) !important;
          display: flex !important;
          align-items: flex-end !important;
          justify-content: center !important;
          animation: cx-fadeUp 0.2s ease both !important;
        }

        /* ── MODAL SHEET ────────────────────────────────────── */
        .cx-modal {
          width: 100% !important;
          max-width: 520px !important;
          max-height: 92svh !important;
          background: #ffffff !important;
          border-radius: 28px 28px 0 0 !important;
          padding: 8px 24px 40px !important;
          overflow-y: auto !important;
          animation: cx-slideUp 0.35s cubic-bezier(0.22,1,0.36,1) both !important;
        }
        @keyframes cx-slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }

        .cx-modal-handle {
          width: 40px !important;
          height: 4px !important;
          background: #e5e7eb !important;
          border-radius: 2px !important;
          margin: 12px auto 20px !important;
        }
        .cx-modal-header {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: space-between !important;
          gap: 12px !important;
          margin-bottom: 24px !important;
        }
        .cx-modal-title {
          font-family: 'Montserrat', sans-serif !important;
          font-size: 1.25rem !important;
          font-weight: 900 !important;
          color: #0f1f0a !important;
          line-height: 1.2 !important;
        }
        .cx-modal-sub {
          font-size: 0.82rem !important;
          color: #6b7280 !important;
          margin-top: 5px !important;
          line-height: 1.5 !important;
        }
        .cx-modal-close {
          background: #f3f4f6 !important;
          border: none !important;
          border-radius: 50% !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          font-size: 0.85rem !important;
          color: #6b7280 !important;
          flex-shrink: 0 !important;
          transition: background 0.2s !important;
        }
        .cx-modal-close:hover { background: #e5e7eb !important; }

        /* ── FORM ───────────────────────────────────────────── */
        .cx-modal-form { display: flex !important; flex-direction: column !important; }
        .cx-field-label {
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          color: #374151 !important;
          margin-bottom: 7px !important;
          display: block !important;
        }
        .cx-field-hint {
          font-family: 'Poppins', sans-serif !important;
          font-weight: 400 !important;
          color: #9ca3af !important;
          font-size: 0.68rem !important;
        }
        .cx-required { color: #ff6b00 !important; }
        .cx-input {
          width: 100% !important;
          padding: 13px 16px !important;
          border: 1.5px solid #e5e7eb !important;
          border-radius: 12px !important;
          font-family: 'Poppins', sans-serif !important;
          font-size: 0.9rem !important;
          color: #111 !important;
          background: #fafafa !important;
          outline: none !important;
          transition: border-color 0.2s !important;
        }
        .cx-input:focus { border-color: #1d6c00 !important; background: #fff !important; }
        .cx-input:disabled { opacity: 0.5 !important; }
        .cx-textarea { resize: vertical !important; min-height: 80px !important; }

        /* ── FILE DROP ──────────────────────────────────────── */
        .cx-file-drop {
          border: 2px dashed #d1d5db !important;
          border-radius: 14px !important;
          padding: 24px 16px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 6px !important;
          cursor: pointer !important;
          transition: border-color 0.2s, background 0.2s !important;
          background: #fafafa !important;
          text-align: center !important;
        }
        .cx-file-drop:hover { border-color: #1d6c00 !important; background: #f0fdf4 !important; }
        .cx-file-has { border-color: #1d6c00 !important; background: #f0fdf4 !important; }
        .cx-file-icon { font-size: 1.8rem !important; }
        .cx-file-prompt { font-size: 0.85rem !important; color: #6b7280 !important; }
        .cx-file-name { font-size: 0.82rem !important; font-weight: 600 !important; color: #1d6c00 !important; word-break: break-all !important; }
        .cx-file-size { font-size: 0.7rem !important; color: #9ca3af !important; }
        .cx-field-error { font-size: 0.75rem !important; color: #dc2626 !important; margin-top: 6px !important; }

        /* ── PROGRESS ───────────────────────────────────────── */
        .cx-progress-wrap {
          margin-top: 16px !important;
          background: #f3f4f6 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          position: relative !important;
        }
        .cx-progress-bar {
          height: 6px !important;
          background: linear-gradient(90deg, #1d6c00, #4ade80) !important;
          border-radius: 8px !important;
          transition: width 0.3s ease !important;
        }
        .cx-progress-label {
          font-size: 0.72rem !important;
          color: #6b7280 !important;
          text-align: center !important;
          padding: 6px 0 2px !important;
        }

        /* ── SUBMIT BUTTON ──────────────────────────────────── */
        .cx-modal-submit {
          margin-top: 24px !important;
          width: 100% !important;
          padding: 16px !important;
          background: linear-gradient(135deg, #1d6c00, #2d9e00) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 14px !important;
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.95rem !important;
          font-weight: 800 !important;
          cursor: pointer !important;
          transition: opacity 0.2s, transform 0.2s !important;
          box-shadow: 0 4px 20px rgba(29,108,0,0.25) !important;
        }
        .cx-modal-submit:hover:not(:disabled) { opacity: 0.92 !important; transform: translateY(-2px) !important; }
        .cx-modal-submit:disabled { opacity: 0.45 !important; cursor: not-allowed !important; }
        .cx-modal-note {
          font-size: 0.68rem !important;
          color: #9ca3af !important;
          text-align: center !important;
          margin-top: 10px !important;
        }

        /* ── SUCCESS STATE ──────────────────────────────────── */
        .cx-modal-success {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          padding: 24px 8px 8px !important;
          gap: 12px !important;
        }
        .cx-success-icon { font-size: 3rem !important; }

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
          padding: 30px 14px 14px !important;
          border-radius: 16px !important;
          background: #1c1c1e !important;
          color: #ffffff !important;
          text-decoration: none !important;
          cursor: not-allowed !important;
          opacity: 0.6 !important;
          pointer-events: none !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.22) !important;
          overflow: hidden !important;
        }

        /* Coming Soon ribbon across top */
        .cx-app-coming {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          background: linear-gradient(90deg, #e05e00, #ff6b00) !important;
          color: #fff !important;
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.52rem !important;
          font-weight: 800 !important;
          letter-spacing: 0.16em !important;
          text-transform: uppercase !important;
          text-align: center !important;
          padding: 5px 0 !important;
          line-height: 1 !important;
          border-radius: 16px 16px 0 0 !important;
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

function CamIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.888L15 14" />
      <rect x="1" y="6" width="15" height="12" rx="2" ry="2" />
    </svg>
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
