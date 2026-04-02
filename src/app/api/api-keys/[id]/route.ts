/**
 * 删除单个 API Key
 * DELETE: 撤销（删除）指定的 API Key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 检查 API Key 是否属于当前用户
    const apiKey = await db.apiKey.findFirst({
      where: { id, userId: session.user.id },
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
