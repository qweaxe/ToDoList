/**
 * 资源归属校验辅助
 * 防止跨用户引用他人的分类/任务/等级
 * 返回布尔，由调用方决定响应（统一 400 通用文案，不泄露资源存在性）
 */

import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

/** 去重去空 */
function uniqueIds(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/**
 * 校验分类 ID 是否全部属于该用户（空数组直接通过）
 * categories.userId NOT NULL，无共享分类
 */
export async function assertCategoriesBelongToUser(
  categoryIds: (string | null | undefined)[],
  userId: string
): Promise<boolean> {
  const ids = uniqueIds(categoryIds);
  if (ids.length === 0) return true;

  if (IS_EDGE) {
    const d1 = await getD1Client();
    const placeholders = ids.map(() => '?').join(',');
    const row = await d1.first<{ n: number }>(
      `SELECT COUNT(DISTINCT id) AS n FROM categories WHERE id IN (${placeholders}) AND userId=?`,
      ...ids, userId
    );
    return Number(row?.n ?? 0) === ids.length;
  }

  const db = await getDb();
  const count = await db.category.count({
    where: { id: { in: ids }, userId },
  });
  return count === ids.length;
}

/**
 * 校验任务 ID 是否全部属于该用户（空数组直接通过）
 * todos.userId NOT NULL
 */
export async function assertTodosBelongToUser(
  todoIds: (string | null | undefined)[],
  userId: string
): Promise<boolean> {
  const ids = uniqueIds(todoIds);
  if (ids.length === 0) return true;

  if (IS_EDGE) {
    const d1 = await getD1Client();
    const placeholders = ids.map(() => '?').join(',');
    const row = await d1.first<{ n: number }>(
      `SELECT COUNT(DISTINCT id) AS n FROM todos WHERE id IN (${placeholders}) AND userId=?`,
      ...ids, userId
    );
    return Number(row?.n ?? 0) === ids.length;
  }

  const db = await getDb();
  const count = await db.todo.count({
    where: { id: { in: ids }, userId },
  });
  return count === ids.length;
}

/**
 * 校验等级 ID 是否全部存在（空数组直接通过）
 * levels 为系统级共享，无归属，仅校验存在性
 */
export async function assertLevelsExist(
  levelIds: (string | null | undefined)[]
): Promise<boolean> {
  const ids = uniqueIds(levelIds);
  if (ids.length === 0) return true;

  if (IS_EDGE) {
    const d1 = await getD1Client();
    const placeholders = ids.map(() => '?').join(',');
    const row = await d1.first<{ n: number }>(
      `SELECT COUNT(DISTINCT id) AS n FROM levels WHERE id IN (${placeholders})`,
      ...ids
    );
    return Number(row?.n ?? 0) === ids.length;
  }

  const db = await getDb();
  const count = await db.level.count({
    where: { id: { in: ids } },
  });
  return count === ids.length;
}
