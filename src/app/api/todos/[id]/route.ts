import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateTodoSchema } from '@/types/api';
import { getApiSession } from '@/lib/api-auth';

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

    const todo = await db.todo.findFirst({
      where: { id, userId },
      include: {
        category: true,
        level: true,
        recurrenceRule: true,
      },
    });

    if (!todo) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Get todo error:', error);
    return NextResponse.json(
      { success: false, error: '获取任务失败' },
      { status: 500 }
    );
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

    // 检查任务是否存在且属于当前用户
    const existing = await db.todo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    // 验证日期时间
    const startDate = validated.startDate ? new Date(validated.startDate) : existing.startDate;
    const dueDate = validated.dueDate ? new Date(validated.dueDate) : existing.dueDate;
    if (startDate > dueDate) {
      return NextResponse.json(
        { success: false, error: '开始日期不能晚于截止日期' },
        { status: 400 }
      );
    }

    // 准备更新数据
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

    // 完成日期 - 只有非 null 的有效日期字符串才检查任务状态
    // null/undefined 表示不修改或清除完成日期
    if (validated.completedAt !== undefined) {
      // 如果是非 null 的有效日期字符串，需要检查任务状态
      if (validated.completedAt !== null) {
        if (existing.status !== 'completed') {
          return NextResponse.json(
            { success: false, error: '未完成的任务不能设置完成日期' },
            { status: 400 }
          );
        }
        updateData.completedAt = new Date(validated.completedAt);
      } else {
        updateData.completedAt = null;
      }
    }

    const todo = await db.todo.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        level: true,
        recurrenceRule: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json(
      { success: false, error: '更新任务失败' },
      { status: 500 }
    );
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

    // 检查任务是否存在且属于当前用户
    const existing = await db.todo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    await db.todo.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '任务已删除',
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json(
      { success: false, error: '删除任务失败' },
      { status: 500 }
    );
  }
}
