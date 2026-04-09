import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
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

  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      // next-auth v4 依赖 Node.js 内置模块，为 edge runtime 提供 polyfill
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        // oauth 包使用了 http/https，但我们只用 CredentialsProvider，设为 false 跳过
        http: false,
        https: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
