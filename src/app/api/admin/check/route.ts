export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';

/**
 * 检查当前用户是否为管理员
 * GET /api/admin/check
 */
export async function GET() {
  try {
    const admin = await isAdmin();
    return NextResponse.json({
      success: true,
      isAdmin: admin,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { success: false, isAdmin: false },
      { status: 500 }
    );
  }
}
