/* ===================== Levels, exams, pace, practice drills ===================== */
/* Every course runs to at least B1. A1 and A2 are milestones; reaching one (by words yours) opens its exam,
   and no new lesson starts until the exam is passed with ≥ 90 %. Modules follow the Goethe-Zertifikat
   (Hören, Lesen, Schreiben, Sprechen) plus strictly graded language items. Language-agnostic: per-language config. */
const LANG_LEVELS = { de: [{ code: 'A1', words: 600, name: 'Start' }, { code: 'A2', words: 1200, name: 'Grundlagen' }, { code: 'B1', words: 2400, name: 'Selbstständig' }] };
const LEVELS = LANG_LEVELS[LANG];
const PASS_MARK = 0.9, EXAM_COOLDOWN_MIN = 30;
Object.assign(ICON, { exam: `<svg viewBox="0 0 64 64">${SH}<rect x="12" y="8" width="36" height="46" rx="5" fill="#ffffff"/><rect x="12" y="8" width="36" height="9" rx="4" fill="#07101f"/><g fill="#89a7de"><rect x="18" y="23" width="24" height="3" rx="1.5"/><rect x="18" y="30" width="20" height="3" rx="1.5"/><rect x="18" y="37" width="14" height="3" rx="1.5"/></g><circle cx="44" cy="44" r="11" fill="#81a3e3"/><path d="M38 53l-3 9 9-4 9 4-3-9" fill="#2c5aaf"/><path d="M39.5 44l3 3 6-6.5" stroke="#07101f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${HI('<rect x="15" y="11" width="10" height="2" rx="1"/>')}</svg>` });

/* ---------- level state & gate ---------- */
function levelsPassed() { return S.progress.levelsPassed || []; }
function levelInfo() {
  const w = learnedCount();
  return LEVELS.map((l, i) => ({ ...l, i, reached: w >= l.words, passed: levelsPassed().includes(l.code), from: i ? LEVELS[i - 1].words : 0 }));
}
// the exam that blocks progress right now (first level reached but not passed), or null
function examGate() { return levelInfo().find(l => l.reached && !l.passed) || null; }
function examCooldownLeft(code) { const t = (S.progress.examCooldown || {})[code] || 0; return Math.max(0, t - Date.now()); }
function lessonBlocked(n) { const g = examGate(); if (!g) return null; const ls = S.progress.lessonState; if (S.progress.lessonsDone.includes(n)) return null; if (ls && ls.n === n && (ls.step !== 'scene' || ls.wi)) return null; return g; }

/* ---------- rhythm: 3-day average pace → days to each level ---------- */
function pace() {
  const days = S.progress.days || {}; let sum = 0; for (let i = 0; i < 3; i++) sum += (days[dayKey(-i)] || {}).new || 0;
  const avg = sum / 3, w = learnedCount();
  const eta = LEVELS.map(l => { const rem = Math.max(0, l.words - w); return { code: l.code, rem, days: rem === 0 ? 0 : avg > 0 ? Math.ceil(rem / avg) : null, date: rem === 0 || !avg ? null : addDays(todayStr(), Math.ceil(rem / avg)) }; });
  return { avg, eta, w };
}
function fmtDate(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.slice(0, 4) !== todayStr().slice(0, 4) ? 'numeric' : undefined }); } catch (e) { return d; } }
function paceWidget() {
  const p = pace(), info = levelInfo();
  const rows = info.map((l, i) => { const e = p.eta[i]; const status = l.passed ? h('span', { class: 'chip ok' }, 'bestanden') : l.reached ? h('span', { class: 'chip yours' }, 'exam ready') : e.days === null ? h('span', { class: 'faint' }, e.rem + ' words to go') : h('span', { class: 'faint' }, `${e.days} day${e.days === 1 ? '' : 's'} · ${fmtDate(e.date)}`);
    return h('div', { class: 'lvrow' + (l.passed ? ' passed' : l.reached ? ' ready' : '') }, h('b', { class: 'lvcode' }, l.code), h('div', { class: 'grow' }, h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, Math.max(0, (p.w - l.from) / (l.words - l.from) * 100))}%` })), h('div', { class: 'lvmeta' }, h('span', { class: 'faint' }, l.words.toLocaleString() + ' words'), status))); });
  return h('div', { class: 'widget pacew' }, h('div', { class: 'wh' }, h('h2', {}, 'Tempo'), h('span', { class: 'faint' }, p.avg ? `${(Math.round(p.avg * 10) / 10)} words/day (3-day average)` : 'no new words in the last 3 days')),
    p.avg ? '' : h('p', { class: 'faint' }, 'Learn new words in a lesson to see when you reach each level.'), ...rows,
    p.avg ? h('p', { class: 'faint' }, `At this pace you reach ${p.eta.find(e => e.rem > 0) ? p.eta.find(e => e.rem > 0).code + ' in ' + p.eta.find(e => e.rem > 0).days + ' days' : 'B1'}. Exams come on top: each level needs its exam passed with 90 %.`) : '');
}
function levelTrack() {
  const info = levelInfo(), w = learnedCount();
  return h('div', { class: 'levels', role: 'list', 'aria-label': 'Levels' }, ...info.map(l => h('div', { class: 'lv' + (l.passed ? ' passed' : l.reached ? ' ready' : ''), role: 'listitem' },
    h('b', {}, l.code), h('span', {}, l.passed ? 'bestanden' : l.reached ? 'Exam ready' : Math.max(0, l.words - w) + ' to go'))));
}

/* ---------- exam content (built-in texts; items from the learner's own words) ---------- */
const EXAM_TEXTS = {
  A1: {
    read: [
      { title: 'Eine Nachricht von Lena', text: 'Hallo, ich heiße Lena. Ich komme aus Hamburg, aber ich wohne jetzt in Berlin. Meine Wohnung ist klein, aber schön. Sie hat zwei Zimmer und eine Küche. Ich bin Studentin und lerne Spanisch. Am Abend trinke ich gern Tee mit meiner Freundin Anna. Anna kommt aus Spanien. Sie spricht Deutsch und Englisch.',
        q: [['Lena wohnt in Hamburg.', false], ['Die Wohnung hat zwei Zimmer.', true], ['Lena lernt Spanisch.', true], ['Anna kommt aus Italien.', false], ['Lena trinkt am Abend Kaffee.', false], { q: 'Was ist Lena?', o: ['Lehrerin', 'Studentin', 'Kellnerin'], a: 1 }] },
      { title: 'Café Spree', text: 'Café Spree – Frühstück von 8 bis 11 Uhr. Kaffee 2,80 Euro, Tee 2,20 Euro, Brot mit Käse 4,50 Euro. Am Montag ist das Café geschlossen. Wir haben auch Milch ohne Laktose. Kinder bis sechs Jahre trinken Kakao gratis.',
        q: [['Frühstück gibt es bis 11 Uhr.', true], ['Ein Tee kostet 2,80 Euro.', false], ['Am Montag ist das Café offen.', false], ['Kinder bis sechs Jahre bekommen Kakao gratis.', true], ['Brot mit Käse kostet 4,50 Euro.', true], { q: 'Wann ist das Café zu?', o: ['am Montag', 'am Sonntag', 'am Freitag'], a: 0 }] },
      { title: 'Liebe Grüße aus Berlin', text: 'Lieber Tom, wie geht’s? Ich bin jetzt in Berlin. Die Stadt ist groß und sehr schön. Ich wohne bei Familie Weber. Herr Weber ist Lehrer, Frau Weber arbeitet in einem Café. Sie haben zwei Kinder, Paul und Mia. Morgen gehen wir zusammen ins Kino. Kommst du im Sommer auch nach Berlin? Viele Grüße, Sara',
        q: [['Sara wohnt bei Familie Weber.', true], ['Frau Weber ist Lehrerin.', false], ['Die Webers haben drei Kinder.', false], ['Morgen gehen sie ins Kino.', true], ['Berlin ist klein.', false], { q: 'Wer ist Paul?', o: ['ein Kind', 'der Lehrer', 'Toms Freund'], a: 0 }] },
    ],
    listen: [
      { text: 'Guten Tag, hier ist Peter Klein. Ich bin morgen um neun Uhr nicht im Kurs. Ich bin krank. Am Donnerstag komme ich wieder. Vielen Dank und auf Wiedersehen.',
        q: [['Peter kommt morgen in den Kurs.', false], ['Peter ist krank.', true], { q: 'Wann kommt Peter wieder?', o: ['am Montag', 'am Donnerstag', 'am Freitag'], a: 1 }, ['Der Kurs ist um neun Uhr.', true]] },
      { text: 'Achtung, eine Information für alle Fahrgäste: Die U-Bahn nach Hermannplatz kommt heute zehn Minuten später. Bitte warten Sie auf Gleis zwei. Vielen Dank.',
        q: [['Die U-Bahn fährt nach Hermannplatz.', true], ['Die U-Bahn kommt zwanzig Minuten später.', false], { q: 'Wo warten die Fahrgäste?', o: ['auf Gleis eins', 'auf Gleis zwei', 'auf Gleis drei'], a: 1 }, ['Die U-Bahn kommt heute pünktlich.', false]] },
    ],
    write: 'Schreiben Sie eine kurze Nachricht an Ihren Freund Paul (30–40 Wörter). Sie sind jetzt in Berlin. Schreiben Sie: Wie ist Ihre Wohnung? Was machen Sie am Wochenende? Laden Sie Paul nach Berlin ein.',
    speak: ['Wie heißen Sie?', 'Woher kommen Sie?', 'Wo wohnen Sie?', 'Was machen Sie beruflich oder was studieren Sie?', 'Was trinken Sie gern?'],
  },
  A2: {
    read: [
      { title: 'Ein Wochenende in München', text: 'Letzte Woche bin ich mit meinem Bruder nach München gefahren. Wir haben dort unsere Großeltern besucht, weil meine Oma Geburtstag hatte. Am Samstag sind wir in die Berge gegangen, aber es hat leider geregnet. Am Abend haben wir zusammen gekocht und viel gelacht. Ich möchte im Sommer wieder hinfahren, denn München gefällt mir sehr. Nächstes Mal will ich auch das Museum besuchen.',
        q: [['Sie ist mit ihrer Schwester gefahren.', false], ['Die Oma hatte Geburtstag.', true], ['Am Samstag war das Wetter schön.', false], ['Am Abend haben sie zusammen gekocht.', true], ['Sie möchte im Winter wieder hinfahren.', false], ['München gefällt ihr nicht.', false], { q: 'Warum sind sie nach München gefahren?', o: ['wegen des Geburtstags der Oma', 'für einen Urlaub in den Bergen', 'für das Museum'], a: 0 }, { q: 'Was will sie nächstes Mal machen?', o: ['in die Berge gehen', 'das Museum besuchen', 'kochen'], a: 1 }] },
      { title: 'Wohnung in Kreuzberg', text: 'Schöne 2-Zimmer-Wohnung in Kreuzberg, 55 m², 3. Stock, mit Balkon und neuer Küche. Die Wohnung ist hell und ruhig, die U-Bahn ist nur fünf Minuten entfernt. Miete: 850 Euro warm. Haustiere sind leider nicht erlaubt. Frei ab 1. März. Besichtigung am Samstag zwischen 10 und 12 Uhr. Bitte rufen Sie Frau Schulz an.',
        q: [['Die Wohnung hat drei Zimmer.', false], ['Es gibt einen Balkon.', true], ['Man darf eine Katze haben.', false], ['Die Wohnung ist ab März frei.', true], ['Die Besichtigung ist am Sonntag.', false], ['Die Küche ist alt.', false], { q: 'Wie weit ist die U-Bahn?', o: ['fünf Minuten', 'fünfzehn Minuten', 'fünfzig Minuten'], a: 0 }, { q: 'Wie viel kostet die Wohnung im Monat?', o: ['550 Euro', '850 Euro', '855 Euro'], a: 1 }] },
      { title: 'E-Mail an Herrn Weber', text: 'Sehr geehrter Herr Weber, leider kann ich am Mittwoch nicht zum Kurs kommen, weil ich einen Termin beim Arzt habe. Ich habe mir die Hausaufgaben schon angesehen, aber eine Frage zur Übung 4 habe ich noch. Könnten Sie mir bitte schreiben, welche Seiten wir bis Freitag lesen sollen? Am Freitag bin ich wieder da. Vielen Dank und freundliche Grüße, Maria Lopez',
        q: [['Maria kommt am Mittwoch nicht zum Kurs.', true], ['Maria hat einen Termin beim Arzt.', true], ['Sie hat die Hausaufgaben noch nicht angesehen.', false], ['Sie hat eine Frage zur Übung 4.', true], ['Sie kommt am Donnerstag wieder.', false], ['Maria schreibt an eine Freundin.', false], { q: 'Was möchte Maria wissen?', o: ['welche Seiten sie lesen soll', 'wann der Kurs beginnt', 'wo der Arzt ist'], a: 0 }, ['Am Freitag ist Maria wieder im Kurs.', true]] },
    ],
    listen: [
      { text: 'Hallo Jonas, hier ist Lisa. Du, ich habe ein Problem: Mein Fahrrad ist kaputt, deshalb kann ich heute nicht mit dem Rad zur Arbeit fahren. Kannst du mich vielleicht um halb acht mit dem Auto abholen? Wenn das nicht geht, nehme ich den Bus um sieben Uhr fünfzehn. Ruf mich bitte kurz zurück. Danke!',
        q: [['Lisas Auto ist kaputt.', false], ['Jonas soll Lisa um halb acht abholen.', true], { q: 'Wann fährt der Bus?', o: ['um 7:15 Uhr', 'um 7:30 Uhr', 'um 7:50 Uhr'], a: 0 }, ['Lisa möchte, dass Jonas zurückruft.', true], ['Lisa fährt heute mit dem Rad.', false], { q: 'Wohin möchte Lisa fahren?', o: ['zur Arbeit', 'zur Schule', 'zum Arzt'], a: 0 }] },
      { text: 'Liebe Kundinnen und Kunden, unser Supermarkt schließt heute schon um achtzehn Uhr, weil wir morgen eine neue Kasse bekommen. Am Samstag haben wir wie immer von acht bis zwanzig Uhr geöffnet. Diese Woche gibt es alle Äpfel und Bananen zum halben Preis. Vielen Dank für Ihren Einkauf!',
        q: [['Der Supermarkt schließt heute um achtzehn Uhr.', true], ['Morgen gibt es eine neue Kasse.', true], ['Am Samstag ist der Supermarkt geschlossen.', false], { q: 'Was ist diese Woche billiger?', o: ['Obst', 'Milch', 'Brot'], a: 0 }, ['Am Samstag öffnet der Supermarkt um acht Uhr.', true], ['Äpfel kosten diese Woche mehr als sonst.', false]] },
    ],
    write: 'Schreiben Sie eine E-Mail an Ihren Lehrer, Herrn Weber (40–60 Wörter). Sie können morgen nicht zum Kurs kommen. Schreiben Sie: Warum nicht (mit „weil“)? Fragen Sie nach den Hausaufgaben. Wann kommen Sie wieder? Achten Sie auf Anrede und Gruß.',
    speak: ['Was haben Sie letztes Wochenende gemacht?', 'Wie sieht Ihre Wohnung aus?', 'Warum lernen Sie Deutsch?', 'Was essen Sie gern und was nicht?', 'Was möchten Sie im Sommer machen?'],
  },
};
EXAM_TEXTS.B1 = EXAM_TEXTS.A2; // B1 texts are written with the B1 lessons; until then B1 reuses A2 texts and leans on Claude for writing and speaking
const EXAM_PLAN = {
  A1: { listenDict: 6, vocabIn: 8, vocabOut: 8, gram: 8, gap: 6, order: 5, trans: 6, speak: 4, writePts: 5 },
  A2: { listenDict: 8, vocabIn: 10, vocabOut: 10, gram: 10, gap: 8, order: 6, trans: 8, speak: 5, writePts: 5 },
  B1: { listenDict: 10, vocabIn: 12, vocabOut: 12, gram: 12, gap: 10, order: 8, trans: 10, speak: 5, writePts: 8 },
};
const SECTION_NAMES = { hoeren: 'Hören', lesen: 'Lesen', wort: 'Wortschatz', gram: 'Grammatik', gap: 'Lückentext', order: 'Satzbau', trans: 'Übersetzung', schreiben: 'Schreiben', sprechen: 'Sprechen' };
const MOVABLE = new Set(['heute', 'jetzt', 'morgen', 'gern', 'auch', 'hier', 'da', 'nicht', 'sehr', 'schon', 'immer', 'dann', 'noch']);

function examPool() {
  return Object.values(S.cards).flatMap(sh => Object.entries(sh.w || {})).filter(([id, c]) => c.learned && !c.sent && !id.startsWith('s:')).map(([id]) => wordDef(id)).filter(Boolean);
}
function buildExam(code) {
  const plan = EXAM_PLAN[code], T = EXAM_TEXTS[code], pool = shuffle(examPool()), withEx = pool.filter(w => w.ex && w.exEn), items = [];
  const take = (arr, n, used) => { const out = []; for (const x of arr) { if (out.length >= n) break; if (!used.has(x.de)) { used.add(x.de); out.push(x); } } return out; };
  const claude = !!S.ai;
  // Hören 1: dictation of sentences the learner knows (played at most twice)
  const usedS = new Set(); take(withEx, plan.listenDict, usedS).forEach(w => items.push({ sec: 'hoeren', type: 'dict', de: w.ex.replace(/[\[\]]/g, ''), en: w.exEn, plays: 0 }));
  // Hören 2: a short recording with questions
  const L = T.listen[Math.floor(Math.random() * T.listen.length)];
  L.q.forEach((q, qi) => items.push(Array.isArray(q) ? { sec: 'hoeren', type: 'tf', audio: L.text, q: q[0], a: q[1], first: qi === 0 } : { sec: 'hoeren', type: 'mc', audio: L.text, q: q.q, o: q.o, a: q.a, first: qi === 0 }));
  // Lesen: one text with questions
  const R = T.read[Math.floor(Math.random() * T.read.length)];
  R.q.forEach(q => items.push(Array.isArray(q) ? { sec: 'lesen', type: 'tf', title: R.title, text: R.text, q: q[0], a: q[1] } : { sec: 'lesen', type: 'mc', title: R.title, text: R.text, q: q.q, o: q.o, a: q.a }));
  // Wortschatz: German → English and English → German (nouns with their article), all typed
  const usedW = new Set();
  take(pool, plan.vocabIn, usedW).forEach(w => items.push({ sec: 'wort', type: 'in', de: w.de, en: w.en }));
  take(pool, plan.vocabOut, usedW).forEach(w => items.push({ sec: 'wort', type: 'out', de: w.de, en: w.en, noun: w.type === 'n' }));
  // Grammatik: conjugation and articles (nominative for A1; accusative "einen/eine/ein" from A2)
  const verbs = shuffle([...new Map([...pool, ...V1_WORDS].filter(w => w.forms && isLearned(w.de)).map(w => [w.de, w])).values()]);
  const nouns = shuffle(pool.filter(w => w.type === 'n' && w.g));
  const persons = ['ich', 'du', 'er', 'wir', 'ihr', 'Sie'], subj = { ich: 'ich', du: 'du', er: 'er', wir: 'wir', ihr: 'ihr', Sie: 'Sie' };
  if (code !== 'A1') verbs.sort((a, b) => (b.forms.du.includes('i') && !b.de.includes('i') ? 1 : 0) - (a.forms.du.includes('i') && !a.de.includes('i') ? 1 : 0));
  for (let i = 0; i < plan.gram; i++) {
    if (i % 2 === 0 && verbs.length) { const v = verbs[(i / 2) % verbs.length], p = persons[(i * 7 + 3) % persons.length]; items.push({ sec: 'gram', type: 'conj', prompt: `${subj[p]} ___ (${v.de})`, a: [v.forms[p]] }); }
    else if (nouns.length) { const n = nouns[Math.floor(i / 2) % nouns.length], bare = n.de.replace(/^(der|die|das) /, ''); const acc = code !== 'A1' && i % 4 === 3;
      items.push(acc ? { sec: 'gram', type: 'art', prompt: `Ich brauche ___ ${bare}. (a / an)`, a: [{ m: 'einen', f: 'eine', n: 'ein' }[n.g]] } : i % 4 === 1 ? { sec: 'gram', type: 'art', prompt: `___ ${bare} ist neu. (the)`, a: [{ m: 'der', f: 'die', n: 'das' }[n.g]] } : { sec: 'gram', type: 'art', prompt: `Das ist ___ ${bare}. (a / an)`, a: [{ m: 'ein', f: 'eine', n: 'ein' }[n.g]] }); }
  }
  // Lückentext: the exact word form missing from a sentence
  take(withEx.filter(w => /\[[^\]]+\]/.test(w.ex)), plan.gap, usedS).forEach(w => { const m = w.ex.match(/\[([^\]]+)\]/); items.push({ sec: 'gap', type: 'gap', de: w.ex.replace(/[\[\]]/g, ''), shown: w.ex.replace(/\[[^\]]+\]/, '_____'), a: [m[1]], en: w.exEn }); });
  // Satzbau: unambiguous sentences of 4+ words, words shown jumbled, typed in order
  take(withEx.filter(w => { const t = deTokens(w.ex.replace(/[\[\]]/g, '')); return t.length >= 4 && t.length <= 8 && !t.some(x => MOVABLE.has(x.toLowerCase())); }), plan.order, usedS).forEach(w => { const de = w.ex.replace(/[\[\]]/g, ''); items.push({ sec: 'order', type: 'order', de, en: w.exEn, jumble: shuffle(deTokens(de).map(t => t.toLowerCase() === t ? t : t)) }); });
  // Übersetzung: English → German full sentences
  const nTrans = plan.trans + (claude ? 0 : plan.speak + 2); // without Claude, free speaking/writing are replaced by more translation
  take(withEx, nTrans, usedS).forEach(w => items.push({ sec: 'trans', type: 'trans', de: w.ex.replace(/[\[\]]/g, ''), en: w.exEn, g: w.exG }));
  // Schreiben + Sprechen: free production, graded by Claude against a rubric
  if (claude) {
    items.push({ sec: 'schreiben', type: 'write', task: T.write, pts: plan.writePts });
    shuffle(T.speak).slice(0, plan.speak).forEach(q => items.push({ sec: 'sprechen', type: 'speak', q }));
  }
  return { code, items, idx: 0, startedAt: Date.now(), claude, version: 1 };
}

/* ---------- exam flow ---------- */
let EXAM_RESULT = null;
function openExamPreview(code) {
  const l = LEVELS.find(x => x.code === code), plan = EXAM_PLAN[code], cd = examCooldownLeft(code), saved = S.progress.exam && S.progress.exam.code === code ? S.progress.exam : null, hist = (S.progress.exams || []).filter(e => e.code === code);
  openSheet((inner, close) => {
    const p = h('div', { class: 'preview' }, h('div', { class: 'bigicon' }, sigEl('exam')), h('div', { class: 'eyebrow' }, 'Level exam · ' + l.words.toLocaleString() + ' words reached'), h('h1', {}, code + ' exam'),
      h('p', { class: 'muted' }, 'Modelled on the Goethe-Zertifikat: listening, reading, vocabulary, grammar, gap-fill, word order, translation' + (S.ai ? ', writing and speaking.' : '.') + ' You need 90 % to pass and move on.'));
    const facts = h('div', { class: 'can' }, h('div', { class: 'eyebrow' }, 'The rules'), h('ul', { class: 'rules' }, h('li', {}, 'No hints, no word glosses, no second chances inside the exam.'), h('li', {}, 'Recordings play at most twice.'), h('li', {}, 'Everything is typed. Spelling and articles count; ae/oe/ue/ss are accepted for ä/ö/ü/ß.'), h('li', {}, 'You can pause and come back; your answers are saved.'), h('li', {}, `If you score under 90 %, you can retake it after ${EXAM_COOLDOWN_MIN} minutes with new questions.`)));
    p.append(facts, h('div', { class: 'facts' }, h('span', { class: 'chip' }, '≈ ' + (code === 'A1' ? 45 : code === 'A2' ? 60 : 80) + ' min'), h('span', { class: 'chip' }, 'pass mark 90 %'), hist.length ? h('span', { class: 'chip' }, 'best so far ' + Math.max(...hist.map(e => e.score)) + ' %') : ''));
    if (!S.ai) p.append(h('p', { class: 'faint' }, 'Claude is not available right now, so writing and speaking are replaced by extra translation tasks.'));
    if (saved) p.append(h('button', { class: 'btn', onclick: () => { close(); enterExam(); } }, `Continue the exam · ${saved.idx + 1} of ${saved.items.length}`));
    else if (cd) p.append(h('p', { class: 'fb note' }, `Next attempt in ${Math.ceil(cd / 60000)} min. Use the time on Practice: the words you missed are waiting there.`), h('button', { class: 'btn ghost', onclick: () => { close(); go('practice'); } }, 'Go to Practice'));
    else p.append(h('button', { class: 'btn', onclick: () => { close(); S.progress.exam = buildExam(code); save('progress'); enterExam(); } }, hist.length ? 'Retake the exam' : 'Start the exam'));
    inner.append(p);
  }, 'station');
}
function enterExam() { route = 'exam'; NAV = 'fwd'; render(); }
function renderExam(v) {
  if (EXAM_RESULT) { renderExamResult(v); return; }
  const X = S.progress.exam; if (!X) { route = 'learn'; render(); return; }
  document.body.classList.add('in-lesson');
  const it = X.items[X.idx];
  if (!it) { gradeExam(v); return; }
  const secs = [...new Set(X.items.map(i => i.sec))], secIdx = secs.indexOf(it.sec), inSec = X.items.filter(i => i.sec === it.sec), posInSec = inSec.indexOf(it);
  const elapsed = Math.floor((Date.now() - X.startedAt) / 60000);
  const segs = h('div', { class: 'segs', style: `grid-template-columns:repeat(${secs.length},1fr)` }, ...secs.map((s, i) => h('i', { title: SECTION_NAMES[s] }, h('b', { style: `width:${i < secIdx ? 100 : i === secIdx ? Math.round(posInSec / inSec.length * 100) : 0}%` }))));
  v.append(h('div', { class: 'lesson-top' }, h('div', { class: 'who' }, teacherSlot(44, 'neutral'), h('div', { style: 'min-width:0;display:flex;flex-direction:column' }, h('b', { lang: 'de' }, 'Prüfung ' + X.code), h('span', {}, `Aufgabe ${X.idx + 1} von ${X.items.length} · ${elapsed} min`))),
    h('button', { class: 'icon-btn sm close', 'aria-label': 'Pause the exam', html: ICONS.x, onclick: () => { save('progress'); route = 'learn'; NAV = 'back'; render(); toast('Exam paused. Your answers are saved.'); } }), segs, h('div', { class: 'steplbl' }, `Teil ${secIdx + 1} · ${SECTION_NAMES[it.sec]}`)));
  const card = h('div', { class: 'card stack exam-item' }); v.append(card);
  let getAnswer = () => '';
  const typed = (attrs, de = true) => { const i = de ? deInput(Object.assign({ id: 'exam-input' }, attrs)) : h('input', Object.assign({ type: 'text', id: 'exam-input', autocomplete: 'off' }, attrs)); if (it.answer) i.value = it.answer; getAnswer = () => i.value.trim(); setTimeout(() => i.focus(), 60); return de ? h('div', { class: 'stack', style: 'gap:8px' }, i, umlautRow(i)) : i; };
  const choice = (opts) => { const g = h('div', { class: 'choices' }); let sel = typeof it.answer === 'number' ? it.answer : null; opts.forEach((o, i) => g.append(h('button', { class: 'choice' + (sel === i ? ' picked' : ''), 'aria-pressed': sel === i ? 'true' : 'false', onclick: () => { sel = i; [...g.children].forEach((b, j) => { b.classList.toggle('picked', j === i); b.setAttribute('aria-pressed', j === i); }); } }, h('kbd', {}, i + 1), o))); getAnswer = () => sel; KEYS = e => { const n = parseInt(e.key); if (n >= 1 && n <= opts.length) g.children[n - 1].click(); if (e.key === 'Enter') next(); }; return g; };
  const audioBtn = (text, maxPlays) => { const b = h('button', { class: 'btn quiet', html: ICONS.play + ' <span>Abspielen</span>' }); const lbl = h('span', { class: 'faint' }); const upd = () => { const left = maxPlays - (it.plays || 0); lbl.textContent = left > 0 ? `${left} play${left === 1 ? '' : 's'} left` : 'No plays left'; b.disabled = left <= 0; }; b.onclick = () => { if ((it.plays || 0) >= maxPlays) return; it.plays = (it.plays || 0) + 1; save('progress'); upd(); speak(text); }; upd(); return h('div', { class: 'row' }, b, lbl); };
  if (it.type === 'dict') card.append(h('div', { class: 'eyebrow' }, 'Hören · Diktat'), h('p', {}, 'Listen and write exactly what you hear.'), audioBtn(it.de, 2), typed({ placeholder: 'Was hören Sie?', 'aria-label': 'What you hear' }));
  else if (it.sec === 'hoeren') { if (!X.items.some(i => i.audio === it.audio && i.plays)) it.plays = it.plays || 0; const shared = X.items.find(i => i.audio === it.audio && i.first) || it; card.append(h('div', { class: 'eyebrow' }, 'Hören · Aufnahme'), h('p', {}, 'Listen to the recording, then answer. It plays at most twice for all its questions.'), (() => { const b = audioBtn(it.audio, 2); b.querySelector('button').onclick = () => { if ((shared.plays || 0) >= 2) return; shared.plays = (shared.plays || 0) + 1; save('progress'); const left = 2 - shared.plays; b.querySelector('.faint').textContent = left > 0 ? `${left} play left` : 'No plays left'; b.querySelector('button').disabled = left <= 0; speak(it.audio); }; const left = 2 - (shared.plays || 0); b.querySelector('.faint').textContent = left > 0 ? `${left} play${left === 1 ? '' : 's'} left` : 'No plays left'; b.querySelector('button').disabled = left <= 0; return b; })(), h('p', { class: 'examq', lang: 'de' }, it.q), choice(it.type === 'tf' ? ['richtig', 'falsch'] : it.o)); }
  else if (it.sec === 'lesen') card.append(h('div', { class: 'eyebrow' }, 'Lesen'), h('div', { class: 'readtext' }, h('b', { lang: 'de' }, it.title), h('p', { lang: 'de' }, it.text)), h('p', { class: 'examq', lang: 'de' }, it.q), choice(it.type === 'tf' ? ['richtig', 'falsch'] : it.o));
  else if (it.type === 'in') card.append(h('div', { class: 'eyebrow' }, 'Wortschatz · German → English'), h('div', { class: 'examword', lang: 'de' }, it.de), typed({ placeholder: 'in English', 'aria-label': 'Meaning in English' }, false));
  else if (it.type === 'out') card.append(h('div', { class: 'eyebrow' }, 'Wortschatz · English → German'), h('div', { class: 'examword' }, it.en.join(', ')), h('p', { class: 'faint' }, it.noun ? 'A noun: write it with its article.' : 'Write the German word or phrase.'), typed({ placeholder: 'auf Deutsch', 'aria-label': 'German word' }));
  else if (it.sec === 'gram') card.append(h('div', { class: 'eyebrow' }, 'Grammatik'), h('p', {}, it.type === 'conj' ? 'Write the correct form of the verb.' : 'Write the correct article.'), h('div', { class: 'examword', lang: 'de' }, it.prompt), typed({ placeholder: '…', 'aria-label': 'Answer' }));
  else if (it.type === 'gap') card.append(h('div', { class: 'eyebrow' }, 'Lückentext'), h('p', {}, 'Write the missing word in the right form.'), h('div', { class: 'examword', lang: 'de' }, it.shown), h('p', { class: 'faint' }, it.en), typed({ placeholder: 'fehlendes Wort', 'aria-label': 'Missing word' }));
  else if (it.type === 'order') card.append(h('div', { class: 'eyebrow' }, 'Satzbau'), h('p', {}, 'Put the words in the right order and write the sentence.'), h('div', { class: 'jumble', lang: 'de' }, ...it.jumble.map(w => h('span', {}, w))), h('p', { class: 'faint' }, it.en), typed({ placeholder: 'Ihr Satz', 'aria-label': 'Your sentence' }));
  else if (it.type === 'trans') card.append(h('div', { class: 'eyebrow' }, 'Übersetzung · English → German'), h('div', { class: 'examword' }, it.en), typed({ placeholder: 'Auf Deutsch …', 'aria-label': 'German translation' }));
  else if (it.type === 'write') { const ta = h('textarea', { id: 'exam-write', lang: 'de', rows: 6, placeholder: 'Ihr Text …', 'aria-label': 'Your text' }); ta.value = it.answer || ''; const cnt = h('span', { class: 'faint' }); const upd = () => { cnt.textContent = (ta.value.trim().split(/\s+/).filter(Boolean).length) + ' Wörter'; }; ta.addEventListener('input', upd); upd(); getAnswer = () => ta.value.trim(); card.append(h('div', { class: 'eyebrow' }, 'Schreiben'), h('p', { lang: 'de' }, it.task), ta, h('div', { class: 'row', style: 'justify-content:space-between' }, umlautRow(ta), cnt)); setTimeout(() => ta.focus(), 60); }
  else if (it.type === 'speak') { const i = deInput({ id: 'exam-input', placeholder: 'Antworten Sie in ganzen Sätzen …', 'aria-label': 'Your answer' }); if (it.answer) i.value = it.answer; getAnswer = () => i.value.trim(); card.append(h('div', { class: 'eyebrow' }, 'Sprechen'), h('p', {}, SR ? 'Answer out loud with the microphone (or type). Use a full sentence.' : 'Answer in a full sentence.'), h('div', { class: 'row' }, h('div', { class: 'examword grow', lang: 'de' }, it.q), playBtn(it.q)), h('div', { class: 'row' }, h('div', { class: 'grow' }, i), micBtn(i)), umlautRow(i)); setTimeout(() => i.focus(), 60); }
  function next() {
    const a = getAnswer(); if (a === '' || a === null || a === undefined) { toast('Answer first, or type your best guess.'); return; }
    it.answer = a; X.idx++; save('progress'); NAV = 'fwd'; render();
  }
  actionBar({ buttons: [h('button', { class: 'btn', onclick: next }, X.idx + 1 < X.items.length ? 'Next' : 'Submit')] });
  if (!['tf', 'mc'].includes(it.type) || it.sec === 'gram') KEYS = e => { if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName !== 'TEXTAREA') next(); };
}
async function gradeExam(v) {
  const X = S.progress.exam;
  v.append(h('div', { class: 'card summary', style: 'margin-top:32px' }, teacherSlot(96, 'thinking'), h('h1', { lang: 'de' }, 'Wird korrigiert …'), h('p', { class: 'muted' }, 'Protoa is marking your answers.'), h('span', { class: 'typing' }, h('i'), h('i'), h('i'))));
  const lex = mergedLex({});
  const sameTokens = (a, b) => deTokens(a).map(fold).join(' ') === deTokens(b).map(fold).join(' ');
  const pending = [];
  for (const it of X.items) {
    const a = it.answer;
    if (it.type === 'tf') it.ok = (a === 0) === it.a, it.pts = it.ok ? 1 : 0, it.max = 1, it.expected = it.a ? 'richtig' : 'falsch';
    else if (it.type === 'mc') it.ok = a === it.a, it.pts = it.ok ? 1 : 0, it.max = 1, it.expected = it.o[it.a];
    else if (it.type === 'dict') { it.ok = sameTokens(a, it.de); it.max = 1; it.pts = it.ok ? 1 : 0; it.expected = it.de; }
    else if (it.type === 'in') { it.ok = checkEnglish(a, it.en).ok; it.max = 1; it.pts = it.ok ? 1 : 0; it.expected = it.en.join(', '); }
    else if (it.type === 'out') { it.ok = sameTokens(a, it.de); it.max = 1; it.pts = it.ok ? 1 : 0; it.expected = it.de; }
    else if (it.type === 'conj' || it.type === 'art' || it.type === 'gap') { it.ok = it.a.some(x => fold(stripPunct(x)) === fold(stripPunct(applyShortcuts(a)))); it.max = 1; it.pts = it.ok ? 1 : 0; it.expected = it.a[0]; }
    else if (it.type === 'order') { it.ok = sameTokens(a, it.de); it.max = 1; it.pts = it.ok ? 1 : 0; it.expected = it.de; if (!it.ok && X.claude && [...deTokens(a).map(fold)].sort().join(' ') === [...deTokens(it.de).map(fold)].sort().join(' ')) pending.push(it); }
    else if (it.type === 'trans') { const r = diagnose(a, it.de, lex, it.g, []); it.ok = r.ok; it.max = 1; it.pts = it.ok ? 1 : 0; it.expected = it.de; if (!it.ok && X.claude) pending.push(it); }
    else if (it.type === 'write' || it.type === 'speak') { it.max = it.type === 'write' ? it.pts : 1; it.pts = 0; it.expected = ''; pending.push(it); }
  }
  if (pending.length) {
    let marked = false;
    if (S.ai) try {
      const list = pending.map((it, i) => ({ i, kind: it.type, task: String((it.type === 'write' ? it.task : it.type === 'speak' ? it.q : it.en) || ''), model: it.de || '', answer: String(it.answer || ''), max: it.max }));
      const r = await AI.run('gradeExam', { code: X.code, items: list });
      (r.marks || []).forEach(m => { const it = pending[m.i]; if (!it) return; it.pts = Math.max(0, Math.min(it.max, Math.round(Number(m.points) || 0))); it.ok = it.pts === it.max; it.note = m.note || ''; });
      marked = true;
    } catch (e) { }
    if (!marked) pending.filter(it => it.type === 'write' || it.type === 'speak').forEach(it => { it.ungraded = true; });
  }
  // free tasks Claude couldn't mark (the call failed, or AI went away mid-exam) are left out of the total rather than counted as zero;
  // a failed attempt with unmarked tasks doesn't count: no cooldown and no entry in the history, so the learner can retake it at once
  const graded = X.items.filter(it => !it.ungraded), unmarked = X.items.length - graded.length, pts = graded.reduce((a, it) => a + it.pts, 0), max = graded.reduce((a, it) => a + it.max, 0);
  const score = max ? Math.floor(100 * pts / max) : 0, passed = score >= PASS_MARK * 100;
  const bySec = {}; graded.forEach(it => { const s = bySec[it.sec] = bySec[it.sec] || { pts: 0, max: 0 }; s.pts += it.pts; s.max += it.max; });
  if (passed || !unmarked) S.progress.exams = (S.progress.exams || []).concat([{ code: X.code, date: todayStr(), score, passed, afterLesson: Math.max(0, ...S.progress.lessonsDone) }]);
  if (passed) S.progress.levelsPassed = [...new Set([...levelsPassed(), X.code])];
  else if (!unmarked) { S.progress.examCooldown = Object.assign({}, S.progress.examCooldown, { [X.code]: Date.now() + EXAM_COOLDOWN_MIN * 60000 }); }
  const missedWords = X.items.filter(it => !it.ok && (it.type === 'in' || it.type === 'out')).map(it => it.de);
  missedWords.forEach(id => { const c = cardOf(id); if (c && c.r) { c.r[0] = todayStr(); c.r[4] = (c.r[4] || 0) + 1; } }); Object.keys(S.cards).forEach(k => save(null, k));
  EXAM_RESULT = { code: X.code, score, passed, pts, max, bySec, unmarked, items: X.items, missed: missedWords, minutes: Math.max(1, Math.round((Date.now() - X.startedAt) / 60000)) };
  S.progress.exam = null; save('progress'); NAV = 'fade'; render(); if (passed) Voice.proud(3200); if (passed && !reduced()) confetti(); checkStamps();
}
function renderExamResult(v) {
  const R = EXAM_RESULT; document.body.classList.add('in-lesson');
  v.append(h('div', { class: 'pagehead', style: 'margin-top:16px' }, teacherSlot(52, R.passed ? 'pleased' : 'neutral'), h('div', {}, h('h1', { lang: 'de' }, 'Prüfung ' + R.code), h('div', { class: 'faint' }, R.passed ? 'Bestanden' : 'Ergebnis'))));
  const ring = h('div', { class: 'big-ring' }, ringEl(0, 160), h('div', { class: 'inner' }, h('div', { class: 'n big' }, R.score + '%')));
  if (R.passed) v.append(h('div', { style: 'height:16px' }), h('div', { class: 'ticket cert' }, h('div', { class: 'top' }, h('b', {}, 'Protoa · Zertifikat'), h('span', {}, fmtDate(todayStr()))), h('div', { class: 'body' }, h('div', { class: 'eyebrow' }, 'Prüfung bestanden'), h('h1', { lang: 'de' }, 'Deutsch ' + R.code), h('div', { class: 'stamp' }, sigEl('exam')), h('p', { class: 'muted' }, `${R.pts} of ${R.max} points · ${R.minutes} min · ${R.score >= 95 ? 'sehr gut' : 'gut'}`), h('p', {}, R.code === 'B1' ? 'You have reached the goal of the course: independent, spoken B1.' : `The line continues toward ${LEVELS[LEVELS.findIndex(l => l.code === R.code) + 1].code}. New lessons are open again.`))));
  else v.append(h('div', { style: 'height:16px' }), h('div', { class: 'card summary' }, ring, h('h1', { lang: 'de' }, 'Noch nicht bestanden'), h('p', { class: 'muted' }, `${R.pts} of ${R.max} points. You need 90 % to pass ${R.code}. ` + (R.unmarked ? 'This attempt doesn\'t count: you can retake it now, with new questions.' : `New questions in ${EXAM_COOLDOWN_MIN} minutes; until then, practise what you missed.`))));
  if (R.unmarked) v.append(h('p', { class: 'fb note' }, 'Writing and speaking couldn\'t be marked just now, so they are left out of this score.'));
  setTimeout(() => { const c = ring.querySelector('.fg'); if (c) { const r = (160 - 6) / 2, circ = 2 * Math.PI * r; c.style.strokeDashoffset = circ * (1 - R.score / 100); } }, 120);
  const secs = h('div', { class: 'card stack' }, h('h2', {}, 'By module'));
  Object.entries(R.bySec).forEach(([s, x]) => { const pct = Math.round(100 * x.pts / Math.max(1, x.max)); secs.append(h('div', { class: 'secrow' }, h('span', { lang: 'de' }, SECTION_NAMES[s]), h('div', { class: 'bar' }, h('i', { style: `width:${pct}%;background:${pct >= 90 ? 'var(--green)' : 'var(--yellow)'}` })), h('b', {}, `${x.pts}/${x.max}`))); });
  v.append(secs);
  const wrong = R.items.filter(it => !it.ok && !it.ungraded);
  if (wrong.length) { const c = h('div', { class: 'card stack' }, h('h2', {}, 'Your mistakes (' + wrong.length + ')'));
    wrong.slice(0, 40).forEach(it => c.append(h('div', { class: 'mistake' }, h('span', { class: 'eyebrow' }, SECTION_NAMES[it.sec]), h('div', { class: 'faint' }, it.type === 'trans' ? it.en : it.type === 'in' ? it.de : it.type === 'out' ? it.en.join(', ') : it.type === 'order' ? it.jumble.join(' · ') + ' — ' + it.en : it.prompt || it.q || it.shown || (it.type === 'dict' ? '(Diktat)' : it.task || '')),
      h('div', {}, h('span', { class: 'yours' }, 'You: ' + (typeof it.answer === 'number' ? (it.type === 'tf' ? ['richtig', 'falsch'][it.answer] : it.o[it.answer]) : (it.answer || '—')))), it.expected ? h('div', { lang: 'de' }, h('b', {}, 'Correct: '), it.expected) : '', it.note ? h('div', { class: 'faint' }, it.note) : '')));
    v.append(c); }
  const done = () => { EXAM_RESULT = null; route = R.passed ? 'learn' : 'practice'; NAV = 'fade'; render(); };
  const btns = [h('button', { class: 'btn', onclick: done }, R.passed ? 'Weiter auf der Linie' : 'Practise my mistakes')];
  if (!R.passed && R.missed.length) btns[0].onclick = () => { EXAM_RESULT = null; const items = R.missed.map(id => ({ id, sh: cardShard(id), c: cardOf(id), kind: 'r', extra: true })).filter(x => x.c); if (items.length) startReview(items); else done(); };
  actionBar({ buttons: btns });
}

/* ---------- practice drills: meanings, fill the gaps, build sentences, translate ---------- */
// called from renderReview for kinds mc | gap | order | trans; uses the same grading flow (showGrades) as other cards
function renderDrill(card, it, def, fb, showGrades, exRow) {
  const ex = def.ex ? def.ex.replace(/[\[\]]/g, '') : null; let done = false;
  if (it.kind === 'mc') {
    const others = shuffle([...allLessons().flatMap(l => l.words), ...V1_WORDS].filter(x => x.de !== def.de && x.en[0] !== def.en[0]).map(x => x.en[0])).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
    const opts = shuffle([def.en[0], ...others]);
    const head = h('div', { class: 'wcard' }); if (def.pic && PICS[def.pic]) { const i = h('div', { class: 'illus ' + (def.g || '') }); i.innerHTML = PICS[def.pic]; head.append(i); } head.append(h('div', { class: 'de' }, artEl(def.de)), playBtn(def.de.replace(/^(der|die|das) /, '')));
    const grid = h('div', { class: 'choices' });
    opts.forEach((o, i) => grid.append(h('button', { class: 'choice', onclick: e => { if (done) return; done = true; const ok = o === def.en[0]; e.currentTarget.classList.add(ok ? 'ok' : 'bad'); if (!ok) [...grid.children].find(b => b.textContent.endsWith(def.en[0]))?.classList.add('ok'); uiSound(ok ? 'ok' : 'bad'); fb.append(exRow()); showGrades(ok ? 2 : 0, ok ? 'ok' : 'bad', ok ? '✓ ' + esc(def.en.join(', ')) : '<em lang="de">' + esc(def.de) + '</em> = ' + esc(def.en.join(', '))); } }, h('kbd', {}, i + 1), o)));
    card.append(h('div', { class: 'eyebrow' }, 'Word meaning'), head, grid, fb);
    KEYS = e => { const n = parseInt(e.key); if (n >= 1 && n <= 4 && !done) grid.children[n - 1].click(); };
    return;
  }
  if (it.kind === 'gap') {
    const m = def.ex.match(/\[([^\]]+)\]/), target = m ? m[1] : def.de; const parts = def.ex.split(/\[[^\]]+\]/);
    const inp = deInput({ 'aria-label': 'Missing word', id: 'drill-input' }); inp.style.width = Math.max(6, target.length + 2) + 'ch';
    card.append(h('div', { class: 'eyebrow' }, 'Fill the gap'), h('p', {}, h('b', {}, def.exEn)), h('div', { class: 'gapline', lang: 'de' }, h('span', {}, parts[0].trim()), inp, h('span', {}, (parts[1] || '').trim())), umlautRow(inp), fb);
    const check = () => { if (done) return; const a = inp.value.trim(); if (!a) return; done = true; const ok = fold(stripPunct(applyShortcuts(a))) === fold(stripPunct(target)); inp.disabled = true; uiSound(ok ? 'ok' : 'bad'); fb.append(h('div', { class: 'row' }, glossEl(ex, def.exG || null), playBtn(ex))); showGrades(ok ? 2 : 0, ok ? 'ok' : 'bad', ok ? '✓ <em lang="de">' + esc(target) + '</em>' : 'The word is <em lang="de">' + esc(target) + '</em>.'); };
    actionBar({ buttons: [h('button', { class: 'btn', onclick: check }, 'Check')] }); KEYS = e => { if (e.key === 'Enter') check(); }; setTimeout(() => inp.focus(), 50);
    return;
  }
  if (it.kind === 'order') {
    const toks = ex.split(/\s+/); const extra = shuffle(V1_WORDS.filter(w => w.type !== 'phrase' && !toks.map(fold).includes(fold(w.de)))).slice(0, 1).map(w => w.de.replace(/^(der|die|das) /, ''));
    const tw = tilesWidget(toks, extra, () => { });
    card.append(h('div', { class: 'eyebrow' }, 'Build the sentence'), h('p', {}, h('b', {}, def.exEn)), tw.el, fb);
    const check = () => { if (done) return; const a = tw.value(); if (!a) return; done = true; tw.disable(); const r = diagnose(a, ex, mergedLex({}), def.exG || null, []); uiSound(r.ok ? 'ok' : 'bad', r); fb.append(h('div', { class: 'row' }, glossEl(ex, def.exG || null), playBtn(ex))); showGrades(r.ok ? 2 : 0, r.ok ? 'ok' : 'bad', r.ok ? '✓ ' + (r.note || 'Richtig.') : esc(stripTags(r.hint)) + ' The sentence is <em lang="de">' + esc(ex) + '</em>.'); };
    actionBar({ buttons: [h('button', { class: 'btn', onclick: check }, 'Check')] }); KEYS = e => { if (e.key === 'Enter') check(); };
    return;
  }
  if (it.kind === 'trans') {
    const w = typeWidget({ id: 'drill-input', placeholder: 'Auf Deutsch …' }, () => check());
    card.append(h('div', { class: 'eyebrow' }, 'Translate into German'), h('div', { class: 'examword' }, def.exEn), w.el, fb);
    const check = () => { if (done) return; const a = w.value().trim(); if (!a) return; done = true; w.disable(); const r = diagnose(a, ex, mergedLex({}), def.exG || null, []); uiSound(r.ok ? 'ok' : 'bad', r); fb.append(h('div', { class: 'row' }, glossEl(ex, def.exG || null), playBtn(ex))); showGrades(r.ok ? 2 : 0, r.ok ? 'ok' : 'bad', r.ok ? '✓ ' + (r.note || 'Richtig.') : r.hint + ' Model answer: <em lang="de">' + esc(ex) + '</em>'); if (!r.ok) fb.append(explainBtn(a, ex, def.exEn)); };
    actionBar({ buttons: [h('button', { class: 'btn', onclick: check }, 'Check')] }); KEYS = e => { if (e.key === 'Enter') check(); }; setTimeout(() => w.focus(), 50);
  }
}
function stripTags(s) { return String(s || '').replace(/<[^>]+>/g, ''); }
// practice pools: half from the newest words, half from everything, weak words first
function drillPool(n, needEx) {
  const all = Object.values(S.cards).flatMap(sh => Object.entries(sh.w || {})).filter(([id, c]) => c.learned && !c.sent).map(([id, c]) => ({ id, c, d: wordDef(id) })).filter(x => x.d && (!needEx || (x.d.ex && x.d.exEn && /\[[^\]]+\]/.test(x.d.ex))));
  const newest = [...all].sort((a, b) => String(b.c.since || '').localeCompare(String(a.c.since || '')) || (b.c.lesson || 0) - (a.c.lesson || 0)).slice(0, 40);
  const weak = all.filter(x => x.c.r && x.c.r[4] >= 1);
  const pick = [...new Map([...shuffle(weak).slice(0, Math.ceil(n / 4)), ...shuffle(newest).slice(0, Math.ceil(n / 2)), ...shuffle(all)].map(x => [x.id, x])).values()].slice(0, n);
  return shuffle(pick);
}
function drillSession(kind, n = 12) { const items = drillPool(n, kind !== 'mc').map(x => ({ id: x.id, sh: cardShard(x.id), c: x.c, kind, extra: true })); if (!items.length) { toast('Not enough words with example sentences yet.'); return; } startReview(items); }

