export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

// POST /api/reminders/[id]/sent - 标记提醒为已发送
export async function POST(
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

    await db.reminder.update({
      where: { id },
      data: { sent: true },
    });

    return NextResponse.json({
      success: true,
      message: '已标记为发送',
    });
  } catch (error) {
    console.error('Mark reminder sent error:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    );
  }
}
