import { pgTable, text, timestamp, boolean, integer, uuid, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { taskCategories } from './category';
import { taskLevels } from './level';
import { recurrenceRules } from './recurrence';

// 子任务表
export const subTasks = pgTable('sub_task', {
  id: uuid('id').defaultRandom().primaryKey(),
  todoId: uuid('todo_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  isDone: boolean('is_done').default(false).notNull(),
  
  // 子任务的分类和等级
  categoryId: uuid('category_id').references(() => taskCategories.id, { onDelete: 'set null' }),
  levelId: uuid('level_id').references(() => taskLevels.id, { onDelete: 'set null' }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 任务表
export const todos = pgTable('todo', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  
  // 状态
  status: text('status', { enum: ['pending', 'in_progress', 'completed'] }).default('pending').notNull(),
  
  // 时间维度
  startDate: date('start_date', { mode: 'string' }).notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  completedAt: timestamp('completed_at'),
  
  // 周期任务
  isCycleTask: boolean('is_cycle_task').default(false).notNull(),
  ruleId: uuid('rule_id').references(() => recurrenceRules.id, { onDelete: 'set null' }),
  
  // 里程碑标记
  isMilestone: boolean('is_milestone').default(false).notNull(),
  
  // 优先级（保留向后兼容，推荐使用 levelId）
  priority: integer('priority').default(0),
  
  // 关联
  categoryId: uuid('category_id').references(() => taskCategories.id, { onDelete: 'set null' }),
  levelId: uuid('level_id').references(() => taskLevels.id, { onDelete: 'set null' }),
  
  // 任务类型（系统计算字段）
  taskType: text('task_type', { 
    enum: ['basic', 'multi_day', 'multi_step', 'recurring'] 
  }).default('basic').notNull(),
  
  // 时间戳
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 关系定义
export const todosRelations = relations(todos, ({ many, one }) => ({
  subTasks: many(subTasks),
  category: one(taskCategories, {
    fields: [todos.categoryId],
    references: [taskCategories.id],
  }),
  level: one(taskLevels, {
    fields: [todos.levelId],
    references: [taskLevels.id],
  }),
  recurrenceRule: one(recurrenceRules, {
    fields: [todos.ruleId],
    references: [recurrenceRules.id],
  }),
}));

export const subTasksRelations = relations(subTasks, ({ one }) => ({
  todo: one(todos, {
    fields: [subTasks.todoId],
    references: [todos.id],
  }),
  category: one(taskCategories, {
    fields: [subTasks.categoryId],
    references: [taskCategories.id],
  }),
  level: one(taskLevels, {
    fields: [subTasks.levelId],
    references: [taskLevels.id],
  }),
}));

// 类型导出
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type SubTask = typeof subTasks.$inferSelect;
export type NewSubTask = typeof subTasks.$inferInsert;