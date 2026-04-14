export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

interface ConvertBody {
  title?: string;
  description?: string;
  startDate: string;
  dueDate: string;
  categoryId?: string;
  levelId?: string;
}

/**
 * POST /api/inbox/:id/convert - 将捕获箱条目转化为任务
 */
export async function POST(
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
    const body: ConvertBody = await request.json();
    const { title, description, startDate, dueDate, categoryId, levelId } = body;

    if (!startDate || !dueDate) {
      return NextResponse.json(
        { success: false, error: '开始时间和截止时间为必填' },
        { status: 400 }
      );
    }

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const inboxItem = await d1.first<{
        id: string;
        content: string;
        userId: string;
        convertedToTodoId: string | null;
      }>('SELECT id, content, userId, convertedToTodoId FROM inbox_items WHERE id = ?', id);

      if (!inboxItem || inboxItem.userId !== userId) {
        return NextResponse.json(
          { success: false, error: '条目不存在' },
          { status: 404 }
        );
      }

      if (inboxItem.convertedToTodoId) {
        return NextResponse.json(
          { success: false, error: '该条目已转化为任务' },
          { status: 400 }
        );
      }

      const todoId = crypto.randomUUID();
      const now = new Date().toISOString();

      await d1.run(
        `INSERT INTO todos (id, title, description, startDate, dueDate, categoryId, levelId, userId, status, priority, isMilestone, isCycleTask, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
        todoId,
        title?.trim() || inboxItem.content,
        description?.trim() || null,
        startDate,
        dueDate,
        categoryId || null,
        levelId || null,
        userId,
        'pending',
        now,
        now
      );

      await d1.run(
        'UPDATE inbox_items SET convertedToTodoId = ?, convertedAt = ? WHERE id = ?',
        todoId, now, id
      );

      return NextResponse.json({
        success: true,
        data: { id: todoId, title: title?.trim() || inboxItem.content },
      });
    }

    const db = await getDb();

    const inboxItem = await db.inboxItem.findUnique({ where: { id } });

    if (!inboxItem || inboxItem.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '条目不存在' },
        { status: 404 }
      );
    }

    if (inboxItem.convertedToTodoId) {
      return NextResponse.json(
        { success: false, error: '该条目已转化为任务' },
        { status: 400 }
      );
    }

    const todo = await db.$transaction(async (tx) => {
      const newTodo = await tx.todo.create({
        data: {
          title: title?.trim() || inboxItem.content,
          description: description?.trim() || null,
          startDate: new Date(startDate),
          dueDate: new Date(dueDate),
          categoryId: categoryId || null,
          levelId: levelId || null,
          userId,
          status: 'pending',
        },
        include: { category: true, level: true },
      });

      await tx.inboxItem.update({
        where: { id },
        data: {
          convertedToTodoId: newTodo.id,
          convertedAt: new Date(),
        },
      });

      return newTodo;
    });

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('Convert inbox item error:', error);
    return NextResponse.json(
      { success: false, error: '转化失败' },
      { status: 500 }
    );
  }
}
