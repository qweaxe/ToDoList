import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { todos } from './todo';
import { subTasks } from './todo';

// 任务等级表
export const taskLevels = pgTable('task_level', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6b7280'),  // 默认灰色
  weight: integer('weight').notNull().default(0),      // 权重，用于排序，数值越大优先级越高
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 关系定义
export const taskLevelsRelations = relations(taskLevels, ({ many }) => ({
  todos: many(todos),
  subTasks: many(subTasks),
}));

// 类型导出
export type TaskLevel = typeof taskLevels.$inferSelect;
export type NewTaskLevel = typeof taskLevels.$inferInsert;