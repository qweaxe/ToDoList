export const runtime = 'edge';

/**
 * 增量同步接口
 * 获取指定时间后的数据变更
 *
 * GET /api/sync?since=2026-04-01T00:00:00Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

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
    const sinceISO = sinceDate.toISOString();

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 并行查询任务和分类
      const [todoRows, categoryRows] = await Promise.all([
        d1.all<any>(
          `SELECT t.id, t.title, t.description, t.status,
            t.startDate, t.dueDate, t.completedAt, t.subTasks,
            t.isMilestone, t.isCycleTask, t.priority, t.categoryId, t.levelId,
            t.createdAt, t.updatedAt,
            c.id AS cat_id, c.name AS cat_name, c.emoji AS cat_emoji, c.color AS cat_color,
            l.id AS lvl_id, l.name AS lvl_name, l.value AS lvl_value
            FROM todos t
            LEFT JOIN categories c ON c.id = t.categoryId
            LEFT JOIN levels l ON l.id = t.levelId
            WHERE t.userId = ? AND t.updatedAt >= ?
            ORDER BY t.updatedAt ASC`,
          userId, sinceISO
        ),
        d1.all<any>(
          `SELECT id, name, description, emoji, color, createdAt, updatedAt
            FROM categories WHERE userId = ? AND updatedAt >= ?
            ORDER BY updatedAt ASC`,
          userId, sinceISO
        ),
      ]);

      // 格式化任务数据
      const formattedTodos = todoRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        startDate: row.startDate,
        dueDate: row.dueDate,
        completedAt: row.completedAt,
        isMilestone: Boolean(row.isMilestone),
        isCycleTask: Boolean(row.isCycleTask),
        priority: row.priority,
        subTasks: row.subTasks ? JSON.parse(row.subTasks) : [],
        categoryId: row.categoryId,
        levelId: row.levelId,
        category: row.cat_id ? { id: row.cat_id, name: row.cat_name, emoji: row.cat_emoji, color: row.cat_color } : null,
        level: row.lvl_id ? { id: row.lvl_id, name: row.lvl_name, value: row.lvl_value } : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      // 格式化分类数据
      const formattedCategories = categoryRows.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        emoji: cat.emoji,
        color: cat.color,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
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
          since: sinceISO,
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
          deleted: {
            todos: [],
            categories: [],
            note: '时间戳方案无法获取已删除记录，如需完整同步请使用 SyncLog 方案',
          },
        },
      });
    }

    const db = await getDb();

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
