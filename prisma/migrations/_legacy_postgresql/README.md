# PostgreSQL 遗留迁移文件
# 
# 这些迁移文件是为 Vercel+Supabase (PostgreSQL) 环境编写的，
# 包含 PostgreSQL 特有语法（TIMESTAMP(3)、::timestamp cast、NOW() 等）。
# 
# 当前项目已迁移到 Cloudflare D1 (SQLite) 部署方案：
# - D1 使用 d1-schema.sql 初始化
# - 开发环境使用 prisma db push
# - 这些迁移文件不会被执行
#
# 仅保留作为历史参考，请勿在生产环境使用。