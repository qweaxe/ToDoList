# To Do List - 待办事项管理应用

一个极简、直观且具有高度交互性的待办事项管理应用，支持按天管理任务，并提供多维度视图进行宏观规划和数据统计。

## ✨ 功能特性

### 📅 多维度视图
- **当日视图** - 查看今日任务和历史待办
- **周视图** - 看板式周任务管理，支持拖拽
- **月视图** - 日历网格展示，含节假日标记
- **季度视图** - 里程碑时间线规划
- **年度视图** - GitHub 风格热力图统计

### 📋 任务管理
- 任务创建、编辑、删除
- 任务分类和等级管理
- 子任务（多步骤任务）支持
- 周期任务（重复任务）自动生成
- 批量操作（多选、批量删除/更新）

### 🎨 用户体验
- 响应式设计（移动端/桌面端适配）
- 深色/浅色主题切换
- 流畅的动画过渡
- 拖拽排序功能（待开发）

## 🛠️ 技术栈

### 核心框架
- **Next.js** - 全栈 React 框架（App Router）
- **TypeScript** - 类型安全
- **React** - UI 组件库

### 数据层
- **Prisma ORM** - 类型安全的数据库 ORM
- **PostgreSQL** - 生产级关系型数据库（Supabase）

### 状态管理
- **TanStack Query** - 服务端状态管理、数据缓存
- **Zustand** - 客户端全局状态

### UI 组件
- **Tailwind CSS** - 原子化 CSS
- **shadcn/ui** - 高质量组件库
- **Framer Motion** - 动画效果
- **dnd-kit** - 拖拽功能

### 工具库
- **date-fns** - 日期处理
- **cron-parser** - 周期任务解析
- **Zod** - 表单验证

## 🚀 快速开始

### 环境要求

- **Bun** (推荐) 或 Node.js 18+
- **Supabase 账号** (免费) - 用于 PostgreSQL 数据库

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/qweaxe/todolist.git
cd todolist

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 数据库连接字符串

# 4. 生成 Prisma Client
bun run db:generate

# 5. 同步数据库 Schema
bun run db:push

# 6. 启动开发服务器
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 首次运行

启动后访问 [http://localhost:3000/api/seed](http://localhost:3000/api/seed) 初始化默认数据（分类和等级）。

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 主页面
│   ├── layout.tsx         # 根布局
│   └── api/               # API 路由
│       ├── todos/         # 任务 API
│       ├── categories/    # 分类 API
│       ├── levels/        # 等级 API
│       └── holidays/      # 节假日 API
│
├── components/
│   ├── ui/                # shadcn/ui 基础组件
│   ├── layout/            # 布局组件
│   ├── views/             # 视图组件
│   ├── task/              # 任务相关组件
│   ├── calendar/          # 日历组件
│   └── settings/          # 设置组件
│
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具函数
├── services/              # 业务服务
└── types/                 # TypeScript 类型定义

prisma/
└── schema.prisma          # 数据库模型定义

docs/
├── ARCHITECTURE.md        # 架构文档
├── DEPLOYMENT.md          # 部署指南
└── TODO_PLAN.md          # 开发计划
```

## 📊 数据模型

| 模型 | 说明 |
|------|------|
| **Todo** | 任务主表 |
| **Category** | 任务分类 |
| **Level** | 任务等级（高/中/低） |
| **RecurrenceRule** | 周期规则 |
| **Holiday** | 节假日缓存 |

## 🌐 部署

### Vercel 部署（推荐）

详细部署指南请参考 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

简要步骤：
1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量 `DATABASE_URL` 和 `DIRECT_URL`
4. 部署完成后访问 `/api/seed` 初始化数据

## 📝 常用命令

```bash
# 开发
bun run dev          # 启动开发服务器

# 数据库
bun run db:generate  # 生成 Prisma Client
bun run db:push      # 同步 Schema 到数据库
bun run db:migrate   # 创建迁移
bun run db:reset     # 重置数据库

# 构建
bun run build        # 构建生产版本
bun run start        # 启动生产服务器
bun run lint         # 代码检查
```

## 📖 相关文档

- [架构文档](./docs/ARCHITECTURE.md) - 详细的技术架构说明
- [部署指南](./docs/DEPLOYMENT.md) - Vercel + Supabase 部署步骤
- [开发计划](./docs/TODO_PLAN.md) - 项目开发进度

## 📄 许可证

MIT License