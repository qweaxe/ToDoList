import { getAuthSession } from './auth';

/**
 * 检查当前用户是否为管理员
 * 通过环境变量 ADMIN_USER_IDS 配置管理员用户 ID 列表
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getAuthSession();
  if (!session?.user?.id) return false;

  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(s => s.trim()) ?? [];
  return adminIds.includes(session.user.id);
}

/**
 * 获取管理员用户 ID 列表
 */
export function getAdminUserIds(): string[] {
  return process.env.ADMIN_USER_IDS?.split(',').map(s => s.trim()) ?? [];
}
