/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.56.1'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://my-chatbot-kpn8.onrender.com`,
              "connect-src 'self' https://my-chatbot-kpn8.onrender.com",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
              "frame-src https://www.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;