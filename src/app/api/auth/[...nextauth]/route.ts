export const runtime = 'edge';

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
import { getDb } from "@/lib/db";

// 获取 NEXTAUTH_SECRET，兼容 Cloudflare Workers 环境
async function getSecret(): Promise<string | undefined> {
  console.log('[auth] Getting secret...');
  console.log('[auth] process.env.NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'defined' : 'undefined');
  console.log('[auth] process.env.AUTH_SECRET:', process.env.AUTH_SECRET ? 'defined' : 'undefined');
  console.log('[auth] process.env.NODE_ENV:', process.env.NODE_ENV);

  // 优先使用 process.env（本地开发或已注入的环境变量）
  if (process.env.NEXTAUTH_SECRET) {
    console.log('[auth] Using NEXTAUTH_SECRET from process.env');
    return process.env.NEXTAUTH_SECRET;
  }

  if (process.env.AUTH_SECRET) {
    console.log('[auth] Using AUTH_SECRET from process.env');
    return process.env.AUTH_SECRET;
  }

  // Cloudflare Workers 环境下，通过 getRequestContext 获取 env
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const ctx = getRequestContext();
    console.log('[auth] Got request context');
    console.log('[auth] env keys:', Object.keys(ctx.env || {}));

    const env = ctx.env as Record<string, unknown>;

    // 详细调试：查看实际类型和值
    const rawSecret = env['NEXTAUTH_SECRET'];
    const rawAuthSecret = env['AUTH_SECRET'];
    console.log('[auth] NEXTAUTH_SECRET type:', typeof rawSecret);
    console.log('[auth] AUTH_SECRET type:', typeof rawAuthSecret);

    // 尝试 String() 强制转换（处理空字符串、null、undefined 等情况）
    const secretStr = rawSecret != null ? String(rawSecret) : '';
    const authSecretStr = rawAuthSecret != null ? String(rawAuthSecret) : '';
    console.log('[auth] NEXTAUTH_SECRET length:', secretStr.length);
    console.log('[auth] AUTH_SECRET length:', authSecretStr.length);

    if (secretStr.length > 0) {
      console.log('[auth] Found NEXTAUTH_SECRET in env');
      return secretStr;
    }
    if (authSecretStr.length > 0) {
      console.log('[auth] Found AUTH_SECRET in env');
      return authSecretStr;
    }
    console.log('[auth] No secret found in env');
  } catch (e) {
    console.log('[auth] getRequestContext error:', e);
  }

  console.log('[auth] No secret found anywhere!');
  return undefined;
}

// 使用 next-auth v5 的 lazy initialization 模式
export const { handlers, auth } = NextAuth(async (req) => {
  console.log('[auth] Lazy init called, req:', req ? 'defined' : 'undefined');
  const secret = await getSecret();
  console.log('[auth] Secret result:', secret ? 'defined' : 'undefined');

  return {
    secret,
    session: {
      strategy: "jwt" as const,
      maxAge: 7 * 24 * 60 * 60,
    },
    pages: {
      signIn: "/",
      error: "/",
    },
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          username: { label: "用户名", type: "text" },
          password: { label: "密码", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("请输入用户名和密码");
          }

          const db = await getDb();
          const user = await db.user.findUnique({
            where: { username: credentials.username as string },
          });

          if (!user) {
            throw new Error("用户名或密码错误");
          }

          const isValid = await verifyPassword(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            throw new Error("用户名或密码错误");
          }

          return {
            id: user.id,
            name: user.name || user.username,
            username: user.username,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }: any) {
        if (user) {
          token.id = user.id;
          token.username = user.username;
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
    },
  };
});

export const { GET, POST } = handlers;
