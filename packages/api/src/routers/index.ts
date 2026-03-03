import { router } from '../trpc';
import { todoRouter } from './todo';
import { categoryRouter } from './category';
import { levelRouter } from './level';
import { holidayRouter } from './holiday';

// 合并所有路由
export const appRouter = router({
  todo: todoRouter,
  category: categoryRouter,
  level: levelRouter,
  holiday: holidayRouter,
});

// 导出路由类型
export type AppRouter = typeof appRouter;