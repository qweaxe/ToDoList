import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

// DELETE /api/reminders/[id] - 删除提醒
export async function DELETE(
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
    const { id } = await params;

    // 验证提醒属于用户
    const reminder = await db.reminder.findFirst({
      where: { id },
      include: { todo: { select: { userId: true } } },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: '提醒不存在' },
        { status: 404 }
      );
    }

    if (reminder.todo.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权操作' },
        { status: 403 }
      );
    }

    await db.reminder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '提醒已删除',
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}
