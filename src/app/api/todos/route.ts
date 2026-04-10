export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createTodoSchema } from '@/types/api';
import { getApiSession } from '@/lib/api-auth';

// GET /api/todos - 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const levelId = searchParams.get('levelId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isMilestone = searchParams.get('isMilestone');

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (levelId) {
      where.levelId = levelId;
    }

    if (isMilestone === 'true') {
      where.isMilestone = true;
    }

    // 日期范围筛选（DateTime 类型）
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      where.OR = [
        {
          // 任务开始日期在范围内
          startDate: {
            gte: start,
            lte: end,
          },
        },
        {
          // 任务截止日期在范围内
          dueDate: {
            gte: start,
            lte: end,
          },
        },
        {
          // 任务跨越整个范围
          AND: [
            { startDate: { lte: start } },
            { dueDate: { gte: end } },
          ],
        },
      ];
    }

    const todos = await db.todo.findMany({
      where,
      orderBy: [
        { level: { value: 'desc' } },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
        level: true,
        recurrenceRule: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: todos,
    });
  } catch (error) {
    console.error('Get todos error:', error);
    return NextResponse.json(
      { success: false, error: '获取任务失败' },
      { status: 500 }
    );
  }
}

// POST /api/todos - 创建任务
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const validated = createTodoSchema.parse(body);

    // 验证日期时间
    const startDateObj = new Date(validated.startDate);
    const dueDateObj = new Date(validated.dueDate);
    if (startDateObj > dueDateObj) {
      return NextResponse.json(
        { success: false, error: '开始日期不能晚于截止日期' },
        { status: 400 }
      );
    }

    // 处理周期任务
    let recurrenceRuleId: string | null = null;
    if (validated.isCycleTask && validated.recurrenceRule) {
      const rule = await db.recurrenceRule.create({
        data: {
          frequency: validated.recurrenceRule.frequency,
          interval: validated.recurrenceRule.interval,
          byDay: validated.recurrenceRule.byDay ? JSON.stringify(validated.recurrenceRule.byDay) : null,
          cronExpr: validated.recurrenceRule.cronExpr,
          startDate: new Date(validated.recurrenceRule.startDate),
          endDate: validated.recurrenceRule.endDate ? new Date(validated.recurrenceRule.endDate) : null,
          userId,
        },
      });
      recurrenceRuleId = rule.id;
    }

    // 创建任务
    const todo = await db.todo.create({
      data: {
        title: validated.title,
        description: validated.description,
        startDate: new Date(validated.startDate),
        dueDate: new Date(validated.dueDate),
        completedAt: validated.completedAt ? new Date(validated.completedAt) : null,
        categoryId: validated.categoryId,
        levelId: validated.levelId,
        subTasks: validated.subTasks ? JSON.stringify(validated.subTasks) : null,
        isCycleTask: validated.isCycleTask ?? false,
        recurrenceRuleId,
        isMilestone: validated.isMilestone ?? false,
        priority: validated.priority ?? 0,
        userId,
      },
      include: {
        category: true,
        level: true,
        recurrenceRule: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json(
      { success: false, error: '创建任务失败' },
      { status: 500 }
    );
  }
}
