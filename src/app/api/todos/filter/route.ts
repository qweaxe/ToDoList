export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
    // 计算查询边界：本地时间的年度开始 00:00 和年度结束 23:59:59，转换为 UTC
    const yearStartBoundary = new Date(`${yearNum}-01-01T00:00:00`);
    const yearEndBoundary = new Date(`${yearNum}-12-31T23:59:59`);

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
