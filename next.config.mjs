/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.56.1'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;