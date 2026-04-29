import type { Level, TodoStatus } from './index';

/**
 * 跨天任务横跨条数据结构
 * 用于在日历/周视图中渲染横跨多个单元格/列的任务条
 */
export interface CrossDaySpan {
  taskId: string;
  title: string;
  status: TodoStatus;
  level?: Level | null;
  estimatedDuration?: number | null; // 预计耗时（分钟）

  // 日期信息（YYYY-MM-DD 格式）
  startDate: string;
  endDate: string;

  // 网格位置信息
  startColIndex: number;   // 起始列（日历：0-41，周：0-6）
  endColIndex: number;     // 结束列
  spanDays: number;        // 横跨天数

  // 行位置（避免重叠）
  rowIndex: number;        // 所在行
}

/**
 * 横跨条显示阈值
 * 预计耗时 >= 1440分钟（1天）时显示横跨条
 */
export const SPAN_DISPLAY_THRESHOLD = 1440;

/**
 * 判断任务是否应该显示为横跨条
 * @param estimatedDuration 预计耗时（分钟）
 * @returns 是否显示横跨条
 */
export function shouldShowSpanningBar(estimatedDuration: number | null | undefined): boolean {
  // 未设置预计耗时时，默认显示横跨条（保守处理）
  if (estimatedDuration === null || estimatedDuration === undefined) {
    return true;
  }
  // 预计耗时 >= 1天时显示横跨条
  return estimatedDuration >= SPAN_DISPLAY_THRESHOLD;
}