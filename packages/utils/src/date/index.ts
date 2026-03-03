import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
  parseISO,
  getDay,
  getWeek,
  getMonth,
  getYear,
  isWithinInterval,
  differenceInDays,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 导出所有 date-fns 函数
export * from 'date-fns';
export { zhCN };

/**
 * 获取指定日期所在周的范围
 * @param date 日期
 * @param weekStartsOn 周起始日 (0=周日, 1=周一)
 * @returns 周开始和结束日期
 */
export function getWeekRange(date: Date, weekStartsOn: 0 | 1 = 1) {
  const start = startOfWeek(date, { weekStartsOn, locale: zhCN });
  const end = endOfWeek(date, { weekStartsOn, locale: zhCN });
  return { start, end };
}

/**
 * 获取指定日期所在月的范围
 * @param date 日期
 * @returns 月开始和结束日期
 */
export function getMonthRange(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return { start, end };
}

/**
 * 获取指定日期所在季度的范围
 * @param date 日期
 * @returns 季度开始和结束日期
 */
export function getQuarterRange(date: Date) {
  const start = startOfQuarter(date);
  const end = endOfQuarter(date);
  return { start, end };
}

/**
 * 获取指定日期所在年的范围
 * @param date 日期
 * @年开始和结束日期
 */
export function getYearRange(date: Date) {
  const start = startOfYear(date);
  const end = endOfYear(date);
  return { start, end };
}

/**
 * 获取日历网格数据（7x6 网格）
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 日历网格日期数组
 */
export function getCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = endOfMonth(firstDay);
  
  // 获取日历起始日（上月末尾日期填充）
  const calendarStart = startOfWeek(firstDay, { weekStartsOn: 1, locale: zhCN });
  
  // 获取日历结束日（下月开头日期填充）
  const calendarEnd = endOfWeek(lastDay, { weekStartsOn: 1, locale: zhCN });
  
  // 生成日期数组
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param date 日期
 * @returns 格式化后的日期字符串
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * 格式化日期为中文格式
 * @param date 日期
 * @returns 格式化后的日期字符串
 */
export function formatDateCN(date: Date): string {
  return format(date, 'yyyy年MM月dd日', { locale: zhCN });
}

/**
 * 获取当前周是本年第几周
 * @param date 日期
 * @returns 周数
 */
export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 1, locale: zhCN });
}

/**
 * 判断日期是否在指定范围内
 * @param date 要检查的日期
 * @param start 开始日期
 * @param end 结束日期
 * @returns 是否在范围内
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end });
}

/**
 * 获取两个日期之间的所有日期
 * @param start 开始日期
 * @param end 结束日期
 * @returns 日期数组
 */
export function getDatesBetween(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

/**
 * 判断是否为周末
 * @param date 日期
 * @returns 是否为周末
 */
export function isWeekendDay(date: Date): boolean {
  return isWeekend(date);
}

/**
 * 获取日期是周几 (1-7, 周一为1)
 * @param date 日期
 * @returns 周几
 */
export function getDayOfWeek(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 7 : day;
}