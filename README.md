# ToDo List - 待办事项管理应用

一个极简、直观且具有高度交互性的待办事项管理应用。

## 技术栈

- **MonoRepo**: TurboRepo
- **运行时**: Bun
- **前端**: Next.js + React + TanStack Query
- **后端**: Hono (Bun)
- **通信**: tRPC (端到端类型安全)
- **数据库**: PostgreSQL (Drizzle ORM)
- **样式**: Tailwind CSS
- **语言**: TypeScript (严格模式)

## 项目结构

```
ToDoList/
├── apps/
│   ├── web/          # Next.js 前端应用
│   └── server/       # Hono 后端服务
├── packages/
│   ├── api/          # tRPC 路由定义
│   ├── db/           # 数据库层 (Drizzle ORM)
│   └── utils/        # 共享工具函数
├── docs/             # 文档
├── package.json      # 根 package.json
├── turbo.json        # TurboRepo 配置
└── tsconfig.json     # TypeScript 基础配置
```

## 快速开始

### 环境要求

- Bun >= 1.0.0
- Node.js >= 18 (用于某些工具)

### 安装依赖

```bash
bun install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

### 初始化数据库

```bash
# 生成数据库迁移
bun run db:generate

# 推送数据库结构
bun run db:push

# 填充种子数据（可选）
bun run db:seed
```

### 启动开发服务器

```bash
# 同时启动前端和后端
bun run dev

# 或分别启动
bun run dev:web     # 前端 http://localhost:3000
bun run dev:server  # 后端 http://localhost:3001
```

## 可用脚本

| 脚本 | 描述 |
|------|------|
| `bun run dev` | 启动所有开发服务器 |
| `bun run build` | 构建所有应用 |
| `bun run lint` | 运行代码检查 |
| `bun run clean` | 清理构建产物 |
| `bun run db:generate` | 生成数据库迁移 |
| `bun run db:push` | 推送数据库结构 |
| `bun run db:seed` | 填充种子数据 |
| `bun run db:studio` | 启动 Drizzle Studio |

## 功能特性

### 视图
- **日视图**: 查看和管理当天的任务
- **周视图**: 看板式周任务管理，支持拖拽
- **月视图**: 日历形式展示整月任务
- **季度视图**: 里程碑和 OKR 追踪
- **年度视图**: GitHub 风格热力图

### 任务类型
- 基础任务
- 跨天任务
- 多步骤任务（子任务）
- 周期任务（支持 Cron 表达式）

### 其他特性
- 任务分类管理
- 任务等级管理
- 法定节假日显示
- 响应式设计
- 毛玻璃卡片效果

## API 接口

通过 tRPC 提供端到端类型安全的 API：

- `todo.getDaily` - 获取每日任务
- `todo.getMonthly` - 获取月度任务
- `todo.getWeekly` - 获取周任务
- `todo.getQuarterly` - 获取季度里程碑
- `todo.getYearlyStats` - 获取年度统计
- `todo.create` - 创建任务
- `todo.update` - 更新任务
- `todo.toggle` - 切换任务状态
- `todo.delete` - 删除任务
- `category.*` - 分类管理
- `level.*` - 等级管理
- `holiday.*` - 节假日查询

## 开发指南

详细架构设计请参考 [架构设计文档](./docs/架构设计文档.md)。

## License

MIT