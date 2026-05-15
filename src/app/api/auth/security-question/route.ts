export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { getApiSession } from '@/lib/api-auth';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

const setSecurityQuestionSchema = z.object({
  question: z.string().min(1).max(100),
  answer: z.string().min(1).max(50),
});

// GET /api/auth/security-question - 获取当前用户的安全问题状态
export async function GET(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    let securityQuestion: string | null = null;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const user = await d1.first<{ securityQuestion: string | null }>(
        'SELECT securityQuestion FROM users WHERE id = ?',
        userId
      );
      securityQuestion = user?.securityQuestion ?? null;
    } else {
      const db = await getDb();
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { securityQuestion: true },
      });
      securityQuestion = user?.securityQuestion ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSecurityQuestion: !!securityQuestion,
        question: securityQuestion,
      },
    });
  } catch (error) {
    console.error('Get security question error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/auth/security-question - 设置/修改安全问题
export async function POST(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const validated = setSecurityQuestionSchema.parse(body);

    // 加密答案（存储时忽略大小写差异）
    const hashedAnswer = await hashPassword(validated.answer.toLowerCase().trim());
    const now = new Date().toISOString();

    if (IS_EDGE) {
      const d1 = await getD1Client();
      await d1.run(
        `UPDATE users
         SET securityQuestion = ?, securityAnswer = ?,
             securityAnswerAttempts = 0, securityAnswerLockedAt = NULL, updatedAt = ?
         WHERE id = ?`,
        validated.question.trim(), hashedAnswer, now, userId
      );
    } else {
      const db = await getDb();
      await db.user.update({
        where: { id: userId },
        data: {
          securityQuestion: validated.question.trim(),
          securityAnswer: hashedAnswer,
          securityAnswerAttempts: 0,
          securityAnswerLockedAt: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      code: 'SECURITY_QUESTION_SET',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.error('Set security question error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/security-question - 删除安全问题
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    const now = new Date().toISOString();

    if (IS_EDGE) {
      const d1 = await getD1Client();
      await d1.run(
        `UPDATE users
         SET securityQuestion = NULL, securityAnswer = NULL,
             securityAnswerAttempts = 0, securityAnswerLockedAt = NULL, updatedAt = ?
         WHERE id = ?`,
        now, userId
      );
    } else {
      const db = await getDb();
      await db.user.update({
        where: { id: userId },
        data: {
          securityQuestion: null,
          securityAnswer: null,
          securityAnswerAttempts: 0,
          securityAnswerLockedAt: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      code: 'SECURITY_QUESTION_DELETED',
    });
  } catch (error) {
    console.error('Delete security question error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
