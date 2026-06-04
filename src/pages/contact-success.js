import Head from 'next/head';
import Link from 'next/link';

const S = {
  page:   { minHeight: '100vh', background: '#f9f6f1', fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column' },
  header: { background: '#0a2800', padding: '0 6vw', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  logo:   { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' },
  inner:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 6vw' },
  card:   { background: '#fff', borderRadius: 24, padding: '56px 48px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: 480, width: '100%' },
  icon:   { width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '2px solid #bbf7d0' },
  check:  { fontSize: 36, color: '#1d6c00', lineHeight: 1 },
  title:  { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(1.6rem,4vw,2rem)', color: '#0a2800', letterSpacing: '-0.03em', margin: '0 0 14px' },
  sub:    { color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 36px' },
  btn:    { display: 'inline-block', background: '#1d6c00', color: '#fff', textDecoration: 'none', padding: '14px 36px', borderRadius: 12, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', transition: 'background 0.2s' },
};

export default function ContactSuccess() {
  return (
    <>
      <Head>
        <title>Message Sent – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        <header style={S.header}>
          <a href="/" style={S.logo}>On The Go Juice</a>
        </header>

        <div style={S.inner}>
          <div style={S.card}>
            <div style={S.icon}>
              <span style={S.check}>&#10003;</span>
            </div>
            <h1 style={S.title}>Message Sent Successfully!</h1>
            <p style={S.sub}>
              Thank you for reaching out to On The Go Juice. Our team will get back
              to you at your email address shortly.
            </p>
            <Link href="/" style={S.btn}>Return to Home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
