import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalise, wer, charSimilarity, judge, isVerifiable } from '../../scripts/voices/check.mjs';

// The pass/fail rule for rendered voice lines, fed with transcripts (Whisper itself is not run here).
test('normalise: lowercase words, hyphens and punctuation gone, digits spelled out', () => {
  assert.deepEqual(normalise('Mexiko-Stadt, ja!'), ['mexiko', 'stadt', 'ja']);
  assert.deepEqual(normalise('Das ist 10'), ['das', 'ist', 'zehn']);
  assert.deepEqual(normalise('21 und 30'), ['einundzwanzig', 'und', 'dreissig']);
  assert.deepEqual(normalise('Straße'), ['strasse']);
});

test('wer and character similarity', () => {
  assert.equal(wer('Guten Tag', 'Guten Tag!'), 0);
  assert.equal(wer('Guten Tag', 'Guten Abend'), 0.5);
  assert.ok(charSimilarity('Mexiko-Stadt', 'Mexikostadt') > 0.99);
});

test('a line heard as its text passes, small slips pass, babble and loops fail', () => {
  assert.ok(judge({ text: 'Guten Tag', heard: 'Guten Tag!', seconds: 1.0 }).ok);
  assert.ok(judge({ text: 'Ich komme aus Mexiko-Stadt. Und du?', heard: 'Ich komme aus Mexiko Stadt, und du?', seconds: 2.4 }).ok);
  assert.ok(judge({ text: 'Entschuldigung', heard: 'Entschuldigung.', seconds: 1.4 }).ok);
  const loop = judge({ text: 'Was trinkst du?', heard: 'Wie das Wasser, wie dran ist das Wasser, wie tief das Wasser', seconds: 6 });
  assert.equal(loop.ok, false);
  assert.match(loop.reasons[0], /heard/);
  assert.equal(judge({ text: 'Hallo, ich bin Tom.', heard: 'Hallo, ich bin Tom.', seconds: 0.2 }).ok, false); // clipped
  assert.equal(judge({ text: 'Hallo', heard: 'Hallo', seconds: 30 }).ok, false); // runs on
});

test('a single word is not judged by the transcript (Whisper cannot hear isolated words), only by its length', () => {
  assert.equal(isVerifiable('Frau'), false);
  assert.equal(isVerifiable('die Frau'), true);
  const j = judge({ text: 'Frau', heard: 'Hallo.', seconds: 0.8 });
  assert.equal(j.ok, true);
  assert.equal(j.verified, false);
  assert.equal(judge({ text: 'Frau', heard: '', seconds: 12 }).ok, false);
  assert.equal(judge({ text: 'die Frau', heard: 'Tufral', seconds: 1 }).ok, false);
});
