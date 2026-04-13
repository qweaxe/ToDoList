export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { formatDate } from '@/lib/date-utils';
import { format, eachDayOfInterval, getDay, getMonth } from 'date-fns';

// GET /api/todos/yearly?year=YYYY - 获取年度统计数据
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    // 计算查询边界：本地时间的年度开始 00:00 和年度结束 23:59:59，转换为 UTC
    const yearStartStr = `${year}-01-01`;
    const yearEndStr = `${year}-12-31`;
    const yearStartBoundary = new Date(`${yearStartStr}T00:00:00`);
    const yearEndBoundary = new Date(`${yearEndStr}T23:59:59`);

    // 用于生成日期序列（本地时间的年度边界）
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // 获取年度内已完成的任务（用于热力图）
    const completedTasks = await db.todo.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: {
          gte: yearStartBoundary,
          lte: yearEndBoundary,
        },
      },
      select: {
        completedAt: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 生成热力图数据（每天完成数量）
    const heatmap: Record<string, number> = {};
    completedTasks.forEach((task) => {
      if (task.completedAt) {
        const dateStr = formatDate(task.completedAt);
        heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
      }
    });

    // 生成完整的年度日期数据
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    const heatmapData = allDays.map((date) => {
      const dateStr = formatDate(date);
      const count = heatmap[dateStr] || 0;
      return {
        date: dateStr,
        dayOfWeek: getDay(date),
        week: Math.floor(
          (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ),
        month: getMonth(date),
        count,
        level: count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4,
      };
    });

    // 按月统计
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 0);

      const monthTasks = completedTasks.filter(
        (t) => t.completedAt && t.completedAt >= monthStart && t.completedAt <= monthEnd
      );

      return {
        month: i + 1,
        monthName: format(new Date(year, i, 1), 'M月'),
        completed: monthTasks.length,
      };
    });

    // 找出最勤奋的月份
    const mostProductiveMonth = monthlyStats.reduce(
      (max, curr) => (curr.completed > max.completed ? curr : max),
      monthlyStats[0]
    );

    // 按分类统计
    const categoryStats: Record<string, { name: string; count: number }> = {};
    completedTasks.forEach((task) => {
      if (task.category) {
        if (!categoryStats[task.category.id]) {
          categoryStats[task.category.id] = {
            name: task.category.name,
            count: 0,
          };
        }
        categoryStats[task.category.id].count++;
      }
    });

    // 找出最专注的分类
    const topCategories = Object.entries(categoryStats)
      .map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 总体统计
    const totalCompleted = completedTasks.length;
    const activeDays = Object.keys(heatmap).length;
    const avgPerDay = activeDays > 0 ? (totalCompleted / activeDays).toFixed(1) : '0';

    // 最长连续天数
    let longestStreak = 0;
    let currentStreak = 0;
    allDays.forEach((date) => {
      const dateStr = formatDate(date);
      if (heatmap[dateStr] > 0) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        year,
        heatmap: heatmapData,
        monthlyStats,
        categoryStats: topCategories,
        summary: {
          totalCompleted,
          activeDays,
          avgPerDay,
          longestStreak,
          mostProductiveMonth: {
            month: mostProductiveMonth.monthName,
            completed: mostProductiveMonth.completed,
          },
          topCategory: topCategories[0] || null,
        },
      },
    });
  } catch (error) {
    console.error('Get yearly stats error:', error);
    return NextResponse.json(
      { success: false, error: '获取年度统计失败' },
      { status: 500 }
    );
  }
}
