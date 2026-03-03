import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { todos } from './todo';
import { subTasks } from './todo';

// 任务分类表
export const taskCategories = pgTable('task_category', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  emoji: text('emoji').notNull().default('📋'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 关系定义
export const taskCategoriesRelations = relations(taskCategories, ({ many }) => ({
  todos: many(todos),
  subTasks: many(subTasks),
}));

// 类型导出
export type TaskCategory = typeof taskCategories.$inferSelect;
export type NewTaskCategory = typeof taskCategories.$inferInsert;