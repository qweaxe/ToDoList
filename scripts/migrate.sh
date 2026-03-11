#!/bin/bash
set -e

echo "Checking migration baseline..."

# 检查 _prisma_migrations 表是否存在
MIGRATION_TABLE_EXISTS=$(npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) as count 
FROM information_schema.tables 
WHERE table_name = '_prisma_migrations';
EOF
)

# 如果迁移表不存在，执行 baseline
if echo "$MIGRATION_TABLE_EXISTS" | grep -q '"count":"0"'; then
  echo "No migration history found, applying baseline..."
  npx prisma migrate resolve --applied 0_init
else
  echo "Migration history exists, skipping baseline."
fi

echo "Running migrations..."
npx prisma migrate deploy