import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isToday,
  isBefore,
  isAfter,
  isWithinInterval,
  getDay,
  getDaysInMonth,
  getWeek,
  getMonth,
  getYear,
  getQuarter,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isValid,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ==================== 格式化函数 ====================

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * 格式化日期为显示格式
 */
export function formatDateDisplay(date: Date | string, formatStr: string = 'yyyy年MM月dd日'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: zhCN });
}

/**
 * 格式化日期为简短格式
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MM/dd', { locale: zhCN });
}

/**
 * 格式化星期几
 */
export function formatWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE', { locale: zhCN });
}

/**
 * 格式化月份
 */
export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy年MM月', { locale: zhCN });
}

// ==================== 获取边界日期 ====================

/**
 * 获取今天的日期字符串
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * 获取周的第一天（周一）
 */
export function getWeekStart(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(d, { weekStartsOn: 1 });
}

/**
 * 获取周的最后一天（周日）
 */
export function getWeekEnd(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfWeek(d, { weekStartsOn: 1 });
}

/**
 * 获取月的第一天
 */
export function getMonthStart(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfMonth(d);
}

/**
 * 获取月的最后一天
 */
export function getMonthEnd(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfMonth(d);
}

/**
 * 获取年的第一天
 */
export function getYearStart(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfYear(d);
}

/**
 * 获取年的最后一天
 */
export function getYearEnd(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfYear(d);
}

/**
 * 获取季度的第一天
 */
export function getQuarterStart(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfQuarter(d);
}

/**
 * 获取季度的最后一天
 */
export function getQuarterEnd(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfQuarter(d);
}

// ==================== 日期计算 ====================

/**
 * 加天数
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addDays(d, days);
}

/**
 * 减天数
 */
export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return subDays(d, days);
}

/**
 * 加周数
 */
export function addWeeksToDate(date: Date | string, weeks: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addWeeks(d, weeks);
}

/**
 * 加月数
 */
export function addMonthsToDate(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addMonths(d, months);
}

/**
 * 加年数
 */
export function addYearsToDate(date: Date | string, years: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addYears(d, years);
}

// ==================== 日期比较 ====================

/**
 * 判断是否为今天
 */
export function isTodayDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDayDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(d1, d2);
}

/**
 * 判断是否为周末
 */
export function isWeekend(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const day = getDay(d);
  return day === 0 || day === 6; // 0=周日, 6=周六
}

/**
 * 判断日期是否在范围内
 */
export function isDateInRange(date: Date | string, start: Date | string, end: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return isWithinInterval(d, { start: s, end: e });
}

/**
 * 判断日期是否在另一个日期之前
 */
export function isDateBefore(date: Date | string, dateToCompare: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const dtc = typeof dateToCompare === 'string' ? parseISO(dateToCompare) : dateToCompare;
  return isBefore(d, dtc);
}

/**
 * 判断日期是否在另一个日期之后
 */
export function isDateAfter(date: Date | string, dateToCompare: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const dtc = typeof dateToCompare === 'string' ? parseISO(dateToCompare) : dateToCompare;
  return isAfter(d, dtc);
}

/**
 * 计算两个日期之间的天数差
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(d2, d1);
}

// ==================== 日历网格计算 ====================

/**
 * 获取日历网格数据（7x6 = 42个单元格）
 */
export function getCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1); // month 是 1-12
  const lastDay = endOfMonth(firstDay);

  // 获取日历起始日期（可能是上个月的日期）
  const calendarStart = startOfWeek(firstDay, { weekStartsOn: 1 });

  // 获取日历结束日期（可能是下个月的日期）
  const calendarEnd = endOfWeek(lastDay, { weekStartsOn: 1 });

  // 返回42个日期（6周）
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * 获取一周的所有日期
 */
export function getWeekDates(date: Date | string): Date[] {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const start = getWeekStart(d);
  const end = getWeekEnd(d);
  return eachDayOfInterval({ start, end });
}

/**
 * 获取一年中所有周的开始日期
 */
export function getYearWeeks(year: number): Date[] {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
}

/**
 * 获取季度的所有月份
 */
export function getQuarterMonths(year: number, quarter: 1 | 2 | 3 | 4): Date[] {
  const quarterStartMonth = (quarter - 1) * 3;
  const start = new Date(year, quarterStartMonth, 1);
  const end = new Date(year, quarterStartMonth + 2, 1);
  return eachMonthOfInterval({ start, end });
}

// ==================== 提取信息 ====================

/**
 * 获取年份
 */
export function extractYear(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getYear(d);
}

/**
 * 获取月份（1-12）
 */
export function extractMonth(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getMonth(d) + 1; // date-fns 返回 0-11，转换为 1-12
}

/**
 * 获取季度（1-4）
 */
export function extractQuarter(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getQuarter(d);
}

/**
 * 获取周数（一年中的第几周）
 */
export function extractWeekNumber(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getWeek(d, { weekStartsOn: 1 });
}

/**
 * 获取星期几（1-7，周一到周日）
 */
export function extractDayOfWeek(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const day = getDay(d);
  return day === 0 ? 7 : day; // 转换周日为7
}

/**
 * 获取月份的天数
 */
export function getDaysInMonthCount(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1));
}

// ==================== 历史待办计算 ====================

/**
 * 计算过期天数
 */
export function calculateOverdueDays(dueDate: string): number {
  const today = new Date();
  const due = parseISO(dueDate);
  if (isAfter(today, due)) {
    return differenceInDays(today, due);
  }
  return 0;
}

/**
 * 判断是否为历史待办任务
 * 定义：开始日期早于今天，且未完成
 */
export function isOverdueTask(startDate: string, status: string): boolean {
  if (status === 'completed') return false;
  const today = getTodayString();
  return isDateBefore(startDate, today);
}

// ==================== 验证 ====================

/**
 * 验证日期字符串是否有效
 */
export function isValidDateString(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch {
    return false;
  }
}

/**
 * 解析日期字符串为 Date 对象
 */
export function parseDateString(dateString: string): Date {
  return parseISO(dateString);
}
