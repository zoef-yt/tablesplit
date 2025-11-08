const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'lucide-react']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp']
  }
};

module.exports = withPWA(nextConfig);
