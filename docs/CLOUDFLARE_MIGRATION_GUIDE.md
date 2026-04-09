# Cloudflare 迁移操作指南

本文档详细说明从 Vercel 迁移到 Cloudflare 的具体操作步骤。

---

## 一、前置准备（需要你手动操作）

### 1.1 数据库配置（继续使用 Supabase）

**无需迁移数据库**，继续使用现有 Supabase，只需确认连接池配置：

1. 登录 Supabase Dashboard
2. 进入项目 → Settings → Database
3. 找到 Connection string → Connection pooling
4. **记录连接字符串**：
   - `DATABASE_URL`：使用 Pooler 连接（端口 6543，Transaction 模式）
   - `DIRECT_URL`：使用直连（端口 5432，用于迁移）

**连接字符串格式**：
```
# 连接池（用于应用）
DATABASE_URL="postgresql://postgres:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# 直连（用于 Prisma 迁移）
DIRECT_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

> **注意**：如果现有 `.env.local` 已有正确配置，无需更改。

### 1.2 创建 Cloudflare 账号

1. 访问 https://dash.cloudflare.com/sign-up 注册
2. 验证邮箱

### 1.3 安装 Wrangler CLI

```bash
# 全局安装
npm install -g wrangler

# 登录 Cloudflare（会打开浏览器）
wrangler login
```

### 1.4 创建 Cloudflare Pages 项目

```bash
wrangler pages project create todolist
# 选择生产分支：feat/cloudflare-deploy
```

### 1.5 生成 NEXTAUTH_SECRET

```bash
# 方法1：使用 openssl
openssl rand -base64 32

# 方法2：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**记录生成的密钥**，稍后需要配置到环境变量。

---

## 二、数据迁移

**无需数据迁移**，继续使用现有 Supabase 数据库。

只需确认 Prisma 连接配置正确：

```env
# .env.local
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://...supabase.co:5432/postgres"
```

> **注意**：Cloudflare Workers 使用 HTTP 连接，Supabase Pooler 已支持。

---

## 三、代码改造（由 Claude 执行）

### 3.1 安装 Cloudflare 依赖

```bash
bun add -D @cloudflare/next-on-pages wrangler
```

### 3.2 创建 wrangler.toml

在项目根目录创建 `wrangler.toml`：

```toml
name = "todolist"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[vars]
NEXTAUTH_URL = "https://your-domain.pages.dev"
```

### 3.3 修改 next.config.ts

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true, // Cloudflare 不支持 Next.js 图片优化
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default withNextIntl(nextConfig);
```

### 3.4 创建密码加密工具

创建 `src/lib/password.ts`，使用 Web Crypto API 替代 bcryptjs：

```typescript
/**
 * Cloudflare Workers 兼容的密码加密工具
 * 使用 Web Crypto API (PBKDF2) 替代 bcryptjs
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

// 编码辅助函数
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Base64 编码/解码
function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

/**
 * 生成密码哈希
 * @param password 明文密码
 * @returns 格式: "salt:hash" (base64 编码)
 */
export async function hashPassword(password: string): Promise<string> {
  // 生成随机盐值
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // 导入密码作为密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // 使用 PBKDF2 派生密钥
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  // 返回 "salt:hash" 格式
  return `${toBase64(salt.buffer)}:${toBase64(hash)}`;
}

/**
 * 验证密码
 * @param password 明文密码
 * @param storedHash 存储的哈希 (格式: "salt:hash")
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const [saltBase64, hashBase64] = storedHash.split(':');
    if (!saltBase64 || !hashBase64) return false;

    const salt = fromBase64(saltBase64);
    const storedHashBytes = fromBase64(hashBase64);

    // 导入密码作为密钥材料
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // 使用相同的盐值派生密钥
    const computedHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_LENGTH
    );

    // 比较哈希值（恒定时间比较）
    const computedBytes = new Uint8Array(computedHash);
    let match = true;
    for (let i = 0; i < storedHashBytes.length; i++) {
      if (computedBytes[i] !== storedHashBytes[i]) {
        match = false;
      }
    }
    return match && computedBytes.length === storedHashBytes.length;
  } catch {
    return false;
  }
}
```

### 3.5 替换 bcryptjs 调用

修改以下文件，将 `bcrypt` 替换为新的 `password.ts`：

**src/lib/auth.ts**：
```typescript
// 删除
import bcrypt from 'bcryptjs';

// 添加
import { verifyPassword } from '@/lib/password';

// 替换
const isPasswordValid = await bcrypt.compare(password, user.password);
// 改为
const isPasswordValid = await verifyPassword(password, user.password);
```

**src/app/api/auth/register/route.ts**：
```typescript
// 删除
import bcrypt from 'bcryptjs';

// 添加
import { hashPassword } from '@/lib/password';

// 替换
const hashedPassword = await bcrypt.hash(password, 10);
// 改为
const hashedPassword = await hashPassword(password);
```

**src/app/api/auth/change-password/route.ts**、**reset-password/route.ts**、**security-question/route.ts**：
同样替换为 `verifyPassword` 和 `hashPassword`。

### 3.6 添加 edge runtime 到 API 路由

在每个 `src/app/api/**/route.ts` 文件顶部添加：

```typescript
export const runtime = 'edge';
```

涉及文件：
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/security-question/route.ts`
- `src/app/api/todos/route.ts`
- `src/app/api/todos/[id]/route.ts`
- `src/app/api/todos/toggle/route.ts`
- `src/app/api/todos/daily/route.ts`
- `src/app/api/todos/weekly/route.ts`
- `src/app/api/todos/monthly/route.ts`
- `src/app/api/todos/quarterly/route.ts`
- `src/app/api/todos/yearly/route.ts`
- `src/app/api/todos/filter/route.ts`
- `src/app/api/todos/batch/route.ts`
- `src/app/api/todos/[id]/subtask/route.ts`
- `src/app/api/todos/[id]/reminders/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/categories/[id]/route.ts`
- `src/app/api/levels/route.ts`
- `src/app/api/api-keys/route.ts`
- `src/app/api/api-keys/[id]/route.ts`
- `src/app/api/export/todos/route.ts`
- `src/app/api/export/backup/route.ts`
- `src/app/api/sync/route.ts`
- `src/app/api/reminders/pending/route.ts`
- `src/app/api/reminders/[id]/route.ts`
- `src/app/api/reminders/[id]/sent/route.ts`
- `src/app/api/seed/route.ts`
- `src/app/api/holidays/route.ts`

### 3.7 修改 package.json 构建脚本

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "prisma generate && prisma migrate deploy && next build",
    "build:cf": "npx @cloudflare/next-on-pages",
    "preview:cf": "wrangler pages dev .vercel/output/static",
    "deploy:cf": "wrangler pages deploy .vercel/output/static --project-name=todolist",
    "start": "next start",
    "lint": "eslint .",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate"
  }
}
```

---

## 四、环境变量配置

### 4.1 本地开发环境

确认 `.env.local` 配置正确：

```env
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://...supabase.co:5432/postgres"
NEXTAUTH_SECRET="你生成的密钥"
NEXTAUTH_URL="http://localhost:3000"
```

### 4.2 Cloudflare Pages 环境变量

在 Cloudflare Dashboard 或使用 CLI：

```bash
# 设置环境变量
wrangler pages secret put DATABASE_URL --project-name=todolist
# 粘贴 Supabase Pooler 连接字符串（端口 6543）

wrangler pages secret put DIRECT_URL --project-name=todolist
# 粘贴 Supabase 直连字符串（端口 5432）

wrangler pages secret put NEXTAUTH_SECRET --project-name=todolist
# 粘贴生成的密钥

wrangler pages secret put NEXTAUTH_URL --project-name=todolist
# 输入生产域名，如 https://todolist.pages.dev
```

或在 Cloudflare Dashboard 操作：
1. 进入 Pages → todolist → Settings → Environment variables
2. 添加 Production 和 Preview 环境变量

---

## 五、构建与部署

### 5.1 本地测试

```bash
# 安装依赖
bun install

# 构建 Cloudflare 版本
bun run build:cf

# 本地预览
bun run preview:cf
```

访问 http://localhost:8788 测试功能。

### 5.2 部署到 Cloudflare

```bash
# 部署
bun run deploy:cf
```

或使用 GitHub 自动部署：
1. 在 Cloudflare Dashboard → Pages → todolist → Settings
2. 连接 GitHub 仓库
3. 设置构建命令：`bun run build:cf`
4. 设置输出目录：`.vercel/output/static`

---

## 六、功能验证清单

部署完成后验证以下功能：

- [ ] 用户登录
- [ ] 用户注册
- [ ] 修改密码
- [ ] 任务创建/编辑/删除
- [ ] 任务状态切换
- [ ] 分类管理
- [ ] 各视图显示（日/周/月/季/年）
- [ ] 国际化切换
- [ ] 主题切换
- [ ] 子任务操作
- [ ] API Token 功能

---

## 七、常见问题

### Q1: 登录失败，密码验证错误

**原因**：旧密码使用 bcrypt 加密，新系统使用 PBKDF2

**解决**：需要重置所有用户密码，或保留 bcrypt 兼容层

### Q2: 数据库连接超时

**原因**：Neon 免费版有连接数限制

**解决**：确保使用连接池连接字符串（带 `-pooler` 后缀）

### Q3: API 返回 500 错误

**原因**：edge runtime 不支持某些 Node.js API

**解决**：检查是否使用了 Node.js 特有模块，替换为 Web API

---

## 八、回滚方案

如果迁移失败，快速回滚到 Vercel：

```bash
# 切换回 Vercel 分支
git checkout dev/vercel

# 推送触发 Vercel 部署
git push origin dev/vercel
```

---

## 九、操作顺序总结

```
你手动操作：
├── 1. 确认 Supabase 连接池配置
├── 2. 创建 Cloudflare 账号
├── 3. 安装 Wrangler CLI 并登录
├── 4. 创建 Pages 项目
└── 5. 生成 NEXTAUTH_SECRET

Claude 执行：
├── 1. 安装 Cloudflare 依赖
├── 2. 创建 wrangler.toml
├── 3. 修改 next.config.ts
├── 4. 创建 password.ts
├── 5. 替换 bcryptjs 调用
├── 6. 添加 edge runtime
└── 7. 修改 package.json

你手动操作：
├── 1. 配置环境变量
├── 2. 本地测试
└── 3. 部署上线
```
