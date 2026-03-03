import { db } from '@todolist/db';

// tRPC 上下文类型
export interface Context {
  db: typeof db;
  [key: string]: unknown;
}

// 创建上下文
export function createContext(): Context {
  return {
    db,
  };
}
