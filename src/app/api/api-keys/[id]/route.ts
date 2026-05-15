export const runtime = 'edge';

/**
 * 删除单个 API Key
 * DELETE: 撤销（删除）指定的 API Key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 检查 API Key 是否属于当前用户
      const apiKey = await d1.first<{ id: string }>(
        'SELECT id FROM api_keys WHERE id = ? AND userId = ?',
        id, userId
      );

      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'API Key 不存在或无权删除' },
          { status: 404 }
        );
      }

      // 删除 API Key
      await d1.run('DELETE FROM api_keys WHERE id = ?', id);

      return NextResponse.json({
        success: true,
        message: 'API Key 已撤销',
      });
    }

    const db = await getDb();

    // 检查 API Key 是否属于当前用户
    const apiKey = await db.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key 不存在或无权删除' },
        { status: 404 }
      );
    }

    // 删除 API Key
    await db.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'API Key 已撤销',
    });
  } catch (error) {
    console.error('删除 API Key 失败:', error);
    return NextResponse.json(
      { success: false, error: '删除 API Key 失败' },
      { status: 500 }
    );
  }
}
