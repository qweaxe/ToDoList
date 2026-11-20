export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, hashPassword } from '@/lib/password';
import { z } from 'zod';
import { getApiSession } from '@/lib/api-auth';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';
import { enforceRateLimit } from '@/lib/rate-limit';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// POST /api/auth/change-password - 修改密码
export async function POST(request: NextRequest) {
  try {
    // 速率限制：10 次 / 15 分钟 / IP
    const limited = await enforceRateLimit('chpwd', request.headers, 10, 15 * 60 * 1000);
    if (limited) return limited;

    // 验证用户已登录（支持 Bearer Token 和 Session）
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 获取用户信息
      const user = await d1.first<{ id: string; password: string }>(
        'SELECT id, password FROM users WHERE id = ?',
        authResult.userId
      );

      if (!user) {
        return NextResponse.json(
          { success: false, code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // 验证当前密码
      const isPasswordValid = await verifyPassword(
        validated.currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, code: 'WRONG_PASSWORD' },
          { status: 400 }
        );
      }

      // 检查新密码不能与旧密码相同
      if (validated.currentPassword === validated.newPassword) {
        return NextResponse.json(
          { success: false, code: 'SAME_PASSWORD' },
          { status: 400 }
        );
      }

      // 加密新密码
      const hashedPassword = await hashPassword(validated.newPassword);
      const now = new Date().toISOString();

      // 更新密码并推进 tokenVersion（吊销全部旧 JWT）
      await d1.run(
        'UPDATE users SET password = ?, tokenVersion = tokenVersion + 1, updatedAt = ? WHERE id = ?',
        hashedPassword, now, authResult.userId
      );

      // 吊销全部 API Key
      await d1.run('DELETE FROM api_keys WHERE userId = ?', authResult.userId);

      return NextResponse.json({
        success: true,
        code: 'PASSWORD_CHANGED',
        revokedSessions: true,
      });
    }

    // Prisma fallback (development)
    const db = await getDb();

    // 获取用户信息
    const user = await db.user.findUnique({
      where: { id: authResult.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isPasswordValid = await verifyPassword(
      validated.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, code: 'WRONG_PASSWORD' },
        { status: 400 }
      );
    }

    // 检查新密码不能与旧密码相同
    if (validated.currentPassword === validated.newPassword) {
      return NextResponse.json(
        { success: false, code: 'SAME_PASSWORD' },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await hashPassword(validated.newPassword);

    // 更新密码并推进 tokenVersion（吊销全部旧 JWT），吊销全部 API Key
    await db.user.update({
      where: { id: authResult.userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });
    await db.apiKey.deleteMany({ where: { userId: authResult.userId } });

    return NextResponse.json({
      success: true,
      code: 'PASSWORD_CHANGED',
      revokedSessions: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}