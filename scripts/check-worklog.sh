#!/bin/bash
# PreToolUse hook: 在 git push 前检查最近提交是否包含 WORKLOG.md 的改动
# 按照 CLAUDE.md 中的工作流要求，WORKLOG.md 必须包含在每次提交中

# 检查最近一次提交是否修改了 WORKLOG.md
if git log -1 --name-only --format="" | grep -q "WORKLOG.md\|worklog.md"; then
  # WORKLOG.md 已在最近提交中更新，允许 push
  exit 0
else
  echo "请先更新 WORKLOG.md 记录本次改动内容后再执行 git push。按照 CLAUDE.md 中的工作流要求，WORKLOG.md 必须包含在每次提交中。" >&2
  exit 2
fi