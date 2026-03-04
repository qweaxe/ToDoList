import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getQuarterStart, getQuarterEnd, formatDate, extractQuarter } from '@/lib/date-utils';
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// GET /api/todos/quarterly?date=YYYY-MM-DD - 获取季度数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const targetDate = dateParam || format(new Date(), 'yyyy-MM-dd');
    const quarterStart = getQuarterStart(targetDate);
    const quarterEnd = getQuarterEnd(targetDate);
    const quarter = extractQuarter(targetDate);
    const year = new Date(targetDate).getFullYear();

    const quarterStartStr = formatDate(quarterStart);
    const quarterEndStr = formatDate(quarterEnd);

    // 获取季度内的所有里程碑任务
    const milestones = await db.todo.findMany({
      where: {
        isMilestone: true,
        OR: [
          {
            startDate: {
              gte: quarterStartStr,
              lte: quarterEndStr,
            },
          },
          {
            dueDate: {
              gte: quarterStartStr,
              lte: quarterEndStr,
            },
          },
          {
            AND: [
              { startDate: { lte: quarterStartStr } },
              { dueDate: { gte: quarterStartStr } },
            ],
          },
        ],
      },
      include: {
        category: true,
        level: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    // 获取季度内的所有任务统计
    const allTasks = await db.todo.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: quarterStartStr,
              lte: quarterEndStr,
            },
          },
          {
            dueDate: {
              gte: quarterStartStr,
              lte: quarterEndStr,
            },
          },
          {
            AND: [
              { startDate: { lte: quarterStartStr } },
              { dueDate: { gte: quarterStartStr } },
            ],
          },
        ],
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        dueDate: true,
        levelId: true,
        level: {
          select: { value: true },
        },
      },
    });

    // 按月分组统计
    const months = eachMonthOfInterval({
      start: quarterStart,
      end: quarterEnd,
    });

    const monthlyStats = months.map((month) => {
      const monthStart = formatDate(startOfMonth(month));
      const monthEnd = formatDate(endOfMonth(month));

      const monthTasks = allTasks.filter((task) => {
        return task.startDate <= monthEnd && task.dueDate >= monthStart;
      });

      const completed = monthTasks.filter((t) => t.status === 'completed').length;
      const total = monthTasks.length;

      return {
        month: format(month, 'M月', { locale: zhCN }),
        monthNumber: parseInt(format(month, 'M'), 10),
        total,
        completed,
        pending: total - completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // 整体统计
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 高优先级任务
    const highPriorityTasks = allTasks.filter(
      (t) => t.level && t.level.value >= 3 && t.status !== 'completed'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        year,
        quarter,
        quarterName: `第${quarter}季度`,
        startDate: quarterStartStr,
        endDate: quarterEndStr,
        months: monthlyStats,
        milestones: milestones.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          startDate: m.startDate,
          dueDate: m.dueDate,
          status: m.status,
          category: m.category,
          level: m.level,
        })),
        stats: {
          total: totalTasks,
          completed: completedTasks,
          pending: totalTasks - completedTasks,
          completionRate,
          highPriority: highPriorityTasks,
          milestoneCount: milestones.length,
          completedMilestones: milestones.filter((m) => m.status === 'completed').length,
        },
      },
    });
  } catch (error) {
    console.error('Get quarterly todos error:', error);
    return NextResponse.json(
      { success: false, error: '获取季度数据失败' },
      { status: 500 }
    );
  }
}
