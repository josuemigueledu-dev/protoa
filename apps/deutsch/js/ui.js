/* ===================== UI ===================== */
const view = $('#view'), tabsEl = $('#tabs'), overlay = $('#overlay');
let route = 'today', KEYS = null, toastT = null;
const ICONS = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>',
  grammar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4h9l5 5v11z"/><path d="M13 4v5h5M8 13h8M8 17h5"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>',
  slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h3l3-6 4 12 3-6h3"/></svg>',
  syl: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="9" width="5" height="6" rx="1.5"/><rect x="10" y="9" width="5" height="6" rx="1.5"/><rect x="17" y="9" width="4" height="6" rx="1.5"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};
const TYPE_LABEL = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', phrase: 'phrase', interj: 'interjection', conj: 'conjunction', pron: 'pronoun', part: 'particle', q: 'question word', num: 'number' };
const TABS = [['today', 'Today'], ['learn', 'Lessons'], ['practice', 'Practice'], ['talk', 'Sprechen'], ['profile', 'Profile']];
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
function renderTabs() { tabsEl.innerHTML = ''; TABS.forEach(([id, label]) => { const b = h('button', { class: 'tab', 'aria-current': (route === id || (id === 'profile' && (route === 'more' || route === 'grammar'))) ? 'page' : null, onclick: () => go(id), html: ICONS[id] + '<span>' + label + '</span>' }); const bd = navBadge(id); if (bd) b.append(bd); tabsEl.append(b); }); renderSidebar(); }
function go(r) { if (r !== route) { NAV = 'rise'; if (r === 'learn' && S.progress.lessonState && !S.progress.lessonState.paused) { S.progress.lessonState.paused = true; save('progress'); } } route = r; try { history.replaceState(null, '', '#' + r); } catch (e) { } render(); }
function toast(msg) { clearTimeout(toastT); const t = h('div', { class: 'toast', role: 'status' }, msg); overlay.innerHTML = ''; overlay.append(t); toastT = setTimeout(() => t.remove(), 2600); }
function applyTheme() { const t = S.settings.theme; if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; document.body.classList.toggle('hide-gloss', !!S.settings.hideGloss); }
function newView() { view.innerHTML = ''; const v = h('div', { class: 'view stack ' + NAV, style: 'gap:16px' }); view.append(v); return v; }
function render() {
  stopAudio(); KEYS = null; document.querySelector('.actionbar')?.remove(); document.querySelectorAll('.sheet').forEach(s => s.remove()); document.querySelectorAll('.weiter').forEach(p => { p._io?.disconnect(); p.remove(); }); lastLayout = applyLayout(); renderTabs(); applyTheme();
  const inLesson = (route === 'learn' && S.progress.lessonState && !S.progress.lessonState.paused && lessonById(S.progress.lessonState.n)) || (route === 'practice' && ((PR && PR.queue.length) || REVIEW_SUMMARY)) || (route === 'talk' && TALK && (TALK.active || TALK.summary)) || route === 'exam';
  document.body.classList.toggle('in-lesson', !!inLesson);
  document.body.classList.toggle('in-talk', route === 'talk' && !!TALK && !!TALK.active);
  const v = newView();
  window.scrollTo({ top: 0 });
  try { ({ today: renderToday, learn: renderLearn, practice: renderPractice, grammar: renderGrammar, talk: renderTalk, profile: renderProfile, more: renderProfile, exam: renderExam }[route] || renderToday)(v); }
  catch (err) { renderCrash(v, err); }
  try { renderRail(); } catch (e) { console.warn('rail', e); }
  NAV = 'fade';
}
// never leave a blank screen: show what broke and a way back
function renderCrash(v, err) {
  console.error('Protoa render error', err);
  document.body.classList.remove('in-lesson'); document.querySelector('.actionbar')?.remove(); renderTabs();
  v.innerHTML = '';
  v.append(h('div', { class: 'card crash' }, h('h1', {}, 'Das hat nicht geklappt.'), h('p', {}, "Something went wrong drawing this screen. Your progress is saved."), h('p', { class: 'faint' }, String(err && err.message || err)),
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { if (S.progress.lessonState) { S.progress.lessonState.paused = true; save('progress'); } PR = null; route = 'learn'; NAV = 'fade'; render(); } }, 'Back to the map'),
      S.progress.lessonState ? h('button', { class: 'btn ghost', onclick: () => { S.progress.lessonState = null; save('progress'); route = 'learn'; render(); } }, 'Restart this lesson') : '')));
}

/* ---------- shared pieces ---------- */
/* the Protoa mark at badge size (shared/brand/protoa-mark-small.svg); its colours come from depth.css so it follows the theme */
const BRAND_MARK = '<svg viewBox="0 0 120 120"><circle class="mk-shell" cx="60" cy="60" r="46"/><circle class="mk-mid" cx="60" cy="60" r="18"/><circle class="mk-nuc" cx="60" cy="60" r="9"/><g transform="rotate(-18 60 60)"><path class="mk-gap" d="M26 60 A34 10 0 0 0 94 60"/><path class="mk-ring" d="M26 60 A34 10 0 0 0 94 60"/></g></svg>';
/* ---------- the teacher: ONE glossy orb that lives in the first slot of each learning screen ---------- */
/* Night Glass: a photographed clear glass sphere (art/night/orb.png, real alpha), a small mood core of light and
   the white orbiter on a tilted ellipse; all drawn and moved in CSS (night-glass.css), so it costs no script per frame */
const TEACHER = h('div', { class: 'orb companion neutral', 'aria-hidden': 'true' }, h('i', { class: 'shadow' }), h('div', { class: 'float' }, h('i', { class: 'aura' }), h('i', { class: 'sphere' }, h('i', { class: 'glass' }), h('i', { class: 'core' }), h('i', { class: 'orbit' }, h('i', { class: 'ox' }, h('i', { class: 'oy' }, h('i', { class: 'moon' })))))));
function teacherSlot(size = 56, mood = 'neutral') { return h('div', { class: 'tslot', 'data-size': size, 'data-mood': mood, style: `width:${size}px;height:${size}px` }); }
function mountTeacher() {
  const slots = [...document.querySelectorAll('#view .tslot')];
  slots.forEach((s, i) => s.classList.toggle('spare', i > 0));
  const t = slots[0]; if (!t) { TEACHER.remove(); return; }
  if (!TEACHER.isConnected) document.body.append(TEACHER);
  if (typeof Companion !== 'undefined') Companion.arrive();
  if (!TEACHER.classList.contains('talking') && !TEACHER.classList.contains('busy')) Voice.mood(t.dataset.mood);
}
let teacherQueued = false;
new MutationObserver(() => { if (teacherQueued) return; teacherQueued = true; queueMicrotask(() => { teacherQueued = false; mountTeacher(); }); }).observe(document.getElementById('view'), { childList: true, subtree: true });
function artEl(de) { const m = de.match(/^(der|die|das) (.+)$/); if (!m) return h('span', { lang: 'de' }, de); return h('span', { lang: 'de' }, h('span', { class: { der: 'g-m', die: 'g-f', das: 'g-n' }[m[1]] }, m[1] + ' '), m[2]); }
let lastTap = { w: '', t: 0 };
function glossEl(de, g) {
  const ul = h('ul', { class: 'gl', lang: 'de' });
  const pairs = g ? parseGloss(g) : fill(de).trim().split(/\s+/).map(t => [t, '']);
  pairs.forEach(([d, e]) => {
    const w = h('button', { class: 'w', type: 'button', title: 'Tap to hear, tap twice for the card', onclick: ev => { ev.stopPropagation(); const now = Date.now(); const bare = stripPunct(d); if (lastTap.w === bare && now - lastTap.t < 1200) { lastTap = { w: '', t: 0 }; openWordSheet(bare); return; } lastTap = { w: bare, t: now }; speak(bare); } }, d);
    const m = d.match(/^(der|die|das|den|dem|ein|eine|einen)\b/i); if (m) { const gn = { der: 'g-m', den: 'g-m', dem: 'g-m', die: 'g-f', das: 'g-n' }[m[1].toLowerCase()]; if (gn) w.classList.add(gn); }
    ul.append(h('li', {}, w, h('span', { class: 'e', lang: 'en' }, e)));
  });
  return ul;
}
function findWord(bare) { // a tapped word → the dictionary entry it belongs to (headword, article form, or a verb form)
  const f = fold(bare); const all = [...allLessons().flatMap(l => l.words), ...V1_WORDS];
  return all.find(w => fold(w.de) === f || fold(w.de.replace(/^(der|die|das) /, '')) === f) || all.find(w => w.forms && Object.values(w.forms).some(x => fold(x) === f)) || all.find(w => fold(w.de).split(' ').includes(f) && w.de.includes(' ')) || null;
}
function openWordSheet(bare) {
  const w = findWord(bare); if (!w) { toast('No card for "' + bare + '" yet'); return; }
  document.querySelector('.sheet.word')?.remove();
  const sheet = h('div', { class: 'sheet word', role: 'dialog', 'aria-modal': 'true', onclick: e => { if (e.target === sheet) sheet.remove(); } });
  const inner = h('div', { class: 'in', style: 'position:relative' }, h('button', { class: 'icon-btn sm close', 'aria-label': 'Close', html: ICONS.x, onclick: () => sheet.remove() }), wordCard(Object.assign({}, w), { bare: true }));
  sheet.append(inner); document.body.append(sheet);
}
function playBtn(text, label = 'Play', cls = '') { return h('button', { class: 'icon-btn ' + cls, 'aria-label': label + ' ' + text, html: ICONS.play, onclick: () => speak(text) }); }
function umlautRow(input) { const r = h('div', { class: 'umlauts', role: 'group', 'aria-label': 'German characters' }); 'ä ö ü ß Ä Ö Ü'.split(' ').forEach(c => r.append(h('button', { type: 'button', onclick: () => { const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s; input.value = input.value.slice(0, s) + c + input.value.slice(e); input.focus(); input.setSelectionRange(s + 1, s + 1); input.dispatchEvent(new Event('input')); } }, c))); return r; }
function deInput(attrs = {}) { const i = h('input', Object.assign({ type: 'text', class: 'de-input', lang: 'de', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }, attrs)); i.addEventListener('input', () => { const v = applyShortcuts(i.value); if (v !== i.value) { const p = i.selectionStart - 1; i.value = v; i.setSelectionRange(p, p); } }); return i; }
// "Say it": a mic button that dictates German into an input (Chrome's speech recognition; hidden elsewhere)
function micBtn(input, onDone) {
  if (!SR) return '';
  const wrap = h('span', { class: 'mic' }); let rec = null;
  const b = h('button', { class: 'icon-btn', 'aria-label': 'Say it instead of typing', html: ICONS.mic, onclick: () => {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'de-DE'; rec.interimResults = true; rec.maxAlternatives = 1; wrap.classList.add('on'); lbl.textContent = 'Listening…';
    rec.onresult = e => { const t = [...e.results].map(r => r[0].transcript).join(' '); input.value = t; if (e.results[e.results.length - 1].isFinal) input.dispatchEvent(new Event('input')); };
    rec.onend = () => { wrap.classList.remove('on'); lbl.textContent = ''; rec = null; if (input.value.trim() && onDone) onDone(); };
    rec.onerror = () => { wrap.classList.remove('on'); lbl.textContent = 'Could not hear you'; rec = null; };
    try { rec.start(); } catch (e) { wrap.classList.remove('on'); rec = null; }
  } });
  const lbl = h('span', { class: 'faint' }); wrap.append(b, lbl); return wrap;
}
function progressHeader() {
  const g = goalInfo(), s = S.settings;
  return h('div', { class: 'card prog' },
    h('div', { class: 'nums' }, h('div', {}, h('span', { class: 'big' }, g.learned.toLocaleString()), h('span', { class: 'muted' }, ' of ' + s.target.toLocaleString() + ' words'), h('span', { class: 'chip', style: 'margin-left:10px;vertical-align:middle' }, s.level)), h('div', { class: 'muted small', style: 'font-variant-numeric:tabular-nums' }, g.pct + '%')),
    h('div', { class: 'bar' }, h('i', { style: `width:${g.pct}%` })),
    h('div', { class: 'row small muted', style: 'justify-content:space-between' }, h('span', {}, `today: ${g.today} of your ${g.perDay} new words`), g.date ? h('span', {}, 'plan: ' + s.level + ' by ' + fmtDate(g.date)) : ''));
}
function fbEl(kind, html) { const f = h('div', { class: 'fb ' + kind, role: 'status' }); f.innerHTML = html; return f; }
function confetti() { const c = h('div', { class: 'confetti', 'aria-hidden': 'true' }); const cs = getComputedStyle(document.documentElement), cols = ['--ice', '--yellow', '--paper', '--seq-2'].map(k => cs.getPropertyValue(k).trim()); for (let i = 0; i < 60; i++) c.append(h('i', { style: `left:${Math.random() * 100}vw;background:${cols[i % 4]};animation-delay:${Math.random() * .6}s;transform:rotate(${Math.random() * 360}deg)` })); document.body.append(c); setTimeout(() => c.remove(), 2600); }
function ringEl(frac, size = 44) { const r = (size - 6) / 2, c = 2 * Math.PI * r; const d = h('div', { html: `<svg class="ring" viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px" aria-hidden="true"><circle class="bg" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0, Math.min(1, frac)))}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>` }); return d.firstElementChild; }
function difficultyMode() {
  if (S.settings.difficulty !== 'auto') return S.settings.difficulty;
  const r = S.progress.recent.slice(-40); if (r.length < 8) return 'default';
  const acc = r.reduce((a, b) => a + b, 0) / r.length; return acc > .85 ? 'harder' : acc < .65 ? 'easier' : 'default';
}
function dueCards() {
  const t = todayStr(), out = [];
  for (const [sh, shd] of Object.entries(S.cards)) for (const [id, c] of Object.entries(shd.w || {})) {
    if (!c.learned) continue;
    if (c.r && c.r[0] <= t) out.push({ id, sh, c, kind: c.sent ? 'sent' : 'r' });
    if (!c.sent && c.r && c.r[1] >= 4) { if (!c.p) { c.p = newCard(t); } if (c.p[0] <= t) out.push({ id, sh, c, kind: 'p' }); }
  }
  return out;
}
// the one action bar at the bottom of the screen (lesson steps and reviews)
function actionBar(opts) {
  document.querySelector('.actionbar')?.remove();
  const bar = h('div', { class: 'actionbar ' + (opts.state || '') });
  if (opts.msg) { const m = h('div', { class: 'msg' }); const title = opts.title || (opts.state === 'ok' ? 'Richtig!' : opts.state === 'bad' ? 'Nicht ganz' : ''); m.innerHTML = (opts.state ? `<span class="ico">${opts.state === 'ok' ? '✓' : '✕'}</span>` : '') + `<div class="grow">${title ? `<span class="ttl">${title}</span>` : ''}<span>${opts.state === 'ok' ? opts.msg.replace(/^✓\s*/, '') : opts.msg}</span></div>`; bar.append(m); }
  const inner = h('div', { class: 'in' }); (opts.buttons || []).forEach(b => inner.append(b)); bar.append(inner); document.body.append(bar); return bar;
}

/* ---------- TODAY ---------- */
function renderToday(v) {
  const name = S.profile.name; const hour = new Date().getHours(); const greet = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  const g0 = goalInfo(), due = dueCards(), ls = S.progress.lessonState;
  const gateT = examGate();
  const curN = gateT ? (ls && ls.n != null && !lessonBlocked(ls.n) ? ls.n : null) : currentLessonN(); const L = lessonById(curN);
  const resume = !!(L && ls && ls.n === L.n);
  v.append(h('div', { class: 'today-hero' }, teacherSlot(64, 'pleased'), h('div', { class: 'grow' }, h('h1', {}, greet + (name ? ', ' + name : '') + '.'), protoaLine(L, resume, due.length)),
    h('div', { class: 'goal', role: 'img', 'aria-label': `${g0.today} of ${g0.perDay} new words today` }, ringEl(Math.min(1, g0.today / Math.max(1, g0.perDay)), 84), h('div', { class: 'inner', 'aria-hidden': 'true' }, h('span', {}, g0.today), h('small', {}, 'of ' + g0.perDay)))));
  if (gateT) v.append(h('div', { class: 'card stack examcard' }, h('div', { class: 'nextcard' }, sigEl('exam'), h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, gateT.words.toLocaleString() + ' words reached'), h('h2', { lang: 'de', style: 'font-size:var(--t-title)' }, 'Prüfung ' + gateT.code), h('div', { class: 'faint' }, 'Pass with 90 % to open the next lessons.'))), h('button', { class: 'btn wide', onclick: () => openExamPreview(gateT.code) }, S.progress.exam ? 'Continue the exam' : 'Open the exam')));
  if (L) v.append(todayLessonCard(L, resume));
  else if (!gateT) v.append(h('div', { class: 'card stack primary' }, h('p', { class: 'muted' }, 'You have reached the end of the written line.'), h('button', { class: 'btn wide', onclick: () => go('learn') }, 'Open the map')));
  v.append(todayLine(due.length));
  v.append(todayDuo(due, L));
  if (!S.progress.sounds) v.append(h('button', { class: 'card listrow', onclick: () => openMore(renderSounds) }, h('div', { class: 'grow' }, h('b', {}, 'Lesson 0: Sounds'), h('div', { class: 'faint' }, 'How German spelling maps to sound. Ten minutes, once.')), h('span', { class: 'muted' }, '›')));
  v.append(h('button', { class: 'card listrow', onclick: () => go('talk') }, h('span', { class: 'sig talkico', html: ICONS.talk }), h('div', { class: 'grow' }, h('b', { lang: 'de' }, 'Sprechen'), h('div', { class: 'faint' }, 'Talk with Protoa at your level. Every line you write is corrected.')), h('span', { class: 'muted', 'aria-hidden': 'true' }, '›')));
  v.append(progressHeader());
  if (!document.body.classList.contains('lay-desktop')) { v.append(paceWidget()); v.append(weekWidget()); const sz = satzDesTages(); if (sz) v.append(sz); }
  v.append(writeYourOwn());
  setTimeout(checkStamps, 600);
}
/* ---------- Today, Night Glass: Protoa's line, the lesson card, the stop line, words due ---------- */
const CAST_DE = { 'cast.weber': ['Herrn Weber', 'Herr Weber'], 'cast.ana': ['Ana', 'Ana'], 'cast.lena': ['Lena', 'Lena'], 'cast.barista': ['den Barista', 'the barista'], 'cast.murat': ['Murat', 'Murat'] };
/* the person a lesson introduces (first in its cast who is in no earlier lesson), else null */
function newcomer(L) {
  if (!L || !L.scene) return null; const seen = new Set();
  allLessons().forEach(o => { if (o.n < L.n) (o.scene && o.scene.cast || []).forEach(c => seen.add(c.id)); });
  const c = (L.scene.cast || []).find(c => !seen.has(c.id) && CAST_DE[c.id]); return c ? c.id : null;
}
const leadOf = L => { const c = (L && L.scene && L.scene.cast || []).find(c => CAST_DE[c.id]); return c ? c.id : null; };
function protoaLine(L, resume, due) {
  const who = !resume && newcomer(L), plate = L && L.scene && L.scene.plate;
  const [de, deHtml, en] = !L ? (due ? ['Heute wiederholst du deine Wörter.', '', 'Today you review your words.'] : ['Bald geht es weiter.', '', 'More stops are coming soon.'])
    : resume ? ['Weiter geht es.', '', 'Let’s carry on where you stopped.']
    : who ? [`Heute triffst du ${CAST_DE[who][0]}.`, `Heute triffst du <b>${CAST_DE[who][0]}</b>.`, `Today you meet ${CAST_DE[who][1]}.`]
    : plate === 'plate.cafe' ? ['Heute geht es ins Café.', 'Heute geht es ins <b>Café</b>.', 'Today we go to the café.']
    : plate === 'plate.classroom' ? ['Heute geht es in den Kurs.', 'Heute geht es in den <b>Kurs</b>.', 'Today it’s back to class.']
    : ['Heute geht es weiter.', '', 'Today the story goes on.'];
  const p = h('p', { lang: 'de', html: deHtml || esc(de) });
  return h('div', { class: 'say' }, h('button', { class: 'snd', 'aria-label': 'Listen: ' + de, html: ICONS.play, onclick: () => speak(de, { el: p }) }), h('div', {}, p, h('small', {}, en)));
}
function todayLessonCard(L, resume) {
  const c = courseOf(L.n), pic = typeof NIGHT_SCENE !== 'undefined' && NIGHT_SCENE[L.scene.plate || 'plate.' + L.scene.id], who = newcomer(L) || leadOf(L);
  const ph = h('div', { class: 'pic' + (pic ? '' : ' none') }, h('span', { class: 'tag', lang: 'de' }, 'Lektion ' + L.n), who && typeof bustEl === 'function' ? bustEl(who, 'neutral', 52) : '');
  if (pic) ph.style.backgroundImage = `url(art/night/scenes/${pic}.jpg)`;
  return h('article', { class: 'card primary tlesson', 'aria-label': 'Lesson ' + L.n + ': ' + L.title }, ph,
    h('div', { class: 'in' }, h('div', { class: 'k' }, c.station + ' · ' + L.words.length + ' words'), h('h2', {}, L.title), L.can ? h('p', {}, 'You will ' + L.can) : '',
      h('button', { class: 'btn wide go', onclick: () => startLesson(L.n) }, resume ? 'Continue lesson' : 'Start lesson')));
}
/* The stop line: the current chapter as a U-Bahn line, a window of stops around yours and the chapter's end.
   Protoa rides on the line at your stop; after a lesson it rides from the last stop it showed to the new one. */
function todayLine(due) {
  const { items } = mapModel(), stopKey = it => it.kind === 'lesson' ? 'L' + it.n : it.kind === 'review' ? it.id : 'X' + it.code;
  let nowI = items.findIndex(it => it.state === 'now' && (it.kind === 'lesson' || it.kind === 'exam'));
  const lessonNear = i => { for (let j = i; j < items.length; j++) if (items[j].kind === 'lesson') return items[j].n; return 1; };
  const done = S.progress.lessonsDone, refN = nowI >= 0 ? lessonNear(nowI) : (done.length ? Math.max(...done) : 1);
  const chI = Math.max(0, CHAPTERS.findLastIndex(c => c.from <= refN)), ch = CHAPTERS[chI];
  const to = CHAPTERS[chI + 1] ? CHAPTERS[chI + 1].from - 1 : Math.max(...items.filter(i => i.kind === 'lesson').map(i => i.n));
  let s = items.findIndex(it => it.kind === 'lesson' && it.n === ch.from); if (s > 0 && items[s - 1].kind === 'exam' && items[s - 1].state !== 'done') s--;
  let e = items.findIndex(it => it.kind === 'review' && it.to === to); if (e < 0) e = items.findIndex(it => it.kind === 'lesson' && it.n === to);
  const stops = items.slice(s, e + 1), lessonsIn = stops.filter(i => i.kind === 'lesson');
  let cur = stops.findIndex(it => it.state === 'now');
  if (cur < 0) { let last = -1; stops.forEach((it, i) => { if (it.kind === 'lesson' && it.state === 'done') last = i; }); cur = Math.min(stops.length - 1, last + 1); }   // no lesson to take: the stop after your last lesson
  const SHOW = 5, start = stops.length <= SHOW + 1 ? 0 : Math.max(0, Math.min(cur - 2, stops.length - SHOW - 1));
  const win = stops.slice(start, start + SHOW + 1 > stops.length ? stops.length : start + SHOW); if (win[win.length - 1] !== stops[stops.length - 1]) win.push(stops[stops.length - 1]);
  const ci = win.indexOf(stops[cur]), X = i => 6 + i * 88 / Math.max(1, win.length - 1);
  const trk = h('div', { class: 'trk', role: 'list' }, h('div', { class: 'rl' + (start > 0 ? ' cut' : ''), style: `left:${start > 0 ? 0 : X(0)}%;right:${100 - X(win.length - 1)}%` }));
  const fill = ci > 0 ? h('div', { class: 'fill' + (start > 0 ? ' cut' : ''), style: `left:${start > 0 ? 0 : X(0)}%;width:${X(ci) - (start > 0 ? 0 : X(0))}%` }) : null; if (fill) trk.append(fill);
  if (ci >= 0 && ci < win.length - 1) trk.append(h('div', { class: 'spark', 'aria-hidden': 'true', style: `left:${X(ci)}%;width:${X(ci + 1) - X(ci)}%` }, h('i')));
  win.forEach((it, i) => {
    const end = i === win.length - 1 && it === stops[stops.length - 1], L = it.kind === 'lesson' && it.L;
    const face = L && (newcomer(L) || (i === ci ? leadOf(L) : null));
    let num = '', lab = '', box = '', aria = '';
    if (it.kind === 'lesson') { num = it.n; lab = L ? L.title : courseOf(it.n).topic; aria = `Lesson ${it.n}, ${lab}`; }
    else if (it.kind === 'review') { num = 'R'; lab = 'Wdh.'; aria = `Review of lessons ${it.from} to ${it.to}`; }
    else { box = it.code; lab = 'Prüfung'; aria = 'Exam ' + it.code; }
    if (end && it.kind === 'review') { box = 'K' + (chI + 1); num = it.to; lab = 'Ziel'; aria = `End of chapter ${chI + 1}: review of lessons ${it.from} to ${it.to}`; }
    const st = h('div', { class: `lstop ${it.kind === 'review' ? 'rv' : it.kind} ${it.state}${box ? ' box' : ''}${i === ci ? ' now' : ''}`, style: `left:${X(i)}%`, role: 'listitem',
      'aria-label': aria + ', ' + (i === ci ? 'your stop' : { done: 'done', open: 'open', locked: 'not yet', soon: 'coming soon', now: 'your stop' }[it.state] || it.state) },
      h('i', { 'aria-hidden': 'true' }, box), num !== '' ? h('em', { 'aria-hidden': 'true' }, String(num)) : '', h('span', { 'aria-hidden': 'true', lang: it.kind === 'lesson' ? 'en' : 'de' }, i === ci ? h('b', {}, lab) : lab));
    if (face && typeof bustEl === 'function') { const b = bustEl(face, 'neutral', 30); b.removeAttribute('role'); b.setAttribute('aria-hidden', 'true'); st.append(b); }
    trk.append(st);
  });
  if (ci >= 0) {
    // the companion orb rides here (companion.js docks on .seat); the rider spans the track so its ride is a translate in % of the line
    const rider = h('div', { class: 'rider', 'aria-hidden': 'true' }, h('i', { class: 'seat', style: `left:${X(ci)}%` }));
    trk.append(rider);
    // after a lesson: if Today last showed an earlier stop still in the window, Protoa rides from there once the line is in view
    const key = stopKey(stops[cur]), seen = LS('lineSeen'), from = seen && seen !== key ? win.findIndex(it => stopKey(it) === seen) : -1;
    const ride = from >= 0 && from < ci && !reduced(), base = start > 0 ? 0 : X(0);
    if (ride) { rider.style.transform = `translateX(${X(from) - X(ci)}%)`; if (fill) fill.style.transform = `scaleX(${(X(from) - base) / (X(ci) - base)})`; }
    const rideNow = () => { LS('lineSeen', key); if (!ride) return; trk.classList.add('riding'); trk.offsetWidth; rider.style.transform = ''; if (fill) fill.style.transform = ''; setTimeout(() => trk.classList.remove('riding'), 1500); };
    if (typeof IntersectionObserver === 'undefined') rideNow();
    else { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(rideNow, 1100); } }, { threshold: .9 }); io.observe(trk); }
  }
  const nextRv = stops.slice(cur).find(it => it.kind === 'review' && it.state !== 'done');
  return h('section', { class: 'card slab-dark stopline', 'aria-label': 'Your line: ' + ch.de },
    h('div', { class: 'lh' }, h('div', {}, h('b', { lang: 'de' }, ch.de), h('span', {}, 'Your line to the end of the chapter')), h('span', { class: 'cnt', 'aria-label': `${lessonsIn.filter(i => i.state === 'done').length} of ${lessonsIn.length} lessons done` }, String(lessonsIn.filter(i => i.state === 'done').length), h('small', {}, '/' + lessonsIn.length))),
    trk,
    h('div', { class: 'ttags' }, due ? h('button', { class: 't1', onclick: () => startReview(dueCards()) }, h('b', {}, String(due)), due === 1 ? ' card due' : ' cards due') : '',
      nextRv ? h('span', {}, 'Review after lesson ' + nextRv.to) : '', h('button', { onclick: () => go('learn') }, 'Course map ›')));
}
/* words due, with their genders, and the scene after this lesson */
function todayDuo(due, L) {
  const g = { m: 0, f: 0, n: 0 }; new Set(due.map(d => d.id)).forEach(id => { const w = wordDef(id); if (w && g[w.g] != null) g[w.g]++; });
  const left = h('button', { class: 'card tdue', onclick: () => { if (due.length) startReview(dueCards()); else go('practice'); } },
    h('span', { class: 'n' }, String(due.length)), h('span', { class: 'k' }, due.length ? (due.length === 1 ? 'card to review' : 'cards to review') : 'Nothing due · open Practice'),
    g.m + g.f + g.n ? h('span', { class: 'gchips', lang: 'de' }, ...[['m', 'der'], ['f', 'die'], ['n', 'das']].filter(([k]) => g[k]).map(([k, a]) => h('span', { class: 'g-' + k }, g[k] + ' ' + a))) : '');
  const N = L && lessonById(L.n + 1), pic = N && typeof NIGHT_SCENE !== 'undefined' && NIGHT_SCENE[N.scene.plate || 'plate.' + N.scene.id];
  if (!pic) return h('div', { class: 'tduo one' }, left);
  const right = h('button', { class: 'card tnext', onclick: () => go('learn'), 'aria-label': `After that: lesson ${N.n}, ${N.title}. Open the course map` }, h('span', { class: 't' }, 'After that · Lektion ' + N.n, h('b', { lang: 'de' }, N.scene.cap || courseOf(N.n).station)));
  right.style.backgroundImage = `url(art/night/scenes/${pic}.jpg)`;
  return h('div', { class: 'tduo' }, left, right);
}
function openOnMap(n) { NAV = 'fade'; route = 'learn'; const ls = S.progress.lessonState; if (ls && !ls.paused && ls.n !== n) ls.paused = true; if (ls && ls.n === n) ls.paused = true; render(); setTimeout(() => openLessonPreview(n), 80); }
function nextLessonN() { const all = allLessons().map(l => l.n); return all.find(n => !S.progress.lessonsDone.includes(n)) || null; }
function writeYourOwn() {
  const c = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Write your own'), h('p', { class: 'muted small' }, "One German sentence with words you know. You get it back corrected, with the main error named and one way to extend it."));
  const inp = deInput({ placeholder: 'Ich komme aus …', id: 'wyo-input', 'aria-label': 'Say where you are from, in German' }); const out = h('div', { class: 'stack' });
  const btn = h('button', { class: 'btn', onclick: async () => {
    const s = inp.value.trim(); if (!s) return; if (!S.ai) { out.innerHTML = ''; out.append(fbEl('note', 'Claude is not available right now, so I cannot check this.')); return; }
    btn.disabled = true; Voice.busy(true); out.innerHTML = ''; out.append(fbEl('hint', 'Protoa is reading your sentence…'));
    try { const r = await AI.run('correctSentence', { sentence: s }); out.innerHTML = ''; out.append(h('div', { class: 'stack' }, h('div', { class: 'row' }, glossEl(r.corrected || s), playBtn(r.corrected || s)), fbEl(r.error && !/^no errors/i.test(r.error) ? 'hint' : 'ok', esc(r.error || '')), r.extend ? fbEl('note', 'Extend it: ' + esc(r.extend)) : '')); }
    catch (e) { out.innerHTML = ''; out.append(fbEl('bad', AI.message(e, 'Could not check right now.'))); }
    btn.disabled = false; Voice.busy(false); } }, 'Check with Protoa');
  c.append(inp, h('div', { class: 'row' }, umlautRow(inp), micBtn(inp)), btn, out); inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
  return c;
}

/* ---------- LEARN: the course map, or the lesson in progress ---------- */
function renderLearn(v) {
  const ls = S.progress.lessonState;
  if (ls && !ls.paused && lessonById(ls.n)) { renderLessonFlow(v); return; }
  renderMap(v);
}

/* ---------- LESSON FLOW ---------- */
const STEPS = ['scene', 'notice', 'words', 'check', 'build', 'conv', 'done'];
function startLesson(n, fresh) {
  const L = lessonById(n); if (!L) return;
  const blk = lessonBlocked(n); if (blk) { openExamPreview(blk.code); return; }
  const ls = S.progress.lessonState;
  if (fresh || !ls || ls.n !== n || ls.step === 'done') S.progress.lessonState = { n, step: 'scene', wi: 0, checkQ: null, bi: 0, battempts: 0, conv: null, newWords: L.words.filter(w => !isLearned(w.de)).map(w => w.de) };
  S.progress.lessonState.paused = false; save('progress'); lastSegs = null; NAV = 'fwd'; route = 'learn'; render();
}
function pauseLesson() { stopAudio(); const ls = S.progress.lessonState; if (ls) { ls.paused = true; save('progress'); } go('learn'); toast('Saved. Pick it up again from the map.'); }
function setStep(step, extra = {}, dir = 'fwd') { Object.assign(S.progress.lessonState, { step }, extra); save('progress'); NAV = dir; render(); }
function sceneEl(L) {
  const plate = L.scene.plate || 'plate.' + L.scene.id, art = typeof ART !== 'undefined' && ART[plate];
  const d = h('div', { class: art ? 'scene art' : 'scene' }); d.innerHTML = art ? sceneArt({ plate, cast: L.scene.cast || [], event: L.scene.event }) : SCENES[L.scene.id] || SCENES.classroom; d.append(h('span', { class: 'cap' }, L.scene.cap)); return d; }
function renderLessonFlow(v) {
  const ls = S.progress.lessonState, L = lessonById(ls.n);
  const SCREENS = { scene: lessonScene, notice: lessonNotice, words: lessonWords, check: lessonCheck, build: lessonBuild, conv: lessonConv, done: lessonDone };
  if (!SCREENS[ls.step]) { ls.step = ls.step === 'intro' ? 'scene' : 'scene'; save('progress'); }
  ({ scene: lessonScene, notice: lessonNotice, words: lessonWords, check: lessonCheck, build: lessonBuild, conv: lessonConv, done: lessonDone }[ls.step])(v, L, ls);
}
function wordCard(w, opts = {}) {
  const c = h('div', { class: (opts.bare ? '' : 'card ') + 'wcard' });
  if (w.pic && PICS[w.pic] && !wordPic(w)) { const i = h('div', { class: 'illus ' + (w.g || '') }); i.innerHTML = PICS[w.pic]; c.append(i); }
  else if (wordPic(w)) c.append(wordArt(w, 168)); // no picture: the word below is the headline, so no tile here
  c.append(h('div', { class: 'de' }, artEl(w.de)), h('div', { class: 'en' }, w.en.join(', ')));
  if (isLearned(w.de) && opts.showYours) c.append(h('span', { class: 'chip yours' }, 'already yours'));
  if (!w.parts || w.pl) { const kind = h('div', { class: 'kind' }, TYPE_LABEL[w.type] || w.type); if (w.pl) kind.append(' · pl. ', artEl(w.pl)); c.append(kind); }
  if (w.parts) c.append(h('div', { class: 'parts' }, h('span', { class: 'eyebrow' }, 'Built from'), w.parts));
  const more = [w.ipa && '/' + w.ipa + '/', w.syl && w.syl.includes('·') && w.syl].filter(Boolean);
  if (w.resp) c.append(h('div', { class: 'resp' }, h('b', {}, w.resp)));
  if (more.length) c.append(h('details', { class: 'more' }, h('summary', {}, 'More sound detail'), h('div', {}, more.join('  ·  '))));
  const bare = w.de.replace(/^(der|die|das) /, '');
  c.append(h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'btn quiet sm', html: ICONS.play + ' Play', onclick: () => speak(bare) }), h('button', { class: 'btn quiet sm', html: ICONS.slow + ' Slow', onclick: () => speak(bare, { rate: .66 }) }), w.syl && w.syl.includes('·') ? h('button', { class: 'btn quiet sm', html: ICONS.syl + ' Syllables', onclick: () => speakSyllables(w.syl, bare) }) : ''));
  if (w.forms) { const g = h('div', { class: 'conj' }); Object.entries(w.forms).forEach(([p, f]) => g.append(h('span', {}, p), h('span', { lang: 'de' }, h('b', {}, f)))); c.append(g); }
  if (w.ex) { const ul = glossEl(w.ex.replace(/[\[\]]/g, ''), w.exG || null); c.append(h('div', { class: 'example' }, h('div', { class: 'eyebrow' }, 'In a sentence'), h('div', { class: 'row', style: 'justify-content:center' }, ul, h('button', { class: 'icon-btn sm', 'aria-label': 'Play sentence', html: ICONS.play, onclick: () => speak(w.ex.replace(/[\[\]]/g, ''), { el: ul }) })), h('div', { class: 'muted small' }, fill(w.exEn)))); }
  return c;
}
function lessonCheck(v, L, ls) {
  if (!ls.checkQ) { ls.checkQ = shuffle(L.words.filter(w => !isLearned(w.de)).map(w => w.de)); ls.checkYours = L.words.filter(w => isLearned(w.de)).map(w => w.de); ls.checkTotal = ls.checkQ.length; save('progress'); }
  v.append(lessonTop(L, ls, ls.checkTotal ? 1 - ls.checkQ.length / ls.checkTotal : 1));
  if (!ls.checkQ.length) {
    const c = h('div', { class: 'card stack center' }, h('div', { class: 'donebadge', html: CHECK_SVG }), h('h2', {}, 'All words checked'), h('p', { class: 'muted' }, 'They are in your review deck. Now put them together.'));
    if (ls.checkYours && ls.checkYours.length) c.append(h('p', { class: 'small muted' }, 'Already yours (skipped): ' + ls.checkYours.join(', ') + '.'), h('button', { class: 'btn ghost sm', onclick: () => { ls.checkQ = shuffle(ls.checkYours); ls.checkTotal = ls.checkQ.length; ls.checkYours = []; save('progress'); NAV = 'fwd'; render(); } }, 'Check these too'));
    v.append(c); const next = () => setStep('build', { bi: 0, battempts: 0 }); actionBar({ buttons: [h('button', { class: 'btn', onclick: next }, 'Build it')] }); KEYS = e => { if (e.key === 'Enter') next(); }; return;
  }
  const id = ls.checkQ[0], w = L.words.find(x => x.de === id);
  /* distractors: this lesson first, then earlier ones, same word type first; never words from lessons the learner has not reached */
  const seen = x => x.de !== id && x.en[0] !== w.en[0];
  const tiers = [L.words.filter(seen), ...allLessons().filter(l => l.n < L.n).sort((a, b) => b.n - a.n).map(l => l.words.filter(seen))];
  const others = []; const take = pool => shuffle(pool).forEach(x => { if (others.length < 3 && !others.includes(x.en[0])) others.push(x.en[0]); });
  for (const t of tiers) { take(t.filter(x => x.type === w.type)); take(t.filter(x => x.type !== w.type)); if (others.length >= 3) break; }
  if (others.length < 3) take(L.words.filter(seen));
  const choices = shuffle([w.en[0], ...others]);
  const c = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, `Word check · ${ls.checkQ.length} left`));
  const head = h('div', { class: 'wcard', style: 'padding:6px 0 10px' }); if (w.pic && PICS[w.pic]) { const i = h('div', { class: 'illus' }); i.innerHTML = PICS[w.pic]; head.append(i); }
  head.append(h('div', { class: 'de' }, artEl(w.de)), playBtn(w.de.replace(/^(der|die|das) /, '')));
  c.append(head, h('div', { class: 'coach' }, h('div', { class: 'say' }, 'Was bedeutet das?', h('span', { class: 'faint', style: 'font-weight:500' }, ' · what does it mean?'))));
  const grid = h('div', { class: 'choices' }); let locked = false;
  const cont = () => { NAV = 'fwd'; render(); };
  choices.forEach((ch, i) => grid.append(h('button', { class: 'choice', onclick: e => {
    if (locked) return; locked = true; [...grid.children].forEach(b => b.disabled = true);
    if (ch === w.en[0]) { e.currentTarget.classList.add('ok'); uiSound('ok'); markLearned(w, L.n); ls.checkQ.shift(); actionBar({ state: 'ok', msg: '✓ <em lang="de">' + esc(w.de) + '</em> is in your word bank.', buttons: [h('button', { class: 'btn', onclick: cont }, 'Continue')] }); }
    else { e.currentTarget.classList.add('bad'); [...grid.children].find(b => b.textContent.endsWith(w.en[0]))?.classList.add('ok'); uiSound('bad'); ls.checkQ.push(ls.checkQ.shift()); actionBar({ state: 'bad', msg: '<em lang="de">' + esc(w.de) + '</em> = ' + esc(w.en[0]) + '. It comes back in a moment.', buttons: [h('button', { class: 'btn', onclick: cont }, 'Continue')] }); }
    save('progress'); KEYS = ev => { if (ev.key === 'Enter') cont(); };
  } }, h('kbd', {}, i + 1), ch)));
  c.append(grid); v.append(c);
  if (S.settings.autoWord) setTimeout(() => speak(w.de.replace(/^(der|die|das) /, '')), 200);
  KEYS = e => { const n = parseInt(e.key); if (n >= 1 && n <= 4) grid.children[n - 1].click(); };
}
/* tiles widget with FLIP snap */
function tilesWidget(tokens, extra, onChange) {
  const pool = h('div', { class: 'tiles', 'aria-label': 'Word tiles' }), ans = h('div', { class: 'tiles answer', 'aria-label': 'Your sentence' });
  const all = shuffle([...tokens, ...extra]).map((t, i) => ({ t, i }));
  const move = (btn, to) => { const first = btn.getBoundingClientRect(); to.append(btn); const last = btn.getBoundingClientRect(); if (!reduced()) { btn.style.transition = 'none'; btn.style.transform = `translate(${first.left - last.left}px,${first.top - last.top}px)`; requestAnimationFrame(() => { btn.style.transition = ''; btn.style.transform = ''; }); } onChange(value()); };
  all.forEach(({ t, i }) => pool.append(h('button', { class: 'tile', type: 'button', lang: 'de', 'data-i': i, onclick: e => move(e.currentTarget, e.currentTarget.parentElement === pool ? ans : pool) }, t)));
  const value = () => [...ans.children].map(b => b.textContent).join(' ');
  return { el: h('div', { class: 'stack' }, ans, pool), value, reset: () => { [...ans.children].forEach(b => pool.append(b)); }, disable: () => [...pool.children, ...ans.children].forEach(b => b.disabled = true) };
}
function gapWidget(de, gaps) {
  const toks = fill(de).split(/\s+/); const line = h('div', { class: 'gapline', lang: 'de' }); const inputs = [];
  toks.forEach((t, i) => { if (gaps.includes(i)) { const core = stripPunct(t), punct = t.slice(core.length); const inp = deInput({ 'aria-label': 'gap ' + (inputs.length + 1) }); inp.style.width = Math.max(5, core.length + 1) + 'ch'; inputs.push(inp); line.append(inp, punct ? h('span', {}, punct) : ''); } else line.append(h('span', {}, t)); });
  const value = () => toks.map((t, i) => { if (!gaps.includes(i)) return t; const core = stripPunct(t); return inputs[gaps.indexOf(i)].value.trim() + t.slice(core.length); }).join(' ');
  return { el: h('div', { class: 'stack' }, line, umlautRow(inputs[0])), value, inputs, focus: () => inputs[0].focus(), disable: () => inputs.forEach(i => i.disabled = true) };
}
function typeWidget(attrs = {}, onDictated) { const inp = deInput(Object.assign({ placeholder: 'Auf Deutsch …', 'aria-label': 'Your line in German' }, attrs)); return { el: h('div', { class: 'stack' }, inp, h('div', { class: 'row' }, umlautRow(inp), micBtn(inp, onDictated))), value: () => inp.value, focus: () => inp.focus(), inputs: [inp], disable: () => inp.disabled = true }; }
function lessonBuild(v, L, ls) {
  const item = L.build[ls.bi];
  if (!item) { setStep('conv', { conv: null }); return; }
  v.append(lessonTop(L, ls, ls.bi / L.build.length));
  const c = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, `Build it · ${ls.bi + 1} of ${L.build.length}`), h('p', { style: 'font-size:1.15rem' }, item.type === 'tiles' ? 'Put the tiles in order: ' : 'Fill the gap: ', h('b', {}, fill(item.en))));
  const widget = item.type === 'tiles' ? tilesWidget(fill(item.de).split(/\s+/), (item.extra || []).map(fill), () => { }) : gapWidget(item.de, item.gaps);
  const fb = h('div', { class: 'ladder' }); let done = false;
  const next = () => setStep('build', { bi: ls.bi + 1, battempts: 0 });
  const check = () => {
    if (done) return; const r = diagnose(widget.value(), item.de, mergedLex(L.lex), item.g);
    fb.innerHTML = '';
    if (r.ok) { done = true; uiSound('ok'); widget.disable(); fb.append(h('div', { class: 'row' }, glossEl(item.de, item.g), playBtn(item.de))); actionBar({ state: 'ok', msg: r.note || esc(item.en || ''), buttons: [h('button', { class: 'btn', onclick: next }, 'Next')] }); KEYS = e => { if (e.key === 'Enter') next(); }; }
    else { ls.battempts++; save('progress'); uiSound('bad', r); if (ls.battempts >= 2) { done = true; widget.disable(); fb.append(h('div', { class: 'row' }, glossEl(item.de, item.g), playBtn(item.de))); actionBar({ state: 'bad', msg: 'The line is <em lang="de">' + esc(fill(item.de)) + '</em>. ' + r.hint, buttons: [h('button', { class: 'btn', onclick: next }, 'Next')] }); KEYS = e => { if (e.key === 'Enter') next(); }; } else { actionBar({ state: 'bad', msg: r.hint, buttons: [h('button', { class: 'btn', onclick: check }, 'Check again')] }); } }
  };
  c.append(widget.el, fb); v.append(c); if (widget.focus) widget.focus();
  actionBar({ buttons: [h('button', { class: 'btn', onclick: check }, 'Check')] });
  KEYS = e => { if (e.key === 'Enter') check(); };
}

/* ---------- THE CONVERSATION (§8) ---------- */
function buildConvPlan(L) {
  const mode = difficultyMode(); const turns = [];
  L.conv.forEach((t, i) => {
    if (mode === 'easier' && t.optional) return;
    let type = t.l ? t.type : null;
    if (t.l) { if (mode === 'easier' && type === 'translate' && t.gaps && t.gaps.length) type = 'gap'; if (mode === 'easier' && type === 'free') type = 'translate'; if (mode === 'harder' && (type === 'tiles' || type === 'gap')) type = 'translate'; }
    turns.push({ i, type });
  });
  return { mode, queue: turns, pos: 0, attempts: 0, log: [], missed: [], firstTry: [], requeued: 0, finished: false };
}
function lessonConv(v, L, ls) {
  if (!ls.conv) { ls.conv = buildConvPlan(L); save('progress'); }
  const C = ls.conv; const lex = mergedLex(L.lex);
  v.append(lessonTop(L, ls, C.queue.length ? C.pos / C.queue.length : 0));
  const conv = h('div', { class: 'conv' }); const plate = L.scene.plate, cast = L.scene.cast || [], banded = !!(plate && typeof ART !== 'undefined' && ART[plate]);
  let band; const moods = {}, twist = L.twist; let popped = false;
  const speaker = m => m.sp || 'cast.weber';
  const drawBand = () => { band.innerHTML = sceneArt({ plate, cast: cast.map(c => ({ ...c, mood: moods[c.id] })), event: popped && twist && twist.event, band: true }); };
  const track = m => { if (m.who !== 'w') return; moods[speaker(m)] = m.mood || 'neutral'; if (twist && m.i === twist.at) popped = true; };
  if (banded) {
    band = h('div', { class: 'conv-band', role: 'img', 'aria-label': L.scene.place }); conv.classList.add('has-band'); conv.append(band);
    C.log.forEach(track); drawBand();
    // the band sticks under the lesson header and shrinks once the learner scrolls
    requestAnimationFrame(() => { const lt = v.querySelector('.lesson-top'); if (lt) conv.style.setProperty('--lt-h', lt.offsetHeight + 'px'); });
    const shrink = () => { if (!band.isConnected) return removeEventListener('scroll', shrink); band.classList.toggle('small', scrollY > 80); };
    addEventListener('scroll', shrink, { passive: true });
  } else { const bg = h('div', { class: 'bgscene', 'aria-hidden': 'true' }); bg.innerHTML = SCENES[L.scene.id] || SCENES.classroom; conv.append(bg); }
  const log = h('div', { class: 'log', role: 'log' }); conv.append(log);
  const modeLabel = { easier: 'shorter, more tiles', default: 'default mix', harder: 'longer, more typing' }[C.mode];
  v.append(h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', {}, h('div', { class: 'eyebrow' }, 'The conversation · ' + L.scene.place), h('div', { class: 'faint' }, 'Difficulty: ' + modeLabel + (S.settings.difficulty === 'auto' ? ' (automatic)' : '') + ' · tap a word to hear it, twice for its card')), h('div', { class: 'seg', role: 'group', 'aria-label': 'Difficulty' }, ['easier', 'default', 'harder'].map(m => h('button', { 'aria-pressed': C.mode === m, onclick: () => { S.settings.difficulty = m; save('settings'); ls.conv = null; save('progress'); render(); } }, m)))));
  C.log.forEach(m => log.append(bubble(m)));
  v.append(conv);
  const turnbox = h('div', { class: 'turnbox' }); conv.append(turnbox);
  advance();
  function bubble(m) {
    const b = h('div', { class: 'bub ' + m.who + (m.done ? ' done' : '') });
    if (m.who === 'w') { b.dataset.mood = m.mood || 'neutral'; if (banded && (NIGHT_CAST[speaker(m)] || ART[speaker(m)])) b.append(bustEl(speaker(m), m.mood, 40)); }
    const box = h('div', { class: 'box' });
    const ul = glossEl(m.de, m.g); box.append(h('div', { class: 'row' }, ul, h('button', { class: 'icon-btn sm', 'aria-label': 'Play line', html: ICONS.play, onclick: () => { if (m.who === 'w') Voice.mood(m.mood); speak(m.de, { el: ul }); } })));
    if (m.who === 'l') { if (m.done) box.append(h('span', { class: 'check', 'aria-label': 'correct' }, '✓')); const en = h('div', { class: 'en-after', hidden: !m.showEn }, fill(m.en)); box.append(en); if (!m.showEn) box.append(h('button', { class: 'faint', style: 'font-size:.8rem;text-decoration:underline', onclick: e => { en.hidden = false; e.target.remove(); } }, 'show English')); }
    if (m.react) box.append(h('div', { class: 'reaction' }, m.react));
    b.append(box); return b;
  }
  function advance() {
    turnbox.innerHTML = ''; KEYS = null;
    if (C.pos >= C.queue.length) { C.finished = true; save('progress'); turnbox.append(h('p', { class: 'muted small' }, 'End of the conversation.')); actionBar({ buttons: [h('button', { class: 'btn ghost', onclick: () => playWhole() }, 'Play it all'), h('button', { class: 'btn', onclick: () => finishLesson(L, ls) }, 'Finish the lesson')] }); KEYS = e => { if (e.key === 'Enter') finishLesson(L, ls); }; return; }
    const q = C.queue[C.pos], t = L.conv[q.i];
    if (!t.l) { const m = { who: 'w', de: fill(t.w), g: t.g, mood: t.mood, sp: t.who || 'cast.weber', i: q.i }; C.log.push(m); C.pos++; save('progress'); log.append(bubble(m)); if (banded) { track(m); drawBand(); } Voice.mood(t.mood); advance(); return; }
    learnerTurn(q, t);
  }
  function learnerTurn(q, t) {
    const type = q.type; const attempts = { n: C.attempts || 0 }; const ladder = h('div', { class: 'ladder' });
    const prompt = h('div', { class: 'prompt' }, q.again ? 'Once more: ' : 'Your line: ', type === 'tiles' ? 'build it from the tiles.' : type === 'gap' ? 'fill the gap' + (t.gaps.length > 1 ? 's' : '') + '.' : type === 'translate' ? h('span', {}, 'say in German: ', h('b', {}, fill(t.en))) : h('span', {}, 'answer truthfully, in German.'));
    if (type === 'tiles' || type === 'gap') prompt.append(h('div', { class: 'faint', style: 'font-weight:400' }, 'The English appears if you miss.'));
    turnbox.append(prompt);
    let widget;
    if (type === 'tiles') widget = tilesWidget(fill(t.de).split(/\s+/), (t.extra || []).map(fill), () => { });
    else if (type === 'gap') widget = gapWidget(t.de, t.gaps);
    else widget = typeWidget({}, () => check());
    turnbox.append(widget.el, ladder);
    if (widget.focus) setTimeout(() => widget.focus(), 50);
    if (attempts.n >= 1) ladder.append(fbEl('note', 'Meaning: <b>' + esc(fill(t.en)) + '</b>'));
    const checkBtn = h('button', { class: 'btn', onclick: () => check() }, 'Check');
    actionBar({ buttons: [checkBtn] });
    KEYS = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); check(); } };
    let busy = false;
    async function check() {
      if (busy) return; const ans = widget.value().trim(); if (!ans) return;
      busy = true; checkBtn.disabled = true;
      let r;
      if (type === 'free') {
        const fr = await checkFree(ans, L.conv[q.i - 1] ? L.conv[q.i - 1].w : '', L.words.map(w => w.de));
        if (fr) r = fr.ok ? { ok: true, exact: true } : { ok: false, hint: esc(fr.hint || fr.issue || 'Not quite understandable yet.') };
        else { r = diagnose(ans, t.de, lex, t.g, t.alts || []); if (!r.ok) { busy = false; checkBtn.disabled = false; selfJudge(ans); return; } }
      } else r = diagnose(ans, t.de, lex, t.g, t.alts || []);
      busy = false; checkBtn.disabled = false; settle(r, ans);
    }
    function selfJudge(ans) { // Claude unavailable: show the model answer and let him judge (Right / Close / Wrong)
      ladder.innerHTML = ''; const ul = glossEl(t.de, t.g);
      ladder.append(h('div', { class: 'fb note', style: 'flex-direction:column;align-items:stretch' }, h('div', {}, 'Claude is not available to check a free answer. A model answer:'), h('div', { class: 'row' }, ul, playBtn(t.de)), h('div', {}, 'How close was yours?')));
      actionBar({ buttons: [h('button', { class: 'btn ghost', onclick: () => settle({ ok: false, hint: 'Compare your line with the model answer, then try once more.' }, ans) }, 'Wrong'), h('button', { class: 'btn ghost', onclick: () => settle({ ok: true, exact: false, note: 'Close enough to be understood.' }, ans) }, 'Close'), h('button', { class: 'btn', onclick: () => settle({ ok: true, exact: true }, ans) }, 'Right')] });
      KEYS = null;
    }
    function settle(r, ans) {
      if (r.ok) {
        const first = attempts.n === 0; uiSound('ok'); Voice.nod(); Voice.mood('pleased');
        C.firstTry.push(first ? 1 : 0); S.progress.recent = S.progress.recent.concat(first ? 1 : 0).slice(-40);
        if (!first && !q.again) C.missed.push(q.i);
        const [rde, ren] = t.react ? fill(t.react).split('=') : ['', '']; const react = rde ? rde + (ren ? ' · ' + ren : '') : '';
        C.log.push({ who: 'l', de: ans.replace(/\s+/g, ' '), g: null, en: t.en, done: true, showEn: !first, react, note: r.note });
        C.pos++; C.attempts = 0; save('progress');
        log.append(bubble(C.log[C.log.length - 1])); if (r.note) log.append(h('div', { class: 'fb ok', style: 'align-self:flex-end;max-width:90%', html: '✓ ' + r.note }));
        turnbox.innerHTML = ''; document.querySelector('.actionbar')?.remove(); setTimeout(advance, r.note ? 1200 : 500);
      } else {
        attempts.n++; C.attempts = attempts.n; save('progress'); uiSound('bad', r);
        if (attempts.n === 1) { ladder.append(fbEl('note', 'Meaning: <b>' + esc(fill(t.en)) + '</b>')); Voice.mood('thinking'); actionBar({ buttons: [checkBtn] }); }
        else if (attempts.n === 2) { ladder.append(fbEl('hint', r.hint)); Voice.mood('thinking'); actionBar({ buttons: [checkBtn] }); }
        else {
          const ul = glossEl(t.de, t.g); ladder.append(h('div', { class: 'fb note', style: 'flex-direction:column;align-items:stretch' }, h('div', {}, 'The line is:'), h('div', { class: 'row' }, ul, playBtn(t.de)))); ladder.append(explainBtn(ans, fill(t.de), fill(t.en))); speak(t.de, { el: ul });
          C.firstTry.push(0); S.progress.recent = S.progress.recent.concat(0).slice(-40); if (!q.again) C.missed.push(q.i);
          const at = Math.min(C.queue.length, C.pos + 1 + 2 + (C.requeued % 2)); C.queue.splice(at, 0, { i: q.i, type: q.type, again: true }); C.requeued++;
          C.log.push({ who: 'l', de: fill(t.de), g: t.g, en: t.en, done: false, showEn: true, react: '' });
          C.pos++; C.attempts = 0; save('progress'); widget.disable();
          const cont = () => { log.append(bubble(C.log[C.log.length - 1])); advance(); };
          actionBar({ state: 'bad', msg: 'It comes back in a few turns.', buttons: [h('button', { class: 'btn', onclick: cont }, 'Continue')] }); KEYS = e => { if (e.key === 'Enter') cont(); };
        }
      }
    }
  }
  async function playWhole() { for (const m of C.log) { Voice.mood(m.mood || 'neutral'); await speak(m.de); await new Promise(r => setTimeout(r, 350)); } }
}
function finishLesson(L, ls) {
  const C = ls.conv || { missed: [], firstTry: [], queue: [] };
  const missed = new Set(C.missed);
  // every learner turn becomes a conversation card: missed ones due now, the rest in 3 days (§8.4, extended)
  L.conv.forEach((t, i) => { if (!t.l) return; const prev = L.conv[i - 1] && L.conv[i - 1].w ? { de: fill(L.conv[i - 1].w), g: fill(L.conv[i - 1].g) } : null; addSentenceCard(t, L.n, { due: missed.has(i) ? todayStr() : addDays(todayStr(), 3), prompt: prev }); });
  if (!S.progress.lessonsDone.includes(L.n)) S.progress.lessonsDone.push(L.n);
  ls.step = 'done'; ls.summary = { missed: missed.size, first: C.firstTry.filter(x => x).length, total: C.firstTry.length, added: (ls.newWords || L.words).length };
  save('progress'); NAV = 'fwd'; render(); uiSound('done'); Voice.proud(3200); if (!reduced()) confetti();
}
function countUp(el, n) { if (reduced() || n === 0) { el.textContent = n; return; } const t0 = performance.now(), d = 700; const f = t => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }

/* ---------- PRACTICE: reviews + word bank ---------- */
let PR = null; // review session
function reviewTitle() { const q = PR.queue, k = q[0] && q[0].kind; const T = { mc: 'Word meanings', gap: 'Fill the gaps', order: 'Build sentences', trans: 'Translate to German', li: 'Listening', ls: 'Say it in German', sent: 'Conversation lines' }; return PR.stop ? 'Wiederholung' : (k && q.every(x => x.extra && x.kind === k) && T[k]) || 'Wiederholung'; }
function renderPractice(v) {
  if (PR && PR.queue.length) { renderReview(v); return; }
  renderPracticeHub(v);
}
function finishReviewSession() {
  const stop = PR.stop, stats = PR.stats; PR = null;
  if (stop) { S.progress.reviewStops = [...new Set([...(S.progress.reviewStops || []), stop])]; save('progress'); }
  REVIEW_SUMMARY = Object.assign({ stop }, stats); route = 'practice'; NAV = 'fwd'; render();
}
function summarize(due) { const k = {}; due.forEach(d => k[d.kind] = (k[d.kind] || 0) + 1); return Object.entries(k).map(([t, n]) => n + ' ' + ({ r: 'word → meaning', p: 'meaning → word', sent: 'conversation line', li: 'listening' }[t])).join(', ') + '.'; }
function startReview(items) { // every 3rd recognition card with interval ≥7 becomes a listening card (word or its sentence)
  // daily reviews mix in every exercise type once a word is settling in (interval in days): listening ≥7, gap ≥4, sentence order ≥7, translation ≥10
  const q = shuffle(items).map((it, i) => { if (it.kind !== 'r' || !it.c.r || it.extra) return it; const iv = it.c.r[1], k = i % 6;
    const kind = iv >= 10 && k === 5 ? 'trans' : iv >= 7 && k === 4 ? 'order' : iv >= 4 && k === 2 ? 'gap' : iv >= 7 && k === 0 ? (i % 2 ? 'li' : 'ls') : iv < 4 && k === 3 ? 'mc' : 'r';
    return kind === 'r' ? it : Object.assign({}, it, { kind }); });
  PR = { queue: q, done: 0, total: q.length, stats: { n: 0, good: 0, missed: [], t0: Date.now() } }; REVIEW_SUMMARY = null; route = 'practice'; NAV = 'fwd'; render();
}
function renderReview(v) {
  const it = PR.queue[0]; if (!it) { const stop = PR.stop; PR = null; if (stop) { S.progress.reviewStops = [...new Set([...(S.progress.reviewStops || []), stop])]; save('progress'); route = 'learn'; toast('Wiederholung done'); } NAV = 'fade'; render(); return; }
  const def = it.c.sent ? null : wordDef(it.id); const card = h('div', { class: 'card stack' });
  if (['gap', 'order', 'trans'].includes(it.kind) && !(def && def.ex && def.exEn && /\[[^\]]+\]/.test(def.ex))) it.kind = 'r';
  if (it.kind === 'mc' && !def) it.kind = 'r';
  v.append(h('div', { class: 'lesson-top rv-top' }, h('div', { class: 'who' }, teacherSlot(44, 'neutral'), h('div', { style: 'min-width:0;display:flex;flex-direction:column' }, h('b', { lang: 'de' }, reviewTitle()), h('span', { class: 'lbl' }, `${PR.done + 1} / ${PR.total}`))),
    h('button', { class: 'icon-btn sm close', 'aria-label': 'Stop reviewing', html: ICONS.x, onclick: () => { const back = PR && PR.stop; PR = null; if (back) route = 'learn'; NAV = 'fade'; render(); } }),
    h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(100 * PR.done / Math.max(1, PR.total))}%` }))));
  v.append(card);
  const fb = h('div', { class: 'ladder' }); let attempts = 0, result = null, graded = false;
  const grade = g => { if (graded) return; graded = true; const key = it.kind === 'p' ? 'p' : 'r'; it.c[key] = schedule(it.c[key] || newCard(), g); it.c.hist = (it.c.hist || []).concat([[todayStr(), it.kind, g]]).slice(-30); save(null, it.sh || cardShard(it.id)); dayLog('reviews', 1); PR.stats.n++; if (g >= 2) PR.stats.good++; if (g === 0) PR.stats.missed.push(it.id); if (g === 0 && !it.extra) PR.queue.push(it); PR.queue.shift(); PR.done++; NAV = 'fwd'; if (!PR.queue.length) finishReviewSession(); else render(); };
  const showGrades = (pre, state, msg) => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); const btns = ['Again', 'Hard', 'Good', 'Easy'].map((l, i) => h('button', { class: 'btn ' + (i === pre ? '' : 'ghost'), style: 'flex:1', onclick: () => grade(i) }, h('kbd', { class: 'kbd', style: 'margin-right:6px' }, i + 1), l)); actionBar({ state, msg, buttons: btns }); KEYS = e => { const n = parseInt(e.key); if (n >= 1 && n <= 4) grade(n - 1); if (e.key === 'Enter') grade(pre); }; };
  const bare = def ? it.id.replace(/^(der|die|das) /, '') : '';
  const exRow = () => def && def.ex ? h('div', { class: 'row' }, glossEl(def.ex.replace(/[\[\]]/g, ''), def.exG || null), playBtn(def.ex.replace(/[\[\]]/g, ''))) : '';
  if (it.kind === 'r' || it.kind === 'li' || it.kind === 'ls') {
    const sentence = def && def.ex ? def.ex.replace(/[\[\]]/g, '') : bare; const heard = it.kind === 'ls' ? sentence : bare;
    if (it.kind === 'r') { const head = h('div', { class: 'wcard' }); if (def && def.pic && PICS[def.pic]) { const i = h('div', { class: 'illus' }); i.innerHTML = PICS[def.pic]; head.append(i); } head.append(h('div', { class: 'de' }, artEl(it.id)), playBtn(bare)); card.append(h('div', { class: 'eyebrow' }, 'What does it mean?'), head); }
    else { card.append(h('div', { class: 'eyebrow' }, it.kind === 'ls' ? 'Listening: type the sentence you hear' : 'Listening: type the word you hear'), h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'btn quiet', html: ICONS.play + ' Play again', onclick: () => speak(heard) }), h('button', { class: 'btn quiet sm', html: ICONS.slow + ' Slow', onclick: () => speak(heard, { rate: .7 }) }))); setTimeout(() => speak(heard), 300); }
    const inp = it.kind === 'r' ? h('input', { type: 'text', placeholder: 'in English', 'aria-label': 'English meaning', autocomplete: 'off' }) : deInput({ placeholder: 'in German', 'aria-label': 'What you heard' });
    const check = () => {
      if (result) return; const a = inp.value.trim(); if (!a) return; fb.innerHTML = '';
      if (it.kind === 'r') { result = checkEnglish(a, def ? def.en : []); if (result.ok) { uiSound('ok'); fb.append(exRow()); showGrades(2, 'ok', '✓ ' + esc(def.en.join(', ')) + (result.note ? ' — ' + esc(result.note) : '')); } else { uiSound('bad'); fb.append(exRow()); showGrades(0, 'bad', '<em lang="de">' + esc(it.id) + '</em> = ' + esc(def ? def.en.join(', ') : '?')); } }
      else { const target = it.kind === 'ls' ? sentence : it.id; const r = diagnose(a, target, mergedLex({}), def ? def.exG : null, it.kind === 'ls' ? [] : [bare]); result = r; if (r.ok) { uiSound('ok'); fb.append(exRow()); showGrades(2, 'ok', '✓ <em lang="de">' + esc(target) + '</em> — ' + esc(def ? (it.kind === 'ls' ? def.exEn : def.en.join(', ')) : '') + (r.note ? ' ' + r.note : '')); } else { uiSound('bad', r); fb.append(exRow()); showGrades(0, 'bad', 'It was <em lang="de">' + esc(target) + '</em> (' + esc(def ? (it.kind === 'ls' ? def.exEn : def.en.join(', ')) : '') + ').'); } }
    };
    card.append(inp, it.kind === 'r' ? '' : h('div', { class: 'row' }, umlautRow(inp), micBtn(inp, check)), fb); setTimeout(() => inp.focus(), 50);
    actionBar({ buttons: [h('button', { class: 'btn', onclick: check }, 'Check')] }); KEYS = e => { if (e.key === 'Enter') check(); };
  } else if (['mc', 'gap', 'order', 'trans'].includes(it.kind)) {
    renderDrill(card, it, def, fb, showGrades, exRow);
  } else if (it.kind === 'p') {
    card.append(h('div', { class: 'eyebrow' }, 'Say it in German'), h('div', { class: 'wcard' }, h('div', { class: 'de', style: 'font-size:1.8rem' }, def.en.join(', ')), h('div', { class: 'faint' }, (def.type === 'n' ? 'noun, with its article' : { v: 'verb (dictionary form)', phrase: 'phrase' }[def.type] || ''))));
    const w = typeWidget({ placeholder: 'auf Deutsch', 'aria-label': 'German word' }, () => check()); const inp = w.inputs[0];
    const check = () => {
      if (result) return; const a = inp.value.trim(); if (!a) return; const r = diagnose(a, it.id, mergedLex({}), null, def.type === 'n' ? [bare] : []); result = r; fb.innerHTML = ''; fb.append(exRow());
      if (r.ok) { uiSound('ok'); const noArt = def.type === 'n' && !/^(der|die|das)\b/i.test(a); showGrades(noArt ? 1 : 2, 'ok', '✓ <em lang="de">' + esc(it.id) + '</em>' + (noArt ? ' — say the article with it: ' + { m: 'der', f: 'die', n: 'das' }[def.g] : '') + (r.note ? ' ' + r.note : '')); }
      else { uiSound('bad', r); speak(bare); showGrades(0, 'bad', 'It is <em lang="de">' + esc(it.id) + '</em>. ' + (r.hint || '')); }
    };
    card.append(w.el, fb); setTimeout(() => inp.focus(), 50); actionBar({ buttons: [h('button', { class: 'btn', onclick: check }, 'Check')] }); KEYS = e => { if (e.key === 'Enter') check(); };
  } else { // conversation line with the help ladder
    const s = it.c.sent; const useGap = s.gaps && s.gaps.length && Math.random() < .5;
    card.append(h('div', { class: 'eyebrow' }, 'Conversation · ' + (useGap ? 'fill the gap' : 'your reply, in German')));
    if (s.prompt) { const ul = glossEl(s.prompt.de, s.prompt.g); card.append(h('div', { class: 'bub w' }, h('div', { class: 'box' }, h('div', { class: 'row' }, ul, h('button', { class: 'icon-btn sm', html: ICONS.play, 'aria-label': 'Play', onclick: () => speak(s.prompt.de, { el: ul }) }))))); }
    card.append(h('p', {}, h('b', {}, s.en)));
    const widget = useGap ? gapWidget(s.de, s.gaps) : typeWidget({}, () => check());
    const L = lessonById(it.c.lesson) || LESSONS[0];
    const check = () => {
      if (result) return; const a = widget.value().trim(); if (!a) return; const r = diagnose(a, s.de, mergedLex(L.lex), s.g, s.alts || []); fb.innerHTML = '';
      if (r.ok) { result = r; uiSound('ok'); fb.append(h('div', { class: 'row' }, glossEl(s.de, s.g), playBtn(s.de))); showGrades(attempts ? 1 : 2, 'ok', '✓ ' + (r.note || 'Richtig.')); }
      else { attempts++; uiSound('bad', r); if (attempts === 1) actionBar({ state: 'bad', msg: r.hint, buttons: [h('button', { class: 'btn', onclick: check }, 'Check again')] }); else { result = r; fb.append(h('div', { class: 'row' }, glossEl(s.de, s.g), playBtn(s.de))); speak(s.de); showGrades(0, 'bad', 'The line is <em lang="de">' + esc(s.de) + '</em>'); } }
    };
    card.append(widget.el, fb); if (widget.focus) setTimeout(() => widget.focus(), 50); actionBar({ buttons: [h('button', { class: 'btn', onclick: check }, 'Check')] }); KEYS = e => { if (e.key === 'Enter') check(); };
  }
}
/* a calm empty state: icon, what is missing, and the way forward */
function emptyState(icon, title, text, action) {
  const e = h('div', { class: 'empty', role: 'note' }, h('div', { class: 'empty-icon' }, sigEl(icon)), h('h3', {}, title), h('p', { class: 'muted' }, text));
  if (action) e.append(h('button', { class: 'btn ghost', onclick: action[1] }, action[0]));
  return e;
}
function wordBank() {
  const c = h('div', { class: 'card stack' }, h('h2', {}, 'Your words'), h('p', { class: 'muted small' }, 'A growing collection of Berlin. The ring fills as a word gets stronger. Tap a tile for its card and history.'));
  const search = h('input', { type: 'text', placeholder: 'Search', 'aria-label': 'Search words', id: 'bank-search' });
  const fLesson = h('select', { 'aria-label': 'Filter by set' }, h('option', { value: '' }, 'All sets')); const fType = h('select', { 'aria-label': 'Filter by type' }, h('option', { value: '' }, 'All types'), ...['n', 'v', 'adj', 'adv', 'prep', 'phrase', 'interj', 'pron', 'conj', 'part', 'q', 'num'].map(t => h('option', { value: t }, TYPE_LABEL[t] + 's')));
  const fStr = h('select', { 'aria-label': 'Filter by strength' }, h('option', { value: '' }, 'Any strength'), h('option', { value: 'weak' }, 'Weak (2+ lapses)'), h('option', { value: 'new' }, 'New (< 4 days)'), h('option', { value: 'strong' }, 'Strong (≥ 14 days)'));
  const grid = h('div', { class: 'bank' }); const detail = h('div', { class: 'stack' });
  const entries = Object.values(S.cards).flatMap(sh => Object.entries(sh.w || {})).filter(([id, cd]) => cd.learned && !cd.sent);
  const groupKey = cd => cd.lesson ? 'L' + cd.lesson : (cd.v1 ? 'V' + cd.v1 : 'imp');
  const groupLabel = k => k[0] === 'L' ? courseOf(+k.slice(1)).station + ' · Lesson ' + k.slice(1) : k === 'imp' ? 'Imported' : 'From Protoa v1 · ' + courseOf(+k.slice(1)).topic;
  const groupIcon = k => k === 'imp' ? 'question' : courseOf(+k.slice(1)).icon;
  const keys = [...new Set(entries.map(([id, cd]) => groupKey(cd)))].sort((a, b) => (a[0] === 'L' ? 0 : 1) - (b[0] === 'L' ? 0 : 1) || a.localeCompare(b, undefined, { numeric: true })); keys.forEach(k => fLesson.append(h('option', { value: k }, groupLabel(k))));
  const draw = () => {
    grid.innerHTML = ''; const q = search.value.toLowerCase();
    let items = entries.filter(([id, cd]) => { const d = wordDef(id) || { en: [] }; if (q && !(id.toLowerCase().includes(q) || d.en.join(' ').toLowerCase().includes(q))) return false; if (fLesson.value !== '' && groupKey(cd) !== fLesson.value) return false; if (fType.value && d.type !== fType.value) return false; const iv = cd.r ? cd.r[1] : 0; if (fStr.value === 'weak' && !(cd.r && cd.r[4] >= 2)) return false; if (fStr.value === 'new' && iv >= 4) return false; if (fStr.value === 'strong' && iv < 14) return false; return true; });
    if (!items.length) { grid.append(entries.length ? emptyState('question', 'No words match', 'Try a shorter search or clear a filter.', ['Clear filters', () => { search.value = ''; fLesson.value = fType.value = fStr.value = ''; draw(); }]) : emptyState('brezel', 'Your collection starts here', 'Each word you learn becomes a tile. Finish a lesson, or import your progress in Profile → Settings.', ['Go to Lessons', () => go('learn')])); return; }
    items.sort((a, b) => keys.indexOf(groupKey(a[1])) - keys.indexOf(groupKey(b[1])) || a[0].localeCompare(b[0]));
    let last = null;
    items.forEach(([id, cd]) => { const d = wordDef(id) || { en: ['?'] }; const k = groupKey(cd); if (k !== last) { last = k; grid.append(h('div', { class: 'grp' }, sigEl(groupIcon(k)), h('span', { class: 'eyebrow' }, groupLabel(k)))); }
      const t = h('button', { class: 'btile', onclick: () => showDetail(id, cd, d) }); if (d.pic && PICS[d.pic]) { const i = h('div', { class: 'illus sm' }); i.innerHTML = PICS[d.pic]; t.append(i); } t.append(h('div', { class: 'de', lang: 'de' }, artEl(id)), h('div', { class: 'en' }, d.en.join(', ')), ringEl(strengthOf(cd.r), 22)); grid.append(t); });
  };
  const showDetail = (id, cd, d) => { detail.innerHTML = ''; const full = wordDef(id); detail.append(full && full.ex ? wordCard(full) : h('div', { class: 'card' }, h('b', {}, id), ' — ', d.en.join(', '))); const hist = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'History'), h('div', { class: 'tbl' }, h('b', {}, 'Learned'), h('span', {}, cd.since || '—'), h('b', {}, 'Next review'), h('span', {}, cd.r ? cd.r[0] + ' (every ' + cd.r[1] + ' d)' : '—'), h('b', {}, 'Reviews'), h('span', {}, (cd.r ? cd.r[3] : 0) + ' · lapses ' + (cd.r ? cd.r[4] : 0)), h('b', {}, 'Production'), h('span', {}, cd.p ? 'unlocked, next ' + cd.p[0] : 'unlocks when recognition ≥ 4 days'))); if (cd.hist && cd.hist.length) hist.append(h('div', { class: 'small muted' }, cd.hist.slice(-8).map(([dt, k, g]) => `${dt} ${({ r: 'meaning', p: 'word', li: 'listening', ls: 'sentence', sent: 'line' })[k] || k} → ${['again', 'hard', 'good', 'easy'][g]}`).join(' · '))); detail.append(hist); detail.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); };
  [search, fLesson, fType, fStr].forEach(e => e.addEventListener('input', draw)); draw();
  c.append(h('div', { class: 'row' }, h('div', { class: 'grow' }, search), fLesson, fType, fStr), grid); return h('div', { class: 'stack' }, c, detail);
}

/* ---------- GRAMMAR ---------- */
function renderGrammar(v, openId) {
  if (!v) { route = 'grammar'; renderTabs(); document.body.classList.remove('in-lesson'); document.querySelector('.actionbar')?.remove(); v = newView(); }
  if (openId) { const u = GRAMMAR.find(g => g.id === openId); if (u) { grammarUnit(v, u); return; } }
  v.append(h('div', { class: 'pagehead' }, teacherSlot(52, 'neutral'), h('h1', {}, 'Grammar')), h('p', { class: 'muted' }, 'Short reference units, each with glossed examples and five drills. Lessons link here with "Show how it works"; nothing here is required.'));
  const list = h('div', { class: 'stack' }); GRAMMAR.forEach(u => list.append(h('button', { class: 'card listrow', onclick: () => { const vv = newView(); grammarUnit(vv, u); } }, h('div', { class: 'grow' }, h('b', {}, u.title), h('div', { class: 'faint' }, u.stub ? 'Outline · full unit arrives with lesson ' + u.lesson : 'From lesson ' + u.lesson)), h('span', { class: 'muted' }, '›')))); v.append(list);
}
function grammarUnit(v, u) {
  v.append(h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', onclick: () => go('grammar') }, '‹ Grammar')), h('div', { class: 'pagehead' }, teacherSlot(52, 'neutral'), h('h1', {}, u.title)));
  if (u.stub) { v.append(h('div', { class: 'card', html: u.stub })); return; }
  const c = h('div', { class: 'card stack', html: u.body }); if (u.table) { const g = h('div', { class: 'conj' }); u.table.forEach(([p, f]) => g.append(h('span', {}, p), h('span', { lang: 'de' }, h('b', {}, f)))); c.append(g); } v.append(c);
  const ex = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Examples')); u.examples.forEach(e => { const ul = glossEl(e.de, e.g); ex.append(h('div', { class: 'stack', style: 'gap:4px' }, h('div', { class: 'row' }, ul, h('button', { class: 'icon-btn sm', html: ICONS.play, 'aria-label': 'Play', onclick: () => speak(e.de, { el: ul }) })), h('div', { class: 'muted small' }, e.en))); }); v.append(ex);
  const dr = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Drills'));
  u.drills.forEach((d, i) => { const inp = deInput({ placeholder: '…', 'aria-label': 'Drill ' + (i + 1) }); const fb = h('div', {}); const chk = () => { const a = stripPunct(applyShortcuts(inp.value)).trim().toLowerCase().replace(/\s+/g, ' '); fb.innerHTML = ''; if (d.a.some(x => fold(x) === fold(a))) { uiSound('ok'); fb.append(fbEl('ok', '✓')); } else { uiSound('bad'); fb.append(fbEl('hint', 'Not yet. Answer: <em>' + esc(d.a[0]) + '</em>')); } }; inp.addEventListener('keydown', e => { if (e.key === 'Enter') chk(); }); dr.append(h('div', { class: 'stack', style: 'gap:6px' }, h('div', {}, h('b', { lang: 'de' }, d.q), h('span', { class: 'faint' }, ' — ' + d.en)), h('div', { class: 'row' }, h('div', { class: 'grow' }, inp), h('button', { class: 'btn sm', onclick: chk }, 'Check')), umlautRow(inp), fb)); });
  v.append(dr);
}

/* ---------- MORE: Sounds, Method, Settings ---------- */
function openMore(fn) { route = 'profile'; lastLayout = applyLayout(); renderTabs(); document.getElementById('rail') && (document.getElementById('rail').innerHTML = ''); document.body.classList.remove('in-lesson'); document.querySelector('.actionbar')?.remove(); fn(newView()); window.scrollTo({ top: 0 }); }
function renderMore(v) {
  v.append(h('h1', {}, 'More'));
  const items = [['Sounds (Lesson 0)', 'German spelling to sound, once', renderSounds], ['Method', 'Why each feature exists, with sources', renderMethod], ['Settings', 'Goal, about me, audio, theme, import & export', renderSettings]];
  items.forEach(([t, d, fn]) => v.append(h('button', { class: 'card listrow', onclick: () => openMore(fn) }, h('div', { class: 'grow' }, h('b', {}, t), h('div', { class: 'faint' }, d)), h('span', { class: 'muted' }, '›'))));
}
function backMore() { return h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', onclick: () => { NAV = 'back'; route = 'profile'; render(); } }, '‹ Profile')); }
function renderSounds(v) {
  v.append(backMore(), h('div', { class: 'hero' }, teacherSlot(56, 'neutral'), h('div', { class: 'grow' }, h('h1', {}, 'Lesson 0: Sounds'), h('p', { class: 'muted' }, 'German spelling is regular. Learn these pairings once and you can read any new word aloud. Tap a word to hear it.'))));
  const c = h('div', { class: 'card stack', style: 'gap:18px' });
  SOUNDS.forEach(r => c.append(h('div', { class: 'rule' }, h('div', { class: 'k', lang: 'de' }, r.k), h('div', { class: 'stack', style: 'gap:6px' }, h('div', {}, r.say), h('div', { class: 'ex' }, r.ex.map(([w, m]) => h('button', { type: 'button', lang: 'de', onclick: () => speak(w) }, w, h('small', {}, m))))))));
  v.append(c, h('div', { class: 'card row', style: 'justify-content:space-between' }, h('span', {}, S.progress.sounds ? 'Done. Come back any time.' : 'Mark as done when you have been through the list.'), h('button', { class: 'btn' + (S.progress.sounds ? ' ghost' : ''), onclick: () => { S.progress.sounds = true; save('progress'); toast('Lesson 0 done'); go('learn'); } }, S.progress.sounds ? 'Done ✓' : 'Mark done')));
}
function renderMethod(v) {
  v.append(backMore(), h('h1', {}, 'Method'), h('p', { class: 'muted' }, 'Why the app works the way it does. Each note says how solid the evidence is: established, inferred from related evidence, or our own speculation.'));
  METHOD.forEach(m => v.append(h('div', { class: 'card stack', style: 'gap:6px' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', {}, m.f), h('span', { class: 'srclabel ' + m.lab }, { est: 'established', inf: 'inferred', spec: 'speculative' }[m.lab])), h('p', {}, m.why), h('p', { class: 'faint' }, 'Source: ' + m.src))));
  v.append(h('div', { class: 'card stack', style: 'gap:6px' }, h('b', {}, 'Audio'), h('p', { class: 'small muted' }, 'All German is meant to be read by one voice (the open Piper model de_DE-thorsten-high) pre-rendered as audio sprites. Until those are rendered, the browser\'s own German voice reads the text at a slightly slower rate. Sentences never play on their own; word audio follows your setting.')));
}
function voiceCard(s) {
  const card = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, "Protoa's voice"),
    h('p', { class: 'small muted' }, 'Protoa speaks with the best German voice on this device, chosen for a modern, educated, deep male voice. You can pick another one here.'));
  const sel = h('select', { id: 'voice-select', 'aria-label': "Protoa's voice" }), note = h('div', {});
  sel._fill = () => {
    const all = germanVoices(); sel.innerHTML = '';
    const best = all[0];
    sel.append(h('option', { value: '' }, 'Automatic' + (best ? ' (' + best.v.name.replace(/Microsoft |Online |\(Natural\)| - .*$/g, '').trim() + ')' : '')));
    all.forEach(x => sel.append(h('option', { value: x.v.name }, x.v.name + ' · ' + (x.sex === 'm' ? 'male' : x.sex === 'f' ? 'female' : 'voice') + (x.quality !== 'standard' ? ' · ' + x.quality : ''))));
    sel.value = all.some(x => x.v.name === s.voiceName) ? s.voiceName : '';
    note.innerHTML = '';
    const cur = all.find(x => x.v.name === sel.value) || best;
    if (!all.length) note.append(fbEl('note', 'No German voice is available in this browser yet. Protoa will speak once one is installed.'));
    else if (!cur || cur.sex !== 'm' || cur.score < 80) note.append(fbEl('hint', 'For the voice Protoa is designed for, use Microsoft Edge (voice “Conrad”), or on a Mac, iPhone or iPad download “Markus” or “Yannick” (Premium) under Settings → Accessibility → Spoken Content → Voices → German. On Windows, add German under Settings → Time & language → Speech. Then reload Protoa.'));
  };
  note.className = 'voicenote';
  sel.addEventListener('change', () => { s.voiceName = sel.value; save('settings'); sel._fill(); });
  const slider = (key, label, min, max, step, lo, hi) => { const i = h('input', { type: 'range', id: 'voice-' + key, min, max, step, value: s[key] == null ? (key === 'voiceDepth' ? .5 : .92) : s[key], 'aria-label': label });
    i.addEventListener('change', () => { s[key] = +i.value; save('settings'); });
    return h('label', { class: 'f' }, label, i, h('div', { class: 'row small muted', style: 'justify-content:space-between' }, h('span', {}, lo), h('span', {}, hi))); };
  card.append(sel, slider('voiceDepth', 'Depth', 0, 1, .05, 'lighter', 'deeper'), slider('voiceRate', 'Pace', .8, 1.05, .01, 'slower', 'faster'),
    h('button', { class: 'btn ghost', onclick: () => speak('Guten Tag. Ich bin Protoa. Schön, dass Sie heute da sind. Wollen wir anfangen?') }, h('span', { html: ICONS.play }), 'Hear Protoa'), note);
  sel._fill();
  return card;
}
function renderSettings(v) {
  const s = S.settings, p = S.profile;
  v.append(backMore(), h('h1', {}, 'Settings'));
  const goal = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Goal · German'));
  const level = h('select', { id: 'goal-level' }, ...[['B1', 'B1 · 2,400 words (minimum)'], ['B2', 'B2 · 4,000 words']].map(([l, t]) => h('option', { value: l, selected: s.level === l }, t)));
  const target = h('input', { type: 'number', id: 'goal-target', value: s.target, min: 2400, step: 100 });
  const fixedSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'What stays fixed' }, h('button', { 'aria-pressed': s.fixed === 'perDay', onclick: () => { s.fixed = 'perDay'; persist(); } }, 'words per day'), h('button', { 'aria-pressed': s.fixed === 'date', onclick: () => { s.fixed = 'date'; persist(); } }, 'target date'));
  const perDay = h('input', { type: 'number', id: 'goal-perday', value: s.perDay, min: 1, max: 200 }); const date = h('input', { type: 'date', id: 'goal-date', value: s.targetDate || '' }); const minutes = h('input', { type: 'number', id: 'goal-min', value: s.minutes, min: 5, max: 240 });
  const LEVEL_WORDS = { A1: 600, A2: 1200, B1: 2400, B2: 4000 };
  level.addEventListener('change', () => { if (LEVEL_WORDS[level.value]) target.value = LEVEL_WORDS[level.value]; persist(); });
  const persist = () => { s.level = level.value; s.target = Math.max(s.level === 'B2' ? 4000 : 2400, +target.value || 2400); target.value = s.target; s.perDay = Math.max(1, +perDay.value || 20); s.targetDate = date.value; s.minutes = +minutes.value || 20; save('settings'); calc.textContent = calcText(); fixedSeg.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', (i === 0) === (s.fixed === 'perDay'))); perDay.disabled = s.fixed === 'date'; date.disabled = s.fixed === 'perDay'; };
  const calcText = () => { const g = goalInfo(); return s.fixed === 'date' ? (s.targetDate ? `That is ${g.perDay} new words a day from today.` : 'Pick a date.') : `At ${g.perDay} a day you reach ${s.target.toLocaleString()} words around ${g.date}.`; };
  const calc = h('p', { class: 'small muted' }, calcText());
  goal.append(h('p', { class: 'faint' }, 'Every course runs to at least B1. A1 (600 words) and A2 (1,200) are milestones on the way; each ends with an exam you pass at 90 % before the line continues.'));
  [target, perDay, date, minutes].forEach(i => i.addEventListener('change', persist));
  goal.append(h('div', { class: 'grid2' }, h('label', { class: 'f' }, 'Target level', level), h('label', { class: 'f' }, 'Target words', target)), h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'small muted' }, 'Keep fixed:'), fixedSeg), h('div', { class: 'grid2' }, h('label', { class: 'f' }, 'New words per day', perDay), h('label', { class: 'f' }, 'Target date', date)), h('label', { class: 'f' }, 'Minutes per day', minutes), calc);
  perDay.disabled = s.fixed === 'date'; date.disabled = s.fixed === 'perDay';
  v.append(goal);
  const about = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'About me'));
  const fields = [['name', 'Your name'], ['city', 'Where you live'], ['field', 'What you study or do'], ['interests', 'Interests (3–5)'], ['why', "Why you're learning"]];
  fields.forEach(([k, l]) => { const i = k === 'interests' || k === 'why' ? h('textarea', { id: 'about-' + k }, p[k] || '') : h('input', { type: 'text', id: 'about-' + k, value: p[k] || '' }); i.addEventListener('change', () => { p[k] = i.value.trim(); save('profile'); }); about.append(h('label', { class: 'f' }, l, i)); });
  v.append(about);
  const pref = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Preferences'));
  const tog = (k, label) => { const i = h('input', { type: 'checkbox', id: 'pref-' + k, checked: !!s[k] }); i.addEventListener('change', () => { s[k] = i.checked; save('settings'); applyTheme(); }); return h('label', { class: 'toggle' }, h('span', {}, label), i); };
  pref.append(tog('autoWord', 'Play word audio automatically'), tog('uiSounds', 'Soft UI sounds'), tog('hideGloss', 'Hide glosses (self-test)'));
  const theme = h('div', { class: 'seg', role: 'group', 'aria-label': 'Theme' }, ...['system', 'light', 'dark'].map(t => h('button', { 'aria-pressed': s.theme === t, onclick: () => { s.theme = t; s.themeChosen = true; save('settings'); applyTheme(); theme.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.textContent === t)); } }, t)));
  const diff = h('div', { class: 'seg', role: 'group', 'aria-label': 'Conversation difficulty' }, ...['auto', 'easier', 'default', 'harder'].map(t => h('button', { 'aria-pressed': s.difficulty === t, onclick: () => { s.difficulty = t; save('settings'); diff.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.textContent === t)); } }, t)));
  pref.append(h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'small muted' }, 'Theme'), theme), h('div', { class: 'stack', style: 'gap:6px' }, h('span', { class: 'small muted' }, 'Conversation difficulty (auto follows your last 40 lines)'), diff), h('p', { class: 'faint' }, SR ? '"Say it" (microphone) is available in this browser.' : '"Say it" (speaking your line) needs Chrome; it is hidden here.'));
  const lay = h('div', { class: 'seg', role: 'group', 'aria-label': 'Layout' }, ...[['auto', 'Auto'], ['desktop', 'Desktop'], ['mobile', 'Mobile']].map(([k, l]) => h('button', { 'aria-pressed': (s.layout || 'auto') === k, onclick: () => { s.layout = k; save('settings'); lastLayout = applyLayout(); renderTabs(); lay.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', ['auto', 'desktop', 'mobile'][i] === k)); } }, l)));
  pref.append(h('div', { class: 'stack', style: 'gap:8px' }, h('span', { class: 'small muted' }, 'Layout (Auto picks desktop at 1024 px and wider, mobile below 640 px)'), lay));
  v.append(pref);
  v.append(voiceCard(s));
  const io = h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Import progress'), h('p', { class: 'small muted' }, 'Paste a JSON export from Protoa v1 or from this app. Words are merged, never overwritten with older data; imported words count as learned and show as "already yours" in lessons.'));
  const ta = h('textarea', { id: 'import-json', placeholder: '{ "lang": "de", "words": [ … ] }' }); const ifb = h('div', {});
  io.append(ta, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { try { const r = importJSON(ta.value); ifb.innerHTML = ''; ifb.append(fbEl('ok', `Imported: ${r.added} new, ${r.merged} merged.`)); ta.value = ''; } catch (e) { ifb.innerHTML = ''; ifb.append(fbEl('bad', 'Could not read that: ' + esc(e.message))); } } }, 'Import'), h('button', { class: 'btn ghost', onclick: async () => { const j = exportJSON(); ta.value = j; try { await navigator.clipboard.writeText(j); toast('Export copied to clipboard'); } catch (e) { ta.select(); toast('Export is in the box: copy it'); } } }, 'Export')), ifb);
  v.append(io);
  v.append(h('div', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Danger zone'), h('button', { class: 'btn ghost', onclick: () => { const b = h('button', { class: 'btn', style: 'background:var(--bad);color:#fff', onclick: () => { Object.keys(S.cards).forEach(k => { S.cards[k] = { w: {}, updatedAt: Date.now() }; save(null, k); }); S.progress = DEF_PROGRESS(); save('progress'); toast('Progress reset'); go('today'); } }, 'Yes, erase everything'); v.append(h('div', { class: 'card row' }, h('span', {}, 'Erase all German progress on this account?'), b)); } }, 'Reset progress…')));
}

/* ---------- Onboarding (§5) ---------- */
function onboarding() {
  const p = S.profile; const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'About you' }); const inner = h('div', { class: 'in' });
  inner.append(h('div', { class: 'row' }, h('div', { class: 'grow' }, h('h2', {}, 'Guten Tag. Ich bin Protoa.'), h('p', { class: 'muted small' }, 'Two minutes about you, so our conversations are about your life. Skip it if you like; it lives in Settings → About me.'))));
  const fields = [['name', 'Your name', 'Alex'], ['city', 'Where you live', 'Orlando'], ['field', 'What you study or do', 'computer science'], ['interests', 'Three to five interests', 'cycling, cinema, cooking…'], ['why', "Why you're learning German", '']];
  const inputs = {}; fields.forEach(([k, l, ph]) => { inputs[k] = k === 'interests' || k === 'why' ? h('textarea', { id: 'ob-' + k, placeholder: ph }, p[k] || '') : h('input', { type: 'text', id: 'ob-' + k, placeholder: ph, value: p[k] || '' }); inner.append(h('label', { class: 'f' }, l, inputs[k])); });
  const close = saveIt => { if (saveIt) Object.keys(inputs).forEach(k => p[k] = inputs[k].value.trim()); save('profile'); S.settings.onboarded = true; save('settings'); sheet.remove(); render(); };
  inner.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => close(true) }, 'Save and start'), h('button', { class: 'btn ghost', onclick: () => close(false) }, 'Skip for now')));
  sheet.append(inner); document.body.append(sheet); setTimeout(() => inputs.name.focus(), 100);
}

/* ---------- Generate a lesson with Claude (§12) ---------- */
async function generateLesson() {
  const gateG = examGate(); if (gateG) { openExamPreview(gateG.code); return; }
  if (!S.ai) { toast('Claude is not available right now.'); return; }
  const n = allLessons().length + 1; const known = Object.values(S.cards).flatMap(sh => Object.keys(sh.w || {})).filter(k => !k.startsWith('s:'));
  const plan = courseOf(n);
  toast('Protoa is writing lesson ' + n + '…');
  for (let tries = 0; tries < 2; tries++) {
    try {
      const r = await AI.run('generateLesson', { n, topic: plan.topic, station: plan.station, profile: aiProfile(), known, example: LESSONS[0], art: typeof ART_MANIFEST !== 'undefined' ? ART_MANIFEST.filter(a => ['plate', 'cast', 'event', 'word'].includes(a.kind)).map(({ id, kind, tags }) => ({ id, kind, tags })) : [] });
      const bad = validateLesson(r, n, known); if (bad.length) { console.warn('lesson rejected', bad); if (tries === 1) { toast('The lesson came back malformed: ' + bad[0]); return; } continue; }
      r.n = n; S.lessonsGen[n] = r; save('lessonsGen'); toast('Lesson ' + n + ' ready'); render(); return;
    } catch (e) { toast(AI.message(e, 'Could not write the lesson right now.')); return; }
  }
}
function validateLesson(L, n, known) {
  const bad = []; if (!L || typeof L !== 'object') return ['not an object'];
  for (const k of ['title', 'theme', 'scene', 'notice', 'can', 'words', 'build', 'conv', 'lex']) if (!L[k]) bad.push('missing ' + k);
  if (bad.length) return bad;
  if (!Array.isArray(L.words) || L.words.length < 8 || L.words.length > 14) bad.push('need 8–14 words');
  (L.words || []).forEach(w => { for (const k of ['de', 'en', 'type', 'ex', 'exEn', 'exG']) if (!w[k]) bad.push('word ' + (w.de || '?') + ' missing ' + k); if (!Array.isArray(w.en)) w.en = [String(w.en)]; if (known.includes(w.de)) bad.push('duplicate known word ' + w.de); });
  if (!Array.isArray(L.conv) || L.conv.length < 6) bad.push('conversation too short'); if (!(L.conv || []).some(t => t.l)) bad.push('no learner turns');
  if (!L.lex.verbs || !L.lex.nouns) bad.push('lexicon incomplete'); if (typeof ART_MANIFEST !== 'undefined') bad.push(...fixLessonArt(L, ART_MANIFEST)); else if (!SCENES[L.scene.id]) L.scene.id = 'classroom';
  try { bad.push(...checkGlosses(L)); } catch (e) { bad.push('gloss check failed'); }
  return bad;
}

