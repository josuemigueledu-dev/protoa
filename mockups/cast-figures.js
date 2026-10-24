/* Round 4 cast sheet: Herr Weber and the barista on an adult body (about 7.5 heads), drawn once, rendered three ways.
   Every colour on a person is a literal on purpose: people have no dark-mode values.
   A shape is {d, f}; limbs are built from joints so that every one follows anatomy (thigh, knee, calf, ankle). */
const INK = '#2a2230', SHADE = '#1b1630', AMBER = '#f6b66b';
const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const f1 = (n) => (+n).toFixed(1);

/* a tapered limb through joints pts with width ws[i] at each joint, round at both ends */
function limb(pts, ws) {
  const S = [];
  const seg = pts.length - 1;
  for (let i = 0; i < seg; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, seg)];
    for (let k = 0; k < 10; k++) {
      const t = k / 10, t2 = t * t, t3 = t2 * t;
      const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      S.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1]), ws[i] + (ws[i + 1] - ws[i]) * (t * t * (3 - 2 * t))]);
    }
  }
  S.push([pts[seg][0], pts[seg][1], ws[seg]]);
  const L = [], R = [];
  S.forEach((s, i) => {
    const a = S[Math.max(i - 1, 0)], b = S[Math.min(i + 1, S.length - 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    L.push([s[0] - dy * s[2] / 2, s[1] + dx * s[2] / 2]); R.push([s[0] + dy * s[2] / 2, s[1] - dx * s[2] / 2]);
  });
  const cap = (s, dir) => { // half circle at an end; dir 1 = past the last point, -1 = before the first
    const a = S[dir > 0 ? S.length - 2 : 1], ang = Math.atan2(s[1] - a[1], s[0] - a[0]), r = s[2] / 2, out = [];
    for (let k = 1; k < 6; k++) { const th = ang - Math.PI / 2 + Math.PI * k / 6; out.push([s[0] + Math.cos(th) * r, s[1] + Math.sin(th) * r]); }
    return out;
  };
  const end = cap(S[S.length - 1], 1).map(p => p), start = cap(S[0], -1).reverse().map(p => p);
  // the end cap runs from the left side round to the right side; the start cap does the reverse
  const poly = [...L, ...end.map(([x, y]) => [x, y]), ...R.reverse(), ...start];
  return { d: 'M' + poly.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z' };
}

/* ---------- the two people ---------- */
const PEOPLE = {
  weber: {
    name: 'Herr Weber', head: [121, 46], floor: 404, bust: '71 2 100 100', skin: '#dcab86', hair: '#7a7479', glasses: true,
    body(c) {
      const jacket = '#b98a3c', shirt = '#f1ebdd', trousers = '#3a3744', shoe = '#4a3a34', folder = '#b05a48', skin = c.skin;
      const o = [];
      o.push({ ...limb([[106, 206], [98, 298], [84, 384]], [30, 21, 13]), f: trousers });
      o.push({ ...limb([[136, 206], [138, 296], [136, 386]], [30, 21, 13]), f: trousers });
      o.push({ d: 'M90 198L154 198L150 234L94 234Z', f: trousers });
      o.push({ d: 'M68 391Q82 384 99 388L99 403Q80 407 62 403Q60 396 68 391Z', f: shoe });
      o.push({ d: 'M124 389Q140 384 152 392Q161 400 157 404L122 404Z', f: shoe });
      o.push({ ...limb([[121, 64], [120, 88]], [15, 20]), f: skin });
      o.push({ d: 'M84 96Q84 84 98 82L143 80Q158 82 160 94C162 130 150 150 148 176C148 192 154 202 154 216L90 218C90 204 96 192 96 176C96 150 82 128 84 96Z', f: jacket });
      o.push({ d: 'M109 82L121 122L133 81Z', f: shirt });
      o.push({ ...limb([[88, 100], [64, 152], [44, 178]], [25, 18, 13]), f: jacket });
      o.push({ ...limb([[44, 178], [34, 190], [29, 200]], [11, 10, 7]), f: skin });
      o.push({ d: 'M92 134L131 128L137 172L97 178Z', f: folder });
      o.push({ d: 'M101 142L124 139L127 152L104 155Z', f: shirt });
      o.push({ ...limb([[154, 100], [160, 154], [122, 152]], [25, 18, 13]), f: jacket });
      o.push({ ...limb([[122, 152], [112, 150], [106, 147]], [11, 10, 8]), f: skin });
      return o;
    },
    hairShapes: [{ d: 'M-21-3C-24-26-8-32 4-29C17-29 23-20 21-2C18-12 12-18 2-17C-9-16-16-11-21-3Z' }],
    ears: true
  },
  barista: {
    name: 'The barista', head: [120, 64], floor: 400, bust: '70 22 100 100', skin: '#8a5a3e', hair: '#2a2028', glasses: false,
    body(c) {
      const shirt = '#f1ece2', apron = '#566f5d', trousers = '#3a3a44', sole = '#e9e2d4', skin = c.skin, cup = '#f7f4ec';
      const o = [];
      o.push({ ...limb([[104, 208], [102, 296], [104, 384]], [29, 20, 12]), f: trousers });
      o.push({ ...limb([[134, 208], [142, 294], [152, 380]], [29, 20, 12]), f: trousers });
      o.push({ d: 'M92 200L148 200L146 232L94 232Z', f: trousers });
      o.push({ d: 'M88 386L112 384Q121 392 119 399L84 399Q82 392 88 386Z', f: sole });
      o.push({ d: 'M142 379Q156 377 165 387Q171 397 167 400L140 400Q138 390 142 379Z', f: sole });
      o.push({ ...limb([[120, 82], [120, 104]], [13, 17]), f: skin });
      o.push({ d: 'M90 116Q92 102 106 100L134 100Q148 102 150 116C152 140 142 156 142 178C142 190 148 200 148 214L92 214C92 200 98 190 98 178C98 156 88 140 90 116Z', f: shirt });
      o.push({ d: 'M105 128Q120 123 135 128L139 176L146 214L94 214L101 176Z', f: apron });
      o.push({ ...limb([[108, 104], [106, 128]], [3, 3]), f: apron });
      o.push({ ...limb([[132, 104], [134, 128]], [3, 3]), f: apron });
      o.push({ ...limb([[94, 114], [72, 160]], [22, 16]), f: shirt });
      o.push({ ...limb([[72, 160], [96, 198]], [14, 10]), f: skin });
      o.push({ c: [100, 202, 7.5], f: skin });
      o.push({ ...limb([[146, 114], [170, 156]], [22, 16]), f: shirt });
      o.push({ ...limb([[170, 156], [176, 122]], [14, 10]), f: skin });
      o.push({ d: 'M165 92L189 92L185 118L169 118Z', f: cup });
      o.push({ c: [176, 120, 7], f: skin });
      return o;
    },
    hairShapes: [{ d: 'M-21-2C-25-26-10-33 3-30C17-30 24-20 22-1C19-11 12-17 1-16C-9-15-16-9-21-2Z' }, { c: [14, -33, 9] }],
    ears: true
  }
};

/* ---------- face: head-local units, origin at the head centre ---------- */
function faceSvg(c, mood) {
  const sk = mix(c.skin, SHADE, .3), br = (d) => `<path d="${d}" fill="none" stroke="${c.hair}" stroke-width="2" stroke-linecap="round"/>`;
  const line = (d, w = 1.7) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const eye = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>`;
  let eyes, brows, mouth;
  if (mood === 'amused') { eyes = line('M-11 -2Q-7.5 -6 -4 -2') + line('M4 -2Q7.5 -6 11 -2'); brows = br('M-12-9Q-8-13-3-10') + br('M3-10Q8-13 12-9'); mouth = `<path d="M-7 12Q0 22 7 12Z" fill="${INK}"/><path d="M-5 13.4Q0 15 5 13.4" fill="none" stroke="#f7f4ec" stroke-width="1.8"/>`; }
  else if (mood === 'surprised') { eyes = eye(-7.5, -3, 3.1, 3.1) + eye(7.5, -3, 3.1, 3.1); brows = br('M-12-12Q-8-17-3-13') + br('M3-13Q8-17 12-12'); mouth = `<ellipse cx="0" cy="15" rx="2.8" ry="3.6" fill="${INK}"/>`; }
  else if (mood === 'thinking') { eyes = eye(-6, -4, 2.7, 1.8) + eye(9, -4, 2.7, 1.8); brows = br('M-12-8L-3-9.5') + br('M3-12Q8-15 12-12'); mouth = line('M-4 15Q1 13.5 6 14.5'); }
  else if (mood === 'pleased') { eyes = eye(-7.5, -3, 2.8, 1.9) + eye(7.5, -3, 2.8, 1.9); brows = br('M-12-8Q-8-11-3-9') + br('M3-9Q8-11 12-8'); mouth = line('M-6 13Q0 19 6 13'); }
  else { eyes = eye(-7.5, -3, 2.8, 1.8) + eye(7.5, -3, 2.8, 1.8); brows = br('M-12-8L-3-9') + br('M3-9L12-8'); mouth = line('M-4.5 14.5Q0 15.8 4.5 14.5'); }
  const nose = `<path d="M.8 0Q3 7 .5 8.4Q-.8 8.8-2 8" fill="none" stroke="${sk}" stroke-width="1.6" stroke-linecap="round"/>`;
  return brows + eyes + nose + mouth;
}

/* ---------- the three renderings ---------- */
let uid = 0;
function paint(style, s) {
  const attrs = s.c ? `cx="${s.c[0]}" cy="${s.c[1]}" r="${s.c[2]}"` : `d="${s.d}"`, tag = s.c ? 'circle' : 'path';
  const el = (fill, extra = '') => `<${tag} ${attrs} fill="${fill}" ${extra}/>`;
  let out = el(s.f);
  const sliver = (w, dx, dy, fill) => { // a strip of the shape's own edge, in another colour
    const id = 'm' + (++uid);
    return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="420">${el('#fff')}${el('#000', `transform="translate(${dx * w} ${dy * w})"`)}</mask>${el(fill, `mask="url(#${id})"`)}`;
  };
  if (style === 'E') out += sliver(6, -1, -.35, mix(s.f, SHADE, .26));
  if (style === 'F') out += sliver(6, -1, -.2, mix(s.f, SHADE, .3)) + sliver(3.4, 1, .1, mix(s.f, AMBER, .78));
  return out;
}

/* a whole person at one mood; opts.bust crops to head and shoulders */
function person(key, style, mood, opts = {}) {
  const c = { ...PEOPLE[key] }, [hx, hy] = c.head;
  const tilt = { thinking: -6, amused: 4, pleased: 2 }[mood] || 0;
  let g = `<ellipse cx="${key === 'weber' ? 112 : 124}" cy="${c.floor}" rx="46" ry="6" fill="${INK}" opacity="${style === 'D' ? .12 : .18}"/>`;
  g += c.body(c).map(s => paint(style, s)).join('');
  let head = '';
  if (c.ears) head += paint(style, { c: [-19.5, 1, 4.4], f: c.skin }) + paint(style, { c: [19.5, 1, 4.4], f: c.skin });
  head += paint(style, { d: 'M0-24C13-24 19-14 19-3C19 12 11 24 0 26C-11 24-19 12-19-3C-19-14-13-24 0-24Z', f: c.skin });
  head += faceSvg(c, mood);
  head += c.hairShapes.map(s => paint(style, { ...s, f: c.hair })).join('');
  if (c.glasses) head += `<g fill="none" stroke="${INK}" stroke-width="1.7"><rect x="-14" y="-9" width="13" height="10.5" rx="4"/><rect x="1" y="-9" width="13" height="10.5" rx="4"/><path d="M-1-5Q0-6 1-5"/></g>`;
  g += `<g transform="translate(${hx} ${hy}) rotate(${tilt} 0 30)">${head}</g>`;
  const vb = opts.bust ? c.bust : '0 0 240 420';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${c.name}, ${mood}">${g}</svg>`;
}
