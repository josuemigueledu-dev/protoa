/* ---------- boot ---------- */
document.addEventListener('keydown', e => { if (e.target.matches('textarea')) return; if (e.target.matches('input') && e.key !== 'Enter') return; if (KEYS) KEYS(e); });
(async function boot() {
  loadLocal(); applyTheme();
  const hash = (location.hash || '').replace('#', ''); if (NAV_ITEMS.some(t => t[0] === hash)) route = hash; lastLayout = applyLayout();
  LESSONS.forEach(L => { const bad = checkGlosses(L); if (bad.length) console.warn('Gloss coverage, lesson ' + L.n, bad); });
  V1_WORDS.forEach(w => { const a = deTokens(w.ex.replace(/[\[\]]/g, '')).map(fold).join(' '), b = parseGloss(w.exG).flatMap(([d]) => deTokens(d)).map(fold).join(' '); if (a !== b) console.warn('Gloss coverage, v1 word ' + w.de, a, '|', b); });
  render();
  if (!S.settings.onboarded) onboarding();
  await loadRemote(); S.ready = true; flushPendingSaves(); applyTheme();
  if (!S.settings.onboarded && !document.querySelector('.sheet')) onboarding(); else if (S.settings.onboarded) { document.querySelector('.sheet:not(.word)')?.remove(); render(); }
})();
