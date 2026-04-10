export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';

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
    const db = await getDb();
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: todoId } = await params;

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
    const db = await getDb();
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: todoId } = await params;
    const body = await request.json();
    const validated = createReminderSchema.parse(body);

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
