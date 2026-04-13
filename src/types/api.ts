import { z } from 'zod';

// 日期时间格式验证（支持 ISO 8601）
const datetimeRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

// 创建任务验证
export const createTodoSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题最多100个字符'),
  description: z.string().max(1000, '描述最多1000个字符').optional(),
  startDate: z.string().regex(datetimeRegex, '日期时间格式无效'),
  dueDate: z.string().regex(datetimeRegex, '日期时间格式无效'),
  categoryId: z.string().optional().nullable(),
  levelId: z.string().optional().nullable(),
  subTasks: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isDone: z.boolean(),
  })).optional().nullable(),
  isCycleTask: z.boolean().optional(),
  recurrenceRule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']),
    interval: z.number().min(1).default(1),
    byDay: z.array(z.number().min(0).max(6)).optional().nullable(),
    cronExpr: z.string().optional().nullable(),
    startDate: z.string().regex(datetimeRegex, '日期时间格式无效'),
    endDate: z.string().regex(datetimeRegex, '日期时间格式无效').optional().nullable(),
  }).optional().nullable(),
  isMilestone: z.boolean().optional(),
  priority: z.number().min(0).optional(),
  completedAt: z.string().regex(datetimeRegex, '日期时间格式无效').optional().nullable(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

// 更新任务验证 - 日期字段需要允许 null
export const updateTodoSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题最多100个字符').optional(),
  description: z.string().max(1000, '描述最多1000个字符').optional().nullable(),
  startDate: z.string().regex(datetimeRegex, '日期时间格式无效').optional().nullable(),
  dueDate: z.string().regex(datetimeRegex, '日期时间格式无效').optional().nullable(),
  categoryId: z.string().optional().nullable(),
  levelId: z.string().optional().nullable(),
  subTasks: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isDone: z.boolean(),
  })).optional().nullable(),
  isCycleTask: z.boolean().optional(),
  recurrenceRule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']),
    interval: z.number().min(1).default(1),
    byDay: z.array(z.number().min(0).max(6)).optional().nullable(),
    cronExpr: z.string().optional().nullable(),
    startDate: z.string().regex(datetimeRegex, '日期时间格式无效'),
    endDate: z.string().regex(datetimeRegex, '日期时间格式无效').optional().nullable(),
  }).optional().nullable(),
  isMilestone: z.boolean().optional(),
  priority: z.number().min(0).optional(),
  completedAt: z.string().regex(datetimeRegex, '日期时间格式无效').optional().nullable(),
});
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

// 创建分类验证
export const createCategorySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称最多50个字符'),
  description: z.string().max(200, '描述最多200个字符').optional(),
  emoji: z.string().max(10).optional(),
  color: z.string().max(50).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// 更新分类验证
export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// 创建等级验证
export const createLevelSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称最多50个字符'),
  value: z.number().min(0).max(10, '等级值必须在0-10之间'),
  description: z.string().max(200, '描述最多200个字符').optional(),
});

export type CreateLevelInput = z.infer<typeof createLevelSchema>;

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
