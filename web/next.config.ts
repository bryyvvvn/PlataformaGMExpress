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
};

export default nextConfig;