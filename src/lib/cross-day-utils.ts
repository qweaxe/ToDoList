import { formatDate, toDate } from './date-utils';
import type { CrossDaySpan } from '@/types/cross-day-span';
import { shouldShowSpanningBar } from '@/types/cross-day-span';

/**
 * 从 ISO datetime 字符串提取日期部分 (YYYY-MM-DD)
 * @param isoString ISO datetime 字符串
 * @returns YYYY-MM-DD 格式的日期字符串
 */
export function getDateOnly(isoString: string): string {
  if (!isoString) return '';
  // 如果已经是 YYYY-MM-DD 格式，直接返回
  if (!isoString.includes('T')) return isoString;
  // 从 ISO 字符串提取日期部分
  return isoString.split('T')[0];
}

/**
 * 从任务数据计算日历视图的横跨条
 * @param tasks 按日期分组的任务数据
 * @param calendarDates 日历网格日期数组（42个日期）
 * @returns CrossDaySpan 数组
 */
export function computeCalendarSpans(
  tasks: Record<string, Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    dueDate: string;
    level?: { id: string; name: string; value: number } | null;
    estimatedDuration?: number | null;
  }>>,
  calendarDates: Date[]
): CrossDaySpan[] {
  const spans: CrossDaySpan[] = [];
  const processedIds = new Set<string>();

  // 建立 date → gridIndex 映射
  const dateToIndex: Record<string, number> = {};
  calendarDates.forEach((date, index) => {
    dateToIndex[formatDate(date)] = index;
  });

  // 提取跨天任务
  Object.entries(tasks).forEach(([date, dateTasks]) => {
    dateTasks.forEach(task => {
      if (processedIds.has(task.id)) return;

      const taskStart = getDateOnly(task.startDate);
      const taskEnd = getDateOnly(task.dueDate);

      // 只有跨天任务才显示横跨条
      if (taskStart !== taskEnd) {
        // 根据 estimatedDuration 判断是否显示横跨条
        if (!shouldShowSpanningBar(task.estimatedDuration)) {
          processedIds.add(task.id);
          return;
        }

        const startIdx = dateToIndex[taskStart];
        const endIdx = dateToIndex[taskEnd];

        // 确保日期在网格范围内
        if (startIdx !== undefined && endIdx !== undefined) {
          spans.push({
            taskId: task.id,
            title: task.title,
            status: task.status as 'pending' | 'completed' | 'in_progress',
            level: task.level,
            estimatedDuration: task.estimatedDuration,
            startDate: taskStart,
            endDate: taskEnd,
            startColIndex: startIdx,
            endColIndex: endIdx,
            spanDays: endIdx - startIdx + 1,
            rowIndex: 0,
          });
          processedIds.add(task.id);
        }
      }
    });
  });

  // 分配行避免重叠
  return assignRowsToSpans(spans, 4); // 最大4行
}

/**
 * 贪心算法分配行避免重叠
 * @param spans 横跨条数组
 * @param maxRows 最大行数
 * @returns 分配好行号的横跨条数组
 */
export function assignRowsToSpans(spans: CrossDaySpan[], maxRows: number): CrossDaySpan[] {
  // 按开始列索引排序
  const sortedSpans = [...spans].sort((a, b) => a.startColIndex - b.startColIndex);

  // 每行已有的横跨条
  const rows: CrossDaySpan[][] = Array.from({ length: maxRows }, () => []);

  sortedSpans.forEach(span => {
    for (let row = 0; row < maxRows; row++) {
      const hasOverlap = rows[row].some(existing =>
        // 检查是否重叠：两个区间相交
        !(existing.endColIndex < span.startColIndex || span.endColIndex < existing.startColIndex)
      );

      if (!hasOverlap) {
        rows[row].push(span);
        span.rowIndex = row;
        break;
      }
    }
  });

  return sortedSpans;
}

/**
 * 计算横跨条在网格中的位置
 * @param span 横跨条数据
 * @param cellWidth 单元格宽度
 * @param cellHeight 单元格高度
 * @param gap 单元格间距
 * @returns 位置信息 { left, width, top, height }
 */
export function calculateSpanPosition(
  span: CrossDaySpan,
  cellWidth: number,
  cellHeight: number,
  gap: number = 4
): { left: number; width: number; top: number; height: number } {
  const startRow = Math.floor(span.startColIndex / 7);
  const startCol = span.startColIndex % 7;
  const endCol = span.endColIndex % 7;
  const endRow = Math.floor(span.endColIndex / 7);

  // 横跨条高度
  const barHeight = 24;

  // 如果在同一周内
  if (startRow === endRow) {
    return {
      left: startCol * (cellWidth + gap) + gap / 2,
      width: (endCol - startCol + 1) * cellWidth + (endCol - startCol) * gap - gap,
      top: startRow * (cellHeight + gap) + 28 + span.rowIndex * (barHeight + 4),
      height: barHeight,
    };
  }

  // 跨周任务：只渲染第一周的片段（后续周的分段可单独处理）
  // 这里返回第一周的片段
  return {
    left: startCol * (cellWidth + gap) + gap / 2,
    width: (7 - startCol) * cellWidth + (6 - startCol) * gap - gap,
    top: startRow * (cellHeight + gap) + 28 + span.rowIndex * (barHeight + 4),
    height: barHeight,
  };
}

/**
 * 检查横跨条是否跨越多周
 * @param span 横跨条数据
 * @returns 是否跨周
 */
export function isCrossWeekSpan(span: CrossDaySpan): boolean {
  const startRow = Math.floor(span.startColIndex / 7);
  const endRow = Math.floor(span.endColIndex / 7);
  return startRow !== endRow;
}

/**
 * 获取跨周横跨条的所有片段
 * @param span 横跨条数据
 * @param cellWidth 单元格宽度
 * @param cellHeight 单元格高度
 * @param gap 单元格间距
 * @returns 每周的片段位置数组
 */
export function getCrossWeekSpanFragments(
  span: CrossDaySpan,
  cellWidth: number,
  cellHeight: number,
  gap: number = 4
): Array<{ left: number; width: number; top: number; height: number; row: number }> {
  const fragments: Array<{ left: number; width: number; top: number; height: number; row: number }> = [];
  const barHeight = 24;

  const startRow = Math.floor(span.startColIndex / 7);
  const endRow = Math.floor(span.endColIndex / 7);
  const startCol = span.startColIndex % 7;
  const endCol = span.endColIndex % 7;

  for (let weekRow = startRow; weekRow <= endRow; weekRow++) {
    let fragStartCol = weekRow === startRow ? startCol : 0;
    let fragEndCol = weekRow === endRow ? endCol : 6;

    fragments.push({
      left: fragStartCol * (cellWidth + gap) + gap / 2,
      width: (fragEndCol - fragStartCol + 1) * cellWidth + (fragEndCol - fragStartCol) * gap - gap,
      top: weekRow * (cellHeight + gap) + 28 + span.rowIndex * (barHeight + 4),
      height: barHeight,
      row: weekRow,
    });
  }

  return fragments;
}