/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@todolist/api', '@todolist/db', '@todolist/utils'],
};

module.exports = nextConfig;