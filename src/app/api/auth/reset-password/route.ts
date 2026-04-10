export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, hashPassword } from '@/lib/password';
import { z } from 'zod';
import { getDb } from '@/lib/db';

const resetPasswordSchema = z.object({
  username: z.string().min(1),
  answer: z.string().min(1),
  newPassword: z.string().min(6),
});

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 分钟

// POST /api/auth/reset-password - 验证答案并重置密码
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    const user = await db.user.findUnique({
      where: { username: validated.username },
      select: {
        id: true,
        username: true,
        securityQuestion: true,
        securityAnswer: true,
        securityAnswerAttempts: true,
        securityAnswerLockedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    if (!user.securityQuestion || !user.securityAnswer) {
      return NextResponse.json(
        { success: false, code: 'NO_SECURITY_QUESTION' },
        { status: 400 }
      );
    }

    // 检查是否被锁定
    if (user.securityAnswerLockedAt) {
      const lockTime = new Date(user.securityAnswerLockedAt).getTime();
      const now = Date.now();

      if (now - lockTime < LOCK_DURATION_MS) {
        const remainingMinutes = Math.ceil(
          (LOCK_DURATION_MS - (now - lockTime)) / 60000
        );
        return NextResponse.json(
          {
            success: false,
            code: 'ACCOUNT_LOCKED',
            data: { remainingMinutes },
          },
          { status: 400 }
        );
      }

      // 锁定已过期，重置
      await db.user.update({
        where: { id: user.id },
        data: {
          securityAnswerAttempts: 0,
          securityAnswerLockedAt: null,
        },
      });
    }

    // 验证答案（忽略大小写）
    const isAnswerValid = await verifyPassword(
      validated.answer.toLowerCase().trim(),
      user.securityAnswer
    );

    if (!isAnswerValid) {
      const newAttempts = user.securityAnswerAttempts + 1;

      // 达到最大尝试次数，锁定账户
      if (newAttempts >= MAX_ATTEMPTS) {
        await db.user.update({
          where: { id: user.id },
          data: {
            securityAnswerAttempts: newAttempts,
            securityAnswerLockedAt: new Date(),
          },
        });

        return NextResponse.json(
          {
            success: false,
            code: 'ACCOUNT_LOCKED',
            data: { remainingMinutes: 30 },
          },
          { status: 400 }
        );
      }

      // 更新尝试次数
      await db.user.update({
        where: { id: user.id },
        data: { securityAnswerAttempts: newAttempts },
      });

      return NextResponse.json(
        {
          success: false,
          code: 'WRONG_ANSWER',
          data: { attemptsLeft: MAX_ATTEMPTS - newAttempts },
        },
        { status: 400 }
      );
    }

    // 验证成功，重置尝试次数并更新密码
    const hashedPassword = await hashPassword(validated.newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        securityAnswerAttempts: 0,
        securityAnswerLockedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      code: 'PASSWORD_RESET_SUCCESS',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
