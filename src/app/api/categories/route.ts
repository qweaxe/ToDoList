import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCategorySchema } from '@/types/api';
import { getAuthSession } from '@/lib/auth';

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
