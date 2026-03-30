import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { z } from 'zod';
import { format } from 'date-fns';

const updateSubTaskSchema = z.object({
  subTaskId: z.string(),
  isDone: z.boolean(),
});

// PUT /api/todos/[id]/subtask - Update subtask status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Check if task exists and belongs to current user
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

    // Parse and update subtasks
    const subTasks = existing.subTasks ? JSON.parse(existing.subTasks) : [];
    const updatedSubTasks = subTasks.map((st: { id: string; isDone: boolean }) =>
      st.id === validated.subTaskId ? { ...st, isDone: validated.isDone } : st
    );

    // Check if all subtasks are done
    const allSubTasksDone = updatedSubTasks.length > 0 && updatedSubTasks.every((st: { isDone: boolean }) => st.isDone);

    // Prepare update data
    const updateData: {
      subTasks: string;
      status?: string;
      completedAt?: string;
    } = {
      subTasks: JSON.stringify(updatedSubTasks),
    };

    // If all subtasks are done, auto-complete the main task
    if (allSubTasksDone) {
      updateData.status = 'completed';
      updateData.completedAt = format(new Date(), 'yyyy-MM-dd');
    }

    // Update task
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
