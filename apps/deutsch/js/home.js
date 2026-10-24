/* ===================== HOME: Protoa's dock on Today, the line card, the quick check, the first run =====================
   Protoa itself is the companion orb (companion.js); this file only makes room for it. A `.orb-dock` element is where
   it docks, at the dock's size, with nothing drawn over it. Around the dock, on an orbit that never crosses the shell,
   one satellite per milestone reached (computeStamps), and a hollow marker where the next one will appear. */

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const GREET_EN = { 'Guten Morgen': 'Good morning', 'Guten Tag': 'Hello', 'Guten Abend': 'Good evening' };

/* ---------- milestones on the outer orbit ----------
   Units: the shell has radius 100. The orbit (rx 178, ry 122, tipped −12°) stays outside it everywhere,
   so satellites never need to pass in front of or behind the orb. One lap takes LAP seconds; satellites are spaced evenly. */
const ORBIT = { rx: 178, ry: 122, tilt: -12, lap: 90, max: 24 };
function satClass(s) { return s.id.startsWith('lv') ? 'lv' : s.id.startsWith('st') || s.id === 'laute' ? 'st' : s.id.startsWith('w') ? 'w' : 'etc'; }
function orbitPoint(t) { const a = t * Math.PI * 2, x = ORBIT.rx * Math.cos(a), y = ORBIT.ry * Math.sin(a), r = ORBIT.tilt * Math.PI / 180; return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]; }
function milestoneOrbit(got, next) {
  const shown = got.slice(-ORBIT.max), n = shown.length + (next ? 1 : 0), still = reducedMotion();
  const path = `M ${ORBIT.rx} 0 A ${ORBIT.rx} ${ORBIT.ry} 0 1 1 ${-ORBIT.rx} 0 A ${ORBIT.rx} ${ORBIT.ry} 0 1 1 ${ORBIT.rx} 0`;
  const sat = (i, cls, r, title) => {
    const t = n ? i / n : 0;
    if (still) { const [x, y] = orbitPoint(t); return `<circle class="sat ${cls}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"><title>${esc(title)}</title></circle>`; }
    return `<g transform="rotate(${ORBIT.tilt})"><circle class="sat ${cls}" r="${r}"><title>${esc(title)}</title><animateMotion dur="${ORBIT.lap}s" begin="${(-t * ORBIT.lap).toFixed(2)}s" repeatCount="indefinite" path="${path}"/></circle></g>`;
  };
  const sats = shown.map((s, i) => { const c = satClass(s); return sat(i, c, c === 'lv' ? 7.5 : c === 'st' ? 5.5 : 4.5, s.t); }).join('')
    + (next ? sat(shown.length, 'next', 6, 'Next: ' + next.t) : '');
  return h('div', { class: 'orbit', 'aria-hidden': 'true', html:
    `<svg viewBox="-200 -150 400 300"><g transform="rotate(${ORBIT.tilt})"><ellipse class="track" rx="${ORBIT.rx}" ry="${ORBIT.ry}"/><ellipse class="flow" rx="${ORBIT.rx}" ry="${ORBIT.ry}" pathLength="1000"/></g>${sats}</svg>` });
}

/* ---------- the hero: Protoa alone, its milestones, and what it says ---------- */
function todayHero(L) {
  const name = S.profile.name, hour = new Date().getHours(), greet = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  const g0 = goalInfo(), left = Math.max(0, g0.perDay - g0.today);
  const stamps = computeStamps(), got = stamps.filter(s => s.on), next = stamps.find(s => !s.on);
  const say = g0.perDay && left === 0 ? "Today's words are done. Reviews keep them."
    : `${left} new word${left === 1 ? '' : 's'} to go today` + (L ? `, starting at ${courseOf(L.n).station}.` : '.');
  const mile = (got.length ? got.length + (got.length === 1 ? ' milestone' : ' milestones') : 'No milestones yet') + (next ? ' · next: ' + next.t : '');
  return h('section', { class: 'home-hero', 'aria-label': 'Protoa' },
    h('div', { class: 'home-stage' }, milestoneOrbit(got, next), h('div', { class: 'orb-dock', 'aria-hidden': 'true' }), teacherSlot(56, 'neutral')),
    h('p', { class: 'home-miles' }, mile),
    h('p', { class: 'sr' }, got.length ? 'Milestones reached: ' + got.map(s => s.t).join(', ') + '.' : ''),
    h('div', { class: 'home-say' },
      h('div', { class: 'speaker', 'aria-hidden': 'true' }, h('span', { class: 'wave' }, h('i'), h('i'), h('i'), h('i'), h('i')), 'Protoa'),
      h('h1', { lang: 'de' }, greet + (name ? ', ' + name : '') + '.'),
      h('p', {}, GREET_EN[greet] + '. ' + say)));
}

/* ---------- the next station, drawn as a stretch of the line ---------- */
function chapterOf(n) { let c = CHAPTERS[0]; CHAPTERS.forEach(ch => { if (ch.from <= n) c = ch; }); return c; }
function lineStretch(n) {
  const done = new Set(S.progress.lessonsDone);
  const prev = n > 1 ? { name: courseOf(n - 1).station, state: done.has(n - 1) ? 'done' : 'open' } : { name: 'Laute', state: S.progress.sounds ? 'done' : 'open' };
  const stops = [prev, { name: courseOf(n).station, state: 'now' }];
  [n + 1, n + 2].forEach(k => { if (k <= COURSE.length) stops.push({ name: courseOf(k).station, state: 'later' }); });
  return h('ol', { class: 'stretch', 'aria-label': 'Your line: ' + stops.map(s => s.name + (s.state === 'now' ? ' (next)' : s.state === 'done' ? ' (done)' : '')).join(', ') },
    ...stops.map(s => h('li', { class: s.state, lang: 'de' }, h('i', { 'aria-hidden': 'true' }), h('span', {}, s.name))));
}
function stationCard(L, ls, curN, gated) {
  const card = h('section', { class: 'card stack linecard' + (gated ? '' : ' primary'), 'aria-label': 'Next station' });
  if (!L) { card.append(h('p', { class: 'muted' }, 'You have reached the end of the written line.'), h('button', { class: 'btn wide', onclick: () => go('learn') }, 'Open the map')); return card; }
  const c = courseOf(L.n), going = ls && ls.n === curN;
  card.append(
    h('div', { class: 'readout' }, h('span', { class: 'hi', lang: 'de' }, chapterOf(L.n).de), h('span', {}, 'Lesson ' + L.n)),
    lineStretch(L.n),
    h('div', {}, h('h2', { lang: 'de', class: 'station' }, c.station), h('div', { class: 'faint' }, L.title + ' · ' + L.words.length + ' words')),
    h('button', { class: 'btn wide sheen', onclick: () => openOnMap(L.n) }, going ? 'Continue the lesson' : 'Go to station'));
  return card;
}

/* ---------- Schnellcheck: one article, and Protoa's mood answers ----------
   A warm-up, not a review: nothing is written to the cards. A learned noun if there is one, else one from the current lesson.
   The word stays the same until answered or skipped, so re-renders do not reshuffle it. */
let QC = null;
const ART_HINT = [[/(ung|heit|keit|schaft|ion|tät|ik)$/, 'f', 'Nouns ending in -ung, -heit, -keit, -schaft, -ion, -tät and -ik are always die.'],
  [/(chen|lein)$/, 'n', 'Nouns ending in -chen or -lein are always das.'],
  [/e$/, 'f', 'Most nouns ending in -e are die.']];
function quickCheckPool() {
  const nouns = allLessons().flatMap(L => L.words.map(w => Object.assign({ lesson: L.n }, w))).filter(w => w.type === 'n' && /^(der|die|das) \S/.test(w.de));
  const learned = nouns.filter(w => isLearned(w.de)); if (learned.length) return learned;
  const cur = currentLessonN() || 1; return nouns.filter(w => w.lesson === cur);
}
function quickCheckPick(avoid) { const pool = quickCheckPool().filter(w => w.de !== avoid); if (!pool.length) return null; return { w: pool[Math.floor(Math.random() * pool.length)], answer: null }; }
function quickCheck() {
  if (!QC || !quickCheckPool().some(w => w.de === QC.w.de)) QC = quickCheckPick();
  if (!QC) return '';
  const [, art, noun] = QC.w.de.match(/^(der|die|das) (.+)$/), en = (QC.w.en || [])[0] || '';
  const card = h('section', { class: 'card stack quickcheck', 'aria-label': 'Quick check' });
  const draw = () => {
    card.innerHTML = '';
    const a = QC.answer, right = a === art, hint = (ART_HINT.find(([re, g]) => re.test(noun) && GENDER_ART[g] === art) || [])[2];
    card.append(
      h('div', { class: 'readout' }, h('span', { class: 'hi' }, 'Schnellcheck'), h('span', {}, 'which article?')),
      h('p', { class: 'qc-word', lang: 'de' }, h('span', { class: 'qc-slot ' + (a ? { der: 'g-m', die: 'g-f', das: 'g-n' }[a] : '') }, a || '___'), ' ' + noun),
      h('p', { class: 'faint' }, en),
      h('div', { class: 'qc-arts', role: 'group', 'aria-label': 'Choose the article' }, ...['der', 'die', 'das'].map(x => h('button', {
        class: 'choice ' + { der: 'g-m', die: 'g-f', das: 'g-n' }[x] + (a && x === art ? ' ok' : a && x === a ? ' bad' : ''), lang: 'de', 'aria-pressed': a === x ? 'true' : 'false', disabled: !!a,
        onclick: () => { QC.answer = x; uiSound(x === art ? 'ok' : 'bad', { kind: 'gender' }); draw(); card.querySelector('.qc-next')?.focus(); } }, x))),
      a ? h('div', { class: 'row qc-after' },
        h('p', { class: 'grow ' + (right ? 'qc-ok' : 'qc-near'), role: 'status', lang: 'de' }, (right ? 'Richtig! ' : 'Fast: ') + QC.w.de + '.', hint ? h('span', { lang: 'en' }, ' ' + hint) : ''),
        h('button', { class: 'btn ghost sm qc-next', onclick: () => { QC = quickCheckPick(QC.w.de) || QC; QC.answer = null; draw(); card.querySelector('.qc-arts button')?.focus(); } }, 'Another')) : '');
  };
  draw(); return card;
}

/* ---------- First run: Protoa introduces itself, then asks one thing at a time ----------
   Writes the same profile fields the old form did (name, city, field, interests, why); Settings → About me still edits them.
   The overlay holds a dock, so the companion flies in and grows to introduce itself, then shrinks while it asks. */
const FR_INTERESTS = [['Radfahren', 'cycling'], ['Kino', 'cinema'], ['Kochen', 'cooking'], ['Musik', 'music'], ['Fußball', 'football'], ['Reisen', 'travel'], ['Lesen', 'reading'], ['Spiele', 'games'], ['Fotografie', 'photography'], ['Sport', 'sport']];
const FR_WHY = [['Arbeit', 'work'], ['Studium', 'study'], ['Reisen', 'travel'], ['Familie', 'family'], ['Umzug', 'moving to a German-speaking country'], ['Einfach so', 'just because']];
function onboarding() {
  if (document.querySelector('.firstrun')) return;
  const p = S.profile, d = { name: p.name || '', city: p.city || '', field: p.field || '', interests: (p.interests || '').split(/\s*,\s*/).filter(Boolean), why: p.why || '' };
  const Q = [
    { k: 'name', de: 'Wie heißt du?', en: "What's your name?", ph: 'Alex', echo: () => 'Fangen wir an.' },
    { k: 'city', de: 'Wo wohnst du?', en: 'Where do you live?', ph: 'Orlando', echo: () => d.name ? `Hallo, ${d.name}!` : 'Hallo!' },
    { k: 'field', de: 'Was machst du?', en: 'What do you study or do?', ph: 'computer science', echo: () => d.city ? `${d.city}. Schön.` : 'Schön.' },
    { k: 'interests', de: 'Was machst du gern?', en: 'Pick three to five things you like, or add your own.', chips: FR_INTERESTS.slice(), multi: true, echo: () => 'Interessant.' },
    { k: 'why', de: 'Warum Deutsch?', en: "Why you're learning German.", chips: FR_WHY.slice(), echo: () => 'Super, danke.' },
  ];
  d.interests.forEach(x => { if (!Q[3].chips.some(c => c[1] === x)) Q[3].chips.push([x, '']); });   /* answers from an earlier visit stay pickable */
  if (d.why && !Q[4].chips.some(c => c[1] === d.why)) Q[4].chips.push([d.why, '']);
  const app = document.getElementById('app');
  const root = h('div', { class: 'firstrun', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'fr-title', tabindex: '-1' });
  const dock = h('div', { class: 'orb-dock', 'aria-hidden': 'true' }), body = h('div', { class: 'fr-body' });
  root.append(h('div', { class: 'fr-stage' }, dock), body);
  let step = 0;
  const finish = keep => {
    if (keep) Object.assign(p, { name: d.name.trim(), city: d.city.trim(), field: d.field.trim(), interests: d.interests.join(', '), why: d.why.trim() });
    save('profile'); S.settings.onboarded = true; save('settings');
    root.remove(); app.inert = false; render();
  };
  const cta = (label, onclick, cls = '') => h('button', { class: 'btn wide sheen ' + cls, onclick }, label);
  const draw = () => {
    root.dataset.step = step === 0 ? 'intro' : step > Q.length ? 'done' : 'ask';
    body.innerHTML = '';
    if (step === 0) {
      body.append(h('div', { class: 'fr-copy' },
        h('p', { class: 'readout' }, h('span', { class: 'hi' }, 'Protoa'), h('span', {}, 'five questions · two minutes')),
        h('h1', { id: 'fr-title', lang: 'de' }, 'Guten Tag.', h('br'), 'Ich bin ', h('b', {}, 'Protoa'), '.'),
        h('p', { class: 'muted' }, "Hello, I'm Protoa. I'll teach you German by talking with you, about your life rather than a textbook's.")),
        h('div', { class: 'fr-actions' }, cta(h('span', { lang: 'de' }, 'Hallo, Protoa'), () => { step = 1; draw(); }), h('button', { class: 'btn quiet wide', onclick: () => finish(false) }, 'Skip for now')));
      setTimeout(() => speak('Guten Tag. Ich bin Protoa.'), 350);
      root.focus(); return;   /* the dialog itself, so a screen reader starts at its title */
    }
    if (step > Q.length) {
      const about = [d.city, d.field, ...d.interests, d.why].map(s => s.trim()).filter(Boolean);
      body.append(h('div', { class: 'fr-copy' },
        h('p', { class: 'readout' }, h('span', { class: 'ok' }, 'Profil gespeichert'), h('span', {}, 'saved')),
        h('h1', { id: 'fr-title', lang: 'de' }, d.name.trim() ? `Freut mich, ${d.name.trim()}!` : 'Freut mich!'),
        h('p', { class: 'muted' }, about.length ? 'Nice to meet you. Our conversations will be about these:' : 'Nice to meet you. You can tell me about yourself later in Settings → About me.'),
        about.length ? h('ul', { class: 'fr-about' }, ...about.map(s => h('li', {}, s))) : ''),
        h('div', { class: 'fr-actions' }, cta(h('span', { lang: 'de' }, "Los geht's"), () => finish(true)), h('button', { class: 'btn quiet wide', onclick: () => { step = 1; draw(); } }, 'Change my answers')));
      Voice.nod(); body.querySelector('.btn').focus(); return;
    }
    const q = Q[step - 1], filled = () => q.multi ? d.interests.length > 0 : !!d[q.k].trim();
    const nextBtn = cta('', () => { step++; draw(); });
    const label = () => { nextBtn.textContent = filled() ? 'Weiter' : 'Skip this one'; };
    const head = h('div', { class: 'fr-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => { step--; draw(); }, html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>' }),
      h('div', { class: 'fr-progress', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(Q.length), 'aria-valuenow': String(step), 'aria-label': 'Question ' + step + ' of ' + Q.length },
        h('span', {}, String(step).padStart(2, '0') + ' / ' + String(Q.length).padStart(2, '0')), h('span', { class: 'dots' }, ...Q.map((_, i) => h('i', { class: i + 1 < step ? 'on' : i + 1 === step ? 'on cur' : '' })))),
      h('button', { class: 'btn quiet sm', onclick: () => finish(true) }, 'Skip'));
    const ask = h('div', { class: 'fr-copy' },
      h('p', { class: 'fr-echo', lang: 'de' }, h('span', { class: 'wave', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'), h('i')), q.echo()),
      h('div', { class: 'row fr-q' }, h('label', { id: 'fr-title', for: 'fr-in', lang: 'de', class: 'grow' }, q.de), playBtn(q.de, 'Hear the question')),
      h('p', { class: 'muted' }, q.en));
    if (!q.chips) {
      const inp = h('input', { type: 'text', id: 'fr-in', class: 'fr-input', autocomplete: q.k === 'name' ? 'given-name' : q.k === 'city' ? 'address-level2' : 'off', placeholder: q.ph, value: d[q.k] });
      inp.addEventListener('input', () => { d[q.k] = inp.value; label(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nextBtn.click(); } });
      ask.append(inp); setTimeout(() => inp.focus(), 60);
    } else {
      const pick = (en, on) => { if (q.multi) d.interests = on ? d.interests.filter(x => x !== en) : d.interests.concat(en); else d.why = on ? '' : en; };
      const isOn = en => q.multi ? d.interests.includes(en) : d.why === en;
      const chips = h('div', { class: 'fr-chips', role: 'group', 'aria-labelledby': 'fr-title' });
      const drawChips = () => { chips.innerHTML = ''; q.chips.forEach(([de, en]) => chips.append(h('button', { class: 'fr-chip', 'aria-pressed': isOn(en) ? 'true' : 'false', onclick: e => { pick(en, isOn(en)); drawChips(); label(); chips.querySelectorAll('button')[q.chips.findIndex(c => c[1] === en)]?.focus(); } }, h('span', { lang: en ? 'de' : null }, de), en ? h('small', {}, en) : ''))); };
      drawChips(); ask.append(chips);
      if (q.multi) {
        const own = h('input', { type: 'text', id: 'fr-own', class: 'fr-input sm', placeholder: 'Something else? Type it and press Enter', 'aria-label': 'Add your own interest' });
        own.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const v = own.value.trim(); if (v && !d.interests.includes(v)) { d.interests.push(v); q.chips.push([v, '']); drawChips(); label(); } own.value = ''; } });
        ask.append(own);
      }
      setTimeout(() => chips.querySelector('button')?.focus(), 60);
    }
    label();
    body.append(head, ask, h('div', { class: 'fr-actions' }, nextBtn));
  };
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && step > 0 && step <= Q.length) { step--; draw(); } });
  app.inert = true; document.body.append(root); draw();
  if (typeof Companion !== 'undefined' && TEACHER.isConnected) Companion.arrive();
}
