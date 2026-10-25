/* ===================== §18: course map, station preview, one-idea lesson screens, ticket ===================== */
let NAV = 'rise'; // direction of the next screen change: 'fwd' slides in from the right, 'back' from the left, 'rise' lifts the slabs in (a tab opens)
let lastSegs = null; // progress bar state of the previous lesson screen, so the bar grows instead of jumping
const SEG_NAMES = ['Scene', 'Words', 'Check', 'Build', 'Conversation'];
const STEP_SEG = { scene: 0, notice: 0, words: 1, check: 2, build: 3, conv: 4, done: 5 };
// Name of the lesson before n: its topic when it shares n's station (two lessons per station), else its station.
function prevName(n, ref = n) { if (n <= 1) return 'the previous lesson'; const a = courseOf(n - 1), b = courseOf(ref); return a.station === b.station ? a.topic : a.station; }
function sigEl(icon, cls = '') { const s = h('span', { class: 'sig ' + cls, 'aria-hidden': 'true' }); s.innerHTML = ICON[icon] || ICON.question; return s; }
const rangeN = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/* ---------- model ---------- */
function currentLessonN() {
  const written = allLessons().map(l => l.n), done = new Set(S.progress.lessonsDone), ls = S.progress.lessonState;
  if (ls && written.includes(ls.n) && !done.has(ls.n)) return ls.n;
  return written.sort((a, b) => a - b).find(n => !done.has(n)) ?? null;
}
// the unit Grammar puts first: the rule of the lesson you are on, or past the written line the newest rule you have done
function featuredGrammar() {
  const cur = currentLessonN(), upTo = cur ?? Math.max(1, ...S.progress.lessonsDone);
  const unit = GRAMMAR.filter(u => !u.stub && u.lesson <= upTo).sort((a, b) => b.lesson - a.lesson)[0];
  return unit ? { unit, today: unit.lesson === cur } : null;
}
function reviewCardsFor(from, to) {
  const out = [];
  for (const [sh, shd] of Object.entries(S.cards)) for (const [id, c] of Object.entries(shd.w || {})) {
    if (!c.learned) continue; const n = c.lesson || c.v1 || 0; if (n < from || n > to) continue;
    out.push({ id, sh, c, kind: c.sent ? 'sent' : 'r', extra: true });
  }
  return out;
}
function mapModel() {
  const written = new Set(allLessons().map(l => l.n)), done = new Set(S.progress.lessonsDone), cur = currentLessonN();
  const maxN = Math.max(COURSE.length, ...allLessons().map(l => l.n));
  const items = [{ kind: 'start', state: S.progress.sounds ? 'done' : 'open' }];
  for (let n = 1; n <= maxN; n++) {
    const ch = CHAPTERS.find(c => c.from === n); if (ch) items.push({ kind: 'chapter', ch, num: CHAPTERS.indexOf(ch) + 1 });
    const L = lessonById(n);
    items.push({ kind: 'lesson', n, c: courseOf(n), L, state: !L ? 'soon' : done.has(n) ? 'done' : n === cur ? 'now' : 'locked' });
    if (n % REVIEW_EVERY === 0) {
      const from = n - REVIEW_EVERY + 1, id = 'R' + n, all = rangeN(from, n);
      const st = (S.progress.reviewStops || []).includes(id) ? 'done' : all.every(k => done.has(k)) ? 'open' : all.every(k => written.has(k)) ? 'locked' : 'soon';
      items.push({ kind: 'review', id, from, to: n, state: st });
    }
  }
  items.push({ kind: 'term', state: 'soon' });
  // level exams: passed ones stay on the line where they were taken; a due one becomes the current stop
  (S.progress.exams || []).filter(e => e.passed).forEach(e => { const i = items.findIndex(it => it.kind === 'lesson' && it.n === e.afterLesson); items.splice(i >= 0 ? i + 1 : 1, 0, { kind: 'exam', code: e.code, state: 'done' }); });
  const gate = examGate();
  if (gate) {
    const ls = S.progress.lessonState, i = items.findIndex(it => it.kind === 'lesson' && it.state === 'now'), nowIt = items[i];
    if (nowIt && ls && ls.n === nowIt.n && (ls.step !== 'scene' || ls.wi)) items.splice(i + 1, 0, { kind: 'exam', code: gate.code, state: 'open' });
    else if (nowIt) { nowIt.state = 'locked'; items.splice(i, 0, { kind: 'exam', code: gate.code, state: 'now' }); }
    else { let last = 0; items.forEach((it, j) => { if (it.kind === 'lesson' && it.state === 'done') last = j; }); items.splice(last + 1, 0, { kind: 'exam', code: gate.code, state: 'now' }); }
  }
  return { items, cur };
}

/* ---------- the map (Night Glass: docs/designs/night-glass/screens/2-course-map.jpg) ----------
   The chapter you are in heads the screen on the navy stage, with your place in A1 and the level bar (Protoa
   stays in its tab). Below it the line runs down the left: done stops are steel with a tick, yours is a magenta ring
   beside a card with its scene and a start button, the ones ahead are rings with a lock. The person you meet sits on the
   right of each lesson. A chapter with nothing written yet folds into one row. After a lesson the line fills down to your
   new stop. Only transform and opacity animate. */
const MAP_LEVELS = [{ code: 'A1.1', from: 1, to: 30 }, { code: 'A1.2', from: 31, to: 60 }, { code: 'A2', words: [600, 1200] }, { code: 'B1', words: [1200, 2400] }];   // A1 is lessons 1–60 (docs/curriculum/coverage.md); past it the bar follows learned words
function mapHead(ch, chN) {
  const done = S.progress.lessonsDone, w = learnedCount();
  const fill = l => l.words ? Math.max(0, Math.min(1, (w - l.words[0]) / (l.words[1] - l.words[0]))) : done.filter(n => n >= l.from && n <= l.to).length / (l.to - l.from + 1);
  const a1 = done.filter(n => n <= 60).length, at = MAP_LEVELS.findIndex(l => fill(l) < 1), [kap, name] = ch.de.split(' · ');
  return h('header', { class: 'khead slab-dark' },
    h('div', { class: 'kt' }, h('h1', {}, 'Lessons'), h('span', { class: 'kc', 'aria-label': a1 < 60 ? `A1: ${a1} of 60 lessons done` : w + ' words learned' }, a1 < 60 ? `A1 · ${a1} of 60` : `${w.toLocaleString('en')} words`)),
    h('div', { class: 'kch' }, h('div', { class: 'grow' }, h('span', { class: 'kk' }, 'Chapter ' + chN), h('h2', { lang: 'de' }, name || ch.de), h('small', {}, ch.en)), h('i', { class: 'seat', 'aria-hidden': 'true' }), teacherSlot(72, 'neutral')),
    h('div', { class: 'klv', role: 'list', 'aria-label': 'Levels' }, ...MAP_LEVELS.map((l, i) => h('div', { class: 'lvl' + (i === at ? ' at' : ''), role: 'listitem', 'aria-label': l.code + ': ' + Math.round(fill(l) * 100) + ' %' },
      h('i', { 'aria-hidden': 'true' }, h('b', { style: `transform:scaleX(${fill(l)})` })), h('span', { 'aria-hidden': 'true' }, l.code)))));
}
function renderMap(v) {
  const { items, cur } = mapModel(), done = S.progress.lessonsDone;
  const refN = cur || (done.length ? Math.max(...done) : 1), chI = Math.max(0, CHAPTERS.findLastIndex(c => c.from <= refN));
  v.append(mapHead(CHAPTERS[chI], chI + 1));
  // a chapter whose lessons are all unwritten folds into one row
  const chapterOf = n => CHAPTERS.findLastIndex(c => c.from <= n), folded = new Set();
  CHAPTERS.forEach((c, i) => { const ls = items.filter(it => it.kind === 'lesson' && chapterOf(it.n) === i); if (ls.length && ls.every(it => it.state === 'soon')) folded.add(i); });
  const ends = new Set(CHAPTERS.map((c, i) => CHAPTERS[i + 1] ? CHAPTERS[i + 1].from - 1 : null));   // the review stop that closes a chapter is its chapter test
  const rows = []; let firstSoon = true;
  items.forEach(it => {
    if (it.kind === 'chapter') { const i = CHAPTERS.indexOf(it.ch); if (folded.has(i)) { const to = CHAPTERS[i + 1] ? CHAPTERS[i + 1].from - 1 : COURSE.length; rows.push({ kind: 'fold', ch: it.ch, num: it.num, from: it.ch.from, to }); } else rows.push(it); return; }
    if ((it.kind === 'lesson' || it.kind === 'review') && folded.has(chapterOf(it.kind === 'lesson' ? it.n : it.to))) return;
    if (it.kind === 'lesson' && it.state === 'soon') { it.firstSoon = firstSoon; firstSoon = false; }
    if (it.kind === 'review' && ends.has(it.to)) it.test = chapterOf(it.to) + 1;
    rows.push(it);
  });
  // the line is steel down to your stop (the current one, else the first not done) and grey after it
  let nowI = rows.findIndex(r => r.state === 'now'); if (nowI < 0) nowI = rows.findIndex(r => r.kind !== 'chapter' && r.kind !== 'fold' && r.state !== 'done'); if (nowI < 0) nowI = rows.length - 1;
  // after a lesson: the line fills from the stop the map showed last time down to the new one
  const fromN = S.progress.trainAt, fromI = fromN && cur && fromN < cur && !reduced() ? rows.findIndex(r => r.kind === 'lesson' && r.n === fromN) : -1;
  const list = h('ol', { class: 'kline', 'aria-label': 'Course map' }); v.append(list);
  let nowEl = null;
  rows.forEach((r, i) => {
    const el = mapRow(r); el.classList.add(i < nowI ? 'past' : i === nowI ? 'here' : 'ahead');
    if (i === 0) el.classList.add('first'); if (i === rows.length - 1) el.classList.add('last');
    if (fromI >= 0 && i >= fromI && i <= nowI) { el.classList.add('fresh'); el.style.setProperty('--d', (.45 + (i - fromI) * .32) + 's'); if (i === fromI) el.classList.add('just-done'); }
    if (i === nowI) nowEl = el;
    list.append(el);
  });
  const lastDone = Math.max(0, ...done.filter(n => lessonById(n)));
  if (S.progress.trainAt !== (cur || lastDone)) { S.progress.trainAt = cur || lastDone; save('progress'); }
  // scroll just far enough that your stop clears the tab bar (the head stays in view when it can); a pill brings it back
  const floor = () => window.innerHeight - (document.body.classList.contains('lay-mobile') ? 128 : 40);   // phones: clear the tab bar
  const focusY = () => { const b = nowEl.getBoundingClientRect(), y = PANE.scrollTop - PANE.getBoundingClientRect().top; return Math.min(b.top + y - 96, b.bottom + y - floor()); };
  // phones: and no face is left half under the tab bar; scroll on until it is whole
  const wholeFaces = () => { if (!document.body.classList.contains('lay-mobile')) return; const bar = tabsEl.getBoundingClientRect().top, cut = [...list.querySelectorAll('.bust')].map(b => b.getBoundingClientRect()).find(r => r.top < bar && r.bottom > bar); if (cut) PANE.scrollTop += cut.bottom - bar + 8; };
  if (nowEl) requestAnimationFrame(() => { if (nowEl.getBoundingClientRect().bottom > floor()) { PANE.scrollTo({ top: Math.max(0, focusY()), behavior: 'auto' }); wholeFaces(); } });
  if (nowEl && 'IntersectionObserver' in window) {
    const pill = h('button', { class: 'weiter', hidden: true, onclick: () => PANE.scrollTo({ top: Math.max(0, focusY()), behavior: reduced() ? 'auto' : 'smooth' }) }, h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'), 'Your stop');
    document.body.append(pill);
    const io = new IntersectionObserver(([e]) => { pill.hidden = e.isIntersecting; pill.firstChild.textContent = e.boundingClientRect.top < 0 ? '↑' : '↓'; }, { threshold: .1 });
    io.observe(nowEl.querySelector('.kmk') || nowEl); pill._io = io;
  }
}
function mapRow(it) {
  const st = it.state, L = it.kind === 'lesson' && it.L, c = it.kind === 'lesson' && it.c;
  const li = h('li', { class: `kst ${it.kind === 'review' ? (it.test ? 'rv test' : 'rv') : it.kind === 'chapter' ? '' : it.kind} ${st || ''}` });   // not .chapter: that is the old map's floating label
  const mk = h('span', { class: 'kmk', 'aria-hidden': 'true' });
  let title, sub, aria, face = null;
  if (it.kind === 'chapter' || it.kind === 'fold') {
    const [kap, name] = it.ch.de.split(' · ');
    mk.textContent = it.num; li.classList.add('kchap');
    li.append(mk, h('div', { class: 'ktx' }, h('b', { lang: 'de' }, name || it.ch.de), h('span', {}, 'Chapter ' + it.num + ' · ' + it.ch.en + (it.kind === 'fold' ? ` · lessons ${it.from}–${it.to}, coming soon` : ''))));
    return li;
  }
  if (it.kind === 'lesson') {
    title = L ? L.theme || L.title : c.station; sub = 'Lesson ' + it.n + ' · ' + (L ? L.title : c.topic);
    aria = `Lesson ${it.n}: ${L ? L.title : c.topic}, ${({ done: 'done', now: 'your stop', locked: 'not yet, opens after ' + prevName(it.n), soon: 'coming soon' })[st]}`;
    face = L && typeof bustEl === 'function' ? newcomer(L) || leadOf(L) : null;
    if (st === 'done') mk.innerHTML = CHECK_SVG; else if (st === 'locked') mk.innerHTML = LOCK_SVG;
  } else if (it.kind === 'review') {
    title = it.test ? 'Kapiteltest' : 'Wiederholung'; sub = (it.test ? 'after lesson ' + it.to + ' · ' : '') + 'review of lessons ' + it.from + '–' + it.to;
    aria = (it.test ? `Chapter ${it.test} test, ` : 'Review stop, ') + `lessons ${it.from} to ${it.to}, ` + ({ done: 'done', open: 'open', locked: 'not yet', soon: 'coming soon' })[st];
    if (it.test) mk.textContent = 'K' + it.test; else if (st === 'done') mk.innerHTML = CHECK_SVG; else mk.innerHTML = ICONS.practice || '';
  } else if (it.kind === 'exam') {
    title = it.code + ' exam'; sub = st === 'done' ? 'passed' : st === 'now' ? 'Pass with 90% to open the next lessons' : 'after this lesson';
    aria = 'Level exam ' + it.code + ', ' + ({ done: 'passed', now: 'ready', open: 'after this lesson' })[st]; mk.textContent = it.code;
  } else if (it.kind === 'start') {
    title = 'Laute'; sub = 'Lesson 0 · Sounds'; aria = 'Lesson 0, Sounds' + (st === 'done' ? ', done' : '');
    mk.innerHTML = st === 'done' ? CHECK_SVG : ICONS.play || '';
  } else { title = 'Endstation B1'; sub = 'Spoken B1'; aria = 'Terminus: spoken B1'; }
  // your stop: a magenta ring beside a card with the scene, the place and the start button
  if (st === 'now' && (L || it.kind === 'exam')) {
    li.append(mk);
    if (it.kind === 'exam') {
      li.append(h('div', { class: 'card primary kcard' }, h('div', { class: 'ktx' }, h('h2', { lang: 'de' }, title), h('span', {}, sub)), h('button', { class: 'btn go', onclick: () => openExamPreview(it.code) }, S.progress.exam ? 'Continue' : 'Open the exam')));
      return li;
    }
    const ls = S.progress.lessonState, resume = !!(ls && ls.n === it.n), pic = typeof NIGHT_SCENE !== 'undefined' && NIGHT_SCENE[L.scene.plate || 'plate.' + L.scene.id];
    const fresh = L.words.filter(w => !isLearned(w.de)).length;
    const ph = h('button', { class: 'kpic' + (pic ? '' : ' none'), 'aria-label': `About lesson ${it.n}`, onclick: () => openLessonPreview(it.n) }); if (pic) ph.style.backgroundImage = `url(art/night/scenes/${pic}.jpg)`;
    li.append(h('div', { class: 'card primary kcard', 'aria-label': aria }, ph,
      h('div', { class: 'ktx' }, h('h2', { lang: 'de' }, title), h('span', {}, `Lesson ${it.n} · ${L.scene.place} · ${estMinutes(L, fresh)} min`),
        h('button', { class: 'btn go', onclick: () => startLesson(it.n) }, resume ? 'Continue' : 'Start'))));
    return li;
  }
  const tx = h('div', { class: 'ktx' }, h('b', { lang: 'de' }, title), h('span', {}, sub));
  if (st === 'soon' && it.kind !== 'term') tx.append(h('em', { class: 'soon' }, 'Soon'));
  const body = st !== 'soon' && it.kind !== 'term' ? h('button', { class: 'kbody', 'aria-label': aria, onclick: () => openStation(it) }) : h('div', { class: 'kbody', 'aria-label': aria, role: 'group' });
  body.append(mk, tx);
  if (face) { const b = bustEl(face, 'neutral', 40); b.removeAttribute('role'); b.removeAttribute('aria-label'); b.setAttribute('aria-hidden', 'true'); body.append(b); }
  li.append(body);
  if (it.firstSoon) li.append(h('button', { class: 'btn ghost sm write', onclick: generateLesson }, 'Write it with Protoa'));
  return li;
}

/* ---------- bottom sheet ---------- */
function openSheet(build, cls = '') {
  document.querySelector('.sheet')?.remove();
  const sheet = h('div', { class: 'sheet ' + cls, role: 'dialog', 'aria-modal': 'true' }); const inner = h('div', { class: 'in' });
  const close = () => { if (sheet.classList.contains('closing')) return; sheet.classList.add('closing'); setTimeout(() => sheet.remove(), reduced() ? 0 : 220); document.removeEventListener('keydown', esc_); };
  const esc_ = e => { if (e.key === 'Escape') close(); };
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  inner.append(h('div', { class: 'grab', 'aria-hidden': 'true' }), h('button', { class: 'icon-btn sm close', 'aria-label': 'Close', html: ICONS.x, onclick: close }));
  build(inner, close);
  // swipe down to close
  let y0 = null, dy = 0;
  inner.addEventListener('pointerdown', e => { if (inner.scrollTop > 0 || e.target.closest('button,input,textarea,select')) return; y0 = e.clientY; dy = 0; inner.style.transition = 'none'; });
  inner.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); inner.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 === null) return; y0 = null; inner.style.transition = ''; if (dy > 90) close(); else inner.style.transform = ''; };
  inner.addEventListener('pointerup', end); inner.addEventListener('pointercancel', end);
  sheet.append(inner); document.body.append(sheet); document.addEventListener('keydown', esc_);
  setTimeout(() => inner.querySelector('.btn:not(.ghost)')?.focus(), 60);
  return close;
}
function estMinutes(L, newCount) { const turns = L.conv.filter(t => t.l).length; return Math.max(5, Math.round(newCount * .6 + L.build.length * .5 + turns * 1 + 2)); }
function openStation(it) {
  if (it.kind === 'lesson') return openLessonPreview(it.n);
  if (it.kind === 'review') return openReviewPreview(it);
  if (it.kind === 'exam') return it.state === 'done' ? toast(it.code + ' exam passed') : openExamPreview(it.code);
  if (it.kind === 'start') return openSheet((inner, close) => inner.append(h('div', { class: 'preview' },
    h('div', { class: 'bigicon' }, sigEl('sound')), h('div', { class: 'eyebrow' }, 'Lesson 0 · Start'), h('h1', { lang: 'de' }, 'Laute'), h('p', { class: 'muted' }, 'How German spelling maps to sound: 18 pairings, each with words to tap and hear.'),
    h('button', { class: 'btn', onclick: () => { close(); openMore(renderSounds); } }, S.progress.sounds ? 'Open again' : 'Start'))));
}
function openLessonPreview(n) {
  const L = lessonById(n); if (!L) return; const c = courseOf(n); const ls = S.progress.lessonState;
  const done = S.progress.lessonsDone.includes(n), cur = currentLessonN(), inProg = ls && ls.n === n && !done && (ls.step !== 'scene' || ls.wi);
  const yours = L.words.filter(w => isLearned(w.de)).length, fresh = L.words.length - yours;
  openSheet((inner, close) => {
    const p = h('div', { class: 'preview' }, h('div', { class: 'bigicon' }, sigEl(c.icon)), h('div', { class: 'eyebrow' }, 'Lesson ' + n + ' · ' + c.topic), h('h1', { lang: 'de' }, c.station), h('p', { class: 'muted' }, L.title + ' · ' + L.scene.place));
    p.append(h('div', { class: 'can' }, h('div', { class: 'eyebrow' }, 'By the end you can'), h('p', {}, L.can)));
    p.append(h('div', { class: 'facts' }, h('span', { class: 'chip' }, fresh + ' new word' + (fresh === 1 ? '' : 's')), yours ? h('span', { class: 'chip yours' }, 'already yours: ' + yours) : '', h('span', { class: 'chip' }, '≈ ' + estMinutes(L, fresh) + ' min'), done ? h('span', { class: 'chip ok' }, 'done') : ''));
    const go_ = fresh_ => { close(); startLesson(n, fresh_); };
    const blk = lessonBlocked(n);
    if (blk) { p.append(h('div', { class: 'fb note' }, `You have reached ${blk.words.toLocaleString('en')} words: the ${blk.code} milestone. Pass the ${blk.code} exam with 90% to continue the line.`), h('button', { class: 'btn', onclick: () => { close(); openExamPreview(blk.code); } }, 'Go to the ' + blk.code + ' exam')); inner.append(p); return; }
    if (done) p.append(h('button', { class: 'btn', onclick: () => go_(true) }, 'Review again'));
    else if (inProg) p.append(h('button', { class: 'btn', onclick: () => go_(false) }, 'Continue · ' + (SEG_NAMES[STEP_SEG[ls.step]] || 'where you left off')));
    else if (n === cur) p.append(h('button', { class: 'btn', onclick: () => go_(false) }, 'Start'));
    else { p.append(h('p', { class: 'faint' }, 'Comes after ' + prevName((cur || n - 1) + 1, n) + '. You can still go ahead.')); p.append(h('button', { class: 'btn ghost', onclick: () => go_(false) }, 'Start anyway')); }
    inner.append(p);
  }, 'station');
}
function openReviewPreview(it) {
  const items = reviewCardsFor(it.from, it.to);
  openSheet((inner, close) => {
    const p = h('div', { class: 'preview' }, h('div', { class: 'bigicon rv' }, sigEl('review')), h('div', { class: 'eyebrow' }, 'Review stop'), h('h1', { lang: 'de' }, 'Wiederholung'),
      h('p', { class: 'muted' }, 'Words and lines from ' + courseOf(it.from).station + ' to ' + courseOf(it.to).station + ', including the ones you brought from Protoa v1.'),
      h('div', { class: 'facts' }, h('span', { class: 'chip' }, items.length + ' cards'), h('span', { class: 'chip' }, '≈ ' + Math.max(3, Math.round(Math.min(items.length, 20) * .4)) + ' min'), it.state === 'done' ? h('span', { class: 'chip ok' }, 'done') : ''));
    const start = () => { close(); startReview(shuffle(items).slice(0, 20).map((x, i) => x.kind === 'sent' ? x : Object.assign({}, x, { kind: i % 3 === 2 && x.c.r && x.c.r[1] >= 4 ? 'p' : 'r' }))); PR.stop = it.id; };
    if (!items.length) p.append(h('p', { class: 'faint' }, 'Nothing to review yet. Words from these lessons appear here once you have learned them.'));
    else if (it.state === 'locked') { p.append(h('p', { class: 'faint' }, 'Opens after ' + courseOf(it.to).station + '.')); p.append(h('button', { class: 'btn ghost', onclick: start }, 'Review anyway')); }
    else p.append(h('button', { class: 'btn', onclick: start }, it.state === 'done' ? 'Review again' : 'Start review'));
    inner.append(p);
  }, 'station');
}

/* ---------- lesson screens: one idea per screen ---------- */
function lessonTop(L, ls, within = 0) {
  const c = courseOf(L.n), idx = STEP_SEG[ls.step], w = ls.step === 'notice' ? .5 : Math.max(0, Math.min(1, within));
  const widths = SEG_NAMES.map((_, i) => i < idx ? 100 : i === idx ? Math.round(w * 100) : 0);
  const prev = lastSegs && lastSegs.n === L.n ? lastSegs.widths : widths; lastSegs = { n: L.n, widths };
  const segs = h('div', { class: 'segs', role: 'progressbar', 'aria-label': 'Lesson progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round((idx + w) / 5 * 100)) });
  const bars = SEG_NAMES.map((nm, i) => { const b = h('b', { style: `width:${prev[i]}%` }); segs.append(h('i', { title: nm }, b)); return b; });
  requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach((b, i) => b.style.width = widths[i] + '%')));
  return h('div', { class: 'lesson-top' },
    h('div', { class: 'who' }, teacherSlot(44, 'neutral'), h('div', { style: 'min-width:0;display:flex;flex-direction:column' }, h('b', { lang: 'de' }, c.station), h('span', {}, 'Lesson ' + L.n + ' · ' + L.title))),
    h('button', { class: 'icon-btn sm close', 'aria-label': 'Leave lesson', html: ICONS.x, onclick: () => pauseLesson() }),
    segs, h('div', { class: 'steplbl' }, idx >= 5 ? 'Angekommen · arrived' : SEG_NAMES[idx]));
}
function lessonScene(v, L, ls) {
  v.append(lessonTop(L, ls), sceneEl(L));
  v.append(h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, L.scene.place + ' · ' + L.scene.time), ...L.scene.intro.slice(0, 2).map(p => h('p', {}, fill(p)))));
  // the scene's first spoken line, from the person who says it (not a fixed greeting: lessons happen in different places)
  const first = (L.conv || []).find(t => !t.l && t.w);
  if (first) {
    const who = first.who || 'cast.weber', line = glossEl(fill(first.w), first.g);
    v.append(h('div', { class: 'coach' }, typeof bustEl === 'function' ? bustEl(who, first.mood, 44) : '', h('div', { class: 'say' }, h('div', { class: 'row' }, line, h('button', { class: 'icon-btn sm', 'aria-label': 'Play the line', html: ICONS.play, onclick: () => speak(fill(first.w), { el: line }) })))));
  }
  const next = () => setStep('notice', {}, 'fwd');
  actionBar({ buttons: [h('button', { class: 'btn', onclick: next }, 'Continue')] }); KEYS = e => { if (e.key === 'Enter') next(); };
}
function lessonNotice(v, L, ls) {
  v.append(lessonTop(L, ls));
  const ul = glossEl(L.notice.de, L.notice.g);
  v.append(h('div', { class: 'eyebrow' }, 'Notice'), h('div', { class: 'notice-line stack' }, h('div', { class: 'row' }, ul, h('button', { class: 'icon-btn sm', 'aria-label': 'Play the line', html: ICONS.play, onclick: () => speak(L.notice.de, { el: ul }) })), h('p', {}, L.notice.q)));
  const noteBox = h('div', { class: 'stack', hidden: true }); noteBox.append(fbEl('note', L.notice.note)); if (L.notice.grammar) noteBox.append(h('button', { class: 'btn ghost sm', style: 'align-self:flex-start', onclick: () => { stopAudio(); renderGrammar(null, L.notice.grammar); } }, 'Open in Grammar'));
  v.append(h('button', { class: 'btn ghost sm', style: 'align-self:flex-start', onclick: e => { noteBox.hidden = false; e.currentTarget.hidden = true; } }, 'Show how it works'), noteBox);
  const ids = ls.newWords || [];
  const next = () => setStep(ids.length ? 'words' : 'words', { wi: 0 }, 'fwd'), back = () => setStep('scene', {}, 'back');
  actionBar({ buttons: [h('button', { class: 'btn ghost', onclick: back }, 'Back'), h('button', { class: 'btn', onclick: next }, 'Meet the words')] });
  KEYS = e => { if (e.key === 'Enter') next(); if (e.key === 'ArrowLeft') back(); };
}
function lessonWords(v, L, ls) {
  if (!ls.newWords) { ls.newWords = L.words.filter(w => !isLearned(w.de)).map(w => w.de); save('progress'); }
  const ids = ls.newWords, yours = L.words.filter(w => !ids.includes(w.de));
  const w = L.words.find(x => x.de === ids[ls.wi]);
  const yoursRow = () => yours.length ? h('div', { class: 'stack', style: 'gap:8px' }, h('div', { class: 'eyebrow' }, 'Already yours · tap to look again'), h('div', { class: 'row' }, ...yours.map(y => h('button', { class: 'chip yours', style: 'cursor:pointer;min-height:36px', onclick: () => openWordSheet(y.de.replace(/^(der|die|das) /, '')) }, y.de)))) : '';
  if (!w) {
    if (!ids.length) {
      v.append(lessonTop(L, ls, 1), h('div', { class: 'card stack center' }, h('h1', {}, 'You know them all'), h('p', { class: 'muted' }, 'Every word in this lesson is already yours. They still come up in Build it and the conversation.')), yoursRow());
      const next = () => setStep('check', { checkQ: null }, 'fwd'); actionBar({ buttons: [h('button', { class: 'btn ghost', onclick: () => setStep('notice', {}, 'back') }, 'Back'), h('button', { class: 'btn', onclick: next }, 'Continue')] }); KEYS = e => { if (e.key === 'Enter') next(); }; return;
    }
    setStep('check', { checkQ: null }, 'fwd'); return;
  }
  v.append(lessonTop(L, ls, ls.wi / ids.length), h('div', { class: 'eyebrow' }, `New ${w.type === 'phrase' ? 'phrase' : 'word'} ${ls.wi + 1} of ${ids.length}`));
  v.append(wordCard(w));
  if (ls.wi === 0) v.append(yoursRow());
  const next = () => setStep('words', { wi: ls.wi + 1 }, 'fwd'), prev = () => ls.wi > 0 ? setStep('words', { wi: ls.wi - 1 }, 'back') : setStep('notice', {}, 'back');
  actionBar({ buttons: [h('button', { class: 'btn ghost', onclick: prev }, 'Back'), h('button', { class: 'btn', onclick: next }, ls.wi + 1 < ids.length ? 'Next word' : 'Check the words')] });
  if (S.settings.autoWord) setTimeout(() => speak(w.de.replace(/^(der|die|das) /, '')), 280);
  KEYS = e => { if (e.key === 'Enter' || e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); };
}

/* ---------- completion ticket ---------- */
function lessonDone(v, L, ls) {
  const s = ls.summary || { missed: 0, first: 0, total: 0, added: 0 }; const c = courseOf(L.n);
  const acc = s.total ? Math.round(100 * s.first / s.total) : 100;
  v.append(lessonTop(L, ls, 1));
  const learnedWords = (ls.newWords || []).map(d => L.words.find(w => w.de === d)).filter(Boolean);
  const n1 = h('div', { class: 'n' }, '0'), n2 = h('div', { class: 'n' }, '0'), n3 = h('div', { class: 'n' }, '0');
  v.append(h('div', { class: 'ticket' },
    h('div', { class: 'top' }, h('b', {}, 'Protoa · Fahrschein'), h('span', {}, 'Lesson ' + L.n)),
    h('div', { class: 'body' }, h('div', { class: 'eyebrow' }, 'Station erreicht'), h('h1', { lang: 'de' }, c.station), (() => { const st = h('div', { class: 'stamp' }, sigEl(c.icon)); const pic = typeof NIGHT_SCENE !== 'undefined' && NIGHT_SCENE[L.scene.plate || 'plate.' + L.scene.id]; if (pic) { st.classList.add('pic'); st.style.backgroundImage = `url(art/night/scenes/${pic}.jpg)`; } return st; })(), h('p', { class: 'muted' }, 'You can now ' + L.can)),
    h('div', { class: 'perf', 'aria-hidden': 'true' }),
    learnedWords.length ? h('div', { class: 'learned', role: 'list', 'aria-label': 'Words from this lesson' }, ...learnedWords.map(w => { const c = wordChip(w); c.setAttribute('role', 'listitem'); return c; })) : '',
    h('div', { class: 'stats' }, h('div', { class: 'stat' }, n1, h('div', { class: 'l' }, 'words added')), h('div', { class: 'stat' }, h('div', { class: 'row', style: 'gap:0;align-items:baseline' }, n2, h('span', { class: 'n' }, '%')), h('div', { class: 'l' }, 'first try')), h('div', { class: 'stat' }, n3, h('div', { class: 'l' }, 'lines to review')))));
  setTimeout(() => { countUp(n1, s.added ?? L.words.length); countUp(n2, acc); countUp(n3, s.missed); }, 350);
  const weiter = () => { S.progress.lessonState = null; save('progress'); lastSegs = null; NAV = 'fade'; go('learn'); };
  actionBar({ buttons: [h('button', { class: 'btn', onclick: weiter }, 'Continue')] }); KEYS = e => { if (e.key === 'Enter') weiter(); };
}

/* ---------- re-layout the map on resize ---------- */
let mapResizeT = null;
window.addEventListener('resize', () => { clearTimeout(mapResizeT); mapResizeT = setTimeout(() => { if (route === 'learn' && document.querySelector('.kline')) render(); }, 200); });
