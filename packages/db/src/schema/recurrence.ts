import { pgTable, text, timestamp, uuid, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { todos } from './todo';

// 周期规则表
export const recurrenceRules = pgTable('recurrence_rule', {
  id: uuid('id').defaultRandom().primaryKey(),
  frequency: text('frequency', { 
    enum: ['daily', 'weekly', 'monthly', 'yearly'] 
  }).notNull(),
  interval: integer('interval').default(1).notNull(),  // 间隔，如每2周一次
  byDay: text('by_day'),          // JSON 数组字符串，如 '[1,3,5]' 表示周一、三、五
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 关系定义
export const recurrenceRulesRelations = relations(recurrenceRules, ({ many }) => ({
  todos: many(todos),
}));

// 类型导出
export type RecurrenceRule = typeof recurrenceRules.$inferSelect;
export type NewRecurrenceRule = typeof recurrenceRules.$inferInsert;

// 频率类型
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';