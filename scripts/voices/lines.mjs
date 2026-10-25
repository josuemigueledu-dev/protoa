import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { CAST_TO_SPEAKER } from './cast.mjs';

const JS = new URL('../../apps/deutsch/js/', import.meta.url);

// The built-in lessons, loaded the way the page does (content.js, then js/lessons/NN.js).
export function loadLessons() {
  const ctx = vm.createContext({ console });
  const files = ['content.js', ...readdirSync(new URL('lessons/', JS)).filter(f => /^\d+\.js$/.test(f)).sort().map(f => `lessons/${f}`)];
  for (const f of files) vm.runInContext(readFileSync(new URL(f, JS), 'utf8'), ctx, { filename: f });
  return vm.runInContext('({ LESSONS, GRAMMAR })', ctx);
}

// Same text the page hands to speak(): no [brackets] around the target word.
const bare = s => String(s).replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim();
export const stripArticle = s => s.replace(/^(der|die|das) /, '');
// File name key: changes with the text and with the voice, so a new voice re-renders and an unchanged line never does.
export const textHash = (voice, text) => createHash('sha1').update(JSON.stringify([voice, text])).digest('hex').slice(0, 16);

// Every German line the app can speak, once, with the speaker who says it. Lines with {name}/{city}
// placeholders depend on the learner's profile, so they cannot be rendered ahead (the device voice reads them).
// Returns { lines: [{ text, speaker }], skipped: [text] }. The first speaker to claim a text keeps it,
// because the page looks audio up by text alone.
export function collectLines({ LESSONS, GRAMMAR }) {
  const seen = new Map(), skipped = new Set();
  const add = (text, speaker = 'protoa') => {
    if (!text) return;
    text = bare(text);
    if (!text) return;
    if (/[{}]/.test(text)) { skipped.add(text); return; }
    if (!seen.has(text)) seen.set(text, speaker);
  };
  for (const L of LESSONS) {
    add(L.notice?.de);
    for (const w of L.words || []) { add(w.de); add(stripArticle(w.de)); add(w.ex); }
    for (const [de] of L.sound?.words || []) add(de);
    for (const b of L.build || []) add(b.de);
    let partner = 'weber';
    for (const c of L.conv || []) {
      if (c.l) {
        add(c.de);
        if (c.react) add(c.react.split('=')[0], CAST_TO_SPEAKER[c.rwho] || partner);
      } else {
        partner = CAST_TO_SPEAKER[c.who || 'cast.weber'] || 'protoa';
        add(c.w, partner);
      }
    }
  }
  for (const G of GRAMMAR || []) for (const e of G.examples || []) add(e.de);
  return { lines: [...seen].map(([text, speaker]) => ({ text, speaker })), skipped: [...skipped] };
}
