export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

// POST /api/reminders/[id]/sent - 标记提醒为已发送
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const reminder = await d1.first<any>(
        `SELECT r.id, r.todoId, t.userId
         FROM reminders r
         JOIN todos t ON r.todoId = t.id
         WHERE r.id = ?`,
        id
      );

      if (!reminder) {
        return NextResponse.json(
          { success: false, error: '提醒不存在' },
          { status: 404 }
        );
      }

      if (reminder.userId !== userId) {
        return NextResponse.json(
          { success: false, error: '无权操作' },
          { status: 403 }
        );
      }

      await d1.run('UPDATE reminders SET sent = 1 WHERE id = ?', id);

      return NextResponse.json({
        success: true,
        message: '已标记为发送',
      });
    }

    const db = await getDb();

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
