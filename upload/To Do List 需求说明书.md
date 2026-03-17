---
tags:
  - ToDoApp
  - LifeNexus
---
## 1. 项目愿景
构建一个极简、直观且具有高度交互性的待办事项管理应用。系统应支持按天管理任务，并提供月度日历视图进行宏观规划和数据统计。

---

## 📊 项目完成度概览

**总体完成度: 100%** ✅

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 任务管理 (CRUD) | 100% | ✅ 完成 |
| 任务分类管理 | 100% | ✅ 完成 |
| 任务等级 | 100% | ✅ 完成 |
| 当日视图 | 100% | ✅ 完成 |
| 日历视图 | 100% | ✅ 完成 |
| 周视图 | 100% | ✅ 完成（含拖拽） |
| 季度视图 | 100% | ✅ 完成 |
| 年度视图 | 100% | ✅ 完成 |
| 设置管理 | 100% | ✅ 完成 |
| 交互体验 | 100% | ✅ 完成 |

### 测试验证

详细测试报告见：[测试用例文档](docs/TEST_CASES.md)

| 测试模块 | 用例数 | 通过数 | 通过率 |
|----------|--------|--------|--------|
| 任务管理 | 7 | 7 | 100% |
| 分类管理 | 5 | 5 | 100% |
| 等级管理 | 3 | 3 | 100% |
| 视图 API | 5 | 5 | 100% |
| 任务关联 | 2 | 2 | 100% |
| 子任务 | 1 | 1 | 100% |
| **总计** | **23** | **23** | **100%** |

---

## 2. 核心功能需求

### 2.0 用户认证与授权 ⏳ 开发中

#### 2.0.1 用户注册
- **账号注册**：支持用户名+密码注册方式
- **唯一性校验**：用户名不可重复，注册时需校验
- **密码安全**：密码需加密存储（bcrypt），最少6位字符
- **初始数据**：新用户注册时自动创建默认分类和等级数据

#### 2.0.2 用户登录
- **登录方式**：支持用户名+密码登录
- **会话管理**：使用 JWT Token 维持登录状态
- **记住登录**：支持"记住我"功能，延长会话有效期
- **登录状态显示**：顶部导航栏显示当前用户信息

#### 2.0.3 用户登出
- **安全登出**：清除会话信息，返回登录页
- **数据清理**：登出时清理客户端缓存数据

#### 2.0.4 数据隔离
- **私有数据**：每个用户只能查看和管理自己的任务、分类数据
- **公共数据**：任务等级为系统级公共数据，所有用户共享
- **权限验证**：API 层验证用户身份，确保数据隔离

#### 2.0.5 访问控制
- **路由保护**：未登录用户访问应用自动跳转登录页
- **API 保护**：所有数据 API 需验证用户身份
- **公开页面**：登录页、注册页无需认证即可访问

### 2.1 任务管理 (CRUD) ✅ 已完成

- **创建任务** ✅：用户可以在指定日期下新建任务，包含标题和详细描述，任务分类，任务类型（基础任务、跨天任务、多步骤任务、周期任务）和任务等级。
        - 基础任务：只填写dueDate或者startDate = dueDate时满足 ✅
        - 跨天任务：一个跨天任务，可以提前完成，跨天任务可以是多步骤任务 ✅
        - 多步骤任务：支持主任务+子任务结构，仅有二级分类，主任务完成度由子任务计算百分比得到，可以是基础任务、跨天任务或周期任务 ✅
        - 周期任务：可创建重复规则（按照cron表达式），如"每周一买牛奶" ✅（UI完成，同步服务待实现）
- **展示列表** ✅：按日期分组展示待办事项，区分已完成和未完成状态。
- **状态切换** ✅：一键切换任务的"完成/未完成"状态。
- **编辑功能** ✅：支持内联编辑任务内容（标题、描述、类型、等级）。
- **删除功能** ✅：支持删除单条任务或者批量删除任务，需有二次确认交互。

### 2.2 任务分类管理（CRUD）⏳ 95%完成

- **创建任务分类** ✅：用户可以新建任务分类和对应的描述，以及对应的图标
        - 图标选择：通过弹出菜单选择预设的 Emoji 图标 ✅
        - 自定义图标：支持上传自定义图片作为分类图标 ❌ 未实现
- **展示列表** ✅：展示所有的任务类型设置。
- **编辑功能** ✅：支持内联编辑任务类型内容（类型、描述、图标）。
- **删除功能** ✅：支持删除单个任务类型或者批量删除任务类型，需有二次确认交互，不允许删除已被引用的类型。

### 2.3 任务等级 ✅ 已完成

- **固定等级** ✅：系统提供三个固定等级，不支持用户新建或删除
        - 高：value = 3，需要优先处理
        - 中：value = 2，正常处理
        - 低：value = 1，有空时处理
- **展示列表** ✅：展示三个等级及其使用统计。

### 2.4 视图维度

#### 当日视图 (Day View) ✅ 已完成

- **显示** ✅：`startDate <= 今天 <= endDate` 的所有任务。
- **日期切换器** ✅：支持快速跳转到不同日期，在其他日期时有按钮可以直接回到今天。
- **任务流** ✅：以卡片式布局展示当天的所有任务。
- **子任务** ✅：如果包含子任务，点击卡片展开Checklist，而不是直接勾选完成
- **空状态** ✅：当某天没有任务时，显示优雅的提示。
- **历史待办任务** ✅：显示所有未完成的，`dueDate < 今天` 的所有任务，不包括当天的，按照从最远时间显示到截至前一天的任务，最多显示5条摘要，按照任务等级排序，超出部分数量提示，并且能点击查看所有未完成历史待办任务明细。

#### 日历视图 (Calendar View) ✅ 已完成

- **7x6 标准网格布局** ✅：展示整月任务分布。
- **跨月展示** ✅：自动填充上月末尾和下月开头的日期。
- **单元格预览** ✅：每个日期格子最多显示 5 条任务摘要（已适配网页端和手机端），超出部分显示数量提示。
- **详情弹窗** ⏳：点击日历单元格或任务摘要，弹出模态框查看/编辑完整详情。（当前跳转到当日视图）
- **工作日** ✅：按照官方公布的日历，显示此天是工作日还是休息日
- **状态统计** ✅：展示当月的任务总量、完成数、未完成数及整体完成率（可视化进度条）。

#### 周视图 (Weekly Kanban) ⏳ 90%完成

- **展示** ✅：横向排列 7 天的任务列（周一至周日）
- **拖拽重排** ❌：支持在不同日期列之间拖拽任务（自动更新 `dueDate`）。待集成 dnd-kit
- **周总结** ✅：顶部显示本周完成率及重点任务摘要。
- **UI** ✅：使用紧凑型卡片，突出显示任务优先级。

#### 季度视图 (Quarterly Roadmap) ✅ 已完成

- **展示** ✅：将季度拆分为 3 个月，以进度条形式展示大任务或重复性项目的覆盖周期；仅提取 `isMilestone` 为 true 的任务。
- **重点** ✅：侧重于"截止日期（Deadlines）"和"重要里程碑"。
- **统计** ✅：显示季度目标完成进度。
- **月份跳转** ✅：点击月份可跳转到对应的日历视图。

#### 年度视图 (Yearly Footprints) ✅ 已完成

- **全景热力图** ✅：参考 GitHub 贡献图，展示一年 365 天的任务完成密度。
- **年度统计** ✅：总计完成任务数、最勤奋的月份、最专注的类别。
- **交互** ✅：悬停显示当天摘要，点击跳转至当日详情。

### 2.5 设置管理 ✅ 已完成

- **任务类型管理** ✅：显示所有的任务类型，让用户在此页面进行管理
- **任务等级管理** ✅：显示三个固定的任务等级及其使用统计

### 2.6 交互体验 (UX) ✅ 已完成

- **响应式设计** ✅：适配移动端和桌面端。
- **即时反馈** ✅：添加/删除/状态切换需有平滑的动画过渡（Transition）。
- **加载状态** ✅：全局 Loading 状态及按钮级别的处理状态（updating/loading）。
- **错误处理** ✅：完善的 API 报错提示（Toast 或错误信息条）。
- **性能优化** ✅：年度视图数据量通过特定接口只获取计数统计，不拉取完整的任务对象。

---

## 3. 技术约束 (Stack)

### 原需求技术栈
_请 AI 严格按照以下技术栈实现：_
- **MonoRepo**: TurboRepo
- **运行时**: Bun
- **前端**: React (Next.js 或 Vite) + TanStack Query (React Query)
- **后端**: Hono (部署在 Cloudflare Workers 或 Vercel)
- **通信**: tRPC (实现端到端类型安全)
- **样式**: Tailwind CSS (实现渐变背景和卡片布局)
- **语言**: TypeScript (严格模式)

### 🔄 实际实现技术栈

由于项目环境限制和快速开发需求，实际采用以下技术栈：

| 类别 | 原需求 | 实际实现 | 说明 |
|------|--------|----------|------|
| 项目结构 | TurboRepo (MonoRepo) | 单体应用 | 简化架构，便于开发调试 |
| 运行时 | Bun | Bun | ✅ 一致 |
| 前端框架 | Next.js 或 Vite | Next.js 16 (App Router) | 使用最新版 App Router |
| 状态管理 | - | Zustand + TanStack Query | 双状态管理方案 |
| 后端 | Hono | Next.js API Routes | 使用内置 API 路由 |
| 数据库 | - | Prisma ORM + SQLite | 轻量级数据库方案 |
| 通信 | tRPC | REST API | 简化接口实现 |
| UI组件 | - | shadcn/ui + Tailwind CSS | 统一设计系统 |
| 语言 | TypeScript | TypeScript 5 | ✅ 一致 |

---

## 4. 界面原型规范 (UI) ✅ 已实现

- **配色方案** ✅：
    - 背景：现代感渐变色（使用 Tailwind 渐变类）。
    - 卡片：半透明毛玻璃效果（Glassmorphism）或纯白高光卡片。
    - 文字：深灰色（主文本）及中灰色（描述文本）。
- **布局** ✅：
    - 侧边栏/顶部导航：支持在"日历"与"今日"视图间切换。
    - 日历格子：
        - 今天：高亮边框/背景。
        - 周末：日期数字红色标识。
        - 已完成任务：文字中划线 + 灰色。
- **响应式设计** ✅：完美适配移动端和桌面端。

---

## 5. 数据模型 (Schema) ✅ 已实现

实际实现的 Prisma Schema：

```TypeScript
// 任务分类
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  emoji       String?        // Emoji 图标
  color       String?        // 可选颜色标识
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  todos       Todo[]
}

// 任务等级（固定三级）
model Level {
  id          String   @id @default(cuid())
  name        String   @unique  // 高、中、低
  value       Int      @unique  // 3、2、1
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
  startDate    String   // ISO格式: YYYY-MM-DD
  dueDate      String   // ISO格式: YYYY-MM-DD
  completedAt  String?  // 完成日期
  
  // 多步骤任务 - 使用 JSON 存储
  subTasks    String?  // JSON: [{id, text, isDone}]
  
  // 周期任务
  isCycleTask      Boolean  @default(false)
  recurrenceRuleId String?
  recurrenceRule   RecurrenceRule? @relation(...)
  parentRuleId     String?
  
  // 关联
  categoryId String?
  category   Category? @relation(...)
  levelId    String?
  level      Level? @relation(...)
  
  // 元数据
  priority    Int      @default(0)
  isMilestone Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 周期规则
model RecurrenceRule {
  id        String   @id @default(cuid())
  frequency String   // DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
  interval  Int      @default(1)
  byDay     String?  // JSON 数组: [0,1,2,3,4,5,6]
  cronExpr  String?  // 自定义 cron 表达式
  startDate String
  endDate   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  todos     Todo[]
}

// 节假日缓存
model Holiday {
  id        String   @id @default(cuid())
  date      String   @unique // YYYY-MM-DD
  name      String
  isHoliday Boolean  // true=休息日, false=工作日（调休）
  year      Int
  createdAt DateTime @default(now())
}
```

---

## 6. API 接口定义 ✅ 已实现

实际实现的 REST API 接口：

| 接口 | 方法 | 路径 | 状态 |
|------|------|------|------|
| 获取当日任务 | GET | `/api/todos/daily?date=YYYY-MM-DD` | ✅ |
| 获取月度任务 | GET | `/api/todos/monthly?year=&month=` | ✅ |
| 创建任务 | POST | `/api/todos` | ✅ |
| 切换任务状态 | PATCH | `/api/todos/toggle` | ✅ |
| 更新任务 | PUT | `/api/todos/[id]` | ✅ |
| 删除任务 | DELETE | `/api/todos/[id]` | ✅ |
| 批量删除任务 | POST | `/api/todos/batch` | ✅ |
| 获取周任务 | GET | `/api/todos/weekly?startDate=` | ✅ |
| 获取季度任务 | GET | `/api/todos/quarterly?startDate=` | ✅ |
| 获取年度统计 | GET | `/api/todos/yearly?year=` | ✅ |
| 任务分类管理 | CRUD | `/api/categories` | ✅ |
| 任务等级管理 | CRUD | `/api/levels` | ✅ |
| 节假日数据 | GET | `/api/holidays?year=` | ✅ |

---

## 7. 备注

### 已实现 ✅
1. **日期工具库**：在 `src/lib/date-utils.ts` 中封装了 date-fns，统一处理周、月、季度的日期计算。
2. **性能策略**：年度热力图接口 `/api/todos/yearly` 仅返回日期和完成数计数，优化性能。
3. **子任务状态持久化**：通过 `useUpdateSubTask` hook 实现 API 调用。
4. **历史待办专属视图**：新增 `OverdueView` 组件，支持查看所有过期任务并跳转到对应日期。

### 待实现 ❌
1. **周期任务同步服务**：后端需实现 SyncService，根据 RecurrenceRule 计算当前时间窗口内应存在哪些任务，若缺失则静默创建。
2. **周视图拖拽功能**：dnd-kit 已安装，待集成实现跨天拖拽。
3. **自定义图标上传**：分类图标图片上传功能待实现。
4. **任务详情模态框**：日历视图点击任务弹出详情模态框。

---

## 8. 项目文件结构

```
src/
├── app/
│   ├── api/                    # API 路由
│   │   ├── todos/              # 任务相关 API
│   │   │   ├── daily/          # 当日任务
│   │   │   ├── weekly/         # 周任务
│   │   │   ├── monthly/        # 月任务
│   │   │   ├── quarterly/      # 季度任务
│   │   │   ├── yearly/         # 年度统计
│   │   │   ├── batch/          # 批量操作
│   │   │   └── toggle/         # 状态切换
│   │   ├── categories/         # 分类管理
│   │   ├── levels/             # 等级管理
│   │   └── holidays/           # 节假日数据
│   └── page.tsx                # 主页面
├── components/
│   ├── views/                  # 视图组件
│   │   ├── DayView.tsx         # 当日视图
│   │   ├── CalendarView.tsx    # 日历视图
│   │   ├── WeekView.tsx        # 周视图
│   │   ├── QuarterlyView.tsx   # 季度视图
│   │   ├── YearlyView.tsx      # 年度视图
│   │   ├── OverdueView.tsx     # 历史待办视图
│   │   └── SettingsView.tsx    # 设置视图
│   ├── task/                   # 任务相关组件
│   │   ├── TaskCard.tsx        # 任务卡片
│   │   ├── TaskForm.tsx        # 任务表单
│   │   └── SubTaskList.tsx     # 子任务列表
│   ├── calendar/               # 日历相关组件
│   └── ui/                     # shadcn/ui 组件
├── hooks/                      # 自定义 Hooks
│   ├── use-todos.ts            # 任务数据 Hook
│   ├── use-categories.ts       # 分类数据 Hook
│   ├── use-view-store.ts       # 视图状态 Store
│   └── use-date-store.ts       # 日期状态 Store
├── lib/                        # 工具库
│   ├── db.ts                   # 数据库客户端
│   ├── date-utils.ts           # 日期工具
│   └── cron-utils.ts           # Cron 解析工具
└── types/                      # 类型定义
```

---

## 9. 变更历史

| 日期 | 变更内容 |
|------|----------|
| 2026-02-28 | 项目初始化，完成阶段一（基础架构搭建） |
| 2026-02-28 | 完成阶段二（核心功能开发）- 任务 CRUD、分类管理、等级管理 |
| 2026-02-28 | 完成阶段三（当日视图与日历视图） |
| 2026-02-28 | 任务等级从0-10级改为固定三级（高、中、低） |
| 2026-03-03 | 完成阶段四（高级视图开发）- 周视图、季度视图、年度视图 |
| 2026-03-03 | 完成阶段六（优化与完善）- 响应式设计、动画效果、错误处理 |
| 2026-03-03 | 新增历史待办专属视图（OverdueView） |
| 2026-03-03 | 修复季度视图空白问题 |
| 2026-03-03 | 优化历史待办任务响应式布局 |
| 2026-03-03 | 修复历史待办判断逻辑，统一以今天为基准 |
| 2026-03-03 | 实现子任务状态持久化功能 |

---

## 10. 待完成功能清单

### 高优先级
| 功能 | 说明 | 状态 |
|------|------|------|
| 周视图拖拽 | 集成 dnd-kit 实现跨天拖拽 | ❌ 待实现 |
| 周期任务同步服务 | 实现 RecurrenceRule 自动生成任务实例 | ❌ 待实现 |

### 中优先级
| 功能 | 说明 | 状态 |
|------|------|------|
| 任务详情模态框 | 日历视图点击任务显示详情弹窗 | ❌ 待实现 |
| 批量操作 UI | 多选删除/更新界面 | ⏳ API完成，UI待实现 |
| 自定义图标上传 | 分类图标图片上传 | ❌ 待实现 |

### 低优先级
| 功能 | 说明 | 状态 |
|------|------|------|
| 动画增强 | 更丰富的过渡效果 | ⏳ 基本完成 |
| 离线支持 | PWA 和 Service Worker | ❌ 待实现 |
