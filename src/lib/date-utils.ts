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
  addHours,
  addMinutes,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInMinutes,
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
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
} from 'date-fns';
import { zhCN, enUS, Locale } from 'date-fns/locale';

// ==================== 类型定义 ====================

/** 日期输入类型：Date 对象、ISO 字符串、或时间戳 */
export type DateInput = Date | string | number;

/** 将输入转换为 Date 对象 */
export function toDate(date: DateInput): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);
  return parseISO(date);
}

// ==================== 格式化函数 ====================

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param date - 日期输入
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: DateInput): string {
  const d = toDate(date);
  return format(d, 'yyyy-MM-dd');
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm 格式
 * @param date - 日期输入
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: DateInput): string {
  const d = toDate(date);
  return format(d, 'yyyy-MM-dd HH:mm');
}

/**
 * 格式化时间为 HH:mm 格式
 * @param date - 日期输入
 * @returns 格式化后的时间字符串
 */
export function formatTime(date: DateInput): string {
  const d = toDate(date);
  return format(d, 'HH:mm');
}

/**
 * 格式化日期为 ISO 字符串（用于 API）
 * @param date - 日期输入
 * @returns ISO 8601 格式的日期时间字符串
 */
export function toISOString(date: DateInput): string {
  const d = toDate(date);
  return d.toISOString();
}

/**
 * 格式化日期为显示格式（根据 locale 自动切换）
 */
export function formatDateDisplay(date: DateInput, formatStr?: string, locale?: Locale): string {
  const d = toDate(date);
  if (formatStr) {
    return format(d, formatStr, { locale: locale || zhCN });
  }
  // 根据 locale 自动选择格式
  if (locale === enUS) {
    return format(d, 'MMMM d, yyyy', { locale: enUS });
  }
  return format(d, 'yyyy年MM月dd日', { locale: zhCN });
}

/**
 * 格式化日期为简短格式
 */
export function formatDateShort(date: DateInput, locale?: Locale): string {
  const d = toDate(date);
  return format(d, 'MM/dd', { locale: locale || zhCN });
}

/**
 * 格式化星期几
 */
export function formatWeekday(date: DateInput, locale?: Locale): string {
  const d = toDate(date);
  return format(d, 'EEEE', { locale: locale || zhCN });
}

/**
 * 格式化月份
 */
export function formatMonth(date: DateInput, locale?: Locale): string {
  const d = toDate(date);
  if (locale === enUS) {
    return format(d, 'MMMM yyyy', { locale: enUS });
  }
  return format(d, 'yyyy年MM月', { locale: locale || zhCN });
}

// ==================== 获取边界日期 ====================

/**
 * 获取今天的日期字符串
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * 获取当前时间（Date 对象）
 */
export function getNow(): Date {
  return new Date();
}

/**
 * 获取今天的开始时间（00:00:00）
 */
export function getTodayStart(): Date {
  return startOfDay(new Date());
}

/**
 * 获取今天的结束时间（23:59:59）
 */
export function getTodayEnd(): Date {
  return endOfDay(new Date());
}

/**
 * 获取周的第一天（周一）
 */
export function getWeekStart(date: DateInput): Date {
  const d = toDate(date);
  return startOfWeek(d, { weekStartsOn: 1 });
}

/**
 * 获取周的最后一天（周日）
 */
export function getWeekEnd(date: DateInput): Date {
  const d = toDate(date);
  return endOfWeek(d, { weekStartsOn: 1 });
}

/**
 * 获取月的第一天
 */
export function getMonthStart(date: DateInput): Date {
  const d = toDate(date);
  return startOfMonth(d);
}

/**
 * 获取月的最后一天
 */
export function getMonthEnd(date: DateInput): Date {
  const d = toDate(date);
  return endOfMonth(d);
}

/**
 * 获取年的第一天
 */
export function getYearStart(date: DateInput): Date {
  const d = toDate(date);
  return startOfYear(d);
}

/**
 * 获取年的最后一天
 */
export function getYearEnd(date: DateInput): Date {
  const d = toDate(date);
  return endOfYear(d);
}

/**
 * 获取季度的第一天
 */
export function getQuarterStart(date: DateInput): Date {
  const d = toDate(date);
  return startOfQuarter(d);
}

/**
 * 获取季度的最后一天
 */
export function getQuarterEnd(date: DateInput): Date {
  const d = toDate(date);
  return endOfQuarter(d);
}

// ==================== 时区感知辅助 ====================
//
// 实现说明：项目使用的 date-fns 4.1.0 未内置时区工具（TZDate/fromZonedTime），
// 这里基于标准 Intl.DateTimeFormat 实现墙钟时间与 UTC 绝对时刻的互转，
// 零额外依赖，浏览器 / Node / Cloudflare Edge 均可用。

/**
 * 校验 IANA 时区名，无效或缺失时返回 null（表示使用运行环境本地时区）
 */
export function normalizeTimeZone(timeZone?: string | null): string | null {
  if (!timeZone) return null;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return null;
  }
}

/** 取指定时区在某个 UTC 时刻的偏移量（毫秒）：本地墙钟 - UTC */
function tzOffsetAt(timeZone: string, utcMillis: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcMillis));
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  const asUTC = Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour) % 24, Number(map.minute), Number(map.second)
  );
  return asUTC - utcMillis;
}

/** 将"时区内的墙钟时间"转换为 UTC 绝对时刻（处理 DST 间隙的双次逼近） */
function wallClockToUtc(naiveUtcMillis: number, timeZone: string): Date {
  // Intl 偏移计算只有秒级精度：毫秒分量单独保留
  const ms = naiveUtcMillis % 1000;
  const whole = naiveUtcMillis - ms;
  // 第一遍：用近似偏移换算
  let ts = whole - tzOffsetAt(timeZone, whole);
  // 第二遍：用真实时刻处的偏移修正（DST 切换时刻附近一次逼近可能差 1 小时）
  ts = whole - tzOffsetAt(timeZone, ts);
  return new Date(ts + ms);
}

/** 取某 UTC 时刻在指定时区下的日历日（yyyy-MM-dd） */
export function zonedDateString(date: DateInput, timeZone?: string | null): string {
  const tz = normalizeTimeZone(timeZone);
  const d = toDate(date);
  if (!tz) return format(d, 'yyyy-MM-dd');
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return dtf.format(d); // en-CA 输出即 yyyy-MM-dd
}

/**
 * 获取"今天"的日期字符串（yyyy-MM-dd）
 * - 客户端调用（无参）：使用浏览器本地时区，即用户当前设备的"今天"
 * - 服务端调用（传入请求时区）：使用该时区的"今天"，与运行环境（UTC）无关
 */
export function localDateString(timeZone?: string | null): string {
  return zonedDateString(new Date(), timeZone);
}

/**
 * 指定日历日（yyyy-MM-dd）在指定时区的 00:00:00 对应的 UTC 绝对时刻。
 * 服务端用它构造按天查询边界；无时区参数时退化为运行环境本地时区。
 */
export function localDayStart(dateStr: string, timeZone?: string | null): Date {
  const tz = normalizeTimeZone(timeZone);
  if (!tz) return new Date(`${dateStr}T00:00:00`);
  return wallClockToUtc(Date.parse(`${dateStr}T00:00:00Z`), tz);
}

/**
 * 指定日历日在指定时区的 23:59:59.999 对应的 UTC 绝对时刻
 */
export function localDayEnd(dateStr: string, timeZone?: string | null): Date {
  const tz = normalizeTimeZone(timeZone);
  if (!tz) return new Date(`${dateStr}T23:59:59.999`);
  return wallClockToUtc(Date.parse(`${dateStr}T23:59:59.999Z`), tz);
}

/**
 * 指定时区的"今天 00:00"对应的 UTC 绝对时刻
 */
export function getTodayStartInTimeZone(timeZone?: string | null): Date {
  return localDayStart(localDateString(timeZone), timeZone);
}

/**
 * 指定时区的"今天 23:59:59.999"对应的 UTC 绝对时刻
 */
export function getTodayEndInTimeZone(timeZone?: string | null): Date {
  return localDayEnd(localDateString(timeZone), timeZone);
}

// ==================== 日期计算 ====================

/**
 * 加天数
 */
export function addDaysToDate(date: DateInput, days: number): Date {
  const d = toDate(date);
  return addDays(d, days);
}

/**
 * 减天数
 */
export function subtractDaysFromDate(date: DateInput, days: number): Date {
  const d = toDate(date);
  return subDays(d, days);
}

/**
 * 加周数
 */
export function addWeeksToDate(date: DateInput, weeks: number): Date {
  const d = toDate(date);
  return addWeeks(d, weeks);
}

/**
 * 加月数
 */
export function addMonthsToDate(date: DateInput, months: number): Date {
  const d = toDate(date);
  return addMonths(d, months);
}

/**
 * 加年数
 */
export function addYearsToDate(date: DateInput, years: number): Date {
  const d = toDate(date);
  return addYears(d, years);
}

/**
 * 加小时
 */
export function addHoursToDate(date: DateInput, hours: number): Date {
  const d = toDate(date);
  return addHours(d, hours);
}

/**
 * 加分钟
 */
export function addMinutesToDate(date: DateInput, minutes: number): Date {
  const d = toDate(date);
  return addMinutes(d, minutes);
}

/**
 * 设置时间（小时和分钟）
 */
export function setTime(date: DateInput, hours: number, minutes: number): Date {
  const d = toDate(date);
  return setMinutes(setHours(d, hours), minutes);
}

/**
 * 获取小时
 */
export function extractHours(date: DateInput): number {
  const d = toDate(date);
  return getHours(d);
}

/**
 * 获取分钟
 */
export function extractMinutes(date: DateInput): number {
  const d = toDate(date);
  return getMinutes(d);
}

// ==================== 日期比较 ====================

/**
 * 判断是否为今天
 */
export function isTodayDate(date: DateInput): boolean {
  const d = toDate(date);
  return isToday(d);
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDayDate(date1: DateInput, date2: DateInput): boolean {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  return isSameDay(d1, d2);
}

/**
 * 判断是否为周末
 */
export function isWeekend(date: DateInput): boolean {
  const d = toDate(date);
  const day = getDay(d);
  return day === 0 || day === 6; // 0=周日, 6=周六
}

/**
 * 判断日期是否在范围内
 */
export function isDateInRange(date: DateInput, start: DateInput, end: DateInput): boolean {
  const d = toDate(date);
  const s = toDate(start);
  const e = toDate(end);
  return isWithinInterval(d, { start: s, end: e });
}

/**
 * 判断日期是否在另一个日期之前
 */
export function isDateBefore(date: DateInput, dateToCompare: DateInput): boolean {
  const d = toDate(date);
  const dtc = toDate(dateToCompare);
  return isBefore(d, dtc);
}

/**
 * 判断日期是否在另一个日期之后
 */
export function isDateAfter(date: DateInput, dateToCompare: DateInput): boolean {
  const d = toDate(date);
  const dtc = toDate(dateToCompare);
  return isAfter(d, dtc);
}

/**
 * 计算两个日期之间的天数差
 */
export function getDaysDifference(date1: DateInput, date2: DateInput): number {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  return differenceInDays(d2, d1);
}

/**
 * 计算两个时间之间的分钟差
 */
export function getMinutesDifference(date1: DateInput, date2: DateInput): number {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  return differenceInMinutes(d2, d1);
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
export function getWeekDates(date: DateInput): Date[] {
  const d = toDate(date);
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
export function extractYear(date: DateInput): number {
  const d = toDate(date);
  return getYear(d);
}

/**
 * 获取月份（1-12）
 */
export function extractMonth(date: DateInput): number {
  const d = toDate(date);
  return getMonth(d) + 1; // date-fns 返回 0-11，转换为 1-12
}

/**
 * 获取季度（1-4）
 */
export function extractQuarter(date: DateInput): number {
  const d = toDate(date);
  return getQuarter(d);
}

/**
 * 获取周数（一年中的第几周）
 */
export function extractWeekNumber(date: DateInput): number {
  const d = toDate(date);
  return getWeek(d, { weekStartsOn: 1 });
}

/**
 * 获取星期几（1-7，周一到周日）
 */
export function extractDayOfWeek(date: DateInput): number {
  const d = toDate(date);
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
export function calculateOverdueDays(dueDate: DateInput): number {
  const today = new Date();
  const due = toDate(dueDate);
  if (isAfter(today, due)) {
    return differenceInDays(today, due);
  }
  return 0;
}

/**
 * 判断是否为历史待办任务
 * 定义：开始日期早于今天，且未完成
 */
export function isOverdueTask(startDate: DateInput, status: string): boolean {
  if (status === 'completed') return false;
  const today = getTodayStart();
  const start = toDate(startDate);
  return isDateBefore(start, today);
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

// ==================== 提醒相关 ====================

/**
 * 计算提醒时间（基于截止时间和提前分钟数）
 */
export function calculateReminderTime(dueDate: DateInput, offsetMinutes: number): Date {
  const d = toDate(dueDate);
  return addMinutes(subDays(d, 0), -offsetMinutes); // 提前 offsetMinutes 分钟
}

/**
 * 检查提醒是否应该发送
 * 提醒时间统一存储为 UTC 绝对时刻，这里只做 UTC 比较：
 * 提醒时刻到达（<= 当前时刻）即应发送。
 */
export function shouldSendReminder(remindAt: DateInput): boolean {
  const now = new Date();
  const remind = toDate(remindAt);
  return isBefore(remind, now) || remind.getTime() === now.getTime();
}
