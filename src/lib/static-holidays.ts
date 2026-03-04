// 中国法定节假日数据
// 当外部 API 不可用时使用此数据
// 数据来源：国务院办公厅关于2026年部分节假日安排的通知

interface StaticHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  isHoliday: boolean; // true=休息日, false=调休工作日
}

// 2025年中国法定节假日
const holidays2025: StaticHoliday[] = [
  // 元旦
  { date: '2025-01-01', name: '元旦', isHoliday: true },
  
  // 春节
  { date: '2025-01-26', name: '春节调休', isHoliday: false },
  { date: '2025-01-27', name: '春节调休', isHoliday: false },
  { date: '2025-01-28', name: '除夕', isHoliday: true },
  { date: '2025-01-29', name: '春节', isHoliday: true },
  { date: '2025-01-30', name: '春节', isHoliday: true },
  { date: '2025-01-31', name: '春节', isHoliday: true },
  { date: '2025-02-01', name: '春节', isHoliday: true },
  { date: '2025-02-02', name: '春节', isHoliday: true },
  { date: '2025-02-03', name: '春节', isHoliday: true },
  { date: '2025-02-04', name: '春节', isHoliday: true },
  { date: '2025-02-08', name: '春节调休', isHoliday: false },
  
  // 清明节
  { date: '2025-04-04', name: '清明节', isHoliday: true },
  { date: '2025-04-05', name: '清明节', isHoliday: true },
  { date: '2025-04-06', name: '清明节', isHoliday: true },
  
  // 劳动节
  { date: '2025-04-27', name: '劳动节调休', isHoliday: false },
  { date: '2025-05-01', name: '劳动节', isHoliday: true },
  { date: '2025-05-02', name: '劳动节', isHoliday: true },
  { date: '2025-05-03', name: '劳动节', isHoliday: true },
  { date: '2025-05-04', name: '劳动节', isHoliday: true },
  { date: '2025-05-05', name: '劳动节', isHoliday: true },
  
  // 端午节 (2025年农历五月初五 = 5月31日)
  { date: '2025-05-31', name: '端午节', isHoliday: true },
  { date: '2025-06-01', name: '端午节', isHoliday: true },
  { date: '2025-06-02', name: '端午节', isHoliday: true },
  
  // 中秋节、国庆节
  { date: '2025-09-28', name: '国庆调休', isHoliday: false },
  { date: '2025-10-01', name: '国庆节', isHoliday: true },
  { date: '2025-10-02', name: '国庆节', isHoliday: true },
  { date: '2025-10-03', name: '国庆节', isHoliday: true },
  { date: '2025-10-04', name: '中秋节', isHoliday: true },
  { date: '2025-10-05', name: '国庆节', isHoliday: true },
  { date: '2025-10-06', name: '国庆节', isHoliday: true },
  { date: '2025-10-07', name: '国庆节', isHoliday: true },
  { date: '2025-10-08', name: '国庆节', isHoliday: true },
  { date: '2025-10-11', name: '国庆调休', isHoliday: false },
];

// 2026年中国法定节假日
// 参考：国务院办公厅通知
const holidays2026: StaticHoliday[] = [
  // 元旦 (1月1日周四，放假1月1日-3日)
  { date: '2026-01-01', name: '元旦', isHoliday: true },
  { date: '2026-01-02', name: '元旦', isHoliday: true },
  { date: '2026-01-03', name: '元旦', isHoliday: true },
  { date: '2026-01-04', name: '元旦调休', isHoliday: false },  // 周日调休
  { date: '2026-01-25', name: '元旦调休', isHoliday: false },  // 周六调休
  
  // 春节 (农历正月初一 = 2月17日，除夕 = 2月16日)
  // 放假：2月16日(除夕) - 2月22日(初六)，共7天
  // 调休：2月15日(周日)、2月28日(周六)、3月1日(周日)上班
  { date: '2026-02-15', name: '春节调休', isHoliday: false },  // 周日调休
  { date: '2026-02-16', name: '除夕', isHoliday: true },
  { date: '2026-02-17', name: '春节', isHoliday: true },
  { date: '2026-02-18', name: '春节', isHoliday: true },
  { date: '2026-02-19', name: '春节', isHoliday: true },
  { date: '2026-02-20', name: '春节', isHoliday: true },
  { date: '2026-02-21', name: '春节', isHoliday: true },
  { date: '2026-02-22', name: '春节', isHoliday: true },
  { date: '2026-02-28', name: '春节调休', isHoliday: false },  // 周六调休
  { date: '2026-03-01', name: '春节调休', isHoliday: false },  // 周日调休
  
  // 清明节 (4月5日周一)
  // 放假：4月4日(周日) - 4月6日(周二)，共3天
  { date: '2026-04-04', name: '清明节', isHoliday: true },  // 周日
  { date: '2026-04-05', name: '清明节', isHoliday: true },  // 周一
  { date: '2026-04-06', name: '清明节', isHoliday: true },  // 周二
  
  // 劳动节 (5月1日周五)
  // 放假：5月1日 - 5月5日，共5天
  // 调休：4月26日(周日)、5月9日(周六)上班
  { date: '2026-04-26', name: '劳动节调休', isHoliday: false },  // 周日调休
  { date: '2026-05-01', name: '劳动节', isHoliday: true },
  { date: '2026-05-02', name: '劳动节', isHoliday: true },
  { date: '2026-05-03', name: '劳动节', isHoliday: true },
  { date: '2026-05-04', name: '劳动节', isHoliday: true },
  { date: '2026-05-05', name: '劳动节', isHoliday: true },
  { date: '2026-05-09', name: '劳动节调休', isHoliday: false },  // 周六调休
  
  // 端午节 (农历五月初五 = 6月19日周五)
  // 放假：6月19日 - 6月21日，共3天
  { date: '2026-06-19', name: '端午节', isHoliday: true },  // 周五
  { date: '2026-06-20', name: '端午节', isHoliday: true },  // 周六
  { date: '2026-06-21', name: '端午节', isHoliday: true },  // 周日
  
  // 中秋节、国庆节
  // 中秋节 (农历八月十五 = 9月25日周五)
  // 国庆节 10月1日-7日
  // 合并放假：10月1日 - 10月8日，共8天
  // 调休：9月27日(周日)、10月10日(周六)上班
  { date: '2026-09-27', name: '国庆调休', isHoliday: false },  // 周日调休
  { date: '2026-10-01', name: '国庆节', isHoliday: true },
  { date: '2026-10-02', name: '国庆节', isHoliday: true },
  { date: '2026-10-03', name: '国庆节', isHoliday: true },
  { date: '2026-10-04', name: '中秋节', isHoliday: true },  // 农历八月十五
  { date: '2026-10-05', name: '国庆节', isHoliday: true },
  { date: '2026-10-06', name: '国庆节', isHoliday: true },
  { date: '2026-10-07', name: '国庆节', isHoliday: true },
  { date: '2026-10-08', name: '国庆节', isHoliday: true },
  { date: '2026-10-10', name: '国庆调休', isHoliday: false },  // 周六调休
];

// 按年份组织数据
export const staticHolidays: Record<number, StaticHoliday[]> = {
  2025: holidays2025,
  2026: holidays2026,
};

/**
 * 获取指定年份的静态节假日数据
 */
export function getStaticHolidaysForYear(year: number): StaticHoliday[] {
  return staticHolidays[year] || [];
}

/**
 * 获取指定日期的节假日信息
 */
export function getStaticHolidayInfo(date: string): StaticHoliday | null {
  const year = parseInt(date.split('-')[0], 10);
  const holidays = staticHolidays[year];
  if (!holidays) return null;
  return holidays.find(h => h.date === date) || null;
}
