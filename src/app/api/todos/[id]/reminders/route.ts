export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';
import { z } from 'zod';
import { getApiSession } from '@/lib/api-auth';

const createReminderSchema = z.object({
  remindAt: z.string(),
  type: z.enum(['before_due', 'custom']),
  offset: z.number().optional(),
});

// GET /api/todos/[id]/reminders - 获取任务的提醒列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id: todoId } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 验证任务属于用户
      const todo = await d1.first<{ id: string }>(
        'SELECT id FROM todos WHERE id = ? AND userId = ?',
        todoId, userId
      );

      if (!todo) {
        return NextResponse.json(
          { success: false, error: '任务不存在' },
          { status: 404 }
        );
      }

      const reminders = await d1.all<any>(
        `SELECT id, todoId, remindAt, type, offset, sent, createdAt
         FROM reminders WHERE todoId = ? ORDER BY remindAt ASC`,
        todoId
      );

      return NextResponse.json({
        success: true,
        data: reminders.map(r => ({
          id: r.id,
          todoId: r.todoId,
          remindAt: r.remindAt,
          type: r.type,
          offset: r.offset,
          sent: Boolean(r.sent),
          createdAt: r.createdAt,
        })),
      });
    }

    const db = await getDb();

    // 验证任务属于用户
    const todo = await db.todo.findFirst({
      where: { id: todoId, userId },
    });

    if (!todo) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    const reminders = await db.reminder.findMany({
      where: { todoId },
      orderBy: { remindAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: reminders.map(r => ({
        id: r.id,
        todoId: r.todoId,
        remindAt: r.remindAt.toISOString(),
        type: r.type,
        offset: r.offset,
        sent: r.sent,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get todo reminders error:', error);
    return NextResponse.json(
      { success: false, error: '获取提醒失败' },
      { status: 500 }
    );
  }
}

// POST /api/todos/[id]/reminders - 创建提醒
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id: todoId } = await params;
    const body = await request.json();
    const validated = createReminderSchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 验证任务属于用户
      const todo = await d1.first<{ id: string }>(
        'SELECT id FROM todos WHERE id = ? AND userId = ?',
        todoId, userId
      );

      if (!todo) {
        return NextResponse.json(
          { success: false, error: '任务不存在' },
          { status: 404 }
        );
      }

      // 检查提醒时间是否已过
      const remindAt = new Date(validated.remindAt);
      if (remindAt < new Date()) {
        return NextResponse.json(
          { success: false, error: '提醒时间已过' },
          { status: 400 }
        );
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const remindAtISO = remindAt.toISOString();

      await d1.run(
        `INSERT INTO reminders (id, todoId, remindAt, type, offset, sent, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        id, todoId, remindAtISO, validated.type, validated.offset ?? null, now, now
      );

      return NextResponse.json({
        success: true,
        data: {
          id,
          todoId,
          remindAt: remindAtISO,
          type: validated.type,
          offset: validated.offset ?? null,
          sent: false,
        },
      });
    }

    const db = await getDb();

    // 验证任务属于用户
    const todo = await db.todo.findFirst({
      where: { id: todoId, userId },
    });

    if (!todo) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    // 检查提醒时间是否已过
    const remindAt = new Date(validated.remindAt);
    if (remindAt < new Date()) {
      return NextResponse.json(
        { success: false, error: '提醒时间已过' },
        { status: 400 }
      );
    }

    const reminder = await db.reminder.create({
      data: {
        todoId,
        remindAt,
        type: validated.type,
        offset: validated.offset,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: reminder.id,
        todoId: reminder.todoId,
        remindAt: reminder.remindAt.toISOString(),
        type: reminder.type,
        offset: reminder.offset,
        sent: reminder.sent,
      },
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    return NextResponse.json(
      { success: false, error: '创建提醒失败' },
      { status: 500 }
    );
  }
}
