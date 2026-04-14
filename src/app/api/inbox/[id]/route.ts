export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';

/**
 * PUT /api/inbox/:id - 更新捕获箱条目内容
 * Body: { content: string }
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

    // 检查条目存在且属于当前用户
    const existing = await db.inboxItem.findUnique({
      where: { id },
    });

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

    return NextResponse.json({
      success: true,
      data: item,
    });
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
    const db = await getDb();

    // 检查条目存在且属于当前用户
    const existing = await db.inboxItem.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '条目不存在' },
        { status: 404 }
      );
    }

    await db.inboxItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete inbox item error:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}
