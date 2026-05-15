export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getWeekStart, getWeekEnd, formatDate, getWeekDates, extractWeekNumber } from '@/lib/date-utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { syncRecurringTasks } from '@/services/recurrence-service';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

// 与 daily/route.ts 共用的 JOIN 字段和表定义
const TODO_JOIN_FIELDS = `
  t.id, t.title, t.description, t.status,
  t.startDate, t.dueDate, t.completedAt, t.subTasks,
  t.isCycleTask, t.recurrenceRuleId, t.parentRuleId,
  t.userId, t.categoryId, t.levelId,
  t.priority, t.isMilestone, t.estimatedDuration, t.createdAt, t.updatedAt,
  c.id AS cat_id, c.name AS cat_name, c.emoji AS cat_emoji,
  c.color AS cat_color, c.description AS cat_desc,
  c.userId AS cat_userId, c.createdAt AS cat_createdAt, c.updatedAt AS cat_updatedAt,
  l.id AS lvl_id, l.name AS lvl_name, l.value AS lvl_value, l.description AS lvl_desc
`;

const TODO_JOIN_TABLES = `
  FROM todos t
  LEFT JOIN categories c ON c.id = t.categoryId
  LEFT JOIN levels l ON l.id = t.levelId
`;

function reshapeTodo(row: Record<string, unknown>) {
  return {
    id: row.id, title: row.title, description: row.description,
    status: row.status, startDate: row.startDate, dueDate: row.dueDate,
    completedAt: row.completedAt, subTasks: row.subTasks,
    isCycleTask: Boolean(row.isCycleTask), recurrenceRuleId: row.recurrenceRuleId,
    parentRuleId: row.parentRuleId, userId: row.userId,
    categoryId: row.categoryId, levelId: row.levelId,
    priority: row.priority, isMilestone: Boolean(row.isMilestone),
    estimatedDuration: row.estimatedDuration,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    category: row.cat_id ? {
      id: row.cat_id, name: row.cat_name, emoji: row.cat_emoji,
      color: row.cat_color, description: row.cat_desc,
      userId: row.cat_userId, createdAt: row.cat_createdAt, updatedAt: row.cat_updatedAt,
    } : null,
    level: row.lvl_id ? {
      id: row.lvl_id, name: row.lvl_name,
      value: row.lvl_value, description: row.lvl_desc,
    } : null,
  };
}

// GET /api/todos/weekly?date=YYYY-MM-DD - 获取一周的任务数据
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
    }

    const weekStartISO = new Date(`${weekStartStr}T00:00:00`).toISOString();
    const weekEndISO = new Date(`${weekEndStr}T23:59:59`).toISOString();

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const rawTodos = await d1.all<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES}
         WHERE t.userId = ?
           AND (
             (t.startDate >= ? AND t.startDate <= ?)
             OR (t.dueDate >= ? AND t.dueDate <= ?)
             OR (t.startDate <= ? AND t.dueDate >= ?)
           )
         ORDER BY l.value DESC, t.createdAt ASC`,
        userId,
        weekStartISO, weekEndISO,
        weekStartISO, weekEndISO,
        weekStartISO, weekStartISO
      );

      const todos = rawTodos.map(reshapeTodo);

      // 按日期分组
      const tasksByDate: Record<string, typeof todos> = {};
      for (const date of weekDates) {
        const dateStr = formatDate(date);
        tasksByDate[dateStr] = todos.filter((todo) => {
          const todoStart = (todo.startDate as string).substring(0, 10);
          const todoEnd = (todo.dueDate as string).substring(0, 10);
          return dateStr >= todoStart && dateStr <= todoEnd;
        });
      }

      const totalTasks = todos.length;
      const completedTasks = todos.filter((t) => t.status === 'completed').length;
      const pendingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const importantTasks = todos.filter((t) => t.level && (t.level as { value: number }).value >= 3 && t.status !== 'completed');

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
          stats: { total: totalTasks, completed: completedTasks, pending: pendingTasks, completionRate },
          importantTasks: importantTasks.slice(0, 5),
        },
      });
    }

    // 开发环境：Prisma 路径
    const db = await getDb();
    const weekStartBoundary = new Date(`${weekStartStr}T00:00:00`);
    const weekEndBoundary = new Date(`${weekEndStr}T23:59:59`);

    const todos = await db.todo.findMany({
      where: {
        userId,
        OR: [
          { startDate: { gte: weekStartBoundary, lte: weekEndBoundary } },
          { dueDate: { gte: weekStartBoundary, lte: weekEndBoundary } },
          { AND: [{ startDate: { lte: weekStartBoundary } }, { dueDate: { gte: weekStartBoundary } }] },
        ],
      },
      include: { category: true, level: true },
      orderBy: [{ level: { value: 'desc' } }, { createdAt: 'asc' }],
    });

    const tasksByDate: Record<string, typeof todos> = {};
    for (const date of weekDates) {
      const dateStr = formatDate(date);
      tasksByDate[dateStr] = todos.filter((todo) => {
        const todoStart = formatDate(todo.startDate);
        const todoEnd = formatDate(todo.dueDate);
        return dateStr >= todoStart && dateStr <= todoEnd;
      });
    }

    const totalTasks = todos.length;
    const completedTasks = todos.filter((t) => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const importantTasks = todos.filter((t) => t.level && t.level.value >= 3 && t.status !== 'completed');

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
        stats: { total: totalTasks, completed: completedTasks, pending: totalTasks - completedTasks, completionRate },
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
