# To Do List 部署指南

本文档详细说明如何将 To Do List 部署到 Vercel + Supabase 架构。

---

## 📋 架构概览

```
┌─────────────────────────────────┐
│           Vercel                │
│  ┌───────────┐ ┌─────────────┐  │
│  │  前端     │ │  API Routes │  │
│  └───────────┘ └─────────────┘  │
└─────────────────────────────────┘
              │
              ▼
     ┌─────────────────┐
     │ Supabase        │
     │ PostgreSQL      │
     └─────────────────┘
```

---

## 🚀 快速开始

### 前置条件

- [ ] GitHub 账号
- [ ] Vercel 账号（可用 GitHub 登录）
- [ ] Supabase 账号（可用 GitHub 登录）
- [ ] 本地开发环境：Bun 或 Node.js 18+

---

## 第一阶段：Supabase 设置

### 1.1 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并登录
2. 点击 **New Project** 创建新项目
3. 填写项目信息：
   - **Name**: `To Do List` (或您喜欢的名称)
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)` 以获得较好的国内访问速度
4. 点击 **Create new project**，等待项目创建完成（约 2 分钟）

### 1.2 获取数据库连接字符串

1. 项目创建完成后，进入项目控制台
2. 点击左侧 **Project Settings** (齿轮图标)
3. 选择 **Database**
4. 在 **Connection string** 部分：
   - 选择 **URI** 标签
   - 选择 **Mode: Session** 或 **Transaction** (推荐 Transaction)
   - 复制连接字符串

连接字符串格式如下：
```
postgresql://postgres.[PROJECT_ID]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 1.3 配置本地环境变量

1. 复制环境变量模板：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local`，填入实际的数据库连接字符串：
   ```env
   DATABASE_URL="postgresql://postgres.xxxxx:your-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
   ```

---

## 第二阶段：本地开发环境配置

### 2.1 安装依赖

```bash
bun install
```

### 2.2 生成 Prisma Client

```bash
bun run db:generate
```

### 2.3 推送数据库 Schema

```bash
bun run db:push
```

这会将 Prisma schema 同步到 Supabase 数据库，创建所有必要的表。

### 2.4 初始化种子数据（可选）

启动开发服务器后，访问以下地址初始化默认数据：
```
http://localhost:3000/api/seed
```

这会创建默认的任务分类和等级。

### 2.5 启动开发服务器

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000) 验证应用正常运行。

---

## 第三阶段：Vercel 部署

### 3.1 推送代码到 GitHub

1. 创建 GitHub 仓库（如果还没有）
2. 推送代码：
   ```bash
   git add .
   git commit -m "feat: migrate to PostgreSQL"
   git push origin main
   ```

### 3.2 在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 **Add New...** → **Project**
3. 选择 **Import Git Repository**
4. 选择您的 GitHub 仓库
5. 配置项目：
   - **Framework Preset**: Next.js (自动检测)
   - **Root Directory**: `./`
   - **Build Command**: `bun run build` (默认)
   - **Output Directory**: `.next` (默认)

### 3.3 配置环境变量

在 Vercel 项目设置中添加环境变量：

1. 展开 **Environment Variables** 部分
2. 添加以下变量：

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | 您的 Supabase 连接字符串 | Production, Preview, Development |

3. 点击 **Deploy** 开始部署

### 3.4 等待部署完成

Vercel 会自动：
- 安装依赖
- 构建 Next.js 应用
- 部署到全球边缘网络

部署完成后，您会获得一个 `xxx.vercel.app` 的域名。

---

## 第四阶段：验证部署

### 4.1 访问应用

访问 Vercel 提供的域名，验证：
- [ ] 页面正常加载
- [ ] 可以创建任务
- [ ] 可以查看日历
- [ ] 数据持久化正常

### 4.2 初始化生产环境数据

首次部署后，访问以下地址初始化数据：
```
https://your-app.vercel.app/api/seed
```

---

## 🔧 常见问题

### Q1: 数据库连接失败

**症状**: `Can't reach database server`

**解决方案**:
1. 检查 `DATABASE_URL` 是否正确
2. 确认 Supabase 项目状态是否为 Active
3. 检查密码中的特殊字符是否需要 URL 编码

### Q2: Prisma 迁移错误

**症状**: `Prisma schema validation error`

**解决方案**:
```bash
# 重新生成 Prisma Client
bun run db:generate

# 强制同步 schema（开发环境）
bun run db:push
```

### Q3: Vercel 构建失败

**症状**: Build failed in Vercel

**解决方案**:
1. 检查 Vercel 构建日志
2. 确认环境变量已正确设置
3. 本地运行 `bun run build` 测试构建

### Q4: 国内访问 Vercel 较慢

**解决方案**:
1. 考虑绑定自定义域名
2. 或使用 Cloudflare Pages 作为替代方案

---

## 📊 成本估算

| 服务 | 免费额度 | 个人使用预估 |
|------|---------|-------------|
| Supabase | 500MB 数据库, 1GB 文件存储 | ✅ 足够 |
| Vercel | 100GB 带宽/月 | ✅ 足够 |
| **总计** | **$0/月** | |

---

## 🔄 后续维护

### 数据库备份

Supabase 免费版不提供自动备份，建议定期手动导出数据：

1. Supabase 控制台 → Database → Backups
2. 或使用 `pg_dump` 命令行工具

### 更新部署

每次推送到 `main` 分支，Vercel 会自动重新部署：

```bash
git add .
git commit -m "your changes"
git push origin main
```

---

## 📚 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [Vercel 文档](https://vercel.com/docs)
- [Prisma PostgreSQL 指南](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)