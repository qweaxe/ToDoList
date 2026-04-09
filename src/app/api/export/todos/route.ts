export const runtime = 'edge';

/**
 * 任务数据导出接口
 * GET: 导出用户的所有任务数据
 * 支持查询参数筛选
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
    const { searchParams } = new URL(request.url);

    // 解析筛选参数
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const levelId = searchParams.get('levelId');
    const format = searchParams.get('format') || 'json'; // json 或 csv

    // 构建查询条件
    const where: any = { userId };

    if (startDate) {
      where.startDate = { ...where.startDate, gte: startDate };
    }
    if (endDate) {
      where.dueDate = { ...where.dueDate, lte: endDate };
    }
    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (levelId) {
      where.levelId = levelId;
    }

    // 查询任务数据
    const todos = await db.todo.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, emoji: true, color: true },
        },
        level: {
          select: { id: true, name: true, value: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });

    // 格式化数据
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
      subTasks: todo.subTasks ? JSON.parse(todo.subTasks) : [],
      category: todo.category,
      level: todo.level,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    }));

    // 根据 format 返回不同格式
    if (format === 'csv') {
      // 生成 CSV
      const headers = [
        'ID',
        '标题',
        '描述',
        '状态',
        '开始日期',
        '截止日期',
        '完成日期',
        '里程碑',
        '周期任务',
        '分类',
        '等级',
        '创建时间',
      ];

      const rows = formattedTodos.map((t) => [
        t.id,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.status,
        t.startDate,
        t.dueDate,
        t.completedAt || '',
        t.isMilestone ? '是' : '否',
        t.isCycleTask ? '是' : '否',
        t.category?.name || '',
        t.level?.name || '',
        t.createdAt.toISOString(),
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="todos-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // 默认返回 JSON
    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        total: formattedTodos.length,
        todos: formattedTodos,
      },
    });
  } catch (error) {
    console.error('导出任务失败:', error);
    return NextResponse.json(
      { success: false, error: '导出任务失败' },
      { status: 500 }
    );
  }
}
