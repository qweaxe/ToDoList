import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
import { getDb } from "@/lib/db";

// 自定义登录错误类，用于向客户端传递错误信息
class InvalidLoginError extends CredentialsSignin {
  code = "用户名或密码错误";
}

class MissingCredentialsError extends CredentialsSignin {
  code = "请输入用户名和密码";
}

// NextAuth 配置
function getAuthConfig(secret: string | undefined) {
  return {
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
            throw new MissingCredentialsError();
          }

          const db = await getDb();
          const user = await db.user.findUnique({
            where: { username: credentials.username as string },
          });

          if (!user) {
            throw new InvalidLoginError();
          }

          const isValid = await verifyPassword(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            throw new InvalidLoginError();
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
}

// 开发环境：使用静态配置
const devAuth = NextAuth(getAuthConfig(process.env.NEXTAUTH_SECRET));

// 导出 handlers（开发环境使用）
export const handlers = devAuth.handlers;

// 导出 auth 函数
export const auth = devAuth.auth;

// 导出 signIn 和 signOut（客户端使用）
export const signIn = devAuth.signIn;
export const signOut = devAuth.signOut;
