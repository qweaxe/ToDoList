/**
 * 时区边界验证脚本
 * 覆盖：极端时区（UTC+14 / UTC-11）、夏令时切换日、
 *       DAILY/WEEKLY interval>1 周期语义、提醒 UTC 比较。
 * 运行：npx -y tsx scripts/tz-boundary-test.ts
 */
import assert from 'node:assert';
import {
  localDateString,
  localDayStart,
  localDayEnd,
  shouldSendReminder,
  formatDate,
} from '../src/lib/date-utils';
import { calculateOccurrenceDates } from '../src/lib/cron-utils';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('== 1. localDayStart / localDayEnd（UTC 绝对时刻）==');
check('Asia/Shanghai 当天 00:00 = UTC 前一日 16:00', () => {
  assert.strictEqual(
    localDayStart('2026-11-19', 'Asia/Shanghai').toISOString(),
    '2026-11-18T16:00:00.000Z'
  );
});
check('America/New_York 当天 00:00 = UTC 当日 05:00（EST）', () => {
  assert.strictEqual(
    localDayStart('2026-11-19', 'America/New_York').toISOString(),
    '2026-11-19T05:00:00.000Z'
  );
});
check('Pacific/Kiritimati（UTC+14）当天 00:00 = UTC 前一日 10:00', () => {
  assert.strictEqual(
    localDayStart('2026-11-19', 'Pacific/Kiritimati').toISOString(),
    '2026-11-18T10:00:00.000Z'
  );
});
check('Pacific/Niue（UTC-11）当天 00:00 = UTC 当日 11:00', () => {
  assert.strictEqual(
    localDayStart('2026-11-19', 'Pacific/Niue').toISOString(),
    '2026-11-19T11:00:00.000Z'
  );
});
check('America/New_York DST 切换日（2026-03-08）当天仅 23 小时', () => {
  const start = localDayStart('2026-03-08', 'America/New_York');
  const end = localDayEnd('2026-03-08', 'America/New_York');
  assert.strictEqual(start.toISOString(), '2026-03-08T05:00:00.000Z');
  assert.strictEqual(end.toISOString(), '2026-03-09T03:59:59.999Z');
  assert.strictEqual(end.getTime() - start.getTime(), 23 * 3600 * 1000 - 1);
});
check('无效时区名回退运行环境本地时区（不抛错）', () => {
  const d = localDayStart('2026-11-19', 'Not/AZone');
  assert.ok(d instanceof Date && !isNaN(d.getTime()));
});

console.log('== 2. localDateString（"今天"随请求时区）==');
check('Kiritimati 的"今天"不早于 Niue 的"今天"，且相差不超过 2 天', () => {
  const kiri = localDateString('Pacific/Kiritimati');
  const niue = localDateString('Pacific/Niue');
  const diff =
    (Date.parse(kiri) - Date.parse(niue)) / (24 * 3600 * 1000);
  assert.ok(diff >= 0 && diff <= 2, `kiri=${kiri} niue=${niue} diff=${diff}`);
});
check('无时区参数时返回运行环境本地日期（yyyy-MM-dd）', () => {
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(localDateString()));
});

console.log('== 3. shouldSendReminder（纯 UTC 比较）==');
check('过去时刻应发送', () => {
  assert.strictEqual(shouldSendReminder(new Date(Date.now() - 60000)), true);
});
check('未来时刻不应发送（同一天也不发）', () => {
  // 今天 23:59（即使仍在"同一天"也必须等到那一刻）
  const laterToday = new Date();
  laterToday.setHours(23, 59, 0, 0);
  if (laterToday.getTime() > Date.now()) {
    assert.strictEqual(shouldSendReminder(laterToday), false);
  }
});
check('远期时刻不发送', () => {
  assert.strictEqual(
    shouldSendReminder(new Date(Date.now() + 24 * 3600 * 1000)),
    false
  );
});

console.log('== 4. 周期任务 DAILY interval>1（每 3 天）==');
check('从 1/1 起每 3 天：1,4,7,...,28', () => {
  const dates = calculateOccurrenceDates(
    { frequency: 'DAILY', interval: 3, startDate: '2026-01-01' },
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-31T23:59:59Z')
  );
  const strs = dates.map((d) => formatDate(d));
  assert.deepStrictEqual(strs, [
    '2026-01-01', '2026-01-04', '2026-01-07', '2026-01-10',
    '2026-01-13', '2026-01-16', '2026-01-19', '2026-01-22',
    '2026-01-25', '2026-01-28', '2026-01-31',
  ]);
});

console.log('== 5. 周期任务 WEEKLY interval>1（每 2 周的周一/周三）==');
check('从 1/5（周一）起每 2 周，生成 1/5,1/7,1/19,1/21,2/2,2/4,2/16,2/18', () => {
  const dates = calculateOccurrenceDates(
    { frequency: 'WEEKLY', interval: 2, byDay: [1, 3], startDate: '2026-01-05' },
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-02-28T23:59:59Z')
  );
  const strs = dates.map((d) => formatDate(d));
  assert.deepStrictEqual(strs, [
    '2026-01-05', '2026-01-07', '2026-01-19', '2026-01-21',
    '2026-02-02', '2026-02-04', '2026-02-16', '2026-02-18',
  ]);
});

console.log('== 6. 周期任务 MONTHLY（月末 clamp）==');
check('从 1/31 每月一次：2 月 clamp 到 2/28（date-fns 添月语义，之后跟随当前日漂移）', () => {
  const dates = calculateOccurrenceDates(
    { frequency: 'MONTHLY', interval: 1, startDate: '2026-01-31' },
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-12-31T23:59:59Z')
  );
  const strs = dates.map((d) => formatDate(d));
  assert.strictEqual(strs.length, 12);
  assert.strictEqual(strs[0], '2026-01-31');
  assert.strictEqual(strs[1], '2026-02-28');
  // 已知行为：clamp 后 day-of-month 跟随当前值（2/28 -> 3/28），非锁定月末
  assert.strictEqual(strs[2], '2026-03-28');
});

console.log('== 7. cron 路径按用户时区解释（interval=1 DAILY）==');
check('Asia/Shanghai 的每天 0 点 = UTC 前一日 16:00', () => {
  const dates = calculateOccurrenceDates(
    { frequency: 'DAILY', interval: 1, startDate: '2026-11-19' },
    new Date('2026-11-19T00:00:00Z'),
    new Date('2026-11-20T23:00:00Z'),
    'Asia/Shanghai'
  );
  assert.deepStrictEqual(
    dates.map((d) => d.toISOString()),
    ['2026-11-19T16:00:00.000Z', '2026-11-20T16:00:00.000Z']
  );
});
check('America/New_York 的每天 0 点 = UTC 当日 05:00（EST）', () => {
  const dates = calculateOccurrenceDates(
    { frequency: 'WEEKLY', interval: 1, byDay: [4], startDate: '2026-11-19' },
    new Date('2026-11-19T00:00:00Z'),
    new Date('2026-11-27T23:00:00Z'),
    'America/New_York'
  );
  assert.deepStrictEqual(
    dates.map((d) => d.toISOString()),
    ['2026-11-19T05:00:00.000Z', '2026-11-26T05:00:00.000Z']
  );
});

console.log(`\n全部通过：${passed} 项断言`);
