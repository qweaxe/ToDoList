export const runtime = 'edge';

/**
 * 任务数据导出接口
 * GET: 导出用户的所有任务数据
 * 支持查询参数筛选
 */

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { getApiSession } from '@/lib/api-auth';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

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
    const outputFormat = searchParams.get('format') || 'json'; // json 或 csv

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

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 构建 D1 SQL 查询条件和参数
      let sql = `SELECT t.id, t.title, t.description, t.status,
        t.startDate, t.dueDate, t.completedAt, t.subTasks,
        t.isMilestone, t.isCycleTask, t.priority, t.categoryId, t.levelId,
        t.createdAt, t.updatedAt,
        c.id AS cat_id, c.name AS cat_name, c.emoji AS cat_emoji, c.color AS cat_color,
        l.id AS lvl_id, l.name AS lvl_name, l.value AS lvl_value
        FROM todos t
        LEFT JOIN categories c ON c.id = t.categoryId
        LEFT JOIN levels l ON l.id = t.levelId
        WHERE t.userId = ?`;
      const params: unknown[] = [userId];

      if (startDate) {
        sql += ' AND t.startDate >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND t.dueDate <= ?';
        params.push(endDate);
      }
      if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
      }
      if (categoryId) {
        sql += ' AND t.categoryId = ?';
        params.push(categoryId);
      }
      if (levelId) {
        sql += ' AND t.levelId = ?';
        params.push(levelId);
      }

      sql += ' ORDER BY t.dueDate ASC, t.createdAt ASC';

      const rows = await d1.all<any>(sql, ...params);

      const formattedTodos = rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        startDate: row.startDate,
        dueDate: row.dueDate,
        completedAt: row.completedAt,
        isMilestone: Boolean(row.isMilestone),
        isCycleTask: Boolean(row.isCycleTask),
        subTasks: row.subTasks ? JSON.parse(row.subTasks) : [],
        category: row.cat_id ? { id: row.cat_id, name: row.cat_name, emoji: row.cat_emoji, color: row.cat_color } : null,
        level: row.lvl_id ? { id: row.lvl_id, name: row.lvl_name, value: row.lvl_value } : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      if (outputFormat === 'csv') {
        const headers = [
          'ID', '标题', '描述', '状态', '开始日期', '截止日期',
          '完成日期', '里程碑', '周期任务', '分类', '等级', '创建时间',
        ];

        const csvRows = formattedTodos.map((t) => [
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
          t.createdAt,
        ]);

        const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="todos-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          exportedAt: new Date().toISOString(),
          total: formattedTodos.length,
          todos: formattedTodos,
        },
      });
    }

    const db = await getDb();

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

    // 根据 outputFormat 返回不同格式
    if (outputFormat === 'csv') {
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
          'Content-Disposition': `attachment; filename="todos-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
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
