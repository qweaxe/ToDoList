# To Do List 部署指南

本文档详细说明如何将 To Do List 部署到 Cloudflare Pages + D1 架构。

---

## 📋 架构概览

```
┌──────────────────────────────────────┐
│         Cloudflare Pages             │
│  ┌───────────┐  ┌─────────────────┐  │
│  │  前端     │  │  API Routes     │  │
│  │  (Edge)   │  │  (Edge Runtime) │  │
│  └───────────┘  └─────────────────┘  │
└──────────────────────────────────────┘
              │
              ▼
     ┌──────────────────┐
     │ Cloudflare D1    │
     │ (SQLite 边缘DB)  │
     └──────────────────┘
```

### 双路径架构

- **开发环境**：Prisma ORM + 本地 SQLite（`file:./dev.db`）
- **生产环境**：D1Client 原生 SQL + Cloudflare D1 binding（Edge Runtime）

API 路由通过 `IS_EDGE` 判断运行环境，自动切换数据库访问方式。

---

## 🚀 快速开始

### 前置条件

- [ ] Cloudflare 账号（用于 Pages + D1）
- [ ] Node.js 18+ 或 Bun
- [ ] Wrangler CLI（`npm install -g wrangler`）

---

## 第一阶段：本地开发环境配置

### 1.1 安装依赖

```bash
git clone https://github.com/qweaxe/ToDoList.git
cd ToDoList
bun install
```

### 1.2 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 本地开发使用 SQLite 文件数据库
DATABASE_URL="file:./dev.db"

# NextAuth 密钥（必需，用于 JWT 签名）
NEXTAUTH_SECRET="your-secret-key-here"

# 本地开发 URL
NEXTAUTH_URL="http://localhost:3000"

# 管理员用户 ID（可选，逗号分隔）
# ADMIN_USER_IDS=""
```

### 1.3 初始化数据库

```bash
# 生成 Prisma Client
bun run db:generate

# 同步 Schema 到本地 SQLite
bun run db:push
```

### 1.4 启动开发服务器

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000) 注册用户并验证应用正常。

### 1.5 初始化种子数据

注册登录后，访问 `/api/seed` 初始化默认分类和等级。**注意：此端点需要认证，匿名访问会被拒绝。**

---

## 第二阶段：Cloudflare D1 设置

### 2.1 登录 Wrangler

```bash
wrangler login
```

### 2.2 创建 D1 数据库

```bash
wrangler d1 create todolist-db
```

记下输出中的 `database_id`，更新 `wrangler.toml` 中的 `database_id` 字段。

### 2.3 初始化 D1 Schema

D1 数据库需要手动初始化表结构，Prisma migrate 仅适用于本地 SQLite，不能直接用于 D1。

```bash
# 方式一：通过 Prisma 导出 SQL，再手动在 D1 执行
# 先在本地生成迁移 SQL 文件
bun run db:migrate
# 然后查看生成的迁移 SQL（位于 prisma/migrations/ 目录）
# 选择对应的 SQL 文件，手动在 D1 执行：
wrangler d1 execute todolist-db --remote --command="$(cat prisma/migrations/<migration_folder>/migration.sql)"

# 方式二：从本地 SQLite 导出完整 Schema
# 使用 sqlite3 工具导出 dev.db 的表结构，再在 D1 执行
wrangler d1 execute todolist-db --remote --command="$(sqlite3 prisma/dev.db .schema)"

# 方式三：访问 /api/seed 端点
# 部署后注册登录，访问 /api/seed 初始化默认分类和等级
# 注意：seed 端点只创建分类和等级数据，不创建表结构
```

**重要**：无论哪种方式，表结构必须先在 D1 中创建，否则应用无法正常运行。

---

## 第三阶段：Cloudflare Pages 部署

### 3.1 构建项目

```bash
bun run build:cf
```

这会使用 `@cloudflare/next-on-pages` 将 Next.js 构建转为 Cloudflare Pages 兼容格式。

### 3.2 本地预览（可选）

```bash
bun run preview:cf
```

使用 Wrangler 在本地模拟 Cloudflare Pages + D1 环境。

**注意**：`preview:cf` 脚本（`wrangler pages dev .vercel/output/static`）缺少 `--compatibility-flag=nodejs_compat` 参数，而 `wrangler.toml` 中的 `nodejs_compat` 配置仅在远程部署时生效。如果预览时遇到 Node.js API 兼容性错误，需手动添加该参数或改用 `dev:cf`（已内置该 flag）。

### 3.3 部署到 Cloudflare

```bash
bun run deploy:cf
```

或手动部署：

```bash
wrangler pages deploy .vercel/output/static --project-name=todolist-cf
```

### 3.4 配置 Cloudflare 环境变量

在 Cloudflare Dashboard 中设置：

**Pages → todolist-cf → Settings → Environment variables**

| Name | Value | 说明 |
|------|-------|------|
| `NEXTAUTH_SECRET` | （Secret 类型） | JWT 签名密钥，必填 |
| `NEXTAUTH_URL` | （可选覆盖） | 已在 `wrangler.toml` `[vars]` 中默认设置为 `https://todolist-cf.pages.dev`，仅在自定义域名时需在 Dashboard 中覆盖此值 |
| `ADMIN_USER_IDS` | （可选） | 管理员用户 ID |

**注意**：
1. `NEXTAUTH_SECRET` 必须设为 Secret 类型（加密存储），不要用普通文本变量。
2. `NODE_ENV` 是双路径架构的关键开关：`IS_EDGE = process.env.NODE_ENV !== 'development'`。开发环境下 `NODE_ENV="development"` 使用 Prisma + SQLite 路径；生产环境默认 `"production"`，自动启用 D1 路径。Cloudflare Pages 生产部署无需手动设置 `NODE_ENV`，系统默认为 `"production"`。

---

## 第四阶段：验证部署

### 4.1 访问应用

访问 Cloudflare Pages 提供的域名，验证：

- [ ] 页面正常加载
- [ ] 可以注册/登录
- [ ] 可以创建任务
- [ ] 可以查看日历
- [ ] 数据持久化正常

### 4.2 初始化生产环境数据

登录后访问 `/api/seed` 初始化默认分类和等级。

---

## 🔧 常见问题

### Q1: D1 数据库连接失败

**症状**: `D1_CLIENT_ERROR` 或数据查询返回空

**解决方案**:
1. 确认 `wrangler.toml` 中 `database_id` 正确
2. 确认 D1 Schema 已初始化（`wrangler d1 execute`）
3. 检查 Cloudflare Dashboard 中 D1 绑定配置

### Q2: Edge Runtime 兼容性问题

**症状**: 构建报错 `edge runtime does not support nodejs api`

**解决方案**:
1. `wrangler.toml` 必须包含 `nodejs_compat` flag
2. 确认没有使用 Node.js 专属 API（如 `fs`、`crypto`）
3. 密码加密使用 Web Crypto API（PBKDF2），不使用 bcryptjs
4. `next.config.ts` 中设置了 `typescript: { ignoreBuildErrors: true }`，这是因为 next-auth v5 beta 与 Edge Runtime 存在类型不兼容问题，构建时需要忽略类型错误才能正常部署

### Q3: 认证相关错误

**症状**: 登录失败或 JWT 错误

**解决方案**:
1. 确认 `NEXTAUTH_SECRET` 已设为 Secret 类型
2. 确认 `NEXTAUTH_URL` 与实际访问域名一致
3. 本地开发时确保 `.env.local` 中 `NEXTAUTH_SECRET` 已填写

### Q4: 本地 Cloudflare 预览失败

**解决方案**:
```bash
# dev:cf 已内置 build:cf，无需单独构建
bun run dev:cf
```

---

## 📊 成本估算

| 服务 | 免费额度 | 个人使用预估 |
|------|---------|-------------|
| Cloudflare D1 | 5GB 存储, 5M 读/天, 100K 写/天 | ✅ 足够 |
| Cloudflare Pages | 500 构建/月, 无限带宽 | ✅ 足够 |
| **总计** | **$0/月** | |

---

## 🔄 后续维护

### 数据库备份

Cloudflare D1 支持导出：

```bash
wrangler d1 export todolist-db --output=backup.sql
```

### 更新部署

```bash
# 构建并部署
bun run build:cf
bun run deploy:cf
```

---

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1)
- [next-on-pages 适配器](https://github.com/cloudflare/next-on-pages)
- [架构文档](./ARCHITECTURE.md)