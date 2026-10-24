/* Round 2 cast sheet: Herr Weber and the barista, each in three style directions (A, B, C).
   Everything on a person is a literal colour on purpose: character art has no dark-mode values.
   Shapes are listed as [d, fill]; each style renders the same list differently, and each style has its own geometry. */
const C = {
  ink: '#0b1220', navy: '#132a57', blue: '#1a48a6', azure: '#3a86f0', ice: '#7cc6ff', mist: '#dbeaff', paper: '#f7f9fc',
  skin2: '#dcab86', skin2d: '#c48f6a', skin4: '#86563c', skin4d: '#6e4630', grey: '#c9cfda', greyd: '#9aa3b4', coal: '#2b2230',
  brick: '#c47868', butter: '#f1e4b8', leaf: '#8fae93', leafd: '#6f9275', wood: '#8a6248', cup: '#f7f9fc'
};

/* ---------- faces: drawn in head-local units u = r/44, at the head centre ---------- */
function face(style, mood, hx, hy, u, look) {
  const k = (n) => (n * u).toFixed(1), P = (x, y) => `${(hx + x * u).toFixed(1)} ${(hy + y * u).toFixed(1)}`;
  const sw = style === 'A' ? 3.2 : style === 'B' ? 2.4 : 4.4;
  const lx = look || 0, ex = 15, ey = 4;
  let eyes = '', brows = '', mouth = '';
  const dot = (x, y, r) => `<circle cx="${(hx + x * u).toFixed(1)}" cy="${(hy + y * u).toFixed(1)}" r="${k(r)}" fill="${C.ink}"/>` +
    (style === 'A' ? `<circle cx="${(hx + (x + 1.3) * u).toFixed(1)}" cy="${(hy + (y - 1.5) * u).toFixed(1)}" r="${k(1.3)}" fill="#fff"/>` : '');
  const pill = (x, y, w, h) => `<rect x="${(hx + (x - w / 2) * u).toFixed(1)}" y="${(hy + (y - h / 2) * u).toFixed(1)}" width="${k(w)}" height="${k(h)}" rx="${k(w / 2)}" fill="${C.ink}"/>`;
  const arc = (x, y) => `<path d="M${P(x - 6, y + 2)} q${k(6)} ${k(-9)} ${k(12)} 0" fill="none" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const eye = (x, y, r, ph) => style === 'C' ? pill(x, y, 7, ph || 12) : dot(x, y, r);
  const L = [-ex, ey], R = [ex, ey];
  if (mood === 'amused') eyes = arc(L[0], L[1]) + arc(R[0], R[1]);
  else if (mood === 'surprised') eyes = eye(L[0], L[1], 5, 16) + eye(R[0], R[1], 5, 16);
  else if (mood === 'thinking') eyes = eye(L[0] + 2 + lx, L[1] - 3, 3.6, 11) + eye(R[0] + 2 + lx, R[1] - 3, 3.6, 11);
  else eyes = eye(L[0] + lx, L[1], mood === 'pleased' ? 3.4 : 3.8) + eye(R[0] + lx, R[1], mood === 'pleased' ? 3.4 : 3.8);
  const br = (x1, y1, x2, y2) => `<path d="M${P(x1, y1)} L${P(x2, y2)}" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>`;
  const bq = (x1, y1, cx, cy, x2, y2) => `<path d="M${P(x1, y1)} Q${P(cx, cy)} ${P(x2, y2)}" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>`;
  if (mood === 'neutral') brows = br(-21, -9, -9, -10) + br(9, -10, 21, -9);
  if (mood === 'pleased') brows = bq(-21, -9, -15, -16, -8, -11) + bq(8, -11, 15, -16, 21, -9);
  if (mood === 'thinking') brows = br(-21, -17, -9, -20) + br(9, -9, 21, -12);
  if (mood === 'amused') brows = bq(-21, -11, -15, -18, -8, -13) + bq(8, -13, 15, -18, 21, -11);
  if (mood === 'surprised') brows = bq(-21, -17, -15, -24, -8, -18) + bq(8, -18, 15, -24, 21, -17);
  const m = { neutral: `M${P(-7, 19)} q${k(7)} ${k(3)} ${k(14)} 0`, pleased: `M${P(-11, 17)} q${k(11)} ${k(12)} ${k(22)} 0`, thinking: `M${P(-3, 20)} q${k(5)} ${k(-2)} ${k(11)} ${k(-3)}` }[mood];
  if (m) mouth = `<path d="${m}" fill="none" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
  if (mood === 'amused') mouth = `<path d="M${P(-12, 15)} q${k(12)} ${k(20)} ${k(24)} 0z" fill="${C.ink}" stroke="${C.ink}" stroke-width="${sw / 2}" stroke-linejoin="round"/><path d="M${P(-6, 23)} q${k(6)} ${k(-5)} ${k(12)} 0q${k(-6)} ${k(4)} ${k(-12)} 0z" fill="${C.brick}"/>`;
  if (mood === 'surprised') mouth = `<ellipse cx="${(hx).toFixed(1)}" cy="${(hy + 22 * u).toFixed(1)}" rx="${k(5)}" ry="${k(7)}" fill="${C.ink}"/>`;
  const cheeks = mood === 'pleased' || mood === 'amused' ? `<circle cx="${(hx - 27 * u).toFixed(1)}" cy="${(hy + 14 * u).toFixed(1)}" r="${k(5)}" fill="${C.brick}" opacity=".28"/><circle cx="${(hx + 27 * u).toFixed(1)}" cy="${(hy + 14 * u).toFixed(1)}" r="${k(5)}" fill="${C.brick}" opacity=".28"/>` : '';
  return cheeks + eyes + brows + mouth;
}

/* ---------- renderers: the same shape list, three finishes ---------- */
// shape = {d, f} path; {c:[cx,cy,r], f} circle; {e:[cx,cy,rx,ry], f} ellipse; {line:d} extra detail strokes (style B/ink only)
function shapeEl(s, attrs) {
  if (s.c) return `<circle cx="${s.c[0]}" cy="${s.c[1]}" r="${s.c[2]}" ${attrs}/>`;
  if (s.e) return `<ellipse cx="${s.e[0]}" cy="${s.e[1]}" rx="${s.e[2]}" ry="${s.e[3]}" ${attrs}/>`;
  return `<path d="${s.d}" ${attrs}/>`;
}
function render(style, g) {
  const shapes = g.shapes.filter(s => !s.line), lines = g.shapes.filter(s => s.line);
  let out = `<ellipse cx="120" cy="${g.floor}" rx="${g.shadow}" ry="7" fill="${C.ink}" opacity=".13"/>`;
  const head = g.head;
  const body = shapes.map(s => {
    if (s.f === 'none') return shapeEl(s, `fill="none" stroke="${C.ink}" stroke-width="${style === 'C' ? 4.5 : 3}"`);
    if (style === 'A') return shapeEl(s, `fill="${s.f}"`);
    if (style === 'B') return shapeEl(s, `fill="${s.f}" transform="translate(5 4)"`) + shapeEl(s, `fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"`);
    return shapeEl(s, `fill="${C.ink}" opacity=".16" transform="translate(7 8)"`) + shapeEl(s, `fill="${s.f}"`);
  });
  // head is shape index g.hi; face goes right after it, before hair/glasses listed later
  const faceAt = shapes.findIndex(s => s.c && s.c[0] === head.cx && s.c[1] === head.cy && s.c[2] === head.r);
  const faceSvg = face(style, g.mood, head.cx, head.cy, head.r / 44, g.look);
  const accent = style === 'B' ? lines.map(l => `<path d="${l.line}" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('') : '';
  const detail = style === 'A' || style === 'C' ? lines.map(l => `<path d="${l.line}" fill="none" stroke="${l.col || C.ink}" stroke-width="${style === 'C' ? 4.5 : 3.4}" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>`).join('') : '';
  body.splice(faceAt + 1, 0, `<g data-face>${faceSvg}</g>`);
  return `<g transform="${g.tf || ''}">${out}${body.join('')}${detail}${accent}</g>`;
}

/* ---------- Herr Weber: tall, grey swept-back hair, thin glasses, cardigan, folder under one arm, other hand up mid-sentence ---------- */
const WEBER = {
  A: (mood) => ({ // blocks: big rounded masses, no outlines
    floor: 348, shadow: 68, mood, look: 1, head: { cx: 122, cy: 86, r: 44 }, faceAfter: 11,
    shapes: [
      { d: 'M92 250h26v84a13 13 0 0 1-13 13h0a13 13 0 0 1-13-13z', f: C.navy },
      { d: 'M126 250h28v80l8 8a11 11 0 0 1-8 18h-18a11 11 0 0 1-10-11z', f: C.navy },
      { e: [103, 345, 22, 8], f: C.ink }, { e: [146, 345, 24, 8], f: C.ink },
      { d: 'M68 275V190q0-44 44-44h32q44 0 44 44v85z', f: C.blue },
      { d: 'M108 146h28l-12 44z', f: C.paper },
      { d: 'M104 142h36v14q-18 12-36 0z', f: C.brick },
      { d: 'M70 200q-24 8-34 40l22 10q6-20 20-24z', f: C.blue }, { c: [44, 240, 13], f: C.skin2 },
      { d: 'M188 188l30-34q8-8 16 0t-2 16l-20 28z', f: C.blue }, { c: [226, 150, 13], f: C.skin2 },
      { d: 'M158 190h30v62h-30z', f: C.butter },
      { e: [80, 94, 7, 10], f: C.skin2d }, { e: [164, 94, 7, 10], f: C.skin2d },
      { c: [122, 86, 44], f: C.skin2 }, // head = index 11 -> face after it
      { d: 'M76 82q-6-48 46-48q52 0 44 52q-6-22-18-28q-22 10-52 0q-14 8-20 24z', f: C.grey },
      { d: 'M116 100q6 8 12 0z', f: C.skin2d },
      { c: [106, 88, 12.5], f: 'none' }, { c: [138, 88, 12.5], f: 'none' }
    ]
  }),
  B: (mood) => ({ // line: tall and long-limbed, small head, hair as one stroke-built shape, misregistered colour
    floor: 350, shadow: 56, mood, look: 0, head: { cx: 118, cy: 64, r: 30 }, faceAfter: 7,
    shapes: [
      { d: 'M92 232l-6 112h20l8-96l8 96h20l-4-112z', f: C.navy },
      { e: [94, 346, 18, 6], f: C.ink }, { e: [136, 346, 18, 6], f: C.ink },
      { d: 'M84 228l-8-126q2-22 26-24h32q24 2 26 24l-6 126z', f: C.blue },
      { d: 'M108 96l10 36l10-36z', f: C.paper },
      { d: 'M70 110l-14 70l16 6l16-62z', f: C.blue }, { d: 'M154 106l32 38l-6 14l-40-34z', f: C.blue },
      { e: [186, 134, 10, 8], f: C.skin2 },
      { c: [118, 64, 30], f: C.skin2 },
      { d: 'M88 60q0-34 32-34q32 0 30 34q-6-18-18-22q-10 8-26 4q-14 2-18 18z', f: C.grey },
      { d: 'M144 168h36v54h-36z', f: C.butter },
      { c: [104, 66, 8.5], f: 'none' }, { c: [132, 66, 8.5], f: 'none' }
    ]
  }),
  C: (mood) => ({ // cut-paper: huge head, stout body, hard shadows, no outline
    floor: 350, shadow: 74, mood, look: 0, head: { cx: 120, cy: 112, r: 62 }, faceAfter: 6,
    shapes: [
      { d: 'M78 260h30v78q0 12-12 12H84q-12 0-12-12z', f: C.navy }, { d: 'M132 260h30v78q0 12-12 12h-12q-12 0-12-12z', f: C.navy },
      { e: [92, 348, 26, 9], f: C.ink }, { e: [150, 348, 26, 9], f: C.ink },
      { d: 'M62 280q-6-70 40-82h36q46 12 40 82z', f: C.blue },
      { d: 'M206 205l24-46q6-10 16-4t-2 16l-22 46z', f: C.blue },
      { c: [120, 112, 62], f: C.skin2 },
      { d: 'M56 100q-6-66 64-66q70 0 64 66q-10-32-30-38q-34 14-68 0q-22 8-30 38z', f: C.grey },
      { d: 'M60 230q-26 6-34 36l22 10q6-18 18-22z', f: C.blue },
      { c: [38, 270, 16], f: C.skin2 }, { c: [244, 158, 15], f: C.skin2 },
      { d: 'M150 220h36v58h-36z', f: C.butter },
      { c: [98, 118, 17], f: 'none' }, { c: [142, 118, 17], f: 'none' }
    ]
  })
};

/* ---------- Barista: short, round bun, apron, hip out, cup in the raised hand ---------- */
const BARISTA = {
  A: (mood) => ({
    floor: 348, shadow: 62, mood, look: -1, head: { cx: 118, cy: 108, r: 42 }, faceAfter: 8, tf: 'translate(0 8)',
    shapes: [
      { d: 'M96 262h24v76a12 12 0 0 1-12 12h0a12 12 0 0 1-12-12z', f: C.coal }, { d: 'M126 262h24v76a12 12 0 0 1-12 12h0a12 12 0 0 1-12-12z', f: C.coal },
      { e: [108, 346, 20, 7], f: C.ink }, { e: [138, 346, 20, 7], f: C.ink },
      { d: 'M70 292q-8-92 14-116q10-10 34-10t34 10q22 24 14 116z', f: C.azure },
      { d: 'M92 184h52l10 106H82z', f: C.butter },
      { d: 'M84 192q-26 18-34 56l18 6q8-26 26-38z', f: C.azure }, { c: [58, 252, 12.5], f: C.skin4 },
      { d: 'M158 196q26 14 32-12l4-34l-18-2l-6 28z', f: C.azure }, { c: [186, 140, 12], f: C.skin4 },
      { d: 'M174 108h26v28q0 8-8 8h-10q-8 0-8-8z', f: C.cup },
      { c: [118, 108, 42], f: C.skin4 },
      { c: [118, 54, 20], f: C.coal }, { d: 'M76 100q-2-46 42-46q44 0 42 46q-8-22-22-26q-22 12-42 0q-14 6-20 26z', f: C.coal },
      { d: 'M112 122q6 8 12 0z', f: C.skin4d }
    ]
  }),
  B: (mood) => ({
    floor: 350, shadow: 54, mood, look: 0, head: { cx: 120, cy: 78, r: 32 }, faceAfter: 8, tf: 'translate(0 14) scale(1 .97)',
    shapes: [
      { d: 'M98 232l-4 106h18l6-76l6 76h18l-4-106z', f: C.coal },
      { e: [102, 340, 17, 6], f: C.ink }, { e: [136, 340, 17, 6], f: C.ink },
      { d: 'M82 238l8-92q2-18 28-18h8q26 0 28 18l8 92z', f: C.azure },
      { d: 'M100 144h38l8 94H92z', f: C.butter },
      { d: 'M82 154l-18 52l14 6l24-44z', f: C.azure }, { d: 'M150 150l24-20l8 12l-22 30z', f: C.azure },
      { c: [176, 124, 9], f: C.skin4 },
      { d: 'M104 112h28v18l-14 8l-14-8z', f: C.skin4 },
      { c: [120, 78, 32], f: C.skin4 },
      { d: 'M88 74q-4-36 32-36q36 0 32 36q-8-20-22-22q-18 10-40 0q-6 6-2 22z', f: C.coal },
      { c: [120, 36, 12], f: C.coal }
    ]
  }),
  C: (mood) => ({
    floor: 350, shadow: 70, mood, look: 0, head: { cx: 120, cy: 120, r: 58 }, faceAfter: 6, tf: 'translate(0 6)',
    shapes: [
      { d: 'M84 274h28v64q0 12-12 12H96q-12 0-12-12z', f: C.coal }, { d: 'M130 274h28v64q0 12-12 12h-4q-12 0-12-12z', f: C.coal },
      { e: [98, 348, 24, 9], f: C.ink }, { e: [146, 348, 24, 9], f: C.ink },
      { d: 'M64 292q-6-72 34-92h44q40 20 34 92z', f: C.azure },
      { d: 'M92 214h56l10 82H82z', f: C.butter },
      { c: [120, 120, 58], f: C.skin4 },
      { c: [120, 46, 26], f: C.coal }, { d: 'M62 112q-6-62 58-62q64 0 58 62q-8-30-28-34q-30 12-60 0q-20 6-28 34z', f: C.coal },
      { d: 'M72 234q-30-4-40 22l18 12q10-12 22-10z', f: C.azure }, { c: [34, 262, 14], f: C.skin4 },
      { d: 'M198 232q32-12 34-46l-18-4q0 20-24 30z', f: C.azure }, { c: [224, 176, 14], f: C.skin4 },
      { d: 'M212 126h30l-2 36q0 8-8 8h-10q-8 0-8-8z', f: C.cup }
    ]
  })
};

function figure(who, style, mood, viewBox) {
  const g = (who === 'weber' ? WEBER : BARISTA)[style](mood);
  const vb = viewBox || '0 0 260 370';
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${who === 'weber' ? 'Herr Weber' : 'The barista'}, ${mood}, style ${style}">${render(style, g)}</svg>`;
}
function bust(who, style, mood) {
  const g = (who === 'weber' ? WEBER : BARISTA)[style](mood), h = g.head;
  const tfY = /translate\(0 (\d+)\)/.exec(g.tf || '');
  const cy = h.cy + (tfY ? +tfY[1] : 0), r = h.r, s = r * 3;
  return `<svg viewBox="${(h.cx - s / 2).toFixed(0)} ${(cy - r * 1.25).toFixed(0)} ${s.toFixed(0)} ${s.toFixed(0)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${who} ${mood}, style ${style}">${render(style, g)}</svg>`;
}

const MOODS = ['neutral', 'pleased', 'thinking', 'amused', 'surprised'];
const STYLE_INFO = {
  A: ['Blocks', 'Chunky rounded masses, no outlines, dot eyes with a catchlight. Warm and toy-like, closest to Duolingo’s shape language.'],
  B: ['Inked', 'Tall and long-limbed, a navy line with the colour printed slightly off-register. Calm and editorial; closest to the plates.'],
  C: ['Paper-cut', 'Huge heads on stout bodies, flat shapes with a hard shadow, pill eyes and thick brows. Bold, readable at 40 px, most playful.']
};
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-style]').forEach(sec => {
    const s = sec.dataset.style;
    const pane = (theme) => `<div class="pane ${theme}"><div class="full"><div>${figure('weber', s, 'neutral')}</div><div>${figure('barista', s, 'pleased')}</div></div>` +
      `<div class="row40">${['weber', 'barista'].map(w => `<span class="b40">${bust(w, s, 'neutral')}</span>`).join('')}<small>40 px</small></div>` +
      ['weber', 'barista'].map(w => `<div class="moods">${MOODS.map(m => `<figure>${bust(w, s, m)}<figcaption>${m}</figcaption></figure>`).join('')}</div>`).join('') + `</div>`;
    sec.querySelector('.panes').innerHTML = pane('light') + pane('dark');
  });
});
