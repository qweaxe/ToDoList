export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

const forgotPasswordSchema = z.object({
  username: z.string().min(1),
});

// POST /api/auth/forgot-password - 根据用户名获取安全问题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const user = await d1.first<{
        id: string;
        username: string;
        securityQuestion: string | null;
        securityAnswerLockedAt: string | null;
      }>(
        'SELECT id, username, securityQuestion, securityAnswerLockedAt FROM users WHERE username = ?',
        validated.username
      );

      if (!user) {
        return NextResponse.json(
          { success: false, code: 'USER_NOT_FOUND' },
          { status: 400 }
        );
      }

      if (!user.securityQuestion) {
        return NextResponse.json(
          { success: false, code: 'NO_SECURITY_QUESTION' },
          { status: 400 }
        );
      }

      // 检查是否被锁定
      if (user.securityAnswerLockedAt) {
        const lockTime = new Date(user.securityAnswerLockedAt).getTime();
        const now = Date.now();
        const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 分钟

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
      }

      return NextResponse.json({
        success: true,
        data: {
          username: user.username,
          question: user.securityQuestion,
        },
      });
    }

    // Prisma fallback (development)
    const db = await getDb();

    const user = await db.user.findUnique({
      where: { username: validated.username },
      select: {
        id: true,
        username: true,
        securityQuestion: true,
        securityAnswerLockedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    if (!user.securityQuestion) {
      return NextResponse.json(
        { success: false, code: 'NO_SECURITY_QUESTION' },
        { status: 400 }
      );
    }

    // 检查是否被锁定
    if (user.securityAnswerLockedAt) {
      const lockTime = new Date(user.securityAnswerLockedAt).getTime();
      const now = Date.now();
      const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 分钟

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
    }

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        question: user.securityQuestion,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}