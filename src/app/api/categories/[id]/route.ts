export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';
import { updateCategorySchema } from '@/types/api';
import { getApiSession } from '@/lib/api-auth';

// GET /api/categories/[id] - 获取单个分类
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const category = await d1.first<any>(
        `SELECT c.*, (SELECT COUNT(*) FROM todos WHERE categoryId = c.id) as todoCount
         FROM categories c WHERE c.id = ? AND c.userId = ?`,
        id, userId
      );

      if (!category) {
        return NextResponse.json(
          { success: false, error: '分类不存在' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { ...category, todoCount: Number(category.todoCount ?? 0) },
      });
    }

    const db = await getDb();
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
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;
    const body = await request.json();
    const validated = updateCategorySchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 检查分类是否存在且属于当前用户
      const existing = await d1.first<{ id: string; name: string }>(
        'SELECT id, name FROM categories WHERE id = ? AND userId = ?',
        id, userId
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '分类不存在' },
          { status: 404 }
        );
      }

      // 如果要更新名称，检查是否与其他分类重名（用户级别）
      if (validated.name && validated.name !== existing.name) {
        const duplicate = await d1.first<{ id: string }>(
          'SELECT id FROM categories WHERE name = ? AND userId = ?',
          validated.name, userId
        );

        if (duplicate) {
          return NextResponse.json(
            { success: false, error: '分类名称已存在' },
            { status: 400 }
          );
        }
      }

      // 动态构建 UPDATE SET 子句
      const sets: string[] = [];
      const args: unknown[] = [];
      const now = new Date().toISOString();

      if (validated.name !== undefined) { sets.push('name=?'); args.push(validated.name); }
      if (validated.description !== undefined) { sets.push('description=?'); args.push(validated.description ?? null); }
      if (validated.emoji !== undefined) { sets.push('emoji=?'); args.push(validated.emoji ?? null); }
      if (validated.color !== undefined) { sets.push('color=?'); args.push(validated.color ?? null); }
      sets.push('updatedAt=?');
      args.push(now);
      args.push(id);

      await d1.run(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, ...args);

      const updated = await d1.first<any>(
        'SELECT * FROM categories WHERE id = ?',
        id
      );

      return NextResponse.json({
        success: true,
        data: updated,
      });
    }

    const db = await getDb();

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
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id } = await params;

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const existing = await d1.first<any>(
        `SELECT c.*, (SELECT COUNT(*) FROM todos WHERE categoryId = c.id) as todoCount
         FROM categories c WHERE c.id = ? AND c.userId = ?`,
        id, userId
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '分类不存在' },
          { status: 404 }
        );
      }

      // 检查是否有关联的任务
      const todoCount = Number(existing.todoCount ?? 0);
      if (todoCount > 0) {
        return NextResponse.json(
          { success: false, error: `该分类下有 ${todoCount} 个任务，无法删除` },
          { status: 400 }
        );
      }

      await d1.run('DELETE FROM categories WHERE id = ?', id);

      return NextResponse.json({
        success: true,
        message: '分类已删除',
      });
    }

    const db = await getDb();

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
