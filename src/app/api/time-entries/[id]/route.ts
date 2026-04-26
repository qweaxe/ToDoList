export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { updateTimeEntrySchema } from '@/types/api';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

const TIME_ENTRY_JOIN_FIELDS = `
  t.id, t.title, t.description,
  t.date, t.startTime, t.endTime, t.duration,
  t.userId, t.categoryId, t.todoId,
  t.createdAt, t.updatedAt,
  c.id AS cat_id, c.name AS cat_name, c.emoji AS cat_emoji,
  c.color AS cat_color, c.description AS cat_desc,
  todo.id AS todo_id, todo.title AS todo_title
`;

const TIME_ENTRY_JOIN_TABLES = `
  FROM time_entries t
  LEFT JOIN categories c ON c.id = t.categoryId
  LEFT JOIN todos todo ON todo.id = t.todoId
`;

function reshapeTimeEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    duration: row.duration,
    userId: row.userId,
    categoryId: row.categoryId,
    todoId: row.todoId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: row.cat_id ? {
      id: row.cat_id,
      name: row.cat_name,
      emoji: row.cat_emoji,
      color: row.cat_color,
      description: row.cat_desc,
    } : null,
    todo: row.todo_id ? {
      id: row.todo_id,
      title: row.todo_title,
    } : null,
  };
}

// 计算时长（分钟）
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// GET /api/time-entries/[id] - 获取单条时间记录
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
        `SELECT ${TIME_ENTRY_JOIN_FIELDS} ${TIME_ENTRY_JOIN_TABLES} WHERE t.id=? AND t.userId=?`,
        id, userId
      );

      if (!row) {
        return NextResponse.json(
          { success: false, error: '时间记录不存在' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: reshapeTimeEntry(row) });
    }

    const db = await getDb();

    const timeEntry = await db.timeEntry.findFirst({
      where: { id, userId },
      include: { category: true, todo: { select: { id: true, title: true } } },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { success: false, error: '时间记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: timeEntry });
  } catch (error) {
    console.error('Get time entry error:', error);
    return NextResponse.json({ success: false, error: '获取时间记录失败' }, { status: 500 });
  }
}

// PUT /api/time-entries/[id] - 更新时间记录
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
    const validated = updateTimeEntrySchema.parse(body);

    // 计算时长
    let duration: number | undefined;
    if (validated.startTime && validated.endTime) {
      const startTimeObj = new Date(validated.startTime);
      const endTimeObj = new Date(validated.endTime);

      if (startTimeObj >= endTimeObj) {
        return NextResponse.json(
          { success: false, error: '开始时间必须早于结束时间' },
          { status: 400 }
        );
      }
      duration = calculateDuration(validated.startTime, validated.endTime);
    }

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 先检查记录是否存在且属于当前用户
      const existing = await d1.first<Record<string, unknown>>(
        'SELECT id FROM time_entries WHERE id=? AND userId=?',
        id, userId
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '时间记录不存在' },
          { status: 404 }
        );
      }

      const now = new Date().toISOString();

      // 构建更新字段
      const updates: string[] = [];
      const args: unknown[] = [];

      if (validated.title !== undefined) {
        updates.push('title=?');
        args.push(validated.title);
      }
      if (validated.description !== undefined) {
        updates.push('description=?');
        args.push(validated.description ?? null);
      }
      if (validated.date !== undefined) {
        updates.push('date=?');
        args.push(new Date(validated.date).toISOString());
      }
      if (validated.startTime !== undefined) {
        updates.push('startTime=?');
        args.push(new Date(validated.startTime).toISOString());
      }
      if (validated.endTime !== undefined) {
        updates.push('endTime=?');
        args.push(new Date(validated.endTime).toISOString());
      }
      if (duration !== undefined) {
        updates.push('duration=?');
        args.push(duration);
      }
      if (validated.categoryId !== undefined) {
        updates.push('categoryId=?');
        args.push(validated.categoryId ?? null);
      }
      if (validated.todoId !== undefined) {
        updates.push('todoId=?');
        args.push(validated.todoId ?? null);
      }

      updates.push('updatedAt=?');
      args.push(now);
      args.push(id);

      await d1.run(
        `UPDATE time_entries SET ${updates.join(', ')} WHERE id=?`,
        ...args
      );

      const row = await d1.first<Record<string, unknown>>(
        `SELECT ${TIME_ENTRY_JOIN_FIELDS} ${TIME_ENTRY_JOIN_TABLES} WHERE t.id=?`,
        id
      );

      return NextResponse.json({ success: true, data: reshapeTimeEntry(row!) });
    }

    const db = await getDb();

    const existing = await db.timeEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '时间记录不存在' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.date !== undefined) updateData.date = new Date(validated.date);
    if (validated.startTime !== undefined) updateData.startTime = new Date(validated.startTime);
    if (validated.endTime !== undefined) updateData.endTime = new Date(validated.endTime);
    if (duration !== undefined) updateData.duration = duration;
    if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId;
    if (validated.todoId !== undefined) updateData.todoId = validated.todoId;

    const timeEntry = await db.timeEntry.update({
      where: { id },
      data: updateData,
      include: { category: true, todo: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ success: true, data: timeEntry });
  } catch (error) {
    console.error('Update time entry error:', error);
    return NextResponse.json({ success: false, error: '更新时间记录失败' }, { status: 500 });
  }
}

// DELETE /api/time-entries/[id] - 删除时间记录
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

      // 先检查记录是否存在且属于当前用户
      const existing = await d1.first<Record<string, unknown>>(
        'SELECT id FROM time_entries WHERE id=? AND userId=?',
        id, userId
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '时间记录不存在' },
          { status: 404 }
        );
      }

      await d1.run('DELETE FROM time_entries WHERE id=?', id);

      return NextResponse.json({ success: true, data: null });
    }

    const db = await getDb();

    const existing = await db.timeEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '时间记录不存在' },
        { status: 404 }
      );
    }

    await db.timeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Delete time entry error:', error);
    return NextResponse.json({ success: false, error: '删除时间记录失败' }, { status: 500 });
  }
}