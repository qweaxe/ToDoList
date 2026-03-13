/**
 * API 工具函数
 * 统一错误处理、响应格式和请求体验证
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types/api';

/**
 * 处理 API 错误并返回统一格式的错误响应
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  // Zod 验证错误
  if (error instanceof z.ZodError) {
    const messages = error.errors.map(e => e.message).join(', ');
    return NextResponse.json(
      { success: false, error: `验证失败: ${messages}` },
      { status: 400 }
    );
  }

  // Prisma 错误
  if (error instanceof Error) {
    // 唯一约束冲突
    if (error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { success: false, error: '数据已存在' },
        { status: 409 }
      );
    }

    // 记录服务器错误
    console.error('API Error:', error);
  }

  // 默认服务器错误
  return NextResponse.json(
    { success: false, error: '服务器内部错误' },
    { status: 500 }
  );
}

/**
 * 返回统一格式的成功响应
 */
export function successResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return NextResponse.json(response);
}

/**
 * 验证并解析请求体
 * @throws ZodError 验证失败时抛出
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * 验证路由参数 ID
 */
export function validateId(id: string): string | null {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return null;
  }
  return id.trim();
}

/**
 * 创建错误响应
 */
export function errorResponse(
  message: string,
  status: number = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}