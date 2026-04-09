export const runtime = 'edge';

import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// 默认分类数据
const defaultCategories = [
  { name: '工作', emoji: '💼', description: '工作相关任务', color: 'bg-blue-500' },
  { name: '生活', emoji: '🏠', description: '日常生活事务', color: 'bg-green-500' },
  { name: '学习', emoji: '📚', description: '学习与成长', color: 'bg-purple-500' },
  { name: '健康', emoji: '💪', description: '健康与运动', color: 'bg-red-500' },
  { name: '娱乐', emoji: '🎮', description: '休闲与娱乐', color: 'bg-yellow-500' },
];

// 默认等级数据（高、中、低）
const defaultLevels = [
  { name: '高', value: 3, description: '高优先级，需要优先处理' },
  { name: '中', value: 2, description: '中等优先级，正常处理' },
  { name: '低', value: 1, description: '低优先级，有空时处理' },
];

export async function GET() {
  try {
    // 需要认证
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查数据是否已存在
    const existingCategories = await db.category.count();
    const existingLevels = await db.level.count();

    let categoriesCreated = 0;
    let levelsCreated = 0;

    // 创建默认分类
    if (existingCategories === 0) {
      for (const category of defaultCategories) {
        await db.category.create({
          data: {
            ...category,
            userId: session.user.id,
          },
        });
        categoriesCreated++;
      }
    }

    // 创建默认等级
    if (existingLevels === 0) {
      for (const level of defaultLevels) {
        await db.level.create({
          data: level,
        });
        levelsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: '种子数据初始化完成',
      categoriesCreated,
      levelsCreated,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: '初始化失败' },
      { status: 500 }
    );
  }
}
