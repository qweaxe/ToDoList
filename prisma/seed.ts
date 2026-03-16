import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据初始化...');

  // 创建等级数据
  const levels = [
    { name: '高', value: 3, description: '需要优先处理' },
    { name: '中', value: 2, description: '正常处理' },
    { name: '低', value: 1, description: '有空时处理' },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { name: level.name },
      update: level,
      create: level,
    });
    console.log(`✅ 创建等级: ${level.name}`);
  }

  // 创建测试用户
  const testPassword = await bcrypt.hash('123456', 10);
  const testUser = await prisma.user.upsert({
    where: { username: 'test' },
    update: {},
    create: {
      username: 'test',
      password: testPassword,
      name: '测试用户',
      categories: {
        create: [
          { name: '工作', emoji: '💼', color: 'blue' },
          { name: '学习', emoji: '📚', color: 'green' },
          { name: '生活', emoji: '🏠', color: 'orange' },
        ],
      },
    },
    include: {
      categories: true,
    },
  });

  console.log(`✅ 创建测试用户: ${testUser.username}`);
  console.log(`   默认密码: 123456`);
  console.log(`   分类数量: ${testUser.categories.length}`);

  console.log('🎉 种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
