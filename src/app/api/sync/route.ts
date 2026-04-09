export const runtime = 'edge';

/**
 * 增量同步接口
 * 获取指定时间后的数据变更
 *
 * GET /api/sync?since=2026-04-01T00:00:00Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    // 解析 since 参数
    let sinceDate: Date;
    if (since) {
      sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          { success: false, error: '无效的时间格式，请使用 ISO 8601 格式 (如: 2026-04-01T00:00:00Z)' },
          { status: 400 }
        );
      }
    } else {
      // 默认同步最近 7 天的数据
      sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 7);
    }

    const syncTime = new Date().toISOString();

    // 并行查询任务和分类
    const [todos, categories] = await Promise.all([
      // 查询更新的任务
      db.todo.findMany({
        where: {
          userId,
          updatedAt: { gte: sinceDate },
        },
        include: {
          category: { select: { id: true, name: true, emoji: true, color: true } },
          level: { select: { id: true, name: true, value: true } },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      // 查询更新的分类
      db.category.findMany({
        where: {
          userId,
          updatedAt: { gte: sinceDate },
        },
        orderBy: { updatedAt: 'asc' },
      }),
    ]);

    // 格式化任务数据
    const formattedTodos = todos.map((todo) => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      status: todo.status,
      startDate: todo.startDate,
      dueDate: todo.dueDate,
      completedAt: todo.completedAt,
      isMilestone: todo.isMilestone,
      isCycleTask: todo.isCycleTask,
      priority: todo.priority,
      subTasks: todo.subTasks ? JSON.parse(todo.subTasks) : [],
      categoryId: todo.categoryId,
      levelId: todo.levelId,
      category: todo.category,
      level: todo.level,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
    }));

    // 格式化分类数据
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      emoji: cat.emoji,
      color: cat.color,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));

    // 根据创建时间和更新时间判断是新建还是更新
    const newTodos: typeof formattedTodos = [];
    const updatedTodos: typeof formattedTodos = [];

    for (const todo of formattedTodos) {
      const createdAt = new Date(todo.createdAt);
      if (createdAt >= sinceDate) {
        newTodos.push(todo);
      } else {
        updatedTodos.push(todo);
      }
    }

    const newCategories: typeof formattedCategories = [];
    const updatedCategories: typeof formattedCategories = [];

    for (const cat of formattedCategories) {
      const createdAt = new Date(cat.createdAt);
      if (createdAt >= sinceDate) {
        newCategories.push(cat);
      } else {
        updatedCategories.push(cat);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        syncTime,
        since: sinceDate.toISOString(),
        todos: {
          new: newTodos,
          updated: updatedTodos,
          total: formattedTodos.length,
        },
        categories: {
          new: newCategories,
          updated: updatedCategories,
          total: formattedCategories.length,
        },
        // 注意：删除的任务无法通过时间戳方案获取
        // 如需完整支持删除同步，需要实现 SyncLog 表
        deleted: {
          todos: [],
          categories: [],
          note: '时间戳方案无法获取已删除记录，如需完整同步请使用 SyncLog 方案',
        },
      },
    });
  } catch (error) {
    console.error('同步数据失败:', error);
    return NextResponse.json(
      { success: false, error: '同步数据失败' },
      { status: 500 }
    );
  }
}
