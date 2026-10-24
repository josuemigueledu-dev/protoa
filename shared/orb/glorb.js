/* ============================================================
   GLOrb: the teacher rendered on the GPU.
   A thin glass shell (fresnel rim, sky + window reflections, inner caustic, shaded lower wall)
   around a small living core of blue light (solid sphere + volumetric glow + drifting plasma filaments).
   Drawn at devicePixelRatio, analytically anti-aliased, so it is sharp at any size.
   Behaviour that makes it feel present:
     · speech      core brightens with VoiceLight (syllable cadence / real audio level)
     · gaze        core drifts toward the pointer, or toward the field being typed in; wanders when idle
     · breathing   slow, slightly irregular swell; a faint double heartbeat every 7–13 s
     · attention   typing makes it lean in and glow a little
     · reactions   right answer: a warm bloom; near miss: a quick shiver and dim
     · thinking    while Claude works the plasma speeds up and the core circles
   Falls back to the CSS orb when WebGL is unavailable.
   ============================================================ */
const GLOrb = (() => {
  const VS = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  const FS = `precision highp float;
varying vec2 v;
uniform vec2 uRes; uniform float uT, uLvl, uBreath, uFlash, uShiver, uThink, uAttn, uDark, uScale, uHeart;
uniform vec2 uGaze; uniform float uSpin;
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*noise(p);p*=2.03;a*=.5;}return s;}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
/* lines etched into the glass: 12 meridians, the equator and two parallels; widths stay ~1px on screen */
float etch(vec3 q,float wpx){
 float PI=3.14159265,st=PI/6.;
 float lon=atan(q.z,q.x),lat=asin(clamp(q.y,-1.,1.));
 float dm=abs(fract(lon/st+.5)-.5)*st*cos(lat);
 float dl=min(abs(lat),abs(abs(lat)-.62));
 float fade=1.-smoothstep(.78,.96,abs(q.y));
 return max((1.-smoothstep(wpx*.3,wpx,dm))*fade,1.-smoothstep(wpx*.3,wpx,dl));}
/* an orbit ring around the core: distance to its projected ellipse, its depth there, and a travelling light */
vec4 orbit(vec2 q,mat3 R,float rho,float px,float sat){
 vec3 u=R*vec3(1.,0.,0.),w=R*vec3(0.,0.,1.);
 vec2 u2=u.xy,w2=w.xy; float det=u2.x*w2.y-u2.y*w2.x;
 vec2 k=vec2(w2.y*q.x-w2.x*q.y,-u2.y*q.x+u2.x*q.y)/(det*rho+1e-5);
 vec2 cs=normalize(k+1e-6);
 vec2 pt=rho*(cs.x*u2+cs.y*w2);
 float line=1.-smoothstep(px*.35,px*1.35,length(q-pt));
 float depth=cs.x*u.z+cs.y*w.z;
 vec2 sp=rho*(cos(sat)*u2+sin(sat)*w2);
 float sd=cos(sat)*u.z+sin(sat)*w.z;
 float dotv=exp(-dot(q-sp,q-sp)/(px*px*7.+.0006))*(sd>0.?1.:.35);
 return vec4(line,depth,dotv,sd);}
vec3 sky(vec3 r){
 float up=smoothstep(-.35,.9,r.y);
 vec3 c=mix(vec3(.34,.50,.78),vec3(.93,.97,1.),up);
 c+=vec3(1.)*pow(max(dot(r,normalize(vec3(-.42,.62,.66))),0.),70.)*1.6;   /* window, sharp */
 c+=vec3(.9,.96,1.)*pow(max(dot(r,normalize(vec3(-.42,.62,.66))),0.),9.)*.35;  /* window, soft */
 c+=vec3(.55,.75,1.)*pow(max(dot(r,normalize(vec3(.7,-.2,.68))),0.),14.)*.25;  /* bounce light, lower right */
 return c;}
void main(){
 vec2 p=(v*2.-1.)*uScale;
 float px=2.*uScale/uRes.x;
 float r=length(p);
 float lvl=clamp(uLvl+uFlash*.55+uHeart*.18+uAttn*.12,0.,1.6);
 vec3 C=vec3(0.); float A=0.;
 /* ---- core position: gaze + shiver ---- */
 vec2 c=uGaze*.2+vec2(sin(uT*37.)*.018,cos(uT*41.)*.018)*uShiver;
 float rc=.165*(1.+.05*uBreath+.30*clamp(uLvl,0.,1.)+.10*uFlash+.06*uHeart);
 vec3 coreCol=mix(vec3(.16,.46,1.),vec3(.38,.36,1.),uThink*.45);
 float d=length(p-c);
 float inside=smoothstep(1.+px*.75,1.-px*.75,r);
 /* ---- outer light leaving the orb ---- */
 float out1=exp(-max(r-1.,0.)*5.5)*(1.-inside);
 vec3 eOut=coreCol*out1*(.05+lvl*.42);
 C+=eOut; A+=max(eOut.r,max(eOut.g,eOut.b))*.9;
 if(r<1.+px*2.){
  float z=sqrt(max(1.-r*r,0.));
  vec3 n=vec3(p,z);
  float fres=pow(1.-n.z,2.6);
  vec3 refl=reflect(vec3(0.,0.,-1.),n);
  vec3 env=sky(refl);
  /* shell: almost clear, reflective toward the rim */
  float sa=(.05+fres*.6)*inside;
  vec3 shell=env*(.18+fres*.82);
  /* shaded lower-right inner wall gives the volume */
  float wall=smoothstep(.45,1.,r)*clamp(dot(normalize(p+1e-5),vec2(.55,-.83)),0.,1.)*.22*inside;
  /* caustic: core light focused onto the lower inside of the glass */
  float cau=smoothstep(.62,.97,r)*smoothstep(-.15,-.85,p.y)*(1.-smoothstep(.97,1.,r))*(.18+lvl*.85);
  vec3 eCau=mix(coreCol,vec3(.75,.9,1.),.55)*cau;
  /* reflections a clear glass shell still shows strongly: the window, its hot spot, a crescent along the top rim */
  vec3 L1=normalize(vec3(-.42,.62,.66));
  float win=pow(max(dot(refl,L1),0.),26.)*.55+pow(max(dot(refl,L1),0.),340.)*1.4;
  float arc=smoothstep(.80,.94,r)*smoothstep(.05,.75,p.y/max(r,1e-3))*(1.-smoothstep(.95,.995,r))*.32;
  float low=smoothstep(.84,.97,r)*smoothstep(-.1,-.8,p.y/max(r,1e-3))*(1.-smoothstep(.975,.998,r))*.16;
  vec3 eSpec=(vec3(1.)*(win+arc)+vec3(.7,.86,1.)*low)*inside;
  /* core: volumetric glow (exact for an orthographic ray through a gaussian) */
  float glowW=.20+.16*clamp(uLvl,0.,1.)+.06*uFlash;
  float glow=exp(-(d*d)/(glowW*glowW));
  float halo=exp(-(d*d)/(.62*.62));
  float base=.30+.10*uBreath;
  vec3 eCore=coreCol*(glow*(base+lvl*1.25)+halo*(.05+lvl*.22));
  /* plasma filaments drifting around the core */
  vec3 q=vec3((p-c)*3.2,uT*(.16+.5*uThink+.35*clamp(uLvl,0.,1.)));
  float w=fbm(q+vec3(fbm(q*1.6+uT*.2)*1.4));
  float fil=smoothstep(.56,.86,w)*exp(-(d*d)/(.34*.34));
  eCore+=mix(coreCol,vec3(.7,.88,1.),.5)*fil*(.10+lvl*.55);
  /* the solid little sphere of light at the centre */
  float dc=d/rc;
  float solid=smoothstep(1.,1.-px*1.6/rc,dc);
  float cz=sqrt(max(1.-dc*dc,0.));
  vec3 cn=normalize(vec3((p-c)/rc,cz));
  float lit=.55+.45*dot(cn,normalize(vec3(-.4,.55,.75)));
  vec3 hot=mix(coreCol*1.25,vec3(.88,.95,1.),clamp(lvl*.75+.15,0.,1.)*pow(cz,1.6));
  vec3 sCore=hot*lit*(.55+lvl*.9+.08*uBreath)+vec3(1.)*pow(max(dot(cn,normalize(vec3(-.45,.6,.66))),0.),40.)*.55;
  eCore=mix(eCore,sCore+eCore*.35,solid);
  eCore*=inside;
  /* the globe turns: etched lines on the near side, and fainter on the far side seen through the glass */
  mat3 Rg=rotX(.42)*rotY(uSpin);
  float wpx=px*1.25/max(z,.18);
  float gF=etch(Rg*vec3(p,z),wpx), gB=etch(Rg*vec3(p,-z),wpx);
  vec3 eEtch=(mix(vec3(.16,.36,.78),vec3(.86,.94,1.),uDark)*gF*(.11+.26*fres)+mix(vec3(.26,.46,.86),vec3(.50,.72,1.),uDark)*gB*.085)*inside*(1.+lvl*.6);
  /* two orbit rings precess around the core, each carrying a point of light */
  vec2 q2=p-c;
  vec4 o1=orbit(q2,rotY(uSpin*.35)*rotZ(.38)*rotX(1.1),.40,px,uSpin*2.3);
  vec4 o2=orbit(q2,rotY(-uSpin*.27)*rotZ(-.9)*rotX(1.2),.53,px,-uSpin*1.7+2.);
  float occ=smoothstep(rc*.92,rc*1.08,d);
  float l1=o1.x*(o1.y>0.?1.:.32*occ), l2=o2.x*(o2.y>0.?1.:.32*occ);
  vec3 ringCol=mix(coreCol*.8,vec3(.8,.92,1.),.45*uDark);
  vec3 eRing=ringCol*(l1*.46+l2*.34)*(.6+lvl*.9)*inside;
  /* two small solid, faintly white dots racing around the core on their own tilted orbits */
  float dots=0.;
  for(int i=0;i<2;i++){
   float fi=float(i);
   mat3 Rd=rotZ(.55-1.5*fi)*rotX(1.0+.35*fi);
   float th=uT*(7.6+2.1*fi)*(fi>.5?-1.:1.)+fi*2.4;
   float rho=.27+.07*fi;
   vec3 pd=Rd*vec3(cos(th)*rho,0.,sin(th)*rho);
   vec2 sd=c+pd.xy;
   float rd=.043*(1.+.18*pd.z/rho);
   float disc=smoothstep(rd,rd-px*1.1,length(p-sd));
   float hidden=(pd.z<0.&&length(sd-c)<rc*1.02)?0.:1.;
   dots+=disc*hidden*(pd.z>0.?.74:.42);
  }
  vec3 eDots=vec3(.93,.97,1.)*dots*inside;
  /* rim: a thin bright edge, and a faint dark hairline outside for light grounds */
  float rim=(1.-smoothstep(0.,px*1.3,abs(r-(1.-px*.9))))*.55;
  float hair=(1.-smoothstep(0.,px*1.1,abs(r-(1.+px*.6))))*.14*(1.-uDark);
  /* composite, premultiplied */
  C=C*(1.-sa)+shell*sa; A=A*(1.-sa)+sa;
  C+=vec3(.03,.12,.32)*wall; A+=wall;
  C+=eCau; A+=max(eCau.r,max(eCau.g,eCau.b))*.8;
  C+=eSpec; A+=clamp(max(eSpec.r,max(eSpec.g,eSpec.b)),0.,1.);
  C+=eEtch; A+=clamp(max(eEtch.r,max(eEtch.g,eEtch.b)),0.,1.);
  C+=eCore; A+=clamp(max(eCore.r,max(eCore.g,eCore.b)),0.,1.)*.95;
  C+=eRing; A+=clamp(max(eRing.r,max(eRing.g,eRing.b)),0.,1.);
  C+=eDots; A+=clamp(dots*inside,0.,1.);
  C+=vec3(1.)*rim; A+=rim;
  C+=vec3(.06,.16,.36)*hair; A+=hair;
 }
 A=clamp(A,0.,1.); C=min(C,vec3(A));
 gl_FragColor=vec4(C,A);
}`;
  let gl = null, prog = null, U = {}, canvas = null, raf = 0, ok = false, sizePx = 0, visible = true;
  const S = { spin: 0, t0: performance.now(), gaze: [0, 0], gv: [0, 0], target: [0, 0], lastPointer: 0, ptr: null, flash: 0, shiver: 0, think: 0, thinkT: 0, attn: 0, heart: 0, nextBeat: 0, beatAt: -1 };
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
    ['uRes', 'uT', 'uLvl', 'uBreath', 'uFlash', 'uShiver', 'uThink', 'uAttn', 'uDark', 'uScale', 'uHeart', 'uGaze', 'uSpin'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
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

  function frame(now) {
    raf = 0; if (!ok || !TEACHER.isConnected || document.hidden || !visible) return;
    const t = (now - S.t0) / 1000, dt = Math.min(.05, (now - (S.last || now)) / 1000); S.last = now;
    const still = reducedM();
    /* gaze target: typing field > pointer > idle wander */
    const r = TEACHER.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    /* the core looks at what you are working on (the companion's anchor); with nothing to watch it looks around */
    let tx = 0, ty = 0; const look = typeof Companion !== 'undefined' ? Companion.look() : null;
    if (look) { tx = look[0] - cx; ty = look[1] - cy; }
    else if (!still) { tx = Math.sin(t * .23) * 160 + Math.sin(t * .61) * 60; ty = Math.cos(t * .17) * 90 + Math.sin(t * .47) * 40; }
    const L = Math.hypot(tx, ty), k = L / (L + 260);
    S.target = L ? [tx / L * k, -ty / L * k] : [0, 0];
    /* critically damped spring toward the target */
    const w = still ? 3 : 7;
    for (let i = 0; i < 2; i++) { const f = w * w * (S.target[i] - S.gaze[i]) - 2 * w * S.gv[i]; S.gv[i] += f * dt; S.gaze[i] += S.gv[i] * dt; }
    /* thinking: the core circles */
    const thinkOn = TEACHER.classList.contains('thinking') || TEACHER.classList.contains('busy');
    S.think += ((thinkOn ? 1 : 0) - S.think) * Math.min(1, dt * 3);
    /* inertia: while the orb travels, its core lags behind inside the glass */
    const V = typeof Companion !== 'undefined' ? Companion.vel : [0, 0], lag = v => Math.max(-.6, Math.min(.6, v / 1400));
    const gx = S.gaze[0] + Math.cos(t * 2.2) * .35 * S.think - lag(V[0]), gy = S.gaze[1] + Math.sin(t * 2.2) * .35 * S.think + lag(V[1]);
    /* breathing and heartbeat */
    const breath = still ? 0 : Math.sin(t * 1.12) * .8 + Math.sin(t * .37 + 1.3) * .2;
    if (!S.nextBeat) S.nextBeat = t + 4 + Math.random() * 5;
    if (t > S.nextBeat && !still) { S.beatAt = t; S.nextBeat = t + 7 + Math.random() * 6; }
    const bt = t - S.beatAt; const heart = S.beatAt < 0 ? 0 : Math.exp(-Math.pow((bt - .08) / .07, 2)) + .6 * Math.exp(-Math.pow((bt - .36) / .08, 2));
    S.flash = Math.max(0, S.flash - dt * 1.6); S.shiver = Math.max(0, S.shiver - dt * 2.2); S.attn = Math.max(0, S.attn - dt * .6);
    const lvl = typeof VoiceLight !== 'undefined' ? VoiceLight.shown || 0 : 0;
    S.spin += dt * (still ? .05 : .55 + 1.0 * lvl + .9 * S.think + .6 * S.flash);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, sizePx, sizePx); gl.uniform1f(U.uT, still ? 0 : t); gl.uniform1f(U.uLvl, lvl);
    gl.uniform1f(U.uBreath, breath); gl.uniform1f(U.uFlash, S.flash); gl.uniform1f(U.uShiver, S.shiver); gl.uniform1f(U.uThink, S.think);
    gl.uniform1f(U.uAttn, Math.min(1, S.attn)); gl.uniform1f(U.uDark, darkGround() ? 1 : 0); gl.uniform1f(U.uScale, SCALE); gl.uniform1f(U.uHeart, heart);
    gl.uniform2f(U.uGaze, gx, gy); gl.uniform1f(U.uSpin, S.spin);
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
    flash() { S.flash = 1; run(); },
    shiver() { S.shiver = 1; S.flash = Math.max(0, S.flash - .5); run(); },
  };
})();
