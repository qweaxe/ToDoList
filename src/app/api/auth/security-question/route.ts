export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

const setSecurityQuestionSchema = z.object({
  question: z.string().min(1).max(100),
  answer: z.string().min(1).max(50),
});

// GET /api/auth/security-question - 获取当前用户的安全问题状态
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { securityQuestion: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        hasSecurityQuestion: !!user?.securityQuestion,
        question: user?.securityQuestion || null,
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
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = setSecurityQuestionSchema.parse(body);

    // 加密答案（存储时忽略大小写差异）
    const hashedAnswer = await hashPassword(validated.answer.toLowerCase().trim());

    await db.user.update({
      where: { id: session.user.id },
      data: {
        securityQuestion: validated.question.trim(),
        securityAnswer: hashedAnswer,
        securityAnswerAttempts: 0,
        securityAnswerLockedAt: null,
      },
    });

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
export async function DELETE() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        securityQuestion: null,
        securityAnswer: null,
        securityAnswerAttempts: 0,
        securityAnswerLockedAt: null,
      },
    });

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
