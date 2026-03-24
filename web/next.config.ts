import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // Required for LIFF: allow embedding in LINE's WebView
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Frame-Options', value: 'ALLOWALL' }],
      },
    ];
  },
};

export default nextConfig;
