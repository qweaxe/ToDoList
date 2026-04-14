export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

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
    const body = await request.json() as { id?: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少任务ID' },
        { status: 400 }
      );
    }

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const existing = await d1.first<{ id: string; status: string }>(
        'SELECT id, status FROM todos WHERE id=? AND userId=?',
        id, userId
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '任务不存在' },
          { status: 404 }
        );
      }

      const newStatus = existing.status === 'completed' ? 'pending' : 'completed';
      const now = new Date().toISOString();
      const completedAt = newStatus === 'completed' ? now : null;

      await d1.run(
        'UPDATE todos SET status=?, completedAt=?, updatedAt=? WHERE id=?',
        newStatus, completedAt, now, id
      );

      // 返回更新后的任务（含分类和等级）
      const updated = await d1.first<Record<string, unknown>>(
        `SELECT t.*, c.id as cat_id, c.name as cat_name, c.emoji as cat_emoji, c.color as cat_color,
                l.id as lvl_id, l.name as lvl_name, l.value as lvl_value, l.description as lvl_desc
         FROM todos t
         LEFT JOIN categories c ON c.id = t.categoryId
         LEFT JOIN levels l ON l.id = t.levelId
         WHERE t.id=?`,
        id
      );

      if (!updated) {
        return NextResponse.json({ success: false, error: '获取更新结果失败' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          isCycleTask: Boolean(updated.isCycleTask),
          isMilestone: Boolean(updated.isMilestone),
          category: updated.cat_id ? {
            id: updated.cat_id, name: updated.cat_name,
            emoji: updated.cat_emoji, color: updated.cat_color,
          } : null,
          level: updated.lvl_id ? {
            id: updated.lvl_id, name: updated.lvl_name,
            value: updated.lvl_value, description: updated.lvl_desc,
          } : null,
        },
      });
    }

    // 开发环境：Prisma 路径
    const db = await getDb();

    const existing = await db.todo.findFirst({ where: { id, userId } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    const newStatus = existing.status === 'completed' ? 'pending' : 'completed';
    const now = new Date();

    const todo = await db.todo.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: newStatus === 'completed' ? now : null,
      },
      include: { category: true, level: true },
    });

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('Toggle todo error:', error);
    return NextResponse.json(
      { success: false, error: '切换状态失败' },
      { status: 500 }
    );
  }
}
