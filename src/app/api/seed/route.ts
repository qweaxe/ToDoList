import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Default category data
const defaultCategories = [
  { name: '工作', emoji: '💼', description: '工作相关任务', color: 'bg-blue-500' },
  { name: '生活', emoji: '🏠', description: '日常生活事务', color: 'bg-green-500' },
  { name: '学习', emoji: '📚', description: '学习与成长', color: 'bg-purple-500' },
  { name: '健康', emoji: '💪', description: '健康与运动', color: 'bg-red-500' },
  { name: '娱乐', emoji: '🎮', description: '休闲与娱乐', color: 'bg-yellow-500' },
];

// Default level data (High, Medium, Low)
const defaultLevels = [
  { name: '高', value: 3, description: '高优先级，需要优先处理' },
  { name: '中', value: 2, description: '中等优先级，正常处理' },
  { name: '低', value: 1, description: '低优先级，有空时处理' },
];

export async function GET() {
  try {
    // Require authentication
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // Check if data already exists
    const existingCategories = await db.category.count();
    const existingLevels = await db.level.count();

    let categoriesCreated = 0;
    let levelsCreated = 0;

    // Create default categories
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

    // Create default levels
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
