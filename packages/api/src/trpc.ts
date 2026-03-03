import { initTRPC } from '@trpc/server';
import { Context } from './context';

// 初始化 tRPC
const t = initTRPC.context<Context>().create();

// 导出 tRPC 构建器
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;