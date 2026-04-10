/**
 * 提醒服务
 *
 * 管理任务提醒的创建、查询、发送
 */

import { getDb } from '@/lib/db';
import { addMinutesToDate, formatDate, formatDateTime } from '@/lib/date-utils';

// ==================== 类型定义 ====================

export type ReminderType = 'before_due' | 'custom';

export interface CreateReminderInput {
  todoId: string;
  remindAt: Date;
  type: ReminderType;
  offset?: number; // 提前分钟数（仅 type='before_due' 时有效）
}

export interface ReminderWithTodo {
  id: string;
  todoId: string;
  remindAt: Date;
  type: string;
  offset: number | null;
  sent: boolean;
  createdAt: Date;
  todo: {
    id: string;
    title: string;
    dueDate: Date;
    userId: string;
  };
}

// ==================== 提醒管理 ====================

/**
 * 创建提醒
 */
export async function createReminder(input: CreateReminderInput) {
  const db = await getDb();
  const reminder = await db.reminder.create({
    data: {
      todoId: input.todoId,
      remindAt: input.remindAt,
      type: input.type,
      offset: input.offset,
    },
    include: {
      todo: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          userId: true,
        },
      },
    },
  });

  return reminder;
}

/**
 * 批量创建提醒
 */
export async function createReminders(inputs: CreateReminderInput[]) {
  const db = await getDb();
  const reminders = await db.reminder.createMany({
    data: inputs.map(input => ({
      todoId: input.todoId,
      remindAt: input.remindAt,
      type: input.type,
      offset: input.offset,
    })),
  });

  return reminders;
}

/**
 * 获取任务的提醒列表
 */
export async function getTodoReminders(todoId: string) {
  const db = await getDb();
  const reminders = await db.reminder.findMany({
    where: { todoId },
    orderBy: { remindAt: 'asc' },
  });

  return reminders;
}

/**
 * 获取用户待发送的提醒
 */
export async function getPendingReminders(userId: string): Promise<ReminderWithTodo[]> {
  const now = new Date();
  const db = await getDb();

  const reminders = await db.reminder.findMany({
    where: {
      sent: false,
      remindAt: { lte: now },
      todo: {
        userId,
        status: { not: 'completed' }, // 已完成的任务不发送提醒
      },
    },
    include: {
      todo: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          userId: true,
        },
      },
    },
    orderBy: { remindAt: 'asc' },
    take: 50, // 限制每次处理的数量
  });

  return reminders;
}

/**
 * 标记提醒为已发送
 */
export async function markReminderSent(reminderId: string) {
  const db = await getDb();
  await db.reminder.update({
    where: { id: reminderId },
    data: { sent: true },
  });
}

/**
 * 删除提醒
 */
export async function deleteReminder(reminderId: string) {
  const db = await getDb();
  await db.reminder.delete({
    where: { id: reminderId },
  });
}

/**
 * 删除任务的所有提醒
 */
export async function deleteTodoReminders(todoId: string) {
  const db = await getDb();
  await db.reminder.deleteMany({
    where: { todoId },
  });
}

// ==================== 预设提醒 ====================

/**
 * 预设提醒配置
 */
export const REMINDER_PRESETS = [
  { label: '任务开始时', offset: null, type: 'custom' as const },
  { label: '截止时', offset: 0, type: 'before_due' as const },
  { label: '提前5分钟', offset: 5, type: 'before_due' as const },
  { label: '提前15分钟', offset: 15, type: 'before_due' as const },
  { label: '提前30分钟', offset: 30, type: 'before_due' as const },
  { label: '提前1小时', offset: 60, type: 'before_due' as const },
  { label: '提前2小时', offset: 120, type: 'before_due' as const },
  { label: '提前1天', offset: 1440, type: 'before_due' as const },
];

/**
 * 根据预设创建提醒
 */
export async function createReminderFromPreset(
  todoId: string,
  preset: typeof REMINDER_PRESETS[number],
  startDate: Date,
  dueDate: Date
) {
  let remindAt: Date;

  if (preset.type === 'custom' && preset.offset === null) {
    // 任务开始时提醒
    remindAt = startDate;
  } else if (preset.type === 'before_due' && preset.offset !== null) {
    // 截止前提醒
    remindAt = addMinutesToDate(dueDate, -preset.offset);
  } else {
    throw new Error('Invalid preset configuration');
  }

  // 如果提醒时间已过，不创建
  if (remindAt < new Date()) {
    return null;
  }

  return createReminder({
    todoId,
    remindAt,
    type: preset.type,
    offset: preset.offset ?? undefined,
  });
}

// ==================== 提醒调度 ====================

/**
 * 处理待发送的提醒
 * 由前端轮询或后台 cron 调用
 */
export async function processPendingReminders(userId: string) {
  const reminders = await getPendingReminders(userId);
  const results: { reminderId: string; success: boolean; error?: string }[] = [];

  for (const reminder of reminders) {
    try {
      // 这里只返回提醒数据，实际通知由前端发送
      // 因为浏览器通知需要用户授权，必须在客户端执行
      results.push({
        reminderId: reminder.id,
        success: true,
      });
    } catch (error) {
      results.push({
        reminderId: reminder.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    reminders: reminders.map(r => ({
      id: r.id,
      todoId: r.todoId,
      todoTitle: r.todo.title,
      remindAt: r.remindAt,
      type: r.type,
      offset: r.offset,
    })),
    results,
  };
}

// ==================== 辅助函数 ====================

/**
 * 格式化提醒时间为显示文本
 */
export function formatReminderTime(remindAt: Date, dueDate: Date): string {
  const now = new Date();
  const diffMs = remindAt.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) {
    return '已过期';
  }

  if (diffMins < 60) {
    return `${diffMins}分钟后`;
  }

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}小时后`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}天后`;
  }

  return formatDateTime(remindAt);
}
