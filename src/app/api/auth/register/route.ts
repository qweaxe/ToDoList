import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),
  password: z.string().min(6, '密码至少6个字符'),
  name: z.string().max(50, '昵称最多50个字符').optional(),
});

// POST /api/auth/register - 用户注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // 检查用户名是否已存在
    const existingUser = await db.user.findUnique({
      where: { username: validated.username },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // 创建用户
    const user = await db.user.create({
      data: {
        username: validated.username,
        password: hashedPassword,
        name: validated.name || validated.username,
      },
    });

    // 为新用户创建默认分类
    await db.category.createMany({
      data: [
        {
          name: '工作',
          emoji: '💼',
          color: 'blue',
          userId: user.id,
        },
        {
          name: '学习',
          emoji: '📚',
          color: 'green',
          userId: user.id,
        },
        {
          name: '生活',
          emoji: '🏠',
          color: 'orange',
          userId: user.id,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
