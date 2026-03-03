import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { taskCategories, todos } from '@todolist/db';
import { eq, inArray } from 'drizzle-orm';

export const categoryRouter = router({
  // 获取所有分类
  list: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.taskCategories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.createdAt)],
    });
    return result;
  }),

  // 创建分类
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      emoji: z.string().default('📋'),
    }))
    .mutation(async ({ input, ctx }) => {
      const [category] = await ctx.db.insert(taskCategories)
        .values(input)
        .returning();
      return category;
    }),

  // 更新分类
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        emoji: z.string().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, data } = input;
      const [updated] = await ctx.db.update(taskCategories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(taskCategories.id, id))
        .returning();
      return updated;
    }),

  // 删除单个分类
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      
      // 检查是否被引用
      const referencedTodos = await ctx.db.query.todos.findFirst({
        where: eq(todos.categoryId, id),
      });
      
      if (referencedTodos) {
        throw new Error('该分类已被任务引用，无法删除');
      }
      
      await ctx.db.delete(taskCategories).where(eq(taskCategories.id, id));
      return { success: true };
    }),

  // 批量删除分类
  deleteBatch: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const { ids } = input;
      
      // 检查是否被引用
      const referencedTodos = await ctx.db.query.todos.findFirst({
        where: inArray(todos.categoryId, ids),
      });
      
      if (referencedTodos) {
        throw new Error('部分分类已被任务引用，无法删除');
      }
      
      await ctx.db.delete(taskCategories).where(inArray(taskCategories.id, ids));
      return { success: true, count: ids.length };
    }),
});