import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { todos, subTasks } from '@todolist/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { determineTaskType } from '@todolist/utils';

export const todoRouter = router({
  // 获取指定日期的任务列表
  getDaily: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input, ctx }) => {
      const { date } = input;
      
      // 查询 startDate <= date <= dueDate 的所有任务
      const result = await ctx.db.query.todos.findMany({
        where: and(
          lte(todos.startDate, date),
          gte(todos.dueDate, date)
        ),
        with: {
          subTasks: true,
          category: true,
          level: true,
        },
        orderBy: [desc(todos.createdAt)],
      });
      
      return result;
    }),

  // 获取整月数据
  getMonthly: publicProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input, ctx }) => {
      const { year, month } = input;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const result = await ctx.db.query.todos.findMany({
        where: and(
          lte(todos.startDate, endDate),
          gte(todos.dueDate, startDate)
        ),
        with: {
          subTasks: true,
          category: true,
          level: true,
        },
        orderBy: [desc(todos.createdAt)],
      });
      
      return result;
    }),

  // 获取一周的数据
  getWeekly: publicProcedure
    .input(z.object({ startDate: z.string() }))
    .query(async ({ input, ctx }) => {
      const { startDate } = input;
      // TODO: 计算周结束日期
      const endDate = startDate; // 临时
      
      const result = await ctx.db.query.todos.findMany({
        where: and(
          lte(todos.startDate, endDate),
          gte(todos.dueDate, startDate)
        ),
        with: {
          subTasks: true,
          category: true,
          level: true,
        },
        orderBy: [desc(todos.createdAt)],
      });
      
      return result;
    }),

  // 获取季度数据（仅里程碑任务）
  getQuarterly: publicProcedure
    .input(z.object({ startDate: z.string() }))
    .query(async ({ input, ctx }) => {
      const { startDate } = input;
      // TODO: 计算季度结束日期
      const endDate = startDate; // 临时
      
      const result = await ctx.db.query.todos.findMany({
        where: and(
          eq(todos.isMilestone, true),
          lte(todos.startDate, endDate),
          gte(todos.dueDate, startDate)
        ),
        with: {
          category: true,
          level: true,
        },
        orderBy: [desc(todos.createdAt)],
      });
      
      return result;
    }),

  // 获取年度统计数据
  getYearlyStats: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input, ctx }) => {
      const { year } = input;
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      // TODO: 实现年度统计查询
      // 仅返回日期和完成数计数
      return {
        year,
        dailyStats: [],
        summary: {
          totalCompleted: 0,
          mostProductiveMonth: 1,
          topCategory: null,
        },
      };
    }),

  // 创建任务
  create: publicProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      startDate: z.string(),
      dueDate: z.string(),
      categoryId: z.string().optional(),
      levelId: z.string().optional(),
      isMilestone: z.boolean().optional(),
      isCycleTask: z.boolean().optional(),
      ruleId: z.string().optional(),
      subTasks: z.array(z.object({
        text: z.string(),
        categoryId: z.string().optional(),
        levelId: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { subTasks: inputSubTasks, ...todoData } = input;
      
      // 计算任务类型
      const taskType = determineTaskType({
        startDate: input.startDate,
        dueDate: input.dueDate,
        subTasks: inputSubTasks || [],
        isCycleTask: input.isCycleTask || false,
      });
      
      // 创建任务
      const [todo] = await ctx.db.insert(todos).values({
        ...todoData,
        taskType,
      }).returning();
      
      // 创建子任务
      if (inputSubTasks && inputSubTasks.length > 0) {
        await ctx.db.insert(subTasks).values(
          inputSubTasks.map(st => ({
            ...st,
            todoId: todo.id,
          }))
        );
      }
      
      return todo;
    }),

  // 更新任务
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        dueDate: z.string().optional(),
        categoryId: z.string().optional(),
        levelId: z.string().optional(),
        isMilestone: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, data } = input;
      
      const [updated] = await ctx.db.update(todos)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(todos.id, id))
        .returning();
      
      return updated;
    }),

  // 切换任务状态
  toggle: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      
      // 获取当前任务
      const [todo] = await ctx.db.select().from(todos).where(eq(todos.id, id));
      
      if (!todo) {
        throw new Error('Task not found');
      }
      
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      const completedAt = newStatus === 'completed' ? new Date() : null;
      
      const [updated] = await ctx.db.update(todos)
        .set({ 
          status: newStatus, 
          completedAt,
          updatedAt: new Date() 
        })
        .where(eq(todos.id, id))
        .returning();
      
      return updated;
    }),

  // 删除单个任务
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      
      await ctx.db.delete(todos).where(eq(todos.id, id));
      
      return { success: true };
    }),

  // 批量删除任务
  deleteBatch: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const { ids } = input;
      
      // TODO: 实现批量删除
      for (const id of ids) {
        await ctx.db.delete(todos).where(eq(todos.id, id));
      }
      
      return { success: true, count: ids.length };
    }),

  // 获取历史待办任务
  getOverdue: publicProcedure
    .input(z.object({ 
      date: z.string(),
      limit: z.number().default(5),
    }))
    .query(async ({ input, ctx }) => {
      const { date, limit } = input;
      
      // TODO: 实现历史待办查询
      // 获取 startDate <= date - 1 且未完成的任务
      // 按等级权重从高到低排序
      
      return [];
    }),
});