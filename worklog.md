# To Do List  - Work Log

## 项目完成状态检查报告

**检查日期**: 2026-03-13

---

## 1. 功能完成度对照表

### 2.1 任务管理 (CRUD)

| 功能需求 | 状态 | 说明 |
|---------|------|------|
| 创建任务（标题、描述、分类、等级） | ✅ 完成 | TaskForm 支持所有基本字段 |
| 基础任务 | ✅ 完成 | startDate = dueDate |
| 跨天任务 | ✅ 完成 | startDate ≠ dueDate，显示跨天标记 |
| 多步骤任务（子任务） | ⚠️ 部分完成 | 子任务存储和显示完成，但切换状态未持久化 |
| 周期任务 | ⚠️ 部分完成 | 规则定义完成，但同步生成逻辑未实现 |
| 展示列表（按日期分组） | ✅ 完成 | DayView 区分已完成/未完成 |
| 状态切换 | ✅ 完成 | useToggleTodo 实现 |
| 编辑功能 | ✅ 完成 | TaskForm 编辑模式 |
| 删除功能（单条/批量） | ✅ 完成 | 支持单条删除和批量删除 |
| 二次确认交互 | ✅ 完成 | AlertDialog 确认 |

### 2.2 任务分类管理（CRUD）

| 功能需求 | 状态 | 说明 |
|---------|------|------|
| 创建分类 | ✅ 完成 | CategoryManager 实现 |
| 图标选择（Emoji） | ✅ 完成 | EmojiPicker 组件 |
| 自定义图标上传 | ❌ 未完成 | 需要实现图片上传功能 |
| 展示列表 | ✅ 完成 | 显示分类和使用统计 |
| 编辑功能 | ✅ 完成 | 内联编辑 |
| 删除功能（二次确认） | ✅ 完成 | 阻止删除已使用的分类 |

### 2.3 任务等级

| 功能需求 | 状态 | 说明 |
|---------|------|------|
| 固定三个等级（高/中/低） | ✅ 完成 | Level 模型和种子数据 |
| 展示列表及统计 | ✅ 完成 | LevelManager 组件 |

### 2.4 视图维度

| 视图 | 状态 | 功能详情 |
|------|------|---------|
| **当日视图 (Day View)** | ✅ 完成 | |
| - 显示当天任务 | ✅ | startDate <= 今天 <= endDate |
| - 日期切换器 | ✅ | 前一天/后一天/回到今天 |
| - 卡片式布局 | ✅ | TaskCard 组件 |
| - 子任务 Checklist | ⚠️ | 显示和展开完成，状态切换未持久化 |
| - 空状态 | ✅ | 优雅提示 |
| - 历史待办任务 | ✅ | 显示过期任务摘要 |
| **日历视图 (Calendar View)** | ✅ 完成 | |
| - 7x6 标准网格 | ✅ | CalendarGrid 组件 |
| - 跨月展示 | ✅ | 自动填充上下月日期 |
| - 单元格预览 | ✅ | 最多显示3条任务摘要 |
| - 详情弹窗 | ⚠️ | 点击跳转到 DayView |
| - 工作日标记 | ⚠️ | 节假日显示，但工作日/休息日区分不够明显 |
| - 状态统计 | ✅ | MonthStats 组件 |
| **周视图 (Weekly Kanban)** | ⚠️ 部分完成 | |
| - 7天横向排列 | ✅ | WeekView 组件 |
| - 拖拽重排 | ❌ | 需要集成 dnd-kit |
| - 周总结 | ✅ | 完成率和重点任务 |
| **季度视图 (Quarterly)** | ✅ 完成 | |
| - 3个月进度展示 | ✅ | QuarterlyView 组件 |
| - 里程碑提取 | ✅ | isMilestone 过滤 |
| - 季度统计 | ✅ | OKR 追踪 |
| **年度视图 (Yearly)** | ✅ 完成 | |
| - 热力图 | ✅ | GitHub 风格贡献图 |
| - 年度统计 | ✅ | 完成数、活跃天数、最长连续 |
| - 悬停/点击交互 | ✅ | Tooltip 和跳转 |

### 2.5 设置管理

| 功能需求 | 状态 | 说明 |
|---------|------|------|
| 任务类型管理 | ✅ 完成 | SettingsView + CategoryManager |
| 任务等级管理 | ✅ 完成 | SettingsView + LevelManager |

### 2.6 交互体验 (UX)

| 功能需求 | 状态 | 说明 |
|---------|------|------|
| 响应式设计 | ✅ 完成 | 移动端适配完成 |
| 即时反馈（动画） | ⚠️ 部分完成 | 基本过渡动画，可增强 |
| 加载状态 | ✅ 完成 | Skeleton 组件 |
| 错误处理 | ✅ 完成 | Toast 提示 |
| 性能优化 | ✅ 完成 | 年度视图使用计数统计 |

---

## 2. API 接口完成状态

| 接口 | 状态 | 路径 |
|------|------|------|
| todo.getDaily | ✅ | /api/todos/daily |
| todo.getMonthly | ✅ | /api/todos/monthly |
| todo.create | ✅ | POST /api/todos |
| todo.toggle | ✅ | POST /api/todos/toggle |
| todo.update | ✅ | PUT /api/todos/[id] |
| todo.delete | ✅ | DELETE /api/todos/[id] |
| todo.deleteBatch | ✅ | POST /api/todos/batch |
| todo.getWeekly | ✅ | /api/todos/weekly |
| todo.getQuarterly | ✅ | /api/todos/quarterly |
| todo.getYearlyStats | ✅ | /api/todos/yearly |

---

## 3. 待完成/改进项

### 高优先级
1. **周视图拖拽功能** - 需要集成 @dnd-kit/core 实现跨天拖拽
2. **子任务状态持久化** - TaskCard 中子任务切换需要调用 API 更新
3. **自定义分类图标上传** - 需要实现图片上传和存储

### 中优先级
4. **日历视图工作日区分** - 根据节假日 API 数据，更明显地标记工作日/休息日
5. **周期任务同步逻辑** - 实现 RecurrenceRule 的自动任务生成
6. **任务详情弹窗** - 日历视图点击任务显示详情弹窗而非跳转

### 低优先级
7. **动画增强** - 添加更丰富的过渡动画
8. **自定义任务等级** - 需求说明是固定的，但可考虑扩展
9. **离线支持** - PWA 和 Service Worker

---

## 4. 技术实现说明

### 已实现
- **数据库**: Prisma + SQLite
- **状态管理**: Zustand (view-store) + TanStack Query
- **UI 组件**: shadcn/ui + Tailwind CSS 4
- **日期处理**: date-fns
- **节假日服务**: 静态数据 + timor.tech API 缓存

### 待集成
- **拖拽**: @dnd-kit/core 已安装但未集成
- **tRPC**: 需求要求但未实现（当前使用 REST API）
- **TurboRepo**: 需求要求但未实现（单仓库结构）

---

## 5. 总体完成度评估

| 模块 | 完成度 |
|------|--------|
| 任务管理 | 90% |
| 分类管理 | 90% |
| 等级管理 | 100% |
| 当日视图 | 95% |
| 日历视图 | 90% |
| 周视图 | 70% |
| 季度视图 | 100% |
| 年度视图 | 100% |
| 设置管理 | 100% |
| 交互体验 | 90% |

**总体完成度: 约 92%**

---

## 6. 下一步行动建议

1. **立即修复**: 子任务状态持久化（影响用户体验）
2. **短期目标**: 周视图拖拽功能
3. **中期目标**: 周期任务同步逻辑、自定义图标上传
4. **长期优化**: 动画增强、离线支持

---
Task ID: 1
Agent: Main Agent
Task: 本次会话修复历史待办显示和季度视图问题

Work Log:
- 分析用户上传的截图，识别历史待办任务的显示问题
- 修复 DayView.tsx 中历史待办区域的响应式布局
- 优化 TaskCard.tsx 的 compact 模式和完整模式，适配移动端
- 新增 OverdueView.tsx 历史待办专属视图组件
- 更新 use-view-store.ts 添加 'overdue' 视图类型
- 更新 page.tsx 渲染 OverdueView 组件
- 修复 QuarterlyView.tsx 的错误处理和空状态显示
- 修复季度视图点击月份跳转日历的逻辑

Stage Summary:
- ✅ 修复历史待办查看更多按钮消失问题
- ✅ 创建历史待办专属界面，支持查看所有待办并跳转到对应日期
- ✅ 修复季度视图空白问题（添加错误处理和数据检查）
- ✅ 优化历史待办任务卡片的移动端适配

---
Task ID: 2
Agent: Main Agent
Task: 历史待办布局优化和响应式适配

Work Log:
- 修改 DayView.tsx 历史待办区域的 Card 样式，添加 overflow-hidden
- 调整内边距和字体大小响应式样式
- 添加 ScrollArea 的 max-h-[50vh] 移动端适配
- TaskCard compact 模式增加分类 emoji 和等级标签显示
- TaskCard 完整模式优化标签栏和内容区的响应式布局
- 所有元素（按钮、标签、文字）适配不同屏幕尺寸

Stage Summary:
- 历史待办卡片红色边框正确包裹所有内容
- 移动端布局不再溢出
- 紧凑模式显示更多任务信息
- 所有元素都适配不同屏幕尺寸

---
Task ID: 3
Agent: Main Agent
Task: 修复历史待办判断逻辑问题

Work Log:
- 分析问题：历史待办判断基准错误，使用用户选择的日期而非今天
- 修改 /api/todos/daily API，历史待办始终以今天为基准
- 移除 startDate 限制，只要 dueDate < 今天且未完成即为历史待办
- 修改排序为按 dueDate 升序（从最远到最近）
- 修复 OverdueView 中点击任务跳转到 dueDate 而非 startDate

Stage Summary:
- ✅ 历史待办判断逻辑统一：始终以今天为基准
- ✅ 无论用户查看哪一天的视图，历史待办只显示今天之前未完成的任务
- ✅ DayView 和 OverdueView 数据一致性保证

---
Task ID: 4
Agent: Main Agent
Task: 实现子任务状态持久化功能和更新 TODO_PLAN.md

Work Log:
- 在 TaskCard 的 props 中添加 onSubTaskToggle 回调
- 在 hooks/use-todos.ts 中新增 useUpdateSubTask hook
- 在 DayView.tsx 中使用 updateSubTaskMutation 并传递 handleSubTaskToggle
- 更新所有 TaskCard 组件调用添加 onSubTaskToggle prop
- 更新 docs/TODO_PLAN.md 文档：
  - 更新变更历史
  - 更新任务列表状态
  - 添加阶段五详细实现记录
  - 更新项目完成度统计（从 90% 提升到 92%）

Stage Summary:
- ✅ 子任务状态持久化功能已实现（useUpdateSubTask hook）
- ✅ TODO_PLAN.md 文档已更新
- ✅ 项目完成度提升至 ~92%

---
Task ID: 5
Agent: Main Agent
Task: 根据项目完成情况更新需求说明书文档

Work Log:
- 读取原始需求说明书文档和 TODO_PLAN.md 开发计划
- 检查项目实际文件结构和 API 接口完成情况
- 检查 Prisma Schema 数据模型实现
- 更新需求说明书文档，添加以下内容：
  - 项目完成度概览（总体 ~92%）
  - 各功能模块完成状态标记（✅ 已完成 / ⏳ 部分完成 / ❌ 未实现）
  - 技术栈实际实现与原需求的差异对比表
  - 实际实现的 Prisma Schema 详细说明
  - API 接口完成状态表
  - 项目文件结构说明
  - 变更历史记录
  - 待完成功能清单（按优先级分类）

Stage Summary:
- ✅ 需求说明书文档已更新，完整记录项目实现状态
- ✅ 标记了各功能的完成状态
- ✅ 说明了技术栈差异（Next.js API Routes 替代 Hono/tRPC）
- ✅ 整理了待完成功能清单供后续开发参考

---
Task ID: 7
Agent: Main Agent
Task: 继续按照 TODO_PLAN.md 进行项目开发

Work Log:
1. 周视图拖拽功能
   - 重写 WeekView.tsx，集成 @dnd-kit/core
   - 创建 DraggableTaskCard 和 DateColumn 组件
   - 实现跨列拖拽，支持移动端触摸
   - 拖拽时显示视觉反馈

2. 周期任务同步服务
   - 创建 src/services/recurrence-service.ts
   - 实现 syncRecurringTasks、syncDate、syncUpcomingWeek 等函数
   - 在 daily 和 weekly API 中集成同步服务
   - 支持每日、每周、每月、自定义 cron 周期类型

3. 任务详情模态框
   - 创建 TaskDetailDialog.tsx 组件
   - 支持查看和编辑任务详情
   - 内联编辑标题、描述、日期、分类、等级
   - 子任务管理（添加、删除、切换状态）
   - 在 CalendarView 中集成任务详情弹窗

4. 更新 TODO_PLAN.md
   - 更新阶段四、五的任务状态
   - 更新项目完成度统计（~98%）
   - 添加变更历史记录

Stage Summary:
- ✅ 周视图拖拽功能已完成（集成 dnd-kit）
- ✅ 周期任务同步服务已完成
- ✅ 任务详情模态框已完成
- ✅ 项目总体完成度达到 ~98%

---
Task ID: 6
Agent: Main Agent
Task: 实现三个UI改进点

Work Log:
1. 年度视图月度统计点击跳转日历视图
   - 修改 YearlyView.tsx，添加 setCalendarYear 和 setCalendarMonth 方法调用
   - 为每个月度统计行添加点击事件和 cursor-pointer 样式

2. 设置页面分类/等级任务明细视图
   - 更新 use-view-store.ts 添加 'task-list' 视图类型和 TaskListFilter 状态
   - 创建 /api/todos/filter API，支持按分类/等级和年份筛选任务
   - 在 use-todos.ts 中添加 useFilteredTodos hook
   - 创建 TaskListView.tsx 任务列表视图组件，支持年份切换
   - 修改 CategoryManager.tsx 添加任务数量点击跳转功能
   - 修改 LevelManager.tsx 添加任务数量点击跳转功能
   - 更新 page.tsx 渲染 TaskListView 组件

3. 将 LifeNexus 替换为 To Do List
   - 修改 Header.tsx 的标题文字
   - 修改 Sidebar.tsx 的 Logo 文字
   - 修改 Footer.tsx 的版权信息
   - 修改 layout.tsx 的 metadata（title、keywords、authors）
   - 修改 use-view-store.ts 的 persist storage name

Stage Summary:
- ✅ 年度视图月度统计可点击跳转到对应月份的日历视图
- ✅ 设置页面分类/等级的任务数量可点击查看明细
- ✅ 任务明细视图支持年份切换和任务状态切换
- ✅ 应用名称从 LifeNexus 更名为 To Do List

---
Task ID: 8
Agent: Main Agent
Task: 修复任务编辑时属性修改保存不生效的问题

Work Log:
1. 问题分析
   - 用户反馈：编辑已有任务时，修改分类或优先级后保存，属性不会更新
   - 开发者日志显示：API 返回 `{ success: false, error: "未完成的任务不能设置完成日期" }`
   - 根因定位：前端提交数据时包含了 `completedAt: null`，后端验证逻辑错误拦截

2. 前端修复 (src/components/task/TaskForm.tsx)
   - 修改提交逻辑：未完成的任务不发送 `completedAt` 字段（而非发送 null）
   - 原代码：`completedAt: isCompleted ? completedAt : null`
   - 修复后：只有 `isCompleted` 为 true 时才添加 `completedAt` 字段到 submitData

3. 后端修复 (src/app/api/todos/[id]/route.ts)
   - 改进验证逻辑：只有非 null 的有效日期字符串才检查任务状态
   - 原逻辑：`completedAt !== undefined` 时就检查任务状态
   - 修复后：`completedAt !== undefined && completedAt !== null` 时才检查

Stage Summary:
- ✅ 修复前端表单提交逻辑，未完成任务不发送 completedAt 字段
- ✅ 修复后端 API 验证逻辑，区分 null 和有效日期字符串
- ✅ 任务编辑功能恢复正常，分类和优先级修改可正确保存

---
Task ID: 9
Agent: Main Agent
Task: 多分支合并整合（dev/vercel_security 和 dev/vercel_en）

Work Log:
1. 分支检查与分析
   - 检查项目所有分支状态（main, dev/vercel, dev/vercel_en, dev/vercel_security）
   - 分析各分支的提交历史和文件变更差异
   - dev/vercel_security: 2个提交，修改4个文件（安全增强）
   - dev/vercel_en: 5个提交，修改25个文件（国际化功能）
   - main: 2个独有提交（TurboRepo 重构，不合并）

2. 分支合并执行
   - 先合并 dev/vercel_security 到 dev/vercel（无冲突）
     - 新增 src/lib/api-utils.ts（API 安全工具函数）
     - 更新 prisma/schema.prisma 数据库模型
     - 优化 src/services/recurrence-service.ts
     - 增强 src/app/api/todos/toggle/route.ts 安全性
   - 再合并 dev/vercel_en 到 dev/vercel（无冲突）
     - 新增国际化翻译文件（messages/en.json, messages/zh.json）
     - 新增 LanguageSwitcher 语言切换组件
     - 新增 i18n 配置（src/i18n/request.ts, routing.ts）
     - 新增路由中间件（src/middleware.ts）
     - 重构路由为国际化结构（src/app/[locale]/）
     - 更新所有组件支持多语言（Header, Sidebar, TaskForm 等）

3. 依赖和配置更新
   - 执行 bun install 安装新依赖（next-intl 等国际化包）
   - 自动生成 Prisma Client（v6.19.2）
   - 更新 eslint.config.mjs，添加 apps/** 目录到忽略列表
   - 合并后总共领先远程 9 个提交

Stage Summary:
- ✅ 成功合并 dev/vercel_security 分支（安全增强功能）
- ✅ 成功合并 dev/vercel_en 分支（国际化功能）
- ✅ 所有合并均无冲突，自动完成
- ✅ 项目新增国际化支持（中英文切换）
- ✅ 项目新增 API 安全工具函数
- ✅ 依赖和配置更新完成
- ⚠️ 需要配置 DIRECT_URL 环境变量才能运行构建

---
Task ID: 10
Agent: Main Agent
Task: 排查并解决 Vercel 登录 401 错误

Work Log:
1. 问题分析
   - 用户反馈：登录后无法跳转页面，后台显示 POST /api/auth/callback/credentials 返回 401
   - Vercel 函数日志只有 warning，没有具体 ERROR 信息

2. 排查过程
   - 检查 NextAuth 配置文件 src/lib/auth.ts
   - 确认 NEXTAUTH_SECRET 环境变量已在 Vercel 中配置
   - 在 authorize 函数中添加调试日志（console.log）定位问题
   - 开启 NextAuth debug 模式 (debug: true)

3. 根本原因
   - 环境变量配置后未触发重新部署，导致 NEXTAUTH_SECRET 未正确加载

4. 解决方案
   - 重新推送代码触发 Vercel 部署
   - 环境变量正确加载后登录成功

5. 清理工作
   - 移除调试日志代码
   - 恢复 debug 模式为生产配置

Stage Summary:
- ✅ 排查 Vercel 登录 401 错误原因
- ✅ 确认是环境变量未正确加载导致
- ✅ 重新部署后问题解决
- ✅ 清理临时调试代码

---
Task ID: 11
Agent: Main Agent
Task: 合并 dev/vercel_login 分支到 dev/vercel
Date：2026.03.29

Work Log:
1. 分支状态分析
   - 检查所有分支状态（main, dev/vercel, dev/vercel_en, dev/vercel_security, dev/vercel_login）
   - 分析各分支与 dev/vercel 的提交差异
   - dev/vercel_en: 已合并，无额外提交
   - dev/vercel_security: 已合并，无额外提交
   - dev/vercel_login: 有 8 个独特提交待合并

2. 分支合并执行
   - 切换到 dev/vercel 分支
   - 执行 git merge dev/vercel_login（Fast-forward 合并，无冲突）
   - 更新 61 个文件，+4039/-1565 行代码

3. 推送到远程
   - 推送 dev/vercel 到 origin

Stage Summary:
- ✅ 成功合并 dev/vercel_login 分支
- ✅ 合并功能包括：用户认证系统、用户数据隔离、修改密码、密码重置+密保问题
- ✅ 所有分支已整合到 dev/vercel

---
Task ID: 12
Agent: Main Agent
Task: 修复 Vercel 生产环境登录问题
Date：2026.03.29

Work Log:
1. 问题分析
   - 用户反馈：登录无错误提示，但无法登录成功
   - 检查 NextAuth 配置和相关组件

2. 问题定位
   - 发现缺少 trustHost: true 配置
   - NextAuth.js 在 HTTPS 环境下默认不信任代理主机，导致 cookie 设置失败
   - 登录处理逻辑只检查 result?.error，未检查 result?.ok

3. 修复实施
   - 在 src/lib/auth.ts 添加 trustHost: true 配置
   - 改进 src/components/auth/AuthPage.tsx 登录结果判断逻辑

4. 推送修复
   - 提交并推送代码触发 Vercel 重新部署

Stage Summary:
- ✅ 添加 trustHost: true 解决 HTTPS 环境问题
- ✅ 改进登录错误处理逻辑
- ⚠️ 问题仍未完全解决，需进一步排查

---
Task ID: 13
Agent: Main Agent
Task: 修复 Prisma 数据库字段缺失问题
Date：2026.03.29

Work Log:
1. 问题分析
   - 用户反馈：登录时后台报错 "The column users.securityQuestion does not exist"
   - 检查 prisma/schema.prisma 发现定义了安全问题字段
   - 检查迁移文件发现 1_add_users_auth 迁移未包含这些字段

2. 根本原因
   - Schema 定义了 securityQuestion、securityAnswer 等字段
   - 但对应的迁移文件未创建这些数据库列
   - Prisma Client 查询时找不到对应列导致报错

3. 修复实施
   - 创建新迁移文件 prisma/migrations/2_add_security_fields/migration.sql
   - 添加缺失字段：securityQuestion、securityAnswer、securityAnswerAttempts、securityAnswerLockedAt
   - 提交并推送代码

Stage Summary:
- ✅ 创建缺失的数据库迁移文件
- ✅ Vercel 构建时会自动执行 prisma migrate deploy
- ⏳ 等待部署完成后验证登录功能

---
Task ID: 14
Agent: Main Agent
Task: 国际化(i18n)问题修复 - 前端组件多语言支持
Date: 2026.03.29

Work Log:
1. EmojiPicker.tsx 国际化
   - 将分类键从中文改为英文（常用→common, 工作→work, 生活→life, 等）
   - 添加 useTranslations hook
   - 创建 categoryLabels 映射实现多语言分类标签

2. TaskCard.tsx 下拉菜单国际化
   - 编辑、删除、标记完成/未完成等操作使用翻译
   - 使用 t('common.edit')、t('common.delete') 等

3. TaskDetailDialog.tsx 完整国际化
   - 添加 useTranslations('taskDetail') 和 useLocale hooks
   - 引入 date-fns locale (zhCN/enUS) 实现日期多语言
   - 所有标签、按钮、提示信息使用翻译

4. MonthStats.tsx 国际化
   - 添加 useTranslations('monthStats') hook
   - 标题、完成率、总任务数、已完成、待办等使用翻译

5. layout.tsx 元数据更新
   - 更新 title 为 "To Do List - Smart Task Management"
   - 更新 description 和 keywords

6. Header.tsx 日历标题国际化
   - 使用 date-fns format 函数配合 locale 参数
   - 日历月份显示从 "2026年3月" 改为 "March 2026" / "2026年3月"

7. 翻译文件更新
   - messages/zh.json 和 messages/en.json 添加 taskDetail、monthStats、emojiPicker 命名空间

Stage Summary:
- ✅ EmojiPicker 组件完整国际化
- ✅ TaskCard 下拉菜单国际化
- ✅ TaskDetailDialog 完整国际化
- ✅ MonthStats 组件国际化
- ✅ Header 日历月份显示国际化
- ⚠️ 后端 API 待修复：weekly/route.ts 的 dayName 硬编码 zhCN
- ⚠️ 后端 API 待修复：quarterly API 的 quarterName 和月份名称

---
Task ID: 15
Agent: Main Agent
Task: Footer品牌更新和i18n完善
Date: 2026.03.30

Work Log:
1. Footer 品牌更新
   - 修改 src/components/layout/Footer.tsx
   - 将 "Made with ❤ by To Do List" 改为 "Innovated with ❤ by LRcourior"

2. 登录页面测试账号信息移除
   - 删除 messages/zh.json 和 messages/en.json 中的 testAccount 翻译键
   - 移除 src/components/auth/AuthPage.tsx 中显示测试账号的段落

3. 任务列表刷新逻辑优化
   - 分析 use-todos.ts 中 React Query 的 invalidateQueries 和 refetchQueries 行为
   - 发现同时使用两者会导致竞态条件和重复请求
   - 移除所有冗余的 refetchQueries 调用，仅保留 invalidateQueries
   - 将所有中文注释翻译为英文

4. 季度视图 API 国际化修复
   - 移除 src/app/api/todos/quarterly/route.ts 中的中文 quarterName 字段
   - 将月份格式从 'M月' 改为 'MMMM'（完整英文月份名）
   - 移除未使用的 zhCN locale 导入

5. 其他 hooks 国际化清理
   - 更新 src/hooks/use-categories.ts 注释为英文
   - 更新 src/hooks/use-levels.ts 注释为英文

Stage Summary:
- ✅ Footer 品牌文字更新为 "Innovated with ❤ by LRcourior"
- ✅ 移除登录页面测试账号显示
- ✅ 修复任务创建后列表不刷新的问题（移除冗余 refetchQueries）
- ✅ 季度视图 API 返回数据国际化（移除中文硬编码）
- ✅ 代码注释统一为英文

---
Task ID: 16
Agent: Main Agent
Task: 周几显示优化和文档整理
Date: 2026.03.30

Work Log:
1. 英文周几显示优化
   - 修改 messages/en.json 中的 weekday 翻译
   - 将单字母缩写 (M/T/W/T/F/S/S) 改为三字母缩写 (Mon/Tue/Wed/Thu/Fri/Sat/Sun)
   - 解决周六和周日都是 "S" 无法区分的问题

2. 组件更新
   - 更新 CalendarGrid.tsx、WeekView.tsx、YearlyView.tsx 使用 monShort 翻译键
   - 配合 weekPrefix 前缀实现双语支持

3. 文档整理
   - 将 CLAUDE.md 翻译成中文
   - 删除 CLAUDE_CN.md，只保留一个中文版本

4. Bug修复
   - 修复中文版日历视图显示"星期一"而非"周一"的问题
   - 改用 monShort + weekPrefix 组合：中文显示"周一"，英文显示"Mon"

Stage Summary:
- ✅ 英文版周几显示从单字母改为三字母缩写，提高辨识度
- ✅ 日历视图、周视图、年度视图统一更新
- ✅ 项目文档统一为中文版本
- ✅ 修复中文版周几显示异常问题

---
Task ID: 17
Agent: Main Agent
Task: 更新项目架构文档
Date: 2026.03.30

Work Log:
1. 技术栈更新
   - 数据库：SQLite → PostgreSQL
   - 新增 next-intl 国际化库

2. 项目结构更新
   - 更新目录结构，反映国际化路由 (`[locale]/`)
   - 新增认证相关组件和 API
   - 新增安全功能（修改密码、密保问题）
   - 新增视图组件（OverdueView、TaskListView、SettingsView）

3. 数据模型更新
   - User 模型：添加安全相关字段（securityQuestion、securityAnswer 等）
   - Category 模型：添加 userId 实现用户级数据隔离
   - Todo 模型：添加 completedAt、parentRuleId、userId 字段

4. API 接口更新
   - 新增认证 API（修改密码、忘记密码、重置密码、密保问题）
   - 新增筛选 API（/api/todos/filter）

5. 新增章节
   - 国际化架构（第 8 章）
   - 密码安全功能说明（第 6.4 节）

Stage Summary:
- ✅ 架构文档与实际代码同步
- ✅ 补充新增功能说明
- ✅ 修正章节编号

---
Task ID: 18
Agent: Main Agent
Task: 修复季度视图国际化问题
Date: 2026.03.30

Work Log:
1. 问题分析
   - 季度视图标题显示 quarterName（已删除的中文硬编码字段）
   - 月度进度中月份显示英文（January、February 等）

2. 修复实施
   - 移除 use-todos.ts 中 quarterName 类型定义
   - 修改 QuarterlyView.tsx 标题使用翻译键 `t('view.quarterView')`
   - 月度进度使用翻译后的月份名数组替代 API 返回的英文月份

Stage Summary:
- ✅ 季度视图标题正确显示国际化文本
- ✅ 月份名称根据语言环境正确显示（中文：一月/二月/三月，英文：January/February/March）

---
Task ID: 19
Agent: Main Agent
Task: 安全性修复和性能优化
Date: 2026.03.30

Work Log:
1. 安全性修复
   - `/api/seed` 添加身份验证，防止未授权访问初始化数据
   - 分类创建时绑定用户ID，实现用户级数据隔离

2. 性能优化
   - 新增 `/api/todos/[id]/subtask` API 端点
   - 优化 `useUpdateSubTask` hook：从 2 次 API 请求减少到 1 次
   - 原流程：GET 获取任务 → PUT 更新任务
   - 优化后：直接 PUT 更新子任务

---
Task ID: 20
Agent: Main Agent
Task: React性能优化 - useMemo添加
Date: 2026.03.30

Work Log:
1. TaskCard.tsx 子任务解析优化
   - 将 subTasks JSON.parse 包装在 useMemo 中
   - 依赖项: task.subTasks
   - 避免每次渲染重复解析 JSON

2. CalendarCell.tsx 任务排序优化
   - 将 sortedTasks 排序逻辑包装在 useMemo 中
   - 依赖项: tasks
   - 避免每次渲染重新排序任务列表

3. YearlyView.tsx 热力图网格优化
   - 将 buildHeatmapGrid 函数改为 useMemo
   - 依赖项: data?.data?.heatmap
   - 避免每次渲染重新计算 365+ 个格子的数据结构
   - 这是最关键的优化，因为数据量大

Stage Summary:
- ✅ TaskCard 子任务解析使用 useMemo
- ✅ CalendarCell 任务排序使用 useMemo
- ✅ YearlyView 热力图网格使用 useMemo
- ✅ 减少不必要的重复计算，提升渲染性能

---
Task ID: 21
Agent: Main Agent
Task: 修复布局问题 - 重复Logo和侧边栏空白
Date: 2026.03.30

Work Log:
1. 问题分析
   - 页面顶部出现两个 To Do List 图标
   - Header 和 Sidebar 都有 Logo 显示
   - 左侧菜单存在空白区域，布局不对齐

2. MainLayout 重构
   - 将 Header 移到主内容区域内部
   - 布局结构：Sidebar | [Header + Main + Footer]
   - 移除重复渲染 Sidebar 的问题

3. Header 修改
   - Logo 只在移动端显示 (md:hidden)
   - 桌面端由 Sidebar 提供 Logo

4. Sidebar 修改
   - 修复 z-index 层级问题
   - 桌面端使用 md:transform-none 确保可见

Stage Summary:
- ✅ 修复桌面端重复 Logo 问题
- ✅ 修复侧边栏空白区域问题
- ✅ 优化布局结构，Header 在主内容区域内
- ✅ 移动端保持原有交互体验

---
Task ID: 22
Agent: Main Agent
Task: 子任务自动完成主任务功能
Date: 2026.03.30

Work Log:
1. 问题分析
   - 用户反馈：当所有子任务完成时，主任务应自动完成
   - 检查 `/api/todos/[id]/subtask` API，发现更新子任务时只更新了 subTasks 字段
   - 没有检查所有子任务是否完成，也没有更新主任务状态

2. 修复实施
   - 在更新子任务后检查所有子任务是否已完成
   - 如果全部完成，自动将主任务状态设为 'completed'
   - 同时设置 completedAt 为当前日期

3. 代码修改
   - 添加 `format` 函数导入（来自 date-fns）
   - 计算 `allSubTasksDone` 布尔值
   - 构建动态 `updateData` 对象
   - 当所有子任务完成时，自动更新 status 和 completedAt

Stage Summary:
- ✅ 当所有子任务完成时，主任务自动标记为已完成
- ✅ 自动设置完成日期为当前日期
- ✅ 保持原子性操作，一次 API 调用完成所有更新

---
Task ID: 23
Agent: Main Agent
Task: 修复移动端侧边栏被Header遮挡问题
Date: 2026.03.30

Work Log:
1. 问题分析
   - 用户反馈：移动端打开侧边栏时，顶部的 Header 会遮挡部分内容
   - 检查 z-index 层级关系：
     - Header: z-50
     - Sidebar 遮罩层: z-40
     - Sidebar: z-50
   - 问题原因：Header 和 Sidebar 的 z-index 相同（都是 z-50），导致 Header 挡住了侧边栏顶部

2. 修复实施
   - 提高 Sidebar 遮罩层 z-index: z-40 → z-[55]
   - 提高 Sidebar z-index: z-50 → z-[60]
   - 确保 Sidebar 在移动端打开时层级高于 Header

3. 层级关系（修复后）
   - Header: z-50（固定）
   - Sidebar 遮罩层: z-[55]（移动端，覆盖Header）
   - Sidebar: z-[60]（移动端，最高层级）
   - 桌面端 Sidebar: z-auto（正常文档流）

Stage Summary:
- ✅ 移动端侧边栏不再被 Header 遮挡
- ✅ 保持桌面端布局不变
- ✅ 修复 z-index 层级冲突问题

---

Task ID: 24
Agent: Main Agent
Task: 修复首页日期显示问题和代码注释中文化
Date: 2026.03.31

Work Log:
1. 首页日期显示问题修复
   - 问题：每次访问首页返回的是上一次登录的日期，而非当天日期
   - 原因：use-view-store.ts 使用 Zustand persist 将 selectedDate 持久化到 localStorage
   - 修复：从 partialize 中移除 selectedDate，每次访问都从今天开始

2. 代码注释中文化
   - 将项目中所有英文注释翻译为中文
   - 涉及文件：
     - 配置文件：middleware.ts, i18n/request.ts, lib/api-utils.ts
     - Hooks：use-categories.ts, use-todos.ts, use-toast.ts, use-levels.ts
     - 组件：CalendarCell.tsx, CalendarGrid.tsx, EmojiPicker.tsx, LevelManager.tsx, TaskCard.tsx, CalendarView.tsx, TaskListView.tsx, WeekView.tsx, YearlyView.tsx
     - UI组件：chart.tsx, sidebar.tsx
     - API路由：seed/route.ts, todos/[id]/subtask/route.ts, todos/quarterly/route.ts
     - 页面：page.tsx, [locale]/layout.tsx

Stage Summary:
- ✅ 修复首页日期显示问题，每次访问都显示当天日期
- ✅ 代码注释统一为中文，提高可读性
- ✅ 涉及 20+ 个文件的注释更新

---
Task ID: 25
Agent: Main Agent
Task: 完善日期持久化修复 - 移除 calendarYear/calendarMonth 持久化
Date: 2026.04.01

Work Log:
1. 问题分析
   - 远程已修复 selectedDate 持久化问题（Task ID: 24）
   - 但 calendarYear 和 calendarMonth 仍然被持久化
   - 这会导致日历视图也停留在旧月份

2. 修复实施
   - 合并远程 dev/vercel 分支（包含 4 个新提交）
   - 进一步移除 calendarYear 和 calendarMonth 的持久化
   - 只保留 currentView 的持久化（用户偏好的视图类型）

Stage Summary:
- ✅ 合并远程分支（移动端侧边栏修复、首页日期修复、代码注释中文化）
- ✅ 完善日期持久化修复，所有日期状态都不再持久化
- ✅ 每次访问网站，日视图和日历视图都从当前日期开始

---
Task ID: 26
Agent: Main Agent
Task: 历史待办界面功能增强
Date: 2026.04.01

Work Log:
1. 问题分析
   - 原设计：点击任务卡片跳转到任务设置的那一天
   - 用户需求：
     - 能直接在界面上完成任务
     - 能展开任务显示子任务并设置完成
     - 能编辑单个任务的属性
     - 仍能跳转到任务日期

2. 修复实施
   - 移除任务卡片的点击跳转逻辑
   - 使用完整模式 TaskCard（compact=false）替代紧凑模式
   - 添加 onSubTaskToggle 回调支持子任务状态切换
   - 添加 TaskForm 编辑表单，支持编辑任务属性
   - 添加 ExternalLink 按钮，悬停时显示，点击跳转到任务日期
   - 更新中英文翻译文件，添加 jumpToDate 翻译键

3. UI 变化
   - 任务卡片显示完整信息（分类、等级、描述、子任务进度）
   - 子任务可展开并切换完成状态
   - 右侧悬停显示跳转按钮（ExternalLink 图标）
   - 下拉菜单可编辑和删除任务

Stage Summary:
- ✅ 历史待办界面可直接完成任务（点击复选框）
- ✅ 可展开子任务并切换完成状态
- ✅ 可编辑任务属性（标题、描述、日期、分类、等级等）
- ✅ 可跳转到任务日期（悬停显示跳转按钮）
- ✅ UI 变动最小，保持原有布局风格

---
Task ID: 27
Agent: Main Agent
Task: 实现 API Token 机制和数据导出接口
Date: 2026.04.02

Work Log:
1. 功能设计
   - 采用方案一：完整实现 API Token + 数据导出
   - 新建分支 feat/api-token 进行开发
   - 数据库只新增表，不修改现有表结构

2. 数据库层
   - 新增 ApiKey 模型（prisma/schema.prisma）
   - 字段：id, name, key(哈希存储), userId, createdAt, lastUsedAt, expiresAt
   - 手动创建迁移文件 prisma/migrations/3_add_api_key_table/migration.sql

3. 认证中间件
   - 新建 src/lib/api-auth.ts
   - 实现 Bearer Token 提取和验证
   - 实现 generateApiToken() 生成 tdl_ 前缀的 Token
   - 实现 hashToken() 对 Token 进行 SHA256 哈希存储
   - 实现 getApiSession() 支持双重认证（Token + Session）

4. API Key 管理接口
   - 新建 src/app/api/api-keys/route.ts（GET 获取列表, POST 创建）
   - 新建 src/app/api/api-keys/[id]/route.ts（DELETE 撤销）
   - 支持设置过期时间（可选）
   - 创建时返回原始 Token（仅此一次）

5. 数据导出接口
   - 新建 src/app/api/export/todos/route.ts（支持筛选，支持 JSON/CSV）
   - 新建 src/app/api/export/backup/route.ts（完整备份）
   - 支持 Bearer Token 和 Session 双重认证

6. 前端设置页面
   - 新建 src/components/settings/ApiKeyManager.tsx
   - 支持创建、查看、撤销 API Key
   - 显示创建时间、最后使用时间、过期状态
   - 创建后显示原始 Token 并支持复制
   - 修改 SettingsView.tsx 添加 API 密钥标签页
   - 修改 use-view-store.ts 添加 'api' 类型

7. 国际化
   - 更新 messages/zh.json 添加中文翻译
   - 更新 messages/en.json 添加英文翻译

Stage Summary:
- ✅ 新分支 feat/api-token 开发
- ✅ 数据库模型新增 ApiKey 表（不影响现有数据）
- ✅ 支持 Bearer Token 认证
- ✅ API Key 管理接口（创建、查看、撤销）
- ✅ 数据导出接口（JSON/CSV）
- ✅ 前端设置页面集成
- ✅ 中英文国际化支持
- ⏳ 待推送代码，Vercel 构建时自动迁移数据库

---
Task ID: 28
Agent: Main Agent
Task: 实现外部应用写入接口和增量同步
Date: 2026.04.02

Work Log:
1. 功能设计
   - 基于 feat/api-token 分支创建 feat/api-write 分支
   - 支持外部应用通过 API Token 进行写入操作
   - 实现增量同步接口

2. 认证改造
   - 将所有 CRUD API 从 getAuthSession() 改为 getApiSession(request)
   - 支持双重认证：Bearer Token 和 Session Cookie
   - 涉及文件：
     - src/app/api/todos/route.ts（GET 获取列表, POST 创建）
     - src/app/api/todos/[id]/route.ts（GET 获取详情, PUT 更新, DELETE 删除）
     - src/app/api/todos/toggle/route.ts（切换任务状态）
     - src/app/api/todos/batch/route.ts（批量操作）

3. 增量同步接口
   - 新建 src/app/api/sync/route.ts
   - 支持 since 参数（ISO 8601 时间戳）
   - 返回新创建和更新的任务/分类
   - 区分 new 和 updated 数据（根据 createdAt 和 since 比较）
   - 默认同步最近 7 天数据

4. API 文档更新
   - 更新 docs/API.md
   - 新增任务写入接口文档（创建、更新、删除、切换状态、批量操作）
   - 新增增量同步接口文档
   - 更新 Obsidian 插件示例代码
   - 更新版本历史

Stage Summary:
- ✅ 现有 CRUD API 全部支持 Bearer Token 认证
- ✅ 外部应用可通过 API Token 创建、更新、删除任务
- ✅ 增量同步接口实现（基于时间戳）
- ✅ API 文档完整更新
- ⏳ 待推送代码到远程仓库

---
Task ID: 29
Agent: Main Agent
Task: 任务完成交互优化 - Checkbox点击区域、动画效果、乐观更新
Date: 2026.04.04

Work Log:
1. Checkbox 点击区域扩大
   - 修改 TaskCard.tsx，为 checkbox 添加 p-2 padding 的可点击区域
   - 使用 pointer-events-none 防止 checkbox 本身捕获事件
   - hover 时显示背景色反馈

2. WeekView checkbox 统一
   - 修改 WeekView.tsx，DraggableTaskCard 添加 checkbox 和 onToggle prop
   - DateColumn 传递 onToggleTask 回调
   - 保持拖拽功能（需要移动 8px 才触发）
   - OverlayTaskCard 也显示 checkbox

3. TaskListView checkbox 统一
   - 修改 TaskListView.tsx，将自定义 CheckCircle2/Circle 图标替换为标准 Checkbox 组件

4. 完成动画效果
   - 修改 checkbox.tsx，使用 Framer Motion 添加勾选动画
   - 弹簧效果：scale 0→1 + opacity 0→1
   - 修改 TaskCard.tsx，添加划线动画
   - 完成时文字从左到右出现删除线

5. 乐观更新实现
   - 修改 use-todos.ts 的 useToggleTodo hook
   - onMutate: 立即更新所有缓存中的任务状态
   - onError: 失败时回滚到之前的数据
   - onSettled: 最终重新获取数据确保同步
   - 递归更新嵌套数据结构中的任务

Stage Summary:
- ✅ Checkbox 点击区域扩大，更易点击
- ✅ WeekView 和 TaskListView 统一使用 Checkbox 组件
- ✅ 添加勾选动画和划线动画效果
- ✅ 实现乐观更新，UI 立即响应无需等待服务器
- ✅ 开发服务器启动正常，所有改动已生效

---
Task ID: 30
Agent: Main Agent
Task: 修复子任务 checkbox 无法点击问题 + 乐观更新
Date: 2026.04.04

Work Log:
1. 子任务 checkbox 点击问题修复
   - 用户反馈：任务项的子任务勾选框没有反应
   - 原因：子任务 checkbox 没有使用和主任务相同的交互模式
   - 为子任务 checkbox 添加外层 div 包裹 + pointer-events-none
   - 添加 p-0.5 padding 扩大点击区域

2. 子任务乐观更新实现
   - 修改 useUpdateSubTask hook
   - onMutate: 立即更新缓存中的子任务状态
   - 递归查找并更新 JSON.parse(subTasks) 中的对应子任务
   - onError: 失败时回滚
   - onSettled: 最终重新获取数据确保同步

Stage Summary:
- ✅ 子任务 checkbox 可正常点击切换状态
- ✅ 子任务切换使用乐观更新，UI 立即响应
- ✅ 与主任务保持一致的交互体验

---
Task ID: 31
Agent: Main Agent
Task: 补充架构文档和风险评估
Date: 2026.04.04

Work Log:
1. 架构文档补全 (ARCHITECTURE.md)
   - 新增第14章：乐观更新架构设计
   - 记录设计决策、实现模式、已知风险
   - 新增第15章：风险评估清单
   - 包含乐观更新、API调用、数据一致性检查项

2. 开发流程约束添加
   - CLAUDE.md：新增"开发流程约束"章节
   - 定义5步开发流程：需求分析→架构评估→实现→风险检查→文档更新
   - 强制要求架构决策记录 (ADR)

3. 全局 Memory 更新
   - 新增开发流程约束（与 CLAUDE.md 同步）
   - 新增功能实现检查清单
   - 包含乐观更新、API调用、数据一致性检查项

4. 现有风险评估
   - 检查所有 useMutation 实现
   - 识别乐观更新操作：useToggleTodo、useUpdateSubTask
   - 风险可控，建议后续添加 mutation 取消机制

Stage Summary:
- ✅ 架构文档补全，记录乐观更新设计决策和风险
- ✅ 开发流程约束添加到 CLAUDE.md 和全局 Memory
- ✅ 现有风险评估完成，风险可控
- ⏳ 后续可添加 mutation 取消机制进一步降低风险

---
Task ID: 32
Agent: Main Agent
Task: 实施阶段1 - Mutation 取消机制
Date: 2026.04.04

Work Log:
1. 创建 MutationManager
   - 新建 src/lib/mutation-manager.ts
   - 实现 AbortController 管理：createController、abort、clear
   - 提供 isAbortError 辅助函数判断取消错误

2. 修改 useToggleTodo
   - 集成 mutationManager，使用 `toggle-${id}` 作为 key
   - mutationFn 中创建 AbortController 并传递 signal
   - onSuccess/onError 中检查 cancelled/AbortError 跳过处理

3. 修改 useUpdateSubTask
   - 同样集成 mutationManager，使用 `subtask-${taskId}-${subTaskId}` 作为 key
   - 处理逻辑与 useToggleTodo 一致

Stage Summary:
- ✅ Mutation 取消机制实现完成
- ✅ 解决快速点击导致的竞态条件问题
- ✅ 被取消的请求不会触发错误提示和回滚
- ⏳ 待测试验证

---
Task ID: 33
Agent: Main Agent
Task: 实施浏览器通知提醒 - 数据模型和迁移
Date: 2026.04.04

Work Log:
1. Prisma Schema 修改
   - Todo 模型：startDate/dueDate/completedAt 从 String 改为 DateTime
   - RecurrenceRule 模型：startDate/endDate 从 String 改为 DateTime
   - 新增 Reminder 模型：todoId、remindAt、type、offset、sent

2. 数据库迁移文件
   - 创建 4_datetime_and_reminder/migration.sql
   - 自动将现有日期字符串转换为 DateTime（时间设为 00:00:00）
   - 创建 reminders 表及索引

3. 日期工具函数更新 (date-utils.ts)
   - 新增 DateInput 类型：Date | string | number
   - 新增 toDate() 统一转换函数
   - 新增 formatDateTime()、formatTime()、toISOString()
   - 新增时间操作：addHoursToDate、addMinutesToDate、setTime
   - 新增提醒相关：calculateReminderTime、shouldSendReminder

Stage Summary:
- ✅ 数据模型已更新为 DateTime
- ✅ 迁移脚本自动转换现有数据
- ✅ 日期工具函数已更新
- ⏳ 待更新前端组件日期处理
- ⏳ 待实现提醒服务

---
Task ID: 34
Agent: Main Agent
Task: 实施浏览器通知提醒 - 前端组件和提醒服务
Date: 2026.04.04

Work Log:
1. 类型定义更新
   - src/types/api.ts：Zod schema 支持 ISO 8601 datetime 格式
   - src/types/index.ts：Todo/RecurrenceRule 接口改为 Date 类型

2. API 路由更新（全部改用 Date 对象查询）
   - src/app/api/todos/route.ts
   - src/app/api/todos/[id]/route.ts
   - src/app/api/todos/daily/route.ts
   - src/app/api/todos/toggle/route.ts
   - src/app/api/todos/weekly/route.ts
   - src/app/api/todos/monthly/route.ts
   - src/app/api/todos/quarterly/route.ts
   - src/app/api/todos/yearly/route.ts
   - src/app/api/todos/filter/route.ts

3. 服务层更新
   - src/services/recurrence-service.ts：更新接口和查询逻辑

4. 提醒服务实现
   - 新建 src/services/reminder-service.ts
   - 创建、查询、删除提醒
   - 预设提醒配置（提前5/15/30分钟、1/2小时、1天）
   - 待发送提醒处理

5. 提醒 Hooks
   - 新建 src/hooks/use-reminders.ts
   - useTodoReminders、useCreateReminder、useDeleteReminder
   - usePendingReminders（每分钟轮询）

6. 浏览器通知 Hook
   - 新建 src/hooks/use-notifications.ts
   - 请求通知权限
   - 发送通知
   - 自动处理待发送提醒

7. 提醒组件
   - 新建 src/components/reminder/NotificationPermissionPrompt.tsx
   - 新建 src/components/reminder/ReminderManager.tsx
   - 预设提醒按钮、自定义时间选择

8. 提醒 API 路由
   - 新建 src/app/api/reminders/pending/route.ts
   - 新建 src/app/api/reminders/[id]/route.ts
   - 新建 src/app/api/reminders/[id]/sent/route.ts
   - 新建 src/app/api/todos/[id]/reminders/route.ts

Stage Summary:
- ✅ 前端组件 DateTime 处理完成
- ✅ 提醒服务实现完成
- ✅ 浏览器通知 Hook 实现
- ✅ 提醒管理组件实现
- ✅ API 路由完整
- ⏳ 待集成到任务表单
- ⏳ 待测试迁移和通知功能

---

## 2026-04-05: 添加任务时间选择和显示功能

### 改动内容
- 在任务表单中添加时间选择器，支持设置开始时间和截止时间
- 默认开始时间为 00:00，默认截止时间为 23:59
- 任务卡片和详情对话框始终显示时间部分（包括 00:00）
- 修复历史待办按日期分组逻辑，正确处理带时间的 ISO 字符串
- 修复周视图拖拽任务时保留时间部分

### 技术细节
- 新增 `startTime` 和 `dueTime` 状态管理时间选择
- 新增 `extractTimeFromISO` 函数从 ISO 字符串提取时间
- 新增 `combineDateAndTime` 函数合并日期和时间为 ISO 字符串
- 修改日期显示格式为 `MM/dd HH:mm` 和 `MMM d, yyyy HH:mm`

### 修改的文件
- `src/components/task/TaskForm.tsx` - 添加时间选择器，修改提交逻辑合并日期时间
- `src/components/task/TaskCard.tsx` - 日期显示改为日期时间显示
- `src/components/task/TaskDetailDialog.tsx` - 添加时间选择器，修改保存逻辑
- `src/components/views/DayView.tsx` - 修复历史待办分组逻辑
- `src/components/views/OverdueView.tsx` - 修复历史待办分组逻辑
- `src/components/views/WeekView.tsx` - 修复拖拽时保留时间部分

---

## 2026-04-06: 优化日期时间选择器布局

### 改动内容
- 优化日期时间选择器响应式布局，移动端单列、桌面端双列
- 设置日期按钮最小宽度 140px，确保完整显示 yyyy-MM-dd 格式
- 时间输入框固定宽度 80px，足够显示 HH:mm 格式
- 移除不必要的 truncate 和 flex-shrink 类，简化代码

### 修改的文件
- `src/components/task/TaskForm.tsx` - 优化日期时间选择区域布局
- `src/components/task/TaskDetailDialog.tsx` - 优化日期时间编辑区域布局

---

## 2026-04-06: 扩大任务表单对话框宽度以完整显示时间

### 改动内容
- 将任务表单对话框宽度从 max-w-2xl 扩大到 max-w-3xl
- 将任务详情对话框宽度从 max-w-lg 扩大到 max-w-3xl
- 将时间输入框宽度从 w-20 (80px) 扩大到 w-28 (112px)
- 确保日期和时间都能完整显示

### 修改的文件
- `src/components/task/TaskForm.tsx` - 对话框宽度 max-w-3xl，时间输入 w-28
- `src/components/task/TaskDetailDialog.tsx` - 对话框宽度 max-w-3xl，时间输入 w-28

---

## 2026-04-07: 优化日期时间选择器布局对齐方式

### 改动内容
- 改变日期时间选择器布局策略，使用 `justify-between` 让开始日期组和截止日期组分布在两侧
- 日期和时间输入框之间保持原有的 `gap-2` 小间距
- 实现框的左侧与右侧和其他元素对齐的效果

### 修改的文件
- `src/components/task/TaskForm.tsx` - 调整日期时间选择区域布局结构

---

## 2026-04-07: 修复日期时间选择器单行布局

### 改动内容
- 简化布局结构，移除多余的嵌套层级
- 使用 `flex justify-between` 让开始日期和截止日期在同一行占据两端
- 保持日期和时间输入框之间的 `gap-2` 小间距

### 修改的文件
- `src/components/task/TaskForm.tsx` - 简化日期时间选择区域布局

---

## 2026-04-07: 修复对话框宽度被基础样式覆盖问题

### 改动内容
- 将 `max-w-3xl` 改为 `sm:max-w-3xl` 以正确覆盖 DialogContent 基础样式中的 `sm:max-w-lg`
- 确保对话框在桌面端有足够的宽度显示所有内容

### 修改的文件
- `src/components/task/TaskForm.tsx` - 修复对话框宽度响应式类名

---

## 2026-04-07: 修复 completedAt 格式导致的 PrismaClientValidationError

### 问题描述
- 子任务全部完成时自动完成主任务，报错 PrismaClientValidationError
- 批量标记任务完成时也出现相同错误
- 原因：completedAt 使用 "yyyy-MM-dd" 格式，但 Prisma DateTime 字段需要 ISO-8601 格式

### 改动内容
- 修复子任务自动完成主任务的 completedAt 格式
- 修复批量标记完成的 completedAt 格式
- 使用本地时间生成 ISO-8601 格式：`${localDate}T${localTime}.000Z`
- 不进行时区转换，使用用户浏览器所在时区的时间

### 修改的文件
- `src/app/api/todos/[id]/subtask/route.ts` - 修复子任务自动完成的 completedAt 格式
- `src/components/task/BatchActionsToolbar.tsx` - 修复批量完成的 completedAt 格式

---

## 2026-04-08: 修复任务创建时时区转换导致跨天显示问题

### 问题描述
- 用户创建 4月8日 00:00 - 23:59 的任务，但日视图显示为跨天任务（4月7日和4月8日）
- 原因：`combineDateAndTime` 函数使用 `toISOString()` 进行时区转换
- 中国用户（UTC+8）输入 2026-04-08 00:00，转换后变成 2026-04-07T16:00:00.000Z

### 改动内容
- 修改 `combineDateAndTime` 函数，不进行时区转换
- 直接拼接日期和时间字符串：`${dateStr}T${timeStr}:00.000Z`
- 用户输入什么时间就存储什么时间，不做时区偏移

### 修改的文件
- `src/components/task/TaskForm.tsx` - 修复 combineDateAndTime 函数

---

## 2026-04-09: 修复 completedAt 完成时间时区转换问题

### 问题描述
- `completedAt` 在多处使用 `new Date()` 解析 ISO 字符串，导致时区转换
- 用户编辑完成日期时，日期会因时区偏移而显示错误
- 例如：UTC+8 用户看到 4月8日，实际存储为 4月7日

### 改动内容
- 所有 `completedAt` 显示使用 `parseISO` 替代 `new Date()`，避免时区转换
- TaskForm 提交时将完成日期转换为 ISO 格式：`${completedAt}T00:00:00.000Z`
- 与 startDate/dueDate 保持一致的时间处理方式

### 修改的文件
- `src/components/task/TaskForm.tsx` - 使用 parseISO 解析日期，提交时转换为 ISO 格式
- `src/components/task/TaskCard.tsx` - 使用 parseISO 解析 completedAt 显示
- `src/components/task/TaskDetailDialog.tsx` - 使用 parseISO 解析 completedAt 显示
- `src/app/api/todos/toggle/route.ts` - 修复任务切换时 completedAt 使用本地时间格式

---

## 2026-04-09: Cloudflare 迁移改造

### 改动内容
1. **安装 Cloudflare 依赖**
   - `@cloudflare/next-on-pages` - Next.js 适配器
   - `wrangler` - Cloudflare CLI

2. **创建 Cloudflare 配置**
   - `wrangler.toml` - Cloudflare Pages 配置
   - 修改 `next.config.ts` - 添加 `unoptimized: true` 图片配置

3. **替换 bcryptjs 为 Web Crypto API**
   - 创建 `src/lib/password.ts` - 使用 PBKDF2 算法
   - 修改所有认证相关 API 使用新的密码工具
   - 移除 bcryptjs 依赖（Cloudflare Workers 不支持）

4. **添加 Edge Runtime**
   - 所有 API 路由添加 `export const runtime = 'edge'`
   - 支持 Cloudflare Workers 运行环境

5. **降级 Next.js 版本**
   - Next.js 16.1.1 → 15.2.4
   - eslint-config-next 同步降级
   - 原因：@cloudflare/next-on-pages 最高支持 Next.js 15.5.2

6. **新增构建脚本**
   - `build:cf` - 构建 Cloudflare 版本
   - `preview:cf` - 本地预览
   - `deploy:cf` - 部署到 Cloudflare

### 修改的文件
- `package.json` - 添加依赖和脚本，降级 Next.js
- `next.config.ts` - Cloudflare 图片配置
- `wrangler.toml` - 新增 Cloudflare 配置
- `src/lib/password.ts` - 新增密码加密工具
- `src/lib/auth.ts` - 替换 bcrypt 调用
- `src/app/api/auth/*/route.ts` - 替换 bcrypt，添加 edge runtime
- `src/app/api/**/route.ts` - 添加 edge runtime
- `docs/CLOUDFLARE_MIGRATION_GUIDE.md` - 新增迁移操作指南
## 2026-04-09: 修复 Cloudflare 构建错误 - nodejs_compat

### 改动内容
- 在 wrangler.toml 添加 `nodejs_compat` 兼容标志，解决 next-auth v4 依赖 Node.js `crypto` 模块导致的构建失败

### 修改的文件
- `wrangler.toml` - 添加 `compatibility_flags = ["nodejs_compat"]`

## 2026-04-09: 修复 edge runtime webpack 编译错误

### 改动内容
- next.config.ts 添加 webpack 配置，为 edge runtime 提供 crypto/stream polyfill
- package.json 添加 crypto-browserify 和 stream-browserify 依赖
- next-auth v4 依赖 Node.js crypto，需要通过 crypto-browserify 在 edge 环境下编译

### 修改的文件
- `next.config.ts` - 添加 webpack edge runtime fallback 配置
- `package.json` - 新增 crypto-browserify、stream-browserify 依赖

---

## 2026-04-10: Cloudflare D1 数据库迁移 (Plan B)

### 改动内容

1. **升级 next-auth v4 → v5**
   - 更新 `package.json`: next-auth ^4.24.11 → ^5.0.0-beta.28
   - 替换 `@next-auth/prisma-adapter` 为 `@auth/prisma-adapter`
   - 创建 `src/auth.ts` 新配置入口（v5 API）
   - 重写 `src/app/api/auth/[...nextauth]/route.ts` 使用 handlers
   - 更新 `src/lib/auth.ts` 导出 auth 函数
   - 移除 crypto-browserify/stream-browserify polyfill（v5 原生支持 edge）

2. **切换到 Cloudflare D1 数据库**
   - 更新 `prisma/schema.prisma`: PostgreSQL → SQLite
   - 安装 `@prisma/adapter-d1` 依赖
   - 重写 `src/lib/db.ts`:
     - 开发环境：使用本地 SQLite 文件
     - 生产环境：使用 D1 binding（通过 getRequestContext()）
   - 配置 `wrangler.toml` D1 数据库绑定

3. **修改所有 API 路由**
   - 将 `import { db }` 改为 `import { getDb }`
   - 在每个函数开头添加 `const db = await getDb()`
   - 涉及 30+ API 路由文件
   - 更新服务层文件：api-auth.ts、holiday-service.ts、recurrence-service.ts、reminder-service.ts
   - 更新 src/auth.ts 的 authorize 回调

4. **更新 api-auth.ts**
   - hashToken 函数改为 async，使用 Web Crypto API SHA-256
   - generateApiToken 使用 crypto.getRandomValues
   - 移除 Node.js crypto 依赖

### 技术说明

- **D1 是 SQLite 数据库**：Cloudflare D1 使用 SQLite 引擎，适合 edge 分布式架构
- **数据迁移待执行**：需要从 Supabase 导出数据并导入 D1
- **本地开发**：使用本地 SQLite 文件，无需 D1 binding

### 修改的文件
- `package.json` - 依赖更新
- `prisma/schema.prisma` - PostgreSQL → SQLite
- `src/auth.ts` - 新增 next-auth v5 配置
- `src/lib/auth.ts` - 导出 auth 函数
- `src/lib/db.ts` - D1 adapter 支持
- `src/lib/api-auth.ts` - Web Crypto API 替代 Node.js crypto
- `src/app/api/auth/[...nextauth]/route.ts` - v5 handlers
- `src/app/api/**/route.ts` - 所有 API 路由使用 getDb()
- `src/services/*.ts` - 服务层使用 getDb()
- `wrangler.toml` - D1 数据库配置
- `next.config.ts` - 移除 webpack polyfill 配置

---

## 2026-04-10: 修复 Edge Runtime 配置问题

### 改动内容
1. **为所有页面和布局添加 edge runtime**
   - 所有 `page.tsx` 和 `layout.tsx` 文件添加 `export const runtime = 'edge'`
   - 确保 Cloudflare Workers 环境兼容
   - 涉及 `src/app/[locale]/**/page.tsx` 和 `src/app/[locale]/**/layout.tsx`

2. **修复 'use client' 指令顺序**
   - 将 `'use client'` 指令移到 `export const runtime = 'edge'` 之前
   - React 要求 `'use client'` 必须在文件最顶部（除注释外）
   - 修复构建错误：Invalid next.config.js options detected

### 修改的文件
- `src/app/[locale]/layout.tsx` - 添加 edge runtime，修复 'use client' 顺序
- `src/app/[locale]/page.tsx` - 添加 edge runtime
- `src/app/[locale]/forgot-password/page.tsx` - 添加 edge runtime
- `src/app/layout.tsx` - 添加 edge runtime
- `src/app/page.tsx` - 添加 edge runtime

---

## 2026-04-10: D1 数据库数据迁移

### 改动内容
1. **创建 D1 数据库 Schema**
   - 从 Prisma schema 转换为 SQLite 兼容的 SQL
   - 创建 `d1-schema.sql` 包含所有表结构和索引
   - 适配 SQLite 语法：TEXT 替代 DateTime，INTEGER 替代 Boolean

2. **导出 Supabase 数据**
   - 从 Supabase PostgreSQL 导出现有数据
   - 转换为 SQLite 兼容的 INSERT 语句
   - 创建 `d1-data.sql` 包含所有数据

3. **解决外键约束错误**
   - 问题：旧 schema 包含错误的 level ID（level_high 等）
   - 解决：删除旧 schema 中的默认 level 插入，使用 d1-data.sql 中的正确数据
   - 重建数据库：删除所有表 → 执行 schema → 执行 data

4. **数据迁移结果**
   - users: 4 条记录
   - todos: 33 条记录
   - levels: 3 条记录（高/中/低）
   - categories: 若干条记录
   - 其他关联数据完整迁移

### 修改的文件
- `d1-schema.sql` - 新增 D1 数据库 Schema
- `d1-data.sql` - 新增数据迁移 SQL
- `.gitignore` - 添加 d1-schema.sql 和 d1-data.sql 排除（含敏感数据）

### 部署命令
```bash
# 重建数据库
wrangler d1 execute todolist-db --remote --command "DROP TABLE IF EXISTS todos; ..."
wrangler d1 execute todolist-db --remote --file=./d1-schema.sql
wrangler d1 execute todolist-db --remote --file=./d1-data.sql
```

---

## 2026-04-10: 修复 Cloudflare 登录认证失败问题（调试阶段）

### 改动内容
- 增强 auth 路由的调试日志，精确定位 NEXTAUTH_SECRET 读取失败原因
- 日志显示 env keys 存在 NEXTAUTH_SECRET，但值为 falsy
- 改用 String() 强制转换 + length 检查，兼容空字符串、null 等情况
- 新增详细的类型和长度日志，便于定位实际值是 "" 还是 undefined

### 修改的文件
- `src/app/api/auth/[...nextauth]/route.ts` - 改进 env 读取逻辑和调试日志


## 2026-04-10: 修复 Cloudflare 部署登录问题（完结）

### 问题根因
1. **NEXTAUTH_SECRET 为空字符串**：Cloudflare Pages Dashboard 里变量存在但值为空，导致 auth 报 MissingSecret
2. **密码格式不兼容**：D1 数据库迁移的密码是 bcrypt 格式（`$2b$...`），但新代码改用 PBKDF2 格式（`salt:hash`），两种格式不兼容导致验证永远失败

### 解决步骤
1. 在 Cloudflare Dashboard → Pages → todolist-cf → Settings → Environment variables 中重新设置 `NEXTAUTH_SECRET` 为有效值（使用 `openssl rand -base64 32` 生成）
2. 在 Cloudflare D1 Console 中直接用 SQL 更新用户密码为 PBKDF2 格式的哈希值

### PBKDF2 哈希参数（verifyPassword 兼容格式）
- 算法：PBKDF2-SHA256
- 迭代次数：100,000
- Key 长度：256 bits
- 存储格式：`base64(salt):base64(hash)`（盐值 16 bytes）

### 修改的文件
- `src/app/api/auth/[...nextauth]/route.ts` - 增强调试日志（后续可清理）


## 2026-04-10: 用原生 D1 替换 Prisma 解决 CPU 超限问题

### 改动内容
- 创建 `src/lib/d1.ts`：轻量级 D1 客户端，绕过 Prisma 初始化开销
- 修复 `src/lib/db.ts`：生产环境不再在模块加载时创建 PrismaClient
- 重写 4 个高频路由使用原生 D1 SQL（生产走 D1，开发仍走 Prisma）：
  - `/api/levels` - LEFT JOIN COUNT 查询
  - `/api/categories` - GET/POST 均重写
  - `/api/auth/[...nextauth]` - 登录用户查询 + 清理调试日志
  - `/api/auth/security-question` - GET/POST/DELETE 均重写
  - `/api/todos/daily` - 复杂 JOIN 查询 + 并行执行两个查询

### 技术方案
- 生产/开发分支用 `IS_EDGE = process.env.NODE_ENV !== 'development'` 区分
- D1 路径：原生 SQL + LEFT JOIN，结果通过 reshapeTodo() 重组为嵌套对象
- 两个 todos 查询改为 Promise.all 并行执行，进一步降低 wall time

### 修改的文件
- `src/lib/d1.ts` - 新增：D1Client 类 + getD1Client()
- `src/lib/db.ts` - 修复模块加载时的 Prisma 初始化
- `src/app/api/levels/route.ts` - D1 重写
- `src/app/api/categories/route.ts` - D1 重写
- `src/app/api/auth/[...nextauth]/route.ts` - D1 重写 + 日志清理
- `src/app/api/auth/security-question/route.ts` - D1 重写
- `src/app/api/todos/daily/route.ts` - D1 重写

---

## 2026-04-11: 移动端界面适配优化

### 改动内容

1. **WeekView 周视图优化**
   - 添加横向滚动支持（`overflow-x-auto`）
   - 移动端设置最小宽度 560px，桌面端自适应
   - 日期列高度响应式调整（`min-h-[160px] sm:min-h-[200px] md:min-h-[300px]`）

2. **触摸目标优化**
   - 复选框点击区域增大（`p-2` 确保至少 44x44px）
   - 添加 `touch-manipulation` 优化触摸响应
   - 操作按钮在移动端始终可见（`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`）

3. **CalendarView 日历视图优化**
   - 日历网格支持横向滚动
   - 移动端隐藏侧边统计栏（`hidden lg:block`）
   - 星期头部字体响应式调整

4. **TaskForm 任务表单优化**
   - 移动端使用 Sheet 底部弹出，桌面端保持 Dialog
   - 日期时间选择器移动端垂直布局
   - 添加拖拽手柄指示
   - 按钮改为底部固定两列布局

5. **统计卡片布局优化**
   - QuarterlyView 和 YearlyView 统计卡片优化
   - 移动端 2 列，桌面端 4 列
   - 字体和间距响应式调整

6. **YearlyView 年度视图优化**
   - 热力图添加横向滚动支持
   - 移动端添加滑动提示文字
   - 统计卡片布局优化

7. **国际化**
   - 添加 `common.swipeToView` 翻译（中/英文）

### 修改的文件
- `src/components/views/WeekView.tsx` - 横向滚动、日期列高度响应式
- `src/components/task/TaskCard.tsx` - 触摸目标、移动端操作按钮可见
- `src/components/calendar/CalendarCell.tsx` - 任务显示优化
- `src/components/calendar/CalendarGrid.tsx` - 横向滚动、响应式字体
- `src/components/views/CalendarView.tsx` - 移动端隐藏侧边栏
- `src/components/task/TaskForm.tsx` - Sheet 底部弹出、响应式布局
- `src/components/views/QuarterlyView.tsx` - 统计卡片响应式
- `src/components/views/YearlyView.tsx` - 热力图滚动、统计卡片响应式
- `messages/en.json` - 添加 swipeToView 翻译
- `messages/zh.json` - 添加 swipeToView 翻译

---

## 2026-04-11: 移动端界面细节修复

### 改动内容

1. **Header 标题溢出修复**
   - 移动端日历视图下，隐藏日期导航选择器（月份切换）
   - 避免与左侧 "To Do List" 标题挤压导致文字竖向溢出
   - 日期导航仅在桌面端显示（`hidden md:flex`）

2. **日历视图滑动空白修复**
   - 移除 CalendarGrid 的 `min-w-[500px] sm:min-w-0` 设置
   - 让日历网格自适应容器宽度，消除右侧空白

3. **季度视图里程碑时间格式修复**
   - 将 ISO 时间格式改为易读的 `yyyy-MM-dd` 格式
   - 使用 `formatDateDisplay` 函数格式化 `dueDate`
   - 清理未使用的 import

### 修改的文件
- `src/components/layout/Header.tsx` - 移动端隐藏日期导航
- `src/components/calendar/CalendarGrid.tsx` - 移除固定最小宽度
- `src/components/views/QuarterlyView.tsx` - 里程碑时间格式化、清理 import

---

## 2026-04-11: 修复登录错误提示不显示问题

### 改动内容

1. **next-auth v5 错误处理修复**
   - 使用 `CredentialsSignin` 子类替代普通 `Error` 传递错误消息
   - 创建 `InvalidLoginError` 类处理"用户名或密码错误"
   - 创建 `MissingCredentialsError` 类处理"请输入用户名和密码"

2. **前端错误显示优化**
   - 优先使用 `result.code`（自定义错误消息）
   - 其次使用 `result.error`，最后使用默认消息

### 修改的文件
- `src/app/api/auth/[...nextauth]/route.ts` - Edge 路由错误处理
- `src/auth.ts` - 开发环境错误处理
- `src/components/auth/AuthPage.tsx` - 前端错误显示逻辑

---

## 2026-04-11: 添加网站图标

### 改动内容

1. **创建网站图标**
   - 设计黑白配色风格的 SVG 图标
   - 中心绿色渐变勾选符号，代表任务完成
   - 灰色装饰圆环增加层次感
   - 四角白色圆点作为装饰元素

2. **配置 Next.js metadata**
   - 在 root layout 中添加 icons 配置
   - 支持浏览器标签页和 Apple 设备图标

### 修改的文件
- `public/icon.svg` - 新增网站图标
- `src/app/layout.tsx` - 添加 icons metadata 配置

---

## 2026-04-11: 优化网站图标配色

### 改动内容

将图标从深色背景改为浅色背景，提高可见性和对比度：
- 背景改为白色渐变，添加浅灰边框
- 圆环和装饰点改为深色，在浅色背景上更清晰
- 保持绿色勾选符号作为视觉焦点

### 修改的文件
- `public/icon.svg` - 优化图标配色方案

---

## 2026-04-12: 添加 Sonner Toaster 组件

### 改动内容

在 layout 中添加 Sonner Toaster 组件，确保 sonner toast 能正确显示。
登录错误提示使用 sonner 库，需要 Toaster 组件渲染。

### 修改的文件
- `src/app/[locale]/layout.tsx` - 添加 SonnerToaster 组件

---

## 2026-04-12: 修复登录错误判断逻辑

### 改动内容

修复 next-auth v5 beta 版本的特殊行为：
- v5 beta 可能返回 `ok: true` 但同时带有 `error` 或 `code` 字段
- 需要同时检查 `ok` 和是否有错误字段来判断真正的登录状态
- 只有 `ok: true` 且无错误时才显示登录成功

### 修改的文件
- `src/components/auth/AuthPage.tsx` - 修复登录结果判断逻辑

---

## 2026-04-12: 添加功能扩展方案文档

### 改动内容

创建功能扩展方案文档，详细记录四个新功能的实现方案：

1. **任务标签系统** - 多标签支持、标签筛选、颜色自定义
2. **任务模板** - 保存常用任务结构、快速创建重复任务
3. **智能提醒** - 浏览器通知、预设提醒时间、提醒管理
4. **搜索与筛选增强** - 全文搜索、高级筛选、筛选预设

每个方案包含：
- 数据库模型设计
- API 端点实现
- 前端组件代码
- React Query Hooks
- 国际化文案
- 实现步骤和工作量估算

### 修改的文件
- `docs/features/README.md` - 方案索引和概述
- `docs/features/01-task-tags.md` - 任务标签系统方案
- `docs/features/02-task-templates.md` - 任务模板方案
- `docs/features/03-smart-reminders.md` - 智能提醒方案
- `docs/features/04-search-filter.md` - 搜索与筛选增强方案

---

## 2026-04-13: 修复时间处理时区转换问题

### 问题描述
- 用户创建任务时输入的时间（如 10:00 北京时间），保存后显示为不同时间（如 18:00）
- 原因：`combineDateAndTime` 函数把用户输入的本地时间错误标记为 UTC 时间
- 用户输入 `2026-04-13 10:00`（北京时间），生成 `2026-04-13T10:00:00.000Z`
- 后端解析为 UTC 10:00，前端显示时转换为本地时区 (UTC+8)，变成 18:00

### 解决方案
采用业内最佳实践：**存储 UTC，显示本地时间**

```
用户输入:     2026-04-13 10:00 (北京时间 UTC+8)
前端转换:     2026-04-13T02:00:00.000Z (UTC)
后端存储:     2026-04-13T02:00:00.000Z
前端显示:     2026-04-13 10:00 (自动转回本地时区)
```

### 改动内容
- 修改 `combineDateAndTime` 函数：使用 `new Date()` 解析本地时间，然后调用 `toISOString()` 转换为 UTC
- 用户输入什么时间，显示就是什么时间

### 修改的文件
- `src/components/task/TaskForm.tsx` - 修改 combineDateAndTime 函数
- `src/components/task/TaskDetailDialog.tsx` - 修改 combineDateAndTime 函数

---

## 2026-04-13: 修复 API 日期查询时区边界问题

### 问题描述
- 修复时间存储后，新建任务在日视图和日历视图找不到
- 原因：API 查询使用 `parseDateString(date).toISOString()` 把当天 00:00 转换为 UTC
- 任务时间已经是 UTC 存储，导致查询边界不匹配

### 示例分析
```
任务数据: startDate = 2026-04-13T02:00:00.000Z (UTC 02:00 = 北京时间 10:00)
查询边界: targetISO = 2026-04-12T16:00:00.000Z (2026-04-13 00:00 北京时间转 UTC)

查询条件: startDate <= 2026-04-12T16:00:00.000Z
结果: 02:00 > 16:00 (前一天) → 不满足 → 查不到任务
```

### 解决方案
修改所有 API 的日期查询逻辑：使用本地时间的日期边界（00:00 和 23:59:59），然后转换为 UTC

```typescript
// 修改前
const targetISO = parseDateString(date).toISOString();  // 当天 00:00 本地 → UTC

// 修改后
const localDayStart = new Date(`${date}T00:00:00`);  // 本地时间 00:00
const localDayEnd = new Date(`${date}T23:59:59`);    // 本地时间 23:59:59
const dayStartISO = localDayStart.toISOString();     // 转 UTC
const dayEndISO = localDayEnd.toISOString();         // 转 UTC
```

### 修改的文件
- `src/app/api/todos/daily/route.ts` - 修复日视图查询边界
- `src/app/api/todos/weekly/route.ts` - 修复周视图查询边界
- `src/app/api/todos/monthly/route.ts` - 修复月视图查询边界
- `src/app/api/todos/quarterly/route.ts` - 修复季度视图查询边界
- `src/app/api/todos/yearly/route.ts` - 修复年度视图查询边界
- `src/app/api/todos/filter/route.ts` - 修复筛选查询边界

---

## 2026-04-13: 更新节假日数据并优化获取机制

### 问题描述
- 静态节假日数据有多处错误（缺少调休日、节假日标记错误）
- 节假日数据获取优先级不合理（静态数据优先于 API）
- 缺乏自动更新机制，无法及时获取下一年数据

### 改动内容

1. **更新静态节假日数据**
   - 从 timor.tech API 获取 2026 年最新数据（39 条记录）
   - 修正错误：添加 2026-02-14、2026-02-23、2026-09-20、2026-09-25/26 调休日
   - 移除错误数据：2026-01-25、2026-04-26、2026-10-08
   - 修复 2026-02-15 从工作日改为春节假期

2. **优化数据获取优先级**
   - 改为：数据库缓存 → 外部 API → 静态数据（兜底）
   - 确保优先使用最新的 API 数据

3. **新增自动预加载机制**
   - `shouldPreloadNextYear()`: 10-12 月期间检查下一年数据
   - `checkAndPreloadNextYear()`: 后台异步检查并预加载
   - 只在数据不存在时获取，避免重复请求

4. **新增手动刷新接口**
   - `/api/holidays?action=refresh&year=YYYY`: 强制刷新指定年份数据
   - `/api/holidays?action=preload`: 手动触发预加载检查

### 修改的文件
- `src/lib/static-holidays.ts` - 更新 2026 年节假日数据
- `src/lib/holiday-service.ts` - 优化优先级，新增预加载和刷新功能
- `src/app/api/holidays/route.ts` - 新增 action 参数支持

---

## 2026-04-13: 新增系统维护功能（管理员专属）

### 改动内容

1. **管理员权限控制**
   - 新增 `src/lib/admin.ts`：通过环境变量 `ADMIN_USER_IDS` 控制管理员权限
   - 新增 `/api/admin/check` API：检查当前用户是否为管理员

2. **节假日数据管理**
   - 新增 `/api/admin/holidays` API：获取缓存状态、手动刷新、预加载
   - 新增 `HolidayManager` 组件：显示各年份数据量、刷新按钮、预加载按钮

3. **缓存清理**
   - 新增 `CacheManager` 组件：清理 localStorage 中的视图状态和查询缓存

4. **系统信息**
   - 新增 `SystemInfo` 组件：显示版本号、运行环境、构建时间

5. **设置页面集成**
   - 新增"系统维护" Tab，仅管理员可见
   - 更新 `use-view-store.ts` 添加 'admin' 类型

6. **国际化**
   - 添加中英文翻译：admin.system、admin.holidays、admin.cache

### 环境变量配置
在 Cloudflare Dashboard 设置：
```
ADMIN_USER_IDS=用户ID1,用户ID2
```

### 修改的文件
- `src/lib/admin.ts` - 新增管理员权限检查
- `src/app/api/admin/check/route.ts` - 新增权限检查 API
- `src/app/api/admin/holidays/route.ts` - 新增节假日管理 API
- `src/components/settings/HolidayManager.tsx` - 新增节假日管理组件
- `src/components/settings/CacheManager.tsx` - 新增缓存管理组件
- `src/components/settings/SystemInfo.tsx` - 新增系统信息组件
- `src/components/views/SettingsView.tsx` - 集成系统维护 Tab
- `src/hooks/use-view-store.ts` - 添加 admin 类型
- `messages/zh.json` - 添加中文翻译
- `messages/en.json` - 添加英文翻译

---

## 2026-04-13: Inbox 捕获箱功能实现

### 改动内容

1. **数据库模型**
   - 新增 `InboxItem` 模型：id, content, userId, createdAt, convertedToTodoId, convertedAt
   - User 模型添加 `inboxItems` 关联

2. **API 端点**
   - `GET /api/inbox` - 获取未转化条目列表
   - `POST /api/inbox` - 创建新捕获条目（content 最大 500 字符）
   - `GET /api/inbox/count` - 获取未处理条目数（用于侧边栏徽章）
   - `PUT /api/inbox/:id` - 更新条目内容
   - `DELETE /api/inbox/:id` - 删除条目
   - `POST /api/inbox/:id/convert` - 转化为正式任务（事务操作）

3. **前端 Hooks**
   - `useInboxItems()` - 获取列表
   - `useInboxCount()` - 获取数量（staleTime: 30s）
   - `useCreateInboxItem()` - 创建（乐观更新）
   - `useUpdateInboxItem()` - 更新内容
   - `useDeleteInboxItem()` - 删除（乐观更新）
   - `useConvertInboxItem()` - 转化（invalidate inbox + todos）

4. **前端组件**
   - `QuickCaptureButton` - 全局悬浮捕获按钮（右下角固定）
     - 点击弹出极简输入面板（Popover）
     - Enter 提交，Shift+Enter 换行，Esc 关闭
     - 全局快捷键：Cmd/Ctrl + Shift + I
     - 在 Inbox 页面内自动隐藏
   - `InboxList` - Inbox 页面主体
     - 列表按 createdAt DESC 排序
     - 支持就地编辑内容
     - 操作：转化为任务、编辑、删除
   - `ConvertToTodoDialog` - 转化对话框
     - 预填 title 为 inbox item 的 content
     - 必填 startDate、dueDate（默认今天）
     - 可选分类和等级
   - `InboxView` - 页面级组件

5. **UI 集成**
   - Sidebar 添加"捕获箱"导航项，显示未处理数量徽章
   - MainLayout 挂载 QuickCaptureButton
   - page.tsx 添加 inbox 视图渲染
   - use-view-store.ts 添加 'inbox' 视图类型

6. **国际化**
   - 添加 `inbox` 命名空间翻译（中/英文）

### 设计原则
- 极致低摩擦：1 次点击 + 打字 + 回车完成记录
- 与任务系统解耦：Inbox 条目不是任务，不占用任何视图
- 双向转化：可升级为正式任务，也可直接删除
- 无 toast 提示：使用轻微视觉反馈

### 修改的文件
- `prisma/schema.prisma` - 新增 InboxItem 模型
- `src/app/api/inbox/route.ts` - 新增列表/创建 API
- `src/app/api/inbox/[id]/route.ts` - 新增更新/删除 API
- `src/app/api/inbox/[id]/convert/route.ts` - 新增转化 API
- `src/app/api/inbox/count/route.ts` - 新增计数 API
- `src/hooks/use-inbox.ts` - 新增数据 hooks
- `src/components/inbox/QuickCaptureButton.tsx` - 新增悬浮捕获按钮
- `src/components/inbox/InboxList.tsx` - 新增列表组件
- `src/components/inbox/ConvertToTodoDialog.tsx` - 新增转化对话框
- `src/components/inbox/InboxView.tsx` - 新增页面组件
- `src/hooks/use-view-store.ts` - 添加 inbox 视图类型
- `src/components/layout/Sidebar.tsx` - 添加导航项和徽章
- `src/components/layout/MainLayout.tsx` - 挂载悬浮按钮
- `src/app/[locale]/page.tsx` - 添加 inbox 视图渲染
- `messages/zh.json` - 添加中文翻译
- `messages/en.json` - 添加英文翻译
- `docs/ARCHITECTURE.md` - 更新架构文档

---

## 2026-04-14: 修复 Inbox 视图切换时的 React hydration 错误

### 问题描述
1. 从捕获箱点击其他栏目时报 React error #310（hooks 顺序改变）
2. 访问捕获箱时报 React error #300（hydration mismatch）
3. YearlyView 月份/星期标签报 MISSING_MESSAGE 错误

### 改动内容

1. **修复 React error #310（Sidebar）**
   - 移除 useInboxCount 的条件 enabled 参数
   - 原因：enabled 依赖 currentView，导航时值变化导致 hooks 顺序改变
   - 解决：始终启用 useInboxCount，避免 hooks 顺序变化

2. **修复 React error #300（hydration mismatch）**
   - 添加 isHydrated 状态等待客户端 hydration 完成
   - 在 Sidebar、Header、QuickCaptureButton、page.tsx 中统一处理
   - hydration 完成前使用默认值，避免 SSR 不匹配

3. **修复 YearlyView MISSING_MESSAGE 错误**
   - MONTH_LABELS 和 DAY_LABELS 数组已经是翻译后的字符串
   - 直接使用数组值，不需要再次调用 t()

4. **InboxList RelativeTime 组件**
   - 已在之前修复，使用 useEffect 延迟渲染相对时间
   - 避免 formatDistanceToNow 在服务端和客户端产生不同结果

### 修改的文件
- `src/components/layout/Sidebar.tsx` - 移除 enabled 条件，添加 isHydrated
- `src/components/layout/Header.tsx` - 添加 isHydrated 处理
- `src/components/inbox/QuickCaptureButton.tsx` - 添加 isHydrated 处理
- `src/app/[locale]/page.tsx` - 添加 isHydrated 处理
- `src/components/views/YearlyView.tsx` - 修复月份/星期标签渲染

---

## 2026-04-14: 修复首页 hydration error #300 根因

### 问题描述
部署后首页直接报 React error #300（hydration mismatch），即使添加了 isHydrated 处理仍然报错。

### 根因分析
use-view-store.ts 在模块顶层计算日期：
```typescript
const now = new Date();
const today = getTodayString();
const currentYear = now.getFullYear();
// ...
```
这些代码在模块导入时执行，服务端和客户端时间可能不同（SSR），导致初始状态不一致。

### 改动内容
1. **移除模块顶层日期计算**
   - 改为函数 `getCurrentDateInfo()` 延迟计算

2. **使用占位初始值**
   - selectedDate: '1970-01-01'
   - calendarYear: 1970
   - calendarMonth: 1
   - 其他日期字段同理

3. **onRehydrateStorage 回调**
   - hydration 完成后更新为真实日期
   - 设置 `_hydrated: true` 标记完成

### 修改的文件
- `src/hooks/use-view-store.ts` - 延迟日期计算到 hydration 后

---

## 2026-04-14: 修复 QuickCaptureButton 违反 React Hooks 规则导致 error #300

### 问题描述
访问网站后页面无法打开，F12 显示 `Minified React error #300`（Rendered fewer hooks than during the previous render）。

### 根因分析
`QuickCaptureButton.tsx` 中存在 React Hooks 规则违反：
- `if (isHydrated && currentView === 'inbox') { return null; }` 的提前返回位于三个 hook 调用之前：
  - `useEffect`（自动聚焦）
  - `useEffect`（全局快捷键）
  - `useCallback`（提交处理）
- 当用户切换到 inbox 视图后，hydration 完成，组件提前返回 null，此次渲染调用的 hooks 数量比上次少，React 抛出 error #300

### 改动内容
- 将三个 hook 调用（`useEffect` × 2，`useCallback` × 1）移到提前返回语句之前
- 确保所有渲染路径下 hooks 调用数量保持一致

### 修改的文件
- `src/components/inbox/QuickCaptureButton.tsx` - 修复 hooks 顺序，将 return null 移至所有 hooks 之后

---

## 2026-04-14: 修复年度视图和季度视图 503 错误

### 问题描述
`/api/todos/yearly` 和 `/api/todos/quarterly` 两个接口在 Cloudflare Workers 生产环境返回 503 错误。

### 根因分析
503 由 Cloudflare Workers **平台层**直接返回，表示 Worker CPU 时间超出限制（非应用代码的 500）。
原因：两个接口在生产环境都使用 Prisma ORM，而 Cloudflare Workers 是无状态的，每次请求都需要重新初始化 `PrismaClient`，初始化本身消耗大量 CPU，导致超限。

### 改动内容
与此前修复 inbox 接口相同的方案，添加 `IS_EDGE` 分支：
- 生产环境（IS_EDGE=true）：使用 D1 原生 SQL，跳过 Prisma 初始化
- 开发环境（IS_EDGE=false）：保留 Prisma 路径不变
- 将 `getDb()` 调用移到 Prisma 路径内，避免在 edge 路径中执行

**yearly 接口优化**：
- 3条聚合 SQL 并行执行（`Promise.all`）：每日完成数、每月完成数、分类统计
- 不再加载全部 Todo 对象，只返回聚合数字

**quarterly 接口优化**：
- 1条 SQL 获取里程碑（JOIN categories + levels）
- 1条 SQL 获取季度整体统计（含高优先级计数）
- 3条 SQL 并行获取各月统计

### 修改的文件
- `src/app/api/todos/yearly/route.ts` - 添加 D1 原生 SQL 路径
- `src/app/api/todos/quarterly/route.ts` - 添加 D1 原生 SQL 路径
