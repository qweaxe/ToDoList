export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createCategorySchema } from '@/types/api';
import { getAuthSession } from '@/lib/auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

// GET /api/categories - 获取所有分类
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const categories = await d1.all<any>(`
        SELECT c.id, c.name, c.description, c.emoji, c.color,
               c.userId, c.createdAt, c.updatedAt,
               COUNT(t.id) AS todoCount
        FROM categories c
        LEFT JOIN todos t ON t.categoryId = c.id
        WHERE c.userId = ?
        GROUP BY c.id
        ORDER BY c.createdAt ASC
      `, userId);
      return NextResponse.json({
        success: true,
        data: categories.map(c => ({ ...c, todoCount: Number(c.todoCount ?? 0) })),
      });
    }

    const db = await getDb();
    const categories = await db.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { todos: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories.map(c => ({
        ...c,
        todoCount: c._count.todos,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// POST /api/categories - 创建分类
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const existing = await d1.first<{ id: string }>(
        'SELECT id FROM categories WHERE userId = ? AND name = ?',
        userId, validated.name
      );
      if (existing) {
        return NextResponse.json(
          { success: false, error: '分类名称已存在' },
          { status: 400 }
        );
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await d1.run(
        `INSERT INTO categories (id, name, description, emoji, color, userId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        validated.name,
        validated.description ?? null,
        validated.emoji ?? null,
        validated.color ?? null,
        userId,
        now,
        now
      );

      return NextResponse.json({
        success: true,
        data: { id, ...validated, userId, createdAt: now, updatedAt: now },
      });
    }

    const db = await getDb();

    // 检查名称是否已存在（用户级别）
    const existing = await db.category.findFirst({
      where: { name: validated.name, userId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: '分类名称已存在' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        ...validated,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: '创建分类失败' },
      { status: 500 }
    );
  }
}
