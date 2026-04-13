export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getYearHolidays, checkAndPreloadNextYear, refreshYearHolidays } from '@/lib/holiday-service';

// GET /api/holidays - 获取年度节假日数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const action = searchParams.get('action');

    // 检查并预加载下一年的数据
    if (action === 'preload') {
      const result = await checkAndPreloadNextYear();
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // 强制刷新指定年份的数据
    if (action === 'refresh') {
      const result = await refreshYearHolidays(year);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // 获取年度数据
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
