# LifeNexus - 待办事项管理应用架构文档

## 1. 项目概述

**LifeNexus** 是一个极简、直观且具有高度交互性的待办事项管理应用，支持按天管理任务，并提供月度日历视图进行宏观规划和数据统计。

---

## 2. 技术栈

### 2.1 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16 | 全栈框架（App Router） |
| TypeScript | 5 | 类型安全 |
| React | 19 | UI 组件 |

### 2.2 状态管理
| 技术 | 用途 |
|------|------|
| TanStack Query (React Query) | 服务端状态管理、缓存、自动重获取 |
| Zustand | 客户端全局状态（视图切换、UI状态） |

### 2.3 数据层
| 技术 | 用途 |
|------|------|
| Prisma ORM | 数据库 ORM |
| SQLite | 开发环境数据库 |

### 2.4 UI 与样式
| 技术 | 用途 |
|------|------|
| Tailwind CSS 4 | 原子化 CSS |
| shadcn/ui | 组件库（New York 风格） |
| Lucide Icons | 图标库 |
| Framer Motion | 动画过渡 |
| dnd-kit | 拖拽功能 |

### 2.5 工具库
| 技术 | 用途 |
|------|------|
| date-fns | 日期处理 |
| cron-parser | Cron 表达式解析 |
| zod | 表单验证 |
| bcryptjs | 密码加密 |

### 2.6 认证与授权
| 技术 | 用途 |
|------|------|
| NextAuth.js v4 | 认证框架 |
| JWT | 会话管理 |
| Credentials Provider | 用户名密码登录 |

---

## 3. 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 主页面（单页应用入口）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   └── api/                      # API Routes
│       ├── todos/                # 任务相关 API
│       │   ├── route.ts          # GET(列表) / POST(创建)
│       │   ├── [id]/route.ts     # GET/PUT/DELETE 单个任务
│       │   ├── batch/route.ts    # 批量操作
│       │   ├── daily/route.ts    # 当日视图数据
│       │   ├── weekly/route.ts   # 周视图数据
│       │   ├── monthly/route.ts  # 月视图数据
│       │   ├── quarterly/route.ts # 季度视图数据
│       │   └── yearly/route.ts   # 年度统计数据
│       ├── categories/           # 任务分类 API
│       │   └── route.ts
│       └── levels/               # 任务等级 API
│           └── route.ts
│
├── components/
│   ├── ui/                       # shadcn/ui 组件
│   ├── layout/                   # 布局组件
│   │   ├── Sidebar.tsx           # 侧边栏导航
│   │   ├── Header.tsx            # 顶部导航
│   │   └── Footer.tsx            # 底部栏
│   ├── views/                    # 视图组件
│   │   ├── DayView.tsx           # 当日视图
│   │   ├── CalendarView.tsx      # 日历视图
│   │   ├── WeeklyKanban.tsx      # 周视图
│   │   ├── QuarterlyRoadmap.tsx  # 季度视图
│   │   └── YearlyHeatmap.tsx     # 年度视图
│   ├── task/                     # 任务相关组件
│   │   ├── TaskCard.tsx          # 任务卡片
│   │   ├── TaskForm.tsx          # 任务表单
│   │   ├── TaskDetail.tsx        # 任务详情模态框
│   │   ├── SubTaskList.tsx       # 子任务列表
│   │   └── TaskBatchActions.tsx  # 批量操作
│   ├── calendar/                 # 日历相关组件
│   │   ├── CalendarGrid.tsx      # 日历网格
│   │   ├── CalendarCell.tsx      # 日历单元格
│   │   └── MonthStats.tsx        # 月度统计
│   └── settings/                 # 设置组件
│       ├── CategoryManager.tsx   # 分类管理
│       └── LevelManager.tsx      # 等级管理
│   └── common/                   # 通用组件
│       └── EmojiPicker.tsx       # Emoji 选择器（分类图标选择）
│
├── hooks/                        # 自定义 Hooks
│   ├── useTodos.ts               # 任务数据 Hook
│   ├── useCategories.ts          # 分类数据 Hook
│   ├── useLevels.ts              # 等级数据 Hook
│   └── useViewStore.ts           # 视图状态 Store
│
├── lib/
│   ├── db.ts                     # Prisma 客户端
│   ├── date-utils.ts             # 日期处理工具
│   ├── cron-utils.ts             # Cron 表达式工具
│   ├── holiday-service.ts        # 节假日服务
│   └── utils.ts                  # 通用工具函数
│
├── types/
│   ├── todo.ts                   # 任务类型定义
│   ├── category.ts               # 分类类型定义
│   └── api.ts                    # API 类型定义
│
└── prisma/
    └── schema.prisma             # 数据库模型定义
```

---

## 4. 数据模型设计

### 4.1 核心模型

```prisma
// 任务分类
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  emoji       String?
  color       String?  // 可选颜色标识
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  todos       Todo[]
}

// 任务等级（固定三级：高、中、低）
model Level {
  id          String   @id @default(cuid())
  name        String   @unique // 等级名称，固定为：高、中、低
  value       Int      @unique // 优先级数值，固定为：高=3，中=2，低=1
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  todos       Todo[]
}

// 任务主表
model Todo {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("pending") // pending, in_progress, completed
  
  // 时间维度
  startDate   String   // ISO格式: YYYY-MM-DD
  dueDate     String   // ISO格式: YYYY-MM-DD
  
  // 多步骤任务 - 使用 JSON 存储
  subTasks    String?  // JSON 字符串: [{id, text, isDone}]
  
  // 周期任务
  isCycleTask Boolean  @default(false)
  recurrenceRuleId String?
  recurrenceRule   RecurrenceRule? @relation(fields: [recurrenceRuleId], references: [id])
  
  // 关联
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  levelId     String?
  level       Level? @relation(fields: [levelId], references: [id])
  
  // 元数据
  priority    Int      @default(0) // 排序优先级
  isMilestone Boolean  @default(false) // 季度视图里程碑标记
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 周期规则
model RecurrenceRule {
  id        String   @id @default(cuid())
  frequency String   // DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
  interval  Int      @default(1) // 间隔
  byDay     String?  // JSON 数组: [0,1,2,3,4,5,6] 表示周日到周六
  cronExpr  String?  // 自定义 cron 表达式
  startDate String   // 开始日期
  endDate   String?  // 结束日期（可选）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  todos     Todo[]
}

// 节假日缓存（用于存储从API获取的数据）
model Holiday {
  id        String   @id @default(cuid())
  date      String   @unique // YYYY-MM-DD
  name      String   // 节假日名称
  isHoliday Boolean  // true=休息日, false=工作日（调休）
  year      Int
  createdAt DateTime @default(now())
}
```

### 4.2 任务类型判定逻辑

任务类型不存储在数据库中，而是根据字段动态计算：

| 任务类型 | 判定条件 |
|----------|----------|
| 基础任务 | `startDate === dueDate` 且无子任务 |
| 跨天任务 | `startDate !== dueDate` |
| 多步骤任务 | `subTasks` 字段有内容 |
| 周期任务 | `isCycleTask === true` |

**注意**：一个任务可以同时属于多个类型（如：跨天+多步骤）

---

## 5. API 接口设计

### 5.1 任务 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/todos/daily?date=YYYY-MM-DD` | 获取当日任务（含历史待办） |
| GET | `/api/todos/weekly?startDate=YYYY-MM-DD` | 获取一周任务 |
| GET | `/api/todos/monthly?year=YYYY&month=MM` | 获取整月任务 |
| GET | `/api/todos/quarterly?startDate=YYYY-MM-DD` | 获取季度里程碑 |
| GET | `/api/todos/yearly?year=YYYY` | 获取年度统计（仅计数） |
| GET | `/api/todos` | 获取任务列表（支持筛选） |
| POST | `/api/todos` | 创建任务 |
| GET | `/api/todos/:id` | 获取单个任务 |
| PUT | `/api/todos/:id` | 更新任务 |
| DELETE | `/api/todos/:id` | 删除任务 |
| POST | `/api/todos/batch` | 批量操作（删除、状态切换） |

### 5.2 分类 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/categories` | 获取所有分类 |
| POST | `/api/categories` | 创建分类 |
| PUT | `/api/categories/:id` | 更新分类 |
| DELETE | `/api/categories/:id` | 删除分类 |

### 5.3 等级 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/levels` | 获取所有等级（固定返回高、中、低三级） |

### 5.4 节假日 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/holidays?year=YYYY` | 获取年度节假日数据 |

### 5.5 认证 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/[...nextauth]` | NextAuth.js 认证端点 |
| GET | `/api/auth/session` | 获取当前会话信息 |
| POST | `/api/auth/signout` | 用户登出 |

---

## 6. 认证与授权架构

### 6.1 认证流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   登录页面   │────▶│  验证凭证   │────▶│  生成 JWT   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   访问资源   │◀────│  携带 Token │◀────│  返回客户端  │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  验证身份    │────▶│  返回数据   │
└─────────────┘     └─────────────┘
```

### 6.2 用户数据模型

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // bcrypt 加密存储
  name      String?  // 显示名称
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联数据
  categories Category[]
  todos      Todo[]
}
```

### 6.3 数据隔离策略

| 数据类型 | 隔离级别 | 说明 |
|----------|----------|------|
| 任务 (Todo) | 用户级 | 每个用户只能访问自己的任务 |
| 分类 (Category) | 用户级 | 每个用户有独立的分类数据 |
| 等级 (Level) | 系统级 | 所有用户共享固定三级等级 |
| 节假日 (Holiday) | 系统级 | 所有用户共享节假日数据 |

### 6.4 API 权限验证

```typescript
// API 路由中的权限验证示例
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: '未授权访问' },
      { status: 401 }
    );
  }
  
  const userId = session.user.id;
  // 只查询当前用户的数据
  const todos = await db.todo.findMany({
    where: { userId }
  });
  
  return NextResponse.json({ success: true, data: todos });
}
```

### 6.5 会话管理

- **JWT 策略**：使用 JWT 存储会话信息，无需服务器端会话存储
- **有效期**：默认 7 天，选择"记住我"延长至 30 天
- **刷新机制**：Token 过期前自动刷新

### 6.6 路由保护

```typescript
// middleware.ts
export { default } withAuth;

export const config = {
  matcher: [
    // 保护所有路由，除了登录/注册页
    '/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 7. 视图设计详解

### 7.1 当日视图 (Day View)

**展示内容**：
- 顶部：日期选择器 + "回到今天"按钮
- 历史待办区域：最多显示5条摘要，点击展开全部
- 当日任务列表：卡片式布局，区分完成/未完成

**交互**：
- 点击卡片 → 展开详情/编辑
- 有子任务的卡片 → 点击展开 Checklist
- 左滑删除（移动端）/ 悬浮删除按钮（桌面端）

### 7.2 日历视图 (Calendar View)

**布局**：7×6 标准网格（42个单元格）

**单元格内容**：
- 日期数字（周末红色）
- 工作日/休息日标记
- 最多5条任务摘要
- 超出数量提示

**交互**：
- 点击日期 → 跳转当日视图
- 悬浮任务 → 显示简要信息
- 月度统计：进度条显示完成率

### 7.3 周视图 (Weekly Kanban)

**布局**：横向7列（周一至周日）

**功能**：
- 拖拽任务跨天移动（自动更新 dueDate）
- 顶部周总结：完成率 + 重点任务

### 7.4 季度视图 (Quarterly Roadmap)

**展示**：3个月的里程碑时间线

**内容**：
- 仅显示 `isMilestone: true` 的任务
- 进度条显示跨天任务周期
- 截止日期标记

### 7.5 年度视图 (Yearly Heatmap)

**布局**：GitHub 风格贡献图（52周 × 7天）

**数据**：
- 颜色深浅表示任务完成密度
- 排除 skipped 状态
- 跨天任务仅在完成日期计数

**交互**：
- 悬浮显示当天摘要
- 点击跳转当日视图

---

## 8. 周期任务同步机制

### 8.1 同步触发时机

当调用以下 API 时，执行周期任务同步：
- `/api/todos/daily`
- `/api/todos/weekly`
- `/api/todos/monthly`

### 8.2 同步逻辑

```typescript
async function syncCycleTasks(startDate: Date, endDate: Date) {
  // 1. 查询所有活跃的周期规则
  const rules = await getActiveRecurrenceRules();
  
  // 2. 计算时间窗口内应生成的任务日期
  for (const rule of rules) {
    const dates = calculateOccurrenceDates(rule, startDate, endDate);
    
    // 3. 检查是否已存在，不存在则创建
    for (const date of dates) {
      const exists = await checkTaskExists(rule.id, date);
      if (!exists) {
        await createTaskFromRule(rule, date);
      }
    }
  }
}
```

---

## 9. 节假日数据获取方案

### 9.1 数据来源

使用开源 API 获取中国法定节假日：
- **主源**: [timor.tech](http://timor.tech/api/holiday) 免费节假日API
- **备源**: 本地缓存 + 手动配置补充

### 9.2 缓存策略

1. 首次访问时从 API 拉取当年数据
2. 存入 SQLite 数据库
3. 后续请求直接读缓存
4. 跨年时自动拉取新年数据

---

## 10. 性能优化策略

### 10.1 数据加载

| 视图 | 策略 |
|------|------|
| 年度视图 | 仅请求统计数据（日期 + 完成数），不返回完整任务对象 |
| 月视图 | 按月懒加载，切换月份时请求 |
| 周视图 | 预加载前后各一周数据 |

### 10.2 缓存策略

使用 TanStack Query 的缓存机制：
- 任务数据：5分钟过期
- 分类/等级：30分钟过期
- 节假日：1天过期

---

## 11. UI/UX 规范

### 11.1 配色方案

```css
/* 主色调 */
--primary: 现代感渐变（避免纯蓝/靛蓝）
--background: 浅色/深色主题支持

/* 任务状态 */
--completed: text-muted line-through
--pending: text-foreground
--overdue: text-destructive

/* 日历 */
--today: ring-2 ring-primary
--weekend: text-red-500
```

### 11.2 动画

- 任务添加/删除：Fade + Slide
- 状态切换：Scale + Color transition
- 视图切换：Cross-fade

### 11.3 响应式断点

| 断点 | 布局 |
|------|------|
| < 640px | 单列布局，底部导航 |
| 640px - 1024px | 侧边栏折叠 |
| > 1024px | 完整侧边栏 + 主内容区 |

---

## 12. 开发阶段规划

详见 `TODO_PLAN.md`
