/* Static SVG stand-in for the WebGL orb (shared/orb/glorb.js), so mockups can show it in its slot. Mood colours follow shared/brand/README.md. */
/* Protoa, the character: a clear glass shell, a density of light at its centre whose hue is the mood,
   and a small orbiter with a moon on Earth–Moon proportions (13.37 laps per lap). Returns an SVG string. */
(function () {
  const MOODS = {
    dark: {
      neutral: { m: '#63B8FF', deep: '#2559C4', hot: '#E2F1FF' },
      correct: { m: '#36E399', deep: '#0F8A5A', hot: '#DDFBEF' },
      almost: { m: '#FFCF3D', deep: '#B07A00', hot: '#FFF4D6' },
      wrong: { m: '#FF5973', deep: '#A8203A', hot: '#FFE0E6' }
    },
    light: {
      neutral: { m: '#1F80E8', deep: '#1A48A6', hot: '#BFE0FF' },
      correct: { m: '#12A06B', deep: '#07624A', hot: '#C8F2DF' },
      almost: { m: '#D19900', deep: '#8A6200', hot: '#FFE9A8' },
      wrong: { m: '#D9334F', deep: '#82142B', hot: '#FFD0D8' }
    }
  };
  const SHELL = {
    dark: {
      glassIn: '#9CC2FF', midA: 0.04, edge: '#BFD6FF', edgeA: 0.12, rimA: 0.3,
      rim: 'rgba(214,230,255,.62)', innerRim: 'rgba(255,255,255,.08)',
      ringBack: 'rgba(214,230,255,.22)', ringFront: 'rgba(214,230,255,.55)',
      shadow: 'rgba(0,0,0,0)', haloA: 0.3, causticA: 0.3, streakA: 0.24, streak2A: 0.14,
      grain: '#E2F1FF', grainA: 0.55, orbSpec: 0.9,
      o1: '#FFFFFF', o2: '#D5E3F5', o3: '#7D93B5', o4: '#26344F'
    },
    light: {
      glassIn: '#FFFFFF', midA: 0.12, edge: '#AFC2DD', edgeA: 0.32, rimA: 0.6,
      rim: 'rgba(80,100,135,.5)', innerRim: 'rgba(255,255,255,.9)',
      ringBack: 'rgba(30,50,90,.18)', ringFront: 'rgba(30,50,90,.45)',
      shadow: 'rgba(16,36,72,.22)', haloA: 0.16, causticA: 0.22, streakA: 0.9, streak2A: 0.6,
      grain: '#1F80E8', grainA: 0.45, orbSpec: 0.55,
      o1: '#9DB6E0', o2: '#2A4373', o3: '#0B1220', o4: '#05080F'
    }
  };
  const SPEED = { neutral: 1, correct: 1.7, almost: 1, wrong: 0.45 };

  function grains(n, r0, r1, seed) {
    let s = seed, d = '';
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = r0 + (r1 - r0) * Math.sqrt(rnd()), z = 0.45 + rnd() * 0.75;
      const x = Math.cos(a) * r - z, y = Math.sin(a) * r;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}a${z.toFixed(2)} ${z.toFixed(2)} 0 1 0 ${(2 * z).toFixed(2)} 0a${z.toFixed(2)} ${z.toFixed(2)} 0 1 0 ${(-2 * z).toFixed(2)} 0`;
    }
    return d;
  }
  const G_IN = grains(46, 5, 24, 11), G_OUT = grains(80, 22, 52, 29);
  let uid = 0;

  function orbiter(id, T, Tm, c, front) {
    const moon = (show) => `<g transform="rotate(-12.9)"><circle r="2.25" fill="url(#${id}-moon)" opacity="${show ? 1 : 0}">
        <animateMotion dur="${Tm}s" repeatCount="indefinite" path="M 21 0 A 21 6.3 0 0 1 -21 0 A 21 6.3 0 0 1 21 0"/>
        <animate attributeName="opacity" values="${show ? '1;0' : '0;1'}" keyTimes="0;0.5" calcMode="discrete" dur="${Tm}s" repeatCount="indefinite"/></circle></g>`;
    return `<g transform="rotate(-18)"><g>
      <animateMotion dur="${T}s" repeatCount="indefinite" path="M 65.6 0 A 65.6 19.7 0 0 1 -65.6 0 A 65.6 19.7 0 0 1 65.6 0"/>
      ${front ? `<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" dur="${T}s" repeatCount="indefinite"/>` : ''}
      <g transform="rotate(18)"><g>
        <animateTransform attributeName="transform" type="scale" values="1;1.16;1;0.84;1" keyTimes="0;0.25;0.5;0.75;1" dur="${T}s" repeatCount="indefinite"/>
        ${moon(false)}
        <circle r="8.1" fill="url(#${id}-orbiter)"/>
        ${front ? `<circle cx="-2.6" cy="-3" r="1.6" fill="#FFFFFF" opacity="${c.orbSpec}"/>` : ''}
        ${moon(true)}
      </g></g></g></g>`;
  }

  window.protoaOrb = function ({ mood = 'neutral', theme = 'dark', speaking = false, label } = {}) {
    const id = 'orb' + (++uid);
    const m = MOODS[theme][mood], c = SHELL[theme];
    const T = (9 / SPEED[mood]).toFixed(2), Tm = (9 / SPEED[mood] / 13.37).toFixed(3);
    const flicker = speaking ? '0.55;1;0.7;0.95;0.6;1;0.75;0.55' : '0.85;1;0.85';
    return `<svg class="orb-svg" data-mood="${mood}" role="img" aria-label="${label || 'Protoa, ' + mood}" viewBox="-150 -150 300 300" width="100%" height="100%" style="display:block;overflow:visible">
    <defs>
      <radialGradient id="${id}-halo" cx="0" cy="0" r="150" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="${m.m}" stop-opacity="${c.haloA}"/><stop offset="1" stop-color="${m.m}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-glass" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.glassIn}" stop-opacity="0"/><stop offset="0.72" stop-color="${c.glassIn}" stop-opacity="${c.midA}"/><stop offset="0.95" stop-color="${c.edge}" stop-opacity="${c.edgeA}"/><stop offset="1" stop-color="${c.edge}" stop-opacity="${c.rimA}"/></radialGradient>
      <radialGradient id="${id}-dens" cx="0" cy="0" r="56" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.1" stop-color="${m.hot}"/><stop offset="0.3" stop-color="${m.m}" stop-opacity="0.9"/><stop offset="0.58" stop-color="${m.deep}" stop-opacity="0.42"/><stop offset="1" stop-color="${m.deep}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-orbiter" cx="0.5" cy="0.5" r="0.5" fx="0.34" fy="0.3"><stop offset="0" stop-color="${c.o1}"/><stop offset="0.38" stop-color="${c.o2}"/><stop offset="0.82" stop-color="${c.o3}"/><stop offset="1" stop-color="${c.o4}"/></radialGradient>
      <radialGradient id="${id}-moon" cx="0.5" cy="0.5" r="0.5" fx="0.35" fy="0.3"><stop offset="0" stop-color="#E4F4FF"/><stop offset="0.55" stop-color="#7CC6FF"/><stop offset="1" stop-color="#3C79B8"/></radialGradient>
      <filter id="${id}-soft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}-bloom" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <filter id="${id}-fine" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1"/></filter>
    </defs>
    <circle r="150" fill="url(#${id}-halo)"><animate attributeName="opacity" values="0.8;1;0.8" dur="4.6s" repeatCount="indefinite"/></circle>
    <ellipse cx="0" cy="124" rx="64" ry="9" fill="${c.shadow}" filter="url(#${id}-soft)"/>
    <circle r="100" fill="url(#${id}-glass)"/>
    <g transform="rotate(-18)"><path d="M -65.6 0 A 65.6 19.7 0 0 1 65.6 0" fill="none" stroke="${c.ringBack}" stroke-width="0.8"/></g>
    ${orbiter(id, T, Tm, c, false)}
    <circle r="56" fill="url(#${id}-dens)" filter="url(#${id}-soft)"><animate attributeName="r" values="54;59;54" dur="4.6s" repeatCount="indefinite"/></circle>
    <g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${(17 / SPEED[mood]).toFixed(2)}s" repeatCount="indefinite"/><path d="${G_OUT}" fill="${c.grain}" opacity="${c.grainA}"/></g>
    <circle r="30" fill="${m.deep}" opacity="0.5" filter="url(#${id}-bloom)"/>
    <circle r="19" fill="${m.m}" opacity="0.85" filter="url(#${id}-bloom)"><animate attributeName="r" values="18;20.5;18" dur="4.6s" repeatCount="indefinite"/></circle>
    <g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${(6 / SPEED[mood]).toFixed(2)}s" repeatCount="indefinite"/><path d="${G_IN}" fill="#FFFFFF" opacity="0.75"/></g>
    <circle r="10" fill="${m.hot}" filter="url(#${id}-fine)"><animate attributeName="opacity" values="${flicker}" dur="${speaking ? 1.7 : 4.6}s" repeatCount="indefinite"/></circle>
    <circle r="4.6" fill="#FFFFFF"/>
    <g transform="rotate(-18)"><path d="M -65.6 0 A 65.6 19.7 0 0 0 65.6 0" fill="none" stroke="${c.ringFront}" stroke-width="0.9"/></g>
    ${orbiter(id, T, Tm, c, true)}
    <ellipse cx="0" cy="76" rx="48" ry="12" fill="${m.m}" opacity="${c.causticA}" filter="url(#${id}-soft)"/>
    <path d="M -84 -34 A 91 91 0 0 1 -38 -82" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="${c.streakA}" filter="url(#${id}-fine)"/>
    <path d="M 70 52 A 88 88 0 0 1 46 76" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="${c.streak2A}" filter="url(#${id}-fine)"/>
    <circle cx="-44" cy="-58" r="8" fill="#FFFFFF" opacity="0.35" filter="url(#${id}-bloom)"/>
    <circle cx="-44" cy="-58" r="2.6" fill="#FFFFFF"/>
    <circle r="98.6" fill="none" stroke="${c.innerRim}" stroke-width="1"/>
    <circle r="100" fill="none" stroke="${c.rim}" stroke-width="1"/>
  </svg>`;
  };

  /* the small brand mark: shell, core and the orbiter's ring */
  window.protoaMark = function (shell, core, ring) {
    return `<svg aria-hidden="true" viewBox="0 0 120 120" width="100%" height="100%"><circle cx="60" cy="60" r="46" fill="${shell}"/><circle cx="60" cy="60" r="18" fill="${core}"/><circle cx="60" cy="60" r="9" fill="#ffffff"/><g transform="rotate(-18 60 60)"><path d="M26 60 A34 10 0 0 0 94 60" fill="none" stroke="${shell}" stroke-width="18" stroke-linecap="round"/><path d="M26 60 A34 10 0 0 0 94 60" fill="none" stroke="${ring}" stroke-width="8.5" stroke-linecap="round"/></g></svg>`;
  };
})();
