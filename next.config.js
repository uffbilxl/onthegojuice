const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
      { source: '/delivery-info',   destination: '/delivery-info.html' },
      { source: '/privacy-policy',  destination: '/privacy-policy.html' },
      { source: '/returns',         destination: '/returns.html' },
      { source: '/terms',           destination: '/terms-conditions.html' },
    ];
  },
};

module.exports = nextConfig;
