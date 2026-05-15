export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

// GET /api/reminders/pending - 获取待发送的提醒
export async function GET(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const now = new Date().toISOString();

      const rows = await d1.all<any>(
        `SELECT r.id, r.todoId, r.remindAt, r.type, r.offset,
                t.id as todoId, t.title as todoTitle, t.dueDate as todoDueDate
         FROM reminders r
         JOIN todos t ON r.todoId = t.id
         WHERE r.sent = 0 AND r.remindAt <= ? AND t.userId = ? AND t.status != 'completed'
         ORDER BY r.remindAt ASC LIMIT 50`,
        now, userId
      );

      return NextResponse.json({
        success: true,
        data: rows.map(r => ({
          id: r.id,
          todoId: r.todoId,
          todoTitle: r.todoTitle,
          remindAt: r.remindAt,
          type: r.type,
          offset: r.offset,
        })),
      });
    }

    const db = await getDb();
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
