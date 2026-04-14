export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

/**
 * GET /api/inbox - 获取捕获箱条目
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

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const sql = includeConverted
        ? 'SELECT * FROM inbox_items WHERE userId = ? ORDER BY createdAt DESC'
        : 'SELECT * FROM inbox_items WHERE userId = ? AND convertedToTodoId IS NULL ORDER BY createdAt DESC';
      const items = await d1.all(sql, userId);
      return NextResponse.json({ success: true, data: items });
    }

    const db = await getDb();
    const where = includeConverted
      ? { userId }
      : { userId, convertedToTodoId: null };

    const items = await db.inboxItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: items });
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
    const body = await request.json() as { content?: string };
    const { content } = body;

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

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await d1.run(
        'INSERT INTO inbox_items (id, content, userId, createdAt) VALUES (?, ?, ?, ?)',
        id, trimmedContent, userId, now
      );
      return NextResponse.json({
        success: true,
        data: { id, content: trimmedContent, userId, createdAt: now, convertedToTodoId: null, convertedAt: null },
      });
    }

    const db = await getDb();
    const item = await db.inboxItem.create({
      data: { content: trimmedContent, userId },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Create inbox item error:', error);
    return NextResponse.json(
      { success: false, error: '创建失败' },
      { status: 500 }
    );
  }
}
