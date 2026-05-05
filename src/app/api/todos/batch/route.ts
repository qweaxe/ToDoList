export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import { getApiSession } from '@/lib/api-auth';
import { getD1Client, IS_EDGE } from '@/lib/d1';

const batchDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, '至少选择一个任务'),
});

const batchUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, '至少选择一个任务'),
  data: z.object({
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    categoryId: z.string().nullable().optional(),
    levelId: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
  }),
});

// POST /api/todos/batch - 批量操作
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
    const { action, ...rest } = body;

    if (action === 'delete') {
      const validated = batchDeleteSchema.parse(rest);

      if (IS_EDGE) {
        const d1 = await getD1Client();
        const inPlaceholders = validated.ids.map(() => '?').join(',');

        const existingRows = await d1.all<{ id: string }>(
          `SELECT id FROM todos WHERE id IN (${inPlaceholders}) AND userId=?`,
          ...validated.ids, userId
        );

        if (existingRows.length !== validated.ids.length) {
          return NextResponse.json(
            { success: false, error: '部分任务不存在' },
            { status: 400 }
          );
        }

        await d1.run(
          `DELETE FROM todos WHERE id IN (${inPlaceholders}) AND userId=?`,
          ...validated.ids, userId
        );

        return NextResponse.json({
          success: true,
          message: `已删除 ${validated.ids.length} 个任务`,
        });
      }

      // 开发环境：Prisma 路径
      const db = await getDb();

      const existing = await db.todo.findMany({
        where: { id: { in: validated.ids }, userId },
        select: { id: true },
      });

      if (existing.length !== validated.ids.length) {
        return NextResponse.json(
          { success: false, error: '部分任务不存在' },
          { status: 400 }
        );
      }

      await db.todo.deleteMany({
        where: { id: { in: validated.ids }, userId },
      });

      return NextResponse.json({
        success: true,
        message: `已删除 ${validated.ids.length} 个任务`,
      });
    }

    if (action === 'update') {
      const validated = batchUpdateSchema.parse(rest);

      if (IS_EDGE) {
        const d1 = await getD1Client();

        const sets: string[] = [];
        const args: unknown[] = [];
        const now = new Date().toISOString();

        const data = validated.data;
        if (data.status !== undefined) { sets.push('status=?'); args.push(data.status); }
        if (data.categoryId !== undefined) { sets.push('categoryId=?'); args.push(data.categoryId ?? null); }
        if (data.levelId !== undefined) { sets.push('levelId=?'); args.push(data.levelId ?? null); }
        if (data.completedAt !== undefined) { sets.push('completedAt=?'); args.push(data.completedAt ?? null); }
        if (data.startDate !== undefined) { sets.push('startDate=?'); args.push(data.startDate); }
        if (data.dueDate !== undefined) { sets.push('dueDate=?'); args.push(data.dueDate); }
        sets.push('updatedAt=?');
        args.push(now);

        const inPlaceholders = validated.ids.map(() => '?').join(',');
        args.push(...validated.ids, userId);

        await d1.run(
          `UPDATE todos SET ${sets.join(', ')} WHERE id IN (${inPlaceholders}) AND userId=?`,
          ...args
        );

        return NextResponse.json({
          success: true,
          message: `已更新 ${validated.ids.length} 个任务`,
        });
      }

      // 开发环境：Prisma 路径
      const db = await getDb();

      await db.todo.updateMany({
        where: { id: { in: validated.ids }, userId },
        data: validated.data,
      });

      return NextResponse.json({
        success: true,
        message: `已更新 ${validated.ids.length} 个任务`,
      });
    }

    return NextResponse.json(
      { success: false, error: '未知操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Batch operation error:', error);
    return NextResponse.json(
      { success: false, error: '批量操作失败' },
      { status: 500 }
    );
  }
}