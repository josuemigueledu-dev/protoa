/* Prototype of the spec's js/art.js: composes art from the bundle (art-bundle.js) inline, so var(--il-...) follows the theme. */
const inner = svg => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const keepMood = (svg, mood) => svg.replace(/<g data-mood="(\w+)">(.*?)<\/g>/g, (m, k) => k === mood ? m : '');

function illusEl(id, size) {
  const s = document.createElement('span'); s.className = 'il'; s.style.width = s.style.height = size + 'px';
  s.innerHTML = ART[id] || ''; return s;
}
function castSvg(id, mood) { return keepMood(ART[id] || '', mood || 'neutral'); }
/* Night Glass: the cast are painted portraits (art/night/ava-*.jpg); the SVG cast stays as the fallback for ids without one */
const NIGHT_CAST = { 'cast.weber': 'weber', 'cast.ana': 'ana', 'cast.lena': 'lena', 'cast.barista': 'murat', 'cast.murat': 'murat' };
const NIGHT_SCENE = { 'plate.classroom': 'classroom', 'plate.cafe': 'cafe', 'plate.ubahn': 'ubahn', 'plate.street': 'neukoelln', 'plate.flat': 'flat', 'plate.market': 'market', 'plate.park': 'feld', 'plate.bar': 'bar', 'plate.hermannplatz': 'hermannplatz' };
const nightCastName = id => ({ 'cast.weber': 'Herr Weber', 'cast.ana': 'Ana', 'cast.lena': 'Lena', 'cast.barista': 'the barista', 'cast.murat': 'Murat' })[id] || '';
function bustEl(id, mood, size) {
  const s = document.createElement('span'); s.className = 'bust'; s.style.width = s.style.height = size + 'px';
  if (NIGHT_CAST[id]) { s.classList.add('photo'); s.style.backgroundImage = `url(art/night/ava-${NIGHT_CAST[id]}.jpg)`; s.setAttribute('aria-label', nightCastName(id)); s.setAttribute('role', 'img'); return s; }
  s.innerHTML = castSvg(id, mood).replace(/viewBox="[^"]+"/, 'viewBox="54 24 132 132"'); return s;
}
/* Night Glass: a lesson scene is a painted picture of the place, with the people in it as portraits along the bottom.
   Plates without a painting yet keep the SVG plate, its characters and the event sticker. */
function sceneArt({ plate, cast = [], event, band }) {
  const pic = NIGHT_SCENE[plate];
  if (pic) {
    const faces = cast.filter(c => NIGHT_CAST[c.id]).map(c => `<span class="sface" role="img" aria-label="${nightCastName(c.id)}" style="background-image:url(art/night/ava-${NIGHT_CAST[c.id]}.jpg)"></span>`).join('');
    return `<img class="spic${band ? ' band' : ''}" src="art/night/scenes/${pic}.jpg" alt="" decoding="async">` + (faces && !band ? `<span class="sfaces">${faces}</span>` : '');
  }
  const H = 540, W = 360, foot = 344 / 360 * H; // the main character stands at 60% of the plate height
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${band ? '528 40 1072 550' : '0 0 1600 900'}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` + inner(ART[plate] || ART['plate.classroom']);
  cast.forEach(c => { out += `<svg x="${c.x - W / 2}" y="${700 - foot}" width="${W}" height="${H}" viewBox="0 0 240 360">${inner(castSvg(c.id, c.mood))}</svg>`; });
  if (event) out += `<g class="ev-pop"><svg x="1320" y="60" width="240" height="240" viewBox="0 0 160 160">${inner(ART[event])}</svg></g>`;
  return out + '</svg>';
}
function stampSvg(station, icon) {
  return ART['stamp.template'].replace(/\{station\}/g, station.toUpperCase()).replace('{icon}', inner(ART[icon] || ''));
}
/* the word picture on its article plate, or the word tile when there is no picture: never initials */
const GLYPH = { phrase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>', verb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' };
/* Night Glass word pictures (art/night/words/), matched by the noun itself so a lesson needs no pic id */
const NIGHT_WORD = { kaffee: 'kaffee', tee: 'tee', kuchen: 'kuchen', gitarre: 'gitarre', 'fußball': 'fussball', 'café': 'cafe', handy: 'handy', lehrer: 'lehrer', student: 'student', stadt: 'stadt', frau: 'frau', mann: 'mann', freund: 'freund', freundin: 'freundin', brot: 'brot', apfel: 'apfel', wasser: 'wasser', buch: 'buch', stuhl: 'stuhl', tisch: 'tisch', fahrkarte: 'fahrkarte', 'schlüssel': 'schluessel', tasse: 'tasse' };
const nightWord = w => { const k = String(w.de || '').replace(/^(der|die|das) /i, '').trim().toLowerCase(); const p = String(w.pic || '').replace(/^word\./, ''); return NIGHT_WORD[k] || (Object.values(NIGHT_WORD).includes(p) ? p : ''); };
const nightImg = w => `<img src="art/night/words/${nightWord(w)}.jpg" alt="" decoding="async">`;
const wordPic = w => nightWord(w) ? nightImg(w) : w.pic && (ART['word.' + w.pic] || ART[w.pic]) || '';
function wordArt(w, size) {
  const pic = wordPic(w);
  if (pic) {
    const d = document.createElement('div'); d.className = 'illus ' + (w.g || '') + (nightWord(w) ? ' photo' : ''); d.style.width = d.style.height = size + 'px';
    d.innerHTML = pic; return d;
  }
  const t = document.createElement('div'); t.className = 'wtile'; t.style.width = t.style.height = size + 'px'; t.lang = 'de';
  t.innerHTML = `<b>${w.de}</b>` + (w.type ? `<span>${w.type}</span>` : ''); return t;
}
/* a learned word as a chip: a 28 px picture when it has one, else the word with a small type glyph; with tap, a button */
function wordChip(w, tap) {
  const c = document.createElement(tap ? 'button' : 'span'); c.className = 'wchip'; c.lang = 'de';
  if (tap) { c.type = 'button'; c.onclick = tap; }
  const pic = wordPic(w);
  if (pic) { const i = illusEl('', 28); i.innerHTML = pic; c.append(i); }
  else if (GLYPH[w.type]) c.insertAdjacentHTML('beforeend', `<i class="gl-t" aria-hidden="true">${GLYPH[w.type]}</i>`);
  c.append(w.de); return c;
}
