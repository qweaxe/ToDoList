export const runtime = 'edge';

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
import { getDb } from "@/lib/db";

// 获取 NEXTAUTH_SECRET，兼容 Cloudflare Workers 环境
async function getSecret(): Promise<string | undefined> {
  // 优先使用 process.env（本地开发或已注入的环境变量）
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET;
  }

  // Cloudflare Workers 环境下，通过 getRequestContext 获取 env
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    // @ts-ignore - Cloudflare env 扩展
    if (env.NEXTAUTH_SECRET) {
      // @ts-ignore
      return env.NEXTAUTH_SECRET as string;
    }
  } catch {
    // getRequestContext 不可用，忽略
  }

  return undefined;
}

// 创建 NextAuth handlers（每次请求时创建以获取最新的 secret）
async function createHandlers() {
  const secret = await getSecret();

  return NextAuth({
    secret,
    session: {
      strategy: "jwt" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days
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
  }).handlers;
}

export async function GET(request: Request) {
  const { handlers } = await createHandlers();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  const { handlers } = await createHandlers();
  return handlers.POST(request);
}
