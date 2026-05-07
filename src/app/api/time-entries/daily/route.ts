export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

const TIME_ENTRY_JOIN_FIELDS = `
  t.id, t.title, t.description,
  t.date, t.startTime, t.endTime, t.duration,
  t.userId, t.categoryId, t.todoId,
  t.createdAt, t.updatedAt,
  c.id AS cat_id, c.name AS cat_name, c.emoji AS cat_emoji,
  c.color AS cat_color, c.description AS cat_desc,
  todo.id AS todo_id, todo.title AS todo_title
`;

const TIME_ENTRY_JOIN_TABLES = `
  FROM time_entries t
  LEFT JOIN categories c ON c.id = t.categoryId
  LEFT JOIN todos todo ON todo.id = t.todoId
`;

function reshapeTimeEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    duration: row.duration,
    userId: row.userId,
    categoryId: row.categoryId,
    todoId: row.todoId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: row.cat_id ? {
      id: row.cat_id,
      name: row.cat_name,
      emoji: row.cat_emoji,
      color: row.cat_color,
      description: row.cat_desc,
    } : null,
    todo: row.todo_id ? {
      id: row.todo_id,
      title: row.todo_title,
    } : null,
  };
}

// GET /api/time-entries/daily - 获取日统计
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
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: '请提供日期参数' },
        { status: 400 }
      );
    }

    // 使用中午时间避免时区边界问题
    const targetDate = new Date(`${dateParam}T12:00:00`);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 获取当日所有时间记录
      const rows = await d1.all<Record<string, unknown>>(
        `SELECT ${TIME_ENTRY_JOIN_FIELDS} ${TIME_ENTRY_JOIN_TABLES}
         WHERE t.userId=? AND t.date=? ORDER BY t.startTime ASC`,
        userId, targetDate.toISOString()
      );

      const entries = rows.map(reshapeTimeEntry);

      // 计算统计数据
      const totalDuration = entries.reduce((sum, e) => sum + (e.duration as number), 0);
      const taskTime = entries.filter(e => e.todoId).reduce((sum, e) => sum + (e.duration as number), 0);
      const otherTime = totalDuration - taskTime;

      // 按分类统计
      const categoryStats: Record<string, { categoryId: string; categoryName: string; categoryEmoji: string; categoryColor: string; duration: number }> = {};
      for (const entry of entries) {
        const catId = entry.categoryId as string | null;
        const cat = entry.category;
        const key = catId || 'none';
        if (!categoryStats[key]) {
          categoryStats[key] = {
            categoryId: catId || '',
            categoryName: cat?.name || '未分类',
            categoryEmoji: cat?.emoji || '',
            categoryColor: cat?.color || '',
            duration: 0,
          };
        }
        categoryStats[key].duration += entry.duration as number;
      }

      return NextResponse.json({
        success: true,
        data: {
          date: dateParam,
          entries,
          stats: {
            totalDuration,
            taskTime,
            otherTime,
            categoryDistribution: Object.values(categoryStats).sort((a, b) => b.duration - a.duration),
          },
        },
      });
    }

    const db = await getDb();

    const entries = await db.timeEntry.findMany({
      where: {
        userId,
        date: targetDate,
      },
      orderBy: { startTime: 'asc' },
      include: { category: true, todo: { select: { id: true, title: true } } },
    });

    // 计算统计数据
    const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);
    const taskTime = entries.filter(e => e.todoId).reduce((sum, e) => sum + e.duration, 0);
    const otherTime = totalDuration - taskTime;

    // 按分类统计
    const categoryStats: Record<string, { categoryId: string; categoryName: string; categoryEmoji: string | null; categoryColor: string | null; duration: number }> = {};
    for (const entry of entries) {
      const key = entry.categoryId || 'none';
      if (!categoryStats[key]) {
        categoryStats[key] = {
          categoryId: entry.categoryId || '',
          categoryName: entry.category?.name || '未分类',
          categoryEmoji: entry.category?.emoji,
          categoryColor: entry.category?.color,
          duration: 0,
        };
      }
      categoryStats[key].duration += entry.duration;
    }

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        entries,
        stats: {
          totalDuration,
          taskTime,
          otherTime,
          categoryDistribution: Object.values(categoryStats).sort((a, b) => b.duration - a.duration),
        },
      },
    });
  } catch (error) {
    console.error('Get daily time entries error:', error);
    return NextResponse.json({ success: false, error: '获取日统计失败' }, { status: 500 });
  }
}