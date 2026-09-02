export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getQuarterStart, getQuarterEnd, formatDate, extractQuarter } from '@/lib/date-utils';
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { getD1Client, IS_EDGE } from '@/lib/d1';
import { syncRecurringTasks } from '@/services/recurrence-service';

// GET /api/todos/quarterly?date=YYYY-MM-DD - 获取季度数据
export async function GET(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const targetDate = dateParam || format(new Date(), 'yyyy-MM-dd');
    const quarterStart = getQuarterStart(targetDate);
    const quarterEnd = getQuarterEnd(targetDate);
    const quarter = extractQuarter(targetDate);
    const year = new Date(targetDate).getFullYear();

    const quarterStartStr = formatDate(quarterStart);
    const quarterEndStr = formatDate(quarterEnd);

    // 同步周期任务（静默执行，不阻塞请求）
    try {
      await syncRecurringTasks(quarterStart, quarterEnd, userId);
    } catch (syncError) {
      console.error('Failed to sync recurring tasks:', syncError);
    }

    // D1 原生 SQL 路径（生产环境），避免 Prisma 初始化 CPU 开销
    if (IS_EDGE) {
      const d1 = await getD1Client();
      const startStr = `${quarterStartStr}T00:00:00.000Z`;
      const endStr = `${quarterEndStr}T23:59:59.999Z`;

      // 里程碑（含分类和等级信息）
      const milestoneRows = await d1.all<{
        id: string; title: string; description: string | null;
        startDate: string; dueDate: string; status: string;
        categoryId: string | null; cat_name: string | null;
        cat_emoji: string | null; cat_color: string | null;
        levelId: string | null; level_name: string | null;
        level_value: number | null; level_description: string | null;
      }>(
        `SELECT t.id, t.title, t.description, t.startDate, t.dueDate, t.status,
                t.categoryId, c.name as cat_name, c.emoji as cat_emoji, c.color as cat_color,
                t.levelId, l.name as level_name, l.value as level_value, l.description as level_description
         FROM todos t
         LEFT JOIN categories c ON t.categoryId = c.id
         LEFT JOIN levels l ON t.levelId = l.id
         WHERE t.userId=? AND t.isMilestone=1
           AND (
             (t.startDate >= ? AND t.startDate <= ?)
             OR (t.dueDate >= ? AND t.dueDate <= ?)
             OR (t.startDate <= ? AND t.dueDate >= ?)
           )
         ORDER BY t.dueDate ASC`,
        userId, startStr, endStr, startStr, endStr, startStr, startStr
      );

      // 季度整体统计（含高优先级）
      const statsRow = await d1.first<{
        total: number; completed: number; highPriority: number;
      }>(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN l.value >= 3 AND t.status != 'completed' THEN 1 ELSE 0 END) as highPriority
         FROM todos t LEFT JOIN levels l ON t.levelId=l.id
         WHERE t.userId=?
           AND (
             (t.startDate >= ? AND t.startDate <= ?)
             OR (t.dueDate >= ? AND t.dueDate <= ?)
             OR (t.startDate <= ? AND t.dueDate >= ?)
           )`,
        userId, startStr, endStr, startStr, endStr, startStr, startStr
      );

      // 各月统计（并行，3个查询）
      const months = eachMonthOfInterval({ start: quarterStart, end: quarterEnd });
      const monthStatRows = await Promise.all(
        months.map((month) => {
          const mStartStr = `${formatDate(startOfMonth(month))}T00:00:00.000Z`;
          const mEndStr = `${formatDate(endOfMonth(month))}T23:59:59.999Z`;
          return d1.first<{ total: number; completed: number }>(
            `SELECT COUNT(*) as total,
                    SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed
             FROM todos WHERE userId=? AND startDate <= ? AND dueDate >= ?`,
            userId, mEndStr, mStartStr
          );
        })
      );

      const monthlyStats = months.map((month, i) => {
        const row = monthStatRows[i];
        const total = Number(row?.total ?? 0);
        const completed = Number(row?.completed ?? 0);
        return {
          month: format(month, 'MMMM'),
          monthNumber: parseInt(format(month, 'M'), 10),
          total,
          completed,
          pending: total - completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });

      const totalTasks = Number(statsRow?.total ?? 0);
      const completedTasksCount = Number(statsRow?.completed ?? 0);
      const highPriorityTasks = Number(statsRow?.highPriority ?? 0);
      const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

      const milestones = milestoneRows.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        startDate: m.startDate,
        dueDate: m.dueDate,
        status: m.status,
        category: m.categoryId ? {
          id: m.categoryId, name: m.cat_name,
          emoji: m.cat_emoji, color: m.cat_color,
        } : null,
        level: m.levelId ? {
          id: m.levelId, name: m.level_name,
          value: m.level_value, description: m.level_description,
        } : null,
      }));

      return NextResponse.json({
        success: true,
        data: {
          year, quarter,
          startDate: quarterStartStr,
          endDate: quarterEndStr,
          months: monthlyStats,
          milestones,
          stats: {
            total: totalTasks,
            completed: completedTasksCount,
            pending: totalTasks - completedTasksCount,
            completionRate,
            highPriority: highPriorityTasks,
            milestoneCount: milestones.length,
            completedMilestones: milestones.filter((m) => m.status === 'completed').length,
          },
        },
      });
    }

    // 开发环境：Prisma 路径
    const db = await getDb();
    const quarterStartBoundary = new Date(`${quarterStartStr}T00:00:00`);
    const quarterEndBoundary = new Date(`${quarterEndStr}T23:59:59`);

    // 获取季度内的所有里程碑任务
    const milestones = await db.todo.findMany({
      where: {
        userId,
        isMilestone: true,
        OR: [
          { startDate: { gte: quarterStartBoundary, lte: quarterEndBoundary } },
          { dueDate: { gte: quarterStartBoundary, lte: quarterEndBoundary } },
          { AND: [{ startDate: { lte: quarterStartBoundary } }, { dueDate: { gte: quarterStartBoundary } }] },
        ],
      },
      include: { category: true, level: true },
      orderBy: { dueDate: 'asc' },
    });

    // 获取季度内的所有任务统计
    const allTasks = await db.todo.findMany({
      where: {
        userId,
        OR: [
          { startDate: { gte: quarterStartBoundary, lte: quarterEndBoundary } },
          { dueDate: { gte: quarterStartBoundary, lte: quarterEndBoundary } },
          { AND: [{ startDate: { lte: quarterStartBoundary } }, { dueDate: { gte: quarterStartBoundary } }] },
        ],
      },
      select: {
        id: true, status: true, startDate: true, dueDate: true, levelId: true,
        level: { select: { value: true } },
      },
    });

    // 按月分组统计
    const months = eachMonthOfInterval({ start: quarterStart, end: quarterEnd });
    const monthlyStats = months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthTasks = allTasks.filter((task) => task.startDate <= monthEnd && task.dueDate >= monthStart);
      const completed = monthTasks.filter((t) => t.status === 'completed').length;
      const total = monthTasks.length;
      return {
        month: format(month, 'MMMM'),
        monthNumber: parseInt(format(month, 'M'), 10),
        total, completed,
        pending: total - completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const highPriorityTasks = allTasks.filter(
      (t) => t.level && t.level.value >= 3 && t.status !== 'completed'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        year, quarter,
        startDate: quarterStartStr,
        endDate: quarterEndStr,
        months: monthlyStats,
        milestones: milestones.map((m) => ({
          id: m.id, title: m.title, description: m.description,
          startDate: m.startDate, dueDate: m.dueDate, status: m.status,
          category: m.category, level: m.level,
        })),
        stats: {
          total: totalTasks, completed: completedTasks,
          pending: totalTasks - completedTasks, completionRate,
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
