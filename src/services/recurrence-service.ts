/**
 * 周期任务同步服务
 * 
 * 根据 RecurrenceRule 自动生成周期任务实例
 */

import { db } from '@/lib/db';
import { calculateOccurrenceDates } from '@/lib/cron-utils';
import { formatDate } from '@/lib/date-utils';
import { parseDateString } from '@/lib/date-utils';
import type { Frequency } from '@/types';

// 周期规则接口
interface RecurrenceRuleWithTodo {
  id: string;
  frequency: string;
  interval: number;
  byDay: string | null;
  cronExpr: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  todos: Array<{
    id: string;
    title: string;
    description: string | null;
    categoryId: string | null;
    levelId: string | null;
    priority: number;
    isMilestone: boolean;
    status: string;
  }>;
}

/**
 * 同步周期任务
 * 检查所有激活的周期规则，为缺失的日期生成任务实例
 *
 * @param windowStart 时间窗口开始日期
 * @param windowEnd 时间窗口结束日期
 * @param userId 用户ID，仅同步该用户的规则
 */
export async function syncRecurringTasks(
  windowStart: Date,
  windowEnd: Date,
  userId: string
): Promise<{ created: number; skipped: number }> {
  const result = { created: 0, skipped: 0 };

  try {
    // 获取该用户所有激活的周期规则及其模板任务
    const activeRules = await db.recurrenceRule.findMany({
      where: {
        isActive: true,
        userId,
      },
      include: {
        todos: {
          where: {
            status: { not: 'completed' }, // 只处理未完成的模板任务
          },
        },
      },
    });

    for (const rule of activeRules) {
      // 跳过没有模板任务的规则
      if (rule.todos.length === 0) continue;

      // 计算规则的有效结束日期
      const ruleEndDate = rule.endDate ? parseDateString(rule.endDate) : null;
      const effectiveEnd = ruleEndDate && ruleEndDate < windowEnd ? ruleEndDate : windowEnd;

      // 计算此规则在时间窗口内的执行日期
      const byDayArray = rule.byDay ? JSON.parse(rule.byDay) : null;
      
      const occurrenceDates = calculateOccurrenceDates(
        {
          frequency: rule.frequency as Frequency,
          interval: rule.interval,
          byDay: byDayArray,
          cronExpr: rule.cronExpr,
          startDate: rule.startDate,
          endDate: rule.endDate,
        },
        windowStart,
        effectiveEnd
      );

      // 为每个模板任务和每个执行日期创建任务实例
      for (const templateTodo of rule.todos) {
        for (const occurrenceDate of occurrenceDates) {
          const dateStr = formatDate(occurrenceDate);

          // 检查是否已存在该日期的任务实例
          const existingTodo = await db.todo.findFirst({
            where: {
              parentRuleId: rule.id,
              dueDate: dateStr,
              title: templateTodo.title,
            },
          });

          if (existingTodo) {
            result.skipped++;
            continue;
          }

          // 创建新的任务实例
          try {
            await db.todo.create({
              data: {
                title: templateTodo.title,
                description: templateTodo.description,
                status: 'pending',
                startDate: dateStr,
                dueDate: dateStr,
                categoryId: templateTodo.categoryId,
                levelId: templateTodo.levelId,
                priority: templateTodo.priority,
                isMilestone: templateTodo.isMilestone,
                isCycleTask: true,
                recurrenceRuleId: rule.id,
                parentRuleId: rule.id,
                userId,
              },
            });
            result.created++;
          } catch (error) {
            console.error(`Failed to create recurring task instance:`, error);
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Sync recurring tasks error:', error);
    return result;
  }
}

/**
 * 同步未来7天的周期任务
 */
export async function syncUpcomingWeek(userId: string): Promise<{ created: number; skipped: number }> {
  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);

  return syncRecurringTasks(now, weekLater, userId);
}

/**
 * 同步未来一个月的周期任务
 */
export async function syncUpcomingMonth(userId: string): Promise<{ created: number; skipped: number }> {
  const now = new Date();
  const monthLater = new Date(now);
  monthLater.setMonth(monthLater.getMonth() + 1);

  return syncRecurringTasks(now, monthLater, userId);
}

/**
 * 同步指定日期的周期任务
 */
export async function syncDate(date: Date, userId: string): Promise<{ created: number; skipped: number }> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return syncRecurringTasks(startOfDay, endOfDay, userId);
}
