# To Do List - 待办事项管理应用架构文档

## 1. 项目概述

**To Do List** 是一个极简、直观且具有高度交互性的待办事项管理应用，支持按天管理任务，并提供月度日历视图进行宏观规划和数据统计。

---

## 2. 技术栈

### 2.1 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.2.4 | 全栈框架（App Router） |
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
| Cloudflare D1 | 生产环境数据库（SQLite 兼容） |

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
| Web Crypto API | 密码加密（PBKDF2） |
| next-intl | 国际化 (i18n) |

### 2.6 认证与授权
| 技术 | 用途 |
|------|------|
| NextAuth.js v5 | 认证框架（beta 版本） |
| JWT | 会话管理 |
| Credentials Provider | 用户名密码登录 |

---

## 3. 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # 国际化路由
│   │   ├── page.tsx              # 主页面（单页应用入口）
│   │   ├── layout.tsx            # 国际化布局
│   │   └── forgot-password/      # 忘记密码页面
│   ├── page.tsx                  # 根页面重定向
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   ├── middleware.ts             # 国际化中间件
│   └── api/                      # API Routes
│       ├── route.ts              # 根 API（健康检查）
│       ├── auth/                 # 认证相关 API
│       │   ├── register/route.ts # 用户注册
│       │   ├── [...nextauth]/    # NextAuth.js 端点
│       │   ├── change-password/  # 修改密码
│       │   ├── forgot-password/  # 忘记密码
│       │   ├── reset-password/   # 重置密码
│       │   └── security-question/# 密保问题
│       ├── todos/                # 任务相关 API
│       │   ├── route.ts          # GET(列表) / POST(创建)
│       │   ├── [id]/route.ts     # GET/PUT/DELETE 单个任务
│       │   ├── [id]/subtask/route.ts # 子任务操作
│       │   ├── [id]/reminders/route.ts # 任务提醒
│       │   ├── batch/route.ts    # 批量操作
│       │   ├── daily/route.ts    # 当日视图数据
│       │   ├── weekly/route.ts   # 周视图数据
│       │   ├── monthly/route.ts  # 月视图数据
│       │   ├── quarterly/route.ts # 季度视图数据
│       │   ├── yearly/route.ts   # 年度统计数据
│       │   ├── filter/route.ts   # 按分类/等级筛选
│       │   └── toggle/route.ts   # 切换任务状态
│       ├── categories/           # 任务分类 API
│       │   ├── route.ts          # 列表/创建
│       │   └── [id]/route.ts     # 更新/删除
│       ├── levels/               # 任务等级 API
│       │   └── route.ts
│       ├── holidays/             # 节假日 API
│       │   └── route.ts
│       ├── api-keys/             # API 密钥管理
│       │   ├── route.ts          # 列表/创建
│       │   └── [id]/route.ts     # 删除
│       ├── export/               # 数据导出
│       │   ├── todos/route.ts    # 任务导出
│       │   └── backup/route.ts   # 完整备份
│       ├── sync/                 # 增量同步
│       │   └── route.ts
│       ├── reminders/            # 提醒管理
│       │   ├── pending/route.ts  # 待发送提醒
│       │   └── [id]/route.ts     # 删除
│       │   └── [id]/sent/route.ts # 标记已发送
│       ├── admin/                # 管理员 API
│       │   ├── check/route.ts    # 权限检查
│       │   └── holidays/route.ts # 节假日管理
│       └── seed/                 # 初始化种子数据
│           └── route.ts
│
├── components/
│   ├── ui/                       # shadcn/ui 组件
│   ├── layout/                   # 布局组件
│   │   ├── Sidebar.tsx           # 侧边栏导航
│   │   ├── Header.tsx            # 顶部导航
│   │   ├── Footer.tsx            # 底部栏
│   │   ├── MainLayout.tsx        # 主布局
│   │   └── SecurityBanner.tsx    # 安全提示横幅
│   ├── views/                    # 视图组件
│   │   ├── DayView.tsx           # 当日视图
│   │   ├── CalendarView.tsx      # 日历视图
│   │   ├── WeekView.tsx          # 周视图（含拖拽）
│   │   ├── QuarterlyView.tsx     # 季度视图
│   │   ├── YearlyView.tsx        # 年度视图
│   │   ├── OverdueView.tsx       # 历史待办视图
│   │   ├── TaskListView.tsx      # 任务列表视图
│   │   └── SettingsView.tsx      # 设置视图
│   ├── task/                     # 任务相关组件
│   │   ├── TaskCard.tsx          # 任务卡片
│   │   ├── TaskForm.tsx          # 任务表单
│   │   ├── TaskDetailDialog.tsx  # 任务详情弹窗
│   │   └── BatchActionsToolbar.tsx # 批量操作工具栏
│   ├── calendar/                 # 日历相关组件
│   │   ├── CalendarGrid.tsx      # 日历网格
│   │   ├── CalendarCell.tsx      # 日历单元格
│   │   └── MonthStats.tsx        # 月度统计
│   ├── settings/                 # 设置组件
│   │   ├── CategoryManager.tsx   # 分类管理
│   │   ├── LevelManager.tsx      # 等级管理
│   │   ├── ChangePassword.tsx    # 修改密码
│   │   ├── SecurityQuestionSetting.tsx # 密保问题设置
│   │   ├── ApiKeyManager.tsx     # API 密钥管理
│   │   ├── HolidayManager.tsx    # 节假日管理
│   │   ├── CacheManager.tsx      # 缓存管理
│   │   └── SystemInfo.tsx        # 系统信息
│   ├── auth/                     # 认证组件
│   │   ├── AuthPage.tsx          # 登录/注册页面
│   │   ├── ForgotPasswordPage.tsx # 忘记密码页面
│   │   └── SessionProvider.tsx   # 会话提供者
│   └── common/                   # 通用组件
│       ├── EmojiPicker.tsx       # Emoji 选择器
│       └── LanguageSwitcher.tsx  # 语言切换
│
├── hooks/                        # 自定义 Hooks
│   ├── use-todos.ts              # 任务数据 Hook
│   ├── use-categories.ts         # 分类数据 Hook
│   ├── use-levels.ts             # 等级数据 Hook
│   ├── use-view-store.ts         # 视图状态 Store
│   ├── use-holidays.ts           # 节假日数据 Hook
│   ├── use-batch-selection.ts    # 批量选择 Hook
│   ├── use-mobile.ts             # 移动端检测 Hook
│   ├── use-toast.ts              # Toast 提示 Hook
│   ├── use-reminders.ts          # 提醒数据 Hook
│   ├── use-notifications.ts      # 浏览器通知 Hook
│   └── use-inbox.ts              # 捕获箱数据 Hook
│
├── lib/
│   ├── db.ts                     # Prisma 客户端（D1 适配）
│   ├── d1.ts                     # D1 原生客户端
│   ├── auth.ts                   # NextAuth 配置
│   ├── password.ts               # 密码加密（Web crypto API）
│   ├── admin.ts                  # 管理员权限检查
│   ├── api-auth.ts               # API Token 认证
│   ├── date-utils.ts             # 日期处理工具
│   ├── cron-utils.ts             # Cron 表达式工具
│   ├── holiday-service.ts        # 节假日服务
│   ├── static-holidays.ts        # 静态节假日数据
│   ├── api-utils.ts              # API 工具函数
│   ├── mutation-manager.ts       # Mutation 管理器（乐观更新）
│   └── utils.ts                  # 通用工具函数
│
├── services/
│   ├── recurrence-service.ts     # 周期任务同步服务
│   └── reminder-service.ts       # 提醒服务
│
├── i18n/
│   ├── request.ts                # next-intl 请求配置
│   └── routing.ts                # 国际化路由配置
│
├── types/
│   ├── index.ts                  # 类型导出
│   ├── api.ts                    # API 类型定义
│   └── next-auth.d.ts            # NextAuth 类型扩展
│
├── middleware.ts                 # Next.js 中间件（认证+i18n）
│
└── messages/                     # 国际化翻译文件
    ├── en.json                   # 英文翻译
    └── zh.json                   # 中文翻译

prisma/
└── schema.prisma                 # 数据库模型定义
└── migrations/                   # 数据库迁移文件
```

---

## 4. 数据模型设计

### 4.1 核心模型

```prisma
// 用户表
model User {
  id                      String    @id @default(cuid())
  username                String    @unique
  password                String    // PBKDF2 加密存储
  name                    String?   // 显示名称
  securityQuestion        String?   // 密保问题
  securityAnswer          String?   // 密保答案（加密存储）
  securityAnswerAttempts  Int       @default(0)
  securityAnswerLockedAt  DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  // 关联数据
  categories       Category[]
  todos            Todo[]
  recurrenceRules  RecurrenceRule[]
  apiKeys          ApiKey[]
  inboxItems       InboxItem[]
}

// 任务分类
model Category {
  id          String   @id @default(cuid())
  name        String
  description String?
  emoji       String?
  color       String?
  userId      String   // 用户级数据隔离
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  todos       Todo[]

  @@unique([name, userId])
}

// 任务等级（固定三级：高、中、低）
model Level {
  id          String   @id @default(cuid())
  name        String   @unique
  value       Int      @unique // 高=3，中=2，低=1
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

  // 时间维度（精确到秒，支持提醒功能）
  startDate   DateTime  // 开始时间
  dueDate     DateTime  // 截止时间
  completedAt DateTime? // 完成时间

  // 多步骤任务 - 使用 JSON 存储
  subTasks    String?  // JSON: [{id, text, isDone}]

  // 周期任务
  isCycleTask Boolean  @default(false)
  recurrenceRuleId String?
  recurrenceRule   RecurrenceRule? @relation(fields: [recurrenceRuleId], references: [id])
  parentRuleId String? // 关联的周期规则ID

  // 关联
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  levelId     String?
  level       Level? @relation(fields: [levelId], references: [id])
  userId      String
  user        User   @relation(fields: [userId], references: [id])

  // 元数据
  priority    Int      @default(0)
  isMilestone Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 提醒关联
  reminders Reminder[]
}

// 周期规则
model RecurrenceRule {
  id        String   @id @default(cuid())
  frequency String   // DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
  interval  Int      @default(1)
  byDay     String?  // JSON: [0,1,2,3,4,5,6]
  cronExpr  String?
  startDate DateTime
  endDate   DateTime?
  isActive  Boolean  @default(true)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  todos     Todo[]
}

// 节假日缓存
model Holiday {
  id        String   @id @default(cuid())
  date      String   @unique // YYYY-MM-DD
  name      String
  isHoliday Boolean  // true=休息日, false=调休
  year      Int
  createdAt DateTime @default(now())
}

// API 密钥
model ApiKey {
  id          String    @id @default(cuid())
  name        String
  key         String    @unique // 加密存储
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())
  lastUsedAt  DateTime?
  expiresAt   DateTime?
}

// 任务提醒
model Reminder {
  id        String   @id @default(cuid())
  todoId    String
  todo      Todo     @relation(fields: [todoId], references: [id])
  remindAt  DateTime
  type      String   // "before_due", "custom"
  offset    Int?     // 提前分钟数
  sent      Boolean  @default(false)
  createdAt DateTime @default(now())
}

// 捕获箱条目
model InboxItem {
  id               String    @id @default(cuid())
  content          String    // 捕获的文本内容
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt        DateTime  @default(now())
  convertedToTodoId String?  // 若已转化为任务，记录目标任务 ID
  convertedAt      DateTime? // 转化时间

  @@index([userId, createdAt])
  @@index([userId, convertedToTodoId])
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

### 5.0 根 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api` | 健康检查 |

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
| PUT | `/api/todos/:id/subtask` | 更新子任务 |
| POST | `/api/todos/batch` | 批量操作（删除、状态切换） |
| POST | `/api/todos/toggle` | 切换任务完成状态 |
| GET | `/api/todos/filter` | 按分类/等级筛选任务 |

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
| GET | `/api/holidays?action=preload` | 预加载下一年数据 |
| GET | `/api/holidays?action=refresh&year=YYYY` | 强制刷新指定年份 |

### 5.6 API 密钥 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/api-keys` | 获取所有 API 密钥 |
| POST | `/api/api-keys` | 创建 API 密钥 |
| DELETE | `/api/api-keys/:id` | 撤销 API 密钥 |

### 5.7 数据导出 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/export/todos?format=json\|csv` | 导出任务数据 |
| GET | `/api/export/backup` | 完整数据备份 |

### 5.8 增量同步 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/sync?since=ISO8601` | 获取增量数据 |

### 5.9 提醒 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/reminders/pending` | 获取待发送提醒 |
| DELETE | `/api/reminders/:id` | 删除提醒 |
| PUT | `/api/reminders/:id/sent` | 标记提醒已发送 |
| GET | `/api/todos/:id/reminders` | 获取任务提醒 |
| POST | `/api/todos/:id/reminders` | 创建提醒 |

### 5.10 管理员 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/admin/check` | 检查管理员权限 |
| GET | `/api/admin/holidays` | 获取节假日缓存状态 |
| POST | `/api/admin/holidays` | 刷新/预加载节假日数据 |

### 5.11 捕获箱 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/inbox` | 获取未转化条目列表 |
| POST | `/api/inbox` | 创建新捕获条目 |
| GET | `/api/inbox/count` | 获取未处理条目数（用于侧边栏徽章） |
| PUT | `/api/inbox/:id` | 更新条目内容 |
| DELETE | `/api/inbox/:id` | 删除条目 |
| POST | `/api/inbox/:id/convert` | 转化为正式任务 |

### 5.5 认证 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/[...nextauth]` | NextAuth.js 认证端点 |
| GET | `/api/auth/session` | 获取当前会话信息 |
| POST | `/api/auth/signout` | 用户登出 |
| PUT | `/api/auth/change-password` | 修改密码 |
| POST | `/api/auth/forgot-password` | 忘记密码（获取密保问题） |
| POST | `/api/auth/reset-password` | 重置密码 |
| GET | `/api/auth/security-question` | 获取密保问题状态 |
| PUT | `/api/auth/security-question` | 设置/更新密保问题 |
| DELETE | `/api/auth/security-question` | 删除密保问题 |

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
  password  String   // PBKDF2 加密存储
  name      String?  // 显示名称
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 安全相关字段
  securityQuestion        String?   // 密保问题
  securityAnswer          String?   // 密保答案（加密存储）
  securityAnswerAttempts  Int?      // 错误尝试次数
  securityAnswerLockedAt  DateTime? // 锁定时间

  // 关联数据
  categories       Category[]
  todos            Todo[]
  recurrenceRules  RecurrenceRule[]
  apiKeys          ApiKey[]
}
```

### 6.3 数据隔离策略

| 数据类型 | 隔离级别 | 说明 |
|----------|----------|------|
| 任务 (Todo) | 用户级 | 每个用户只能访问自己的任务 |
| 分类 (Category) | 用户级 | 每个用户有独立的分类数据 |
| 等级 (Level) | 系统级 | 所有用户共享固定三级等级 |
| 节假日 (Holiday) | 系统级 | 所有用户共享节假日数据 |

### 6.4 密码安全功能

| 功能 | 描述 |
|------|------|
| 修改密码 | 需验证当前密码，新密码至少6位 |
| 密保问题 | 支持预设问题或自定义问题，答案加密存储 |
| 忘记密码 | 通过密保问题验证身份后重置密码 |
| 错误锁定 | 密保问题连续错误5次后锁定15分钟 |

### 6.5 API 权限验证

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

### 6.6 会话管理

- **JWT 策略**：使用 JWT 存储会话信息，无需服务器端会话存储
- **有效期**：默认 7 天，选择"记住我"延长至 30 天
- **刷新机制**：Token 过期前自动刷新

### 6.7 路由保护

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
- 拖拽任务跨天移动（使用 dnd-kit，自动更新 dueDate）
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

### 7.6 历史待办视图 (Overdue View)

**展示**：所有过期未完成任务

**功能**：
- 显示 dueDate 早于今天且未完成的任务
- 点击任务跳转到对应 dueDate 的日视图
- 支持批量操作

### 7.7 任务列表视图 (Task List View)

**展示**：按分类或等级筛选的任务列表

**功能**：
- 从设置页面点击分类/等级的任务数量进入
- 支持年份切换
- 显示任务统计（总数、完成数、待办数）

---

## 8. 国际化架构

### 8.1 技术方案

使用 `next-intl` 实现国际化：
- 路由结构：`/[locale]/...` 动态路由
- 支持语言：中文 (zh)、英文 (en)
- 翻译文件：`messages/zh.json`、`messages/en.json`

### 8.2 中间件配置

```typescript
// src/middleware.ts
export default middleware;

export const config = {
  matcher: ['/', '/(zh|en)/:path*']
};
```

### 8.3 使用方式

```tsx
// 组件中使用翻译
import { useTranslations } from 'next-intl';

const t = useTranslations('nav');
console.log(t('today')); // "今天" 或 "Today"
```

---

## 9. 周期任务同步机制

### 9.1 同步触发时机

当调用以下 API 时，执行周期任务同步：
- `/api/todos/daily`
- `/api/todos/weekly`
- `/api/todos/monthly`

### 9.2 同步逻辑

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

## 10. 节假日数据获取方案

### 10.1 数据来源

使用开源 API 获取中国法定节假日：
- **主源**: [timor.tech](http://timor.tech/api/holiday) 免费节假日API
- **备源**: 本地缓存 + 手动配置补充

### 10.2 缓存策略

1. 首次访问时从 API 拉取当年数据
2. 存入 PostgreSQL 数据库
3. 后续请求直接读缓存
4. 跨年时自动拉取新年数据

---

## 11. 性能优化策略

### 11.1 数据加载

| 视图 | 策略 |
|------|------|
| 年度视图 | 仅请求统计数据（日期 + 完成数），不返回完整任务对象 |
| 月视图 | 按月懒加载，切换月份时请求 |
| 周视图 | 预加载前后各一周数据 |

### 11.2 缓存策略

使用 TanStack Query 的缓存机制：
- 任务数据：5分钟过期
- 分类/等级：30分钟过期
- 节假日：1天过期

---

## 12. UI/UX 规范

### 12.1 配色方案

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

### 12.2 动画

- 任务添加/删除：Fade + Slide
- 状态切换：Scale + Color transition
- 视图切换：Cross-fade

### 12.3 响应式断点

| 断点 | 布局 |
|------|------|
| < 640px | 单列布局，底部导航 |
| 640px - 1024px | 侧边栏折叠 |
| > 1024px | 完整侧边栏 + 主内容区 |

---

## 13. 开发阶段规划

详见 `TODO_PLAN.md`

---

## 14. 乐观更新架构设计

### 14.1 设计决策

**选择乐观更新的原因**：
- 任务切换是高频操作，等待服务器响应会影响用户体验
- 任务状态切换的成功率极高（>99%），乐观假设合理
- TanStack Query 提供了完善的乐观更新支持

**适用场景**：
- ✅ 任务状态切换（toggle）
- ✅ 子任务状态切换
- ❌ 删除操作（风险高，等待服务器确认）
- ❌ 批量操作（影响范围大）

### 14.2 实现模式

```typescript
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => { /* API 调用 */ },

    // 1. 立即更新 UI
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['todos'] });
      // 递归更新缓存中的任务状态
      return { previousData };
    },

    // 2. 失败时回滚
    onError: (err, id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    // 3. 最终同步服务器状态
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

### 14.3 已知风险与应对措施

| 风险 | 可能性 | 影响 | 当前状态 | 应对措施 |
|------|--------|------|----------|----------|
| 竞态条件（快速点击） | 中 | 高 | ⚠️ 部分 | 已有 `cancelQueries`，需加 mutation 取消 |
| 多设备同时编辑 | 低 | 中 | ❌ 未处理 | 需要版本号校验（后端配合） |
| 网络错误导致回滚失败 | 低 | 高 | ✅ 已处理 | 有完整的 previousData 回滚 |
| 缓存更新遗漏 | 低 | 中 | ⚠️ 部分 | 递归遍历所有查询，可能误伤 |
| 请求成功但被误判失败 | 低 | 高 | ✅ 已处理 | onSettled 总是会 invalidate |

### 14.4 改进优先级

1. **高优先级**：添加 mutation 取消，防止快速点击竞态
2. **中优先级**：精确缓存更新，只更新相关查询
3. **低优先级**：版本号校验（需要后端配合）

### 14.5 未来优化方向

```typescript
// 方案 1：请求去重
const mutation = useMutation({
  mutationFn: async (id) => {
    // 使用 AbortController 取消之前的请求
    if (abortController) abortController.abort();
    abortController = new AbortController();
    return fetch('/api/todos/toggle', { signal: abortController.signal });
  }
});

// 方案 2：版本号校验
interface Todo {
  id: string;
  status: string;
  version: number;  // 每次更新 +1
}
// 服务端检查版本，冲突返回 409

// 方案 3：操作限频
const throttledToggle = throttle(toggleMutation.mutate, 300);
```

---

## 15. 风险评估清单

### 15.1 乐观更新相关

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否处理了竞态条件？ | ⚠️ | 有 cancelQueries，缺少 mutation 取消 |
| 是否有完整的回滚逻辑？ | ✅ | previousData 保存完整 |
| 是否区分了错误类型？ | ❌ | 统一 toast 提示 |
| 是否限制了操作频率？ | ❌ | 无 throttle/debounce |
| 是否更新了架构文档？ | ✅ | 本文档 |

### 15.2 API 调用相关

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否处理了网络错误？ | ✅ | onError 回调 |
| 是否处理了服务器错误？ | ✅ | result.success 判断 |
| 是否处理了认证过期？ | ✅ | NextAuth 自动处理 |
| 是否有请求超时处理？ | ❌ | 使用默认超时 |

### 15.3 数据一致性相关

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 是否有数据版本控制？ | ❌ | 无 version 字段 |
| 是否有冲突检测机制？ | ❌ | 无乐观锁 |
| 是否有数据校验？ | ✅ | Zod schema 验证 |

---

## 16. Cloudflare Pages 部署架构

### 16.1 技术方案

| 组件 | 技术 |
|------|------|
| 运行环境 | Cloudflare Workers (Edge Runtime) |
| 数据库 | Cloudflare D1 (SQLite) |
| 构建工具 | @cloudflare/next-on-pages |

### 16.2 Edge Runtime 适配

所有 API 路由和页面都添加了 `export const runtime = 'edge'`，确保兼容 Cloudflare Workers 环境。

### 16.3 D1 数据库连接

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export async function getDb() {
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：本地 SQLite
    return new PrismaClient();
  }
  
  // 生产环境：D1 binding
  const { env } = await import('cloudflare:workers');
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}
```

### 16.4 密码加密适配

Cloudflare Workers 不支持 Node.js `crypto` 模块，改用 Web Crypto API：

```typescript
// src/lib/password.ts
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(...);
  const hash = await crypto.subtle.deriveBits(...);
  return `${base64(salt)}:${base64(hash)}`;
}
```

### 16.5 环境变量配置

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | D1 数据库连接 |
| `NEXTAUTH_SECRET` | JWT 签名密钥 |
| `ADMIN_USER_IDS` | 管理员用户 ID（逗号分隔） |

---

## 17. API Token 认证机制

### 17.1 Token 格式

```
tdl_<32位随机字符串>
```

### 17.2 认证流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 外部程序     │────▶│ Bearer Token│────▶│  验证 Token  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                           ┌───────────────────┴───────────────────┐
                           │                                       │
                           ▼                                       ▼
                    ┌─────────────┐                         ┌─────────────┐
                    │  返回数据   │                         │  401 错误   │
                    └─────────────┘                         └─────────────┘
```

### 17.3 双重认证支持

所有 CRUD API 同时支持：
- **Bearer Token**：外部程序调用
- **Session Cookie**：Web 界面调用

```typescript
export async function getApiSession(request: Request) {
  // 优先检查 Bearer Token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return validateApiToken(authHeader.slice(7));
  }
  
  // 回退到 Session
  return getAuthSession();
}
```

### 17.4 Token 权限范围

| 权限 | 说明 |
|------|------|
| 读取任务 | GET /api/todos/* |
| 创建任务 | POST /api/todos |
| 更新任务 | PUT /api/todos/:id |
| 删除任务 | DELETE /api/todos/:id |
| 导出数据 | GET /api/export/* |

---

## 18. 系统维护面板

### 18.1 权限控制

通过环境变量 `ADMIN_USER_IDS` 配置管理员：

```typescript
export async function isAdmin(): Promise<boolean> {
  const session = await getAuthSession();
  const adminIds = process.env.ADMIN_USER_IDS?.split(',') ?? [];
  return adminIds.includes(session?.user?.id);
}
```

### 18.2 功能模块

| 模块 | 功能 |
|------|------|
| 系统信息 | 版本号、运行环境、构建时间 |
| 节假日管理 | 查看缓存状态、手动刷新、预加载 |
| 缓存清理 | 清理 localStorage、React Query 缓存 |

### 18.3 节假日数据管理

**数据获取优先级**：
1. 数据库缓存
2. 外部 API (timor.tech)
3. 静态数据（兜底）

**自动预加载机制**：
- 每年 10-12 月期间，自动检查下一年数据
- 如数据不存在，从 API 获取并存入数据库
- 获取成功后跳过，避免重复请求
