import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

// =====================================================================
// URL MAP — Paste your final product page paths here when they are live.
// The keys MUST match the exact drink name strings returned by the API.
// Example: "Carrot & Lime": "/shop/carrot-lime"
// =====================================================================
const urlMap = {
  "Carrot & Ginger":                             "/products/carrot-ginger-placeholder",
  "Carrot & Lime":                               "/products/carrot-lime-placeholder",
  "Carrot & Lemon":                              "/products/carrot-lemon-placeholder",
  "Carrot & Milk":                               "/products/carrot-milk-placeholder",
  "Beetroot & Milk":                             "/products/beetroot-milk-placeholder",
  "Carrot & Beetroot with Milk":                 "/products/carrot-beetroot-milk-placeholder",
  "Beetroot & Apple":                            "/products/beetroot-apple-placeholder",
  "Beetroot & Ginger":                           "/products/beetroot-ginger-placeholder",
  "Beetroot & ginger shots":                     "/products/beetroot-ginger-shots-placeholder",
  "Carrot & Grapefruit":                         "/products/carrot-grapefruit-placeholder",
  "Sorrel & Ginger":                             "/products/sorrel-ginger-placeholder",
  "Lactose Free Carrot & Milk":                  "/products/lactose-free-carrot-milk-placeholder",
  "Lactose Free Beetroot, Carrot & Milk":        "/products/lactose-free-beetroot-carrot-milk-placeholder",
  "Beetroot, Carrot & Milk - No added sugar":    "/products/beetroot-carrot-milk-no-sugar-placeholder",
  "Carrot & Milk - No added sugar":              "/products/carrot-milk-no-sugar-placeholder",
  "Breadfruit and Milk":                         "/products/breadfruit-milk-placeholder",
  "Mango and Milk":                              "/products/mango-milk-placeholder",
  "Carrot and Water Melon":                      "/products/carrot-watermelon-placeholder",
  "Ginger shots":                                "/products/ginger-shots-placeholder",
};

const STEPS = [
  {
    id: "base",
    question: "What base are you craving today?",
    options: [
      { value: "carrot",   label: "Sweet Carrot",          icon: "🥕", desc: "Naturally sweet & vibrant" },
      { value: "beetroot", label: "Earthy Beetroot",        icon: "🫐", desc: "Deep, bold & earthy" },
      { value: "mix",      label: "Carrot & Beetroot Mix",  icon: "🌀", desc: "Best of both worlds" },
      { value: "tropical", label: "Tropical / Exotic",      icon: "🌺", desc: "Mango, Sorrel, Breadfruit" },
      { value: "fire",     label: "Pure Fire",              icon: "🔥", desc: "Just Ginger — straight up heat" },
    ],
  },
  {
    id: "texture",
    question: "How do you prefer the texture?",
    options: [
      { value: "creamy", label: "Rich & Creamy", icon: "🥛", desc: "Smooth, indulgent, milk-based" },
      { value: "juice",  label: "Crisp & Clear", icon: "💧", desc: "Light, refreshing, juice-based" },
    ],
  },
  {
    id: "modifier",
    question: "What's your perfect flavor twist?",
    options: [
      { value: "ginger",      label: "A Spicy Kick",    icon: "🌶",  desc: "Warming ginger heat" },
      { value: "citrus",      label: "Zesty Citrus",    icon: "🍋",  desc: "Lemon, lime, or grapefruit" },
      { value: "sweet_fruit", label: "Sweet Fruit",     icon: "🍎",  desc: "Apple or watermelon" },
      { value: "classic",     label: "Keep it Classic", icon: "✨",  desc: "Pure, no extra twist" },
    ],
  },
  {
    id: "dietary",
    question: "Any specific dietary needs?",
    options: [
      { value: "standard",     label: "Standard Recipe", icon: "✅", desc: "Our full classic range" },
      { value: "lactose_free", label: "Lactose-Free",    icon: "🌱", desc: "No dairy, all the flavour" },
      { value: "no_sugar",     label: "No Added Sugar",  icon: "💚", desc: "Clean, naturally sweet" },
    ],
  },
];

export default function Discover() {
  const [step,     setStep]     = useState(0);
  const [answers,  setAnswers]  = useState({});
  const [animKey,  setAnimKey]  = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [apiError, setApiError] = useState(null);

  async function handleSelect(questionId, value) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setAnimKey(k => k + 1);
      setStep(s => s + 1);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res  = await fetch("/api/recommend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(newAnswers),
      });
      const data = await res.json();
      if (data.recommended_drink) {
        setResult(data.recommended_drink);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } catch {
      setApiError("Could not connect. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function retakeQuiz() {
    setStep(0);
    setAnswers({});
    setAnimKey(k => k + 1);
    setResult(null);
    setApiError(null);
    setLoading(false);
  }

  const currentStep = STEPS[step];
  const progress    = (step / STEPS.length) * 100;
  const productUrl  = result ? (urlMap[result] ?? "/") : "/";

  return (
    <>
      <Head>
        <title>Find Your Flavor | On The Go Juice</title>
        <meta name="description" content="Answer 4 quick questions and we'll find your perfect On The Go Juice match." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="fm-page">

        {/* ── NAV ────────────────────────────────────────────────── */}
        <nav className="fm-nav">
          <Link href="/" className="fm-nav-logo">
            <img src="/images/logo.webp" alt="On The Go Juice" width={36} height={36} />
            <span>On The Go Juice</span>
          </Link>
          {(result || step > 0) && !loading && (
            <button className="fm-nav-ghost" onClick={retakeQuiz}>
              ← Restart
            </button>
          )}
        </nav>

        {/* ── MAIN ───────────────────────────────────────────────── */}
        <main className="fm-main">

          {/* Loading */}
          {loading && (
            <div className="fm-loading" key="loading">
              <div className="fm-spinner" />
              <p className="fm-loading-txt">Blending your perfect match...</p>
            </div>
          )}

          {/* Error */}
          {apiError && !loading && (
            <div className="fm-error" key="error">
              <span className="fm-error-icon">⚠️</span>
              <p className="fm-error-txt">{apiError}</p>
              <button className="fm-btn-primary" onClick={retakeQuiz}>Try Again</button>
            </div>
          )}

          {/* Result */}
          {result && !loading && !apiError && (
            <div className="fm-result" key="result">
              <span className="fm-result-badge">Your Perfect Match</span>
              <h1 className="fm-result-name">{result}</h1>
              <p className="fm-result-sub">Crafted fresh for a reason — this one&apos;s yours.</p>
              <div className="fm-result-actions">
                <Link href={productUrl} className="fm-btn-primary">
                  View This Drink →
                </Link>
                <button className="fm-btn-outline" onClick={retakeQuiz}>
                  Retake Quiz
                </button>
              </div>
            </div>
          )}

          {/* Quiz */}
          {!loading && !result && !apiError && (
            <>
              {/* Progress bar */}
              <div className="fm-progress-row">
                <div className="fm-progress-track">
                  <div className="fm-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="fm-step-count">{step + 1} / {STEPS.length}</span>
              </div>

              {/* Question + Options */}
              <div className="fm-question-wrap" key={animKey}>
                <p className="fm-eyebrow">Step {step + 1}</p>
                <h2 className="fm-question">{currentStep.question}</h2>

                <div className={`fm-options fm-options--${currentStep.options.length}`}>
                  {currentStep.options.map((opt, i) => (
                    <button
                      key={opt.value}
                      className={`fm-card${currentStep.options.length === 5 && i === 4 ? " fm-card--span" : ""}`}
                      onClick={() => handleSelect(currentStep.id, opt.value)}
                    >
                      <span className="fm-card-icon">{opt.icon}</span>
                      <span className="fm-card-label">{opt.label}</span>
                      <span className="fm-card-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step dots */}
              <div className="fm-dots" aria-hidden="true">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`fm-dot${i === step ? " fm-dot--active" : i < step ? " fm-dot--done" : ""}`}
                  />
                ))}
              </div>
            </>
          )}

        </main>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; }

        @keyframes fm-fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fm-slideIn {
          from { opacity: 0; transform: translateX(52px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fm-scaleIn {
          from { opacity: 0; transform: scale(0.86); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fm-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fm-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }

        /* ── PAGE ──────────────────────────────────────────────────── */
        .fm-page {
          min-height: 100vh;
          background: radial-gradient(ellipse at 65% 0%, #1b2f0b 0%, #0d1a0a 55%, #070e05 100%);
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #fff;
          display: flex;
          flex-direction: column;
        }

        /* ── NAV ───────────────────────────────────────────────────── */
        .fm-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 60px;
          background: rgba(13,26,10,0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fm-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.88rem;
        }
        .fm-nav-logo img { border-radius: 8px; }
        .fm-nav-ghost {
          background: none;
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.48);
          font-family: 'Poppins', sans-serif;
          font-size: 0.76rem;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s;
        }
        .fm-nav-ghost:hover {
          border-color: rgba(255,255,255,0.48);
          color: #fff;
        }

        /* ── MAIN ──────────────────────────────────────────────────── */
        .fm-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 20px 72px;
          max-width: 780px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── PROGRESS ──────────────────────────────────────────────── */
        .fm-progress-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          margin-bottom: 36px;
          animation: fm-fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        .fm-progress-track {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        .fm-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a3e635, #ff6b00);
          border-radius: 4px;
          transition: width 0.55s cubic-bezier(0.22,1,0.36,1);
        }
        .fm-step-count {
          font-size: 0.7rem;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          color: rgba(255,255,255,0.3);
          white-space: nowrap;
          letter-spacing: 0.06em;
        }

        /* ── QUESTION ──────────────────────────────────────────────── */
        .fm-question-wrap {
          width: 100%;
          animation: fm-slideIn 0.48s cubic-bezier(0.22,1,0.36,1) both;
        }
        .fm-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #a3e635;
          margin-bottom: 10px;
        }
        .fm-question {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(1.45rem, 4.8vw, 2.15rem);
          font-weight: 900;
          letter-spacing: -0.025em;
          line-height: 1.12;
          color: #fff;
          margin-bottom: 30px;
        }

        /* ── OPTION CARDS ──────────────────────────────────────────── */
        .fm-options {
          display: grid;
          gap: 12px;
          width: 100%;
        }
        .fm-options--2 { grid-template-columns: 1fr 1fr; }
        .fm-options--3 { grid-template-columns: 1fr; }
        .fm-options--4 { grid-template-columns: 1fr 1fr; }
        .fm-options--5 { grid-template-columns: 1fr 1fr; }

        /* last card in a 5-option set spans full width */
        .fm-card--span { grid-column: 1 / -1; }

        @media (max-width: 480px) {
          .fm-options--2,
          .fm-options--4,
          .fm-options--5 { grid-template-columns: 1fr; }
          .fm-card--span  { grid-column: unset; }
        }

        .fm-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
          padding: 20px 22px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          cursor: pointer;
          text-align: left;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.2s ease;
        }
        .fm-card:hover {
          background: rgba(163,230,53,0.07);
          border-color: rgba(163,230,53,0.45);
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(163,230,53,0.1);
        }
        .fm-card:active {
          transform: scale(0.97);
          transition-duration: 0.08s;
        }
        .fm-card-icon {
          font-size: 1.75rem;
          line-height: 1;
          display: block;
          margin-bottom: 8px;
        }
        .fm-card-label {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.94rem;
          line-height: 1.2;
          color: #fff;
        }
        .fm-card-desc {
          font-size: 0.71rem;
          color: rgba(255,255,255,0.42);
          line-height: 1.45;
          margin-top: 2px;
        }

        /* ── DOTS ──────────────────────────────────────────────────── */
        .fm-dots {
          display: flex;
          gap: 8px;
          margin-top: 30px;
          animation: fm-fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both 0.08s;
        }
        .fm-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          transition: width 0.3s ease, background 0.3s ease, border-radius 0.3s ease;
        }
        .fm-dot--done   { background: rgba(163,230,53,0.38); }
        .fm-dot--active { width: 26px; border-radius: 4px; background: #a3e635; }

        /* ── LOADING ───────────────────────────────────────────────── */
        .fm-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 26px;
          animation: fm-fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        .fm-spinner {
          width: 54px;
          height: 54px;
          border: 3px solid rgba(255,255,255,0.07);
          border-top-color: #a3e635;
          border-right-color: #ff6b00;
          border-radius: 50%;
          animation: fm-spin 0.85s linear infinite;
        }
        .fm-loading-txt {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: rgba(255,255,255,0.65);
          animation: fm-pulse 1.5s ease-in-out infinite;
          letter-spacing: 0.01em;
        }

        /* ── RESULT ────────────────────────────────────────────────── */
        .fm-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: fm-scaleIn 0.58s cubic-bezier(0.22,1,0.36,1) both;
          padding: 0 8px;
        }
        .fm-result-badge {
          display: inline-block;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #a3e635;
          background: rgba(163,230,53,0.1);
          border: 1px solid rgba(163,230,53,0.28);
          padding: 6px 20px;
          border-radius: 50px;
          margin-bottom: 24px;
        }
        .fm-result-name {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(2rem, 7.5vw, 3.5rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.05;
          background: linear-gradient(135deg, #ffffff 20%, #a3e635 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
        }
        .fm-result-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.45);
          margin-bottom: 42px;
          line-height: 1.65;
          max-width: 340px;
        }
        .fm-result-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          width: 100%;
          max-width: 320px;
        }

        /* ── BUTTONS ───────────────────────────────────────────────── */
        .fm-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 15px 32px;
          background: linear-gradient(135deg, #ff6b00, #ff8c33);
          color: #fff;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(255,107,0,0.35);
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
          letter-spacing: 0.01em;
        }
        .fm-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 14px 40px rgba(255,107,0,0.45);
        }
        .fm-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 13px 32px;
          background: transparent;
          color: rgba(255,255,255,0.55);
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          border-radius: 50px;
          border: 1.5px solid rgba(255,255,255,0.18);
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
          letter-spacing: 0.01em;
        }
        .fm-btn-outline:hover {
          border-color: rgba(255,255,255,0.48);
          color: #fff;
          background: rgba(255,255,255,0.04);
        }

        /* ── ERROR ─────────────────────────────────────────────────── */
        .fm-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          text-align: center;
          animation: fm-fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        .fm-error-icon { font-size: 2.4rem; }
        .fm-error-txt {
          color: rgba(255,255,255,0.5);
          font-size: 0.88rem;
          max-width: 300px;
          line-height: 1.65;
        }
      `}</style>
    </>
  );
}
