import { parseExpression } from 'cron-parser';
import { formatDate, parseDateString, isDateBefore, isDateAfter, isSameDayDate } from './date-utils';
import type { Frequency } from '@/types';

// ==================== Cron 表达式工具 ====================

/**
 * 解析 cron 表达式并获取指定范围内的执行日期
 */
export function getCronDates(
  cronExpr: string,
  startDate: Date,
  endDate: Date
): Date[] {
  try {
    const interval = parseExpression(cronExpr, {
      currentDate: startDate,
      endDate: endDate,
    });

    const dates: Date[] = [];
    while (true) {
      try {
        const next = interval.next();
        dates.push(next.toDate());
      } catch {
        break;
      }
    }
    return dates;
  } catch (error) {
    console.error('Invalid cron expression:', error);
    return [];
  }
}

/**
 * 验证 cron 表达式是否有效
 */
export function isValidCronExpression(cronExpr: string): boolean {
  try {
    parseExpression(cronExpr);
    return true;
  } catch {
    return false;
  }
}

// ==================== 预设频率转换 ====================

/**
 * 将预设频率转换为 cron 表达式
 */
export function frequencyToCron(
  frequency: Frequency,
  interval: number = 1,
  byDay?: number[]
): string {
  switch (frequency) {
    case 'DAILY':
      // 每N天执行一次，默认在每天的0点
      return `0 0 */${interval} * *`;

    case 'WEEKLY':
      // 每周的指定几天执行
      if (byDay && byDay.length > 0) {
        // cron 中 0=周日, 1=周一... 我们的定义: 0=周日, 1=周一...
        const days = byDay.join(',');
        return `0 0 * * ${days}`;
      }
      // 默认每周一次
      return `0 0 * * 1/${interval}`;

    case 'MONTHLY':
      // 每N个月的第1天执行
      return `0 0 1 */${interval} *`;

    case 'YEARLY':
      // 每年的1月1日执行
      return `0 0 1 1 */${interval}`;

    case 'CUSTOM':
      // 自定义，需要直接提供 cron 表达式
      throw new Error('CUSTOM frequency requires a cron expression');

    default:
      return '0 0 * * *'; // 默认每天
  }
}

/**
 * 根据周期规则计算指定时间窗口内的执行日期
 */
export function calculateOccurrenceDates(
  rule: {
    frequency: Frequency;
    interval: number;
    byDay?: number[] | null;
    cronExpr?: string | null;
    startDate: string;
    endDate?: string | null;
  },
  windowStart: Date,
  windowEnd: Date
): Date[] {
  const ruleStartDate = parseDateString(rule.startDate);
  const ruleEndDate = rule.endDate ? parseDateString(rule.endDate) : null;

  // 确定有效的开始和结束日期
  const effectiveStart = isDateAfter(ruleStartDate, windowStart) ? ruleStartDate : windowStart;
  const effectiveEnd = ruleEndDate && isDateBefore(ruleEndDate, windowEnd) ? ruleEndDate : windowEnd;

  // 如果有效范围无效，返回空数组
  if (isDateAfter(effectiveStart, effectiveEnd)) {
    return [];
  }

  let cronExpr: string;

  if (rule.frequency === 'CUSTOM' && rule.cronExpr) {
    cronExpr = rule.cronExpr;
  } else {
    cronExpr = frequencyToCron(rule.frequency, rule.interval, rule.byDay || undefined);
  }

  return getCronDates(cronExpr, effectiveStart, effectiveEnd);
}

// ==================== 用户友好的频率描述 ====================

/**
 * 获取频率的中文描述
 */
export function getFrequencyDescription(
  frequency: Frequency,
  interval: number = 1,
  byDay?: number[] | null
): string {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  switch (frequency) {
    case 'DAILY':
      return interval === 1 ? '每天' : `每${interval}天`;

    case 'WEEKLY':
      if (byDay && byDay.length > 0) {
        const days = byDay.map(d => dayNames[d]).join('、');
        return `每${interval}周的${days}`;
      }
      return interval === 1 ? '每周' : `每${interval}周`;

    case 'MONTHLY':
      return interval === 1 ? '每月' : `每${interval}个月`;

    case 'YEARLY':
      return interval === 1 ? '每年' : `每${interval}年`;

    case 'CUSTOM':
      return '自定义周期';

    default:
      return '未知频率';
  }
}

// ==================== 快速预设 ====================

export const QUICK_PRESETS = [
  { label: '每天', frequency: 'DAILY' as Frequency, interval: 1 },
  { label: '工作日', frequency: 'WEEKLY' as Frequency, interval: 1, byDay: [1, 2, 3, 4, 5] },
  { label: '周末', frequency: 'WEEKLY' as Frequency, interval: 1, byDay: [0, 6] },
  { label: '每周', frequency: 'WEEKLY' as Frequency, interval: 1 },
  { label: '每月', frequency: 'MONTHLY' as Frequency, interval: 1 },
  { label: '每年', frequency: 'YEARLY' as Frequency, interval: 1 },
];
