/**
 * 周期任务同步服务
 *
 * 根据 RecurrenceRule 自动生成周期任务实例
 */

import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';
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
  startDate: Date;
  endDate: Date | null;
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
 * 同步周期任务 - D1 原生 SQL 实现（生产环境）
 */
async function syncRecurringTasksD1(
  windowStart: Date,
  windowEnd: Date,
  userId: string
): Promise<{ created: number; skipped: number }> {
  const result = { created: 0, skipped: 0 };

  try {
    const d1 = await getD1Client();

    // 单次 JOIN 查询：获取所有活跃规则及其模板任务（避免 N+1）
    const rows = await d1.all<{
      rule_id: string; rule_freq: string; rule_interval: number;
      rule_byDay: string | null; rule_cron: string | null;
      rule_start: string; rule_end: string | null;
      todo_id: string | null; todo_title: string | null;
      todo_desc: string | null; todo_categoryId: string | null;
      todo_levelId: string | null; todo_priority: number | null;
      todo_isMilestone: number | null;
    }>(
      `SELECT rr.id as rule_id, rr.frequency as rule_freq, rr.interval as rule_interval,
              rr.byDay as rule_byDay, rr.cronExpr as rule_cron,
              rr.startDate as rule_start, rr.endDate as rule_end,
              t.id as todo_id, t.title as todo_title, t.description as todo_desc,
              t.categoryId as todo_categoryId, t.levelId as todo_levelId,
              t.priority as todo_priority, t.isMilestone as todo_isMilestone
       FROM recurrence_rules rr
       LEFT JOIN todos t ON t.recurrenceRuleId = rr.id AND t.status != 'completed'
       WHERE rr.isActive = 1 AND rr.userId = ?`,
      userId
    );

    // 将扁平结果重组为 rule → todos 结构
    const rulesMap = new Map<string, {
      id: string; frequency: string; interval: number;
      byDay: string | null; cronExpr: string | null;
      startDate: string; endDate: string | null;
      todos: Array<{ id: string; title: string; description: string | null; categoryId: string | null; levelId: string | null; priority: number; isMilestone: boolean }>;
    }>();

    for (const row of rows) {
      if (!rulesMap.has(row.rule_id)) {
        rulesMap.set(row.rule_id, {
          id: row.rule_id,
          frequency: row.rule_freq,
          interval: row.rule_interval,
          byDay: row.rule_byDay,
          cronExpr: row.rule_cron,
          startDate: row.rule_start,
          endDate: row.rule_end,
          todos: [],
        });
      }
      if (row.todo_id && row.todo_title) {
        rulesMap.get(row.rule_id)!.todos.push({
          id: row.todo_id,
          title: row.todo_title,
          description: row.todo_desc,
          categoryId: row.todo_categoryId,
          levelId: row.todo_levelId,
          priority: row.todo_priority ?? 0,
          isMilestone: Boolean(row.todo_isMilestone),
        });
      }
    }

    for (const rule of rulesMap.values()) {
      if (rule.todos.length === 0) continue;

      const ruleEndDate = rule.endDate ? new Date(rule.endDate) : null;
      const effectiveEnd = ruleEndDate && ruleEndDate < windowEnd ? ruleEndDate : windowEnd;

      const byDayArray = rule.byDay ? JSON.parse(rule.byDay) : null;
      const occurrenceDates = calculateOccurrenceDates(
        {
          frequency: rule.frequency as Frequency,
          interval: rule.interval,
          byDay: byDayArray,
          cronExpr: rule.cronExpr,
          startDate: rule.startDate.substring(0, 10), // YYYY-MM-DD
          endDate: rule.endDate ? rule.endDate.substring(0, 10) : null,
        },
        windowStart,
        effectiveEnd
      );

      for (const templateTodo of rule.todos) {
        for (const occurrenceDate of occurrenceDates) {
          const dateStr = formatDate(occurrenceDate); // YYYY-MM-DD

          // 用日期字符串比较，避免时间戳精度问题
          const existing = await d1.first<{ id: string }>(
            `SELECT id FROM todos WHERE parentRuleId=? AND strftime('%Y-%m-%d', dueDate)=? AND title=?`,
            rule.id, dateStr, templateTodo.title
          );

          if (existing) {
            result.skipped++;
            continue;
          }

          // 创建新任务实例
          try {
            const id = crypto.randomUUID();
            const occISO = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
            const now = new Date().toISOString();
            await d1.run(
              `INSERT INTO todos (id, title, description, status, startDate, dueDate,
               categoryId, levelId, priority, isMilestone, isCycleTask,
               recurrenceRuleId, parentRuleId, userId, createdAt, updatedAt)
               VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
              id, templateTodo.title, templateTodo.description ?? null,
              occISO, occISO,
              templateTodo.categoryId ?? null, templateTodo.levelId ?? null,
              templateTodo.priority, templateTodo.isMilestone ? 1 : 0,
              rule.id, rule.id, userId, now, now
            );
            result.created++;
          } catch (error) {
            console.error(`Failed to create recurring task instance:`, error);
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Sync recurring tasks (D1) error:', error);
    return result;
  }
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
  if (IS_EDGE) {
    return syncRecurringTasksD1(windowStart, windowEnd, userId);
  }

  const result = { created: 0, skipped: 0 };

  try {
    const db = await getDb();
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
      const ruleEndDate = rule.endDate;
      const effectiveEnd = ruleEndDate && ruleEndDate < windowEnd ? ruleEndDate : windowEnd;

      // 计算此规则在时间窗口内的执行日期
      const byDayArray = rule.byDay ? JSON.parse(rule.byDay) : null;

      const occurrenceDates = calculateOccurrenceDates(
        {
          frequency: rule.frequency as Frequency,
          interval: rule.interval,
          byDay: byDayArray,
          cronExpr: rule.cronExpr,
          startDate: formatDate(rule.startDate),
          endDate: rule.endDate ? formatDate(rule.endDate) : null,
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
              dueDate: occurrenceDate,
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
                startDate: occurrenceDate,
                dueDate: occurrenceDate,
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
