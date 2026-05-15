export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';
import { getApiSession } from '@/lib/api-auth';
import { z } from 'zod';
import { format } from 'date-fns';

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

const updateSubTaskSchema = z.object({
  subTaskId: z.string(),
  isDone: z.boolean(),
});

// PUT /api/todos/[id]/subtask - 更新子任务状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getApiSession(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { id: taskId } = await params;
    const body = await request.json();
    const validated = updateSubTaskSchema.parse(body);

    if (IS_EDGE) {
      const d1 = await getD1Client();

      // 检查任务是否存在且属于当前用户
      const existing = await d1.first<{ id: string; subTasks: string | null }>(
        'SELECT id, subTasks FROM todos WHERE id = ? AND userId = ?',
        taskId, userId
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '任务不存在' },
          { status: 404 }
        );
      }

      // 解析并更新子任务
      const subTasks = existing.subTasks ? JSON.parse(existing.subTasks) : [];
      const updatedSubTasks = subTasks.map((st: { id: string; isDone: boolean }) =>
        st.id === validated.subTaskId ? { ...st, isDone: validated.isDone } : st
      );

      // 检查是否所有子任务都已完成
      const allSubTasksDone = updatedSubTasks.length > 0 && updatedSubTasks.every((st: { isDone: boolean }) => st.isDone);

      // 准备更新数据
      const updateData: {
        subTasks: string;
        status?: string;
        completedAt?: string;
        updatedAt: string;
      } = {
        subTasks: JSON.stringify(updatedSubTasks),
        updatedAt: new Date().toISOString(),
      };

      // 如果所有子任务都已完成，自动完成主任务
      if (allSubTasksDone) {
        updateData.status = 'completed';
        // 使用本地时间，不进行时区转换
        const now = new Date();
        const localDate = format(now, 'yyyy-MM-dd');
        const localTime = format(now, 'HH:mm:ss');
        updateData.completedAt = `${localDate}T${localTime}.000Z`;
      }

      // 动态构建 SET 子句
      const sets: string[] = [];
      const args: unknown[] = [];

      sets.push('subTasks=?'); args.push(updateData.subTasks);
      sets.push('updatedAt=?'); args.push(updateData.updatedAt);
      if (updateData.status !== undefined) { sets.push('status=?'); args.push(updateData.status); }
      if (updateData.completedAt !== undefined) { sets.push('completedAt=?'); args.push(updateData.completedAt); }
      args.push(taskId);

      await d1.run(`UPDATE todos SET ${sets.join(', ')} WHERE id = ?`, ...args);

      const row = await d1.first<Record<string, unknown>>(
        `SELECT ${TODO_JOIN_FIELDS} ${TODO_JOIN_TABLES} WHERE t.id=?`,
        taskId
      );

      return NextResponse.json({
        success: true,
        data: reshapeTodo(row!),
      });
    }

    const db = await getDb();

    // 检查任务是否存在且属于当前用户
    const existing = await db.todo.findFirst({
      where: { id: taskId, userId },
      select: { id: true, subTasks: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    // 解析并更新子任务
    const subTasks = existing.subTasks ? JSON.parse(existing.subTasks) : [];
    const updatedSubTasks = subTasks.map((st: { id: string; isDone: boolean }) =>
      st.id === validated.subTaskId ? { ...st, isDone: validated.isDone } : st
    );

    // 检查是否所有子任务都已完成
    const allSubTasksDone = updatedSubTasks.length > 0 && updatedSubTasks.every((st: { isDone: boolean }) => st.isDone);

    // 准备更新数据
    const updateData: {
      subTasks: string;
      status?: string;
      completedAt?: string;
    } = {
      subTasks: JSON.stringify(updatedSubTasks),
    };

    // 如果所有子任务都已完成，自动完成主任务
    if (allSubTasksDone) {
      updateData.status = 'completed';
      // 使用本地时间，不进行时区转换
      const now = new Date();
      const localDate = format(now, 'yyyy-MM-dd');
      const localTime = format(now, 'HH:mm:ss');
      updateData.completedAt = `${localDate}T${localTime}.000Z`;
    }

    // 更新任务
    const todo = await db.todo.update({
      where: { id: taskId },
      data: updateData,
      include: {
        category: true,
        level: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error('Update subtask error:', error);
    return NextResponse.json(
      { success: false, error: '更新子任务失败' },
      { status: 500 }
    );
  }
}
