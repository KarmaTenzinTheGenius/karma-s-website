/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.56.1'],
  images: {
    formats: ['image/avif', 'image/webp'],
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
              "script-src 'self' 'unsafe-inline' https://my-chatbot-kpn8.onrender.com",
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