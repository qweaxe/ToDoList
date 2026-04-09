export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getYearHolidays } from '@/lib/holiday-service';

// GET /api/holidays - 获取年度节假日数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

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
