import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
});

// POST /api/auth/change-password - 修改密码
export async function POST(request: NextRequest) {
  try {
    // 验证用户已登录
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未登录' },
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
        { success: false, error: '用户不存在' },
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
        { success: false, error: '当前密码错误' },
        { status: 400 }
      );
    }

    // 检查新密码不能与旧密码相同
    if (validated.currentPassword === validated.newPassword) {
      return NextResponse.json(
        { success: false, error: '新密码不能与当前密码相同' },
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
      message: '密码修改成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: '密码修改失败，请稍后重试' },
      { status: 500 }
    );
  }
}