import type { TaskType } from '@/types/index';

// 筛选所需的 Todo 最小字段集
interface FilterableTodo {
  id: string;
  startDate: string;
  dueDate: string;
  subTasks: string | null;
  isCycleTask: boolean;
  isMilestone: boolean;
  estimatedDuration: number | null;
  categoryId: string | null;
  levelId: string | null;
}

function getDateOnly(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasSubTasks(todo: FilterableTodo): boolean {
  if (!todo.subTasks) return false;
  try {
    const parsed = JSON.parse(todo.subTasks);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export function getTaskTypes(todo: FilterableTodo): TaskType[] {
  const types: TaskType[] = [];

  if (todo.isMilestone) types.push('milestone');
  if (todo.isCycleTask) types.push('cycle');
  if (todo.estimatedDuration !== null && todo.estimatedDuration >= 1440) types.push('cross_day');
  if (hasSubTasks(todo)) types.push('multi_step');

  const startDateOnly = getDateOnly(todo.startDate);
  const dueDateOnly = getDateOnly(todo.dueDate);
  if (startDateOnly === dueDateOnly && !hasSubTasks(todo) && !todo.isCycleTask && !todo.isMilestone) {
    types.push('basic');
  }

  return types;
}

export function matchesTaskType(todo: FilterableTodo, type: TaskType): boolean {
  return getTaskTypes(todo).includes(type);
}

export interface FilterState {
  taskTypes: TaskType[];
  categoryId: string | null;
  levelId: string | null;
}

// 泛型筛选函数，保留原始 Todo 的完整类型
export function applyFilters<T extends FilterableTodo>(todos: T[], filters: FilterState): T[] {
  return todos.filter(todo => {
    if (filters.taskTypes.length > 0) {
      const types = getTaskTypes(todo);
      if (!filters.taskTypes.some(t => types.includes(t))) return false;
    }
    if (filters.categoryId && todo.categoryId !== filters.categoryId) return false;
    if (filters.levelId && todo.levelId !== filters.levelId) return false;
    return true;
  });
}