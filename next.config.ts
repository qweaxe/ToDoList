import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 部署不需要 standalone 输出
  // output: "standalone",
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  reactStrictMode: false,
  
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
