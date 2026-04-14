export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';

/**
 * GET /api/inbox/count - 获取未处理条目数
 * 用于侧边栏徽章显示
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
    const db = await getDb();

    const count = await db.inboxItem.count({
      where: {
        userId,
        convertedToTodoId: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get inbox count error:', error);
    return NextResponse.json(
      { success: false, error: '获取数量失败' },
      { status: 500 }
    );
  }
}
