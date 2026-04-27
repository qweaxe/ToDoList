export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createTodoSchema } from '@/types/api';
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
  l.id AS lvl_id, l.name AS lvl_name, l.value AS lvl_value, l.description AS lvl_desc,
  rr.id AS rr_id, rr.frequency AS rr_freq, rr.interval AS rr_interval,
  rr.byDay AS rr_byDay, rr.cronExpr AS rr_cron,
  rr.startDate AS rr_start, rr.endDate AS rr_end, rr.isActive AS rr_active
`;

const TODO_JOIN_TABLES = `
  FROM todos t
  LEFT JOIN categories c ON c.id = t.categoryId
  LEFT JOIN levels l ON l.id = t.levelId
  LEFT JOIN recurrence_rules rr ON rr.id = t.recurrenceRuleId
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
    recurrenceRule: row.rr_id ? {
      id: row.rr_id, frequency: row.rr_freq, interval: row.rr_interval,
      byDay: row.rr_byDay, cronExpr: row.rr_cron,
      startDate: row.rr_start, endDate: row.rr_end, isActive: Boolean(row.rr_active),
    } : null,
  };
}

// GET /api/todos - 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const levelId = searchParams.get('levelId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isMilestone = searchParams.get('isMilestone');

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const conditions: string[] = ['t.userId=?'];
      const args: unknown[] = [userId];

      if (status) { conditions.push('t.status=?'); args.push(status); }
      if (categoryId) { conditions.push('t.categoryId=?'); args.push(categoryId); }
      if (levelId) { conditions.push('t.levelId=?'); args.push(levelId); }
      if (isMilestone === 'true') { conditions.push('t.isMilestone=1'); }
      if (startDate && endDate) {
        const startISO = new Date(startDate).toISOString();
        const endISO = new Date(endDate).toISOString();
        conditions.push('((t.startDate>=? AND t.startDate<=?) OR (t.dueDate>=? AND t.dueDate<=?) OR (t.startDate<=? AND t.dueDate>=?))');
        args.push(startISO, endISO, startISO, endISO, startISO, endISO);
      }

      const rows = await d1.all<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES}
         WHERE ${conditions.join(' AND ')}
         ORDER BY l.value DESC, t.createdAt DESC`,
        ...args
      );

      return NextResponse.json({ success: true, data: rows.map(reshapeTodo) });
    }

    const db = await getDb();
    const where: Record<string, unknown> = { userId };

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (levelId) where.levelId = levelId;
    if (isMilestone === 'true') where.isMilestone = true;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      where.OR = [
        { startDate: { gte: start, lte: end } },
        { dueDate: { gte: start, lte: end } },
        { AND: [{ startDate: { lte: start } }, { dueDate: { gte: end } }] },
      ];
    }

    const todos = await db.todo.findMany({
      where,
      orderBy: [{ level: { value: 'desc' } }, { createdAt: 'desc' }],
      include: { category: true, level: true, recurrenceRule: true },
    });

    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    console.error('Get todos error:', error);
    return NextResponse.json({ success: false, error: '获取任务失败' }, { status: 500 });
  }
}

// POST /api/todos - 创建任务
export async function POST(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const validated = createTodoSchema.parse(body);

    const startDateObj = new Date(validated.startDate);
    const dueDateObj = new Date(validated.dueDate);
    if (startDateObj > dueDateObj) {
      return NextResponse.json(
        { success: false, error: '开始日期不能晚于截止日期' },
        { status: 400 }
      );
    }

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const now = new Date().toISOString();

      let recurrenceRuleId: string | null = null;
      if (validated.isCycleTask && validated.recurrenceRule) {
        const rule = validated.recurrenceRule;
        recurrenceRuleId = crypto.randomUUID();
        await d1.run(
          `INSERT INTO recurrence_rules (id, frequency, interval, byDay, cronExpr, startDate, endDate, isActive, userId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          recurrenceRuleId, rule.frequency, rule.interval,
          rule.byDay ? JSON.stringify(rule.byDay) : null,
          rule.cronExpr ?? null,
          new Date(rule.startDate).toISOString(),
          rule.endDate ? new Date(rule.endDate).toISOString() : null,
          userId, now, now
        );
      }

      const todoId = crypto.randomUUID();
      await d1.run(
        `INSERT INTO todos (id, title, description, status, startDate, dueDate, completedAt,
         categoryId, levelId, subTasks, isCycleTask, recurrenceRuleId, isMilestone, priority, estimatedDuration, userId, createdAt, updatedAt)
         VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        todoId, validated.title, validated.description ?? null,
        new Date(validated.startDate).toISOString(),
        new Date(validated.dueDate).toISOString(),
        validated.completedAt ? new Date(validated.completedAt).toISOString() : null,
        validated.categoryId ?? null, validated.levelId ?? null,
        validated.subTasks ? JSON.stringify(validated.subTasks) : null,
        validated.isCycleTask ? 1 : 0,
        recurrenceRuleId,
        validated.isMilestone ? 1 : 0,
        validated.priority ?? 0,
        validated.estimatedDuration ?? null,
        userId, now, now
      );

      const row = await d1.first<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES} WHERE t.id=?`,
        todoId
      );

      return NextResponse.json({ success: true, data: reshapeTodo(row!) });
    }

    const db = await getDb();

    let recurrenceRuleId: string | null = null;
    if (validated.isCycleTask && validated.recurrenceRule) {
      const rule = await db.recurrenceRule.create({
        data: {
          frequency: validated.recurrenceRule.frequency,
          interval: validated.recurrenceRule.interval,
          byDay: validated.recurrenceRule.byDay ? JSON.stringify(validated.recurrenceRule.byDay) : null,
          cronExpr: validated.recurrenceRule.cronExpr,
          startDate: new Date(validated.recurrenceRule.startDate),
          endDate: validated.recurrenceRule.endDate ? new Date(validated.recurrenceRule.endDate) : null,
          userId,
        },
      });
      recurrenceRuleId = rule.id;
    }

    const todo = await db.todo.create({
      data: {
        title: validated.title,
        description: validated.description,
        startDate: new Date(validated.startDate),
        dueDate: new Date(validated.dueDate),
        completedAt: validated.completedAt ? new Date(validated.completedAt) : null,
        categoryId: validated.categoryId,
        levelId: validated.levelId,
        subTasks: validated.subTasks ? JSON.stringify(validated.subTasks) : null,
        isCycleTask: validated.isCycleTask ?? false,
        recurrenceRuleId,
        isMilestone: validated.isMilestone ?? false,
        priority: validated.priority ?? 0,
        userId,
      },
      include: { category: true, level: true, recurrenceRule: true },
    });

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ success: false, error: '创建任务失败' }, { status: 500 });
  }
}
