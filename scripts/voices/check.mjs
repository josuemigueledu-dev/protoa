// Judges a rendered line from what Whisper heard in it (scripts/voices/asr_worker.py). Multi-speaker
// Piper models can loop or babble, so every rendered line must be heard as roughly its own text.

const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
const numberWord = n => n < 20 ? ONES[n] : n < 100 ? (n % 10 ? `${n % 10 === 1 ? 'ein' : ONES[n % 10]}und${TENS[Math.floor(n / 10)]}` : TENS[n / 10]) : String(n);

// Lowercase words only: no punctuation or hyphens, "ß" as "ss", digits spelled out (Whisper writes "10" for "zehn").
export function normalise(s) {
  return String(s).toLowerCase()
    .replace(/\d+/g, d => ` ${numberWord(+d)} `)
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/).filter(Boolean);
}

function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

export const wer = (ref, hyp) => { const r = normalise(ref), h = normalise(hyp); return r.length ? editDistance(r, h) / r.length : +(h.length > 0); };
// 1 - character edit distance over the longer text, ignoring spaces: forgives "Mexiko Stadt" vs "Mexikostadt".
export const charSimilarity = (ref, hyp) => {
  const a = normalise(ref).join(''), b = normalise(hyp).join('');
  return Math.max(a.length, b.length) ? 1 - editDistance(a, b) / Math.max(a.length, b.length) : 1;
};

export const LIMITS = { wer: 0.25, similarity: 0.85, secPerCharMin: 0.03, secPerCharMax: 0.3, slack: 1.2 };

// Whisper cannot judge an isolated word: even the best voice (thorsten-high) was heard right on only 13 of 34
// vocabulary words with `small` and 18 of 34 with `medium` ("er" -> "ja", "Buch" -> "hm"). So a single word is held
// to the length rule only and is reported as unverified; every line of two or more words is held to the transcript.
export const isVerifiable = text => normalise(text).length >= 2;

// A line passes when it is heard as its text (word error rate or character similarity is good enough)
// and its length in seconds is plausible for the number of characters (a loop or cut-off is not).
export function judge({ text, heard, seconds }, limits = LIMITS) {
  const w = wer(text, heard), sim = charSimilarity(text, heard), n = text.length;
  const reasons = [], verified = isVerifiable(text);
  if (verified && w > limits.wer && sim < limits.similarity) reasons.push(`heard "${heard}" (word error ${w.toFixed(2)})`);
  if (seconds < n * limits.secPerCharMin) reasons.push(`too short: ${seconds.toFixed(1)} s for ${n} characters`);
  if (seconds > n * limits.secPerCharMax + limits.slack) reasons.push(`too long: ${seconds.toFixed(1)} s for ${n} characters`);
  return { ok: reasons.length === 0, verified, wer: w, similarity: sim, reasons };
}
