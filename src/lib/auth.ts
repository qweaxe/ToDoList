// Force recompile - updated at ${new Date().toISOString()}
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 天
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('请输入用户名和密码');
        }

        const user = await db.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          throw new Error('用户名或密码错误');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('用户名或密码错误');
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`用户登录: ${user.username || user.name}`);
    },
    async signOut({ token }) {
      console.log(`用户登出: ${token?.username}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// 获取服务端会话的辅助函数
export async function getAuthSession() {
  const { getServerSession } = await import('next-auth');
  return getServerSession(authOptions);
}
