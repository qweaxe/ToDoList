export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { z } from 'zod';
import { format } from 'date-fns';

const updateSubTaskSchema = z.object({
  subTaskId: z.string(),
  isDone: z.boolean(),
});

// PUT /api/todos/[id]/subtask - 更新子任务状态
export async function PUT(
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
    const { id: taskId } = await params;
    const body = await request.json();
    const validated = updateSubTaskSchema.parse(body);

    // 检查任务是否存在且属于当前用户
    const existing = await db.todo.findFirst({
      where: { id: taskId, userId },
      select: { id: true, subTasks: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    // 解析并更新子任务
    const subTasks = existing.subTasks ? JSON.parse(existing.subTasks) : [];
    const updatedSubTasks = subTasks.map((st: { id: string; isDone: boolean }) =>
      st.id === validated.subTaskId ? { ...st, isDone: validated.isDone } : st
    );

    // 检查是否所有子任务都已完成
    const allSubTasksDone = updatedSubTasks.length > 0 && updatedSubTasks.every((st: { isDone: boolean }) => st.isDone);

    // 准备更新数据
    const updateData: {
      subTasks: string;
      status?: string;
      completedAt?: string;
    } = {
      subTasks: JSON.stringify(updatedSubTasks),
    };

    // 如果所有子任务都已完成，自动完成主任务
    if (allSubTasksDone) {
      updateData.status = 'completed';
      // 使用本地时间，不进行时区转换
      const now = new Date();
      const localDate = format(now, 'yyyy-MM-dd');
      const localTime = format(now, 'HH:mm:ss');
      updateData.completedAt = `${localDate}T${localTime}.000Z`;
    }

    // 更新任务
    const todo = await db.todo.update({
      where: { id: taskId },
      data: updateData,
      include: {
        category: true,
        level: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Update subtask error:', error);
    return NextResponse.json(
      { success: false, error: '更新子任务失败' },
      { status: 500 }
    );
  }
}
