import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const S = {
  page:    { minHeight: '100vh', background: '#f9f6f1', fontFamily: "'Poppins', sans-serif" },
  header:  { background: '#0a2800', padding: '0 6vw', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  logo:    { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' },
  back:    { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 },
  inner:   { maxWidth: 640, margin: '0 auto', padding: '56px 6vw 100px' },
  tag:     { fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff6b00', marginBottom: 12, display: 'block' },
  title:   { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0a2800', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 10px' },
  sub:     { color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 40px' },
  card:    { background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' },
  label:   { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 20 },
  input:   { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.93rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  textarea:{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.93rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 130 },
  error:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginTop: 16 },
  btn:     { width: '100%', padding: 14, marginTop: 24, background: '#1d6c00', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'opacity 0.2s' },
  row:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
};

export default function ContactPage() {
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      router.push('/contact-success');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Contact Us – On The Go Juice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        <header style={S.header}>
          <a href="/" style={S.logo}>On The Go Juice</a>
          <a href="/" style={S.back}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Home
          </a>
        </header>

        <div style={S.inner}>
          <span style={S.tag}>Get in Touch</span>
          <h1 style={S.title}>Contact Us</h1>
          <p style={S.sub}>
            Have a question about an order, a bulk enquiry, or just want to say hello?
            Fill in the form and we will get back to you within 24 hours.
          </p>

          <div style={S.card}>
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ ...S.row, marginTop: 4 }}>
                <div>
                  <label style={{ ...S.label, marginTop: 4 }}>Name *</label>
                  <input style={S.input} type="text" value={form.name} onChange={update('name')} required placeholder="Jane Smith" autoComplete="name" />
                </div>
                <div>
                  <label style={{ ...S.label, marginTop: 4 }}>Email *</label>
                  <input style={S.input} type="email" value={form.email} onChange={update('email')} required placeholder="jane@example.com" autoComplete="email" />
                </div>
              </div>

              <label style={S.label}>Subject (Optional)</label>
              <input style={S.input} type="text" value={form.subject} onChange={update('subject')} placeholder="e.g. Order enquiry, Wholesale pricing…" />

              <label style={S.label}>Message *</label>
              <textarea style={S.textarea} value={form.message} onChange={update('message')} required placeholder="Tell us how we can help…" />

              {error && <p style={S.error}>{error}</p>}

              <button type="submit" style={{ ...S.btn, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, color: '#9ca3af', fontSize: '0.85rem' }}>
            Or email us directly at{' '}
            <a href="mailto:info@onthego-juice.co.uk" style={{ color: '#ff6b00', fontWeight: 600, textDecoration: 'none' }}>
              info@onthego-juice.co.uk
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
