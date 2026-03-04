import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
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
    const yearStart = `${yearNum}-01-01`;
    const yearEnd = `${yearNum}-12-31`;

    let todos;

    if (type === 'category') {
      todos = await db.todo.findMany({
        where: {
          categoryId: id,
          OR: [
            { startDate: { gte: yearStart, lte: yearEnd } },
            { dueDate: { gte: yearStart, lte: yearEnd } },
            { startDate: { lte: yearStart }, dueDate: { gte: yearEnd } },
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
          levelId: id,
          OR: [
            { startDate: { gte: yearStart, lte: yearEnd } },
            { dueDate: { gte: yearStart, lte: yearEnd } },
            { startDate: { lte: yearStart }, dueDate: { gte: yearEnd } },
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
