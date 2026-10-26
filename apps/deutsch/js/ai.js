/* ---------- AI: Protoa's server runs the Claude calls; the page only names a task ----------
   AI.connect() asks the server whether AI is configured (false when the page is opened as a
   file or the server has no API key; the app then works without the AI features).
   AI.run(task, vars) resolves to the task's result or throws an Error with .code:
   'unavailable' | 'rate_limited' | 'timeout' | 'refused' | 'bad_output' | 'bad_request' | 'upstream' | 'network'
   (and 'unsupported' from the practice AI for a task it can't fake). */
const AI = (() => {
  const APP = 'deutsch';
  const base = () => (window.PROTOA_API || '') + '/api';
  // a host page may answer the tasks itself (window.PROTOA_AI_BRIDGE(task, vars) -> result), e.g. a copy of the
  // app running inside claude.ai that asks Claude directly instead of through the Protoa server
  const bridge = () => typeof window.PROTOA_AI_BRIDGE === 'function' ? window.PROTOA_AI_BRIDGE : null;
  async function connect() {
    if (bridge()) return api;
    if (location.protocol === 'file:' && !window.PROTOA_API) return null;
    if (navigator.onLine === false) return null; // offline (the installed app): AI stays off without a failed request
    try { const r = await fetch(base() + '/health'); const j = await r.json(); return j.ai ? api : null; } catch (e) { return null; }
  }
  async function run(task, vars) {
    if (bridge()) return bridge()(task, vars);
    let r;
    try { r = await fetch(`${base()}/${APP}/ai/${task}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(vars) }); }
    catch (e) { throw Object.assign(new Error('Could not reach the server.'), { code: 'network' }); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const code = j.error?.code || 'upstream';
      // the server has no key or its key was rejected: trying again can't help, so the AI features close as when AI is off
      if (code === 'unavailable' && typeof S === 'object' && S) S.ai = null;
      throw Object.assign(new Error(j.error?.message || 'Request failed.'), { code });
    }
    return j.result;
  }
  // the text to show for a failed call: the specific reason when the learner can act on it
  function message(e, fallback) {
    if (e && e.code === 'rate_limited') return 'Too many requests. Try again in a moment.';
    if (e && e.code === 'network') return 'Could not reach the Protoa server.';
    if (e && e.code === 'timeout') return 'Protoa took too long to answer. Try again.';
    if (e && e.code === 'unavailable') return 'Protoa’s AI is not reachable right now. Lessons and Practice work as usual.';
    return fallback;
  }
  const api = { run };
  return { connect, run, message };
})();
// the profile fields the prompts use, trimmed to the server's limits
function aiProfile() {
  const p = S.profile || {}, cut = (v, n) => String(v || '').slice(0, n);
  return { name: cut(p.name, 100), city: cut(p.city, 100), field: cut(p.field, 100), interests: cut(p.interests, 300), why: cut(p.why, 500) };
}
