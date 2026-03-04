// 任务状态枚举
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

// 任务类型枚举（动态计算）
export type TaskType = 'basic' | 'cross_day' | 'multi_step' | 'cycle';

// 周期频率
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

// 子任务结构
export interface SubTask {
  id: string;
  text: string;
  isDone: boolean;
}

// 任务分类
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  emoji?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 任务等级
export interface Level {
  id: string;
  name: string;
  value: number; // 0-10
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 周期规则
export interface RecurrenceRule {
  id: string;
  frequency: Frequency;
  interval: number;
  byDay?: number[] | null; // 0-6 代表周日到周六
  cronExpr?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 任务主模型
export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  status: TodoStatus;

  // 时间维度
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD

  // 多步骤任务
  subTasks?: SubTask[] | null;

  // 周期任务
  isCycleTask: boolean;
  recurrenceRuleId?: string | null;
  recurrenceRule?: RecurrenceRule | null;
  parentRuleId?: string | null;

  // 关联
  categoryId?: string | null;
  category?: Category | null;
  levelId?: string | null;
  level?: Level | null;

  // 元数据
  priority: number;
  isMilestone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 计算的任务类型
export interface TodoWithType extends Todo {
  taskTypes: TaskType[];
  completionPercentage?: number; // 对于多步骤任务
}

// 日历单元格数据
export interface CalendarCell {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  tasks: Todo[];
  taskCount: number;
}

// 历史待办任务
export interface OverdueTask {
  task: Todo;
  overdueDays: number;
}

// 年度统计数据
export interface YearlyStats {
  date: string;
  completedCount: number;
  totalCount: number;
}

// 周数据
export interface WeeklyData {
  date: string;
  tasks: Todo[];
}

// 季度里程碑
export interface QuarterlyMilestone {
  id: string;
  title: string;
  startDate: string;
  dueDate: string;
  status: TodoStatus;
  progress: number; // 0-100
}
