import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = withPWA({
  output: 'export',   // static export for Cloudflare Pages
  // Note: headers() is not supported with output:'export'
  // X-Frame-Options is set via public/_headers (Cloudflare Pages)
});

export default nextConfig;
