/* ---------- 3D tilt: the glass pane under the pointer turns toward it and catches the light ---------- */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const SEL = '.card.primary,.examcard,.today-hero,.talkhero,.ticket,.view > .lesson-top ~ .card';
  let cur = null, raf = 0, last = null;
  const clear = el => { el.classList.remove('tilting'); ['--rx', '--ry', '--mx', '--my'].forEach(k => el.style.removeProperty(k)); };
  const apply = () => { raf = 0; if (!last) return; const e = last; if (reduced()) return;
    const el = e.target.closest && e.target.closest(SEL);
    if (el !== cur) { if (cur) clear(cur); cur = el; }
    if (!el || el.closest('.sheet') || document.body.classList.contains('in-lesson')) { if (el) clear(el); return; }
    const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const k = Math.max(3, Math.min(10, 2600 / Math.max(r.width, r.height)));  // big panes tilt less
    el.style.setProperty('--ry', ((x - .5) * k).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((.5 - y) * k).toFixed(2) + 'deg');
    el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    el.classList.add('tilting'); };
  document.addEventListener('pointermove', e => { last = e; if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
  document.addEventListener('pointerleave', () => { if (cur) clear(cur); cur = null; });
  document.addEventListener('scroll', () => { if (cur) { clear(cur); cur = null; } }, { passive: true, capture: true });   // capture: #app's scroll does not bubble
})();
