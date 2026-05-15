export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getYearHolidays, checkAndPreloadNextYear, refreshYearHolidays } from '@/lib/holiday-service';
import { getD1Client, IS_EDGE } from '@/lib/d1';
import { getStaticHolidaysForYear } from '@/lib/static-holidays';

// GET /api/holidays - 获取年度节假日数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const action = searchParams.get('action');

    // 检查并预加载下一年的数据
    if (action === 'preload') {
      if (IS_EDGE) {
        const d1 = await getD1Client();
        const now = new Date();
        const month = now.getMonth() + 1;
        if (month < 10 || month > 12) {
          return NextResponse.json({
            success: true,
            data: { checked: false, loaded: false },
          });
        }

        const nextYear = now.getFullYear() + 1;
        const existing = await d1.first<{ count: number }>(
          'SELECT COUNT(*) as count FROM holidays WHERE year = ?',
          nextYear
        );

        if ((existing?.count ?? 0) > 0) {
          return NextResponse.json({
            success: true,
            data: { checked: true, loaded: false, year: nextYear },
          });
        }

        // 尝试从外部 API 获取下一年节假日
        // 由于 holiday-service 内部使用 Prisma，这里直接用静态数据作为兜底
        const staticData = getStaticHolidaysForYear(nextYear);
        if (staticData.length > 0) {
          for (const h of staticData) {
            await d1.run(
              'INSERT INTO holidays (id, date, name, isHoliday, year, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
              crypto.randomUUID(), h.date, h.name, h.isHoliday ? 1 : 0, nextYear, new Date().toISOString()
            ).catch(() => {});
          }
          return NextResponse.json({
            success: true,
            data: { checked: true, loaded: true, year: nextYear },
          });
        }

        return NextResponse.json({
          success: true,
          data: { checked: true, loaded: false, year: nextYear },
        });
      }

      const result = await checkAndPreloadNextYear();
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // 强制刷新指定年份的数据
    if (action === 'refresh') {
      if (IS_EDGE) {
        const d1 = await getD1Client();

        // 删除旧数据
        await d1.run('DELETE FROM holidays WHERE year = ?', year);

        // 尝试从外部 API 获取（通过 fetch 直接调用）
        let holidays: Array<{ date: string; name: string; isHoliday: boolean }> = [];
        try {
          const response = await fetch(`https://timor.tech/api/holiday/year/${year}`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
          });
          if (response.ok) {
            const data = await response.json() as { code?: number; holiday?: Record<string, { holiday: boolean; name: string; date: string }> };
            if (data.code === 0 && data.holiday) {
              holidays = Object.values(data.holiday).map((h) => ({
                date: h.date,
                name: h.name,
                isHoliday: h.holiday,
              }));
            }
          }
        } catch (e) {
          console.error('Failed to fetch holidays from API:', e);
        }

        // 如果 API 失败，使用静态数据
        if (holidays.length === 0) {
          holidays = getStaticHolidaysForYear(year);
        }

        let source = 'api';
        if (holidays.length === 0) {
          source = 'none';
        } else if (holidays[0]?.date?.startsWith(year.toString()) === false) {
          source = 'static';
        }

        // 批量插入新数据
        for (const h of holidays) {
          await d1.run(
            'INSERT INTO holidays (id, date, name, isHoliday, year, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            crypto.randomUUID(), h.date, h.name, h.isHoliday ? 1 : 0, year, new Date().toISOString()
          ).catch(() => {});
        }

        return NextResponse.json({
          success: holidays.length > 0,
          data: { success: holidays.length > 0, count: holidays.length, source },
        });
      }

      const result = await refreshYearHolidays(year);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // 获取年度数据
    if (IS_EDGE) {
      const d1 = await getD1Client();
      const rows = await d1.all<{ date: string; name: string; isHoliday: number }>(
        'SELECT date, name, isHoliday FROM holidays WHERE year = ?',
        year
      );

      if (rows.length > 0) {
        const holidayArray = rows.map((row) => ({
          date: row.date,
          name: row.name,
          isHoliday: Boolean(row.isHoliday),
        }));

        return NextResponse.json({
          success: true,
          data: holidayArray,
        });
      }

      // 数据库没有数据，尝试从外部 API 获取并缓存
      let holidays: Array<{ date: string; name: string; isHoliday: boolean }> = [];
      try {
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const data = await response.json() as { code?: number; holiday?: Record<string, { holiday: boolean; name: string; date: string }> };
          if (data.code === 0 && data.holiday) {
            holidays = Object.values(data.holiday).map((h) => ({
              date: h.date,
              name: h.name,
              isHoliday: h.holiday,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to fetch holidays from API:', e);
      }

      // 如果 API 失败，使用静态数据作为兜底
      if (holidays.length === 0) {
        holidays = getStaticHolidaysForYear(year);
      }

      // 缓存到 D1
      for (const h of holidays) {
        await d1.run(
          'INSERT INTO holidays (id, date, name, isHoliday, year, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          crypto.randomUUID(), h.date, h.name, h.isHoliday ? 1 : 0, year, new Date().toISOString()
        ).catch(() => {});
      }

      const holidayArray = holidays.map((h) => ({
        date: h.date,
        name: h.name,
        isHoliday: h.isHoliday,
      }));

      return NextResponse.json({
        success: true,
        data: holidayArray,
      });
    }

    const holidays = await getYearHolidays(year);

    // 转换为数组格式
    const holidayArray = Array.from(holidays.entries()).map(([date, info]) => ({
      date,
      name: info.name,
      isHoliday: info.isHoliday,
    }));

    return NextResponse.json({
      success: true,
      data: holidayArray,
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    return NextResponse.json(
      { success: false, error: '获取节假日数据失败' },
      { status: 500 }
    );
  }
}
