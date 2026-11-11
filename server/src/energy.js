// Practice energy: the daily allowance on extra practice (owner's model A, Oct 24 2026).
// Pure rules, no storage and no clock of its own: the caller keeps `state` (in S.progress now,
// in the accounts store later) and passes `now`. Nothing uses it until MONETIZATION is on.
// Numbers and the Duolingo comparison: docs/research/market.md section 7 (revised Oct 25 so
// Plus is worth paying for). The owner signs them off before anything goes live.

export const ENERGY = {
  max: 25,           // Duolingo: 25
  regenMinutes: 50,  // +1 every 50 min, empty to full in under 21 h. Duolingo: about +1 an hour, full in about a day
  exerciseCost: 1,   // every answered exercise, right or wrong. Duolingo: 1
  mistakeCost: 0,    // nothing extra for a wrong answer. Duolingo: 0 to 1 extra
  comboEvery: 5,     // 5 right in a row ...
  comboGain: 3,      // ... gives 3 back, every time. Duolingo: a random 1 to 5
};

// What draws energy. Lessons and the daily due review never do: the course is never locked
// and spaced review is how words are kept. Only extra drills from the Practice hub cost energy.
export const COSTS = { lesson: false, dueReview: false, mistakeReview: false, drill: true };

// null means unlimited.
export const PLAN_ENERGY = { free: ENERGY, plus: null };

export const energyFor = plan => (Object.hasOwn(PLAN_ENERGY, plan) ? PLAN_ENERGY[plan] : PLAN_ENERGY.free);
export const costsEnergy = activity => Object.hasOwn(COSTS, activity) && COSTS[activity] === true;

// state: { value, at, streak } or nothing (a new learner is full). Regeneration is applied
// lazily: whole intervals since `at` are added, and the part of an interval already waited
// is kept, so checking the value never loses time.
export function energyNow(state, now, cfg = ENERGY) {
  const step = cfg.regenMinutes * 60_000;
  if (!state || !Number.isFinite(state.value)) return { value: cfg.max, at: now, streak: 0 };
  const value = Math.max(0, Math.min(cfg.max, state.value));
  if (value >= cfg.max) return { value: cfg.max, at: now, streak: state.streak || 0 };
  const at = Math.min(state.at, now), k = Math.floor((now - at) / step);
  const v = Math.min(cfg.max, value + k);
  return { value: v, at: v >= cfg.max ? now : at + k * step, streak: state.streak || 0 };
}

// Milliseconds until the next point comes back (0 when full).
export function msToNext(state, now, cfg = ENERGY) {
  const s = energyNow(state, now, cfg);
  return s.value >= cfg.max ? 0 : s.at + cfg.regenMinutes * 60_000 - now;
}

// A drill can start with at least one point. Once started, it always finishes (see answer),
// so the learner never hits a wall in the middle of a session.
export function canStart(state, now, cfg = ENERGY) {
  const s = energyNow(state, now, cfg);
  return s.value >= cfg.exerciseCost ? { ok: true } : { ok: false, waitMs: msToNext(state, now, cfg) };
}

// One answered exercise in a drill. Never blocks and never goes below 0.
export function answer(state, now, correct, cfg = ENERGY) {
  const s = energyNow(state, now, cfg), wasFull = s.value >= cfg.max;
  const streak = correct ? s.streak + 1 : 0;
  let value = Math.max(0, s.value - cfg.exerciseCost - (correct ? 0 : cfg.mistakeCost));
  if (correct && streak % cfg.comboEvery === 0) value = Math.min(cfg.max, value + cfg.comboGain);
  // regeneration starts counting from the first point spent, not from when the bar was last full
  return { value, at: wasFull ? now : s.at, streak };
}
