export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';
import { localDayStart, localDayEnd } from '@/lib/date-utils';
import { getRequestTimeZone } from '@/lib/api-utils';

const TODO_JOIN_FIELDS = `
  t.id, t.title, t.description, t.status,
  t.startDate, t.dueDate, t.completedAt, t.subTasks,
  t.isCycleTask, t.recurrenceRuleId, t.parentRuleId,
  t.userId, t.categoryId, t.levelId,
  t.priority, t.isMilestone, t.estimatedDuration, t.createdAt, t.updatedAt,
  c.id AS cat_id, c.name AS cat_name, c.emoji AS cat_emoji,
  c.color AS cat_color, c.description AS cat_desc,
  c.userId AS cat_userId, c.createdAt AS cat_createdAt, c.updatedAt AS cat_updatedAt,
  l.id AS lvl_id, l.name AS lvl_name, l.value AS lvl_value, l.description AS lvl_desc
`;

const TODO_JOIN_TABLES = `
  FROM todos t
  LEFT JOIN categories c ON c.id = t.categoryId
  LEFT JOIN levels l ON l.id = t.levelId
`;

function reshapeTodo(row: Record<string, unknown>) {
  return {
    id: row.id, title: row.title, description: row.description,
    status: row.status, startDate: row.startDate, dueDate: row.dueDate,
    completedAt: row.completedAt, subTasks: row.subTasks,
    isCycleTask: Boolean(row.isCycleTask), recurrenceRuleId: row.recurrenceRuleId,
    parentRuleId: row.parentRuleId, userId: row.userId,
    categoryId: row.categoryId, levelId: row.levelId,
    priority: row.priority, isMilestone: Boolean(row.isMilestone),
    estimatedDuration: row.estimatedDuration,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    category: row.cat_id ? {
      id: row.cat_id, name: row.cat_name, emoji: row.cat_emoji,
      color: row.cat_color, description: row.cat_desc,
      userId: row.cat_userId, createdAt: row.cat_createdAt, updatedAt: row.cat_updatedAt,
    } : null,
    level: row.lvl_id ? {
      id: row.lvl_id, name: row.lvl_name,
      value: row.lvl_value, description: row.lvl_desc,
    } : null,
  };
}

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
    const timeZone = getRequestTimeZone(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'category' or 'level'
    const id = searchParams.get('id');
    const year = searchParams.get('year');

    if (!type || !id || !year) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, id, year' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }
    const yearStartISO = localDayStart(`${yearNum}-01-01`, timeZone).toISOString();
    const yearEndISO = localDayEnd(`${yearNum}-12-31`, timeZone).toISOString();

    const filterColumn = type === 'category' ? 'categoryId' : type === 'level' ? 'levelId' : null;
    if (!filterColumn) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "category" or "level"' },
        { status: 400 }
      );
    }

    if (IS_EDGE) {
      const d1 = await getD1Client();

      const rawTodos = await d1.all<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES}
         WHERE t.userId = ? AND t.${filterColumn} = ?
           AND (
             (t.startDate >= ? AND t.startDate <= ?)
             OR (t.dueDate >= ? AND t.dueDate <= ?)
             OR (t.startDate <= ? AND t.dueDate >= ?)
           )
         ORDER BY t.dueDate ASC`,
        userId, id,
        yearStartISO, yearEndISO,
        yearStartISO, yearEndISO,
        yearStartISO, yearEndISO
      );

      const todos = rawTodos.map(reshapeTodo);
      const stats = {
        total: todos.length,
        completed: todos.filter(t => t.status === 'completed').length,
        pending: todos.filter(t => t.status === 'pending').length,
        inProgress: todos.filter(t => t.status === 'in_progress').length,
      };

      return NextResponse.json({
        success: true,
        data: {
          todos,
          stats,
        },
      });
    }

    // 开发环境：Prisma 路径
    const db = await getDb();
    const yearStartBoundary = localDayStart(`${yearNum}-01-01`, timeZone);
    const yearEndBoundary = localDayEnd(`${yearNum}-12-31`, timeZone);

    let todos;

    if (type === 'category') {
      todos = await db.todo.findMany({
        where: {
          userId,
          categoryId: id,
          OR: [
            { startDate: { gte: yearStartBoundary, lte: yearEndBoundary } },
            { dueDate: { gte: yearStartBoundary, lte: yearEndBoundary } },
            { startDate: { lte: yearStartBoundary }, dueDate: { gte: yearEndBoundary } },
          ],
        },
        include: {
          category: true,
          level: true,
        },
        orderBy: [
          { dueDate: 'asc' },
        ],
      });
    } else if (type === 'level') {
      todos = await db.todo.findMany({
        where: {
          userId,
          levelId: id,
          OR: [
            { startDate: { gte: yearStartBoundary, lte: yearEndBoundary } },
            { dueDate: { gte: yearStartBoundary, lte: yearEndBoundary } },
            { startDate: { lte: yearStartBoundary }, dueDate: { gte: yearEndBoundary } },
          ],
        },
        include: {
          category: true,
          level: true,
        },
        orderBy: [
          { dueDate: 'asc' },
        ],
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "category" or "level"' },
        { status: 400 }
      );
    }

    // 统计数据
    const stats = {
      total: todos.length,
      completed: todos.filter(t => t.status === 'completed').length,
      pending: todos.filter(t => t.status === 'pending').length,
      inProgress: todos.filter(t => t.status === 'in_progress').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        todos,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching filtered todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}