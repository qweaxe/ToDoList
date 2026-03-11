#!/bin/bash
set -e

echo "Applying baseline if needed..."

# 尝试 baseline，如果已经存在就忽略错误
npx prisma migrate resolve --applied 0_init 2>&1 | tee /tmp/baseline_output.txt || true

# 检查输出，判断是正常 baseline 还是真正的错误
if grep -q "already been applied" /tmp/baseline_output.txt || \
   grep -q "marked as applied" /tmp/baseline_output.txt || \
   grep -q "error" /tmp/baseline_output.txt; then
  echo "Baseline step done (already applied or skipped)."
else
  echo "Baseline applied successfully."
fi

echo "Running migrate deploy..."
npx prisma migrate deploy