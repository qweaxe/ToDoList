export const runtime = 'edge';

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
import { getDb } from "@/lib/db";
import { getD1Client, IS_EDGE } from "@/lib/d1";

// 获取 NEXTAUTH_SECRET，兼容 Cloudflare Workers 环境
async function getSecret(): Promise<string | undefined> {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET;
  }
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const env = getRequestContext().env as Record<string, unknown>;
    const secret = env['NEXTAUTH_SECRET'] ?? env['AUTH_SECRET'];
    const secretStr = secret != null ? String(secret) : '';
    if (secretStr.length > 0) return secretStr;
  } catch {}
  return undefined;
}

// 使用 next-auth v5 的 lazy initialization 模式
export const { handlers, auth } = NextAuth(async () => {
  const secret = await getSecret();

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

          let user: { id: string; username: string; name: string | null; password: string } | null = null;

          if (IS_EDGE) {
            const d1 = await getD1Client();
            user = await d1.first<any>(
              'SELECT id, username, name, password FROM users WHERE username = ?',
              credentials.username as string
            );
          } else {
            const db = await getDb();
            user = await db.user.findUnique({
              where: { username: credentials.username as string },
            });
          }

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
