/// <reference types="bun-types" />
/**
 * 周期任务实例存量去重脚本（一次性，配合唯一索引 idx_todos_rule_date_title）
 *
 * 背景：历史并发（PiP 悬浮窗 + 主窗口同时触发 sync）导致生产 D1 的 todos 表
 * 存在 (parentRuleId, 日历日 dueDate, title) 重复行，直接 CREATE UNIQUE INDEX 会失败。
 *
 * 保留规则（用户已确认）：每组重复保留 createdAt 最晚的一条（并列时 id 较大者），删除更早的。
 * 手动任务（parentRuleId 为 NULL）不受唯一约束影响，本脚本不触碰。
 *
 * 用法（bun 运行，不加新依赖，使用 bun 内置 sqlite）：
 *   bun scripts/dedup-recurrence-instances.ts <sqlite-db-path>            # dry-run（默认）：只读统计 + 输出待删明细 + 可执行 SQL
 *   bun scripts/dedup-recurrence-instances.ts <sqlite-db-path> --apply    # 实际执行删除（不可逆，先备份）
 *
 * 生产 D1：dry-run 输出的 SQL 在 D1 控制台执行（先去重，后建唯一索引）。
 * 本地开发库：直接 --apply 对 SQLite 文件执行。
 */

import { Database } from 'bun:sqlite';

// ---------- 可执行 SQL（dry-run 输出、--apply 执行，同一段） ----------

// 待删明细（每组重复中 createdAt 较早的行；供人工审核）
const SELECT_VICTIMS_SQL = `
SELECT id, parentRuleId, title, dueDate, status, createdAt
FROM (
  SELECT id, parentRuleId, title, dueDate, status, createdAt,
         ROW_NUMBER() OVER (
           PARTITION BY parentRuleId, date(dueDate), title
           ORDER BY createdAt DESC, id DESC
         ) AS rn
  FROM todos
  WHERE parentRuleId IS NOT NULL
)
WHERE rn > 1
ORDER BY parentRuleId, dueDate, title, createdAt`;

// 只读统计：重复组数与涉及的行数
const STATS_SQL = `
SELECT COUNT(*) AS dup_groups, COALESCE(SUM(c - 1), 0) AS rows_to_delete
FROM (
  SELECT COUNT(*) AS c
  FROM todos
  WHERE parentRuleId IS NOT NULL
  GROUP BY parentRuleId, date(dueDate), title
  HAVING c > 1
)`;

// 删除语句（幂等：重复执行第二次无行可删）
const DELETE_SQL = `
DELETE FROM todos
WHERE parentRuleId IS NOT NULL
  AND id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY parentRuleId, date(dueDate), title
               ORDER BY createdAt DESC, id DESC
             ) AS rn
      FROM todos
      WHERE parentRuleId IS NOT NULL
    )
    WHERE rn > 1
  )`;

// 建唯一索引（去重完成后执行；建失败说明仍有重复，回到 dry-run 排查）
const CREATE_INDEX_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_todos_rule_date_title
    ON todos(parentRuleId, date(dueDate), title)`;

// ---------- 主流程 ----------

function printUsageAndExit(code = 1): never {
  console.error('用法: bun scripts/dedup-recurrence-instances.ts <sqlite-db-path> [--apply]');
  process.exit(code);
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dbPath = args.find((a) => !a.startsWith('--'));
if (!dbPath) printUsageAndExit();

// 注意：显式传入 options 对象时 bun 不会套用默认标志，
// dry-run 必须显式 readonly；--apply 需显式 readwrite（不 create，防误建空库）
const db = new Database(dbPath, apply ? { readwrite: true } : { readonly: true });

interface DupStats {
  dup_groups: number;
  rows_to_delete: number;
}

interface VictimRow {
  id: string;
  parentRuleId: string;
  title: string;
  dueDate: string;
  status: string;
  createdAt: string;
}

try {
  // 1. 只读统计
  const stats = (db.query(STATS_SQL).get() ?? {
    dup_groups: 0,
    rows_to_delete: 0,
  }) as DupStats;
  console.log(`重复组数: ${stats.dup_groups}，待删除行数: ${stats.rows_to_delete}`);

  // 2. 待删明细（人工审核）
  const victims = db.query(SELECT_VICTIMS_SQL).all() as unknown as VictimRow[];

  if (victims.length === 0) {
    console.log('无重复数据，可直接建唯一索引。');
  } else {
    for (const v of victims) {
      console.log(
        `  将删除: id=${v.id} rule=${v.parentRuleId} title="${v.title}" dueDate=${v.dueDate} status=${v.status} createdAt=${v.createdAt}`
      );
    }
  }

  // 3. 输出可执行 SQL（生产 D1 在控制台执行）
  console.log('\n以下 SQL 用于生产 D1 控制台（顺序：去重 → 建索引）：\n');
  console.log('-- ① 去重（保留每组 createdAt 最晚的行）');
  console.log(DELETE_SQL.trim().replace(/^/gm, '') + ';');
  console.log('\n-- ② 建唯一索引');
  console.log(CREATE_INDEX_SQL.trim() + ';');

  // 4. --apply：对本地 SQLite 实际执行
  if (apply) {
    const deleted = db.run(DELETE_SQL).changes;
    db.run(CREATE_INDEX_SQL);
    console.log(`\n[--apply] 已删除 ${deleted} 行，唯一索引已创建。`);
  } else {
    console.log('\n[dry-run] 未执行任何写操作。确认无误后追加 --apply（或对生产 D1 执行上述 SQL）。');
  }
} finally {
  db.close();
}
