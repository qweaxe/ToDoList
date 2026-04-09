export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

// GET /api/reminders/pending - 获取待发送的提醒
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const now = new Date();

    const reminders = await db.reminder.findMany({
      where: {
        sent: false,
        remindAt: { lte: now },
        todo: {
          userId,
          status: { not: 'completed' },
        },
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
      orderBy: { remindAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: reminders.map(r => ({
        id: r.id,
        todoId: r.todoId,
        todoTitle: r.todo.title,
        remindAt: r.remindAt.toISOString(),
        type: r.type,
        offset: r.offset,
      })),
    });
  } catch (error) {
    console.error('Get pending reminders error:', error);
    return NextResponse.json(
      { success: false, error: '获取提醒失败' },
      { status: 500 }
    );
  }
}
