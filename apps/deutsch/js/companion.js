/* ============================================================
   Companion: the teacher floats above the page (screen space) and places itself by what you are doing.
   Priority of what it attends to:
     1. the sentence being read aloud            (speak(..., {el}))
     2. the field you are typing in
     3. an open sheet (station preview, exam rules)
     4. the feedback that just appeared          (right / not quite)
     5. in a lesson, review, drill or exam: the task card; in Sprechen: the newest message
     6. on the map: the current station, on the side away from its label
     7. otherwise the block you are reading: the one under a reading line at 36 % of the viewport,
        so it travels down the page with you as you scroll
   It sits in the gutter beside that block (right, else left); where there is no gutter (phones) it perches
   on the block's top-right corner so it does not cover text. Never follows the cursor.
   Motion of its own: an underdamped spring (soft overshoot on arrival), a stretch along its travel,
   its core lagging behind inside the glass, and a small hover drift when settled.
   ============================================================ */
const Companion = (() => {
  const P = { x: -1, y: -1, vx: 0, vy: 0, raf: 0, last: 0, attend: null, sq: 0, ang: 0, seed: Math.random() * 50, a: null, aAt: 0, lookAt: null };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = () => document.body.classList.contains('lay-mobile');   /* inside a sheet on a phone the field has no free margin: perch on the sheet's corner instead, clear of its text */
  const size = () => document.body.classList.contains('lay-mobile') ? 58 : 72;
  const vis = el => { if (!el || !el.isConnected) return null; const b = el.getBoundingClientRect(); return b.width && b.height && b.bottom > 48 && b.top < innerHeight - 48 ? b : null; };
  function anchor() {
    const view = document.getElementById('view'); let b, el;
    if (P.attend && (b = vis(P.attend))) return { b, kind: 'speak', el: P.attend };
    el = document.activeElement; if (el && el.matches && el.matches('input[type=text],textarea') && !(phone() && el.closest('.sheet .in')) && (b = vis(el))) return { b, kind: 'input', el };
    el = document.querySelector('.sheet:not(.closing) .in'); if (el && (b = vis(el))) return { b, kind: 'sheet', el };
    el = document.querySelector('.actionbar.ok .msg,.actionbar.bad .msg'); if (el && (b = vis(el))) return { b, kind: 'feedback', el };
    if (document.body.classList.contains('in-lesson')) {
      const chat = view.querySelectorAll('.chatlog .bub:not([hidden])'); if (chat.length && (b = vis(chat[chat.length - 1]))) return { b, kind: 'task', el: chat[chat.length - 1] };
      el = view.querySelector('.lesson-top ~ .card,.lesson-top ~ .conv,.lesson-top ~ .scene'); if (el && (b = vis(el))) return { b, kind: 'task', el };
    }
    el = view.querySelector('.st.now .mk'); if (el && (b = vis(el))) return { b, kind: 'station', el, left: el.closest('.st').classList.contains('lab-r') };
    const line = innerHeight * .36; let best = null, bd = 1e9, bel = null;
    const host = view.querySelector(':scope > .view') || view;
    for (const c of host.children) { if (c.matches('.lesson-top,.map,.tslot')) continue; const r = c.getBoundingClientRect(); if (!r.height || r.bottom < 60 || r.top > innerHeight - 60) continue; const dd = r.top <= line && r.bottom >= line ? 0 : Math.min(Math.abs(r.top - line), Math.abs(r.bottom - line)); if (dd < bd) { bd = dd; best = r; bel = c; } }
    return best ? { b: best, kind: 'read', el: bel } : null;
  }
  function limits() {
    const W = innerWidth; let L = 8, R = W - 8;
    const sb = document.querySelector('#sidebar'); if (sb && getComputedStyle(sb).display !== 'none') L = sb.getBoundingClientRect().right + 8;
    const rl = document.querySelector('#rail'); if (rl && getComputedStyle(rl).display !== 'none') R = rl.getBoundingClientRect().left - 4;
    return [L, R];
  }
  function rest() {
    const s = size(), b = document.body.classList, bottom = b.contains('in-lesson') ? 156 : b.contains('lay-mobile') ? 118 : 48;
    return [innerWidth - s / 2 - 20, innerHeight - bottom - s / 2];
  }
  function place(a) {
    const s = size(), gap = 22, b = a.b, [L, R] = limits(); let x, y;
    if (a.kind === 'feedback') return [Math.min(innerWidth - s * .7, b.right - s * .2), b.top - s * .8];
    if (a.kind === 'station') return [a.left ? b.left - gap - s / 2 : b.right + gap + s / 2, b.top + b.height / 2];
    if (a.kind === 'sheet') { if (b.right + gap + s <= innerWidth - 8) return [b.right + gap + s / 2, b.top + s * .8]; return [b.right - s * .55, b.top - s * .5]; }
    const rg = R - b.right, lg = b.left - L;
    if (rg >= s + gap * 2) x = b.right + gap + s / 2;                 /* a roomy gutter: sit a little off the block */
    else if (rg >= s * .95) x = b.right + rg / 2;                     /* a tight gutter: centre in it */
    else if (lg >= s * .95) x = b.left - Math.min(lg / 2, gap + s / 2);
    else return a.kind === 'read' ? [b.right - s * .3, Math.min(b.bottom - s * .1, innerHeight - s)] : [b.right - s * .3, b.top - s * .38];   /* no gutter (phones): perch on a corner, mostly outside the block; while reading, its lower corner, which is usually empty */
    y = a.kind === 'input' ? b.top + b.height / 2 : Math.min(Math.max(b.top + Math.min(b.height / 2, s * .85), 96), b.bottom - s * .5);
    return [x, y];
  }
  function target(now, t) {
    const s = size(); let a = null;
    if (now - P.aAt > 90) {   /* re-evaluate about 11 times a second */
      P.aAt = now; const n = anchor();
      const same = (x, y) => x && y && x.kind === y.kind && Math.abs(x.b.top - y.b.top) < 40 && Math.abs(x.b.left - y.b.left) < 40;
      if (!P.a || !n || n.kind !== 'read' || P.a.kind !== 'read' || same(n, P.a)) { P.a = n; P.cand = null; }
      else if (P.cand && same(n, P.cand.a) && now - P.cand.t > 280) { P.a = n; P.cand = null; }
      else if (!P.cand || !same(n, P.cand.a)) P.cand = { a: n, t: now };
      else P.cand.a = n;
    }
    a = P.a; let x, y;
    if (a && a.el && a.el.isConnected) a.b = a.el.getBoundingClientRect();
    if (a) { [x, y] = place(a); P.lookAt = a.kind === 'read' || a.kind === 'station' ? null : [a.b.left + Math.min(a.b.width, 320) / 2, a.b.top + Math.min(a.b.height, 120) / 2]; }
    else { [x, y] = rest(); P.lookAt = null; }
    if (!still()) { x += Math.sin(t * .53 + P.seed) * 6 + Math.sin(t * 1.31 + P.seed * 2) * 2; y += Math.sin(t * 1.06 + P.seed * .7) * 4; }
    const m = s * .62; return [Math.min(innerWidth - m, Math.max(m, x)), Math.min(innerHeight - m, Math.max(m + 4, y))];
  }
  /* SmoothDamp (critically damped): eases in and out, never overshoots or bounces */
  function damp(cur, tgt, vel, T, maxV, dt) {
    const om = 2 / T, x = om * dt, ex = 1 / (1 + x + .48 * x * x + .235 * x * x * x);
    let ch = cur - tgt; const mc = maxV * T; ch = Math.max(-mc, Math.min(mc, ch));
    const t2 = cur - ch, tmp = (vel + om * ch) * dt; let nv = (vel - om * tmp) * ex, out = t2 + (ch + tmp) * ex;
    if ((tgt - cur > 0) === (out > tgt)) { out = tgt; nv = 0; }
    return [out, nv];
  }
  /* what is under the shadow decides how it falls */
  const SH = { h: 1, o: .24, dark: 0, kind: '', at: 0 };
  function surface(x, y) {
    const el = document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, x)), Math.max(0, Math.min(innerHeight - 1, y)));
    if (!el) return 'ground';
    if (el.closest('.today-hero,.talkhero,.chapter,.toast,.ticket .top,.st.done .mk,.badge') || (el.closest('.btn') && !el.closest('.btn.ghost,.btn.quiet'))) return 'dark';
    if (el.closest('.card,.widget,.kpi,.lv,.mode,.scen,.btile,.goalmini,#sidebar,.tabs,.sheet .in,.actionbar,.lesson-top,.choice,.tile,input,textarea,.st .mk,.ticket')) return 'panel';
    return 'ground';
  }
  function frame(now) {
    P.raf = 0; if (!TEACHER.isConnected) return;
    const dt = Math.min(.05, (now - (P.last || now)) / 1000) || .016; P.last = now;
    const [rx, ry] = target(now, now / 1000), s = size(), calm = still();
    if (P.x < 0) { P.x = P.tx = rx; P.y = P.ty = ry; }
    /* ease the target itself, so switching what it attends to never jerks */
    const ke = 1 - Math.exp(-dt / (calm ? .05 : .16)); P.tx += (rx - P.tx) * ke; P.ty += (ry - P.ty) * ke;
    /* a new trip starts when the destination moves far: remember it for the arc */
    if (!P.trip || Math.hypot(P.tx - P.trip.ex, P.ty - P.trip.ey) > 70) P.trip = { sx: P.x, sy: P.y, ex: P.tx, ey: P.ty, len: Math.max(1, Math.hypot(P.tx - P.x, P.ty - P.y)) };
    else { P.trip.ex = P.tx; P.trip.ey = P.ty; }
    [P.x, P.vx] = damp(P.x, P.tx, P.vx, calm ? .12 : .62, 1500, dt);
    [P.y, P.vy] = damp(P.y, P.ty, P.vy, calm ? .12 : .62, 1500, dt);
    /* graceful flight: a gentle upward arc on longer trips, and a little lift while travelling */
    const tr = P.trip, rem = Math.hypot(tr.ex - P.x, tr.ey - P.y), prog = Math.max(0, Math.min(1, 1 - rem / tr.len));
    let ax = 0, ay = 0;
    if (!calm && tr.len > 90) { const dx = (tr.ex - tr.sx) / tr.len, dy = (tr.ey - tr.sy) / tr.len; let nx = -dy, ny = dx; if (ny > 0) { nx = -nx; ny = -ny; } const amp = Math.min(46, tr.len * .14) * Math.sin(Math.PI * prog); ax = nx * amp; ay = ny * amp; }
    const sp = Math.hypot(P.vx, P.vy), lift = calm ? 0 : Math.min(1, sp / 900);
    P.lift = (P.lift || 0) + (lift - (P.lift || 0)) * Math.min(1, dt * 5);
    const X = P.x + ax, Y = P.y + ay;
    TEACHER.style.transform = `translate3d(${(X - s / 2).toFixed(2)}px,${(Y - s / 2).toFixed(2)}px,0)`;
    const st = calm ? 0 : Math.min(.035, sp / 7000);
    P.sq += (st - P.sq) * Math.min(1, dt * 7); if (sp > 30) P.ang = Math.atan2(P.vy + ay * 0, P.vx);
    const fl = TEACHER.querySelector('.float');
    if (fl) fl.style.transform = `${P.sq > .002 ? `rotate(${P.ang.toFixed(3)}rad) scale(${(1 + P.sq).toFixed(4)},${(1 - P.sq * .7).toFixed(4)}) rotate(${(-P.ang).toFixed(3)}rad) ` : ''}scale(${(1 + .045 * P.lift).toFixed(4)})`;
    /* adaptive shadow: sample the surface under where the shadow lands, then ease toward its look */
    if (now - SH.at > 110) { SH.at = now; SH.kind = surface(X + s * .12, Y + s * .7); }
    const darkTheme = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const baseH = SH.kind === 'ground' ? 1 : .5, h = baseH + P.lift * .6;
    const op = (SH.kind === 'dark' ? .6 : SH.kind === 'panel' ? .44 : .36) * (1.2 - .38 * h) * (darkTheme ? 1.35 : 1);
    const kk = 1 - Math.exp(-dt / .22); SH.h += (h - SH.h) * kk; SH.o += (op - SH.o) * kk; SH.dark += (((SH.kind === 'dark' || darkTheme) ? 1 : 0) - SH.dark) * kk;
    const T = TEACHER.style;
    T.setProperty('--sh-x', (s * .10 * SH.h).toFixed(2) + 'px');
    T.setProperty('--sh-y', (s * (.10 + .20 * SH.h)).toFixed(2) + 'px');
    T.setProperty('--sh-b', (s * (.02 + .085 * SH.h)).toFixed(2) + 'px');
    T.setProperty('--sh-w', (.58 + .26 * SH.h).toFixed(3));
    T.setProperty('--sh-o', Math.max(0, SH.o).toFixed(3));
    T.setProperty('--sh-pool', ((SH.kind === 'dark' ? .9 : .55) * (1.15 - .3 * SH.h)).toFixed(3));
    const c0 = [8, 28, 72], c1 = [0, 0, 0]; T.setProperty('--sh-c', c0.map((v, i) => Math.round(v + (c1[i] - v) * SH.dark)).join(','));
    P.raf = requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { if (TEACHER.isConnected) TEACHER.style.setProperty('--s', size() + 'px'); });
  return {
    arrive() { TEACHER.style.setProperty('--s', size() + 'px'); P.aAt = 0; if (!P.raf) { P.last = 0; P.raf = requestAnimationFrame(frame); } },
    attend(el) { if (el) { P.attend = el; P.aAt = 0; } },
    release(el) { if (!el || P.attend === el) { P.attend = null; P.aAt = 0; } },
    look() { return P.lookAt; },
    get vel() { return [P.vx, P.vy]; },
    get anchorKind() { return P.a ? P.a.kind : 'rest'; },
    targetNow() { P.aAt = 0; return target(performance.now(), 0); },
  };
})();
