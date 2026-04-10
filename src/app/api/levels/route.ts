export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

// GET /api/levels - 获取所有等级（固定返回高、中、低）
export async function GET() {
  try {
    if (IS_EDGE) {
      const d1 = await getD1Client();
      const levels = await d1.all<any>(`
        SELECT l.id, l.name, l.value, l.description, l.createdAt, l.updatedAt,
               COUNT(t.id) AS todoCount
        FROM levels l
        LEFT JOIN todos t ON t.levelId = l.id
        GROUP BY l.id
        ORDER BY l.value DESC
      `);
      return NextResponse.json({
        success: true,
        data: levels.map(l => ({ ...l, todoCount: Number(l.todoCount ?? 0) })),
      });
    }

    const db = await getDb();
    const levels = await db.level.findMany({
      orderBy: { value: 'desc' },
      include: {
        _count: {
          select: { todos: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: levels.map(l => ({
        ...l,
        todoCount: l._count.todos,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error('Get levels error:', error);
    return NextResponse.json(
      { success: false, error: '获取等级失败' },
      { status: 500 }
    );
  }
}
