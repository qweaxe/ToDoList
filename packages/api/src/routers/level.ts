import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { taskLevels, todos } from '@todolist/db';
import { eq, inArray } from 'drizzle-orm';

export const levelRouter = router({
  // 获取所有等级
  list: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.taskLevels.findMany({
      orderBy: (levels, { desc }) => [desc(levels.weight)],
    });
    return result;
  }),

  // 创建等级
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      color: z.string().default('#6b7280'),
      weight: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const [level] = await ctx.db.insert(taskLevels)
        .values(input)
        .returning();
      return level;
    }),

  // 更新等级
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        color: z.string().optional(),
        weight: z.number().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, data } = input;
      const [updated] = await ctx.db.update(taskLevels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(taskLevels.id, id))
        .returning();
      return updated;
    }),

  // 删除单个等级
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      
      // 检查是否被引用
      const referencedTodos = await ctx.db.query.todos.findFirst({
        where: eq(todos.levelId, id),
      });
      
      if (referencedTodos) {
        throw new Error('该等级已被任务引用，无法删除');
      }
      
      await ctx.db.delete(taskLevels).where(eq(taskLevels.id, id));
      return { success: true };
    }),

  // 批量删除等级
  deleteBatch: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const { ids } = input;
      
      // 检查是否被引用
      const referencedTodos = await ctx.db.query.todos.findFirst({
        where: inArray(todos.levelId, ids),
      });
      
      if (referencedTodos) {
        throw new Error('部分等级已被任务引用，无法删除');
      }
      
      await ctx.db.delete(taskLevels).where(inArray(taskLevels.id, ids));
      return { success: true, count: ids.length };
    }),
});