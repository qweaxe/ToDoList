export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';

/**
 * GET /api/inbox - 获取捕获箱条目
 * Query params:
 * - includeConverted: boolean - 是否包含已转化的条目
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
    const { searchParams } = new URL(request.url);
    const includeConverted = searchParams.get('includeConverted') === 'true';

    const db = await getDb();

    const where = includeConverted
      ? { userId }
      : { userId, convertedToTodoId: null };

    const items = await db.inboxItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Get inbox items error:', error);
    return NextResponse.json(
      { success: false, error: '获取捕获箱失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inbox - 创建捕获箱条目
 * Body: { content: string }
 */
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
    const body = await request.json();
    const { content } = body;

    // 验证 content
    const trimmedContent = (content as string)?.trim();
    if (!trimmedContent) {
      return NextResponse.json(
        { success: false, error: '内容不能为空' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 500) {
      return NextResponse.json(
        { success: false, error: '内容最多 500 字符' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const item = await db.inboxItem.create({
      data: {
        content: trimmedContent,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Create inbox item error:', error);
    return NextResponse.json(
      { success: false, error: '创建失败' },
      { status: 500 }
    );
  }
}
