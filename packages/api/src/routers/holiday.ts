import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

// 节假日缓存
const holidayCache = new Map<string, any>();

export const holidayRouter = router({
  // 获取指定月份的节假日信息
  getMonthly: publicProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const { year, month } = input;
      const cacheKey = `${year}-${month}`;
      
      // 检查缓存
      if (holidayCache.has(cacheKey)) {
        return holidayCache.get(cacheKey);
      }
      
      try {
        // 调用节假日 API
        const response = await fetch(
          `https://timor.tech/api/holiday/year/${year}/month/${month}`,
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch holiday data');
        }
        
        const data = await response.json();
        
        // 缓存结果
        holidayCache.set(cacheKey, data);
        
        return data;
      } catch (error) {
        console.error('Failed to fetch holiday data:', error);
        return {};
      }
    }),
});