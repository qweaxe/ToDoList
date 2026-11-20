/**
 * 认证端点速率限制（固定窗口计数）
 * - 生产（D1）：单语句原子 upsert（SQLite RETURNING），多 isolate 安全
 * - 开发（Prisma）：单进程 upsert
 * - IP 来源：CF-Connecting-IP（Cloudflare 强制注入，可信）> X-Forwarded-For 首段 > 'dev'
 * - 限流模块自身故障时放行（fail-open，可用性优先）
 * - 过期行按约 1% 概率顺带清理，防表无限增长
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getD1Client, IS_EDGE } from '@/lib/d1';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

/** 从请求头解析客户端 IP */
export function getClientIp(h: Headers): string {
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf;
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'dev';
}

/**
 * key 在 windowMs 窗口内是否已超过 limit 次；本次调用本身计数 +1
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const windowEnd = nowSec + Math.ceil(windowMs / 1000);

    if (IS_EDGE) {
      const d1 = await getD1Client();
      const row = await d1.first<{ count: number; expiresAt: number }>(
        `INSERT INTO rate_limits (key, count, expiresAt) VALUES (?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN expiresAt < ?3 THEN 1 ELSE count + 1 END,
           expiresAt = CASE WHEN expiresAt < ?3 THEN ?4 ELSE expiresAt END
         RETURNING count, expiresAt`,
        key, windowEnd, nowSec, windowEnd
      );
      // 概率性清理过期行（异步，不阻塞请求）
      if (Math.random() < 0.01) {
        d1.run('DELETE FROM rate_limits WHERE expiresAt < ?', nowSec).catch(() => {});
      }
      const count = Number(row?.count ?? 1);
      const expiresAt = Number(row?.expiresAt ?? windowEnd);
      if (count > limit) {
        return { allowed: false, retryAfterSec: Math.max(1, expiresAt - nowSec) };
      }
      return { allowed: true, retryAfterSec: 0 };
    }

    const db = await getDb();
    const existing = await db.rateLimit.findUnique({ where: { key } });
    let count = 1;
    let expiresAt = windowEnd;
    if (existing && existing.expiresAt >= nowSec) {
      count = existing.count + 1;
      expiresAt = existing.expiresAt;
    }
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count, expiresAt },
      update: { count, expiresAt },
    });
    if (Math.random() < 0.01) {
      db.rateLimit.deleteMany({ where: { expiresAt: { lt: nowSec } } }).catch(() => {});
    }
    if (count > limit) {
      return { allowed: false, retryAfterSec: Math.max(1, expiresAt - nowSec) };
    }
    return { allowed: true, retryAfterSec: 0 };
  } catch {
    // 限流存储故障：放行（fail-open）
    return { allowed: true, retryAfterSec: 0 };
  }
}

/**
 * 组合便捷函数：超限时返回 429 响应（带 Retry-After），未超限返回 null
 * 通用文案不区分限制维度，不给攻击者校准信息
 */
export async function enforceRateLimit(
  action: string,
  h: Headers,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  const r = await checkRateLimit(`${action}:${getClientIp(h)}`, limit, windowMs);
  if (r.allowed) return null;
  return NextResponse.json(
    { success: false, error: '操作过于频繁，请稍后再试' },
    { status: 429, headers: { 'Retry-After': String(r.retryAfterSec) } }
  );
}
