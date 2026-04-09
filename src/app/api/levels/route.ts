export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/levels - 获取所有等级（固定返回高、中、低）
export async function GET() {
  try {
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
