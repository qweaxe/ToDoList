export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { updateCategorySchema } from '@/types/api';
import { getAuthSession } from '@/lib/auth';

// GET /api/categories/[id] - 获取单个分类
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    const category = await db.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { todos: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        todoCount: category._count.todos,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { success: false, error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();
    const validated = updateCategorySchema.parse(body);

    // 检查分类是否存在且属于当前用户
    const existing = await db.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }

    // 如果要更新名称，检查是否与其他分类重名（用户级别）
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await db.category.findFirst({
        where: { name: validated.name, userId },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: '分类名称已存在' },
          { status: 400 }
        );
      }
    }

    const category = await db.category.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // 检查分类是否存在且属于当前用户
    const existing = await db.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { todos: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联的任务
    if (existing._count.todos > 0) {
      return NextResponse.json(
        { success: false, error: `该分类下有 ${existing._count.todos} 个任务，无法删除` },
        { status: 400 }
      );
    }

    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '分类已删除',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, error: '删除分类失败' },
      { status: 500 }
    );
  }
}
