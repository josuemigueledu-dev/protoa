/* ============================================================
   Protoa's tab (owner, Oct 25 2026: "I want Protoa to always be stationary ... kept somewhere visible but out of
   the way. Have it look like a tab where Protoa lives."). One small glass tab fixed to the right edge of the
   screen, at the height of the top bar (phones, tablets, desktop alike, lessons included). The orb lives in it
   and never leaves: no roaming, no docking into headers, no script per frame and no scroll listener. Inside the
   tab it spins as the logo does (the glass counterclockwise, the orbiter clockwise; night-glass.css) and its core
   shows the mood and pulses while German plays (Voice and VoiceLight in core.js set the classes and --lvl).
   The page makes room for it: the top bar, the lesson header's close button and the desktop rail keep clear.
   A tap is a greeting for now (a nod); what Protoa offers from here comes later.
   ============================================================ */
const Companion = (() => {
  const TAB = h('div', { class: 'ptab', 'aria-hidden': 'true', title: 'Protoa' });
  TAB.addEventListener('click', () => Voice.nod());
  function arrive() {
    if (!TAB.isConnected) document.body.append(TAB);
    if (TEACHER.parentNode !== TAB) TAB.append(TEACHER);
    if (!TEACHER.style.getPropertyValue('--s')) TEACHER.style.setProperty('--s', '40px');
  }
  /* the same surface the roaming companion had, so speak() and the WebGL orb keep working */
  return {
    arrive,
    attend() { },
    release() { },
    look() { return null; },
    get vel() { return [0, 0]; },
    get anchorKind() { return 'tab'; },
  };
})();
