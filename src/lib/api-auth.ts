/**
 * API Token 认证辅助函数
 * 支持 Bearer Token 和 Session 双重认证
 * 使用 Web Crypto API 兼容 Edge Runtime
 */

import { NextRequest } from 'next/server';
import { getAuthSession } from './auth';
import { getDb } from './db';

// API Token 前缀
export const API_TOKEN_PREFIX = 'tdl_';

// Token 验证结果
export interface ApiAuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * 从请求头提取 Bearer Token
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 对 Token 进行哈希处理（用于数据库存储和比较）
 * 使用 Web Crypto API (SHA-256)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成随机 Token
 * 格式: tdl_<32位随机字符串>
 */
export function generateApiToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  const base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `${API_TOKEN_PREFIX}${base64}`;
}

/**
 * 验证 Token 格式
 */
export function isValidTokenFormat(token: string): boolean {
  return token.startsWith(API_TOKEN_PREFIX) && token.length > 10;
}

/**
 * 验证 API Token 并返回用户 ID
 */
export async function verifyApiToken(token: string): Promise<ApiAuthResult> {
  if (!isValidTokenFormat(token)) {
    return { success: false, error: '无效的 Token 格式' };
  }

  const hashedToken = await hashToken(token);
  const db = await getDb();

  const apiKey = await db.apiKey.findUnique({
    where: { key: hashedToken },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!apiKey) {
    return { success: false, error: 'Token 不存在或已撤销' };
  }

  // 检查是否过期
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return { success: false, error: 'Token 已过期' };
  }

  // 更新最后使用时间（异步执行，不阻塞请求）
  getDb().then(async (db) => {
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });
  }).catch(() => {
    // 忽略更新失败
  });

  return { success: true, userId: apiKey.userId };
}

/**
 * 双重认证：优先检查 Bearer Token，无 Token 时检查 Session
 * 用于需要同时支持 API 访问和 Web 访问的接口
 */
export async function getApiSession(request: NextRequest): Promise<ApiAuthResult> {
  // 1. 尝试 Bearer Token 认证
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    return verifyApiToken(bearerToken);
  }

  // 2. 尝试 Session 认证
  const session = await getAuthSession();
  if (session?.user?.id) {
    return { success: true, userId: session.user.id };
  }

  return { success: false, error: '未授权访问' };
}

/**
 * 仅 API Token 认证（不回退到 Session）
 * 用于仅供外部程序调用的接口
 */
export async function requireApiToken(request: NextRequest): Promise<ApiAuthResult> {
  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return { success: false, error: '缺少 Authorization 头' };
  }

  return verifyApiToken(bearerToken);
}
