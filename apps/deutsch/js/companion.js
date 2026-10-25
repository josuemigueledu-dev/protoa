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
  const gutterless = () => { const top = document.querySelector('#view .lesson-top'); if (!top) return false; const b = top.getBoundingClientRect(), [L, R] = limits(); return Math.max(R - b.right, b.left - L) < 72 * .95; };
  const dockable = () => document.body.classList.contains('in-lesson') && !!document.querySelector('#view .lesson-top .tslot') && (phone() || gutterless());   /* a lesson with no free margin (phones, narrow tablets): the orb lives in the header slot and never covers a task */
  const docked = () => !!P.dock;   /* measured with each re-evaluation in target(), not every frame */
  const size = () => docked() ? 44 : document.body.classList.contains('lay-mobile') ? 58 : 72;
  const vis = el => { if (!el || !el.isConnected) return null; const b = el.getBoundingClientRect(); return b.width && b.height && b.bottom > 48 && b.top < innerHeight - 48 ? b : null; };
  function anchor() {
    const view = document.getElementById('view'); let b, el;
    if (docked() && (el = view.querySelector('.lesson-top .tslot')) && (b = el.getBoundingClientRect()).width) return { b, kind: 'dock', el };
    if (P.attend && (b = vis(P.attend))) return { b, kind: 'speak', el: P.attend };
    el = document.activeElement; if (el && el.matches && el.matches('input[type=text],textarea') && !(phone() && el.closest('.sheet .in')) && (b = vis(el))) return { b, kind: 'input', el, box: el.closest('.sheet .in') };
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
  /* Where it may sit, in order of preference: the gutter beside the block (right, else left), then a corner of the block
     (phones have no gutter). It takes the first spot with no text, picture or control under it, else the least covered,
     so it never sits on a number, a label or a button. Checked with each re-evaluation, not every frame. */
  const INK = 'svg,img,canvas,input,textarea,select,button,[role=img],.illus', CARD = '.card,.mode,.scen';
  function inked(roots, boxes) {
    const hit = r => boxes.map(o => Math.max(0, Math.min(o[2], r.right) - Math.max(o[0], r.left)) * Math.max(0, Math.min(o[3], r.bottom) - Math.max(o[1], r.top)));
    const area = boxes.map(() => 0), near = r => hit(r).some(v => v > 0), range = document.createRange();
    const add = r => hit(r).forEach((v, i) => area[i] += v);
    for (const root of roots) {
      if (!root || !near(root.getBoundingClientRect())) continue;
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => {
        if (n.nodeType === 3) return n.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        if (n === TEACHER || n.matches('.orrery,.sheet')) return NodeFilter.FILTER_REJECT;
        const r = n.getBoundingClientRect(); if (!near(r)) return NodeFilter.FILTER_REJECT;
        if (n.matches(INK) && !n.matches(CARD)) { add(r); return NodeFilter.FILTER_REJECT; }   /* a control or picture counts whole; a card that is a button, only what is on it */
        return NodeFilter.FILTER_SKIP; } });
      for (let n = tw.nextNode(); n; n = tw.nextNode()) { range.selectNodeContents(n); for (const r of range.getClientRects()) add(r); }
    }
    return area;
  }
  function place(a) {
    const s = size(), gap = 22, b = a.b, [L, R] = limits();
    if (a.kind === 'dock') return [b.left + b.width / 2, b.top + b.height / 2];
    if (a.kind === 'feedback') return [Math.min(innerWidth - s * .7, b.right - s * .2), b.top - s * .8];
    if (a.kind === 'station') return [a.left ? b.left - gap - s / 2 : b.right + gap + s / 2, b.top + b.height / 2];
    if (a.kind === 'sheet') { if (b.right + gap + s <= innerWidth - 8) return [b.right + gap + s / 2, b.top + s * .8]; return [b.right - s * .55, b.top - s * .5]; }
    const g = a.box ? a.box.getBoundingClientRect() : b, gl = a.box ? 8 : L, gr = a.box ? innerWidth - 8 : R;   /* a field in a sheet: the gutter is beside the sheet, not inside it */
    const rg = gr - g.right, lg = g.left - gl, spots = [];
    const y = a.kind === 'input' ? b.top + b.height / 2 : Math.min(Math.max(b.top + Math.min(b.height / 2, s * .85), 96), b.bottom - s * .5);
    if (rg >= s + gap * 2) spots.push([g.right + gap + s / 2, y]);      /* a roomy gutter: sit a little off the block */
    else if (rg >= s * .95) spots.push([g.right + rg / 2, y]);         /* a tight gutter: centre in it */
    if (lg >= s * .95) spots.push([g.left - Math.min(lg / 2, gap + s / 2), y]);
    const tabs = phone() && document.getElementById('tabs'), floor = tabs && tabs.offsetHeight ? Math.min(innerHeight, tabs.getBoundingClientRect().top) : innerHeight;   /* phones: the tab bar is at the bottom */
    const rx = b.right - s * .3, lx = b.left + s * .3, top = b.top - s * .38, under = Math.min(b.bottom + s * .38, floor - s * .62), low = Math.min(b.bottom - s * .1, floor - s * .62);   /* top and under: mostly outside the block, in the gap; low: its lower corner, which is usually empty */
    if (a.kind === 'read') spots.push([rx, low], [rx, top], [rx, under], [lx, low], [lx, top], [lx, under]);
    else spots.push([rx, top], [rx, low], [rx, under], [lx, top], [lx, low], [lx, under]);
    const key = [b.left, b.top, b.width, b.height, innerWidth, innerHeight, s].map(Math.round).join();
    if (a.pk === undefined && P.pk && P.pk.el === a.el && P.pk.key === key) a.pk = P.pk.i;   /* nothing moved: keep the spot without measuring again */
    if (a.pk === undefined) {
      const m = s * .62, r = s * .4;   /* test the square inside the round glass, where target() will clamp it */
      const boxes = spots.map(([px, py]) => { px = Math.min(innerWidth - m, Math.max(m, px)); py = Math.min(innerHeight - m, Math.max(m + 4, py)); return [px - r, py - r, px + r, py + r]; });
      const area = inked(a.box ? [a.box] : [document.getElementById('app')], boxes);
      const prev = P.pk && P.pk.el === a.el ? P.pk.i : -1;   /* stay put while the spot it has is still clear */
      let best = prev >= 0 && prev < area.length && area[prev] === 0 ? prev : area.indexOf(0);
      if (best < 0) best = area.indexOf(Math.min(...area));
      a.pk = best; P.pk = { el: a.el, i: best, key };
    }
    return spots[a.pk];
  }
  function target(now, t) {
    const s = size(); let a = null;
    if (now - P.aAt > 90) {   /* re-evaluate about 11 times a second */
      P.aAt = now; P.dock = dockable(); document.body.classList.toggle('orb-dock', P.dock && !phone()); const n = anchor();
      const same = (x, y) => x && y && x.kind === y.kind && Math.abs(x.b.top - y.b.top) < 40 && Math.abs(x.b.left - y.b.left) < 40;
      if (!P.a || !n || n.kind !== 'read' || P.a.kind !== 'read' || same(n, P.a)) { P.a = n; P.cand = null; }
      else if (P.cand && same(n, P.cand.a) && now - P.cand.t > 280) { P.a = n; P.cand = null; }
      else if (!P.cand || !same(n, P.cand.a)) P.cand = { a: n, t: now };
      else P.cand.a = n;
    }
    a = P.a; let x, y;
    if (a && a.el && a.el.isConnected) a.b = a.el.getBoundingClientRect();
    if (a) { [x, y] = place(a); P.lookAt = a.kind === 'dock' ? null : a.kind === 'read' || a.kind === 'station' ? null : [a.b.left + Math.min(a.b.width, 320) / 2, a.b.top + Math.min(a.b.height, 120) / 2]; }
    else { [x, y] = rest(); P.lookAt = null; }
    if (!still() && !(a && a.kind === 'dock')) { x += Math.sin(t * .53 + P.seed) * 6 + Math.sin(t * 1.31 + P.seed * 2) * 2; y += Math.sin(t * 1.06 + P.seed * .7) * 4; }
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
  function frame(now) {
    P.raf = 0; if (!TEACHER.isConnected) return;
    const dt = Math.min(.05, (now - (P.last || now)) / 1000) || .016; P.last = now;
    const [rx, ry] = target(now, now / 1000), s = size(), calm = still();
    if (P.s !== s) { P.s = s; TEACHER.style.setProperty('--s', s + 'px'); }
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
