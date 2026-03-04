import { db } from './db';
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

interface YearHolidaysApiResponse {
  code: number;
  holidays: Array<{
    date: string;
    name: string;
    holiday: boolean;
  }>;
}

const HOLIDAY_API_BASE = 'https://timor.tech/api/holiday';

/**
 * 从 API 获取单日节假日信息
 */
async function fetchHolidayFromApi(date: string): Promise<{ isHoliday: boolean; name: string } | null> {
  try {
    const response = await fetch(`${HOLIDAY_API_BASE}/${date}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (!response.ok) {
      return null;
    }

    const data: HolidayApiResponse = await response.json();

    if (data.code === 0 && data.holiday) {
      return {
        isHoliday: data.holiday.holiday,
        name: data.holiday.name || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch holiday from API:', error);
    return null;
  }
}

/**
 * 从 API 获取整年节假日信息
 */
async function fetchYearHolidaysFromApi(year: number): Promise<Array<{ date: string; name: string; isHoliday: boolean }>> {
  try {
    const response = await fetch(`${HOLIDAY_API_BASE}/year/${year}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (!response.ok) {
      return [];
    }

    const data: YearHolidaysApiResponse = await response.json();

    if (data.code === 0 && data.holidays) {
      return data.holidays.map(h => ({
        date: h.date,
        name: h.name,
        isHoliday: h.holiday,
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch year holidays from API:', error);
    return [];
  }
}

/**
 * 获取指定日期的节假日信息
 */
export async function getHolidayInfo(date: string): Promise<{ isHoliday: boolean; name: string } | null> {
  const year = extractYear(date);

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
 */
export async function getYearHolidays(year: number): Promise<Map<string, { isHoliday: boolean; name: string }>> {
  const result = new Map<string, { isHoliday: boolean; name: string }>();

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
    return result;
  }

  // 优先使用静态节假日数据（确保有数据可用）
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
    return result;
  }

  // 如果静态数据也没有，尝试从 API 获取
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
  }

  return result;
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
