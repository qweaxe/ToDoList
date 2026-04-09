/**
 * 完整数据备份接口
 * GET: 导出用户的所有数据（任务、分类、周期规则等）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 支持 Bearer Token 和 Session 双重认证
    const authResult = await getApiSession(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    // 并行查询所有数据
    const [todos, categories, recurrenceRules] = await Promise.all([
      // 查询所有任务
      db.todo.findMany({
        where: { userId },
        include: {
          category: { select: { id: true, name: true, emoji: true, color: true } },
          level: { select: { id: true, name: true, value: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 查询所有分类
      db.category.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),

      // 查询所有周期规则
      db.recurrenceRule.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
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

    // 格式化周期规则
    const formattedRecurrenceRules = recurrenceRules.map((rule) => ({
      id: rule.id,
      frequency: rule.frequency,
      interval: rule.interval,
      byDay: rule.byDay ? JSON.parse(rule.byDay) : null,
      cronExpr: rule.cronExpr,
      startDate: rule.startDate,
      endDate: rule.endDate,
      isActive: rule.isActive,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    }));

    // 统计信息
    const stats = {
      totalTodos: todos.length,
      completedTodos: todos.filter((t) => t.status === 'completed').length,
      pendingTodos: todos.filter((t) => t.status === 'pending').length,
      inProgressTodos: todos.filter((t) => t.status === 'in_progress').length,
      totalCategories: categories.length,
      totalRecurrenceRules: recurrenceRules.length,
    };

    // 返回完整备份数据
    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        stats,
        todos: formattedTodos,
        categories: formattedCategories,
        recurrenceRules: formattedRecurrenceRules,
      },
    });
  } catch (error) {
    console.error('备份数据失败:', error);
    return NextResponse.json(
      { success: false, error: '备份数据失败' },
      { status: 500 }
    );
  }
}
