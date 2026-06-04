import Head from 'next/head';
import Link from 'next/link';

export default function OrderConfirmed() {
  return (
    <>
      <Head>
        <title>Order Confirmed – On The Go Juice</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f4f1ec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
          maxWidth: '540px',
          width: '100%',
          overflow: 'hidden',
        }}>

          {/* Green header bar */}
          <div style={{
            backgroundColor: '#1d6c00',
            padding: '32px 40px 28px',
            textAlign: 'center',
          }}>
            <img
              src="/images/logo.png"
              alt="On The Go Juice"
              style={{ display: 'block', margin: '0 auto', maxWidth: '140px', height: 'auto' }}
            />
            <p style={{
              margin: '14px 0 0',
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.60)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}>
              Fresh &bull; Natural &bull; On The Go
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '44px 48px 40px', textAlign: 'center' }}>

            {/* Tick circle */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              marginBottom: '24px',
            }}>
              <span style={{ fontSize: '34px', lineHeight: 1, color: '#1d6c00' }}>✓</span>
            </div>

            <h1 style={{
              margin: '0 0 16px',
              fontSize: '30px',
              fontWeight: 900,
              color: '#111111',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              Order Confirmed!
            </h1>

            <p style={{
              margin: '0 0 36px',
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: 1.7,
            }}>
              Thank you for your order. Our team will be in touch shortly to
              confirm your delivery slot or pickup details.
            </p>

            <Link href="/" style={{
              display: 'inline-block',
              backgroundColor: '#1d6c00',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '16px',
              padding: '17px 44px',
              borderRadius: '50px',
              letterSpacing: '0.02em',
            }}>
              Return to Home
            </Link>

          </div>

          {/* Footer */}
          <div style={{
            backgroundColor: '#f4f1ec',
            borderTop: '1px solid #e5e7eb',
            padding: '22px 40px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>
              On The Go Juice &bull; Birmingham, UK
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>
              <a href="mailto:info@onthego-juice.co.uk" style={{ color: '#ff6b00', textDecoration: 'none' }}>
                info@onthego-juice.co.uk
              </a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
