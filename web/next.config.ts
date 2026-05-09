import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},

  // Permite que el emulador Android acceda a los recursos de dev de Next.js
  allowedDevOrigins: ['192.168.1.82'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }, // En el futuro lo cambias por la URL de tu app
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;