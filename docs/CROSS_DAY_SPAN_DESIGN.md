# 跨天任务横跨框设计方案

## 背景

用户需求：**移动端 + PC端 + 周视图 + 日历视图，全场景实现跨天任务横跨框**

当前问题：
- 跨天任务在每个日期单元格独立显示，没有横跨多天的视觉效果
- 移动端字体太小（10px），内容拥挤看不清楚

## 当前实现状态

| 场景 | 跨天数据 | 跨天显示 | 问题 |
|-----|---------|---------|-----|
| PC端日历视图 | ✅ 跨天任务出现在多天 | ❌ 每格独立显示 | 无横跨视觉效果 |
| PC端周视图 | ✅ 跨天任务出现在多列 | ❌ 每列独立显示 | 无横跨视觉效果 |
| 移动端日历视图 | ✅ 数据正确 | ❌ 每格独立+字体极小 | 无横跨框+看不清 |
| 移动端周视图 | ✅ 数据正确 | ❌ 每列独立+字体极小 | 无横跨框+看不清 |

## 核心技术挑战

1. **网格定位计算**：在 7x6（日历）或 7x1（周）网格中计算跨天条的位置
2. **多行布局**：避免跨天任务在同一行重叠
3. **跨周/跨月边界**：任务跨越网格边界时的截断处理
4. **移动端滚动**：横向滚动时横跨条的连续性
5. **交互兼容**：点击横跨条触发任务详情/完成操作

---

## 组件架构设计

### 跨天横跨条组件架构

```
CrossDaySpanBar (统一组件)
├── 计算逻辑（共享）
│   ├── computeSpans() - 从任务数据提取跨天信息
│   ├── assignRows() - 分配行避免重叠
│   └── calculatePositions() - 计算位置（left/width/top）
├── 渲染组件（场景适配）
│   ├── CalendarSpanBar - 日历网格中的横跨条
│   └── WeekSpanBar - 周网格中的横跨条
└── 交互处理（共享）
    ├── onClick → 打开任务详情
    └── onToggle → 完成状态切换
```

### 数据结构定义

```typescript
interface CrossDaySpan {
  taskId: string;
  title: string;
  status: 'pending' | 'completed';
  level?: { id: string; name: string; value: number } | null;
  category?: { id: string; name: string; emoji?: string } | null;

  // 日期信息（YYYY-MM-DD 格式）
  startDate: string;
  endDate: string;

  // 网格位置信息
  startColIndex: number;   // 起始列（日历：0-41，周：0-6）
  endColIndex: number;     // 结束列
  spanDays: number;        // 横跨天数

  // 行位置（避免重叠）
  rowIndex: number;        // 所在行（日历：0-5，周：固定0）

  // 渲染样式
  isPartiallyVisible: boolean;  // 是否被网格边界截断
  visibleStartCol: number;      // 实际可见起始列
  visibleEndCol: number;        // 实际可见结束列
}
```

---

## PC端日历视图实现

### 实现方案

在 `CalendarGrid` 上层叠加一个跨天条层，使用绝对定位。

### 计算逻辑

```typescript
function computeCalendarSpans(
  tasks: Record<string, Task[]>,
  calendarDates: Date[],
  cellWidth: number,
  cellHeight: number,
  headerHeight: number
): CrossDaySpan[] {
  const spans: CrossDaySpan[] = [];
  const processedIds = new Set<string>();
  const dateToIndex: Record<string, number> = {};

  // 建立 date → gridIndex 映射
  calendarDates.forEach((date, index) => {
    dateToIndex[formatDate(date)] = index;
  });

  // 提取跨天任务
  Object.entries(tasks).forEach(([date, dateTasks]) => {
    dateTasks.forEach(task => {
      if (processedIds.has(task.id)) return;

      const taskStart = getDateOnly(task.startDate);
      const taskEnd = getDateOnly(task.dueDate);

      if (taskStart !== taskEnd) {
        const startIdx = dateToIndex[taskStart];
        const endIdx = dateToIndex[taskEnd];

        if (startIdx !== undefined && endIdx !== undefined) {
          spans.push({
            taskId: task.id,
            title: task.title,
            status: task.status,
            level: task.level,
            category: task.category,
            startDate: taskStart,
            endDate: taskEnd,
            startColIndex: startIdx,
            endColIndex: endIdx,
            spanDays: endIdx - startIdx + 1,
            rowIndex: 0,
            isPartiallyVisible: true,
            visibleStartCol: startIdx,
            visibleEndCol: endIdx
          });
          processedIds.add(task.id);
        }
      }
    });
  });

  return assignRowsToSpans(spans, 6);
}

function assignRowsToSpans(spans: CrossDaySpan[], maxRows: number): CrossDaySpan[] {
  const rows: CrossDaySpan[][] = Array.from({ length: maxRows }, () => []);

  spans.forEach(span => {
    for (let row = 0; row < maxRows; row++) {
      const hasOverlap = rows[row].some(existing =>
        !(existing.endColIndex < span.startColIndex || span.endColIndex < existing.startColIndex)
      );

      if (!hasOverlap) {
        rows[row].push(span);
        span.rowIndex = row;
        break;
      }
    }
  });

  return spans;
}
```

### 渲染组件

```tsx
function CalendarSpanLayer({ spans, cellWidth, cellHeight, headerHeight, onTaskClick }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ top: headerHeight }}>
      {spans.map(span => {
        const row = Math.floor(span.startColIndex / 7);
        const colStart = span.startColIndex % 7;
        const colEnd = span.endColIndex % 7;
        const spanRows = Math.floor(span.endColIndex / 7) - row;

        if (spanRows === 0) {
          return (
            <CalendarSpanBar
              key={span.taskId}
              span={span}
              left={colStart * cellWidth}
              width={(colEnd - colStart + 1) * cellWidth}
              top={row * cellHeight}
              onTaskClick={onTaskClick}
            />
          );
        } else {
          return (
            <MultiRowSpanBar
              key={span.taskId}
              span={span}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              onTaskClick={onTaskClick}
            />
          );
        }
      })}
    </div>
  );
}
```

### 横跨条样式

```tsx
function CalendarSpanBar({ span, left, width, top, onTaskClick }) {
  const bgColor = span.level?.value === 3 ? '#fee2e2' : span.level?.value === 2 ? '#fef3c7' : '#f3f4f6';

  return (
    <div
      className={cn(
        'absolute h-7 rounded-md px-2 flex items-center gap-1.5',
        'pointer-events-auto cursor-pointer',
        'hover:shadow-md transition-shadow',
        span.status === 'completed' && 'opacity-60'
      )}
      style={{
        left: `${left}px`,
        width: `${width - 4}px`,
        top: `${top + 24}px`,
        backgroundColor: bgColor
      }}
      onClick={() => onTaskClick(span.taskId)}
    >
      <span className={cn('w-1 h-4 rounded', getLevelColor(span.level))} />
      <span className={cn('text-sm truncate', span.status === 'completed' && 'line-through')}>
        {span.title}
      </span>
    </div>
  );
}
```

---

## PC端周视图实现

### 实现方案

在 `WeekView` 网格上层叠加跨天条层，逻辑更简单（只有 7 列，无跨行）。

### 计算逻辑

```typescript
function computeWeekSpans(
  tasksByDate: Record<string, Task[]>,
  weekDates: string[]
): CrossDaySpan[] {
  const spans: CrossDaySpan[] = [];
  const processedIds = new Set<string>();

  weekDates.forEach((date, colIndex) => {
    const tasks = tasksByDate[date] || [];
    tasks.forEach(task => {
      if (processedIds.has(task.id)) return;

      const taskStart = getDateOnly(task.startDate);
      const taskEnd = getDateOnly(task.dueDate);

      if (taskStart !== taskEnd) {
        const startCol = weekDates.indexOf(taskStart);
        const endCol = weekDates.indexOf(taskEnd);

        if (startCol >= 0 && endCol >= 0) {
          spans.push({
            ...task,
            startColIndex: startCol,
            endColIndex: endCol,
            spanDays: endCol - startCol + 1,
            rowIndex: 0,
          });
          processedIds.add(task.id);
        }
      }
    });
  });

  return assignRowsToSpans(spans, 3);
}
```

### 横跨条样式（带 Checkbox）

```tsx
function WeekSpanBar({ span, left, width, top, onTaskClick, onToggle }) {
  const bgColor = span.level?.value === 3 ? '#fee2e2' : '#fef3c7';

  return (
    <div
      className={cn(
        'absolute h-8 rounded-md px-2 flex items-center gap-2',
        'pointer-events-auto',
        span.status === 'completed' && 'opacity-60'
      )}
      style={{
        left: `${left + 2}px`,
        width: `${width - 4}px`,
        top: `${top}px`,
        backgroundColor: bgColor
      }}
    >
      <Checkbox
        checked={span.status === 'completed'}
        onCheckedChange={() => onToggle(span.taskId)}
        className="h-4 w-4"
      />
      <span className={cn('w-1.5 h-4 rounded', getLevelColor(span.level))} />
      <span
        className={cn('text-sm truncate cursor-pointer', span.status === 'completed' && 'line-through')}
        onClick={() => onTaskClick(span.taskId)}
      >
        {span.title}
      </span>
    </div>
  );
}
```

---

## 移动端适配方案

### 移动端日历视图

1. **单元格简化**：只显示日期 + 任务数量徽章（不显示任务标题）
2. **跨天横跨条**：使用更紧凑样式（高度 24px）
3. **点击单元格 → Drawer**：显示该日任务详情列表

```tsx
function MobileCalendarCell({ date, tasks, onClick }) {
  return (
    <div className="min-w-[48px] min-h-[60px] ..." onClick={onClick}>
      <span className="text-sm font-medium">{format(date, 'd')}</span>
      {tasks.length > 0 && (
        <Badge className="text-xs mt-1">{tasks.length} 项</Badge>
      )}
    </div>
  );
}
```

### 移动端周视图

1. **日期列简化**：只显示日期 + 星期 + 任务数量徽章
2. **跨天横跨条**：占据更大空间，字体 14px
3. **点击日期列 → Drawer**：显示该日任务详情

```tsx
function MobileDateColumn({ dateInfo, tasks, onClick }) {
  const normalCount = tasks.filter(t => t.startDate === t.dueDate).length;

  return (
    <div className="min-w-[80px] min-h-[100px] ..." onClick={onClick}>
      <span className="text-lg font-bold">{dateInfo.day}</span>
      <span className="text-xs text-muted-foreground">{dateInfo.dayName}</span>
      {normalCount > 0 && (
        <Badge variant="secondary" className="text-xs mt-2">{normalCount} 项</Badge>
      )}
    </div>
  );
}
```

---

## 分阶段实施计划

### 第一阶段：PC端日历视图跨天框

**工作量**：2 天

**改动文件**：
- 新建 `src/types/cross-day-span.ts`
- 新建 `src/lib/cross-day-utils.ts`
- 新建 `src/components/calendar/CalendarSpanLayer.tsx`
- 新建 `src/components/calendar/CalendarSpanBar.tsx`
- 新建 `src/components/calendar/MultiRowSpanBar.tsx`
- 修改 `src/components/calendar/CalendarGrid.tsx`
- 修改 `src/components/views/CalendarView.tsx`

### 第二阶段：PC端周视图跨天框

**工作量**：1.5 天

**改动文件**：
- 新建 `src/components/views/WeekSpanLayer.tsx`
- 新建 `src/components/views/WeekSpanBar.tsx`
- 修改 `src/components/views/WeekView.tsx`

### 第三阶段：移动端日历视图优化

**工作量**：1 天

**改动文件**：
- 新建 `src/components/calendar/DayTaskDrawer.tsx`
- 修改 `src/components/calendar/CalendarCell.tsx`
- 修改 `src/components/views/CalendarView.tsx`

### 第四阶段：移动端周视图优化

**工作量**：1 天

**改动文件**：
- 新建 `src/components/views/MobileDateColumn.tsx`
- 新建 `src/components/views/WeekTaskDrawer.tsx`
- 修改 `src/components/views/WeekView.tsx`

---

## 总工作量估算

| 阶段 | 工作量 | 优先级 |
|-----|-------|-------|
| 第一阶段：PC端日历视图 | 2 天 | 高 |
| 第二阶段：PC端周视图 | 1.5 天 | 高 |
| 第三阶段：移动端日历视图 | 1 天 | 中 |
| 第四阶段：移动端周视图 | 1 天 | 中 |
| **总计** | **5.5 天** | - |

---

## 技术依赖

- 现有组件：`Drawer`、`TaskCard`、`Checkbox`、`Badge`
- 现有 Hook：`useIsMobile()`、`useToggleTodo()`
- 新依赖：无（使用绝对定位 + CSS 实现）

---

## 验证方式

1. 创建跨天任务（如 4月20日-4月22日）
2. 日历视图检查横跨条是否正确跨越 20、21、22 三天
3. 周视图检查横跨条是否正确跨越多列
4. 点击横跨条检查任务详情弹窗
5. 点击 Checkbox 检查完成状态切换
6. 多个跨天任务检查是否分行避免重叠
7. 移动端检查单元格简化显示
8. 移动端点击单元格检查 Drawer 详情