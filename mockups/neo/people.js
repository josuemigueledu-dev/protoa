/* Round 7 rendering "G": volumetric figures. Loaded after ../cast-figures.js, it replaces paint() so that person() draws
   every shape with a key-light gradient and a coloured rim on the shadow side. Colours on a person never change with the theme. */
let gid = 0;
paint = function (style, s) {
  const id = 'g' + (++gid), tag = s.c ? 'circle' : 'path';
  const attrs = s.c ? `cx="${s.c[0]}" cy="${s.c[1]}" r="${s.c[2]}"` : `d="${s.d}"`;
  const lit = mix(s.f, '#fff1d6', .22), mid = s.f, low = mix(s.f, '#14183a', .42), rim = mix(s.f, '#7cc4ff', .78);
  const def = `<linearGradient id="${id}" x1="0" y1=".05" x2="1" y2=".7"><stop offset="0" stop-color="${lit}"/><stop offset=".42" stop-color="${mid}"/><stop offset=".86" stop-color="${low}"/><stop offset=".94" stop-color="${mix(low, rim, .5)}"/><stop offset="1" stop-color="${rim}"/></linearGradient>`;
  return `<defs>${def}</defs><${tag} ${attrs} fill="url(#${id})"/>`;
};
