import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const DISMISSED_KEY = 'otgj_promo_v1';

const SUPPRESS_PATHS = [
  '/login', '/register', '/forgot-password', '/reset-password',
  '/checkout-gateway', '/corporate', '/account', '/admin',
];

export default function PromoPopup() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const suppressed = SUPPRESS_PATHS.some(p => router.pathname.startsWith(p));
    if (suppressed) return;
    try {
      if (!sessionStorage.getItem(DISMISSED_KEY)) setOpen(true);
    } catch {}
  }, [router.pathname]);

  function close() {
    try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <>
      <style>{`
        .promo-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: promo-fadein 0.22s ease;
        }
        @keyframes promo-fadein { from { opacity:0 } to { opacity:1 } }
        .promo-modal {
          background: #fff; border-radius: 20px; padding: 44px 36px 32px;
          max-width: 440px; width: 100%; text-align: center; position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.22);
          animation: promo-slideup 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes promo-slideup {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .promo-close {
          position: absolute; top: 14px; right: 16px;
          background: none; border: none; font-size: 1.15rem; color: #9ca3af;
          cursor: pointer; padding: 5px 9px; border-radius: 8px; line-height: 1;
          transition: color 0.15s, background 0.15s;
        }
        .promo-close:hover { color: #374151; background: #f3f4f6; }
        .promo-icon { font-size: 3rem; display: block; margin-bottom: 10px; }
        .promo-badge {
          display: inline-block; background: linear-gradient(135deg,#f77f00,#e65c00);
          color: #fff; font-family: 'Montserrat',sans-serif; font-weight: 800;
          font-size: 0.68rem; letter-spacing: 0.12em; padding: 4px 13px;
          border-radius: 999px; margin-bottom: 14px;
        }
        .promo-title {
          font-family: 'Montserrat',sans-serif; font-weight: 900; font-size: 1.5rem;
          color: #0a2800; margin: 0 0 12px; line-height: 1.22;
        }
        .promo-body {
          color: #6b7280; font-family: 'Poppins',sans-serif; font-size: 0.875rem;
          line-height: 1.65; margin: 0 0 26px;
        }
        .promo-cta {
          display: block; background: linear-gradient(135deg,#f77f00,#e65c00);
          color: #fff; text-decoration: none; padding: 14px 28px;
          border-radius: 12px; font-family: 'Montserrat',sans-serif; font-weight: 800;
          font-size: 0.95rem; margin-bottom: 12px; transition: opacity 0.2s;
        }
        .promo-cta:hover { opacity: 0.88; }
        .promo-skip {
          background: none; border: none; color: #9ca3af; font-size: 0.77rem;
          cursor: pointer; padding: 4px; text-decoration: underline;
          font-family: 'Poppins',sans-serif; transition: color 0.15s;
        }
        .promo-skip:hover { color: #6b7280; }
      `}</style>

      <div
        className="promo-overlay"
        onClick={e => { if (e.target === e.currentTarget) close(); }}
        role="presentation"
      >
        <div className="promo-modal" role="dialog" aria-modal="true" aria-labelledby="promo-heading">
          <button className="promo-close" onClick={close} aria-label="Close">✕</button>
          <span className="promo-icon">🎉</span>
          <span className="promo-badge">LIMITED OFFER</span>
          <h2 className="promo-title" id="promo-heading">
            Get 20% off your first order when you create an account!
          </h2>
          <p className="promo-body">
            Join the On The Go Juice family for free. Verify your email to instantly unlock
            an exclusive 20% discount code — plus earn a free bottle every 7 purchases.
          </p>
          <a href="/register" className="promo-cta" onClick={close}>
            Create Free Account →
          </a>
          <button className="promo-skip" onClick={close}>
            No thanks, I'll pay full price
          </button>
        </div>
      </div>
    </>
  );
}
