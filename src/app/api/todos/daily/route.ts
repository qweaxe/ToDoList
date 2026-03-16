import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayString, parseDateString } from '@/lib/date-utils';
import { syncDate } from '@/services/recurrence-service';
import { getAuthSession } from '@/lib/auth';

// GET /api/todos/daily - 获取当日任务和历史待办
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
    const date = searchParams.get('date') || getTodayString();
    const today = getTodayString(); // 历史待办的判断基准始终是今天

    // 同步周期任务（静默执行，不阻塞请求）
    try {
      const targetDate = parseDateString(date);
      await syncDate(targetDate, userId);
    } catch (syncError) {
      console.error('Failed to sync recurring tasks:', syncError);
      // 继续执行，不阻塞请求
    }

    // 获取当日任务（用户选择的日期）
    // 条件: startDate <= date <= dueDate
    const todayTasks = await db.todo.findMany({
      where: {
        userId,
        AND: [
          { startDate: { lte: date } },
          { dueDate: { gte: date } },
        ],
      },
      orderBy: [
        { level: { value: 'desc' } },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
        level: true,
        recurrenceRule: true,
      },
    });

    // 获取历史待办任务（始终以今天为基准）
    // 条件: dueDate < 今天 且 status != completed
    // 注意：不限制 startDate，只要 dueDate 过期就算历史待办
    const overdueTasks = await db.todo.findMany({
      where: {
        userId,
        AND: [
          { dueDate: { lt: today } },
          { status: { not: 'completed' } },
        ],
      },
      orderBy: [
        { dueDate: 'asc' }, // 从最远的截止日期排序
        { level: { value: 'desc' } },
      ],
      include: {
        category: true,
        level: true,
      },
      take: 100, // 限制数量
    });

    // 分离已完成和未完成的当日任务
    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    const pendingTasks = todayTasks.filter(t => t.status !== 'completed');

    return NextResponse.json({
      success: true,
      data: {
        date,
        today: {
          pending: pendingTasks,
          completed: completedTasks,
          total: todayTasks.length,
          completedCount: completedTasks.length,
        },
        overdue: overdueTasks,
        overdueCount: overdueTasks.length,
      },
    });
  } catch (error) {
    console.error('Get daily todos error:', error);
    return NextResponse.json(
      { success: false, error: '获取当日任务失败' },
      { status: 500 }
    );
  }
}
