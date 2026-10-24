/* ============================================================
   GLOrb: Protoa, rendered on the GPU.
   Anatomy (see shared/brand/README.md):
     · shell      polished, perfectly clear glass: invisible head-on, studio reflections and a pin highlight
                  toward the edge, a thin rim; light from the core gathers on its lower inside (caustic)
     · density    the mind: layered glow that thickens toward a white-hot nucleus, with fine grains that
                  swirl faster the closer they are to the centre. Its hue is Protoa's mood:
                  light blue = neutral, green = correct, yellow = almost (half right), red = incorrect
     · orbiter    a small solid sphere on the tilted ring of the logo, lit by the core, carrying a moon
                  that keeps Earth–Moon proportions: 27.3% of its size, a path tilted 5.1°, and
                  13.37 laps for each lap of the orbiter (sidereal year ÷ sidereal month)
   Drawn at devicePixelRatio, analytically anti-aliased, so it is sharp at any size.
   Behaviour that makes it feel present:
     · speech      the density brightens with VoiceLight (syllable cadence / real audio level)
     · gaze        the core drifts toward what you are working on; wanders when idle
     · breathing   slow, slightly irregular swell; a faint double heartbeat every 7–13 s
     · attention   typing makes it glow a little
     · reactions   right answer: green and the orbiter speeds up; near miss: yellow and the orbit wobbles;
                   wrong: red, a quick shiver, the orbiter slows
     · thinking    while Claude works the grains swirl faster and the orbiter races
   Falls back to the CSS orb when WebGL is unavailable.
   ============================================================ */
const GLOrb = (() => {
  const VS = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  const FS = `precision highp float;
varying vec2 v;
uniform vec2 uRes; uniform float uT, uLvl, uBreath, uFlash, uShiver, uAttn, uDark, uScale, uHeart, uSwirl;
uniform vec2 uGaze; uniform vec3 uCol;
uniform vec3 uOrb, uMoon, uPU, uPW; uniform float uRho, uOrbR, uMoonR;
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
/* the orbiter's path: distance to its projected ellipse and the depth there (front > 0) */
vec2 ring(vec2 q,vec3 U,vec3 W,float rho,float px){
 vec2 u2=U.xy,w2=W.xy; float det=u2.x*w2.y-u2.y*w2.x;
 vec2 k=vec2(w2.y*q.x-w2.x*q.y,-u2.y*q.x+u2.x*q.y)/(det*rho+1e-5);
 vec2 cs=normalize(k+1e-6);
 vec2 pt=rho*(cs.x*u2+cs.y*w2);
 return vec2(1.-smoothstep(px*.35,px*1.35,length(q-pt)),cs.x*U.z+cs.y*W.z);}
/* a small solid sphere centred at o (relative to the core), lit by a key light and by the core's colour */
vec4 ball(vec2 q,vec3 o,float r,vec3 base,float lvl,float px){
 vec2 dq=q-o.xy; float dd=length(dq);
 float cov=smoothstep(r+px*.6,r-px*.6,dd);
 if(cov<=0.) return vec4(0.);
 vec3 n=normalize(vec3(dq/r,sqrt(max(1.-dd*dd/(r*r),0.))));
 float toCore=max(dot(n,normalize(-o)),0.);
 float key=max(dot(n,normalize(vec3(-.45,.6,.66))),0.);
 float spec=pow(max(dot(n,normalize(vec3(-.45,.6,1.66))),0.),60.);
 vec3 c=base*(.22+.6*key)+uCol*toCore*(.45+lvl*.9)+vec3(1.)*spec*.55;
 return vec4(c*cov,cov);}
void main(){
 vec2 p=(v*2.-1.)*uScale;
 float px=2.*uScale/uRes.x;
 float r=length(p);
 float lvl=clamp(uLvl+uFlash*.45+uHeart*.18+uAttn*.12,0.,1.6);
 vec3 C=vec3(0.); float A=0.;
 vec3 white=vec3(1.);
 /* ---- core position: gaze + shiver ---- */
 vec2 c=uGaze*.2+vec2(sin(uT*37.)*.018,cos(uT*41.)*.018)*uShiver;
 float inside=smoothstep(1.+px*.75,1.-px*.75,r);
 /* ---- light leaving the orb ---- */
 float out1=exp(-max(r-1.,0.)*5.5)*(1.-inside);
 vec3 eOut=uCol*out1*(.04+lvl*.38);
 C+=eOut; A+=max(eOut.r,max(eOut.g,eOut.b))*.9;
 if(r<1.+px*2.){
  float z=sqrt(max(1.-r*r,0.));
  vec3 n=vec3(p,z);
  /* on light grounds the clear glass needs a whisper of tint toward its edge to read at all */
  float tint=pow(1.-z,3.)*.10*(1.-uDark)*inside;
  C+=vec3(.04,.08,.18)*tint; A+=tint;
  /* caustic: core light focused onto the lower inside of the glass */
  float cau=smoothstep(.62,.97,r)*smoothstep(-.15,-.85,p.y)*(1.-smoothstep(.97,1.,r))*(.12+lvl*.8)*inside;
  vec3 eCau=mix(uCol,vec3(.8,.92,1.),.45)*cau;
  C+=eCau; A+=max(eCau.r,max(eCau.g,eCau.b))*.8;
  /* ---- the orbiter's path, its back half first ---- */
  vec2 q=p-c;
  vec2 rg=ring(q,uPU,uPW,uRho,px);
  float ringA=rg.x*(.10+.12*uDark)*(.7+lvl*.5)*inside;
  vec3 ringC=mix(uCol,white,.5);
  float ro=max(uOrbR,px*2.4), rm=max(uMoonR,px*1.3);
  vec3 orbBase=mix(vec3(.06,.08,.13),vec3(.93,.96,1.),uDark);
  vec3 moonBase=mix(vec3(.49,.52,.58),vec3(.73,.74,.78),uDark);
  vec4 bO=ball(q,uOrb,ro,orbBase,lvl,px), bM=ball(q,uMoon,rm,moonBase,lvl,px);
  if(rg.y<0.){ vec3 e=ringC*ringA*.5; C+=e; A+=ringA*.5; }
  /* bodies behind the core go under its light, bodies in front go over it */
  if(uOrb.z<0.){ C=bO.rgb+C*(1.-bO.a); A=bO.a+A*(1.-bO.a); }
  if(uMoon.z<0.){ C=bM.rgb+C*(1.-bM.a); A=bM.a+A*(1.-bM.a); }
  /* ---- density: layered glow toward a white-hot nucleus, grains swirling faster near the centre ---- */
  float d=length(q);
  float s=1.+.05*uBreath+.25*clamp(uLvl,0.,1.)+.08*uFlash+.05*uHeart;
  float e=d/s, e2=e*e;
  float strata=1.*exp(-e2/.005)+.6*exp(-e2/.02)+.35*exp(-e2/.06)+.18*exp(-e2/.16);
  float ang=uSwirl*.35/(d+.12);
  vec2 g=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*q;
  float n1=noise(vec3(g*34.,uT*.15)), n2=noise(vec3(g*17.+7.,uT*.1));
  float grains=(pow(n1,7.)*2.4+pow(n2,6.)*1.3)*exp(-e/.28);
  float bright=.62+lvl*1.1+.1*uBreath;
  float hot=exp(-e2/.0025)*mix(.45,.85,uDark);
  vec3 eCore=(mix(uCol,white,hot)*strata+mix(uCol,white,.25)*grains)*bright;
  float nuc=smoothstep(.045*s+px,.045*s-px,d);
  eCore=mix(eCore,mix(uCol,white,mix(.55,.85,uDark))*(1.15+lvl),nuc)*inside;
  C+=eCore; A+=clamp(max(eCore.r,max(eCore.g,eCore.b)),0.,1.)*.95;
  if(rg.y>=0.){ vec3 e3=ringC*ringA; C+=e3; A+=ringA; }
  if(uOrb.z>=0.){ C=bO.rgb+C*(1.-bO.a); A=bO.a+A*(1.-bO.a); }
  if(uMoon.z>=0.){ C=bM.rgb+C*(1.-bM.a); A=bM.a+A*(1.-bM.a); }
  /* ---- polished glass: fresnel reflections of a softbox and a strip light, a pin highlight ---- */
  float F=.96*pow(1.-z,5.);
  vec3 rf=reflect(vec3(0.,0.,-1.),n);
  float box=smoothstep(.6,.66,rf.y)*smoothstep(.5,.44,abs(rf.x+.22));
  float strip=smoothstep(.9,.93,rf.x)*smoothstep(.45,.38,abs(rf.y-.05));
  float env=box+strip*.6+.12;
  float spec=pow(max(dot(n,normalize(vec3(-.42,.62,1.66))),0.),900.)*2.;
  float refl=clamp((F*env*1.4+spec)*inside,0.,1.);
  C+=white*refl; A+=refl;
  /* rim: a thin bright edge, and a faint dark hairline outside for light grounds */
  float rim=(1.-smoothstep(0.,px*1.3,abs(r-(1.-px*.9))))*mix(.32,.5,uDark);
  float hair=(1.-smoothstep(0.,px*1.1,abs(r-(1.+px*.6))))*.16*(1.-uDark);
  C+=white*rim; A+=rim;
  C+=vec3(.06,.16,.36)*hair; A+=hair;
 }
 A=clamp(A,0.,1.); C=min(C,vec3(A));
 gl_FragColor=vec4(C,A);
}`;
  /* mood colours, sRGB, for dark and light grounds */
  const MOOD = {
    dark:  { neutral: [.39, .72, 1], correct: [.21, .89, .60], almost: [1, .81, .24], wrong: [1, .35, .45] },
    light: { neutral: [.12, .50, .91], correct: [.07, .63, .42], almost: [.82, .60, 0], wrong: [.85, .20, .31] },
  };
  const MOOD_SPEED = { neutral: 1, correct: 1.7, almost: 1, wrong: .45 };
  /* the orbiter's path: the logo's ring, rolled 18° and tipped back so it reads as an ellipse 0.3 tall,
     front half below the core. Sizes are in shell radii (the shell is 1.6 units in the character sheet). */
  const RHO = 1.05 / 1.6, ORB_R = .13 / 1.6, MOON_R = ORB_R * .273, MOON_D = ORB_R * 2.6;
  const MOON_RATIO = 365.256 / 27.322, MOON_TILT = 5.145 * Math.PI / 180;
  const roll = .31, tip = 1.26;
  const PU = [Math.cos(roll), Math.sin(roll), 0];
  const PW = [-Math.sin(roll) * Math.cos(tip), Math.cos(roll) * Math.cos(tip), -Math.sin(tip)];
  const PN = [PU[1] * PW[2] - PU[2] * PW[1], PU[2] * PW[0] - PU[0] * PW[2], PU[0] * PW[1] - PU[1] * PW[0]];
  const MW = PW.map((x, i) => x * Math.cos(MOON_TILT) + PN[i] * Math.sin(MOON_TILT));

  let gl = null, prog = null, U = {}, canvas = null, raf = 0, ok = false, sizePx = 0, visible = true;
  const S = { t0: performance.now(), gaze: [0, 0], gv: [0, 0], target: [0, 0], flash: 0, shiver: 0, think: 0, attn: 0, heart: 0, nextBeat: 0, beatAt: -1,
              mood: 'neutral', moodUntil: 0, col: null, th: 0, ph: 0, orbSpeed: 1, swirl: 0, almost: 0 };
  const SCALE = 1.5;

  function init() {
    canvas = document.createElement('canvas'); canvas.className = 'glc';
    try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return false;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return false;
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uT', 'uLvl', 'uBreath', 'uFlash', 'uShiver', 'uAttn', 'uDark', 'uScale', 'uHeart', 'uSwirl', 'uGaze', 'uCol',
     'uOrb', 'uMoon', 'uPU', 'uPW', 'uRho', 'uOrbR', 'uMoonR'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; TEACHER.classList.remove('gl'); cancelAnimationFrame(raf); raf = 0; });
    return true;
  }
  function resize(cssSize) {
    if (!ok) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1), px = Math.round(cssSize * SCALE * dpr);
    if (px === sizePx) return; sizePx = px; canvas.width = canvas.height = px; gl.viewport(0, 0, px, px);
  }
  const reducedM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const darkGround = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  function setMood(m, secs) { S.mood = m; S.moodUntil = performance.now() + secs * 1000; run(); }

  function frame(now) {
    raf = 0; if (!ok || !TEACHER.isConnected || document.hidden || !visible) return;
    const t = (now - S.t0) / 1000, dt = Math.min(.05, (now - (S.last || now)) / 1000); S.last = now;
    const still = reducedM(), dark = darkGround();
    /* gaze target: the companion's anchor; with nothing to watch it looks around */
    const r = TEACHER.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let tx = 0, ty = 0; const look = typeof Companion !== 'undefined' ? Companion.look() : null;
    if (look) { tx = look[0] - cx; ty = look[1] - cy; }
    else if (!still) { tx = Math.sin(t * .23) * 160 + Math.sin(t * .61) * 60; ty = Math.cos(t * .17) * 90 + Math.sin(t * .47) * 40; }
    const L = Math.hypot(tx, ty), k = L / (L + 260);
    S.target = L ? [tx / L * k, -ty / L * k] : [0, 0];
    /* critically damped spring toward the target */
    const w = still ? 3 : 7;
    for (let i = 0; i < 2; i++) { const f = w * w * (S.target[i] - S.gaze[i]) - 2 * w * S.gv[i]; S.gv[i] += f * dt; S.gaze[i] += S.gv[i] * dt; }
    const thinkOn = TEACHER.classList.contains('thinking') || TEACHER.classList.contains('busy');
    S.think += ((thinkOn ? 1 : 0) - S.think) * Math.min(1, dt * 3);
    /* inertia: while the orb travels, its core lags behind inside the glass */
    const V = typeof Companion !== 'undefined' ? Companion.vel : [0, 0], lag = v => Math.max(-.6, Math.min(.6, v / 1400));
    const gx = S.gaze[0] - lag(V[0]), gy = S.gaze[1] + lag(V[1]);
    /* breathing and heartbeat */
    const breath = still ? 0 : Math.sin(t * 1.12) * .8 + Math.sin(t * .37 + 1.3) * .2;
    if (!S.nextBeat) S.nextBeat = t + 4 + Math.random() * 5;
    if (t > S.nextBeat && !still) { S.beatAt = t; S.nextBeat = t + 7 + Math.random() * 6; }
    const bt = t - S.beatAt; const heart = S.beatAt < 0 ? 0 : Math.exp(-Math.pow((bt - .08) / .07, 2)) + .6 * Math.exp(-Math.pow((bt - .36) / .08, 2));
    S.flash = Math.max(0, S.flash - dt * 1.6); S.shiver = Math.max(0, S.shiver - dt * 2.2); S.attn = Math.max(0, S.attn - dt * .6);
    const lvl = typeof VoiceLight !== 'undefined' ? VoiceLight.shown || 0 : 0;
    /* mood: hold the reaction colour, then ease back to neutral */
    if (S.mood !== 'neutral' && now > S.moodUntil) S.mood = 'neutral';
    const want = MOOD[dark ? 'dark' : 'light'][S.mood];
    if (!S.col) S.col = want.slice();
    const kc = 1 - Math.exp(-dt / .25); for (let i = 0; i < 3; i++) S.col[i] += (want[i] - S.col[i]) * kc;
    S.almost += ((S.mood === 'almost' ? 1 : 0) - S.almost) * Math.min(1, dt * 4);
    /* the orbiter: its pace shows what Protoa is doing; the moon keeps the Earth–Moon ratio to it */
    const pace = (still ? .3 : 1) * MOOD_SPEED[S.mood] * (1 + .25 * Math.min(1, lvl * 3) + 1.4 * S.think);
    S.orbSpeed += (pace - S.orbSpeed) * Math.min(1, dt * 2.5);
    const dTh = dt * .9 * S.orbSpeed; S.th += dTh; S.ph += dTh * MOON_RATIO;
    S.swirl += dt * (still ? .1 : .5 + .8 * lvl + 1.2 * S.think);
    const rho = RHO + (still ? 0 : Math.sin(t * 5) * .035 * S.almost);
    const O = [0, 1, 2].map(i => rho * (Math.cos(S.th) * PU[i] + Math.sin(S.th) * PW[i]));
    const M = [0, 1, 2].map(i => O[i] + MOON_D * (Math.cos(S.ph) * PU[i] + Math.sin(S.ph) * MW[i]));

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, sizePx, sizePx); gl.uniform1f(U.uT, still ? 0 : t); gl.uniform1f(U.uLvl, lvl);
    gl.uniform1f(U.uBreath, breath); gl.uniform1f(U.uFlash, S.flash); gl.uniform1f(U.uShiver, S.shiver);
    gl.uniform1f(U.uAttn, Math.min(1, S.attn)); gl.uniform1f(U.uDark, dark ? 1 : 0); gl.uniform1f(U.uScale, SCALE); gl.uniform1f(U.uHeart, heart);
    gl.uniform1f(U.uSwirl, S.swirl); gl.uniform2f(U.uGaze, gx, gy); gl.uniform3fv(U.uCol, S.col);
    gl.uniform3fv(U.uOrb, O); gl.uniform3fv(U.uMoon, M); gl.uniform3fv(U.uPU, PU); gl.uniform3fv(U.uPW, PW);
    gl.uniform1f(U.uRho, rho); gl.uniform1f(U.uOrbR, ORB_R); gl.uniform1f(U.uMoonR, MOON_R);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    run();
  }
  function run() { if (!raf && ok) raf = requestAnimationFrame(frame); }

  return {
    get ok() { return ok; },
    attach() {
      if (!canvas) { ok = init(); if (!ok) return; TEACHER.querySelector('.float').append(canvas); TEACHER.classList.add('gl');
        document.addEventListener('input', e => { if (e.target.matches && e.target.matches('input,textarea')) S.attn = Math.min(1.4, S.attn + .35); }, true);
        document.addEventListener('visibilitychange', run);
        if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); }).observe(TEACHER);
      }
      resize(parseFloat(TEACHER.style.getPropertyValue('--s')) || 56); run();
    },
    /* reactions: correct, near miss, wrong */
    flash() { S.flash = 1; setMood('correct', 2.2); },
    almost() { setMood('almost', 2.4); },
    shiver() { S.shiver = 1; S.flash = Math.max(0, S.flash - .5); setMood('wrong', 2.4); },
  };
})();
