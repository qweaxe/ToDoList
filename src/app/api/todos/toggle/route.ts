import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';

// POST /api/todos/toggle - 切换任务状态
export async function POST(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少任务ID' },
        { status: 400 }
      );
    }

    const existing = await db.todo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    // 切换状态
    const newStatus = existing.status === 'completed' ? 'pending' : 'completed';

    const todo = await db.todo.update({
      where: { id },
      data: {
        status: newStatus,
        // 完成时记录完成日期时间，未完成时清空
        completedAt: newStatus === 'completed' ? new Date() : null,
      },
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
    console.error('Toggle todo error:', error);
    return NextResponse.json(
      { success: false, error: '切换状态失败' },
      { status: 500 }
    );
  }
}
