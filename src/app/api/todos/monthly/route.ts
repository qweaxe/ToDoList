export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

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

const formatDateStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// GET /api/todos/monthly - 获取整月任务（包含日历网格中的非当前月日期）
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 计算日历网格实际范围
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const calendarStartDate = new Date(firstDayOfMonth);
    calendarStartDate.setDate(firstDayOfMonth.getDate() - daysToMonday);

    const dayOfWeekEnd = lastDayOfMonth.getDay();
    const daysToSunday = dayOfWeekEnd === 0 ? 0 : 7 - dayOfWeekEnd;
    const calendarEndDate = new Date(lastDayOfMonth);
    calendarEndDate.setDate(lastDayOfMonth.getDate() + daysToSunday);

    const calendarStartStr = formatDateStr(calendarStartDate);
    const calendarEndStr = formatDateStr(calendarEndDate);
    const monthStartStr = formatDateStr(firstDayOfMonth);
    const monthEndStr = formatDateStr(lastDayOfMonth);

    const calendarStartISO = new Date(`${calendarStartStr}T00:00:00`).toISOString();
    const calendarEndISO = new Date(`${calendarEndStr}T23:59:59`).toISOString();
    const monthStartISO = new Date(`${monthStartStr}T00:00:00`).toISOString();
    const monthEndISO = new Date(`${monthEndStr}T23:59:59`).toISOString();

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 获取日历范围内的所有任务（含分类/等级）
      const rawTasks = await d1.all<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES}
         WHERE t.userId = ?
           AND (
             (t.startDate >= ? AND t.startDate <= ?)
             OR (t.dueDate >= ? AND t.dueDate <= ?)
             OR (t.startDate <= ? AND t.dueDate >= ?)
           )
         ORDER BY l.value DESC, t.createdAt DESC`,
        userId,
        calendarStartISO, calendarEndISO,
        calendarStartISO, calendarEndISO,
        calendarStartISO, calendarEndISO
      );

      const tasks = rawTasks.map(reshapeTodo);

      // 按日期分组（跨天任务会出现在多天）
      const tasksByDate: Record<string, typeof tasks> = {};
      for (const task of tasks) {
        const taskStartStr = (task.startDate as string).substring(0, 10);
        const taskEndStr = (task.dueDate as string).substring(0, 10);
        const effectiveStart = taskStartStr > calendarStartStr ? taskStartStr : calendarStartStr;
        const effectiveEnd = taskEndStr < calendarEndStr ? taskEndStr : calendarEndStr;

        // 逐天展开
        const current = new Date(`${effectiveStart}T00:00:00`);
        const end = new Date(`${effectiveEnd}T00:00:00`);
        while (current <= end) {
          const dateStr = formatDateStr(current);
          if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
          tasksByDate[dateStr].push(task);
          current.setDate(current.getDate() + 1);
        }
      }

      // 当月统计（单独查询，去重）
      const statsRow = await d1.first<{ total: number; completed: number }>(
        `SELECT COUNT(DISTINCT t.id) as total,
                SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) as completed
         FROM todos t
         WHERE t.userId = ?
           AND (
             (t.startDate >= ? AND t.startDate <= ?)
             OR (t.dueDate >= ? AND t.dueDate <= ?)
             OR (t.startDate <= ? AND t.dueDate >= ?)
           )`,
        userId,
        monthStartISO, monthEndISO,
        monthStartISO, monthEndISO,
        monthStartISO, monthEndISO
      );

      const total = Number(statsRow?.total ?? 0);
      const completed = Number(statsRow?.completed ?? 0);

      return NextResponse.json({
        success: true,
        data: {
          year, month,
          tasks: tasksByDate,
          stats: {
            total, completed,
            pending: total - completed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          },
        },
      });
    }

    // 开发环境：Prisma 路径
    const db = await getDb();
    const calendarStartBoundary = new Date(`${calendarStartStr}T00:00:00`);
    const calendarEndBoundary = new Date(`${calendarEndStr}T23:59:59`);
    const monthStartBoundary = new Date(`${monthStartStr}T00:00:00`);
    const monthEndBoundary = new Date(`${monthEndStr}T23:59:59`);

    const tasks = await db.todo.findMany({
      where: {
        userId,
        OR: [
          { startDate: { gte: calendarStartBoundary, lte: calendarEndBoundary } },
          { dueDate: { gte: calendarStartBoundary, lte: calendarEndBoundary } },
          { AND: [{ startDate: { lte: calendarStartBoundary } }, { dueDate: { gte: calendarEndBoundary } }] },
        ],
      },
      orderBy: [{ level: { value: 'desc' } }, { createdAt: 'desc' }],
      include: { category: true, level: true },
    });

    const tasksByDate: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.dueDate);
      const effectiveStart = taskStart > calendarStartDate ? taskStart : calendarStartDate;
      const effectiveEnd = taskEnd < calendarEndDate ? taskEnd : calendarEndDate;

      for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateStr(d);
        if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
        tasksByDate[dateStr].push(task);
      }
    }

    const monthTasks = await db.todo.findMany({
      where: {
        userId,
        OR: [
          { startDate: { gte: monthStartBoundary, lte: monthEndBoundary } },
          { dueDate: { gte: monthStartBoundary, lte: monthEndBoundary } },
          { AND: [{ startDate: { lte: monthStartBoundary } }, { dueDate: { gte: monthEndBoundary } }] },
        ],
      },
    });

    const uniqueTasks = [...new Map(monthTasks.map(t => [t.id, t])).values()];
    const uniqueCompleted = uniqueTasks.filter(t => t.status === 'completed').length;

    return NextResponse.json({
      success: true,
      data: {
        year, month,
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
