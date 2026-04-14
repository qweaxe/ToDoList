export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';

interface ConvertBody {
  title?: string;
  description?: string;
  startDate: string; // ISO string
  dueDate: string; // ISO string
  categoryId?: string;
  levelId?: string;
}

/**
 * POST /api/inbox/:id/convert - 将捕获箱条目转化为任务
 * Body: { title?, description?, startDate, dueDate, categoryId?, levelId? }
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

    // 验证必填字段
    if (!startDate || !dueDate) {
      return NextResponse.json(
        { success: false, error: '开始时间和截止时间为必填' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 检查条目存在且属于当前用户
    const inboxItem = await db.inboxItem.findUnique({
      where: { id },
    });

    if (!inboxItem || inboxItem.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '条目不存在' },
        { status: 404 }
      );
    }

    // 检查是否已转化
    if (inboxItem.convertedToTodoId) {
      return NextResponse.json(
        { success: false, error: '该条目已转化为任务' },
        { status: 400 }
      );
    }

    // 使用事务创建任务并更新捕获箱条目
    const todo = await db.$transaction(async (tx) => {
      // 创建任务
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
        include: {
          category: true,
          level: true,
        },
      });

      // 更新捕获箱条目
      await tx.inboxItem.update({
        where: { id },
        data: {
          convertedToTodoId: newTodo.id,
          convertedAt: new Date(),
        },
      });

      return newTodo;
    });

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Convert inbox item error:', error);
    return NextResponse.json(
      { success: false, error: '转化失败' },
      { status: 500 }
    );
  }
}
