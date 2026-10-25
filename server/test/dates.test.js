import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// core.js's calendar helpers in the learner's own time zone. Each zone runs in
// a child process, since a process reads TZ once.
const FILES = ['content.js', 'core.js'].map(f => fileURLToPath(new URL(`../../apps/deutsch/js/${f}`, import.meta.url)));
const probe = `
const vm = require('node:vm'), fs = require('node:fs');
const ctx = vm.createContext({ console, matchMedia: () => ({ matches: false }), localStorage: { getItem: () => null, setItem() {}, length: 0, key: () => null } });
ctx.window = ctx;
for (const f of process.argv.slice(1)) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
const r = c => vm.runInContext(c, ctx);
console.log(JSON.stringify({
  same: r("addDays('2026-10-25', 0)"), next: r("addDays('2026-10-25', 1)"), prev: r("addDays('2026-10-25', -1)"),
  week: r("addDays('2026-11-01', 7)"), year: r("addDays('2026-12-31', 1)"), leap: r("addDays('2028-02-28', 1)"),
  between: r("daysBetween('2026-10-20', '2026-11-03')"),
  today: r('todayStr()'), tomorrow: r('addDays(todayStr(), 1)'), good: r('schedule(newCard(), 2)[0]'),
}));`;
const inZone = TZ => JSON.parse(execFileSync(process.execPath, ['-e', probe, ...FILES], { env: { ...process.env, TZ }, encoding: 'utf8' }));

// UTC+14, UTC+13 in summer, UTC−11, and the two zones the course is used in most
for (const tz of ['Pacific/Kiritimati', 'Pacific/Auckland', 'Pacific/Pago_Pago', 'America/New_York', 'Europe/Berlin', 'UTC']) {
  test(`dates: calendar days are right in ${tz}`, () => {
    const d = inZone(tz);
    assert.deepEqual([d.same, d.next, d.prev], ['2026-10-25', '2026-10-26', '2026-10-24']);
    assert.equal(d.week, '2026-11-08', 'across a clock change');
    assert.equal(d.year, '2027-01-01');
    assert.equal(d.leap, '2028-02-29');
    assert.equal(d.between, 14);
    assert.notEqual(d.tomorrow, d.today);
    assert.equal(d.good, d.tomorrow, 'a new card answered "good" comes back tomorrow, not today');
  });
}
