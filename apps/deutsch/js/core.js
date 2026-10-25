/* ===================== CORE: utils, storage, SRS, checking, audio ===================== */
const LANG = 'de';

/* Lessons arrive one file at a time (js/lessons/NN.js); put them in order once, so load order can't matter.
   A written grammar unit replaces the stub with the same id; units sort by lesson, stubs last. */
LESSONS.sort((a, b) => a.n - b.n);
GRAMMAR.splice(0, GRAMMAR.length, ...GRAMMAR.filter(g => !g.stub || !GRAMMAR.some(o => !o.stub && o.id === g.id))
  .sort((a, b) => !!a.stub - !!b.stub || a.lesson - b.lesson));
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el[k] = v;
    else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => Math.random().toString(36).slice(2, 9);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- profile placeholders ---------- */
function fill(s) {
  const p = S.profile || {};
  return String(s).replace(/\{name\}/g, p.name || DEFAULTS.name).replace(/\{city\}/g, p.city || DEFAULTS.city).replace(/\{field\}/g, p.field || DEFAULTS.field);
}

/* ---------- German text normalisation ---------- */
const UML = { ae: 'ä', oe: 'ö', ue: 'ü' };
function stripPunct(s) { return s.replace(/[.,!?;:"'„“”‚‘’()]/g, ''); }
function deTokens(s) { return stripPunct(fill(s)).trim().split(/\s+/).filter(Boolean); }
// loose form: lowercase, umlauts folded (ä→ae, ß→ss) so ae/oe/ue/ss answers match
function fold(w) { return w.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); }
function sameWord(a, b) { return fold(a) === fold(b); }
function exactWord(a, b) { return a.toLowerCase() === b.toLowerCase(); }
function editDist(a, b) {
  a = fold(a); b = fold(b); const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
// typing shortcuts in German inputs: a: → ä, a" → ä, o: → ö, u: → ü, A: → Ä …
function applyShortcuts(v) { return v.replace(/([aouAOU])[:"]/g, (m, c) => ({ a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' }[c])); }

/* ---------- Gloss parsing / coverage ---------- */
function parseGloss(g) { return fill(g).split('|').map(p => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }); }
/* Art ids in a generated lesson must exist in the manifest (ART_MANIFEST, art-bundle.js). An unknown plate is swapped
   for the plate with the most tags in common with the lesson's text; an unknown word picture or twist event is
   dropped. Each swap is logged. Returns problems that cannot be repaired (an unknown cast member). */
function fixLessonArt(L, manifest, log = console.warn) {
  const ids = kind => manifest.filter(a => a.kind === kind);
  const has = (kind, id) => ids(kind).some(a => a.id === id);
  const bad = [], sc = L.scene || {};
  const plate = sc.plate || (sc.id ? 'plate.' + sc.id : '');
  if (!has('plate', plate)) {
    const text = [L.title, L.theme, sc.place, sc.cap].join(' ').toLowerCase();
    const score = a => (a.tags || []).filter(t => text.includes(t)).length;
    const best = ids('plate').reduce((m, a) => score(a) > score(m) ? a : m, ids('plate').find(a => a.id === 'plate.classroom') || ids('plate')[0]);
    if (best) { log('lesson art: unknown plate "' + plate + '" replaced by ' + best.id); sc.plate = best.id; } else bad.push('no plates available');
  } else sc.plate = plate;
  (sc.cast || []).forEach(c => { if (!has('cast', c.id)) bad.push('unknown cast ' + c.id); });
  (L.words || []).forEach(w => { if (w.pic && !has('word', w.pic.startsWith('word.') ? w.pic : 'word.' + w.pic)) { log('lesson art: unknown picture "' + w.pic + '" dropped from ' + w.de); delete w.pic; } });
  if (L.twist && !has('event', L.twist.event)) { log('lesson art: unknown event "' + L.twist.event + '" dropped'); delete L.twist; }
  return bad;
}
function checkGlosses(lesson) {
  const bad = [];
  const chk = (de, g, where) => {
    if (!g) { bad.push(where + ': no gloss'); return; }
    const a = deTokens(de).map(fold).join(' '), b = parseGloss(g).flatMap(([d]) => deTokens(d)).map(fold).join(' ');
    if (a !== b) bad.push(where + ': "' + a + '" vs gloss "' + b + '"');
  };
  chk(lesson.notice.de, lesson.notice.g, 'notice');
  lesson.words.forEach(w => chk(w.ex.replace(/[\[\]]/g, ''), w.exG, 'word ' + w.de));
  lesson.build.forEach((b, i) => chk(b.de, b.g, 'build ' + i));
  lesson.conv.forEach((t, i) => chk(t.w || t.de, t.g, 'conv ' + i));
  return bad;
}

/* ---------- English answer checking (§9) ---------- */
const EN_LEAD = /^(to|the|a|an|i|you|he|she|it|we|they|is|are|am|be)\s+/i;
function enStem(w) {
  w = w.toLowerCase();
  const irregular = { went: 'go', goes: 'go', going: 'go', gone: 'go', came: 'come', comes: 'come', coming: 'come', was: 'be', were: 'be', is: 'be', are: 'be', am: 'be', been: 'be', being: 'be', has: 'have', had: 'have', having: 'have', children: 'child', cities: 'city', people: 'person', mice: 'mouse', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth' };
  if (irregular[w]) return irregular[w];
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) { const b = w.slice(0, -3); return b.endsWith('e') ? b : (/(.)\1$/.test(b) ? b.slice(0, -1) : b); }
  if (w.endsWith('ed') && w.length > 4) { const b = w.slice(0, -2); return /(.)\1$/.test(b) ? b.slice(0, -1) : b; }
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}
// all plausible stems of a word (so "houses" → house, and "boxes" → box)
function enStems(w) { const out = new Set([w.toLowerCase(), enStem(w)]); const l = w.toLowerCase(); if (l.endsWith('es') && l.length > 4) out.add(l.slice(0, -2)); if (l.endsWith('s') && l.length > 3) out.add(l.slice(0, -1)); return [...out]; }
const stemEq = (a, b) => { const A = enStems(a); return enStems(b).some(x => A.includes(x)); };
function enNorm(s) { return s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function enKey(s) { s = enNorm(s); let prev; while (prev !== s) { prev = s; s = s.replace(EN_LEAD, ''); } return s; }
// returns {ok, exact, note}
function checkEnglish(answer, meanings) {
  const a = enKey(answer); if (!a) return { ok: false };
  for (const m of meanings) {
    const k = enKey(m);
    if (a === k || enNorm(answer) === enNorm(m)) return { ok: true, exact: true };
  }
  for (const m of meanings) {
    const k = enKey(m);
    const ka = a.split(' '), km = k.split(' ');
    if (ka.length === km.length && ka.every((w, i) => stemEq(w, km[i]))) return { ok: true, exact: false, note: `Right meaning, dictionary form is "${m}".` };
    if (ka.length === km.length && ka.every((w, i) => stemEq(w, km[i]) || (w.length >= 5 && km[i].length >= 5 && editDist(w, km[i]) <= 1))) return { ok: true, exact: false, note: `Right (spelling: "${m}").` };
  }
  // single-word answer that is one of the words of a multi-word meaning? no — keep strict.
  return { ok: false };
}

/* ---------- SRS (SM-2 style, cap 45 days) ---------- */
// card: [due, ivl, easeX100, reps, lapses]
function newCard(due) { return [due || todayStr(), 0, 250, 0, 0]; }
function schedule(card, grade) { // grade 0 again, 1 hard, 2 good, 3 easy
  let [due, ivl, ease, reps, laps] = card;
  const t = todayStr();
  if (grade === 0) { laps++; reps = 0; ivl = 0; ease = Math.max(130, ease - 20); due = t; }
  else {
    if (reps === 0) ivl = grade === 1 ? 1 : grade === 2 ? 1 : 3;
    else if (reps === 1) ivl = grade === 1 ? 2 : grade === 2 ? 4 : 6;
    else ivl = Math.round(ivl * (grade === 1 ? 1.2 : grade === 2 ? ease / 100 : ease / 100 * 1.4));
    if (grade === 1) ease = Math.max(130, ease - 15); if (grade === 3) ease += 15;
    ivl = Math.min(45, Math.max(1, ivl)); reps++; due = addDays(t, ivl);
  }
  return [due, ivl, ease, reps, laps];
}
const strengthOf = c => !c ? 0 : Math.min(1, c[1] / 45);

/* ---------- Storage (localStorage for now; server sync comes with accounts) ---------- */
const S = { settings: null, profile: null, progress: null, cards: {}, lessonsGen: {}, ai: null, ready: false };
const DEF_SETTINGS = () => ({ level: 'B1', target: 2400, fixed: 'perDay', perDay: 20, targetDate: '', minutes: 20, autoWord: true, uiSounds: true, hideGloss: false, theme: 'system', difficulty: 'auto', voiceName: '', voiceDepth: .5, voiceRate: .92, onboarded: false, updatedAt: 0 });
const DEF_PROGRESS = () => ({ lessonsDone: [], lessonState: null, recent: [], days: {}, sounds: false, updatedAt: 0 });
const DEF_PROFILE = () => ({ name: '', city: '', field: '', interests: '', why: '', updatedAt: 0 });
const LS = (k, v) => { try { if (v === undefined) { const s = localStorage.getItem('weg:' + LANG + ':' + k); return s ? JSON.parse(s) : null; } localStorage.setItem('weg:' + LANG + ':' + k, JSON.stringify(v)); } catch (e) { return null; } };
const pending = {}; const timers = {}; const pendingSaves = new Set();
function flushPendingSaves() { const list = [...pendingSaves]; pendingSaves.clear(); list.forEach(j => { const [k, sh] = JSON.parse(j); save(k, sh || undefined); }); }
function save(key, shard) {
  const name = shard ? 'cards:' + shard : key;
  const val = shard ? S.cards[shard] : S[key];
  if (!val) return;
  val.updatedAt = Date.now();
  LS(name, val);
  if (!S.ready) { pendingSaves.add(JSON.stringify([key, shard || null])); return; } // flushed once startup has finished
}
// every course goes to at least B1 (2,400 words); A1 and A2 are milestones, not goals
function enforceLevelFloor() { const s = S.settings; if (!['B1', 'B2'].includes(s.level)) s.level = 'B1'; s.target = Math.max(s.level === 'B2' ? 4000 : 2400, +s.target || 0); }
function loadLocal() {
  S.settings = Object.assign(DEF_SETTINGS(), LS('settings') || {}); if (!S.settings.themeChosen) S.settings.theme = 'system'; enforceLevelFloor();
  S.profile = Object.assign(DEF_PROFILE(), LS('profile') || {});
  S.progress = Object.assign(DEF_PROGRESS(), LS('progress') || {});
  S.cards = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); const m = k.match(new RegExp('^weg:' + LANG + ':cards:(.+)$')); if (m) S.cards[m[1]] = JSON.parse(localStorage.getItem(k)); } } catch (e) { }
  S.lessonsGen = LS('lessonsGen') || {};
}
// progress from two devices: keep the union of what was achieved, the newer copy for everything else
function mergeProgress(a, b) {
  const [newer, older] = (a.updatedAt || 0) >= (b.updatedAt || 0) ? [a, b] : [b, a];
  const out = Object.assign(DEF_PROGRESS(), JSON.parse(JSON.stringify(newer)));
  const uni = k => [...new Set([...(a[k] || []), ...(b[k] || [])])].sort((x, y) => (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))));
  out.lessonsDone = uni('lessonsDone'); out.v1Lessons = uni('v1Lessons'); out.reviewStops = uni('reviewStops');
  out.sounds = !!(a.sounds || b.sounds);
  out.days = Object.assign({}, older.days || {}); for (const [d, v] of Object.entries(newer.days || {})) { const o = out.days[d] || {}; out.days[d] = { new: Math.max(o.new || 0, v.new || 0), reviews: Math.max(o.reviews || 0, v.reviews || 0), secs: Math.max(o.secs || 0, v.secs || 0) }; }
  out.stampsSeen = uni('stampsSeen'); out.levelsPassed = uni('levelsPassed');
  const ex = new Map(); [...(a.exams || []), ...(b.exams || [])].forEach(e => ex.set(e.code + e.date + e.score, e)); out.exams = [...ex.values()];
  out.examCooldown = Object.assign({}, b.examCooldown || {}, a.examCooldown || {}); for (const k of Object.keys(b.examCooldown || {})) out.examCooldown[k] = Math.max((a.examCooldown || {})[k] || 0, b.examCooldown[k]); out.talkCount = Math.max(a.talkCount || 0, b.talkCount || 0);
  return out;
}
// card shards: per card, keep the one that has seen more reviews (then the later due date)
function mergeShard(local, remote) {
  if (!local) return remote; if (!remote) return local;
  const out = { w: Object.assign({}, remote.w || {}), updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0) };
  for (const [id, c] of Object.entries(local.w || {})) { const r = out.w[id]; if (!r || (c.r && r.r && (c.r[3] > r.r[3] || (c.r[3] === r.r[3] && c.r[0] > r.r[0])))) out.w[id] = c; else if (c.learned) r.learned = true; }
  return out;
}
// mergeProgress / mergeShard above are kept for server sync: when accounts exist, the server copy is merged here.
async function loadRemote() {
  S.ai = await AI.connect();
}

/* ---------- Word bank helpers ---------- */
function allLessons() { return LESSONS.concat(Object.values(S.lessonsGen || {}).filter(l => l && l.n).sort((a, b) => a.n - b.n)); }
function lessonById(n) { return allLessons().find(l => l.n === n); }
function wordId(w) { return w.de; }
function shardFor(lessonN) { return 'l' + lessonN; }
function cardOf(id) { for (const sh of Object.values(S.cards)) if (sh.w && sh.w[id]) return sh.w[id]; return null; }
function cardShard(id) { for (const [k, sh] of Object.entries(S.cards)) if (sh.w && sh.w[id]) return k; return null; }
function ensureShard(k) { if (!S.cards[k]) S.cards[k] = { w: {}, updatedAt: 0 }; return S.cards[k]; }
function wordDef(id) { for (const L of allLessons()) for (const w of L.words) if (w.de === id) return Object.assign({ lesson: L.n }, w); const v = (typeof V1_WORDS !== 'undefined') && V1_WORDS.find(w => w.de === id); if (v) return Object.assign({ lesson: 0 }, v); const c = cardOf(id); if (c && c.def) return Object.assign({ lesson: c.def.lesson || 0 }, c.def, { de: id }); return null; }
function learnedCount() { let n = 0; for (const sh of Object.values(S.cards)) for (const c of Object.values(sh.w || {})) if (c.learned) n++; return n; }
function isLearned(id) { const c = cardOf(id); return !!(c && c.learned); }
function markLearned(w, lessonN) {
  const id = wordId(w); let sh = cardShard(id);
  if (!sh) { sh = shardFor(lessonN); ensureShard(sh); }
  const shd = S.cards[sh];
  if (!shd.w[id]) shd.w[id] = { r: newCard(todayStr()), p: null, learned: false, hist: [], lesson: lessonN };
  if (!shd.w[id].learned) { shd.w[id].learned = true; shd.w[id].since = todayStr(); dayLog('new', 1); }
  save(null, sh);
}
function dayLog(k, n) { const t = todayStr(); S.progress.days[t] = S.progress.days[t] || { new: 0, reviews: 0 }; S.progress.days[t][k] = (S.progress.days[t][k] || 0) + n; save('progress'); }
function addSentenceCard(turn, lessonN, opts = {}) {
  const sh = ensureShard('sent'); const id = 's:' + fill(turn.de); const due = opts.due || todayStr();
  const sent = { de: fill(turn.de), en: fill(turn.en), g: fill(turn.g), gaps: turn.gaps || [], alts: (turn.alts || []).map(fill), prompt: opts.prompt || null };
  if (!sh.w[id]) sh.w[id] = { r: newCard(due), p: null, learned: true, hist: [], lesson: lessonN, sent };
  else { sh.w[id].sent = sent; if (due < sh.w[id].r[0]) sh.w[id].r[0] = due; }
  save(null, 'sent');
}

/* ---------- Goal / pace (§3) ---------- */
function goalInfo() {
  const s = S.settings, learned = learnedCount(), remaining = Math.max(0, s.target - learned), t = todayStr();
  let perDay = s.perDay, date = s.targetDate;
  if (s.fixed === 'date' && date) { const d = Math.max(1, daysBetween(t, date)); perDay = Math.ceil(remaining / d); }
  else if (perDay > 0) date = addDays(t, Math.ceil(remaining / perDay));
  const today = (S.progress.days[t] || {}).new || 0;
  return { learned, remaining, perDay: perDay || 0, date, today, pct: Math.min(100, Math.round(100 * learned / Math.max(1, s.target))) };
}

/* ---------- VoiceLight: the teacher's core brightens with the cadence and loudness of the voice ----------
   Recorded audio (VOX): a real RMS level from an AnalyserNode.
   Browser speech (speechSynthesis gives no audio stream): a syllable timeline built from the text,
   stressed first syllables, louder nouns, pauses at punctuation, re-synced on every word boundary the voice reports. */
const VoiceLight = {
  shown: 0, pulses: [], raf: 0, an: null, buf: null, active: false,
  set(v) { if (typeof TEACHER !== 'undefined') TEACHER.style.setProperty('--lvl', v.toFixed(3)); },
  kick() { if (!this.raf) { if (!this.active && this.shown <= .004) this.last = 0; this.raf = requestAnimationFrame(() => this.loop()); } },
  loop() {
    this.raf = 0; const now = performance.now(); let target = 0;
    if (this.an) { this.an.getFloatTimeDomainData(this.buf); let s = 0; for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i]; target = Math.min(1, Math.sqrt(s / this.buf.length) * 4.5); }
    else {
      for (const p of this.pulses) { const dt = now - p.t; if (dt < 0) continue; const a = dt < 28 ? p.a * dt / 28 : p.a * Math.exp(-(dt - 28) / p.tau); if (a > target) target = a; }
      this.pulses = this.pulses.filter(p => now - p.t < p.tau * 6);
      if (target > .02) target = Math.min(1, target * (.94 + Math.random() * .12));
    }
    const dt = Math.min(100, now - (this.last || now)); this.last = now;
    this.shown += (target - this.shown) * (1 - Math.exp(-dt / (target > this.shown ? 22 : 60)));
    this.set(this.shown);
    if (this.active || this.shown > .004) this.kick(); else this.set(0);
  },
  syllables(w) { const m = w.toLowerCase().match(/(?:ie|ei|ai|au|eu|äu|aa|ee|oo|[aeiouyäöü])+/g); return Math.max(1, m ? m.length : 1); },
  plan(text, rate) {
    const syl = 215 / rate, out = [], words = []; let t = 0;
    const toks = text.match(/[A-Za-zÄÖÜäöüß0-9'-]+|[.,!?;:…]/g) || [];
    toks.forEach((tk, i) => {
      if (/^[.,!?;:…]$/.test(tk)) { t += /[,;:]/.test(tk) ? 170 / rate : 320 / rate; return; }
      const n = this.syllables(tk), noun = i > 0 && /^[A-ZÄÖÜ]/.test(tk), last = !toks.slice(i + 1).some(x => /[A-Za-zÄÖÜäöüß0-9]/.test(x));
      words.push(t);
      for (let s = 0; s < n; s++) { const stress = s === 0 ? 1 : .6; out.push({ dt: t, a: Math.min(1, (.48 + .4 * stress + (noun ? .12 : 0)) * (last ? .82 : 1) * (.88 + Math.random() * .24)), tau: syl * .32 }); t += syl * (s === 0 ? 1.06 : .94); }
      t += 40 / rate;
    });
    return { pulses: out, words };
  },
  speech(text, rate, u) {
    this.stop(); this.active = true; const pl = this.plan(text, rate); let started = false;
    const begin = from => { const base = performance.now() - from; this.pulses = pl.pulses.filter(p => p.dt >= from - 1).map(p => ({ t: base + p.dt, a: p.a, tau: p.tau })); this.kick(); };
    u.addEventListener('start', () => { started = true; begin(0); });
    u.addEventListener('boundary', e => { if (e.name && e.name !== 'word') return; const before = text.slice(0, e.charIndex).match(/[A-Za-zÄÖÜäöüß0-9'-]+/g); const n = before ? before.length : 0; if (pl.words[n] != null) begin(pl.words[n]); });
    setTimeout(() => { if (!started && this.active) begin(0); }, 380);
  },
  audio(src, c) { this.stop(); this.active = true; const an = c.createAnalyser(); an.fftSize = 512; src.connect(an); an.connect(c.destination); this.an = an; this.buf = new Float32Array(an.fftSize); this.kick(); },
  end() { this.active = false; this.an = null; this.pulses = []; this.kick(); },
  stop() { this.active = false; this.an = null; this.pulses = []; },
};

/* ---------- Audio (§11): VOX sprite index + speechSynthesis fallback ---------- */
// const VOX = {"text":[file,start_ms,length_ms]}  — fill by rendering de_DE-thorsten-high with Piper
// (see RENDER NOTES at the end of this file). Sprites would be shipped as base64 MP3 in VOX_FILES.
const VOX = {};
const VOX_FILES = {};
// Pre-rendered lines from `node scripts/voices.mjs render`: text -> audio/<hash>.opus, filled by loadVoxManifest().
// Absent (no manifest, or opened as a file) means every line uses the device voice.
const VOX_URL = {};
async function loadVoxManifest() {
  try { const r = await fetch('audio/manifest.json'); if (r.ok) Object.assign(VOX_URL, await r.json()); } catch (e) { }
}
let actx = null, voxBuffers = {}, curSource = null, curUtter = null, onWordCb = null;
function ctx() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; }
/* ---------- Protoa's voice ----------
   The page cannot synthesise speech itself, so Protoa uses the best voice the device offers, ranked toward
   a modern, educated, deep (not guttural) male German voice: Microsoft's neural de-DE voices first (Conrad,
   Killian, Florian…, in Edge and on Windows 11), then Apple's premium/enhanced Markus and Yannick, then other
   male voices; female voices only as a last resort. Pitch is lowered a touch and the pace is measured. */
const VOICE_RANK = [
  [/Conrad/i, 100, 'm'], [/Killian/i, 96, 'm'], [/Florian/i, 93, 'm'], [/Christoph/i, 90, 'm'], [/Bernd/i, 88, 'm'], [/Ralf/i, 87, 'm'], [/Kasper/i, 86, 'm'], [/Klaus/i, 85, 'm'],
  [/Markus/i, 84, 'm'], [/Yannick/i, 82, 'm'], [/Viktor/i, 76, 'm'], [/Martin|Jonas|Lukas/i, 72, 'm'], [/x-deg|x-nfh/i, 70, 'm'], [/Stefan/i, 55, 'm'],
  [/Katja|Amala|Seraphina|Tanja|Louisa|Maja|Elke|Gisela|Klarissa|Ingrid/i, 44, 'f'], [/Google Deutsch/i, 38, 'f'], [/Anna|Petra|Helena|Hedda|Sandy|Shelley|Eddy|Flo|Grandma|Grandpa|Rocko|Reed/i, 30, 'f'],
];
function voiceInfo(v) {
  let score = 25, sex = '?';
  for (const [re, sc, sx] of VOICE_RANK) if (re.test(v.name)) { score = sc; sex = sx; break; }
  const neural = /Natural|Online|Neural|Premium/i.test(v.name), enh = /Enhanced|Erweitert|Verbessert/i.test(v.name);
  score += neural ? 8 : enh ? 5 : 0; if (!v.localService) score += 2;
  return { v, score, sex, quality: neural ? 'neural' : enh ? 'enhanced' : 'standard' };
}
function germanVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter(v => /^de(-|_|$)/i.test(v.lang) || /Florian.*Multilingual|Seraphina.*Multilingual/i.test(v.name)).map(voiceInfo).sort((a, b) => b.score - a.score);
}
function germanVoice() { const all = germanVoices(), pick = S.settings.voiceName && all.find(x => x.v.name === S.settings.voiceName); return (pick || all[0] || {}).v || null; }
function voiceTuning(v) {
  const info = v ? voiceInfo(v) : { sex: '?', score: 0 }, depth = S.settings.voiceDepth == null ? .5 : +S.settings.voiceDepth;
  const base = info.sex === 'm' ? (info.score >= 80 ? .97 : .93) : 1;
  return { pitch: Math.max(.72, Math.min(1.15, base - (depth - .5) * .18)), rate: +S.settings.voiceRate || .92 };
}
let audioSeq = 0; // bumped by every stopAudio(), so a clip still being fetched is dropped
function stopAudio() {
  audioSeq++;
  if (curSource) { try { curSource.stop(); } catch (e) { } curSource = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  curUtter = null; Voice.talk(false); VoiceLight.end(); highlightWord(null);
}
let hlTimers = [];
function highlightWord(i) { hlTimers.forEach(clearTimeout); hlTimers = []; document.querySelectorAll('.gl .w.speaking').forEach(e => e.classList.remove('speaking')); if (i === null) return; }
async function playVoxUrl(text, rate) {
  const c = ctx(), url = 'audio/' + VOX_URL[text], seq = audioSeq;
  try {
    if (!voxBuffers[url]) voxBuffers[url] = await fetch(url).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => c.decodeAudioData(b));
  } catch (e) { delete VOX_URL[text]; return false; }
  if (seq !== audioSeq) return true;
  const src = c.createBufferSource(); src.buffer = voxBuffers[url]; src.playbackRate.value = rate || 1; VoiceLight.audio(src, c);
  curSource = src; src.start(); Voice.talk(true);
  return new Promise(res => { src.onended = () => { if (curSource === src) { curSource = null; Voice.talk(false); VoiceLight.end(); } res(true); }; });
}
async function playVox(text, rate) {
  const e = VOX[text]; if (!e) return false;
  const [file, start, len] = e; const c = ctx();
  if (!voxBuffers[file]) { const bin = atob(VOX_FILES[file]); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); voxBuffers[file] = await c.decodeAudioData(u8.buffer); }
  const src = c.createBufferSource(); src.buffer = voxBuffers[file]; src.playbackRate.value = rate || 1; VoiceLight.audio(src, c);
  curSource = src; src.start(0, start / 1000, len / 1000 / (rate || 1)); Voice.talk(true);
  return new Promise(res => { src.onended = () => { if (curSource === src) { curSource = null; Voice.talk(false); VoiceLight.end(); } res(true); }; });
}
// speak(text, {rate, el}) — el: a gloss <ul> whose words get highlighted by approximate timing
function speak(text, opts = {}) {
  text = fill(text); stopAudio();
  const rate = opts.rate || 1;
  if (VOX[text]) return playVox(text, rate).then(() => { });
  if (VOX_URL[text]) return playVoxUrl(text, rate).then(ok => ok ? undefined : speakDevice(text, opts, rate));
  return speakDevice(text, opts, rate);
}
function speakDevice(text, opts, rate) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; const v = germanVoice(); if (v) u.voice = v;
    const tune = voiceTuning(v); u.rate = tune.rate * rate; u.pitch = tune.pitch;
    curUtter = u; Voice.talk(true); VoiceLight.speech(text, u.rate / .9, u);
    if (opts.el && typeof Companion !== 'undefined') Companion.attend(opts.el);
    if (opts.el) {
      const words = [...opts.el.querySelectorAll('.w')]; const total = words.reduce((a, w) => a + w.textContent.length + 1, 0);
      const est = (text.length / 12) * 1000 / (0.9 * rate); let t = 0; // ~12 chars per second at rate 0.9 (≈4.5 syl/s)
      words.forEach(w => { const d = (w.textContent.length + 1) / total * est; hlTimers.push(setTimeout(() => { words.forEach(x => x.classList.remove('speaking')); w.classList.add('speaking'); }, t)); t += d; });
      hlTimers.push(setTimeout(() => words.forEach(x => x.classList.remove('speaking')), t + 200));
    }
    const done = () => { if (curUtter === u) { curUtter = null; Voice.talk(false); VoiceLight.end(); } if (opts.el && typeof Companion !== 'undefined') Companion.release(opts.el); res(); };
    u.onend = done; u.onerror = done; speechSynthesis.speak(u);
  });
}
async function speakSyllables(syl, whole) { for (const s of syl.split('·')) { await speak(s.trim(), { rate: 0.85 }); await new Promise(r => setTimeout(r, 180)); } await speak(whole); }
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { const f = document.getElementById('voice-select'); if (f && f._fill) f._fill(); };

/* ---------- UI sounds (WebAudio, soft) ---------- */
/* a wrong answer that is half right (right word, wrong form or spelling) turns the orb yellow instead of red */
const NEAR_MISS = new Set(['spelling', 'order', 'gender', 'case', 'verb', 'sep', 'related', 'extra']);
function uiSound(kind, r) {
  if (kind === 'bad' && r && NEAR_MISS.has(r.kind)) kind = 'near';
  if (kind === 'ok') Voice.nod(); else if (kind === 'bad') Voice.tilt(); else if (kind === 'near') Voice.almost();
  if (!S.settings.uiSounds || curUtter || curSource) return;
  try { const c = ctx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); const t = c.currentTime; g.gain.setValueAtTime(0.0001, t);
    if (kind === 'ok') { o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(880, t + .09); g.gain.exponentialRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.start(t); o.stop(t + .26); }
    else if (kind === 'bad' || kind === 'near') { o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.linearRampToValueAtTime(180, t + .18); g.gain.exponentialRampToValueAtTime(.1, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .22); o.start(t); o.stop(t + .23); }
    else { [523, 659, 784, 1046].forEach((f, i) => { const o2 = c.createOscillator(), g2 = c.createGain(); o2.connect(g2); g2.connect(c.destination); o2.frequency.value = f; g2.gain.setValueAtTime(.0001, t + i * .1); g2.gain.exponentialRampToValueAtTime(.1, t + i * .1 + .03); g2.gain.exponentialRampToValueAtTime(.0001, t + i * .1 + .4); o2.start(t + i * .1); o2.stop(t + i * .1 + .42); }); }
  } catch (e) { }
}

/* ---------- the voice: a faceless orb that pulses while speaking ---------- */
const Voice = {
  all() { return typeof TEACHER !== 'undefined' && TEACHER.isConnected ? [TEACHER] : []; },
  talk(on) { this.all().forEach(s => s.classList.toggle('talking', !!on)); },
  nod() { if (typeof GLOrb !== 'undefined' && GLOrb.ok) GLOrb.flash(); this.all().forEach(s => { s.classList.remove('nod'); void s.offsetWidth; s.classList.add('nod'); setTimeout(() => s.classList.remove('nod'), 700); }); },
  busy(on) { if (typeof TEACHER !== 'undefined') TEACHER.classList.toggle('busy', !!on); },
  almost() { if (typeof GLOrb !== 'undefined' && GLOrb.ok) GLOrb.almost(); this.all().forEach(s => { s.classList.remove('tilt'); void s.offsetWidth; s.classList.add('tilt'); setTimeout(() => s.classList.remove('tilt'), 900); }); },
  tilt() { if (typeof GLOrb !== 'undefined' && GLOrb.ok) GLOrb.shiver(); this.all().forEach(s => { s.classList.remove('tilt'); void s.offsetWidth; s.classList.add('tilt'); setTimeout(() => s.classList.remove('tilt'), 900); }); },
  mood(m) { if (typeof TEACHER === 'undefined') return; TEACHER.classList.remove('neutral', 'pleased', 'thinking'); TEACHER.classList.add(m || 'neutral'); },
};

/* ---------- Error diagnosis (§8.3) ---------- */
// lexicon helpers
function verbLemmaOf(form, lex) { form = fold(form); for (const [lemma, f] of Object.entries(lex.verbs || {})) { if (fold(lemma) === form) return lemma; for (const v of Object.values(f)) if (fold(v) === form) return lemma; } return null; }
function personOf(tokens, i) { // subject near a verb: look at previous and next token
  const subj = { ich: 'ich', du: 'du', er: 'er', sie: 'er', es: 'er', wir: 'wir', ihr: 'ihr' };
  for (const j of [i - 1, i + 1, i - 2]) { const t = tokens[j]; if (!t) continue; if (t === 'Sie') return 'Sie'; if (subj[t.toLowerCase()]) return t === 'sie' && j === 0 ? 'Sie' : subj[t.toLowerCase()]; }
  return 'er';
}
const ARTICLES = { der: 'm', die: 'f', das: 'n', ein: 'm', eine: 'f', den: 'm', dem: 'm', einen: 'm', einem: 'm', einer: 'f', des: 'm' };
const GENDER_NAME = { m: 'masculine', f: 'feminine', n: 'neuter' };
const GENDER_ART = { m: 'der', f: 'die', n: 'das' };
const GENDER_EIN = { m: 'ein', f: 'eine', n: 'ein' };
const PERSON_END = { ich: '-e', du: '-st', er: '-t', wir: '-en', ihr: '-t', Sie: '-en' };

// Compare answer with target line. Returns {ok:true, exact, note?} or {ok:false, kind, hint, caps?}
function diagnose(answer, target, lex, glossStr, alts = []) {
  answer = applyShortcuts(answer);
  const A = deTokens(answer), T = deTokens(target);
  const same = (x, y) => x.length === y.length && x.every((w, i) => sameWord(w, y[i]));
  const notes = [];
  // exact / umlaut / caps acceptance
  const targetsAll = [T, ...alts.map(a => deTokens(a))];
  for (const tt of targetsAll) {
    if (same(A, tt)) {
      const umlautOff = A.some((w, i) => fold(w) === fold(tt[i]) && w.toLowerCase() !== tt[i].toLowerCase());
      const capsOff = A.some((w, i) => w !== tt[i] && w.toLowerCase() === tt[i].toLowerCase());
      if (umlautOff) notes.push('Accepted. The real spelling uses <em>' + esc(tt.join(' ')) + '</em> (ä ö ü ß buttons are below the box).');
      if (capsOff) { const n = tt.find((w, i) => A[i] !== w && /^[A-ZÄÖÜ]/.test(w)); if (n) notes.push('Nouns are capitalised: <em>' + esc(n) + '</em>.'); }
      const differs = tt !== T;
      return { ok: true, exact: !differs && !umlautOff && !capsOff, note: notes.join(' ') || (differs ? 'Correct — another way to say it: <em>' + esc(fill(target)) + '</em>' : '') };
    }
  }
  if (!A.length) return { ok: false, kind: 'empty', hint: 'Type your line in German.' };
  const gl = glossStr ? parseGloss(glossStr) : [];
  const enOf = w => { for (const [d, e] of gl) if (deTokens(d).some(x => sameWord(x, w))) return e; return ''; };
  const Af = A.map(fold), Tf = T.map(fold);
  // 1. word order: same multiset
  if (A.length === T.length && [...Af].sort().join(' ') === [...Tf].sort().join(' '))
    return { ok: false, kind: 'order', hint: 'All the right words. ' + (T[0] && /^(wie|wo|woher|was|wer|wann)$/i.test(T[0]) ? 'The question word comes first, then the verb.' : /\?$/.test(target) ? 'In a yes/no question the verb comes first.' : 'In a statement the verb is the second element.') };
  // walk target tokens, find first problem
  for (let i = 0; i < T.length; i++) {
    const t = T[i], tf = Tf[i];
    if (Af.includes(tf)) continue; // present somewhere
    // verb ending: a form of the same lemma present in answer
    const lemma = verbLemmaOf(t, lex);
    if (lemma) {
      const wrongForm = A.find(a => verbLemmaOf(a, lex) === lemma);
      if (wrongForm) { const p = personOf(T, i); const forms = lex.verbs[lemma]; return { ok: false, kind: 'verb', hint: `Right verb. With <em>${p}</em>, <em>${esc(lemma)}</em> is <em>${esc(forms[p] || t)}</em>${lemma === 'sein' ? '' : ' (' + PERSON_END[p] + ')'}: <em>${esc(p + ' ' + (forms[p] || t))}</em>.` + (p === 'Sie' ? ' <em>Sie</em> works like <em>usted</em>, but takes the plural form.' : '') }; }
    }
    // separable prefix
    for (const [sv, [stem, pre]] of Object.entries(lex.sep || {})) if (sameWord(t, pre) || sameWord(t, stem)) {
      const hasStem = Af.includes(fold(stem)), hasPre = Af.includes(fold(pre)), preLast = Af[Af.length - 1] === fold(pre), joined = Af.includes(fold(pre + stem));
      if (joined || (hasStem && (!hasPre || !preLast))) return { ok: false, kind: 'sep', hint: `<em>${esc(sv)}</em> splits: <em>ich ${esc(stem)} … ${esc(pre)}</em>. The prefix goes to the end.` };
    }
    // article / gender / case
    if (ARTICLES[tf]) {
      const noun = T[i + 1], g = noun && (lex.nouns || {})[noun.replace(/[^A-Za-zÄÖÜäöüß]/g, '')];
      const given = A[i] && ARTICLES[Af[i]] ? A[i] : A.find(a => ARTICLES[fold(a)]);
      if (given && g) {
        if (ARTICLES[fold(given)] !== g) return { ok: false, kind: 'gender', hint: `<em>${esc(noun)}</em> is ${GENDER_NAME[g]}: <em>${GENDER_ART[g]} ${esc(noun)}</em>, <em>${GENDER_EIN[g]} ${esc(noun)}</em>.` };
        return { ok: false, kind: 'case', hint: `Right gender, wrong case. Here it is <em>${esc(t)}</em>: <em>${esc(t + ' ' + noun)}</em>.` };
      }
    }
    // spelling: edit distance ≤ 2 to some answer token not used by target
    const near = A.find(a => !Tf.includes(fold(a)) && editDist(a, t) <= 2 && t.length > 2);
    if (near) return { ok: false, kind: 'spelling', hint: `Almost: check the spelling of <em>${esc(t)}</em>.` };
    // related word used instead
    const rel = A.find(a => { const r = (lex.related || {})[a] || (lex.related || {})[a.toLowerCase()]; return r && (sameWord(r, t) || deTokens(r).some(x => sameWord(x, t)) || verbLemmaOf(t, lex) === r); });
    if (rel) return { ok: false, kind: 'related', hint: `Close in meaning, but here German uses <em>${esc(t)}</em>, not <em>${esc(rel)}</em>.` };
    // missing / unknown
    const en = enOf(t);
    return { ok: false, kind: 'missing', hint: `One word is missing: it starts with <em>${esc(t[0])}</em>${en ? ` and means "${esc(en)}"` : ''}.` };
  }
  // all target words present but extra words / punctuation
  const extra = A.filter(a => !Tf.includes(fold(a)));
  if (extra.length) return { ok: false, kind: 'extra', hint: `All the needed words are there; <em>${esc(extra.join(' '))}</em> does not belong in this line.` };
  return { ok: false, kind: 'other', hint: 'Check the word order and the endings.' };
}

// Free answers: ask Claude (§8.3 last row). Returns {ok, understandable, issue, hint} or null if unavailable.
async function checkFree(answer, question, lessonWords) {
  if (!S.ai) return null;
  try {
    const r = await AI.run('checkFree', { question: fill(question), answer, words: lessonWords });
    return r && typeof r.ok === 'boolean' ? r : null;
  } catch (e) { return null; }
}

/* ---------- Import / export (§14) ---------- */
function exportJSON() {
  const words = [];
  for (const [sh, shd] of Object.entries(S.cards)) for (const [id, c] of Object.entries(shd.w || {})) {
    if (c.sent) continue; const d = wordDef(id) || {};
    words.push({ de: id, en: (d.en || []).join('; '), type: d.type || 'x', plural: d.pl || '', ipa: d.ipa || '', respelling: d.resp || '', syllables: d.syl || '', example: d.ex || '', example_en: d.exEn || '', lesson: c.lesson || c.v1 || 0, srs: { r: c.r, p: c.p } });
  }
  return JSON.stringify({ lang: LANG, exportedAt: todayStr(), source: 'Protoa', words, lessonsDone: S.progress.lessonsDone, v1LessonsDone: S.progress.v1Lessons || [], settings: { dailyNew: S.settings.perDay }, history: { activity: S.progress.days } }, null, 1);
}
const V1_TYPES = { phr: 'phrase', part: 'part', q: 'q', num: 'num', n: 'n', v: 'v', adj: 'adj', adv: 'adv', pron: 'pron', conj: 'conj', prep: 'prep', interj: 'interj' };
function importJSON(text) {
  const j = typeof text === 'string' ? JSON.parse(text) : text; if (!j || !Array.isArray(j.words)) throw new Error('Expected a "words" array.');
  let added = 0, merged = 0;
  for (const w of j.words) {
    const id = String(w.de || '').trim(); if (!id) continue;
    const builtin = wordDef(id); // a word in one of this app's lessons keeps that lesson; others are "imported"
    let sh = cardShard(id); if (!sh) { sh = builtin && builtin.lesson ? shardFor(builtin.lesson) : 'imp'; ensureShard(sh); }
    const shd = S.cards[sh]; const r = w.srs && w.srs.r, p = w.srs && w.srs.p;
    if (!shd.w[id]) {
      shd.w[id] = { r: r || newCard(todayStr()), p: p || null, learned: true, hist: [], lesson: builtin ? builtin.lesson : 0, v1: w.lesson || 0, since: todayStr() };
      if (!builtin) shd.w[id].def = { en: String(w.en || '').split(/;|,/).map(s => s.trim()).filter(Boolean), type: V1_TYPES[w.type] || w.type || 'x', pl: w.plural || w.pl || '', ipa: w.ipa || '', resp: w.respelling || w.resp || '', syl: w.syllables || w.syl || '', ex: w.example || w.ex || '', exEn: w.example_en || w.exEn || '', lesson: 0, v1: w.lesson || 0 };
      added++;
    } else { const c = shd.w[id]; // never overwrite newer: keep the card with more reps, then the later due date
      if (r && (!c.r || r[3] > c.r[3] || (r[3] === c.r[3] && r[0] > c.r[0]))) c.r = r; if (p && (!c.p || p[3] > c.p[3])) c.p = p; c.learned = true; c.v1 = w.lesson || c.v1 || 0; merged++; }
    save(null, sh);
  }
  if (Array.isArray(j.lessonsDone)) { // v1's lessons are not this app's lessons: remember them separately, never block or skip anything here
    const v1 = j.lessonsDone.map(Number); S.progress.v1Lessons = [...new Set([...(S.progress.v1Lessons || []), ...v1.filter(n => n > 0)])].sort((a, b) => a - b); if (v1.includes(0)) S.progress.sounds = true;
  }
  if (j.history && j.history.activity) for (const [d, a] of Object.entries(j.history.activity)) { if (!S.progress.days[d]) S.progress.days[d] = { new: a.n || 0, reviews: a.r || 0 }; }
  save('progress');
  if (j.settings && j.settings.dailyNew && S.settings.perDay === DEF_SETTINGS().perDay) { S.settings.perDay = j.settings.dailyNew; save('settings'); }
  return { added, merged };
}

/* RENDER NOTES (§11) — not done in this environment. To add real audio:
   1. pip install piper-tts; download de_DE-thorsten-high.onnx + .json
   2. For every German string in LESSONS (headwords, syllables, examples, Weber lines, model learner lines,
      every gloss span) run piper at length_scale 1.1 (sentences ≈4.5 syl/s) and 1.5 (slow headwords),
      concatenate into sprite MP3s ≤ 1 MB each, record [file, start_ms, length_ms] into VOX and base64 into VOX_FILES.
   3. Test clarity with a German speech recogniser (target WER < 8%).
   The player above already prefers VOX and highlights words; speechSynthesis is only the fallback. */
