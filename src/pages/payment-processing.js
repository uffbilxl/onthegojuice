import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Phases: 0 = red, 1 = amber, 2 = green, 3 = go (redirect imminent)
const PHASE_MS = [900, 900, 800, 600];

export default function PaymentProcessing() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let t;
    function advance(p) {
      if (p >= PHASE_MS.length) {
        // Build destination URL preserving all Stripe query params
        const params = new URLSearchParams(window.location.search);
        router.replace('/order-confirmed?' + params.toString());
        return;
      }
      t = setTimeout(() => {
        setPhase(p + 1);
        advance(p + 1);
      }, PHASE_MS[p]);
    }
    advance(0);
    return () => clearTimeout(t);
  }, [router]);

  const red   = phase === 0;
  const amber = phase === 1;
  const green = phase >= 2;
  const go    = phase >= 3;

  return (
    <>
      <Head>
        <title>Processing Payment – On The Go Juice</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Poppins:wght@500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div style={S.page}>
        {/* Traffic light housing */}
        <div style={S.housing}>
          {/* Red */}
          <div style={{ ...S.bulbWrap, ...(red ? S.redActive : {}) }}>
            <div style={{
              ...S.bulb,
              background: red ? '#ff2222' : '#3a0000',
              boxShadow: red ? '0 0 24px 8px rgba(255,34,34,0.55), 0 0 6px 2px rgba(255,100,100,0.4)' : 'none',
            }} />
          </div>

          {/* Amber */}
          <div style={{ ...S.bulbWrap, ...(amber ? S.amberActive : {}) }}>
            <div style={{
              ...S.bulb,
              background: amber ? '#ffaa00' : '#3a2200',
              boxShadow: amber ? '0 0 24px 8px rgba(255,170,0,0.55), 0 0 6px 2px rgba(255,200,80,0.4)' : 'none',
            }} />
          </div>

          {/* Green */}
          <div style={{ ...S.bulbWrap, ...(green ? S.greenActive : {}) }}>
            <div style={{
              ...S.bulb,
              background: green ? '#22c55e' : '#003311',
              boxShadow: green ? '0 0 28px 10px rgba(34,197,94,0.60), 0 0 8px 3px rgba(100,255,150,0.4)' : 'none',
              transition: 'background 0.3s ease, box-shadow 0.3s ease',
            }} />
          </div>
        </div>

        {/* GO! label */}
        <div style={{
          ...S.goLabel,
          opacity:   go ? 1 : 0,
          transform: go ? 'scale(1)' : 'scale(0.7)',
        }}>
          GO!
        </div>

        <p style={{
          ...S.hint,
          opacity: go ? 0 : 0.7,
        }}>
          Confirming your payment…
        </p>
      </div>

      <style>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.75; }
        }
      `}</style>
    </>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    background: '#f4f1ec',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '28px',
    fontFamily: "'Poppins', sans-serif",
  },
  housing: {
    background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
    borderRadius: '28px',
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    border: '3px solid #2a2a2a',
    position: 'relative',
  },
  bulbWrap: {
    padding: '6px',
    borderRadius: '50%',
    transition: 'background 0.25s ease',
  },
  redActive: {
    background: 'rgba(255,50,50,0.12)',
  },
  amberActive: {
    background: 'rgba(255,170,0,0.12)',
  },
  greenActive: {
    background: 'rgba(34,197,94,0.12)',
    animation: 'pulse-green 0.7s ease-in-out infinite',
  },
  bulb: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    transition: 'background 0.25s ease, box-shadow 0.25s ease',
  },
  goLabel: {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 900,
    fontSize: '3.5rem',
    color: '#1d6c00',
    letterSpacing: '-0.03em',
    transition: 'opacity 0.35s ease, transform 0.35s ease',
    lineHeight: 1,
  },
  hint: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: 0,
    transition: 'opacity 0.4s ease',
    position: 'absolute',
    bottom: '-44px',
    left: '50%',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
  },
};
