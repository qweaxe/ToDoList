#!/bin/bash
# PreToolUse hook: 在 git push 前提醒更新 WORKLOG.md
# 按照 CLAUDE.md 中的工作流要求，WORKLOG.md 必须包含在每次提交中

echo "请先更新 WORKLOG.md 记录本次改动内容后再执行 git push。按照 CLAUDE.md 中的工作流要求，WORKLOG.md 必须包含在每次提交中。" >&2
exit 2