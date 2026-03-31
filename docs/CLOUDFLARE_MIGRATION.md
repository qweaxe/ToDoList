# Cloudflare 全栈部署迁移计划

## 一、迁移目标

### 1.1 核心目标
- 将项目从 Vercel 迁移到 Cloudflare Pages + Workers
- 实现中国大陆访问速度优化
- 保持所有现有功能正常运行
- 零额外费用（使用免费额度）

### 1.2 性能目标
| 指标 | 当前 (Vercel) | 目标 (Cloudflare) |
|------|--------------|------------------|
| 首页加载 | 2-5s | < 1s |
| API 响应 | 200-500ms | 100-300ms |
| 静态资源 | 500ms-1s | < 200ms |
| 国内延迟 | 300-800ms | 50-200ms |

---

## 二、技术架构对比

### 2.1 当前架构 (Vercel)
```
用户 → Vercel Edge (香港/新加坡) → Supabase PostgreSQL
         ↓
    Next.js App Router
    (SSR + API Routes)
```

### 2.2 目标架构 (Cloudflare)
```
用户 → Cloudflare Edge (全球节点) → Supabase PostgreSQL
         ↓                         ↓
    Pages (静态)              Workers (API)
    Workers (SSR)             D1 (可选缓存)
```

---

## 三、迁移步骤

### 阶段一：环境准备 (Day 1)

#### Step 1.1：安装 Cloudflare 工具
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 Pages 项目
wrangler pages project create todolist
```

#### Step 1.2：配置项目
```bash
# 安装 Cloudflare Next.js 适配器
bun add @cloudflare/next-on-pages
```

#### Step 1.3：创建 wrangler.toml
```toml
name = "todolist"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[vars]
NEXTAUTH_SECRET = ""
NEXTAUTH_URL = ""

[[d1_databases]]
binding = "DB"
database_name = "todolist-cache"
database_id = "xxx"
```

---

### 阶段二：代码改造 (Day 2-3)

#### Step 2.1：修改 next.config.ts
```typescript
// 从 Vercel 配置改为 Cloudflare 配置
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Cloudflare 适配器会处理输出
  experimental: {
    // 启用边缘运行时支持
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  images: {
    // Cloudflare 图片优化
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default withNextIntl(nextConfig);
```

#### Step 2.2：创建图片加载器
```typescript
// src/lib/image-loader.ts
export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (src.startsWith('http')) {
    return src;
  }
  // Cloudflare Images URL
  return `https://images.cloudflare.com/cdn-cgi/image/width=${width},quality=${quality || 75}/${src}`;
}
```

#### Step 2.3：修改数据库连接
```typescript
// src/lib/db.ts - 适配 Cloudflare Workers 环境
import { PrismaClient } from '@prisma/client'

// Cloudflare Workers 环境变量
declare global {
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Cloudflare 环境使用 HTTP 连接
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
```

#### Step 2.4：修改 API 路由为边缘运行时
```typescript
// 在每个 API 路由文件顶部添加
export const runtime = 'edge';

// 例如: src/app/api/todos/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  // ... 现有代码
}
```

#### Step 2.5：适配 NextAuth
```typescript
// src/lib/auth.ts - 边缘运行时适配
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// 注意：bcryptjs 在边缘环境可能需要替换
// 方案1: 使用 Web Crypto API
// 方案2: 使用 Auth.js 的边缘版本

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      // ... 配置
    }),
  ],
  session: { strategy: "jwt" }, // 边缘环境推荐 JWT
  // ...
});
```

---

### 阶段三：构建与测试 (Day 4)

#### Step 3.1：构建命令
```bash
# 使用 Cloudflare 适配器构建
npx @cloudflare/next-on-pages

# 或添加到 package.json
# "build:cf": "npx @cloudflare/next-on-pages"
```

#### Step 3.2：本地测试
```bash
# 本地预览 Cloudflare 环境
wrangler pages dev .vercel/output/static
```

#### Step 3.3：功能测试清单
- [ ] 用户登录/登出
- [ ] 任务 CRUD 操作
- [ ] 分类管理
- [ ] 各视图正常显示
- [ ] 国际化切换
- [ ] 主题切换
- [ ] 拖拽功能
- [ ] 子任务操作
- [ ] 周期任务

---

### 阶段四：部署上线 (Day 5)

#### Step 4.1：配置环境变量
```bash
# 在 Cloudflare Dashboard 设置
wrangler pages secret put DATABASE_URL
wrangler pages secret put DIRECT_URL
wrangler pages secret put NEXTAUTH_SECRET
wrangler pages secret put NEXTAUTH_URL
```

#### Step 4.2：部署
```bash
# 部署到 Cloudflare Pages
wrangler pages deploy .vercel/output/static --project-name=todolist
```

#### Step 4.3：配置自定义域名
```bash
# 在 Cloudflare Dashboard 添加域名
# 或使用命令行
wrangler pages domain add yourdomain.com --project-name=todolist
```

---

### 阶段五：优化与监控 (Day 6)

#### Step 5.1：启用 Cloudflare 功能
- [ ] 开启 Argo Smart Routing（可选，$5/月）
- [ ] 配置 Page Rules（缓存策略）
- [ ] 开启 Brotli 压缩
- [ ] 配置 WAF 规则

#### Step 5.2：监控配置
- [ ] Cloudflare Analytics
- [ ] 错误日志收集
- [ ] 性能监控

---

## 四、关键改造点

### 4.1 需要修改的文件列表

| 文件 | 改动类型 | 优先级 |
|------|---------|--------|
| `next.config.ts` | 配置修改 | 🔴 高 |
| `src/lib/db.ts` | 环境适配 | 🔴 高 |
| `src/lib/auth.ts` | 边缘适配 | 🔴 高 |
| `src/app/api/**/route.ts` | 添加 runtime | 🟡 中 |
| `src/lib/image-loader.ts` | 新建文件 | 🟡 中 |
| `wrangler.toml` | 新建配置 | 🔴 高 |
| `package.json` | 添加依赖 | 🔴 高 |

### 4.2 潜在问题与解决方案

| 问题 | 解决方案 |
|------|---------|
| bcryptjs 不兼容 | 使用 Web Crypto API 或 argon2 |
| Prisma 连接池 | 使用 Supabase Pooler 或 Prisma Accelerate |
| 文件上传 | 使用 Cloudflare R2 |
| Session 存储 | 使用 JWT 或 Cloudflare KV |
| 实时功能 | 使用 Cloudflare Durable Objects |

---

## 五、回滚计划

如果迁移失败，可快速回滚到 Vercel：

```bash
# 切回主分支
git checkout dev/vercel

# Vercel 自动部署
git push origin dev/vercel
```

---

## 六、验收标准

### 6.1 功能验收
- [ ] 所有 API 正常工作
- [ ] 用户认证流程正常
- [ ] 数据读写正常
- [ ] 所有视图正常显示

### 6.2 性能验收
- [ ] 首屏加载 < 2s
- [ ] API 响应 < 500ms
- [ ] 无运行时错误

### 6.3 兼容性验收
- [ ] Chrome/Firefox/Safari 正常
- [ ] 移动端正常
- [ ] 中英文切换正常

---

## 七、时间规划

| 阶段 | 时间 | 产出 |
|------|------|------|
| 环境准备 | Day 1 | Cloudflare 项目配置完成 |
| 代码改造 | Day 2-3 | 所有代码适配完成 |
| 构建测试 | Day 4 | 本地测试通过 |
| 部署上线 | Day 5 | 生产环境部署完成 |
| 优化监控 | Day 6 | 性能优化完成 |

**预计总时间：5-6 天**

---

## 八、参考资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [next-on-pages 适配器](https://github.com/cloudflare/next-on-pages)
- [Prisma Edge Functions](https://www.prisma.io/docs/orm/more/deployment/edge-deployments)
- [Auth.js Edge 兼容](https://authjs.dev/getting-started/deployment#edge-compatibility)