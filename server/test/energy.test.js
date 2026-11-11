import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENERGY, COSTS, energyFor, costsEnergy, energyNow, msToNext, canStart, answer } from '../src/energy.js';

const MIN = 60_000, T0 = 1_000_000_000;
const run = (state, now, results) => results.reduce((s, ok) => answer(s, now, ok), state);

test('a new learner starts full', () => {
  assert.deepEqual(energyNow(undefined, T0), { value: ENERGY.max, at: T0, streak: 0 });
  assert.equal(msToNext(undefined, T0), 0);
  assert.deepEqual(canStart(undefined, T0), { ok: true });
});

test('every answered exercise costs one point and a mistake costs nothing extra', () => {
  const right = answer(undefined, T0, true), wrong = answer(undefined, T0, false);
  assert.equal(right.value, ENERGY.max - 1);
  assert.equal(wrong.value, ENERGY.max - 1);
  assert.equal(wrong.streak, 0);
});

test('five right in a row gives comboGain back, every time', () => {
  const net = ENERGY.comboEvery - ENERGY.comboGain;
  const s = run(undefined, T0, [true, true, true, true, true]);
  assert.equal(s.value, ENERGY.max - net);
  assert.equal(s.streak, 5);
  const broken = run(undefined, T0, [true, true, true, true, false, true]);
  assert.equal(broken.value, ENERGY.max - 6);
  assert.equal(run(s, T0, [true, true, true, true, true]).value, ENERGY.max - 2 * net);
});

test('points come back one every regenMinutes, keeping the part of an interval already waited', () => {
  const R = ENERGY.regenMinutes, left = ENERGY.max - 10;
  const s = run(undefined, T0, Array(10).fill(false));
  assert.equal(energyNow(s, T0 + (R - 1) * MIN).value, left);
  assert.equal(msToNext(s, T0 + (R - 1) * MIN), MIN);
  const later = energyNow(s, T0 + (2 * R + 20) * MIN); // 2 intervals and 20 min
  assert.equal(later.value, left + 2);
  assert.equal(msToNext(later, T0 + (2 * R + 20) * MIN), (R - 20) * MIN);
  assert.equal(energyNow(later, T0 + 3 * R * MIN).value, left + 3);
});

test('regeneration stops at the maximum and an empty bar is full again within a day', () => {
  const empty = run(undefined, T0, Array(ENERGY.max).fill(false)), full = ENERGY.max * ENERGY.regenMinutes * MIN;
  assert.equal(empty.value, 0);
  assert.ok(full < 24 * 60 * MIN);
  assert.equal(energyNow(empty, T0 + full - 1).value, ENERGY.max - 1);
  assert.equal(energyNow(empty, T0 + full).value, ENERGY.max);
  assert.equal(energyNow(empty, T0 + 1000 * 60 * MIN).value, ENERGY.max);
});

test('a drill needs one point to start but always finishes, never below zero', () => {
  const empty = run(undefined, T0, Array(ENERGY.max).fill(false));
  assert.deepEqual(canStart(empty, T0), { ok: false, waitMs: ENERGY.regenMinutes * MIN });
  const after = answer(empty, T0, false);
  assert.equal(after.value, 0);
  assert.deepEqual(canStart(empty, T0 + ENERGY.regenMinutes * MIN), { ok: true });
});

test('bad stored state is repaired, not trusted', () => {
  assert.equal(energyNow({ value: 999, at: T0 }, T0).value, ENERGY.max);
  assert.equal(energyNow({ value: -5, at: T0 }, T0).value, 0);
  assert.equal(energyNow({ value: 3, at: T0 + 60 * MIN }, T0).value, 3); // a clock moved back gives nothing
  assert.equal(energyNow({ value: 'x' }, T0).value, ENERGY.max);
});

test('lessons and the daily review never cost energy; Plus has no limit', () => {
  assert.equal(costsEnergy('lesson'), false);
  assert.equal(costsEnergy('dueReview'), false);
  assert.equal(costsEnergy('mistakeReview'), false);
  assert.equal(costsEnergy('drill'), true);
  assert.equal(costsEnergy('toString'), false);
  assert.equal(Object.keys(COSTS).length, 4);
  assert.equal(energyFor('plus'), null);
  assert.equal(energyFor('free'), ENERGY);
  assert.equal(energyFor('nonsense'), ENERGY);
});

test('every limit is at least as generous as Duolingo, and mistakes cost less (market.md section 7)', () => {
  const DUOLINGO = { max: 25, regenMinutes: 60, mistakeCost: 1, comboGainAverage: 3 };
  assert.ok(ENERGY.max >= DUOLINGO.max);
  assert.ok(ENERGY.comboGain >= DUOLINGO.comboGainAverage);
  assert.ok(ENERGY.regenMinutes < DUOLINGO.regenMinutes);
  assert.ok(ENERGY.mistakeCost < DUOLINGO.mistakeCost);
  assert.ok(ENERGY.exerciseCost <= 1);
});
