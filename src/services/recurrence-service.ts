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
 */
export async function syncRecurringTasks(
  windowStart: Date,
  windowEnd: Date
): Promise<{ created: number; skipped: number }> {
  const result = { created: 0, skipped: 0 };

  try {
    // 获取所有激活的周期规则及其模板任务
    const activeRules = await db.recurrenceRule.findMany({
      where: {
        isActive: true,
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

          // 使用 upsert 避免竞争条件，依赖数据库唯一约束
          try {
            await db.todo.upsert({
              where: {
                parentRuleId_dueDate_title: {
                  parentRuleId: rule.id,
                  dueDate: dateStr,
                  title: templateTodo.title,
                },
              },
              update: {}, // 已存在则不更新
              create: {
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
              },
            });
            result.created++;
          } catch (error) {
            // 唯一约束冲突说明任务已存在，跳过
            if (error instanceof Error && error.message.includes('Unique constraint')) {
              result.skipped++;
              continue;
            }
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
export async function syncUpcomingWeek(): Promise<{ created: number; skipped: number }> {
  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);

  return syncRecurringTasks(now, weekLater);
}

/**
 * 同步未来一个月的周期任务
 */
export async function syncUpcomingMonth(): Promise<{ created: number; skipped: number }> {
  const now = new Date();
  const monthLater = new Date(now);
  monthLater.setMonth(monthLater.getMonth() + 1);

  return syncRecurringTasks(now, monthLater);
}

/**
 * 同步指定日期的周期任务
 */
export async function syncDate(date: Date): Promise<{ created: number; skipped: number }> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return syncRecurringTasks(startOfDay, endOfDay);
}
