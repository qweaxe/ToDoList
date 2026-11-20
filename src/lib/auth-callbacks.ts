/**
 * NextAuth 共享回调与登录限流
 * src/auth.ts（校验路径）与 src/app/api/auth/[...nextauth]/route.ts（签发端点）
 * 统一引用本模块，消除双配置漂移：
 * - jwt：首次登录埋入 tokenVersion，后续请求比对库中版本（改密/重置密码后吊销旧 JWT）
 * - session：透出 user.id / user.username
 * - 登录限流：按 IP 固定窗口计数，超限抛 RateLimitError（CredentialsSignin 子类，文案直接透出前端）
 */

import { CredentialsSignin } from "next-auth";

/** 登录限流超限错误：code 会作为错误信息展示给用户 */
export class RateLimitError extends CredentialsSignin {
  code = "操作过于频繁，请稍后再试";
}

/**
 * 登录限流：10 次 / 15 分钟 / IP
 * - IP 取自请求头（CF-Connecting-IP > X-Forwarded-For 首段 > 'dev'）
 * - headers() 不可用或限流模块故障时放行（fail-open，可用性优先）
 */
export async function enforceLoginRateLimit(): Promise<void> {
  try {
    const { headers } = await import("next/headers");
    const { checkRateLimit, getClientIp } = await import("@/lib/rate-limit");
    const h = await headers();
    const r = await checkRateLimit(`login:${getClientIp(h)}`, 10, 15 * 60 * 1000);
    if (!r.allowed) throw new RateLimitError();
  } catch (e) {
    if (e instanceof RateLimitError) throw e;
    // fail-open：无法取 IP 或限流存储故障时放行
  }
}

/** 统一的 NextAuth jwt / session 回调（双配置共享） */
export function buildAuthCallbacks() {
  return {
    async jwt({ token, user }: any) {
      // 动态导入避免 auth ↔ api-auth 循环依赖
      const { getUserTokenVersion } = await import("@/lib/api-auth");
      if (user) {
        // 首次登录：埋入库中 tokenVersion
        token.id = user.id;
        token.username = user.username;
        token.tokenVersion = await getUserTokenVersion(user.id);
      } else if (token.id) {
        // 后续请求：比对库中版本，不一致则返回空 token 视为未认证（吊销旧 JWT）
        // 旧 token 无 tokenVersion 字段按 0 处理，存量登录态保留
        const current = await getUserTokenVersion(token.id as string);
        if (current !== null && Number(token.tokenVersion ?? 0) !== current) {
          return {};
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  };
}
