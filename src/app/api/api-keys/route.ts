export const runtime = 'edge';

/**
 * API Key 管理接口
 * GET: 获取当前用户的所有 API Key
 * POST: 创建新的 API Key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateApiToken, hashToken } from '@/lib/api-auth';
import { z } from 'zod';

// 创建 API Key 的验证 schema
const createApiKeySchema = z.object({
  name: z.string().min(1).max(50, '名称最多 50 个字符'),
  expiresInDays: z.number().int().min(1).max(365).optional(), // 可选：过期天数
});

// 获取所有 API Key（不返回实际的 key 值）
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const apiKeys = await db.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: apiKeys.map((key) => ({
        ...key,
        // 计算是否过期
        isExpired: key.expiresAt ? new Date() > key.expiresAt : false,
      })),
    });
  } catch (error) {
    console.error('获取 API Keys 失败:', error);
    return NextResponse.json(
      { success: false, error: '获取 API Keys 失败' },
      { status: 500 }
    );
  }
}

// 创建新的 API Key
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createApiKeySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || '参数验证失败' },
        { status: 400 }
      );
    }

    const { name, expiresInDays } = validated.data;

    // 检查用户是否已有同名 Token
    const existingKey = await db.apiKey.findFirst({
      where: { userId: session.user.id, name },
    });

    if (existingKey) {
      return NextResponse.json(
        { success: false, error: '已存在同名 API Key' },
        { status: 400 }
      );
    }

    // 生成 Token
    const rawToken = generateApiToken();
    const hashedToken = hashToken(rawToken);

    // 计算过期时间
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // 存储 Token（存储哈希值）
    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: hashedToken,
        userId: session.user.id,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    // 返回创建结果，包含原始 Token（仅此一次）
    return NextResponse.json({
      success: true,
      data: {
        ...apiKey,
        token: rawToken, // 原始 Token，用户需要保存
        warning: '请保存此 Token，关闭后将无法再次查看',
      },
    });
  } catch (error) {
    console.error('创建 API Key 失败:', error);
    return NextResponse.json(
      { success: false, error: '创建 API Key 失败' },
      { status: 500 }
    );
  }
}
