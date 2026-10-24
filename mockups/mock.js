/* Mockup helpers: ?theme=light|dark sets data-theme on <html>; ?frame=N picks one of several frames on a page. */
const Q = new URLSearchParams(location.search);
const THEME = Q.get('theme') === 'dark' ? 'dark' : 'light';
const FRAME = Q.get('frame') || '1';
document.documentElement.setAttribute('data-theme', THEME);
const MARK = '<svg viewBox="0 0 120 120"><circle class="mk-shell" cx="60" cy="60" r="46"/><circle class="mk-mid" cx="60" cy="60" r="18"/><circle class="mk-nuc" cx="60" cy="60" r="9"/><g transform="rotate(-18 60 60)"><path class="mk-gap" d="M26 60 A34 10 0 0 0 94 60"/><path class="mk-ring" d="M26 60 A34 10 0 0 0 94 60"/></g></svg>';
const AURORA = '<i></i><i></i><i></i>';
const ICON = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>',
  slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h3l3-6 4 12 3-6h3"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>',
  talk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'
};
function tabsHTML(on) {
  return [['today', 'Today'], ['learn', 'Lessons'], ['practice', 'Practice'], ['talk', 'Sprechen'], ['profile', 'Profile']]
    .map(([id, l]) => `<button class="tab"${id === on ? ' aria-current="page"' : ''}>${ICON[id]}<span${id === 'talk' ? ' lang="de"' : ''}>${l}</span></button>`).join('');
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.themename').forEach(t => t.textContent = THEME);
  document.querySelectorAll('[data-frame]').forEach(el => { el.hidden = el.dataset.frame !== FRAME; });
  document.querySelectorAll('.aurora').forEach(a => a.innerHTML = AURORA);
  document.querySelectorAll('[data-mark]').forEach(m => m.innerHTML = MARK);
  document.querySelectorAll('[data-icon]').forEach(m => m.innerHTML = ICON[m.dataset.icon]);
  document.querySelectorAll('[data-tabs]').forEach(t => t.innerHTML = tabsHTML(t.dataset.tabs));
  document.querySelectorAll('[data-orb]').forEach(o => o.innerHTML = protoaOrb({ mood: o.dataset.orb || 'neutral', theme: THEME, label: 'Protoa' }));
  document.querySelectorAll('[data-art]').forEach(o => o.append(illusEl(o.dataset.art, +o.dataset.size || 120)));
  document.querySelectorAll('[data-bust]').forEach(o => { const [id, mood] = o.dataset.bust.split('#'); o.replaceWith(bustEl(id, mood, +o.dataset.size || 40)); });
  document.querySelectorAll('[data-scene]').forEach(o => o.insertAdjacentHTML('afterbegin', sceneArt(JSON.parse(o.dataset.scene))));
  document.querySelectorAll('[data-word]').forEach(o => o.replaceWith(wordArt(JSON.parse(o.dataset.word), +o.dataset.size || 44)));
  document.querySelectorAll('[data-stamp]').forEach(o => { const [st, ic] = o.dataset.stamp.split('|'); o.innerHTML = stampSvg(st, ic); });
});
