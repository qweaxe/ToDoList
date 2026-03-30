# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

一个基于 Next.js 16、Prisma ORM 和 PostgreSQL 构建的多视图待办事项应用。支持日/周/月/季度/年视图，具有周期任务、子任务和节假日集成功能。

## 常用命令

```bash
# 开发
bun run dev              # 启动开发服务器（端口 3000）

# 数据库 (Prisma)
bun run db:generate      # 生成 Prisma Client（修改 schema 后必须执行）
bun run db:push          # 推送 schema 变更到数据库（开发环境）
bun run db:migrate       # 创建并应用迁移
bun run db:reset         # 重置数据库（删除所有数据）

# 构建与生产
bun run build            # 生产构建（包含 prisma generate + migrate deploy）
bun run start            # 启动生产服务器
bun run lint             # 运行 ESLint
```

## 架构

### 技术栈
- **框架**: Next.js 16 (App Router) + TypeScript
- **数据库**: PostgreSQL via Prisma ORM
- **状态管理**: TanStack Query（服务端状态） + Zustand（客户端状态）
- **UI**: Tailwind CSS 4 + shadcn/ui + Framer Motion

### 核心目录

- `src/app/api/` - 遵循 Next.js App Router 约定的 API 路由
- `src/components/views/` - 主要视图组件（DayView、CalendarView、WeeklyKanban 等）
- `src/hooks/use-view-store.ts` - 用于视图/导航状态的 Zustand store
- `src/services/recurrence-service.ts` - 周期任务生成逻辑
- `prisma/schema.prisma` - 数据库模型

### 数据库模型

- **Todo** - 主任务表，日期以 ISO 字符串格式存储 (YYYY-MM-DD)
- **Category** - 任务分类，包含 emoji 和颜色
- **Level** - 优先级等级（高/中/低，值为 3/2/1）
- **RecurrenceRule** - 周期任务规则（DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM）
- **Holiday** - 缓存的外部 API 节假日数据

### 任务类型检测

任务类型是动态计算的，不存储在数据库中：
- **基础任务**: `startDate === dueDate` 且无子任务
- **跨天任务**: `startDate !== dueDate`
- **多步骤任务**: 包含 `subTasks` 内容
- **周期任务**: `isCycleTask === true`

### 状态管理

**服务端状态** (TanStack Query):
- `use-todos.ts`、`use-categories.ts`、`use-levels.ts` - 数据获取 hooks

**客户端状态** (Zustand):
- `use-view-store.ts` - 当前视图、选中日期、日历状态
- 持久化到 localStorage，key 为 `todo-list-view-storage`

### API 端点

任务相关端点:
- `/api/todos/daily?date=YYYY-MM-DD` - 获取指定日期的任务
- `/api/todos/weekly?startDate=YYYY-MM-DD` - 获取一周的任务
- `/api/todos/monthly?year=YYYY&month=MM` - 获取一月的任务
- `/api/todos/quarterly?startDate=YYYY-MM-DD` - 获取里程碑任务
- `/api/todos/yearly?year=YYYY` - 年度统计数据
- `/api/todos/batch` - 批量操作（删除、状态变更）
- `/api/seed` - 初始化默认分类和等级

### 周期任务同步

周期任务在查看日/周/月数据时自动生成：
1. 查询活跃的 `RecurrenceRule` 记录
2. `calculateOccurrenceDates()` 计算时间窗口内的日期
3. 如果任务实例不存在则创建（通过 `parentRuleId` 检查）

详见 `src/services/recurrence-service.ts`。

## 重要模式

### 日期处理
- 所有日期以 ISO 字符串格式存储: `YYYY-MM-DD`
- 使用 `src/lib/date-utils.ts` 进行日期操作
- 避免直接操作 `Date` 对象

### Prisma Client
- 从 `@/lib/db.ts` 导入: `import { db } from '@/lib/db'`
- 开发模式会记录 queries/errors/warnings 日志
- 使用全局单例模式防止连接池耗尽

### API 路由结构
```typescript
// 示例: src/app/api/todos/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // 查询参数处理...
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  // 创建逻辑...
  return NextResponse.json(created);
}
```

### 首次部署
部署后访问 `/api/seed` 初始化默认分类和等级。

## 环境变量

`.env.local` 中需要配置:
- `DATABASE_URL` - PostgreSQL 连接字符串（连接池）
- `DIRECT_URL` - 直连 PostgreSQL（用于迁移）
