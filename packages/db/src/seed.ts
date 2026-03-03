import { db } from './index';
import { taskLevels, taskCategories } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // 插入默认任务等级
  const levels = await db.insert(taskLevels).values([
    { name: '紧急', color: '#ef4444', weight: 3 },
    { name: '重要', color: '#f59e0b', weight: 2 },
    { name: '普通', color: '#6b7280', weight: 1 },
  ]).returning();
  console.log('✅ Inserted task levels:', levels.length);

  // 插入默认任务分类
  const categories = await db.insert(taskCategories).values([
    { name: '工作', description: '工作相关任务', emoji: '💼' },
    { name: '学习', description: '学习相关任务', emoji: '📚' },
    { name: '生活', description: '日常生活任务', emoji: '🏠' },
    { name: '健康', description: '健康运动相关', emoji: '💪' },
    { name: '其他', description: '其他类型任务', emoji: '📋' },
  ]).returning();
  console.log('✅ Inserted task categories:', categories.length);

  console.log('🎉 Seeding completed!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});