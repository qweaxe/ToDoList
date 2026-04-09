export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

// GET /api/todos/monthly - 获取整月任务（包含日历网格中的非当前月日期）
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 计算日历网格的实际日期范围
    // 日历从当月第一周的周一开始，到当月最后一周的周日结束
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0); // 当月最后一天

    // 计算日历开始日期（当月第一天所在周的周一）
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const calendarStartDate = new Date(firstDayOfMonth);
    calendarStartDate.setDate(firstDayOfMonth.getDate() - daysToMonday);

    // 计算日历结束日期（当月最后一天所在周的周日）
    const dayOfWeekEnd = lastDayOfMonth.getDay();
    const daysToSunday = dayOfWeekEnd === 0 ? 0 : 7 - dayOfWeekEnd;
    const calendarEndDate = new Date(lastDayOfMonth);
    calendarEndDate.setDate(lastDayOfMonth.getDate() + daysToSunday);

    // 格式化日期为字符串
    const formatDateStr = (date: Date) => 
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const calendarStartStr = formatDateStr(calendarStartDate);
    const calendarEndStr = formatDateStr(calendarEndDate);

    // 当月的开始和结束日期（用于统计）
    const monthStartStr = formatDateStr(firstDayOfMonth);
    const monthEndStr = formatDateStr(lastDayOfMonth);

    // 获取日历范围内所有任务
    const tasks = await db.todo.findMany({
      where: {
        userId,
        OR: [
          // 任务开始日期在日历范围内
          {
            startDate: {
              gte: calendarStartDate,
              lte: calendarEndDate,
            },
          },
          // 任务截止日期在日历范围内
          {
            dueDate: {
              gte: calendarStartDate,
              lte: calendarEndDate,
            },
          },
          // 任务跨越整个日历范围
          {
            AND: [
              { startDate: { lte: calendarStartDate } },
              { dueDate: { gte: calendarEndDate } },
            ],
          },
        ],
      },
      orderBy: [
        { level: { value: 'desc' } },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
        level: true,
      },
    });

    // 按日期分组
    const tasksByDate: Record<string, typeof tasks> = {};

    for (const task of tasks) {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.dueDate);

      // 计算任务在日历范围内的所有日期
      const effectiveStart = taskStart > calendarStartDate ? taskStart : calendarStartDate;
      const effectiveEnd = taskEnd < calendarEndDate ? taskEnd : calendarEndDate;

      for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateStr(d);
        if (!tasksByDate[dateStr]) {
          tasksByDate[dateStr] = [];
        }
        tasksByDate[dateStr].push(task);
      }
    }

    // 计算当月统计信息（只统计当月的任务）
    const monthTasks = await db.todo.findMany({
      where: {
        userId,
        OR: [
          { startDate: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
          { dueDate: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
          { AND: [{ startDate: { lte: firstDayOfMonth } }, { dueDate: { gte: lastDayOfMonth } }] },
        ],
      },
    });

    const uniqueTasks = [...new Map(monthTasks.map(t => [t.id, t])).values()];
    const uniqueCompleted = uniqueTasks.filter(t => t.status === 'completed').length;

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        tasks: tasksByDate,
        stats: {
          total: uniqueTasks.length,
          completed: uniqueCompleted,
          pending: uniqueTasks.length - uniqueCompleted,
          completionRate: uniqueTasks.length > 0 ? Math.round((uniqueCompleted / uniqueTasks.length) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get monthly todos error:', error);
    return NextResponse.json(
      { success: false, error: '获取月度任务失败' },
      { status: 500 }
    );
  }
}
