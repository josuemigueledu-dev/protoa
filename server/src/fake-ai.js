// Practice AI: canned replies for every AI task, so the AI screens (Sprechen, "Why? Explain it",
// "Write your own", exam marking) can be opened, played and screenshotted without an API key
// and without cost. Turned on by `npm run dev:fake-ai` (or PROTOA_FAKE_AI=1); never in production.
// The replies say they come from the practice AI, so nobody mistakes them for real feedback.
// PROTOA_FAKE_AI_FAIL=<code> makes every task fail the way the real server does (FAILURES), so each
// screen's error state can be played too.
import { AIError } from './claude.js';

const NOTE = 'Practice AI (no Claude)';

// Sprechen: a short scripted partner. Each gloss covers every German token of its line,
// the way the app checks it (deTokens vs parseGloss), so the lines render with glosses.
export const TALK_SCRIPT = [
  { de: 'Freut mich. Woher kommen Sie?', en: 'Nice to meet you. Where are you from?', gloss: 'Freut mich.=nice to meet you | Woher=where from | kommen=come | Sie?=you (formal)' },
  { de: 'Ah, interessant. Und wo wohnen Sie jetzt?', en: 'Ah, interesting. And where do you live now?', gloss: 'Ah,=ah | interessant.=interesting | Und=and | wo=where | wohnen=live | Sie=you (formal) | jetzt?=now' },
  { de: 'Schön. Was trinken Sie gern?', en: 'Nice. What do you like to drink?', gloss: 'Schön.=nice | Was=what | trinken=drink | Sie=you (formal) | gern?=like to' },
  { de: 'Danke fürs Gespräch. Bis bald.', en: 'Thanks for the chat. See you soon.', gloss: 'Danke=thanks | fürs=for the | Gespräch.=conversation | Bis bald.=see you soon' },
];

const replies = {
  checkFree: () => ({ ok: true, understandable: true, issue: '', hint: '' }),
  correctSentence: ({ sentence }) => ({ corrected: sentence, error: 'No errors.', extend: `Und du? (and you?) · ${NOTE}: it never changes your sentence.` }),
  explainMistake: ({ target }) => ({ explanation: `${NOTE}: the model answer is "${target}". A real explanation needs an API key.` }),
  talkTurn: ({ history }) => {
    const said = history.filter(m => m.who === 'l').length;
    const line = TALK_SCRIPT[Math.min(Math.max(said, 1), TALK_SCRIPT.length) - 1];
    const last = history[history.length - 1];
    // the second reply shows what a correction looks like
    const correction = said === 2 && last.who === 'l'
      ? { ok: false, corrected: last.de, note: `${NOTE}: a sample correction, your line was not checked.` }
      : { ok: true, corrected: '', note: '' };
    return { ...line, correction, done: said >= TALK_SCRIPT.length };
  },
  talkHelp: () => ({ de: 'Einen Kaffee, bitte.', tip: `${NOTE}: always this sample answer.` }),
  gradeExam: ({ items }) => ({ marks: items.map(it => ({ i: it.i, points: it.answer.trim() ? it.max : 0, note: `${NOTE}: full marks for any answer.` })) }),
};

// The errors the real server sends for a failed Claude call (mapError and checkStop in claude.js): same code, status and text.
export const FAILURES = {
  timeout: [504, 'Claude took too long to answer. Try again.'],
  rate_limited: [429, 'Too many requests. Try again in a moment.'],
  refused: [422, 'Claude declined this request.'],
  bad_output: [502, 'The reply did not match the expected shape.'],
  upstream: [502, 'Could not reach Claude.'],
  unavailable: [503, 'The server API key was rejected.'],
};

// The runners createApp takes in place of askJSON / askLongJSON, plus aiOn so health reports AI as on.
export function fakeAI({ delayMs = 0, fail = '' } = {}) {
  if (fail && !Object.hasOwn(FAILURES, fail)) throw new Error(`PROTOA_FAKE_AI_FAIL must be one of: ${Object.keys(FAILURES).join(', ')}.`);
  const wait = () => new Promise(r => setTimeout(r, delayMs));
  const failNow = () => { if (fail) throw new AIError(fail, FAILURES[fail][1], FAILURES[fail][0]); };
  return {
    aiOn: () => true,
    async runJSON({ task, vars }) {
      await wait(); failNow();
      if (!Object.hasOwn(replies, task)) throw new AIError('unsupported', `${NOTE} has no reply for ${task}.`, 501);
      return replies[task](vars);
    },
    // Writing a whole lesson can't be faked usefully: say so instead of returning a broken lesson.
    // Not 'unavailable': that tells the app the whole AI is off, and the other practice replies still work.
    async runLong() {
      await wait(); failNow();
      throw new AIError('unsupported', 'The practice AI cannot write lessons. Set ANTHROPIC_API_KEY for that.', 501);
    },
  };
}
