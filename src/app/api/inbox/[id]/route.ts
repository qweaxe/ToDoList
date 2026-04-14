export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

/**
 * PUT /api/inbox/:id - 更新捕获箱条目内容
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;
    const body = await request.json() as { content?: string };
    const { content } = body;

    const trimmedContent = content?.trim();
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
      const existing = await d1.first<{ userId: string }>(
        'SELECT userId FROM inbox_items WHERE id = ?',
        id
      );
      if (!existing || existing.userId !== userId) {
        return NextResponse.json(
          { success: false, error: '条目不存在' },
          { status: 404 }
        );
      }
      await d1.run(
        'UPDATE inbox_items SET content = ? WHERE id = ?',
        trimmedContent, id
      );
      return NextResponse.json({
        success: true,
        data: { id, content: trimmedContent },
      });
    }

    const db = await getDb();
    const existing = await db.inboxItem.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '条目不存在' },
        { status: 404 }
      );
    }

    const item = await db.inboxItem.update({
      where: { id },
      data: { content: trimmedContent },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Update inbox item error:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inbox/:id - 删除捕获箱条目
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const existing = await d1.first<{ userId: string }>(
        'SELECT userId FROM inbox_items WHERE id = ?',
        id
      );
      if (!existing || existing.userId !== userId) {
        return NextResponse.json(
          { success: false, error: '条目不存在' },
          { status: 404 }
        );
      }
      await d1.run('DELETE FROM inbox_items WHERE id = ?', id);
      return NextResponse.json({ success: true });
    }

    const db = await getDb();
    const existing = await db.inboxItem.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '条目不存在' },
        { status: 404 }
      );
    }

    await db.inboxItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete inbox item error:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}
