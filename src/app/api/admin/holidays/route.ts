export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { refreshYearHolidays, checkAndPreloadNextYear } from '@/lib/holiday-service';

/**
 * 节假日数据管理 API
 * GET /api/admin/holidays - 获取缓存状态
 * POST /api/admin/holidays - 刷新或预加载数据
 */
export async function GET() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const db = await getDb();

    // 获取各年份的缓存数据统计
    const holidays = await db.holiday.findMany({
      select: {
        year: true,
      },
    });

    // 按年份统计数量
    const yearStats: Record<number, number> = {};
    for (const h of holidays) {
      yearStats[h.year] = (yearStats[h.year] || 0) + 1;
    }

    // 获取当前年份和下一年
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    return NextResponse.json({
      success: true,
      data: {
        yearStats,
        currentYear,
        nextYear,
        hasCurrentYear: !!yearStats[currentYear],
        hasNextYear: !!yearStats[nextYear],
      },
    });
  } catch (error) {
    console.error('Get holiday stats error:', error);
    return NextResponse.json(
      { success: false, error: '获取节假日统计失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, year } = body;

    if (action === 'refresh' && year) {
      // 刷新指定年份数据
      const result = await refreshYearHolidays(year);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (action === 'preload') {
      // 预加载下一年数据
      const result = await checkAndPreloadNextYear();
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      { success: false, error: '无效的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Holiday admin action error:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    );
  }
}
