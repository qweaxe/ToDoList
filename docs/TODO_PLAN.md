# LifeNexus - 开发计划

## 开发阶段总览

项目分为 **6 个阶段**，每个阶段完成后需要确认再进入下一阶段。

---

## 阶段一：基础架构搭建 ✅

**目标**：搭建项目基础架构，确保数据层和基础布局可用

### 任务列表

| ID | 任务 | 状态 |
|----|------|------|
| 1.1 | 数据库模型定义 | ✅ 完成 |
| 1.2 | 数据库初始化 | ✅ 完成 |
| 1.3 | 类型定义 | ✅ 完成 |
| 1.4 | 日期工具库 | ✅ 完成 |
| 1.5 | 基础布局组件 | ✅ 完成 |
| 1.6 | 全局状态 Store | ✅ 完成 |
| 1.7 | 默认数据种子 | ✅ 完成 |

### 交付物
- ✅ 可运行的空白应用框架
- ✅ 完整的数据库结构
- ✅ 基础布局和导航

---

## 阶段二：核心功能开发 ✅

**目标**：实现任务的增删改查和分类/等级管理

### 任务列表

| ID | 任务 | 状态 |
|----|------|------|
| 2.1 | 任务分类 API | ✅ 完成 |
| 2.2 | 任务等级 API | ✅ 完成 |
| 2.3 | 任务基础 API | ✅ 完成 |
| 2.4 | TanStack Query 配置 | ✅ 完成 |
| 2.5 | 任务表单组件 | ✅ 完成 |
| 2.6 | 任务卡片组件 | ✅ 完成 |
| 2.7 | 分类管理页面 | ✅ 完成 |
| 2.8 | 等级管理页面 | ✅ 完成 |

### 交付物
- ✅ 完整的任务 CRUD 功能
- ✅ 分类和等级管理功能
- ✅ 基础任务列表展示

### 修改记录
- 2026-02-28: Emoji 图标选择器改为弹窗选择+自定义上传
- 2026-02-28: 任务等级从0-10级改为固定三级（高、中、低）

---

## 阶段三：当日视图与日历视图 ✅

**目标**：实现核心的日程查看功能

### 任务列表

| ID | 任务 | 状态 |
|----|------|------|
| 3.1 | 当日视图 API | ✅ 完成 |
| 3.2 | 当日视图组件 | ✅ 完成 |
| 3.3 | 历史待办组件 | ✅ 完成 |
| 3.4 | 日期选择器 | ✅ 完成 |
| 3.5 | 月度任务 API | ✅ 完成 |
| 3.6 | 日历网格组件 | ✅ 完成 |
| 3.7 | 日历单元格组件 | ✅ 完成 |
| 3.8 | 月度统计组件 | ✅ 完成 |

### 交付物
- ✅ 可用的当日视图
- ✅ 可用的日历视图
- ✅ 日期切换功能

---

## 阶段四：高级视图开发 ✅

**目标**：实现周视图、季度视图和年度视图

### 任务列表

| ID | 任务 | 状态 |
|----|------|------|
| 4.1 | 周视图 API | ✅ 完成 |
| 4.2 | 周看板组件 | ✅ 完成 |
| 4.3 | 拖拽功能 | ✅ 完成（dnd-kit 已集成） |
| 4.4 | 周总结组件 | ✅ 完成 |
| 4.5 | 季度视图 API | ✅ 完成 |
| 4.6 | 季度路线图组件 | ✅ 完成 |
| 4.7 | 年度统计 API | ✅ 完成 |
| 4.8 | 年度热力图组件 | ✅ 完成 |

### 交付物
- ✅ 可用的周视图（含拖拽功能）
- ✅ 可用的季度视图
- ✅ 可用的年度热力图

### 修改记录
- 2026-03-03: 季度视图添加错误处理和空状态显示，修复月份点击跳转日历功能
- 2026-03-14: 实现周视图拖拽功能（集成 dnd-kit，支持跨天拖拽任务）

---

## 阶段五：高级功能开发 ✅

**目标**：实现周期任务、节假日、批量操作等高级功能

### 任务列表

| ID | 任务 | 状态 |
|----|------|------|
| 5.1 | Cron 工具库 | ✅ 已完成（阶段一） |
| 5.2 | 周期任务创建 UI | ✅ 已完成（阶段二） |
| 5.3 | 周期任务同步服务 | ✅ 已完成 |
| 5.4 | 节假日服务 | ✅ 已完成（阶段三） |
| 5.5 | 日历节假日标记 | ✅ 已完成（阶段三） |
| 5.6 | 批量删除 API | ✅ 已完成（阶段二） |
| 5.7 | 批量操作 UI | ⏳ 部分完成（API已就绪，UI待完善） |
| 5.8 | 任务详情模态框 | ✅ 已完成 |
| 5.9 | 子任务状态持久化 | ✅ 已完成 |

### 交付物
- ✅ 完整的周期任务功能（同步服务已实现）
- ✅ 节假日显示功能
- ⏳ 批量操作功能（API完成，UI待完善）
- ✅ 子任务状态持久化
- ✅ 任务详情模态框

### 修改记录
- 2026-03-14: 实现周期任务同步服务（recurrence-service.ts）
- 2026-03-14: 实现任务详情模态框（TaskDetailDialog.tsx）

---

## 阶段六：优化与完善 ✅

**目标**：优化用户体验，完善交互细节

### 任务列表

| ID | 任务 | 状态 |
|----|------|------|
| 6.1 | 添加动画效果 | ✅ 完成（基本过渡动画） |
| 6.2 | 加载状态优化 | ✅ 完成（Skeleton组件） |
| 6.3 | 错误处理完善 | ✅ 完成（Toast提示） |
| 6.4 | 响应式适配 | ✅ 完成（移动端/桌面端适配） |
| 6.5 | 子任务功能 | ✅ 已完成（阶段二） |
| 6.6 | 任务完成度计算 | ✅ 已完成（阶段二） |
| 6.7 | 空状态设计 | ✅ 完成 |
| 6.8 | 性能优化 | ✅ 完成（年度视图使用计数统计） |

### 交付物
- ✅ 流畅的过渡动画
- ✅ 完善的响应式设计
- ✅ 优雅的用户体验

---

## 🆕 新增功能（计划外）

| 功能 | 状态 | 说明 |
|------|------|------|
| 历史待办专属视图 | ✅ 完成 | OverdueView 组件，支持查看所有过期任务并跳转 |
| 任务完成日期编辑 | ✅ 完成 | 支持修改任务的完成日期 |
| 自定义图标上传 | ✅ 完成 | 分类图标上传功能（EmojiPicker 支持图片上传） |

---

## 开发进度追踪

| 阶段 | 状态 | 完成日期 |
|------|------|----------|
| 阶段一：基础架构搭建 | ✅ 已完成 | 2026-02-28 |
| 阶段二：核心功能开发 | ✅ 已完成 | 2026-02-28 |
| 阶段三：当日视图与日历视图 | ✅ 已完成 | 2026-02-28 |
| 阶段四：高级视图开发 | ✅ 已完成 | 2026-03-14 |
| 阶段五：高级功能开发 | ✅ 已完成 | 2026-03-14 |
| 阶段六：优化与完善 | ✅ 已完成 | 2026-03-03 |
| 阶段七：代码审查与安全加固 | 🚧 进行中 | - |

---

## 当前问题记录

### 2026-02-28: Turbopack 持久化缓存损坏 ✅ 已解决

**问题描述**：
- Next.js 开发服务器的 Turbopack 持久化存储损坏
- 表现为 "attempt to write a readonly database" 错误
- 即使数据库权限正确，Turbopack 内部缓存无法写入

**验证结果**：
- ✅ Prisma 在 Node.js 环境中工作正常
- ✅ 数据库文件权限正确 (666)
- ✅ 数据库目录权限正确 (777)
- ❌ Turbopack SST 文件无法写入

**解决方案**：
- 清除 `.next` 目录后重启服务
- React Query 缓存配置优化：staleTime 设为 0，启用 refetchOnWindowFocus

---

### 2026-03-03: 历史待办显示问题 ✅ 已解决

**问题描述**：
- 历史待办任务卡片布局在移动端溢出
- 红色边框未能正确包裹所有内容
- "查看更多"按钮消失

**解决方案**：
- 优化 DayView.tsx 历史待办区域的响应式布局
- 新增 OverdueView.tsx 历史待办专属视图
- TaskCard compact 模式增加分类和等级标签显示

---

### 2026-03-03: 季度视图空白问题 ✅ 已解决

**问题描述**：
- 点击季度视图页面显示空白

**解决方案**：
- 添加错误处理和加载状态显示
- 添加数据为空时的提示
- 修复月份点击跳转日历的逻辑

---

## 待完成功能清单

### 高优先级
| 功能 | 说明 | 状态 |
|------|------|------|
| 周视图拖拽 | 集成 dnd-kit 实现跨天拖拽 | ✅ 已完成 |
| 子任务状态持久化 | TaskCard 子任务切换调用 API | ✅ 已完成 |
| 周期任务同步服务 | 实现 RecurrenceRule 自动生成 | ✅ 已完成 |

### 中优先级
| 功能 | 说明 | 状态 |
|------|------|------|
| 任务详情模态框 | 日历视图点击任务显示详情 | ✅ 已完成 |
| 批量操作 UI | 多选删除/更新界面 | ✅ 已完成 |
| 自定义图标上传 | 分类图标图片上传 | ✅ 已完成 |

### 低优先级
| 功能 | 说明 | 状态 |
|------|------|------|
| 动画增强 | 更丰富的过渡效果 | ⏳ 基本完成 |
| 离线支持 | PWA 和 Service Worker | ❌ 待实现 |

---

## 项目完成度统计

| 模块 | 完成度 |
|------|--------|
| 阶段一：基础架构 | 100% |
| 阶段二：核心功能 | 100% |
| 阶段三：当日/日历视图 | 100% |
| 阶段四：高级视图 | 100% |
| 阶段五：高级功能 | 100% |
| 阶段六：优化完善 | 100% |
| 阶段七：安全加固 | 0% (15项待完成) |

**总体功能完成度: 100%**
**安全加固进度: 0%**

---

## 状态说明
- ⏳ 待开始
- 🚧 进行中
- ✅ 已完成
- ❌ 已阻塞/未完成

---

## 变更历史

| 日期 | 变更内容 |
|------|----------|
| 2026-02-28 | 完成阶段一、二、三 |
| 2026-03-03 | 完成阶段四（除拖拽）、阶段六 |
| 2026-03-03 | 新增历史待办专属视图（OverdueView） |
| 2026-03-03 | 修复季度视图空白问题 |
| 2026-03-03 | 优化历史待办任务响应式布局 |
| 2026-03-03 | 修复历史待办判断逻辑，统一以今天为基准 |
| 2026-03-03 | 实现子任务状态持久化功能（useUpdateSubTask hook） |
| 2026-03-14 | 实现周视图拖拽功能（集成 dnd-kit） |
| 2026-03-14 | 实现周期任务同步服务（recurrence-service.ts） |
| 2026-03-14 | 实现任务详情模态框（TaskDetailDialog.tsx） |
| 2026-03-14 | 项目总体完成度达到 ~98% |
| 2026-06-01 | 修复 TaskDetailDialog 导入错误 |
| 2026-06-01 | 实现批量操作 UI（多选模式、工具栏、全选/反选） |
| 2026-06-01 | 确认自定义图标上传功能已完成 |
| 2026-06-01 | 项目总体完成度达到 100% |
| 2026-03-13 | 启动阶段七：代码审查与安全加固 |
| 2026-03-13 | 完成全面代码安全审查，发现 15 项优化点 |
| 2026-03-13 | 识别出 4 个严重安全问题（P0）和 3 个中危问题（P1） |

---

## 阶段五：详细实现记录

### 5.3 周期任务同步服务 ✅ 已完成

**目标**：根据 RecurrenceRule 自动生成周期任务实例

**实现文件**：`src/services/recurrence-service.ts`

**技术方案**：
1. ✅ 创建 `src/services/recurrence-service.ts`
2. ✅ 在 `todo.getDaily` 和 `todo.getWeekly` 中调用同步服务
3. ✅ 根据 cron 表达式计算应该生成的任务实例
4. ✅ 支持以下周期类型：
   - 每日
   - 每周（指定星期几）
   - 每月
   - 自定义 cron 表达式

**数据模型**（已有）：
```prisma
model RecurrenceRule {
  id        String   @id @default(cuid())
  frequency String   // daily, weekly, monthly, custom
  interval  Int      @default(1)
  byDay     String?  // JSON array: ["MON", "WED", "FRI"]
  cronExpr  String?  // 自定义 cron 表达式
  startDate String
  endDate   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  todos     Todo[]
}
```

---

### 5.7 批量操作 UI ✅ 已完成

**已完成**：
- ✅ 批量删除 API (`/api/todos/batch`)
- ✅ 批量更新 API
- ✅ 多选模式 UI (`use-batch-selection.ts` hook)
- ✅ 批量操作工具栏 (`BatchActionsToolbar.tsx`)
- ✅ 全选/反选功能
- ✅ 批量标记完成
- ✅ 批量修改分类/等级/日期

**实现文件**：
- `src/hooks/use-batch-selection.ts` - 批量选择状态管理
- `src/components/task/BatchActionsToolbar.tsx` - 批量操作工具栏
- `src/components/task/TaskCard.tsx` - 添加选择模式支持
- `src/components/views/DayView.tsx` - 集成批量操作功能

---

### 5.8 任务详情模态框 ✅ 已完成

**目标**：点击任务弹出详情模态框，支持编辑和查看

**实现文件**：`src/components/task/TaskDetailDialog.tsx`

**组件结构**：
```
src/components/task/
├── TaskDetailDialog.tsx  # 任务详情弹窗
└── TaskCard.tsx          # 现有组件，点击打开弹窗功能
```

**功能清单**：
- ✅ 显示任务完整信息
- ✅ 内联编辑标题、描述
- ✅ 修改日期、等级、分类
- ✅ 子任务管理
- ✅ 关联周期规则

---

## 阶段四：拖拽功能详细设计 ✅ 已完成

### 4.3 周视图拖拽功能

**技术方案**：使用 @dnd-kit/core

**实现文件**：`src/components/views/WeekView.tsx`

**实现步骤**：
1. ✅ 安装依赖
   ```bash
   bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. ✅ 创建拖拽上下文
   ```tsx
   // WeekView.tsx
   import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
   
   <DndContext
     onDragEnd={handleDragEnd}
     collisionDetection={closestCorners}
   >
     {/* 周视图内容 */}
   </DndContext>
   ```

3. ✅ 处理拖拽结束事件
   - 支持跨列拖拽
   - 移动端触摸支持
   - 视觉反馈（拖拽时的样式变化）

---

## 阶段七：代码审查与安全加固 🚧

**目标**：提升代码质量、修复安全隐患、优化性能

**审查日期**：2026-03-13

### 安全隐患发现

#### 严重 (P0)

| 问题 | 位置 | 风险等级 | 状态 |
|------|------|---------|------|
| 缺少身份验证和授权 | 所有 API 路由 | 🔴 严重 | ❌ 待修复 |
| TypeScript 构建错误被忽略 | `next.config.ts:11` | 🔴 严重 | ❌ 待修复 |
| React Strict Mode 被禁用 | `next.config.ts:14` | 🔴 严重 | ❌ 待修复 |
| 图片域名白名单过于宽松 | `next.config.ts:18-23` | 🟠 高危 | ❌ 待修复 |

**问题详情**：

1. **身份验证缺失**
   - 所有 API 端点未实现身份验证
   - 任何人都可以访问和操作所有数据
   - 没有用户隔离机制
   - 建议：集成 NextAuth.js 或 Supabase Auth

2. **TypeScript 配置问题**
   ```typescript
   // next.config.ts
   typescript: {
     ignoreBuildErrors: true, // ⚠️ 危险配置
   }
   ```
   - 类型安全失效
   - 可能隐藏严重 bug
   - 建议：移除此配置，修复所有 TypeScript 错误

3. **图片域名白名单**
   ```typescript
   remotePatterns: [{
     protocol: 'https',
     hostname: '**', // ⚠️ 允许任何域名
   }]
   ```
   - 可能导致 SSRF 攻击
   - 建议：限制为特定 CDN 域名

#### 中危 (P1)

| 问题 | 位置 | 风险等级 | 状态 |
|------|------|---------|------|
| 控制台日志泄露信息 | `src/app/api/todos/[id]/route.ts:52-57` | 🟡 中危 | ❌ 待修复 |
| 缺少请求速率限制 | 所有 API 路由 | 🟡 中危 | ❌ 待修复 |
| CORS 配置缺失 | API 路由 | 🟡 中危 | ❌ 待修复 |

**问题详情**：

1. **调试日志未清理**
   ```typescript
   console.log('Request body:', JSON.stringify(body, null, 2));
   console.log('Validated data:', JSON.stringify(validated, null, 2));
   ```
   - 生产环境可能泄露用户数据
   - 建议：仅在开发环境启用

2. **速率限制缺失**
   - 容易受到 DDoS 攻击
   - 建议：添加速率限制中间件

### 已做好的安全措施 ✅

| 措施 | 说明 |
|------|------|
| 输入验证 | 使用 Zod schema 进行严格验证 |
| SQL 注入防护 | 使用 Prisma ORM，自动防止注入 |
| XSS 防护 | React 自动转义，无滥用 `dangerouslySetInnerHTML` |
| 环境变量保护 | `.env.local` 已在 `.gitignore` 中 |
| 数据库连接池 | Prisma Client 使用单例模式 |
| 数据完整性 | 使用唯一约束和外键约束 |

### 性能优化建议

#### 数据库优化

| 优化项 | 当前状态 | 建议 | 优先级 |
|--------|---------|------|--------|
| 数据库索引 | ✅ 已有基础索引 | 添加复合索引 `[startDate, dueDate]` | P1 |
| N+1 查询 | ✅ 已使用 `include` 预加载 | 保持现状 | - |
| 分页功能 | ❌ 缺失 | 添加分页（page/limit 参数） | P1 |
| 过期任务限制 | ✅ 已限制 100 条 | 保持现状 | - |

**建议添加的 Prisma 索引**：
```prisma
model Todo {
  // ...
  @@index([startDate, dueDate])
  @@index([status, dueDate])
}
```

#### 缓存策略

| 缓存类型 | 目标数据 | 实现方案 | 优先级 |
|---------|---------|---------|--------|
| 静态数据缓存 | 分类、等级 | Next.js `revalidate` | P2 |
| API 响应缓存 | 日历数据 | Redis / Next.js Cache | P2 |
| 前端查询缓存 | TanStack Query | 配置 `staleTime`, `cacheTime` | P3 |

**建议实现**：
```typescript
// API 路由中添加
export const revalidate = 60; // 60秒缓存

// TanStack Query 配置
const { data } = useQuery({
  queryKey: ['categories'],
  queryFn: fetchCategories,
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000, // 10分钟
});
```

#### API 分页实现

**问题位置**：`src/app/api/todos/route.ts`

**建议实现**：
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const [todos, total] = await Promise.all([
    db.todo.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [/* ... */],
      include: {/* ... */},
    }),
    db.todo.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: todos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

### 代码质量改进

#### 类型安全增强

**问题**：使用了宽泛的类型定义
```typescript
// 当前实现
const updateData: Record<string, unknown> = {};

// 建议改为
import { Prisma } from '@prisma/client';
const updateData: Prisma.TodoUpdateInput = {};
```

#### 统一错误处理

**建议创建**：`src/lib/api-error.ts`
```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}
```

#### 环境变量验证

**建议创建**：`src/lib/env.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

#### Transaction 保证数据一致性

**问题位置**：`src/app/api/todos/route.ts:106-142`

**当前实现**：
```typescript
// 两步操作，可能不一致
const rule = await db.recurrenceRule.create({ /* ... */ });
const todo = await db.todo.create({ /* ... */ });
```

**建议改为**：
```typescript
const result = await db.$transaction(async (tx) => {
  const rule = await tx.recurrenceRule.create({
    data: { /* ... */ },
  });

  const todo = await tx.todo.create({
    data: {
      /* ... */
      recurrenceRuleId: rule.id,
    },
    include: { category: true, level: true, recurrenceRule: true },
  });

  return todo;
});
```

### 任务清单

#### 立即修复 (P0)

| ID | 任务 | 预计工作量 | 状态 |
|----|------|-----------|------|
| 7.1 | 添加身份验证和授权机制 | 2-3天 | ❌ 待开始 |
| 7.2 | 移除 `ignoreBuildErrors: true` | 1-2天 | ❌ 待开始 |
| 7.3 | 限制图片域名白名单 | 30分钟 | ❌ 待开始 |
| 7.4 | 启用 React Strict Mode | 1天 | ❌ 待开始 |

#### 高优先级 (P1)

| ID | 任务 | 预计工作量 | 状态 |
|----|------|-----------|------|
| 7.5 | 移除生产环境调试日志 | 1小时 | ❌ 待开始 |
| 7.6 | 添加 API 速率限制 | 4小时 | ❌ 待开始 |
| 7.7 | 为列表 API 添加分页 | 4小时 | ❌ 待开始 |
| 7.8 | 添加数据库复合索引 | 1小时 | ❌ 待开始 |

#### 中优先级 (P2)

| ID | 任务 | 预计工作量 | 状态 |
|----|------|-----------|------|
| 7.9 | 实现缓存策略 | 1天 | ❌ 待开始 |
| 7.10 | 统一错误处理 | 4小时 | ❌ 待开始 |
| 7.11 | 环境变量验证 | 2小时 | ❌ 待开始 |
| 7.12 | 使用 Transaction 保证一致性 | 3小时 | ❌ 待开始 |

#### 低优先级 (P3)

| ID | 任务 | 预计工作量 | 状态 |
|----|------|-----------|------|
| 7.13 | 提取重复代码 | 1天 | ❌ 待开始 |
| 7.14 | 增强类型安全 | 1天 | ❌ 待开始 |
| 7.15 | 添加 CORS 配置 | 1小时 | ❌ 待开始 |

### 修改记录

| 日期 | 变更内容 |
|------|----------|
| 2026-03-13 | 完成代码安全审查 |
| 2026-03-13 | 发现 4 个严重安全问题、3 个中危问题 |
| 2026-03-13 | 提出 15 项优化建议 |
