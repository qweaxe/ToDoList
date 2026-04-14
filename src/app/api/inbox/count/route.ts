export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

/**
 * GET /api/inbox/count - 获取未处理条目数
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const result = await d1.first<{ count: number }>(
        'SELECT COUNT(*) as count FROM inbox_items WHERE userId = ? AND convertedToTodoId IS NULL',
        userId
      );
      return NextResponse.json({
        success: true,
        data: { count: result?.count ?? 0 },
      });
    }

    const db = await getDb();
    const count = await db.inboxItem.count({
      where: { userId, convertedToTodoId: null },
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get inbox count error:', error);
    return NextResponse.json(
      { success: false, error: '获取数量失败' },
      { status: 500 }
    );
  }
}
