import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const batchDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, '至少选择一个任务'),
});

const batchUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, '至少选择一个任务'),
  data: z.object({
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    categoryId: z.string().nullable().optional(),
    levelId: z.string().nullable().optional(),
  }),
});

// POST /api/todos/batch - 批量操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...rest } = body;

    if (action === 'delete') {
      const validated = batchDeleteSchema.parse(rest);

      // 检查任务是否存在
      const existing = await db.todo.findMany({
        where: { id: { in: validated.ids } },
        select: { id: true },
      });

      if (existing.length !== validated.ids.length) {
        return NextResponse.json(
          { success: false, error: '部分任务不存在' },
          { status: 400 }
        );
      }

      await db.todo.deleteMany({
        where: { id: { in: validated.ids } },
      });

      return NextResponse.json({
        success: true,
        message: `已删除 ${validated.ids.length} 个任务`,
      });
    }

    if (action === 'update') {
      const validated = batchUpdateSchema.parse(rest);

      await db.todo.updateMany({
        where: { id: { in: validated.ids } },
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
