export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodayString, parseDateString } from '@/lib/date-utils';
import { syncDate } from '@/services/recurrence-service';
import { getAuthSession } from '@/lib/auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

// 将 D1 扁平 JOIN 结果重组为嵌套对象（与 Prisma include 格式一致）
function reshapeTodo(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    startDate: row.startDate,
    dueDate: row.dueDate,
    completedAt: row.completedAt,
    subTasks: row.subTasks,
    isCycleTask: Boolean(row.isCycleTask),
    recurrenceRuleId: row.recurrenceRuleId,
    parentRuleId: row.parentRuleId,
    userId: row.userId,
    categoryId: row.categoryId,
    levelId: row.levelId,
    priority: row.priority,
    isMilestone: Boolean(row.isMilestone),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: row.cat_id ? {
      id: row.cat_id,
      name: row.cat_name,
      emoji: row.cat_emoji,
      color: row.cat_color,
      description: row.cat_desc,
      userId: row.cat_userId,
      createdAt: row.cat_createdAt,
      updatedAt: row.cat_updatedAt,
    } : null,
    level: row.lvl_id ? {
      id: row.lvl_id,
      name: row.lvl_name,
      value: row.lvl_value,
      description: row.lvl_desc,
    } : null,
    recurrenceRule: row.rule_id ? {
      id: row.rule_id,
      frequency: row.rule_freq,
      interval: row.rule_interval,
      byDay: row.rule_byDay,
      cronExpr: row.rule_cron,
      startDate: row.rule_start,
      endDate: row.rule_end,
      isActive: Boolean(row.rule_active),
    } : null,
  };
}

const TODO_JOIN_FIELDS = `
  t.id, t.title, t.description, t.status,
  t.startDate, t.dueDate, t.completedAt, t.subTasks,
  t.isCycleTask, t.recurrenceRuleId, t.parentRuleId,
  t.userId, t.categoryId, t.levelId,
  t.priority, t.isMilestone, t.createdAt, t.updatedAt,
  c.id AS cat_id, c.name AS cat_name, c.emoji AS cat_emoji,
  c.color AS cat_color, c.description AS cat_desc,
  c.userId AS cat_userId, c.createdAt AS cat_createdAt, c.updatedAt AS cat_updatedAt,
  l.id AS lvl_id, l.name AS lvl_name, l.value AS lvl_value, l.description AS lvl_desc,
  r.id AS rule_id, r.frequency AS rule_freq, r.interval AS rule_interval,
  r.byDay AS rule_byDay, r.cronExpr AS rule_cron,
  r.startDate AS rule_start, r.endDate AS rule_end, r.isActive AS rule_active
`;

const TODO_JOIN_TABLES = `
  FROM todos t
  LEFT JOIN categories c ON c.id = t.categoryId
  LEFT JOIN levels l ON l.id = t.levelId
  LEFT JOIN recurrence_rules r ON r.id = t.recurrenceRuleId
`;

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
    const today = getTodayString();

    // 同步周期任务（静默执行，不阻塞请求）
    try {
      await syncDate(parseDateString(date), userId);
    } catch (syncError) {
      console.error('Failed to sync recurring tasks:', syncError);
    }

    const targetISO = parseDateString(date).toISOString();
    const todayISO = parseDateString(today).toISOString();

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const [rawToday, rawOverdue] = await Promise.all([
        d1.all<any>(
          `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES}
           WHERE t.userId = ? AND t.startDate <= ? AND t.dueDate >= ?
           ORDER BY l.value DESC, t.createdAt DESC`,
          userId, targetISO, targetISO
        ),
        d1.all<any>(
          `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES}
           WHERE t.userId = ? AND t.dueDate < ? AND t.status != 'completed'
           ORDER BY t.dueDate ASC, l.value DESC
           LIMIT 100`,
          userId, todayISO
        ),
      ]);

      const todayTasks = rawToday.map(reshapeTodo);
      const overdueTasks = rawOverdue.map(reshapeTodo);
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
    }

    const db = await getDb();
    const targetDateObj = parseDateString(date);
    const todayDateObj = parseDateString(today);

    const todayTasks = await db.todo.findMany({
      where: {
        userId,
        AND: [
          { startDate: { lte: targetDateObj } },
          { dueDate: { gte: targetDateObj } },
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

    const overdueTasks = await db.todo.findMany({
      where: {
        userId,
        AND: [
          { dueDate: { lt: todayDateObj } },
          { status: { not: 'completed' } },
        ],
      },
      orderBy: [
        { dueDate: 'asc' },
        { level: { value: 'desc' } },
      ],
      include: {
        category: true,
        level: true,
      },
      take: 100,
    });

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
