import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // CF 部署需要忽略类型错误（next-auth v5 beta 与 edge runtime 类型不兼容）
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  // Cloudflare 不支持 Next.js 图片优化
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
