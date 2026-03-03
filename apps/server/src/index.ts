import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import { appRouter, createContext } from '@todolist/api';

const app = new Hono();

// CORS 配置
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// tRPC 中间件
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: createContext,
  })
);

// 健康检查
app.get('/', (c) => {
  return c.json({ 
    message: 'ToDo List API Server',
    version: '0.0.1',
    status: 'ok' 
  });
});

// 启动服务器
const port = process.env.PORT || 3001;
console.log(`🚀 Server running at http://localhost:${port}`);

export default app;