import type { SubTask } from '@todolist/db';

// 任务类型
export type TaskType = 'basic' | 'multi_day' | 'multi_step' | 'recurring';

/**
 * 判定任务类型
 * @param todo 任务数据
 * @returns 任务类型
 */
export function determineTaskType(todo: {
  startDate: string;
  dueDate: string;
  subTasks: SubTask[] | { text: string }[];
  isCycleTask: boolean;
}): TaskType {
  // 周期任务
  if (todo.isCycleTask) {
    return 'recurring';
  }
  
  // 多步骤任务（有子任务）
  if (todo.subTasks && todo.subTasks.length > 0) {
    return 'multi_step';
  }
  
  // 跨天任务
  if (todo.startDate !== todo.dueDate) {
    return 'multi_day';
  }
  
  // 基础任务
  return 'basic';
}

/**
 * 计算任务完成度
 * @param subTasks 子任务列表
 * @returns 完成百分比 (0-100)
 */
export function calculateCompletion(subTasks: SubTask[] | { isDone: boolean }[]): number {
  if (!subTasks || subTasks.length === 0) {
    return 0;
  }
  
  const completedCount = subTasks.filter(st => st.isDone).length;
  return Math.round((completedCount / subTasks.length) * 100);
}