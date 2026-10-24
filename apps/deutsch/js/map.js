/* ===================== §18: course map, station preview, one-idea lesson screens, ticket ===================== */
let NAV = 'fade'; // direction of the next screen change: 'fwd' slides in from the right, 'back' from the left
let lastSegs = null; // progress bar state of the previous lesson screen, so the bar grows instead of jumping
const SEG_NAMES = ['Scene', 'Words', 'Check', 'Build', 'Conversation'];
const STEP_SEG = { scene: 0, notice: 0, words: 1, check: 2, build: 3, conv: 4, done: 5 };
function sigEl(icon, cls = '') { const s = h('span', { class: 'sig ' + cls, 'aria-hidden': 'true' }); s.innerHTML = ICON[icon] || ICON.question; return s; }
const rangeN = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/* ---------- model ---------- */
function currentLessonN() {
  const written = allLessons().map(l => l.n), done = new Set(S.progress.lessonsDone), ls = S.progress.lessonState;
  if (ls && written.includes(ls.n) && !done.has(ls.n)) return ls.n;
  return written.sort((a, b) => a - b).find(n => !done.has(n)) ?? null;
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

/* ---------- the map ---------- */
function renderMap(v) {
  const { items, cur } = mapModel();
  const wordsYours = learnedCount();
  v.append(h('div', { class: 'map-head' }, teacherSlot(52, 'neutral'), h('div', { class: 'grow' }, h('h1', {}, 'Deine Linie'), h('div', { class: 'faint' }, `U-Bahn to spoken B1 · ${S.progress.lessonsDone.length} of ${COURSE.length} stations · ${wordsYours} words yours`))));
  v.append(levelTrack());
  const map = h('div', { class: 'map', role: 'list', 'aria-label': 'Course map' }); v.append(map);
  const W = map.clientWidth || 360; const cx = W / 2, amp = Math.min(W * .22, 120);
  // vertical rhythm on the 8px grid
  const GAP = { start: 112, chapter: 168, lesson: 152, review: 112, term: 136, exam: 168 };
  let y = 72, k = 0; const pts = [];
  items.forEach(it => {
    if (it.kind === 'chapter') { it.y = y + 16; y += GAP.chapter; return; }
    it.x = cx + amp * Math.sin((k + .5) * Math.PI / 3); it.y = y; pts.push(it); k++; y += GAP[it.kind];
  });
  const H = y + 24; map.style.height = H + 'px';
  // background: street grid, the Spree, parks, landmark silhouettes at chapter breaks
  const chs = items.filter(i => i.kind === 'chapter');
  let bg = `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(14)"><path d="M56 0H0V56" fill="none" style="stroke:var(--map-ink)" stroke-width="2"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#grid)"/>`;
  for (let i = 0; i < Math.ceil(H / 520); i++) { const py = 260 + i * 520, px = (i % 2 ? W * .82 : W * .14); bg += `<ellipse cx="${px}" cy="${py}" rx="${W * .16}" ry="70" style="fill:var(--map-park)"/>`; }
  chs.forEach((c, i) => {
    if (i === 0) { const sy = c.y + 92; bg += `<path d="M-20 ${sy} C ${W * .25} ${sy - 40}, ${W * .55} ${sy + 50}, ${W + 20} ${sy - 10}" fill="none" style="stroke:var(--map-water)" stroke-width="56" stroke-linecap="round"/>`; }
    const left = i % 2 === 0, s = Math.min(1.2, W / 420), lx = left ? 8 : W - 8 - 120 * s, ly = c.y - 40 - 120 * s;
    bg += `<g transform="translate(${lx} ${ly}) scale(${s})" style="fill:var(--line)">${LANDMARK[c.ch.mark]}</g>`;
  });
  bg += '</svg>';
  map.insertAdjacentHTML('beforeend', bg);
  // the line
  let d = `M ${pts[0].x} ${pts[0].y}`; const segs = [d];
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dy = b.y - a.y; const s = ` C ${a.x} ${a.y + dy * .5} ${b.x} ${b.y - dy * .5} ${b.x} ${b.y}`; d += s; segs.push(d); }
  map.insertAdjacentHTML('beforeend', `<svg class="line" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="line-ahead" d="${d}" fill="none" stroke-width="12" stroke-linecap="round"/><path class="line-done" d="${d}" fill="none" stroke-width="12" stroke-linecap="round"/><path class="measure" d="" fill="none" stroke="none"/></svg>`);
  const lineSvg = map.querySelector('svg.line'), donePath = lineSvg.querySelector('.line-done'), meas = lineSvg.querySelector('.measure');
  const total = donePath.getTotalLength();
  pts.forEach((p, i) => { meas.setAttribute('d', segs[i]); p.len = i ? meas.getTotalLength() : 0; });
  // stations
  let nowEl = null, firstSoonDone = false;
  items.forEach(it => {
    if (it.kind === 'chapter') { map.append(h('div', { class: 'chapter', style: `top:${it.y}px` }, h('div', { class: 'num' }, it.num), h('div', {}, h('b', { lang: 'de' }, it.ch.de), h('span', {}, it.ch.en)))); return; }
    const el = stationEl(it, W, cx, !firstSoonDone && it.kind === 'lesson' && it.state === 'soon');
    if (it.kind === 'lesson' && it.state === 'soon') firstSoonDone = true;
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; map.append(el); it.el = el;
    if (it.state === 'now') nowEl = el;
  });
  // where the train stands
  const lessonPt = n => pts.find(p => p.kind === 'lesson' && p.n === n);
  const lastDone = [...pts].reverse().find(p => p.kind === 'lesson' && p.state === 'done');
  const target = pts.find(p => p.state === 'now') || (cur ? lessonPt(cur) : null) || lastDone || pts[0];
  const parkLen = p => Math.max(0, p.len - 62);
  const train = h('div', { class: 'train', 'aria-hidden': 'true' }); train.innerHTML = `<svg viewBox="-36 -36 72 72">${TRAIN_SVG}</svg>`; map.append(train);
  const place = L => { const a = donePath.getPointAtLength(Math.max(0, L)), b = donePath.getPointAtLength(Math.min(total, L + 1)); const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI; train.style.transform = `translate(${a.x}px,${a.y}px) rotate(${ang}deg)`; };
  const setDone = L => { donePath.setAttribute('stroke-dasharray', `${Math.max(0.01, L)} ${total + 20}`); };
  const fromN = S.progress.trainAt, from = fromN ? lessonPt(fromN) : null;
  const animate = cur && from && fromN < cur && target.kind === 'lesson' && !reduced();
  if (animate) {
    from.el?.classList.add('just-done');
    const L0 = parkLen(from), L1 = parkLen(target), D0 = from.len, D1 = target.len, t0 = performance.now(), dur = 1200;
    place(L0); setDone(D0);
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = ease(p); place(L0 + (L1 - L0) * e); setDone(D0 + (D1 - D0) * e); if (p < 1) requestAnimationFrame(step); else { target.el?.classList.add('arrive'); } };
    setTimeout(() => requestAnimationFrame(t => { requestAnimationFrame(step); }), 350);
  } else { place(parkLen(target)); setDone(target.len); }
  if (S.progress.trainAt !== (cur || (lastDone && lastDone.n) || 0)) { S.progress.trainAt = cur || (lastDone && lastDone.n) || 0; save('progress'); }
  // scroll the current station to a third from the top; a pill brings it back when it scrolls away
  const focusY = () => map.getBoundingClientRect().top + window.scrollY + target.y - window.innerHeight / 3;
  requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, focusY()), behavior: 'auto' }));
  if (nowEl && 'IntersectionObserver' in window) {
    const pill = h('button', { class: 'weiter', hidden: true, onclick: () => window.scrollTo({ top: Math.max(0, focusY()), behavior: reduced() ? 'auto' : 'smooth' }) }, h('span', { class: 'arrow' }, '↓'), 'Weiter');
    document.body.append(pill);
    const io = new IntersectionObserver(([e]) => { pill.hidden = e.isIntersecting; pill.firstChild.textContent = e.boundingClientRect.top < 0 ? '↑' : '↓'; }, { threshold: .1 });
    io.observe(nowEl.querySelector('.mk')); pill._io = io;
  }
}
function stationEl(it, W, cx, firstSoon) {
  const right = it.x <= cx; const st = h('div', { class: `st ${it.kind === 'review' ? 'rv' : it.kind} ${it.state} ${right ? 'lab-r' : 'lab-l'}`, role: 'listitem' });
  const r = it.kind === 'exam' ? 44 : it.state === 'now' ? 48 : it.kind === 'review' ? 26 : it.kind === 'start' ? 28 : 36;
  const room = Math.max(96, right ? W - (it.x + r + 16) - 16 : it.x - r - 16 - 16);
  const tappable = it.state !== 'soon';
  let label, icon, aria;
  if (it.kind === 'lesson') { label = [h('b', { lang: 'de' }, it.c.station), h('span', {}, it.c.topic)]; icon = sigEl(it.c.icon); aria = `${it.c.station}, lesson ${it.n}: ${it.c.topic}, ${({ done: 'done', now: 'current station', locked: 'locked', soon: 'coming soon' })[it.state]}`; }
  else if (it.kind === 'review') { label = [h('b', { lang: 'de' }, 'Wiederholung'), h('span', {}, 'Review of ' + courseOf(it.from).station + ' – ' + courseOf(it.to).station)]; icon = sigEl('review'); aria = 'Review stop, ' + it.state; }
  else if (it.kind === 'exam') { label = [h('b', { lang: 'de' }, 'Prüfung ' + it.code), h('span', {}, it.state === 'done' ? 'bestanden' : it.state === 'now' ? 'Exam ready · pass at 90 %' : 'after this lesson')]; icon = sigEl('exam'); aria = 'Level exam ' + it.code + ', ' + it.state; }
  else if (it.kind === 'start') { label = [h('b', { lang: 'de' }, 'Laute'), h('span', {}, 'Lesson 0 · Sounds')]; icon = sigEl('sound'); aria = 'Lesson 0, Sounds'; }
  else { label = [h('b', { lang: 'de' }, 'Endstation B1'), h('span', {}, 'Spoken B1')]; icon = sigEl('terminus'); aria = 'Terminus: spoken B1'; }
  const mk = tappable ? h('button', { class: 'mk', 'aria-label': aria, onclick: () => openStation(it) }) : h('div', { class: 'mk', 'aria-label': aria, role: 'img' });
  mk.append(icon);
  if (it.state === 'done' && it.kind === 'lesson') { const t = h('span', { class: 'tick', 'aria-hidden': 'true' }); t.innerHTML = CHECK_SVG; mk.append(t); }
  if (it.state === 'locked' && it.kind === 'lesson') { const l = h('span', { class: 'lock', 'aria-hidden': 'true' }); l.innerHTML = LOCK_SVG; mk.append(l); }
  const lab = h('div', { class: 'lab', style: `max-width:${room}px` }, ...label);
  if (it.state === 'soon' && it.kind !== 'term') lab.append(h('span', { class: 'soon' }, 'Bald'));
  if (firstSoon) lab.append(h('button', { class: 'btn ghost sm write', onclick: generateLesson }, 'Write it with Claude'));
  st.append(mk, lab); return st;
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
  if (it.kind === 'exam') return it.state === 'done' ? toast('Prüfung ' + it.code + ' bestanden') : openExamPreview(it.code);
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
    if (blk) { p.append(h('div', { class: 'fb note' }, `You have reached ${blk.words.toLocaleString()} words: the ${blk.code} milestone. Pass the ${blk.code} exam with 90 % to continue the line.`), h('button', { class: 'btn', onclick: () => { close(); openExamPreview(blk.code); } }, 'Go to the ' + blk.code + ' exam')); inner.append(p); return; }
    if (done) p.append(h('button', { class: 'btn', onclick: () => go_(true) }, 'Review again'));
    else if (inProg) p.append(h('button', { class: 'btn', onclick: () => go_(false) }, 'Continue · ' + (SEG_NAMES[STEP_SEG[ls.step]] || 'where you left off')));
    else if (n === cur) p.append(h('button', { class: 'btn', onclick: () => go_(false) }, 'Start'));
    else { p.append(h('p', { class: 'faint' }, 'Comes after ' + courseOf(cur || n - 1).station + '. You can still go ahead.')); p.append(h('button', { class: 'btn ghost', onclick: () => go_(false) }, 'Start anyway')); }
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
  v.append(h('div', { class: 'coach' }, h('div', { class: 'say' }, h('span', { lang: 'de' }, 'Guten Tag! Kommen Sie herein.'), h('div', { class: 'faint' }, 'Hello! Come in.'))));
  const next = () => setStep('notice', {}, 'fwd');
  actionBar({ buttons: [h('button', { class: 'btn', onclick: next }, 'Weiter')] }); KEYS = e => { if (e.key === 'Enter') next(); };
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
      const next = () => setStep('check', { checkQ: null }, 'fwd'); actionBar({ buttons: [h('button', { class: 'btn ghost', onclick: () => setStep('notice', {}, 'back') }, 'Back'), h('button', { class: 'btn', onclick: next }, 'Weiter')] }); KEYS = e => { if (e.key === 'Enter') next(); }; return;
    }
    setStep('check', { checkQ: null }, 'fwd'); return;
  }
  v.append(lessonTop(L, ls, ls.wi / ids.length), h('div', { class: 'eyebrow' }, `New word ${ls.wi + 1} of ${ids.length}`));
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
    h('div', { class: 'body' }, h('div', { class: 'eyebrow' }, 'Station erreicht'), h('h1', { lang: 'de' }, c.station), h('div', { class: 'stamp' }, sigEl(c.icon)), h('p', { class: 'muted' }, 'You can now ' + L.can)),
    h('div', { class: 'perf', 'aria-hidden': 'true' }),
    learnedWords.length ? h('div', { class: 'learned', role: 'list', 'aria-label': 'Words from this lesson' }, ...learnedWords.map(w => { const c = wordChip(w); c.setAttribute('role', 'listitem'); return c; })) : '',
    h('div', { class: 'stats' }, h('div', { class: 'stat' }, n1, h('div', { class: 'l' }, 'words added')), h('div', { class: 'stat' }, h('div', { class: 'row', style: 'gap:0;align-items:baseline' }, n2, h('span', { class: 'n' }, '%')), h('div', { class: 'l' }, 'first try')), h('div', { class: 'stat' }, n3, h('div', { class: 'l' }, 'lines to review')))));
  setTimeout(() => { countUp(n1, s.added ?? L.words.length); countUp(n2, acc); countUp(n3, s.missed); }, 350);
  const weiter = () => { S.progress.lessonState = null; save('progress'); lastSegs = null; NAV = 'fade'; go('learn'); };
  actionBar({ buttons: [h('button', { class: 'btn', onclick: weiter }, 'Weiter')] }); KEYS = e => { if (e.key === 'Enter') weiter(); };
}

/* ---------- re-layout the map on resize ---------- */
let mapResizeT = null;
window.addEventListener('resize', () => { clearTimeout(mapResizeT); mapResizeT = setTimeout(() => { if (route === 'learn' && document.querySelector('.map')) render(); }, 200); });
