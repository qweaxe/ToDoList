/**
 * 轻量级 Cloudflare D1 客户端
 * 绕过 Prisma 初始化开销，直接使用原生 D1 SQL
 * 仅用于生产环境（edge runtime）
 */

export class D1Client {
  constructor(private db: any) {}

  async all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const result: { results: T[] } = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();
    return result.results ?? [];
  }

  async first<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const result: T | null = params.length > 0
      ? await stmt.bind(...params).first()
      : await stmt.first();
    return result ?? null;
  }

  async run(sql: string, ...params: unknown[]): Promise<void> {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      await stmt.bind(...params).run();
    } else {
      await stmt.run();
    }
  }
}

export async function getD1Client(): Promise<D1Client> {
  const { getRequestContext } = await import('@cloudflare/next-on-pages');
  const { env } = getRequestContext();
  return new D1Client((env as any).DB);
}

/** 是否运行在 Cloudflare edge 环境（生产） */
export const IS_EDGE = process.env.NODE_ENV !== 'development';
