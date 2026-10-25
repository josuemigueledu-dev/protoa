import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLessons, collectLines, textHash, stripArticle } from '../../scripts/voices/lines.mjs';
import { SPEAKERS, MODELS, CAST_TO_SPEAKER } from '../../scripts/voices/cast.mjs';
import { piperProvider } from '../../scripts/voices/providers/piper.mjs';

// The voice pipeline's inputs: which lines get pre-rendered audio and who says them. No audio is
// rendered here (that needs Piper); this keeps lesson edits from silently breaking the script.
const { lines, skipped } = collectLines(loadLessons());

test('every line has a speaker with a known model, and each text appears once', () => {
  assert.ok(lines.length > 200);
  assert.equal(new Set(lines.map(l => l.text)).size, lines.length);
  for (const l of lines) {
    assert.ok(SPEAKERS[l.speaker], `no voice for ${l.speaker} (${l.text})`);
    assert.ok(MODELS[SPEAKERS[l.speaker].model], `unknown model for ${l.speaker}`);
  }
  for (const s of Object.values(CAST_TO_SPEAKER)) assert.ok(SPEAKERS[s]);
});

test('lines are spoken text: no brackets, no placeholders; placeholder lines are reported, not rendered', () => {
  for (const l of lines) assert.doesNotMatch(l.text, /[\[\]{}]/, l.text);
  assert.ok(skipped.length > 0 && skipped.every(t => /[{}]/.test(t)));
});

test('partners speak with their own voice, headwords and examples with Protoa', () => {
  const by = Object.groupBy(lines, l => l.speaker);
  assert.ok(by.weber?.length && by.ana?.length && by.lena?.length);
  assert.ok(lines.find(l => l.text === 'Hallo').speaker === 'protoa');
  assert.ok(lines.find(l => l.text === 'Guten Morgen!').speaker === 'weber');
});

test('headwords are also collected without their article, as the word card speaks them', () => {
  assert.equal(stripArticle('die Frau'), 'Frau');
  const withArticle = lines.find(l => /^(der|die|das) /.test(l.text));
  if (withArticle) assert.ok(lines.some(l => l.text === stripArticle(withArticle.text)));
});

test('the file key changes with the voice and the text, and is stable otherwise', () => {
  const p = piperProvider({ modelsDir: '/nonexistent' });
  const k = p.voiceKey(SPEAKERS.weber);
  assert.equal(textHash(k, 'Hallo'), textHash(k, 'Hallo'));
  assert.notEqual(textHash(k, 'Hallo'), textHash(k, 'Hallo!'));
  assert.notEqual(textHash(k, 'Hallo'), textHash(p.voiceKey(SPEAKERS.ana), 'Hallo'));
  assert.notEqual(textHash(k, 'Hallo'), textHash(p.voiceKey({ ...SPEAKERS.weber, lengthScale: 1.3 }), 'Hallo'));
  assert.deepEqual(p.missingModels(['de_DE-thorsten-high']), ['de_DE-thorsten-high']);
});
