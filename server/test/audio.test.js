import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { lessonFiles } from '../support/lessons.js';

// warmAudio (core.js): the audio engine starts in a quiet moment after the learner's first touch, not inside the
// first answer's tap (#146). A fake AudioContext counts how often the engine is started.
const js = f => readFileSync(new URL(`../../apps/deutsch/js/${f}`, import.meta.url), 'utf8');

function page() {
  const store = new Map(), listeners = {}, idle = [];
  const node = () => ({ connect() { }, disconnect() { }, start() { }, stop() { }, type: '', frequency: { value: 0, setValueAtTime() { }, linearRampToValueAtTime() { } }, gain: { setValueAtTime() { }, exponentialRampToValueAtTime() { } } });
  const ctx = vm.createContext({
    console, matchMedia: () => ({ matches: false }), setTimeout: () => 0, clearTimeout() { },
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), get length() { return store.size; }, key: i => [...store.keys()][i] },
    addEventListener: (t, f) => (listeners[t] ||= new Set()).add(f),
    removeEventListener: (t, f) => listeners[t]?.delete(f),
    requestIdleCallback: f => idle.push(f),
    started: 0,
  });
  ctx.window = ctx;
  ctx.AudioContext = class { constructor() { ctx.started++; this.state = 'running'; this.currentTime = 0; this.destination = {}; } createGain() { return node(); } createOscillator() { return node(); } resume() { } };
  for (const f of ['content.js', ...lessonFiles(), 'core.js']) vm.runInContext(js(f), ctx, { filename: f });
  const exec = code => vm.runInContext(code, ctx);
  exec('S.settings = DEF_SETTINGS()');
  return {
    ctx, exec,
    fire: t => [...(listeners[t] || [])].forEach(f => f({})),
    listening: t => listeners[t]?.size || 0,
    // run the queued idle callbacks with this much idle time left (ms), as the browser would
    idle: (left, didTimeout = false) => idle.splice(0).forEach(f => f({ timeRemaining: () => left, didTimeout })),
  };
}

test('warmAudio starts the audio engine at idle after the first touch, then the first sound reuses it', () => {
  const p = page();
  p.exec('warmAudio()');
  p.idle(50);
  assert.equal(p.ctx.started, 0, 'nothing before the learner touches the page');
  p.fire('pointerup');
  assert.equal(p.ctx.started, 0, 'not inside the touch itself');
  assert.equal(p.listening('pointerup') + p.listening('keydown'), 0, 'listens for the first touch only');
  p.idle(10);
  assert.equal(p.ctx.started, 0, 'a short idle moment (mid-animation) waits for a longer one');
  p.idle(45);
  assert.equal(p.ctx.started, 1);
  p.exec(`uiSound('ok'); uiSound('bad')`);
  assert.equal(p.ctx.started, 1, 'the answers play on the warmed engine');
});

test('warmAudio: a key press counts as the first touch, and a busy page still warms once the idle wait times out', () => {
  const p = page();
  p.exec('warmAudio()');
  p.fire('keydown');
  p.idle(5, true);
  assert.equal(p.ctx.started, 1);
});

test('warmAudio leaves audio off when sounds are off and there are no recordings', () => {
  const p = page();
  p.exec('S.settings.uiSounds = false; warmAudio()');
  p.fire('pointerup'); p.idle(50);
  assert.equal(p.ctx.started, 0);
  p.exec(`VOX_URL['Hallo.'] = 'abc.opus'; warmAudio()`);
  p.fire('pointerup'); p.idle(50);
  assert.equal(p.ctx.started, 1, 'recorded lines play through the same engine');
});

test('warmAudio does not start a second engine when a sound already started one', () => {
  const p = page();
  p.exec('warmAudio()');
  p.fire('pointerup');
  p.exec(`uiSound('ok')`);
  p.idle(50);
  assert.equal(p.ctx.started, 1);
});
