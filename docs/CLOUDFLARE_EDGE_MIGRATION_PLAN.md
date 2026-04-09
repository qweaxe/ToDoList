# Cloudflare Edge Runtime 迁移计划

> 状态：待执行  
> 背景：next-auth v4 和 Prisma 标准客户端均不兼容 Cloudflare Workers edge runtime，需要全面升级。

---

## 当前问题根源

| 模块 | 问题 | 原因 |
|------|------|------|
| `next-auth` v4 | 编译失败 | 内部依赖 `crypto`、`querystring`、`http` 等十余个 Node.js 内置模块 |
| Prisma 标准客户端 | 运行时失败 | 使用 TCP 连接数据库，edge runtime 不支持 TCP |

polyfill 方案不可行，必须从根本上替换这两个依赖。

---

## Plan A：next-auth v5 + Prisma edge adapter（继续使用 Supabase）

### A1. 升级 next-auth v4 → v5

**原理**：next-auth v5（Auth.js）使用 Web Crypto API 重写，原生支持 edge runtime。

#### 步骤

**1. 更新 package.json**
```json
// 移除
"next-auth": "^4.24.11",
"@next-auth/prisma-adapter": "^1.0.7",

// 添加
"next-auth": "^5.0.0-beta.28",
"@auth/prisma-adapter": "^2.7.4",
```

**2. 创建 `src/auth.ts`（新的配置入口）**
```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("请输入用户名和密码");
        }
        const user = await db.user.findUnique({
          where: { username: credentials.username as string },
        });
        if (!user) throw new Error("用户名或密码错误");
        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );
        if (!isValid) throw new Error("用户名或密码错误");
        return { id: user.id, name: user.name || user.username, username: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username as string;
      }
      return session;
    },
  },
});
```

**3. 重写 `src/app/api/auth/[...nextauth]/route.ts`**
```typescript
export const runtime = 'edge';
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

**4. 更新 `src/lib/auth.ts`**
```typescript
// 保留 getAuthSession 供服务端组件使用
export { auth as getAuthSession } from "@/auth";
```
> 注意：v5 中调用方式为 `const session = await auth()`，无需传参。

**5. 全局搜索替换**
- 搜索：`getServerSession(authOptions)` → 替换为：`auth()`（从 `@/auth` 导入）
- 搜索：`import { authOptions } from '@/lib/auth'` → 删除
- 搜索：`import NextAuth from 'next-auth'` → 检查是否还有 v4 用法

**6. 更新 Session 类型声明**

检查 `src/types/next-auth.d.ts`（如存在），确保类型定义与 v5 兼容。

---

### A2. Prisma Edge Adapter（Supabase + WebSocket）

**原理**：Prisma v6 支持通过 driver adapter 使用 HTTP/WebSocket 连接，绕过 TCP 限制。Supabase 兼容 PostgreSQL，可使用 `@prisma/adapter-pg` 搭配支持 WebSocket 的 pg 驱动。

#### 步骤

**1. 安装依赖**
```bash
npm install @prisma/adapter-pg pg
npm install -D @types/pg
```

> ⚠️ 不确定项：Cloudflare Workers 上的 WebSocket pg 连接需要验证。  
> 备选方案：若 `@prisma/adapter-pg` 不工作，尝试 `@prisma/adapter-neon` + Supabase 的 Neon 兼容端点（Supabase 支持 Neon 协议）。

**2. 更新 `prisma/schema.prisma`**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

执行：`npx prisma generate`

**3. 重写 `src/lib/db.ts`**
```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase Pooler 使用 SSL
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

**4. 验证 DATABASE_URL 格式**

Cloudflare edge 需要使用 Supabase Pooler 连接（端口 6543，Transaction 模式）：
```
DATABASE_URL="postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

#### 风险评估

| 风险 | 可能性 | 处理方式 |
|------|--------|---------|
| `pg` 包在 edge 不可用 | 中 | 切换到 Plan B（D1） |
| Supabase Pooler 不支持 WebSocket | 低 | 尝试 `@neondatabase/serverless` 兼容层 |
| SSL 握手失败 | 低 | 调整 SSL 配置 |

---

### A 验证清单

- [ ] `npm run build` 本地构建通过
- [ ] `npx @cloudflare/next-on-pages` 构建通过
- [ ] 登录功能正常
- [ ] 任务 CRUD 正常
- [ ] Session 持久化正常（刷新后仍登录）

---

## Plan B：next-auth v5 + Cloudflare D1（放弃 Supabase）

当 A2（Prisma + Supabase edge）验证失败时启用。

**注意**：D1 是 Cloudflare 原生 SQLite 数据库，需要**数据迁移**。

### B1. 创建 D1 数据库

```bash
npx wrangler d1 create todolist-db
```

将返回的 `database_id` 添加到 `wrangler.toml`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "todolist-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### B2. 安装依赖

```bash
npm install @prisma/adapter-d1
```

### B3. 更新 `prisma/schema.prisma`

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"  // D1 是 SQLite
  url      = env("DATABASE_URL")
}
```

### B4. 更新 `src/lib/db.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// D1 binding 通过 Cloudflare env 注入
export function createDb(d1Binding: D1Database) {
  const adapter = new PrismaD1(d1Binding);
  return new PrismaClient({ adapter });
}
```

> ⚠️ D1 方案的最大问题：API 路由需要访问 `env.DB`（D1 binding），这在 Next.js App Router 中需要特殊处理（通过 `getRequestContext()` 从 `@cloudflare/next-on-pages` 获取）。

### B5. 数据迁移

从 Supabase 导出数据 → 转换为 SQLite 格式 → 导入 D1：

```bash
# 生成 D1 迁移文件
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma \
  --script > migrations/init.sql

# 应用到 D1
npx wrangler d1 execute todolist-db --file=migrations/init.sql

# 数据导入（需要手动转换格式）
```

### B 额外工作量

- Schema 从 PostgreSQL 迁移到 SQLite（类型差异需处理，如 `DateTime` 精度）
- 数据导出/导入脚本
- 所有 API 路由需要调整 db 获取方式（从请求上下文中取 D1 binding）
- 本地开发环境配置 D1 本地模拟

---

## 执行顺序

```
1. 先执行 A1（next-auth v5）- 这部分确定可行
   ↓
2. 执行 A2（Prisma + Supabase edge）- 验证是否可行
   ↓ 成功 → 完成
   ↓ 失败 → 
3. 执行 Plan B（切换到 D1）
```

---

## 需要回滚时

```bash
# 切回 Vercel 分支
git checkout dev/vercel
git push origin dev/vercel
```

当前 `feat/cloudflare-deploy` 分支状态：
- ✅ 所有 API 路由已添加 `export const runtime = 'edge'`
- ✅ bcryptjs 已替换为 PBKDF2（`src/lib/password.ts`）
- ✅ `wrangler.toml` 已配置
- ✅ `next.config.ts` 已添加图片配置
- ❌ next-auth v4 未升级（当前阻塞点）
- ❌ Prisma 未配置 edge adapter（待验证）
- ❌ crypto-browserify 等无效 polyfill 需清理
