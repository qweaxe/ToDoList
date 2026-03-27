import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// POST /api/auth/change-password - 修改密码
export async function POST(request: NextRequest) {
  try {
    // 验证用户已登录
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    // 获取用户信息
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(
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
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    // 更新密码
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      code: 'PASSWORD_CHANGED',
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
