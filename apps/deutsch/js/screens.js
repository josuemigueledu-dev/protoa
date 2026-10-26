/* ===================== Layout modes, Sprechen, Profile & stats, Stempelheft, Practice hub ===================== */
Object.assign(ICONS, {
  talk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4l2.5 8z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
});
const NAV_ITEMS = [['today', 'Today'], ['learn', 'Lessons'], ['practice', 'Practice'], ['talk', 'Sprechen'], ['grammar', 'Grammar'], ['profile', 'Profile']];
const DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/* ---------- layout ---------- */
function layoutMode() { const s = S.settings.layout || 'auto'; if (s === 'desktop' || s === 'mobile') return s; const w = window.innerWidth || 1024; return w >= 1024 ? 'desktop' : w < 640 ? 'mobile' : 'tablet'; }
function applyLayout() { const m = layoutMode(); ['mobile', 'tablet', 'desktop'].forEach(x => document.body.classList.toggle('lay-' + x, x === m)); return m; }
let lastLayout = null;
window.addEventListener('resize', () => { const m = layoutMode(); if (m !== lastLayout) { lastLayout = m; NAV = 'fade'; render(); } });
function navBadge(id) { if (id === 'practice') { const n = dueCards().length; return n ? h('span', { class: 'badge', 'aria-label': n + ' due' }, n > 99 ? '99+' : n) : ''; } return ''; }
function renderSidebar() {
  const sb = document.getElementById('sidebar'); if (!sb) return; sb.innerHTML = '';
  sb.append(h('div', { class: 'brand' }, h('span', { class: 'dot', 'aria-hidden': 'true', html: BRAND_MARK }), h('span', { class: 'name' }, 'protoa')));
  NAV_ITEMS.forEach(([id, label]) => sb.append(h('button', { class: 'nav', 'aria-current': (route === id || (id === 'profile' && route === 'more')) ? 'page' : null, onclick: () => go(id), title: label }, h('span', { html: ICONS[id === 'learn' ? 'learn' : id], style: 'display:contents' }), h('span', {}, label), navBadge(id))));
  sb.append(h('div', { class: 'spacer' }));
  const t = todayInfo();
  sb.append(h('button', { class: 'goalmini', onclick: () => go('profile'), title: 'Your day' }, ringEl(Math.min(1, t.mins / Math.max(1, S.settings.minutes)), 48), h('div', { class: 'txt' }, h('b', {}, `${t.mins} of ${S.settings.minutes} min`), h('span', {}, t.words >= goalInfo().perDay ? `${t.words} new words today · goal met` : `${t.words} of ${goalInfo().perDay} new words today`))));
  sb.append(h('div', { class: 'kbdhint' }, h('span', { class: 'kbd' }, '?'), ' shortcuts · ', h('span', { class: 'kbd' }, 'Ctrl K'), ' search'));
}

/* ---------- time on task: counts active minutes (page visible + interaction in the last 60 s) ---------- */
let lastAct = Date.now(), tickCount = 0;
['pointerdown', 'keydown', 'scroll'].forEach(e => window.addEventListener(e, () => { lastAct = Date.now(); }, { passive: true, capture: true }));   // capture: #app's scroll does not bubble
setInterval(() => {
  newDayCheck();
  if (!S.progress || document.hidden || Date.now() - lastAct > 60000) return;
  const t = todayStr(); S.progress.days[t] = S.progress.days[t] || { new: 0, reviews: 0 }; S.progress.days[t].secs = (S.progress.days[t].secs || 0) + 15;
  const ls = S.progress.lessonState; if (route === 'learn' && ls && !ls.paused && ls.step !== 'done') ls.secs = (ls.secs || 0) + 15;   // the lesson's own clock, for its Done screen
  if (++tickCount % 4 === 0) { save('progress'); if (document.body.classList.contains('lay-desktop') && !document.body.classList.contains('in-lesson')) renderSidebar(); }
}, 15000);
// an app left open overnight (a phone asleep, a laptop lid shut) shows the new day when it is looked at again:
// due words, the goal ring, the week strip. Never under the learner mid-lesson, review, talk or exam, or over a sheet.
function newDayCheck() { if (renderedDay && !document.hidden && todayStr() !== renderedDay && !document.body.classList.contains('in-lesson') && !document.querySelector('.sheet')) render(); }
document.addEventListener('visibilitychange', newDayCheck); window.addEventListener('pageshow', newDayCheck);
function todayInfo() { const d = (S.progress.days || {})[todayStr()] || {}; return { mins: Math.round((d.secs || 0) / 60), words: d.new || 0, reviews: d.reviews || 0 }; }
function dayKey(offset) { return addDays(todayStr(), offset); }

/* ---------- widgets ---------- */
function weekWidget() {
  const t = todayStr(), dow = (new Date(t + 'T12:00:00').getDay() + 6) % 7, goal = Math.max(1, S.settings.minutes);
  const wk = h('div', { class: 'week', role: 'list', 'aria-label': 'This week' });
  for (let i = 0; i < 7; i++) {
    const d = addDays(t, i - dow), rec = (S.progress.days || {})[d] || {}, mins = Math.round((rec.secs || 0) / 60), frac = d > t ? 0 : Math.min(1, mins / goal);
    const active = (rec.new || 0) + (rec.reviews || 0) > 0 || mins > 0;
    const ring = ringEl(active && frac === 0 ? .08 : frac, 36); if (frac >= 1) ring.classList.add('full');
    wk.append(h('div', { class: 'd' + (d === t ? ' today' : ''), role: 'listitem', title: `${d}: ${mins} min, ${rec.new || 0} new words, ${rec.reviews || 0} reviews` }, ring, DAYS_EN[i]));
  }
  const ti = todayInfo();
  return h('div', { class: 'widget' }, h('div', { class: 'wh' }, h('h2', {}, 'This week'), h('span', { class: 'faint' }, `today ${ti.mins} of ${S.settings.minutes} min`)), wk);
}
function satzDesTages() {
  const pool = Object.values(S.cards).flatMap(sh => Object.keys(sh.w || {})).filter(id => !id.startsWith('s:')).map(wordDef).filter(d => d && d.ex && d.exG);
  if (!pool.length) return null;
  let hsh = 0; for (const ch of todayStr()) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0; const w = pool[hsh % pool.length];
  const ex = w.ex.replace(/[\[\]]/g, ''), ul = glossEl(ex, w.exG);
  return h('div', { class: 'widget satz' }, h('div', { class: 'wh' }, h('h2', {}, 'Sentence of the day'), h('button', { class: 'icon-btn sm', 'aria-label': 'Play the sentence', html: ICONS.play, onclick: () => speak(ex, { el: ul }) })), ul, h('div', { class: 'faint' }, w.exEn));
}
function forecast(days) {
  const t = todayStr(), out = Array(days).fill(0);
  for (const sh of Object.values(S.cards)) for (const c of Object.values(sh.w || {})) { if (!c.learned) continue; for (const k of ['r', 'p']) { if (!c[k]) continue; const off = Math.max(0, daysBetween(t, c[k][0])); if (off < days) out[off]++; } }
  return out;
}
function forecastWidget() {
  const f = forecast(7), max = Math.max(1, ...f);
  return h('div', { class: 'widget' }, h('div', { class: 'wh' }, h('h2', {}, 'Reviews ahead'), h('span', { class: 'faint' }, f[0] + ' due today')),
    h('div', { class: 'minibars', role: 'img', 'aria-label': 'Reviews due over the next 7 days: ' + f.join(', ') }, ...f.map((n, i) => h('i', { class: n ? '' : 'zero', style: `height:${Math.max(3, n / max * 100)}%`, title: `${i === 0 ? 'today' : dayKey(i)}: ${n}` }))),
    h('div', { class: 'minilab' }, h('span', {}, 'today'), h('span', {}, 'in 6 days')));
}
function nextStationWidget() {
  const g = examGate(); if (g) return h('div', { class: 'widget' }, h('div', { class: 'wh' }, h('h2', {}, g.code + ' exam')), h('p', { class: 'faint' }, 'You reached ' + g.words.toLocaleString('en') + ' words. Pass the exam with 90% to continue the line.'), h('button', { class: 'btn sm', onclick: () => openExamPreview(g.code) }, 'Open the exam'));
  const n = currentLessonN(); if (!n) return null; const c = courseOf(n), L = lessonById(n);
  return h('div', { class: 'widget' }, h('div', { class: 'wh' }, h('h2', {}, 'Next lesson')), h('div', { class: 'nextcard' }, sigEl(c.icon), h('div', { class: 'grow' }, h('b', Object.assign(deLang(L.theme), { style: 'font-family:var(--display)' }), L.theme || L.title), h('div', { class: 'faint' }, 'Lesson ' + n + ' · ' + L.title))), h('button', { class: 'btn sm', onclick: () => openOnMap(n) }, 'Show on the map'));
}
function stationListWidget() {
  const { items } = mapModel(); const list = h('div', { class: 'stlist' });
  items.filter(i => i.kind === 'lesson').forEach(it => {
    const row = it.state === 'soon' ? h('div', { class: 'soonrow' }) : h('button', { onclick: () => openStation(it) });
    row.append(sigEl(it.c.icon), h('div', {}, h('span', deLang(it.L && it.L.theme), it.L ? it.L.theme || it.L.title : it.c.topic), h('small', {}, 'Lesson ' + it.n + (it.L ? ' · ' + it.L.title : ''))), h('span', { class: 'tag chip' + (it.state === 'done' ? ' ok' : it.state === 'now' ? ' yours' : '') }, ({ done: 'done', now: 'now', locked: 'next', soon: 'soon' })[it.state]));
    list.append(row);
  });
  return h('div', { class: 'widget' }, h('div', { class: 'wh' }, h('h2', {}, 'All lessons'), h('span', { class: 'faint' }, S.progress.lessonsDone.length + ' of ' + COURSE.length)), list);
}
function strengthCounts() {
  const b = [0, 0, 0, 0];
  for (const sh of Object.values(S.cards)) for (const c of Object.values(sh.w || {})) { if (!c.learned || c.sent || !c.r) continue; const iv = c.r[1]; b[iv < 4 ? 0 : iv < 14 ? 1 : iv < 30 ? 2 : 3]++; }
  return b;
}
function strengthBar() {
  const b = strengthCounts(), tot = Math.max(1, b.reduce((a, x) => a + x, 0)), names = ['New (0–3)', 'Learning (4–13)', 'Growing (14–29)', 'Strong (30+)'];
  return h('div', { class: 'stack', style: 'gap:8px' }, h('div', { class: 'strength', role: 'img', 'aria-label': 'Words by days until they come back. ' + names.map((n, i) => n + ': ' + b[i]).join(', ') }, ...b.map((n, i) => n ? h('i', { style: `width:${n / tot * 100}%;background:var(--seq-${i + 1})`, title: `${names[i]}: ${n}` }) : '')),
    h('div', { class: 'legend' }, ...b.map((n, i) => h('span', {}, h('i', { style: `background:var(--seq-${i + 1})` }), names[i] + ' ', h('b', {}, n)))), h('div', { class: 'faint small' }, 'In brackets: days until a word comes back.'));
}
function renderRail() {
  const rail = document.getElementById('rail'); if (!rail) return; rail.innerHTML = '';
  if (!document.body.classList.contains('lay-desktop') || document.body.classList.contains('in-lesson')) return;
  const add = el => el && rail.append(el);
  if (route === 'learn') { add(paceWidget()); add(nextStationWidget()); add(stationListWidget()); add(weekWidget()); }
  else if (route === 'practice') { add(forecastWidget()); add(h('div', { class: 'widget' }, h('h2', {}, 'Word strength'), strengthBar())); add(weekWidget()); }
  else if (route === 'talk') { add(h('div', { class: 'widget' }, h('h2', {}, 'How Sprechen works'), h('p', { class: 'faint' }, 'Protoa keeps to words you know and asks one question at a time. Under each of your lines you see whether it worked and, if not, the corrected sentence with one note on the main error. Corrected lines can go into your reviews at the end.'))); add(satzDesTages()); }
  else if (route === 'profile' || route === 'more') { add(weekWidget()); add(nextStationWidget()); add(satzDesTages()); }
  else { add(paceWidget()); add(weekWidget()); add(forecastWidget()); add(satzDesTages()); }
}

/* ---------- Stempelheft (stamps derived from progress; new ones announced once) ---------- */
function computeStamps() {
  const done = new Set(S.progress.lessonsDone), words = learnedCount(), rv = new Set(S.progress.reviewStops || []);
  const activeDays = Object.values(S.progress.days || {}).filter(d => (d.new || 0) + (d.reviews || 0) > 0 || (d.secs || 0) >= 60).length;
  const reviews = Object.values(S.progress.days || {}).reduce((a, d) => a + (d.reviews || 0), 0), talks = S.progress.talkCount || 0;
  const st = [{ id: 'laute', t: 'Laute', s: 'Lesson 0 · Sounds', icon: 'sound', on: !!S.progress.sounds }];
  COURSE.forEach(c => st.push({ id: 'st' + c.n, t: c.station, s: 'Lesson ' + c.n + ' · ' + c.topic, icon: c.icon, on: done.has(c.n) }));
  [50, 100, 250, 500, 1000, 1500, 2400].forEach(n => st.push({ id: 'w' + n, t: n + ' Wörter', s: n === 2400 ? 'B1 vocabulary' : 'your words', icon: n >= 1000 ? 'bulb' : 'puzzle', on: words >= n }));
  LEVELS.forEach(l => st.push({ id: 'lv' + l.code, t: l.code + ' bestanden', s: 'level exam ≥ 90%', icon: 'exam', on: levelsPassed().includes(l.code) }));
  st.push({ id: 'talk1', t: 'Erstes Gespräch', s: 'Sprechen', icon: 'question', on: talks >= 1 }, { id: 'talk10', t: '10 Gespräche', s: 'Sprechen', icon: 'people', on: talks >= 10 });
  st.push({ id: 'd7', t: '7 Tage', s: 'days practised', icon: 'calendar', on: activeDays >= 7 }, { id: 'd30', t: '30 Tage', s: 'days practised', icon: 'calendar', on: activeDays >= 30 });
  st.push({ id: 'r100', t: '100 Wiederholungen', s: 'reviews', icon: 'review', on: reviews >= 100 }, { id: 'r1000', t: '1000 Wiederholungen', s: 'reviews', icon: 'review', on: reviews >= 1000 });
  (S.progress.perfect || []).forEach(n => st.push({ id: 'pf' + n, t: 'Perfekt', s: 'Lesson ' + n + ' · no misses', icon: courseOf(n).icon, on: true, pf: true }));   // only once earned: no row of 60 empty ones
  for (let n = REVIEW_EVERY; n <= COURSE.length; n += REVIEW_EVERY) st.push({ id: 'R' + n, t: CHAPTERS.some(c => c.from === n + 1) ? 'Kapiteltest' : 'Wiederholung', s: 'after ' + courseOf(n).station, icon: 'review', on: rv.has('R' + n) });
  return st;
}
function checkStamps() {
  if (!S.ready) return; const seen = new Set(S.progress.stampsSeen || []), fresh = computeStamps().filter(s => s.on && !seen.has(s.id));
  if (!fresh.length) return; S.progress.stampsSeen = [...seen, ...fresh.map(s => s.id)]; save('progress');
  toast(fresh.length === 1 ? 'New stamp: ' + fresh[0].t : fresh.length + ' new stamps in your Stempelheft');
}
function stampEl(s, i) { return h('div', { class: 'stp' + (s.on ? ' on r' + (i % 3 + 1) : '') + (s.pf ? ' pf' : ''), title: s.on ? s.t + ' — earned' : s.t + ' — not yet' }, h('div', { class: 'ring2' }, sigEl(s.icon)), h('b', { lang: 'de' }, s.t), h('span', {}, s.s)); }

/* ---------- charts (single series → no legend; text in text colours; hover tooltip on every mark) ---------- */
function barChart(data, opts = {}) {
  const W = 600, H = opts.h || 160, padL = 28, padB = 24, padT = 12, n = data.length, max = Math.max(1, ...data.map(d => d.v)), gap = n > 20 ? 2 : 6;
  const bw = (W - padL - gap * (n - 1)) / n, y = v => padT + (H - padT - padB) * (1 - v / max);
  const niceMax = max;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || '')}" preserveAspectRatio="none" style="height:${H}px">`;
  svg += `<line class="gridl" x1="${padL}" x2="${W}" y1="${y(niceMax)}" y2="${y(niceMax)}"/><text class="ax" x="0" y="${y(niceMax) + 4}">${niceMax}</text><text class="ax" x="0" y="${H - padB + 4}">0</text>`;
  data.forEach((d, i) => {
    const x = padL + i * (bw + gap), top = d.v ? y(d.v) : H - padB - 2, hgt = H - padB - top, r = Math.min(4, bw / 2, hgt);
    const path = d.v ? `M${x} ${H - padB}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + bw - r}Q${x + bw} ${top} ${x + bw} ${top + r}V${H - padB}Z` : `M${x} ${H - padB - 2}h${bw}v2h-${bw}z`;
    svg += `<g class="col" data-i="${i}"><rect class="hit" x="${x - gap / 2}" y="0" width="${bw + gap}" height="${H}"/><path class="mark${d.v ? '' : ' zero'}" d="${path}"/></g>`;
  });
  svg += `<line class="base" x1="${padL}" x2="${W}" y1="${H - padB}" y2="${H - padB}"/>`;
  (opts.xlabels || []).forEach(([i, t]) => { const x = padL + i * (bw + gap) + bw / 2; svg += `<text class="ax" x="${x}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(t)}</text>`; });
  svg += '</svg>';
  const wrap = h('div', { class: 'chart', html: svg }); const tip = h('div', { class: 'ctip', hidden: true }); wrap.append(tip);
  wrap.addEventListener('pointermove', e => { const g = e.target.closest && e.target.closest('g.col'); if (!g) { tip.hidden = true; return; } const d = data[+g.dataset.i], r = g.querySelector('.hit').getBoundingClientRect(), wr = wrap.getBoundingClientRect(); tip.textContent = d.tip; tip.hidden = false; tip.style.left = (r.left + r.width / 2 - wr.left) + 'px'; tip.style.top = (Math.min(...[...g.querySelectorAll('.mark')].map(m => m.getBoundingClientRect().top)) - wr.top) + 'px'; });
  wrap.addEventListener('pointerleave', () => tip.hidden = true);
  return wrap;
}
function heatmap(weeks = 16) {
  const t = todayStr(), dow = (new Date(t + 'T12:00:00').getDay() + 6) % 7, start = addDays(t, -dow - (weeks - 1) * 7);
  const g = h('div', { class: 'heat', role: 'img', 'aria-label': 'Activity over the last ' + weeks + ' weeks' });
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i), rec = (S.progress.days || {})[d] || {}, score = (rec.new || 0) + (rec.reviews || 0) + Math.round((rec.secs || 0) / 60);
    const lvl = d > t ? 'fut' : score === 0 ? '' : score < 10 ? 'l1' : score < 25 ? 'l2' : score < 50 ? 'l3' : 'l4';
    g.append(h('i', { class: lvl, title: d > t ? '' : `${d}: ${rec.new || 0} new, ${rec.reviews || 0} reviews, ${Math.round((rec.secs || 0) / 60)} min` }));
  }
  return g;
}

/* ---------- Profile ---------- */
function examHistory() { const ex = (S.progress.exams || []).slice().reverse(); if (!ex.length) return h('p', { class: 'faint' }, 'Each level ends with an exam modelled on the Goethe-Zertifikat. You pass at 90%.'); return h('div', { class: 'stack', style: 'gap:4px' }, ...ex.slice(0, 6).map(e => h('div', { class: 'row', style: 'justify-content:space-between' }, h('span', {}, e.code + ' exam · ' + fmtDate(e.date)), h('span', { class: 'chip' + (e.passed ? ' ok' : '') }, e.score + '%' + (e.passed ? ' · passed' : ''))))); }
function renderProfile(v) {
  checkStamps();
  const p = S.profile, days = S.progress.days || {}, keys = Object.keys(days).sort(), since = keys[0] || todayStr();
  const activeDays = Object.values(days).filter(d => (d.new || 0) + (d.reviews || 0) > 0 || (d.secs || 0) >= 60).length;
  const mins = Math.round(Object.values(days).reduce((a, d) => a + (d.secs || 0), 0) / 60), words = learnedCount();
  // Night Glass: Protoa in a navy badge, the goal and how far along it you are, then the numbers and your class
  const g = goalInfo();
  v.append(h('div', { class: 'prof' }, h('div', { class: 'avatar orbbadge', 'aria-hidden': 'true' }, h('img', { src: 'art/night/orb.png', alt: '' })), h('div', { class: 'grow' }, h('h1', {}, p.name || 'Your profile'), h('div', { class: 'faint' }, (p.city ? p.city + ' · ' : '') + 'learning German since ' + fmtDate(since)), h('button', { class: 'btn ghost sm', onclick: () => openMore(renderSettings) }, 'Settings'))));
  v.append(h('div', { class: 'goalline' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', {}, 'Goal: spoken ' + (S.settings.level || 'B1')), h('span', { class: 'faint' }, g.date ? 'by ' + fmtDate(g.date) : '')), h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(g.pct) }, h('i', { style: `width:${Math.max(2, g.pct)}%` })), h('div', { class: 'row faint', style: 'justify-content:space-between' }, h('span', {}, g.learned.toLocaleString('en') + ' of ' + (S.settings.target || 2400).toLocaleString('en') + ' words'), h('span', {}, g.pct + '%'))));
  const kpi = (n, l) => h('div', { class: 'kpi' }, h('div', { class: 'n' }, n), h('div', { class: 'l' }, l));
  v.append(h('div', { class: 'kpis' }, kpi(words, 'your words'), kpi(S.progress.lessonsDone.length + '/' + COURSE.length, 'lessons'), kpi(activeDays, activeDays === 1 ? 'day practised' : 'days practised'), kpi(mins, mins === 1 ? 'minute' : 'minutes')));
  const cls = [['weber', 'Herr Weber', 'teacher'], ['ana', 'Ana', 'from Mexico City'], ['lena', 'Lena', 'from Rome'], ['murat', 'The barista', 'café next door']];
  v.append(h('div', { class: 'card stack classcard' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', {}, 'Your class'), h('span', { class: 'faint' }, 'Room 2.04 · Tue and Thu')),
    h('div', { class: 'classrow' }, ...cls.map(([id, name, sub]) => h('div', { class: 'mate' }, h('span', { class: 'face', style: `background-image:url(art/night/ava-${id}.jpg)`, role: 'img', 'aria-label': name }), h('b', {}, name), h('span', { class: 'faint' }, sub))))));
  v.append(h('div', { class: 'card stack' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', {}, 'Levels'), h('span', { class: 'faint' }, 'goal: ' + (S.settings.level || 'B1'))), levelTrack(), examHistory()));
  v.append(paceWidget());
  // words per day (30)
  const last30 = Array.from({ length: 30 }, (_, i) => { const d = dayKey(i - 29), r = days[d] || {}; return { v: r.new || 0, tip: `${d}: ${r.new || 0} new words` }; });
  v.append(h('div', { class: 'card stack' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', {}, 'New words per day'), h('span', { class: 'faint' }, 'last 30 days')), barChart(last30, { label: 'New words per day, last 30 days', xlabels: [[0, dayKey(-29).slice(5)], [29, 'today']] })));
  // accuracy + forecast
  let tot = 0, good = 0; const cut = dayKey(-30);
  for (const sh of Object.values(S.cards)) for (const c of Object.values(sh.w || {})) for (const [d, , g] of (c.hist || [])) if (d >= cut) { tot++; if (g >= 2) good++; }
  const f = forecast(14);
  v.append(h('div', { class: 'card stack' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', {}, 'Reviews ahead'), h('span', { class: 'faint' }, tot ? `${Math.round(100 * good / tot)}% recalled · ${tot} review${tot === 1 ? '' : 's'} in 30 days` : 'no reviews in the last 30 days')),
    barChart(f.map((n, i) => ({ v: n, tip: `${i === 0 ? 'today (incl. overdue)' : dayKey(i)}: ${n} due` })), { label: 'Reviews due, next 14 days', h: 140, xlabels: [[0, 'today'], [13, '+13 days']] })));
  v.append(h('div', { class: 'card stack' }, h('h2', {}, 'Word strength'), strengthBar()));
  v.append(h('div', { class: 'card stack' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', {}, 'Activity'), h('span', { class: 'faint' }, 'last 16 weeks')), heatmap(16), h('div', { class: 'legend' }, h('span', {}, 'less'), ...[0, 1, 2, 3, 4].map(i => h('i', { style: `background:var(--heat-${i})` })), h('span', {}, 'more'))));
  const stamps = computeStamps(), got = stamps.filter(s => s.on).length;
  const sorted = [...stamps.filter(s => s.on), ...stamps.filter(s => !s.on)];
  v.append(h('div', { class: 'card stack' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', { lang: 'de' }, 'Stempelheft'), h('span', { class: 'faint' }, got + ' of ' + stamps.length + ' stamps')), h('div', { class: 'stamps', id: 'stamp-grid' }, ...sorted.slice(0, got + 10).map(stampEl)), stamps.length > got + 10 ? h('button', { class: 'btn ghost sm', style: 'align-self:flex-start', onclick: e => { const g = document.getElementById('stamp-grid'); g.innerHTML = ''; sorted.forEach((s, i) => g.append(stampEl(s, i))); e.currentTarget.remove(); } }, 'Show all ' + stamps.length + ' stamps') : ''));
  const links = [['Grammar reference', 'Verb position, gender, endings…', () => go('grammar')], ['Lesson 0 · Sounds', 'German spelling to sound, once', () => openMore(renderSounds)], ['Method', 'Why each feature exists, with sources', () => openMore(renderMethod)], ['Settings', 'Goal, about me, audio, theme, voice, moving your progress', () => openMore(renderSettings)]];
  links.forEach(([t, d, fn]) => v.append(h('button', { class: 'card listrow', onclick: fn }, h('div', { class: 'grow' }, h('b', {}, t), h('div', { class: 'faint' }, d)), h('span', { class: 'muted', 'aria-hidden': 'true' }, '›'))));
}

/* ---------- Practice hub ---------- */
let REVIEW_SUMMARY = null;
function renderPracticeHub(v) {
  if (REVIEW_SUMMARY) { renderReviewSummary(v); return; }
  const due = dueCards(), learnedAll = Object.values(S.cards).flatMap(sh => Object.entries(sh.w || {})).filter(([id, c]) => c.learned && !c.sent);
  v.append(h('div', { class: 'pagehead' }, teacherSlot(52, 'neutral'), h('div', {}, h('h1', {}, 'Practice'), h('div', { class: 'faint' }, 'Every word you know, kept strong.'))));
  // first run: no word learned yet, so the hero says where the first ones come from instead of "0 cards due"
  const fresh = !learnedAll.length && !due.length, nextN = fresh ? currentLessonN() : null, nextL = nextN != null && lessonById(nextN);
  if (fresh && nextL) {
    const ls = S.progress.lessonState, resume = ls && ls.n === nextN;
    v.append(h('div', { class: 'card stack primary hubfresh' }, h('div', { class: 'hubhero' }, sigEl('review'), h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Daily review'), h('h2', {}, 'No words yet'), h('div', { class: 'faint' }, `Lesson ${nextN}, ${nextL.title}, brings your first ${nextL.words.length} words. After it they come back here, a few at a time, so they stay.`))),
      h('button', { class: 'btn wide', onclick: () => startLesson(nextN) }, (resume ? 'Continue lesson ' : 'Start lesson ') + nextN)));
  } else v.append(h('div', { class: 'card stack primary' }, h('div', { class: 'hubhero' }, sigEl('review'), h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Daily review'), h('div', {}, h('span', { class: 'big' }, due.length), h('span', { class: 'muted' }, due.length === 1 ? ' card due' : ' cards due')), h('div', { class: 'faint' }, due.length ? summarize(due) + (due.length > 40 ? ` A round is 40 cards, about ${reviewMinutes(40)}\u00a0min.` : ` About ${reviewMinutes(due.length)}\u00a0min.`) : 'Nothing due right now. New cards come back on schedule.'))),
    due.length ? h('button', { class: 'btn wide', onclick: () => startReview(due.slice(0, 40)) }, due.length > 40 ? 'Review 40 now' : 'Start review') : ''));
  const pick = (arr, n) => shuffle(arr).slice(0, n);
  const weak = learnedAll.filter(([id, c]) => c.r && c.r[4] >= 2), conv = Object.entries((S.cards.sent || { w: {} }).w);
  const mk = (id, c, kind) => ({ id, sh: cardShard(id), c, kind, extra: true });
  const modes = [
    ['question', 'Word meanings', 'Pick the meaning: new and older words', learnedAll.length, () => drillSession('mc', 15)],
    ['puzzle', 'Fill the gaps', 'Complete real sentences with the right form', learnedAll.length, () => drillSession('gap', 12)],
    ['stairs', 'Build sentences', 'Put the words in German order', learnedAll.length, () => drillSession('order', 10)],
    ['pencil', 'Translate', 'English sentence → German, typed', learnedAll.length, () => drillSession('trans', 10)],
    ['sound', 'Listening', 'Hear a word or sentence, type it', learnedAll.length, () => startReview(pick(learnedAll, 12).map(([id, c], i) => mk(id, c, i % 2 ? 'li' : 'ls')), 'Listening')],
    ['ticket', 'Say it in German', SR ? 'English → German word, spoken or typed' : 'English → German word, typed', learnedAll.length, () => startReview(pick(learnedAll, 12).map(([id, c]) => mk(id, c, 'p')), 'Say it in German')],
    ['people', 'Conversation lines', conv.length ? conv.length + (conv.length === 1 ? ' line' : ' lines') + ' from lessons and Sprechen' : 'Lines you save from a lesson or Sprechen come here', conv.length, () => startReview(pick(conv, 10).map(([id, c]) => ({ id, sh: 'sent', c, kind: 'sent', extra: true })), 'Conversation lines')],
    ['plaster', 'Weak words', weak.length ? weak.length + (weak.length === 1 ? ' word' : ' words') + ' you missed twice or more' : 'Words you miss twice come here for extra practice', weak.length, () => startReview(weak.map(([id, c], i) => mk(id, c, ['r', 'gap', 'p', 'mc'][i % 4])), 'Weak words')],
    ['review', 'Mixed workout', 'Every exercise type in one session', learnedAll.length, () => { const p = drillPool(16, false); startReview(p.map((x, i) => mk(x.id, x.c, ['mc', 'gap', 'order', 'trans', 'li', 'p', 'r', 'ls'][i % 8])), 'Mixed workout'); }],
    ['frame', 'Grammar', 'Reference units with drills', 1, () => go('grammar')],
  ];
  // a mode with nothing to practise yet stays readable and says so with a lock, rather than fading out
  v.append(h('div', { class: 'modes' }, ...modes.map(([icon, t, d, n, fn]) => h('button', { class: 'mode', disabled: !n, onclick: fn }, sigEl(icon), h('b', {}, t), h('span', {}, d), n ? '' : h('i', { class: 'mlock', role: 'img', 'aria-label': fresh ? 'Opens after your first lesson' : 'Nothing here yet', html: LOCK_SVG })))));
  const gate = examGate(); if (gate) v.append(h('button', { class: 'card listrow', onclick: () => openExamPreview(gate.code) }, sigEl('exam'), h('div', { class: 'grow' }, h('b', {}, 'The ' + gate.code + ' exam is ready'), h('div', { class: 'faint' }, 'New lessons wait until you pass it with 90%. Practise here first.')), h('span', { class: 'muted' }, '›')));
  const g = goalInfo(); if (!gate && !fresh && g.today < g.perDay && currentLessonN()) v.append(h('button', { class: 'card listrow', onclick: () => openOnMap(currentLessonN()) }, sigEl(courseOf(currentLessonN()).icon, ''), h('div', { class: 'grow' }, h('b', {}, 'New words'), h('div', { class: 'faint' }, `${g.perDay - g.today} more today toward your goal · next station ${courseOf(currentLessonN()).station}`)), h('span', { class: 'muted' }, '›')));
  // practise one set
  const groups = {}; learnedAll.forEach(([id, c]) => { const n = c.lesson || c.v1; const k = n ? 'L' + n : 'imp'; (groups[k] = groups[k] || []).push([id, c]); });
  const keys = Object.keys(groups).sort((a, b) => (a === 'imp') - (b === 'imp') || a.localeCompare(b, undefined, { numeric: true }));
  if (keys.length) v.append(h('div', { class: 'card stack' }, h('h2', {}, 'Practise one set'), h('div', { class: 'row' }, ...keys.map(k => { const items = groups[k], n = +k.slice(1); const label = k === 'imp' ? 'Imported' : 'Lesson ' + n + ' · ' + courseOf(n).topic; return h('button', { class: 'btn ghost sm', onclick: () => startReview(shuffle(items).map(([id, c], i) => mk(id, c, ['r', 'p', 'li', 'r'][i % 4])), k === 'imp' ? 'Imported words' : courseOf(n).topic) }, k !== 'imp' ? sigEl(courseOf(n).icon) : '', label + ' · ' + items.length + (items.length === 1 ? '\u00a0word' : '\u00a0words')); }))));
  // the forecast and strength charts are empty until the first words; Your words below says how to start
  if (!fresh && !document.body.classList.contains('lay-desktop')) { v.append(forecastWidget()); v.append(h('div', { class: 'widget' }, h('h2', {}, 'Word strength'), strengthBar())); }
  v.append(wordBank());
}
function renderReviewSummary(v) {
  const s = REVIEW_SUMMARY; document.body.classList.add('in-lesson');
  const acc = s.n ? Math.round(100 * s.good / s.n) : 0, mins = Math.max(1, Math.round((Date.now() - s.t0) / 60000));
  v.append(h('div', { class: 'tabroom' }), h('div', { class: 'ticket' }, h('div', { class: 'top' }, h('b', s.stop ? { lang: 'de' } : {}, s.stop ? 'Wiederholung' : s.title || 'Daily review'), h('span', {}, fmtDate(todayStr()))),
    h('div', { class: 'body summary' }, teacherSlot(72, acc >= 80 ? 'pleased' : 'neutral'), h('h1', { lang: 'de' }, acc === 100 ? 'Alles sitzt.' : acc >= 90 ? 'Fast alles sitzt.' : acc >= 70 ? 'Das meiste sitzt.' : 'Heute war es schwer.'), h('p', { class: 'muted' }, acc === 100 ? 'All of it has stuck. These words now wait longer before they come back.' : acc >= 90 ? 'Almost all of it has stuck. These words now wait longer before they come back.' : acc >= 70 ? 'Most of it has stuck. The ones you missed come back sooner.' : 'A hard round. The ones you missed come back sooner, and that is how they stick.'))));
  v.append(resultRow([[mins, '', mins === 1 ? 'minute' : 'minutes'], [acc, '%', 'recalled'], [s.n, '', s.n === 1 ? 'card' : 'cards', 'hot']], 'Your review'));
  if (s.missed.length) v.append(wordSlab('Coming back soon', [...new Set(s.missed)].slice(0, 12).map(id => id.startsWith('s:') ? { de: id.slice(2) } : findWord(id.replace(/^(der|die|das) /, '')) || { de: id })));
  const done = () => { if (s.stop) { route = 'learn'; toast('Review stop done'); } REVIEW_SUMMARY = null; NAV = 'fade'; checkStamps(); render(); };
  actionBar({ buttons: [h('button', { class: 'btn', onclick: done }, 'Continue')] }); KEYS = e => { if (e.key === 'Enter') done(); };
}

/* ---------- Explain my mistake (Claude) ---------- */
function explainBtn(answer, target, en) {
  if (!S.ai) return '';
  const out = h('div', {}); const b = h('button', { class: 'btn ghost sm', style: 'align-self:flex-start', onclick: async () => {
    b.disabled = true; out.innerHTML = ''; out.append(fbEl('hint', '<span class="typing"><i></i><i></i><i></i></span>'));
    try { const r = await AI.run('explainMistake', { en, target, answer }); out.innerHTML = ''; out.append(fbEl('hint', esc(r.explanation || ''))); }
    catch (e) { out.innerHTML = ''; out.append(fbEl('bad', AI.message(e, 'Could not explain right now.'))); b.disabled = false; }
  } }, 'Why? Explain it');
  return h('div', { class: 'stack', style: 'gap:8px' }, b, out);
}

/* ---------- Sprechen: free conversation with a faceless partner ---------- */
const SCENARIOS = [
  { id: 'kennen', title: 'Kennenlernen', en: 'Get to know each other', icon: 'hand', n: 5, place: 'Raum 2.04', brief: 'You meet the student for the first time at the Volkshochschule am Hermannplatz. Ask about name, origin, studies or work, and where they live.', open: 'Guten Tag! Willkommen im Kurs. Wie heißen Sie?', openG: 'Guten Tag!=hello | Willkommen=welcome | im=to the | Kurs.=course | Wie=how | heißen=are called | Sie?=you (formal)', openEn: 'Hello! Welcome to the course. What is your name?' },
  { id: 'tag', title: 'Mein Tag', en: 'Talk about your day', icon: 'clock', n: 6, place: 'Neukölln', brief: 'Chat about what the student does today: work, what they are learning, what they drink and cook, music or sport.', open: 'Und, was machen Sie heute?', openG: 'Und,=so | was=what | machen=are doing | Sie=you (formal) | heute?=today', openEn: 'So, what are you doing today?' },
  { id: 'cafe', title: 'Im Café', en: 'Order at the café by the school', icon: 'coffee', n: 14, place: 'Café · Hermannplatz', brief: 'You are the barista at the small café next to the Volkshochschule am Hermannplatz, where the student\'s German course takes its break. The student orders something to drink and something to eat. Paying comes in a later lesson, so do not ask for money.', open: 'Guten Tag! Was trinken Sie heute?', openG: 'Guten Tag!=hello | Was=what | trinken=are drinking | Sie=you (formal) | heute?=today', openEn: 'Hello! What are you having today?' },
  { id: 'wohnung', title: 'Meine Wohnung', en: 'Describe where you live', icon: 'key', n: 18, place: 'Zu Hause', brief: 'You ask the student about their flat or house: how big it is, the rooms, what is nice, the city they live in.', open: 'Erzählen Sie mal: Wo wohnen Sie?', openG: 'Erzählen Sie mal:=tell me | Wo=where | wohnen=live | Sie?=you (formal)', openEn: 'Tell me: where do you live?' },
];
const TALK_SCENE = { kennen: 'classroom', cafe: 'cafe', wohnung: 'flat', tag: 'neukoelln' };
let TALK = null;
const lineCount = n => n === 1 ? '1 line' : n + ' lines';
function talkActive() { return route === 'talk' && TALK && TALK.active; }
function renderTalk(v) {
  if (TALK && TALK.active) { renderTalkChat(v); return; }
  if (TALK && TALK.summary) { renderTalkSummary(v); return; }
  v.append(h('div', { class: 'talkhero' }, teacherSlot(72, 'pleased'), h('div', { class: 'grow' }, h('h1', { lang: 'de' }, 'Sprechen'), h('p', {}, 'A real conversation with Protoa at your level. Every line you write is corrected, and the replies keep to the words you know.'))));
  if (!S.ai) v.append(h('div', { class: 'card soft stack' }, h('b', {}, 'Sprechen is closed for now'), h('p', { class: 'faint' }, 'Protoa’s AI writes the replies and corrections here, and it is not reachable right now. Lessons and Practice work as usual.')));
  // Night Glass: each scenario shows the painted place it happens in
  v.append(h('div', { class: 'scens' }, ...SCENARIOS.map(sc => h('button', { class: 'scen' + (TALK_SCENE[sc.id] ? ' pic' : ''), disabled: !S.ai, onclick: () => startTalk(sc) }, TALK_SCENE[sc.id] ? h('span', { class: 'scpic', 'aria-hidden': 'true', style: `background-image:url(art/night/scenes/${TALK_SCENE[sc.id]}.jpg)` }) : sigEl(sc.icon), h('div', { class: 'grow' }, h('b', { lang: 'de' }, sc.title), h('span', {}, sc.en + (S.progress.lessonsDone.includes(sc.n) ? '' : ' · after Lesson\u00a0' + sc.n)))))));
  const hist = (S.progress.talks || []).slice(-5).reverse();
  if (hist.length) v.append(h('div', { class: 'card stack' }, h('h2', {}, 'Recent conversations'), ...hist.map(t => h('div', { class: 'row', style: 'justify-content:space-between' }, h('span', { lang: 'de' }, t.title), h('span', { class: 'faint' }, `${fmtDate(t.date)} · ${lineCount(t.turns)} · ${t.fixes} corrected`)))));
}
function startTalk(sc) {
  TALK = { active: true, sc, log: [{ who: 'w', de: sc.open, g: sc.openG, en: sc.openEn, mood: 'pleased' }], turns: 0, fixes: [], busy: false, t0: Date.now() };
  route = 'talk'; NAV = 'fwd'; render();
}
function knownWordList() { return Object.values(S.cards).flatMap(sh => Object.keys(sh.w || {})).filter(k => !k.startsWith('s:')).slice(0, 220).join(', '); }
function renderTalkChat(v) {
  const T = TALK, sc = T.sc;
  v.append(h('div', { class: 'lesson-top' }, h('div', { class: 'who' }, teacherSlot(44, 'neutral'), h('div', { style: 'min-width:0;display:flex;flex-direction:column' }, h('b', { lang: 'de' }, sc.title), h('span', {}, sc.en + ' · ' + T.turns + ' of ~10 lines'))),
    h('button', { class: 'icon-btn sm close', 'aria-label': 'End conversation', html: ICONS.x, onclick: () => endTalk() }), h('div', { class: 'segs', style: 'grid-template-columns:1fr' }, h('i', {}, h('b', { style: `width:${Math.min(100, T.turns * 10)}%` })))));
  if (TALK_SCENE[sc.id]) v.append(h('div', { class: 'talkband', role: 'img', 'aria-label': sc.en, style: `background-image:url(art/night/scenes/${TALK_SCENE[sc.id]}.jpg)` }, h('span', { lang: 'de' }, sc.place)));
  const log = h('div', { class: 'chatlog', role: 'log', 'aria-live': 'polite' }); v.append(log);
  const bubble = m => {
    if (m.who === 'w') { const ul = m.g ? glossEl(m.de, m.g) : glossEl(m.de, null); const box = h('div', { class: 'box' }, h('div', { class: 'row' }, ul, h('button', { class: 'icon-btn sm', 'aria-label': 'Play', html: ICONS.play, onclick: () => { Voice.mood(m.mood || 'neutral'); speak(m.de, { el: ul }); } }))); const en = h('div', { class: 'en-after', hidden: true }, m.en || ''); box.append(en, h('button', { class: 'faint', style: 'font-size:var(--t-cap);text-decoration:underline', onclick: e => { en.hidden = false; e.currentTarget.remove(); } }, 'show English')); return h('div', { class: 'bub w' }, h('span', { class: 'pface', 'aria-hidden': 'true' }, h('img', { src: 'art/night/orb.png', alt: '' })), box); }
    const wrap = h('div', { class: 'stack', style: 'gap:8px' }, h('div', { class: 'bub l' + (m.corr && m.corr.ok ? ' done' : '') }, h('div', { class: 'box' }, h('span', { lang: 'de', style: 'font-family:var(--display);font-weight:700' }, m.de))));
    if (m.corr) { if (m.corr.ok) wrap.append(h('div', { class: 'fb ok corr' }, '✓ ' + (m.corr.note || 'Verständlich und richtig.'))); else { const c = h('div', { class: 'fb note corr', style: 'flex-direction:column;align-items:stretch' }, h('div', {}, h('b', {}, 'Better: '), h('span', { lang: 'de', style: 'font-family:var(--display);font-weight:800' }, m.corr.corrected || '')), m.corr.note ? h('div', {}, m.corr.note) : ''); wrap.append(c); } }
    return wrap;
  };
  T.log.forEach(m => log.append(bubble(m)));
  const typing = h('div', { class: 'bub w', hidden: !T.busy }, h('div', { class: 'box' }, h('span', { class: 'typing', 'aria-label': 'Typing' }, h('i'), h('i'), h('i'))));
  log.append(typing);
  const inp = deInput({ placeholder: 'Ihre Antwort …', 'aria-label': 'Your reply in German', id: 'talk-input' });
  const send = async () => {
    const txt = inp.value.trim(); if (!txt || T.busy) return;
    T.log.push({ who: 'l', de: txt }); T.turns++; T.busy = true; Voice.busy(true); inp.value = '';
    const mine = bubble(T.log[T.log.length - 1]); log.insertBefore(mine, typing); typing.hidden = false; typing.scrollIntoView({ block: 'end', behavior: reduced() ? 'auto' : 'smooth' });
    try {
      const r = await AI.run('talkTurn', { profile: aiProfile(), brief: sc.brief, known: knownWordList(), history: T.log.map(m => ({ who: m.who === 'w' ? 'w' : 'l', de: m.de })) });
      const me = T.log[T.log.length - 1]; me.corr = r.correction && typeof r.correction.ok === 'boolean' ? r.correction : { ok: true };
      if (!me.corr.ok && me.corr.corrected) T.fixes.push({ de: me.corr.corrected, said: me.de, note: me.corr.note || '' });
      let g = r.gloss || null; try { if (g && deTokens(r.de).map(fold).join(' ') !== parseGloss(g).flatMap(([d]) => deTokens(d)).map(fold).join(' ')) g = null; } catch (e) { g = null; }
      T.log.push({ who: 'w', de: String(r.de || '').trim() || '…', g, en: r.en || '', mood: me.corr.ok ? 'pleased' : 'thinking' });
      T.busy = false; Voice.busy(false); T.done = !!r.done || T.turns >= 12; NAV = 'none'; render();
    } catch (e) {
      T.busy = false; Voice.busy(false); T.log.pop(); T.turns--; inp.value = txt; typing.hidden = true; mine.remove();
      toast(AI.message(e, e && e.code === 'refused' ? 'Protoa can’t answer that line. Try saying it another way.' : 'Protoa could not answer. Try again.'));
      if (e && e.code === 'unavailable') endTalk(); // no AI to answer: keep the lines so far and close the chat
    }
  };
  const help = async () => {
    const ask = h('input', { type: 'text', placeholder: 'What do you want to say? (English)', 'aria-label': 'What you want to say, in English', id: 'talk-help' });
    openSheet((inner, close) => {
      const out = h('div', {}); const go_ = async () => { const q = ask.value.trim(); if (!q) return; out.innerHTML = ''; out.append(fbEl('hint', '<span class="typing"><i></i><i></i><i></i></span>'));
        try { const r = await AI.run('talkHelp', { brief: sc.brief, question: q }); out.innerHTML = ''; out.append(h('div', { class: 'stack', style: 'gap:8px' }, h('div', { class: 'row' }, glossEl(r.de, null), playBtn(r.de)), r.tip ? fbEl('note', esc(r.tip)) : '', h('button', { class: 'btn', onclick: () => { inp.value = r.de; close(); inp.focus(); } }, 'Use this'))); }
        catch (e) { out.innerHTML = ''; out.append(fbEl('bad', AI.message(e, e && e.code === 'refused' ? 'Protoa can’t help with that one. Try asking it another way.' : 'Could not get a suggestion right now.'))); } };
      ask.addEventListener('keydown', e => { if (e.key === 'Enter') go_(); });
      inner.append(h('h2', {}, 'How do I say…?'), h('p', { class: 'faint' }, 'Type it in English. You get the German, and you still say it yourself.'), ask, h('button', { class: 'btn', onclick: go_ }, 'Show me'), out);
      setTimeout(() => ask.focus(), 80);
    });
  };
  if (T.done) {
    actionBar({ buttons: [h('button', { class: 'btn', onclick: () => endTalk() }, 'Finish the conversation')] }); KEYS = e => { if (e.key === 'Enter') endTalk(); };
  } else {
    const bar = actionBar({ buttons: [h('div', { class: 'chatbar' }, inp, micBtn(inp, send), h('button', { class: 'btn', 'aria-label': 'Send', html: ICONS.send, onclick: send }))] });
    bar.insertBefore(h('div', { class: 'tools' }, umlautRow(inp), h('button', { class: 'btn ghost sm', onclick: help }, 'How do I say…?')), bar.firstChild);
    KEYS = e => { if (e.key === 'Enter' && document.activeElement === inp) send(); };
    setTimeout(() => inp.focus(), 60);
  }
  requestAnimationFrame(() => PANE.scrollTo({ top: PANE.scrollHeight }));
}
function endTalk() {
  const T = TALK; if (!T) return;
  if (T.turns === 0) { TALK = null; NAV = 'back'; render(); return; }
  S.progress.talkCount = (S.progress.talkCount || 0) + 1;
  S.progress.talks = (S.progress.talks || []).concat([{ date: todayStr(), title: T.sc.title, turns: T.turns, fixes: T.fixes.length }]).slice(-30);
  save('progress'); TALK = { summary: true, sc: T.sc, turns: T.turns, fixes: T.fixes, added: false }; NAV = 'fwd'; render();
}
function renderTalkSummary(v) {
  const T = TALK; document.body.classList.add('in-lesson');
  v.append(h('div', { class: 'tabroom' }), h('div', { class: 'card summary' }, teacherSlot(84, 'pleased'), h('h1', { lang: 'de' }, 'Danke fürs Gespräch.'), h('p', { class: 'muted' }, `Thanks for the conversation. You wrote ${lineCount(T.turns)} in German. ${T.fixes.length ? (T.fixes.length === 1 ? 'One' : T.fixes.length) + ' got a correction.' : 'None needed a correction.'}`)));
  if (T.fixes.length) {
    const card = h('div', { class: 'card stack' }, h('h2', {}, 'Your corrected lines'));
    T.fixes.forEach(f => card.append(h('div', { class: 'stack', style: 'gap:4px' }, h('div', { class: 'faint', lang: 'de', style: 'text-decoration:line-through' }, f.said), h('div', { class: 'row' }, glossEl(f.de, null), playBtn(f.de)), f.note ? h('div', { class: 'faint' }, f.note) : '')));
    const add = h('button', { class: 'btn ghost', disabled: T.added, onclick: () => { T.fixes.forEach(f => addSentenceCard({ de: f.de, en: f.note ? 'Say it correctly: ' + f.said : f.said, g: '', gaps: [], alts: [] }, 0, { due: addDays(todayStr(), 1) })); T.added = true; add.disabled = true; add.textContent = 'Added to your reviews'; toast('Added to your reviews'); } }, T.added ? 'Added to your reviews' : 'Add these to my reviews');
    card.append(add); v.append(card);
  }
  const done = () => { TALK = null; NAV = 'fade'; checkStamps(); render(); };
  actionBar({ buttons: [h('button', { class: 'btn', onclick: done }, 'Continue')] }); KEYS = e => { if (e.key === 'Enter') done(); };
}

/* ---------- desktop: search (Ctrl/Cmd+K) and shortcuts (?) ---------- */
function openSearch() {
  const inp = h('input', { type: 'text', placeholder: 'Search words in German or English', 'aria-label': 'Search words', id: 'search-input' }); const res = h('div', { class: 'searchres', role: 'listbox' });
  const all = [...new Map([...allLessons().flatMap(l => l.words), ...V1_WORDS, ...Object.values(S.cards).flatMap(sh => Object.keys(sh.w || {})).filter(k => !k.startsWith('s:')).map(wordDef).filter(Boolean)].map(w => [w.de, w])).values()];
  let sel = 0, items = [];
  const draw = () => { const q = fold(inp.value.trim()); res.innerHTML = ''; items = (q ? all.filter(w => fold(w.de).includes(q) || (w.en || []).join(' ').toLowerCase().includes(q)) : all.filter(w => isLearned(w.de))).slice(0, 30); sel = Math.min(sel, Math.max(0, items.length - 1));
    items.forEach((w, i) => res.append(h('button', { class: i === sel ? 'sel' : '', role: 'option', onclick: () => { document.querySelector('.sheet')?.remove(); openWordSheet(w.de.replace(/^(der|die|das) /, '')); } }, h('span', {}, artEl(w.de)), h('span', { class: 'faint' }, (w.en || []).join(', ') + (isLearned(w.de) ? ' · yours' : ''))))); if (!items.length) res.append(h('p', { class: 'faint' }, 'No match.')); };
  inp.addEventListener('input', () => { sel = 0; draw(); });
  inp.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); draw(); e.preventDefault(); } if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } if (e.key === 'Enter' && items[sel]) res.children[sel].click(); });
  openSheet(inner => { inner.append(h('h2', {}, 'Search words'), inp, res); draw(); setTimeout(() => inp.focus(), 60); });
}
function openShortcuts() {
  const rows = [['Enter', 'Check · Continue'], ['1 – 4', 'Choose an answer · grade Again / Hard / Good / Easy'], ['← →', 'Previous / next word card'], ['Esc', 'Close a sheet'], ['Ctrl K', 'Search words'], ['g then t / l / p / s / r / o', 'Go to Today / Lessons / Practice / Sprechen / Grammar / Profile'], ['a: o: u:', 'Type ä ö ü in German boxes'], ['?', 'This list']];
  openSheet(inner => inner.append(h('h2', {}, 'Keyboard shortcuts'), h('div', { class: 'shortcuts' }, ...rows.flatMap(([k, d]) => [h('span', { class: 'kbd' }, k), h('span', {}, d)]))));
}
let gPending = 0;
document.addEventListener('keydown', e => {
  const typing = e.target.matches && e.target.matches('input,textarea,select');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
  if (typing || document.body.classList.contains('in-lesson')) return;
  if (e.key === '?') { openShortcuts(); return; }
  if (e.key === 'g') { gPending = Date.now(); return; }
  if (Date.now() - gPending < 1200) { const m = { t: 'today', l: 'learn', p: 'practice', s: 'talk', r: 'grammar', o: 'profile' }[e.key]; gPending = 0; if (m) go(m); }
});
