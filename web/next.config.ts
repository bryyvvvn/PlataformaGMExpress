import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    '192.168.1.25',
    '192.168.1.83',
    'collide-imaginary-thermos.ngrok-free.dev' 
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // 🔥 ESTO ES LO QUE ABRE LAS PUERTAS A LA APP MÓVIL
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ]
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ]
  }
};

export default nextConfig;