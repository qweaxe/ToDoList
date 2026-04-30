export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createTimeEntrySchema } from '@/types/api';
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

// 计算时长（分钟）
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// GET /api/time-entries - 获取时间记录列表
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
    const date = searchParams.get('date');
    const categoryId = searchParams.get('categoryId');
    const todoId = searchParams.get('todoId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const conditions: string[] = ['t.userId=?'];
      const args: unknown[] = [userId];

      if (date) {
        conditions.push('t.date=?');
        // 使用中午时间避免时区边界问题
        args.push(new Date(`${date}T12:00:00`).toISOString());
      }
      if (categoryId) {
        conditions.push('t.categoryId=?');
        args.push(categoryId);
      }
      if (todoId) {
        conditions.push('t.todoId=?');
        args.push(todoId);
      }
      if (startDate && endDate) {
        conditions.push('t.date>=? AND t.date<=?');
        // 使用中午时间避免时区边界问题
        args.push(new Date(`${startDate}T12:00:00`).toISOString(), new Date(`${endDate}T12:00:00`).toISOString());
      }

      const rows = await d1.all<Record<string, unknown>>(
        `SELECT ${TIME_ENTRY_JOIN_FIELDS} ${TIME_ENTRY_JOIN_TABLES}
         WHERE ${conditions.join(' AND ')}
         ORDER BY t.startTime DESC`,
        ...args
      );

      return NextResponse.json({ success: true, data: rows.map(reshapeTimeEntry) });
    }

    const db = await getDb();
    const where: Record<string, unknown> = { userId };

    // 使用中午时间避免时区边界问题
    if (date) where.date = new Date(`${date}T12:00:00`);
    if (categoryId) where.categoryId = categoryId;
    if (todoId) where.todoId = todoId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(`${startDate}T12:00:00`),
        lte: new Date(`${endDate}T12:00:00`),
      };
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: { category: true, todo: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ success: true, data: timeEntries });
  } catch (error) {
    console.error('Get time entries error:', error);
    return NextResponse.json({ success: false, error: '获取时间记录失败' }, { status: 500 });
  }
}

// POST /api/time-entries - 创建时间记录
export async function POST(request: NextRequest) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const validated = createTimeEntrySchema.parse(body);

    const startTimeObj = new Date(validated.startTime);
    const endTimeObj = new Date(validated.endTime);

    if (startTimeObj >= endTimeObj) {
      return NextResponse.json(
        { success: false, error: '开始时间必须早于结束时间' },
        { status: 400 }
      );
    }

    const duration = calculateDuration(validated.startTime, validated.endTime);

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const now = new Date().toISOString();
      const entryId = crypto.randomUUID();

      // 使用中午时间存储 date 字段，避免时区边界问题
      const dateObj = new Date(`${validated.date}T12:00:00`);

      await d1.run(
        `INSERT INTO time_entries (id, title, description, date, startTime, endTime, duration, categoryId, todoId, userId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        entryId,
        validated.title,
        validated.description ?? null,
        dateObj.toISOString(),
        startTimeObj.toISOString(),
        endTimeObj.toISOString(),
        duration,
        validated.categoryId ?? null,
        validated.todoId ?? null,
        userId,
        now,
        now
      );

      const row = await d1.first<Record<string, unknown>>(
        `SELECT ${TIME_ENTRY_JOIN_FIELDS} ${TIME_ENTRY_JOIN_TABLES} WHERE t.id=?`,
        entryId
      );

      return NextResponse.json({ success: true, data: reshapeTimeEntry(row!) });
    }

    const db = await getDb();

    const timeEntry = await db.timeEntry.create({
      data: {
        title: validated.title,
        description: validated.description,
        date: new Date(validated.date),
        startTime: startTimeObj,
        endTime: endTimeObj,
        duration,
        categoryId: validated.categoryId,
        todoId: validated.todoId,
        userId,
      },
      include: { category: true, todo: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ success: true, data: timeEntry });
  } catch (error) {
    console.error('Create time entry error:', error);
    return NextResponse.json({ success: false, error: '创建时间记录失败' }, { status: 500 });
  }
}