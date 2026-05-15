export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_一-龥]+$/, '用户名只能包含字母、数字、下划线和中文'),
  password: z.string().min(6, '密码至少6个字符'),
  name: z.string().max(50, '昵称最多50个字符').optional(),
});

// POST /api/auth/register - 用户注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 检查用户名是否已存在
      const existingUser = await d1.first<{ id: string }>(
        'SELECT id FROM users WHERE username = ?',
        validated.username
      );

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: '用户名已存在' },
          { status: 400 }
        );
      }

      // 加密密码
      const hashedPassword = await hashPassword(validated.password);
      const userId = crypto.randomUUID();
      const userName = validated.name || validated.username;
      const now = new Date().toISOString();

      // 创建用户
      await d1.run(
        'INSERT INTO users (id, username, password, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        userId, validated.username, hashedPassword, userName, now, now
      );

      // 为新用户创建默认分类
      const categories = [
        { name: '工作', emoji: '💼', color: 'blue' },
        { name: '学习', emoji: '📚', color: 'green' },
        { name: '生活', emoji: '🏠', color: 'orange' },
      ];

      for (const cat of categories) {
        const catId = crypto.randomUUID();
        await d1.run(
          'INSERT INTO categories (id, name, emoji, color, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          catId, cat.name, cat.emoji, cat.color, userId, now, now
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: userId,
          username: validated.username,
          name: userName,
        },
      });
    }

    // Prisma fallback (development)
    const db = await getDb();

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
    const hashedPassword = await hashPassword(validated.password);

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