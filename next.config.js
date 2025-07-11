/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  // Vercel 배포 최적화
  compress: true,
}

module.exports = nextConfig 