import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCategorySchema } from '@/types/api';

// GET /api/categories - 获取所有分类
export async function GET() {
  try {
    const categories = await db.category.findMany({
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
    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    // 检查名称是否已存在
    const existing = await db.category.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: '分类名称已存在' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: validated,
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
