/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  experimental: {
    allowedDevOrigins: ['172.70.96.220', 'localhost', '127.0.0.1'],
  },
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
