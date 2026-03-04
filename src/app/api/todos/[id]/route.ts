import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateTodoSchema } from '@/types/api';

// GET /api/todos/[id] - 获取单个任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const todo = await db.todo.findUnique({
      where: { id },
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
    const { id } = await params;
    const body = await request.json();
    
    // 调试日志
    console.log('=== PUT /api/todos/[id] ===');
    console.log('Task ID:', id);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const validated = updateTodoSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validated, null, 2));

    // 检查任务是否存在
    const existing = await db.todo.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    // 验证日期
    const startDate = validated.startDate ?? existing.startDate;
    const dueDate = validated.dueDate ?? existing.dueDate;
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
    if (validated.startDate !== undefined) updateData.startDate = validated.startDate;
    if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate;
    if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId;
    if (validated.levelId !== undefined) updateData.levelId = validated.levelId;
    if (validated.isCycleTask !== undefined) updateData.isCycleTask = validated.isCycleTask;
    if (validated.isMilestone !== undefined) updateData.isMilestone = validated.isMilestone;
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.subTasks !== undefined) {
      updateData.subTasks = validated.subTasks ? JSON.stringify(validated.subTasks) : null;
    }
    
    console.log('Update data to apply:', JSON.stringify(updateData, null, 2));
    
    // 完成日期 - 只有已完成的任务才能设置有效日期
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
      }
      updateData.completedAt = validated.completedAt;
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
    const { id } = await params;

    // 检查任务是否存在
    const existing = await db.todo.findUnique({
      where: { id },
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
