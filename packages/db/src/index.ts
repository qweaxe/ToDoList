import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 数据库连接配置
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/todolist';

// 创建连接
const client = postgres(connectionString);

// 创建 drizzle 实例
export const db = drizzle(client, { schema });

// 导出 schema
export * from './schema';

// 导出类型
export type { Todo, NewTodo, SubTask, NewSubTask } from './schema';
export type { TaskCategory, NewTaskCategory } from './schema';
export type { TaskLevel, NewTaskLevel } from './schema';
export type { RecurrenceRule, NewRecurrenceRule, Frequency } from './schema';