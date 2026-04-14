import { getDb } from './db';
import { extractYear } from './date-utils';
import { getStaticHolidaysForYear } from './static-holidays';

// 节假日 API 接口
interface HolidayApiResponse {
  code: number;
  holiday: {
    holiday: boolean;
    name?: string;
    wage?: number;
    date?: string;
  };
}

// 主 API (timor.tech)，备选 API (ailcc.com)
const HOLIDAY_API_BASE_PRIMARY = 'https://timor.tech/api/holiday';
const HOLIDAY_API_BASE_FALLBACK = 'https://holiday.ailcc.com/api/holiday';

/**
 * 检查是否需要预加载下一年的节假日数据
 * 国务院一般在 10 月下旬到 12 月上旬发布下一年的安排
 */
export function shouldPreloadNextYear(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  // 10月、11月、12月期间，预加载下一年的数据
  return month >= 10 && month <= 12;
}

/**
 * 从 API 获取单日节假日信息
 */
async function fetchHolidayFromApi(date: string): Promise<{ isHoliday: boolean; name: string } | null> {
  // 先尝试主 API
  try {
    const response = await fetch(`${HOLIDAY_API_BASE_PRIMARY}/${date}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (response.ok) {
      const data: HolidayApiResponse = await response.json();

      if (data.code === 0 && data.holiday) {
        return {
          isHoliday: data.holiday.holiday,
          name: data.holiday.name || '',
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch holiday from primary API:', error);
  }

  // 主 API 失败，尝试备选 API
  try {
    const response = await fetch(`${HOLIDAY_API_BASE_FALLBACK}/${date}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (response.ok) {
      const data: HolidayApiResponse = await response.json();

      if (data.code === 0 && data.holiday) {
        return {
          isHoliday: data.holiday.holiday,
          name: data.holiday.name || '',
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch holiday from fallback API:', error);
  }

  return null;
}

/**
 * 从 API 获取整年节假日信息
 * API 返回格式：{ code: 0, holiday: { "01-01": {...}, ... } }
 */
async function fetchYearHolidaysFromApi(year: number): Promise<Array<{ date: string; name: string; isHoliday: boolean }>> {
  // 先尝试主 API
  try {
    const response = await fetch(`${HOLIDAY_API_BASE_PRIMARY}/year/${year}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (response.ok) {
      const data = await response.json() as { code?: number; holiday?: Record<string, { holiday: boolean; name: string; date: string }> };

      // API 返回格式：{ code: 0, holiday: { "01-01": {...}, ... } }
      if (data.code === 0 && data.holiday) {
        const holidays: Array<{ date: string; name: string; isHoliday: boolean }> = [];
        for (const [, value] of Object.entries(data.holiday)) {
          const h = value;
          holidays.push({
            date: h.date,
            name: h.name,
            isHoliday: h.holiday,
          });
        }
        return holidays;
      }
    }
  } catch (error) {
    console.error('Failed to fetch year holidays from primary API:', error);
  }

  // 主 API 失败，尝试备选 API
  try {
    const response = await fetch(`${HOLIDAY_API_BASE_FALLBACK}/year/${year}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (response.ok) {
      const data = await response.json() as { code?: number; holiday?: Record<string, { holiday: boolean; name: string; date: string }> };

      // API 返回格式：{ code: 0, holiday: { "01-01": {...}, ... } }
      if (data.code === 0 && data.holiday) {
        const holidays: Array<{ date: string; name: string; isHoliday: boolean }> = [];
        for (const [, value] of Object.entries(data.holiday)) {
          const h = value;
          holidays.push({
            date: h.date,
            name: h.name,
            isHoliday: h.holiday,
          });
        }
        return holidays;
      }
    }
  } catch (error) {
    console.error('Failed to fetch year holidays from fallback API:', error);
  }

  return [];
}

/**
 * 获取指定日期的节假日信息
 */
export async function getHolidayInfo(date: string): Promise<{ isHoliday: boolean; name: string } | null> {
  const year = extractYear(date);
  const db = await getDb();

  // 先从数据库缓存查找
  const cached = await db.holiday.findUnique({
    where: { date },
  });

  if (cached) {
    return {
      isHoliday: cached.isHoliday,
      name: cached.name,
    };
  }

  // 从 API 获取
  const apiData = await fetchHolidayFromApi(date);

  if (apiData) {
    // 缓存到数据库
    await db.holiday.create({
      data: {
        date,
        name: apiData.name,
        isHoliday: apiData.isHoliday,
        year,
      },
    }).catch(() => {
      // 忽略重复键错误
    });

    return apiData;
  }

  return null;
}

/**
 * 批量获取指定年份的所有节假日信息
 * 优先级：数据库缓存 → 外部 API → 静态数据（兜底）
 *
 * 同时会在 10-12 月期间自动检查下一年的数据是否可用
 */
export async function getYearHolidays(year: number): Promise<Map<string, { isHoliday: boolean; name: string }>> {
  const result = new Map<string, { isHoliday: boolean; name: string }>();
  const db = await getDb();

  // 先从数据库缓存查找
  const cached = await db.holiday.findMany({
    where: { year },
  });

  if (cached.length > 0) {
    for (const h of cached) {
      result.set(h.date, {
        isHoliday: h.isHoliday,
        name: h.name,
      });
    }

    // 后台异步检查下一年的数据（不阻塞当前请求）
    checkAndPreloadNextYear().catch(() => {});

    return result;
  }

  // 数据库没有数据，尝试从外部 API 获取
  const apiData = await fetchYearHolidaysFromApi(year);

  if (apiData.length > 0) {
    // 批量缓存到数据库
    const createPromises = apiData.map(h =>
      db.holiday.create({
        data: {
          date: h.date,
          name: h.name,
          isHoliday: h.isHoliday,
          year,
        },
      }).catch(() => {
        // 忽略重复键错误
      })
    );

    await Promise.all(createPromises);

    for (const h of apiData) {
      result.set(h.date, {
        isHoliday: h.isHoliday,
        name: h.name,
      });
    }

    // 后台异步检查下一年的数据
    checkAndPreloadNextYear().catch(() => {});

    return result;
  }

  // 如果 API 获取失败，使用静态数据作为兜底
  const staticData = getStaticHolidaysForYear(year);
  if (staticData.length > 0) {
    // 批量缓存到数据库
    const createPromises = staticData.map(h =>
      db.holiday.create({
        data: {
          date: h.date,
          name: h.name,
          isHoliday: h.isHoliday,
          year,
        },
      }).catch(() => {
        // 忽略重复键错误
      })
    );

    await Promise.all(createPromises);

    for (const h of staticData) {
      result.set(h.date, {
        isHoliday: h.isHoliday,
        name: h.name,
      });
    }
  }

  return result;
}

/**
 * 强制刷新指定年份的节假日数据（从 API 获取最新数据）
 * 用于手动触发更新
 */
export async function refreshYearHolidays(year: number): Promise<{ success: boolean; count: number; source: string }> {
  const db = await getDb();

  // 先删除旧数据
  await db.holiday.deleteMany({
    where: { year },
  });

  // 尝试从 API 获取
  const apiData = await fetchYearHolidaysFromApi(year);

  if (apiData.length > 0) {
    // 批量插入新数据
    for (const h of apiData) {
      await db.holiday.create({
        data: {
          date: h.date,
          name: h.name,
          isHoliday: h.isHoliday,
          year,
        },
      }).catch(() => {});
    }
    return { success: true, count: apiData.length, source: 'api' };
  }

  // API 失败，使用静态数据
  const staticData = getStaticHolidaysForYear(year);
  if (staticData.length > 0) {
    for (const h of staticData) {
      await db.holiday.create({
        data: {
          date: h.date,
          name: h.name,
          isHoliday: h.isHoliday,
          year,
        },
      }).catch(() => {});
    }
    return { success: true, count: staticData.length, source: 'static' };
  }

  return { success: false, count: 0, source: 'none' };
}

/**
 * 后台检查并预加载下一年的节假日数据
 * 在 10-12 月期间，如果下一年的数据不可用，尝试从 API 获取
 * 获取成功后存入数据库，后续就不再重复调用
 */
export async function checkAndPreloadNextYear(): Promise<{ checked: boolean; loaded: boolean; year?: number }> {
  // 只在 10-12 月期间检查
  if (!shouldPreloadNextYear()) {
    return { checked: false, loaded: false };
  }

  const nextYear = new Date().getFullYear() + 1;
  const db = await getDb();

  // 检查下一年是否已有数据
  const count = await db.holiday.count({
    where: { year: nextYear },
  });

  // 如果已有数据，跳过
  if (count > 0) {
    return { checked: true, loaded: false, year: nextYear };
  }

  // 没有数据，尝试从 API 获取
  console.log(`[Holiday] Checking next year holidays for ${nextYear}...`);
  const apiData = await fetchYearHolidaysFromApi(nextYear);

  if (apiData.length > 0) {
    // 存入数据库
    for (const h of apiData) {
      await db.holiday.create({
        data: {
          date: h.date,
          name: h.name,
          isHoliday: h.isHoliday,
          year: nextYear,
        },
      }).catch(() => {});
    }
    console.log(`[Holiday] Loaded ${apiData.length} holidays for year ${nextYear} from API`);
    return { checked: true, loaded: true, year: nextYear };
  }

  // API 也没有数据，使用静态数据（如果有的话）
  const staticData = getStaticHolidaysForYear(nextYear);
  if (staticData.length > 0) {
    for (const h of staticData) {
      await db.holiday.create({
        data: {
          date: h.date,
          name: h.name,
          isHoliday: h.isHoliday,
          year: nextYear,
        },
      }).catch(() => {});
    }
    console.log(`[Holiday] Loaded ${staticData.length} holidays for year ${nextYear} from static data`);
    return { checked: true, loaded: true, year: nextYear };
  }

  return { checked: true, loaded: false, year: nextYear };
}

/**
 * 获取多个月的节假日信息
 */
export async function getHolidaysForMonths(year: number, months: number[]): Promise<Map<string, { isHoliday: boolean; name: string }>> {
  const result = new Map<string, { isHoliday: boolean; name: string }>();

  // 获取整年数据
  const yearHolidays = await getYearHolidays(year);

  // 筛选指定月份
  for (const [date, info] of yearHolidays) {
    const month = parseInt(date.split('-')[1], 10);
    if (months.includes(month)) {
      result.set(date, info);
    }
  }

  return result;
}

/**
 * 判断指定日期是否为休息日（节假日或周末）
 */
export async function isRestDay(date: string): Promise<boolean> {
  // 先检查节假日
  const holidayInfo = await getHolidayInfo(date);

  if (holidayInfo) {
    // 如果是调休的工作日，返回 false
    if (!holidayInfo.isHoliday) {
      return false;
    }
    return holidayInfo.isHoliday;
  }

  // 否则检查周末
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * 预加载节假日数据（用于年度视图等需要大量日期的场景）
 */
export async function preloadHolidays(year: number): Promise<void> {
  await getYearHolidays(year);
}
