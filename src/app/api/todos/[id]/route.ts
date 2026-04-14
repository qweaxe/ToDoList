export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { updateTodoSchema } from '@/types/api';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

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

// GET /api/todos/[id] - 获取单个任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const row = await d1.first<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES} WHERE t.id=? AND t.userId=?`,
        id, userId
      );

      if (!row) {
        return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: reshapeTodo(row) });
    }

    const db = await getDb();
    const todo = await db.todo.findFirst({
      where: { id, userId },
      include: { category: true, level: true, recurrenceRule: true },
    });

    if (!todo) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('Get todo error:', error);
    return NextResponse.json({ success: false, error: '获取任务失败' }, { status: 500 });
  }
}

// PUT /api/todos/[id] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;
    const body = await request.json();
    const validated = updateTodoSchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const existing = await d1.first<{ id: string; status: string; startDate: string; dueDate: string }>(
        'SELECT id, status, startDate, dueDate FROM todos WHERE id=? AND userId=?',
        id, userId
      );

      if (!existing) {
        return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
      }

      const startDate = validated.startDate ?? existing.startDate;
      const dueDate = validated.dueDate ?? existing.dueDate;
      if (startDate > dueDate) {
        return NextResponse.json({ success: false, error: '开始日期不能晚于截止日期' }, { status: 400 });
      }

      if (validated.completedAt !== undefined && validated.completedAt !== null) {
        if (existing.status !== 'completed') {
          return NextResponse.json({ success: false, error: '未完成的任务不能设置完成日期' }, { status: 400 });
        }
      }

      const sets: string[] = [];
      const args: unknown[] = [];
      const now = new Date().toISOString();

      if (validated.title !== undefined) { sets.push('title=?'); args.push(validated.title); }
      if (validated.description !== undefined) { sets.push('description=?'); args.push(validated.description ?? null); }
      if (validated.startDate != null) { sets.push('startDate=?'); args.push(validated.startDate); }
      if (validated.dueDate != null) { sets.push('dueDate=?'); args.push(validated.dueDate); }
      if (validated.categoryId !== undefined) { sets.push('categoryId=?'); args.push(validated.categoryId ?? null); }
      if (validated.levelId !== undefined) { sets.push('levelId=?'); args.push(validated.levelId ?? null); }
      if (validated.isCycleTask !== undefined) { sets.push('isCycleTask=?'); args.push(validated.isCycleTask ? 1 : 0); }
      if (validated.isMilestone !== undefined) { sets.push('isMilestone=?'); args.push(validated.isMilestone ? 1 : 0); }
      if (validated.priority !== undefined) { sets.push('priority=?'); args.push(validated.priority); }
      if (validated.subTasks !== undefined) {
        sets.push('subTasks=?');
        args.push(validated.subTasks ? JSON.stringify(validated.subTasks) : null);
      }
      if (validated.completedAt !== undefined) {
        sets.push('completedAt=?');
        args.push(validated.completedAt ?? null);
      }
      sets.push('updatedAt=?');
      args.push(now);
      args.push(id);

      await d1.run(`UPDATE todos SET ${sets.join(', ')} WHERE id=?`, ...args);

      const updated = await d1.first<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES} WHERE t.id=?`,
        id
      );

      return NextResponse.json({ success: true, data: reshapeTodo(updated!) });
    }

    const db = await getDb();
    const existing = await db.todo.findFirst({ where: { id, userId } });

    if (!existing) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    }

    // 验证日期时间
    const startDate = validated.startDate ? new Date(validated.startDate) : existing.startDate;
    const dueDate = validated.dueDate ? new Date(validated.dueDate) : existing.dueDate;
    if (startDate > dueDate) {
      return NextResponse.json({ success: false, error: '开始日期不能晚于截止日期' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.startDate !== undefined) updateData.startDate = new Date(validated.startDate);
    if (validated.dueDate !== undefined) updateData.dueDate = new Date(validated.dueDate);
    if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId;
    if (validated.levelId !== undefined) updateData.levelId = validated.levelId;
    if (validated.isCycleTask !== undefined) updateData.isCycleTask = validated.isCycleTask;
    if (validated.isMilestone !== undefined) updateData.isMilestone = validated.isMilestone;
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.subTasks !== undefined) {
      updateData.subTasks = validated.subTasks ? JSON.stringify(validated.subTasks) : null;
    }
    if (validated.completedAt !== undefined) {
      if (validated.completedAt !== null) {
        if (existing.status !== 'completed') {
          return NextResponse.json({ success: false, error: '未完成的任务不能设置完成日期' }, { status: 400 });
        }
        updateData.completedAt = new Date(validated.completedAt);
      } else {
        updateData.completedAt = null;
      }
    }

    const todo = await db.todo.update({
      where: { id },
      data: updateData,
      include: { category: true, level: true, recurrenceRule: true },
    });

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json({ success: false, error: '更新任务失败' }, { status: 500 });
  }
}

// DELETE /api/todos/[id] - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const existing = await d1.first<{ id: string }>(
        'SELECT id FROM todos WHERE id=? AND userId=?',
        id, userId
      );

      if (!existing) {
        return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
      }

      await d1.run('DELETE FROM todos WHERE id=?', id);
      return NextResponse.json({ success: true, message: '任务已删除' });
    }

    const db = await getDb();
    const existing = await db.todo.findFirst({ where: { id, userId } });

    if (!existing) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    }

    await db.todo.delete({ where: { id } });
    return NextResponse.json({ success: true, message: '任务已删除' });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ success: false, error: '删除任务失败' }, { status: 500 });
  }
}
