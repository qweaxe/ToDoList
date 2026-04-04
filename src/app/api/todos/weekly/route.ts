import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWeekStart, getWeekEnd, formatDate, getWeekDates, extractWeekNumber } from '@/lib/date-utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { syncRecurringTasks } from '@/services/recurrence-service';
import { getAuthSession } from '@/lib/auth';

// GET /api/todos/weekly?date=YYYY-MM-DD - 获取一周的任务数据
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const targetDate = dateParam || format(new Date(), 'yyyy-MM-dd');
    const weekStart = getWeekStart(targetDate);
    const weekEnd = getWeekEnd(targetDate);
    const weekDates = getWeekDates(targetDate);

    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);

    // 同步周期任务（静默执行，不阻塞请求）
    try {
      await syncRecurringTasks(weekStart, weekEnd, userId);
    } catch (syncError) {
      console.error('Failed to sync recurring tasks:', syncError);
      // 继续执行，不阻塞请求
    }

    // 获取这一周的所有任务
    const todos = await db.todo.findMany({
      where: {
        userId,
        OR: [
          // 任务开始日期在这一周内
          {
            startDate: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          // 任务截止日期在这一周内
          {
            dueDate: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          // 跨天任务：开始日期在周开始之前，截止日期在周开始之后
          {
            AND: [
              { startDate: { lte: weekStart } },
              { dueDate: { gte: weekStart } },
            ],
          },
        ],
      },
      include: {
        category: true,
        level: true,
      },
      orderBy: [
        { level: { value: 'desc' } },
        { createdAt: 'asc' },
      ],
    });

    // 按日期分组任务
    const tasksByDate: Record<string, typeof todos> = {};
    for (const date of weekDates) {
      const dateStr = formatDate(date);
      tasksByDate[dateStr] = todos.filter((todo) => {
        const todoStart = formatDate(todo.startDate);
        const todoEnd = formatDate(todo.dueDate);
        return dateStr >= todoStart && dateStr <= todoEnd;
      });
    }

    // 计算本周统计
    const totalTasks = todos.length;
    const completedTasks = todos.filter((t) => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 获取本周的重点任务（高优先级）
    const importantTasks = todos.filter(
      (t) => t.level && t.level.value >= 3 && t.status !== 'completed'
    );

    return NextResponse.json({
      success: true,
      data: {
        weekNumber: extractWeekNumber(targetDate),
        startDate: weekStartStr,
        endDate: weekEndStr,
        dates: weekDates.map((d) => ({
          date: formatDate(d),
          dayName: format(d, 'EEE', { locale: zhCN }),
          dayNumber: format(d, 'd'),
          isToday: format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
          isWeekend: [0, 6].includes(d.getDay()),
        })),
        tasksByDate,
        stats: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          completionRate,
        },
        importantTasks: importantTasks.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Get weekly todos error:', error);
    return NextResponse.json(
      { success: false, error: '获取周任务失败' },
      { status: 500 }
    );
  }
}
