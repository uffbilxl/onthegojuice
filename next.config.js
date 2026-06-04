const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // suppress X-Powered-By: Next.js

  webpack(config) {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },

  // Serve static HTML files at clean URLs (no .html in the address bar)
  async rewrites() {
    return [
      { source: '/',                destination: '/index.html' },
      { source: '/checkout',        destination: '/checkout.html' },
      { source: '/thank-you',       destination: '/thank-you.html' },
      { source: '/order-status',    destination: '/order-status.html' },
      { source: '/delivery-info',   destination: '/delivery-info.html' },
      { source: '/privacy-policy',  destination: '/privacy-policy.html' },
      { source: '/returns',         destination: '/returns.html' },
      { source: '/terms',           destination: '/terms-conditions.html' },
      { source: '/events',          destination: '/events.html' },
      { source: '/partners',        destination: '/partners.html' },
      { source: '/our-story',       destination: '/our-story.html' },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      // Stripe.js + AOS from unpkg; 'unsafe-inline' required for existing inline handlers
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      // API calls: Stripe, Supabase, postcode lookup
      "connect-src 'self' https://api.stripe.com https://yzhfphcypahajeriztqk.supabase.co https://api.postcodes.io",
      // Stripe Payment Element renders inside an iframe
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
          // HSTS: tell browsers to use HTTPS for 2 years (only meaningful in production)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy',   value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
