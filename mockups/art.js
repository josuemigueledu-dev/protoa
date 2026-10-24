/* Prototype of the spec's js/art.js: composes art from the bundle (art-bundle.js) inline, so var(--il-...) follows the theme. */
const inner = svg => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const keepMood = (svg, mood) => svg.replace(/<g data-mood="(\w+)">(.*?)<\/g>/g, (m, k) => k === mood ? m : '');

function illusEl(id, size) {
  const s = document.createElement('span'); s.className = 'il'; s.style.width = s.style.height = size + 'px';
  s.innerHTML = ART[id] || ''; return s;
}
function castSvg(id, mood) { return keepMood(ART[id] || '', mood || 'neutral'); }
function bustEl(id, mood, size) {
  const s = document.createElement('span'); s.className = 'bust'; s.style.width = s.style.height = size + 'px';
  s.innerHTML = castSvg(id, mood).replace(/viewBox="[^"]+"/, 'viewBox="54 24 132 132"'); return s;
}
/* plate first, then each character standing on the floor line (y 700) in the cast zone, then the event sticker */
function sceneArt({ plate, cast = [], event }) {
  const H = 468, W = 312, foot = 344 / 360 * H;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` + inner(ART[plate] || ART['plate.classroom']);
  cast.forEach(c => { out += `<svg x="${c.x - W / 2}" y="${700 - foot}" width="${W}" height="${H}" viewBox="0 0 240 360">${inner(castSvg(c.id, c.mood))}</svg>`; });
  if (event) out += `<g class="ev-pop"><svg x="1320" y="60" width="240" height="240" viewBox="0 0 160 160">${inner(ART[event])}</svg></g>`;
  return out + '</svg>';
}
function stampSvg(station, icon) {
  return ART['stamp.template'].replace(/\{station\}/g, station.toUpperCase()).replace('{icon}', inner(ART[icon] || ''));
}
/* the word picture on its article plate, or the word tile when there is no picture */
function wordArt(w, size) {
  if (w.pic && ART[w.pic]) {
    const d = document.createElement('div'); d.className = 'illus ' + (w.g || ''); d.style.width = d.style.height = size + 'px';
    d.innerHTML = ART[w.pic]; return d;
  }
  const t = document.createElement('div'); t.className = 'wtile' + (size < 80 ? ' xs' : ''); t.style.width = t.style.height = size + 'px'; t.lang = 'de';
  const label = size < 80 ? w.de.split(/\s+/).slice(0, 2).map(x => x[0]).join('') : w.de; // at small sizes the tile shows initials; the caption names the word
  t.innerHTML = `<b>${label}</b>` + (size >= 80 && w.type ? `<span>${w.type}</span>` : ''); if (size < 80) t.setAttribute('aria-label', w.de); return t;
}
