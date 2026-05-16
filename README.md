# To Do List - 待办事项管理应用

一个极简、直观且具有高度交互性的待办事项管理应用，支持按天管理任务，并提供多维度视图进行宏观规划和数据统计。

## ✨ 功能特性

### 📅 多维度视图
- **当日视图** - 查看今日任务和历史待办，支持按类型/分类/等级筛选
- **周视图** - 看板式周任务管理，支持拖拽排序
- **月视图** - 日历网格展示，含节假日标记
- **季度视图** - 里程碑时间线规划
- **年度视图** - GitHub 风格热力图统计

### 📋 任务管理
- 任务创建、编辑、删除、完成切换
- 任务分类和等级管理
- 子任务（多步骤任务）支持
- 周期任务（重复任务）自动生成
- 批量操作（多选、批量删除/更新/完成）
- 预估耗时设置与跨天标记
- 任务提醒与通知

### 📥 捕获箱
- 快速记录想法，稍后转化为任务
- 捕获箱内容管理和一键转换

### ⏱️ 时间记录
- 记录任务实际耗时
- 每日时间统计

### 🔐 用户认证
- 注册/登录/修改密码
- 密保问题找回密码
- JWT 会话管理

### 🌍 国际化
- 中文/英文双语支持
- 自动 locale 路由

### 🎨 用户体验
- 响应式设计（移动端/桌面端适配）
- 深色/浅色主题切换
- 流畅的动画过渡（Framer Motion）
- 拖拽排序（dnd-kit）

### 🖼️ 画中画/浮动面板
- 画中画（PiP）浮动面板，快速查看和操作任务
- 支持拖拽定位和最小化

### 🔑 API 密钥
- 生成外部 API 访问密钥
- 支持Bearer Token认证

### 📤 数据导出
- 任务数据导出
- 完整备份与增量同步

## 🛠️ 技术栈

### 核心框架
- **Next.js 15** - 全栈 React 框架（App Router + Edge Runtime）
- **TypeScript** - 类型安全
- **React 19** - UI 库

### 数据层
- **Prisma ORM** - 类型安全的数据库 ORM
- **SQLite** - 开发环境本地数据库
- **Cloudflare D1** - 生产环境边缘数据库（SQLite 兼容）

### 认证
- **NextAuth.js v5** - JWT 认证 + 密保问题
- **PBKDF2** - 密码加密（Web Crypto API）

### 状态管理
- **TanStack Query** - 服务端状态管理、数据缓存
- **Zustand** - 客户端全局状态

### UI 组件
- **Tailwind CSS 4** - 原子化 CSS
- **shadcn/ui** - 高质量组件库
- **Framer Motion** - 动画效果
- **dnd-kit** - 拖拽功能
- **Sonner** - Toast 通知
- **recharts** - 数据图表

### 国际化
- **next-intl** - i18n 路由与翻译

### 工具库
- **date-fns** - 日期处理
- **cron-parser** - 周期任务解析
- **Zod v4** - 表单验证
- **react-hook-form** - 表单管理

## 🚀 快速开始

### 环境要求

- **Bun** (推荐) 或 Node.js 18+

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/qweaxe/ToDoList.git
cd ToDoList

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，设置 DATABASE_URL 和 NEXTAUTH_SECRET

# 4. 生成 Prisma Client
bun run db:generate

# 5. 同步数据库 Schema
bun run db:push

# 6. 启动开发服务器
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 首次运行

注册用户后，访问 `/api/seed` 初始化默认分类和等级（需登录）。

## 📁 项目结构

```
src/
├── app/
│   ├── [locale]/           # 国际化路由
│   │   ├── page.tsx        # 主页面
│   │   └── layout.tsx      # locale 布局
│   ├── api/                # API 路由
│   │   ├── auth/           # 认证（注册/登录/密码/密保）
│   │   ├── todos/          # 任务 CRUD + 筛选/批量/周期/提醒
│   │   ├── categories/     # 分类 CRUD
│   │   ├── levels/         # 等级列表
│   │   ├── inbox/          # 捕获箱
│   │   ├── time-entries/   # 时间记录
│   │   ├── reminders/      # 任务提醒
│   │   ├── holidays/       # 节假日数据
│   │   ├── admin/          # 管理功能
│   │   ├── api-keys/       # API 密钥管理
│   │   ├── export/         # 数据导出/备份
│   │   ├── sync/           # 增量同步
│   │   └── seed/           # 初始化种子数据
│   └── layout.tsx          # 根布局（Edge Runtime）
│
├── components/
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── views/              # 视图组件（Day/Week/Calendar/Quarterly/Yearly）
│   ├── task/               # 任务相关组件
│   ├── calendar/           # 日历组件
│   ├── auth/               # 认证组件
│   ├── inbox/              # 捕获箱组件
│   ├── time/               # 时间记录组件
│   ├── reminder/           # 提醒组件
│   ├── pip/                # 画中画/浮动面板组件
│   ├── settings/           # 设置组件
│   ├── layout/             # 布局组件
│   └── common/             # 通用组件
│
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具函数（db/d1/auth/password/date-utils）
├── services/               # 业务服务（recurrence/reminder）
├── i18n/                   # 国际化配置
├── types/                  # TypeScript 类型定义
└── middleware.ts           # next-intl 路由中间件
│
messages/
├── zh.json                 # 中文翻译
├── en.json                 # 英文翻译

prisma/
└── schema.prisma           # 数据库模型定义

wrangler.toml               # Cloudflare Pages/D1 配置
```

## 📊 数据模型

| 模型 | 说明 |
|------|------|
| **User** | 用户（含密码、密保问题） |
| **Todo** | 任务主表（状态：pending/in_progress/completed） |
| **Category** | 任务分类（含 emoji） |
| **Level** | 任务等级（高/中/低） |
| **RecurrenceRule** | 周期规则（DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM） |
| **Holiday** | 节假日缓存 |
| **InboxItem** | 捕获箱条目 |
| **TimeEntry** | 时间记录 |
| **Reminder** | 任务提醒 |
| **ApiKey** | 外部 API 密钥 |

## 🌐 部署

### Cloudflare Pages + D1（推荐生产部署）

```bash
# 构建 Cloudflare 版本
bun run build:cf

# 本地预览
bun run preview:cf

# 部署到 Cloudflare
bun run deploy:cf
```

详细部署指南请参考 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### Vercel（备用方案）

仍可部署到 Vercel，但需使用 SQLite 适配方案，参见部署文档。

## 📝 常用命令

```bash
# 开发
bun run dev              # 启动开发服务器（端口 3000）
bun run dev:cf           # Cloudflare 本地开发

# 数据库
bun run db:generate      # 生成 Prisma Client
bun run db:push          # 同步 Schema 到数据库
bun run db:migrate       # 创建迁移
bun run db:reset         # 重置数据库

# 构建
bun run build            # 生产构建
bun run build:cf         # Cloudflare 构建
bun run lint             # 代码检查
```

## 📖 相关文档

- [架构文档](./docs/ARCHITECTURE.md) - 详细的技术架构说明
- [部署指南](./docs/DEPLOYMENT.md) - Cloudflare + D1 部署步骤
- [API 文档](./docs/API.md) - API 端点说明
- [开发计划](./docs/TODO_PLAN.md) - 项目开发进度
- [Cloudflare 迁移](./docs/CLOUDFLARE_EDGE_MIGRATION_PLAN.md) - Edge 迁移记录

## 📄 许可证

MIT License