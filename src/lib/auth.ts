import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
        console.log('[Auth] 开始认证, username:', credentials?.username);

        if (!credentials?.username || !credentials?.password) {
          console.log('[Auth] 缺少用户名或密码');
          throw new Error('请输入用户名和密码');
        }

        console.log('[Auth] 查询用户...');
        const user = await db.user.findUnique({
          where: { username: credentials.username },
        });

        console.log('[Auth] 查询结果:', user ? `找到用户 ${user.username}` : '用户不存在');

        if (!user) {
          console.log('[Auth] 用户不存在');
          throw new Error('用户名或密码错误');
        }

        console.log('[Auth] 验证密码...');
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log('[Auth] 密码验证结果:', isPasswordValid);

        if (!isPasswordValid) {
          console.log('[Auth] 密码错误');
          throw new Error('用户名或密码错误');
        }

        console.log('[Auth] 认证成功, user:', user.username);
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
  debug: true, // 临时开启 debug 用于排查问题
};

// 获取服务端会话的辅助函数
export async function getAuthSession() {
  const { getServerSession } = await import('next-auth');
  return getServerSession(authOptions);
}
