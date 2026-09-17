// 게임이 끝날 때 나오는 2D 애니메이션 결말 영상 (컷 전환 · 클로즈업 · 집중선 · 임팩트)
const LENGTH = { wolf: 15, village: 15, tanner: 14, none: 10 };

/* ═════════════ 그림 조각 ═════════════ */

const rnd = (seed) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const f = (n) => Math.round(n * 10) / 10;

function pine(x, y, h, fill) {
  const w = h * 0.34;
  let d = `M${f(x)} ${f(y - h)}`;
  for (let i = 1; i <= 5; i++) {
    const ty = y - h + (h * 0.86 * i) / 5;
    d += `L${f(x + (w * i) / 5)} ${f(ty)}L${f(x + ((w * i) / 5) * 0.4)} ${f(ty - h * 0.04)}`;
  }
  d += `L${f(x + w * 0.08)} ${f(y - h * 0.14)}V${f(y)}H${f(x - w * 0.08)}V${f(y - h * 0.14)}`;
  for (let i = 5; i >= 1; i--) {
    const ty = y - h + (h * 0.86 * i) / 5;
    d += `L${f(x - ((w * i) / 5) * 0.4)} ${f(ty - h * 0.04)}L${f(x - (w * i) / 5)} ${f(ty)}`;
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
}
const trees = (n, y, hmin, hvar, fill, seed, x0 = -100, x1 = 1700) => {
  const r = rnd(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += pine(x0 + ((x1 - x0) * (i + r() * 0.8)) / n, y + r() * 20, hmin + r() * hvar, fill);
  return s;
};
const svg = (body, vb = '0 0 1600 900') => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
const layer = (html, cls = '') => `<div class="an-layer ${cls}">${html}</div>`;

function houses(y, lit, seed = 3) {
  const r = rnd(seed);
  let s = '';
  const xs = [120, 280, 420, 560, 900, 1040, 1180, 1330, 1470];
  xs.forEach((x, i) => {
    const w = 90 + r() * 60;
    const h = 60 + r() * 50;
    s += `<path d="M${x} ${y}V${f(y - h)}L${f(x + w / 2)} ${f(y - h - w * 0.45)}L${f(x + w)} ${f(y - h)}V${y}Z" fill="#070a14"/>`;
    s += `<rect x="${f(x + w * 0.62)}" y="${f(y - h - w * 0.4)}" width="12" height="30" fill="#070a14"/>`;
    for (const k of [0.22, 0.58]) s += `<rect class="win" x="${f(x + w * k)}" y="${f(y - h * 0.72)}" width="${f(w * 0.18)}" height="${f(h * 0.26)}" fill="${lit ? '#ffc868' : '#161c2c'}"/>`;
  });
  s += `<path d="M740 ${y}V${y - 190}L770 ${y - 260}L800 ${y - 190}V${y}Z" fill="#070a14"/><circle cx="770" cy="${y - 150}" r="12" fill="${lit ? '#ffc868' : '#161c2c'}" class="win"/>`;
  return s;
}

function stars(n, seed, h = 600) {
  const r = rnd(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f(r() * 1600)}" cy="${f(r() * h)}" r="${f(0.6 + r() * 1.6)}" fill="#fff" opacity="${f(0.3 + r() * 0.7)}"/>`;
  return s;
}

const MOON_DEFS = `<radialGradient id="mG"><stop offset="0" stop-color="#fffdf0"/><stop offset=".75" stop-color="#f6e8b4"/><stop offset="1" stop-color="#d8bc70"/></radialGradient>
  <radialGradient id="mH"><stop offset=".45" stop-color="#fff4c8" stop-opacity=".55"/><stop offset="1" stop-color="#8aa8e8" stop-opacity="0"/></radialGradient>`;
const moonSvg = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="url(#mH)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#mG)"/>
  <g fill="#b8a070" opacity=".3"><ellipse cx="${cx - r * 0.3}" cy="${cy - r * 0.2}" rx="${r * 0.22}" ry="${r * 0.15}"/><ellipse cx="${cx + r * 0.28}" cy="${cy + r * 0.25}" rx="${r * 0.17}" ry="${r * 0.12}"/><ellipse cx="${cx + r * 0.1}" cy="${cy - r * 0.5}" rx="${r * 0.1}" ry="${r * 0.07}"/></g>`;

/** 우는 늑대인간 / 선 늑대인간 전신 (200×300, 발이 아래) */
const WOLF_HOWL = 'M62 300L70 262C58 246 54 226 60 206C48 196 40 178 44 160C30 168 16 182 6 196L2 214L10 204L8 222L16 208L18 226L22 206C30 190 40 176 50 164C48 140 52 118 64 104C60 92 62 80 70 72L60 40L80 62C84 58 88 54 94 52L104 18L108 50C116 44 128 34 142 20L148 26C138 40 128 50 122 58L130 58C124 66 114 72 106 76C114 88 128 96 140 100C152 112 166 128 178 146L196 150L184 156L200 162L184 165L196 175L176 169C164 156 150 144 138 136C140 156 138 178 128 198C138 216 140 242 132 264L142 300H118L112 270C104 258 98 248 96 238C92 250 88 260 84 270L84 300Z';
const WOLF_FUR = 'M64 104L56 96L66 94L58 84L70 86L66 74M50 164L40 160L48 154L40 146L52 146M138 100L148 94L146 104L158 102L150 112M128 198L140 196L132 206L142 210L130 214';
const WOLF_STAND = 'M70 300L76 262C62 246 58 226 62 206C52 196 44 180 44 162C34 176 30 196 30 216L22 236L30 228L28 244L36 232L38 248L42 230C44 208 48 188 56 172C54 146 56 124 66 110C62 98 64 86 72 78L60 44L82 66C88 62 96 60 104 60C112 60 120 62 126 66L148 44L136 78C144 86 146 98 142 110C152 124 154 146 152 172C160 188 164 208 166 230L170 248L172 232L180 244L178 228L186 236L178 216C178 196 174 176 164 162C164 180 156 196 146 206C150 226 146 246 132 262L138 300H116L112 270C108 258 104 250 104 240C104 250 100 258 96 270L92 300Z';

function wolfSvg(pose = 'howl', { rim = '#dfe8ff', eyes = true } = {}) {
  const d = pose === 'howl' ? WOLF_HOWL : WOLF_STAND;
  const eyeXY = pose === 'howl' ? [[112, 50], [120, 44]] : [[92, 84], [116, 84]];
  return `<svg viewBox="-10 -10 220 320" class="an-wolf">
    <defs><filter id="wGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>
    <path d="${d}" fill="none" stroke="${rim}" stroke-width="5" opacity=".7" filter="url(#wGlow)"/>
    <path d="${d}" fill="#04050a" stroke="${rim}" stroke-width="1.6" stroke-opacity=".9"/>
    ${pose === 'howl' ? `<path d="${WOLF_FUR}" fill="none" stroke="#04050a" stroke-width="5" stroke-linejoin="bevel"/>` : ''}
    ${eyes ? `<g class="an-eyes">${eyeXY.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#ffcf30" opacity=".5" filter="url(#wGlow)"/><ellipse cx="${x}" cy="${y}" rx="3.4" ry="2.4" fill="#ffe070"/>`).join('')}</g>` : ''}
  </svg>`;
}

/** 늑대 눈 초근접 */
function wolfEyes() {
  const r = rnd(4);
  let fur = '';
  for (let i = 0; i < 160; i++) {
    const x = r() * 1600;
    const y = r() * 900;
    fur += `<path d="M${f(x)} ${f(y)}q${f(10 + r() * 20)} ${f(-4 + r() * 8)} ${f(30 + r() * 40)} ${f(10 + r() * 16)}" stroke="${r() > 0.7 ? '#4a3a30' : '#1a1210'}" stroke-width="${f(3 + r() * 5)}" fill="none" stroke-linecap="round"/>`;
  }
  const eye = (cx, flip) => `<g transform="translate(${cx} 450) scale(${flip} 1)">
    <path d="M-230 20C-150 -110 150 -120 230 -30C150 90 -150 110 -230 20Z" fill="#1a0a00"/>
    <path d="M-210 16C-140 -96 140 -104 210 -26C140 76 -140 94 -210 16Z" fill="url(#iris)"/>
    <ellipse cx="0" cy="-4" rx="26" ry="92" fill="#0a0400" class="an-pupil"/>
    <ellipse cx="-70" cy="-50" rx="36" ry="18" fill="#fff" opacity=".85"/>
    <path d="M-240 10C-150 -130 150 -140 240 -40" stroke="#000" stroke-width="30" fill="none" stroke-linecap="round"/>
    <path d="M-260 -80L260 -150" stroke="#0a0806" stroke-width="44" stroke-linecap="round"/>
  </g>`;
  return svg(`<defs><radialGradient id="iris"><stop offset="0" stop-color="#fff2a0"/><stop offset=".5" stop-color="#ffc020"/><stop offset=".85" stop-color="#c86a00"/><stop offset="1" stop-color="#5a2a00"/></radialGradient></defs>
    <rect width="1600" height="900" fill="#2a201c"/>${fur}${eye(450, 1)}${eye(1150, -1)}
    <path d="M760 300L840 300L860 900H740Z" fill="#1a1210"/>`);
}

/** 달리는 사람 (옆모습 두 동작) */
const RUN = [
  'M40 20C40 10 52 8 55 16C58 24 50 30 44 28C38 44 36 58 38 74L52 92L46 124L40 122L42 96L28 82L16 104L6 100L20 72L26 50L12 60L6 54L28 36Z',
  'M40 20C40 10 52 8 55 16C58 24 50 30 44 28C40 44 40 58 42 74L30 94L36 124L28 124L22 96L34 74L28 52L14 44L18 38L32 44Z',
];
function runner(x, y, s, tool, i) {
  const toolSvg = tool === 'torch'
    ? '<path d="M44 40L70 -6" stroke="#2a1a0a" stroke-width="4"/><circle cx="72" cy="-18" r="26" fill="#ffa040" opacity=".35"/><path class="an-flame" d="M70 -6C60 -18 66 -32 72 -44C76 -32 88 -22 76 -6Z" fill="#ffb040"/>'
    : '<path d="M20 60L90 -10" stroke="#3a2412" stroke-width="3.5"/><path d="M84 -18L96 -6M88 -22L100 -10M92 -26L104 -14" stroke="#8a8a90" stroke-width="3"/>';
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="an-runner" style="animation-delay:${(i % 3) * 0.07}s">
    ${toolSvg}
    <path class="an-run0" d="${RUN[0]}" fill="#06070c"/><path class="an-run1" d="${RUN[1]}" fill="#06070c"/>
  </g></g>`;
}

/** 서 있는 사람 실루엣 (환호 · 조문) */
const STAND = 'M-6 -79C-13 -78 -17 -74 -18 -66L-21 -38C-21 -35 -17 -35 -16 -37L-14 -56L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -56L16 -37C17 -35 21 -35 21 -38L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z';
const CHEER = 'M-6 -79C-13 -78 -17 -74 -18 -66L-26 -100C-27 -103 -22 -104 -21 -101L-14 -68L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -68L21 -101C22 -104 27 -103 26 -100L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z';
const POINT = 'M-6 -79C-13 -78 -17 -74 -18 -66L-21 -38C-21 -35 -17 -35 -16 -37L-14 -56L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -60L46 -66L46 -61L17 -56L16 -37L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z';
const person = (x, y, s, d, fill = '#06070c', cls = '') => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}"><path d="${d}" fill="${fill}"/></g></g>`;

/* ═════════════ 효과 ═════════════ */

/** 집중선 (가운데로 모이는 만화 선) */
function focusLines(color = '#fff', count = 90, inner = 260) {
  const r = rnd(9);
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + r() * 0.05;
    const w = 0.006 + r() * 0.012;
    const r0 = inner + r() * 140;
    s += `<path d="M${f(800 + Math.cos(a - w) * 1400)} ${f(450 + Math.sin(a - w) * 1400)}L${f(800 + Math.cos(a) * r0)} ${f(450 + Math.sin(a) * r0)}L${f(800 + Math.cos(a + w) * 1400)} ${f(450 + Math.sin(a + w) * 1400)}Z"/>`;
  }
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" class="an-focus"><g fill="${color}">${s}</g></svg>`;
}
/** 가로 속도선 */
function speedLines(color = '#fff', count = 40) {
  const r = rnd(12);
  let s = '';
  for (let i = 0; i < count; i++) s += `<rect x="${f(r() * 1600)}" y="${f(r() * 900)}" width="${f(200 + r() * 600)}" height="${f(1 + r() * 4)}" opacity="${f(0.3 + r() * 0.6)}"/>`;
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="none" class="an-speed"><g fill="${color}">${s}</g></svg>`;
}
const sfxText = (text, cls = '', style = '') => `<div class="an-sfx ${cls}" style="${style}">${text}</div>`;
const portrait = (role, cls = '') => `<div class="an-portrait ${cls}"><img src="assets/role/${role}.svg" alt=""></div>`;

/* ═════════════ 연출 도구 ═════════════ */

function director(stage, sound) {
  const timers = [];
  const at = (sec, fn) => timers.push(setTimeout(fn, sec * 1000));
  let current = null;
  const cut = (html, cls = '') => {
    const el = document.createElement('div');
    el.className = `an-shot ${cls}`;
    el.innerHTML = html;
    stage.appendChild(el);
    if (current) current.remove();
    current = el;
    return el;
  };
  const add = (html) => { if (current) current.insertAdjacentHTML('beforeend', html); };
  const q = (sel) => (current ? [...current.querySelectorAll(sel)] : []);
  const anim = (sel, frames, opts) => q(sel).forEach((el, i) => el.animate(frames, { fill: 'forwards', easing: 'ease-in-out', ...opts, delay: (opts.delay || 0) + (opts.stagger || 0) * i }));
  const shake = (power = 14, dur = 500) => stage.animate(
    Array.from({ length: 12 }, (_, i) => ({ transform: i === 11 ? 'none' : `translate(${(Math.random() - 0.5) * power * 2}px, ${(Math.random() - 0.5) * power * 2}px)` })),
    { duration: dur, easing: 'linear' },
  );
  const flash = (color = '#fff', dur = 260) => {
    const el = document.createElement('div');
    el.className = 'an-flash';
    el.style.background = color;
    stage.appendChild(el);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, fill: 'forwards' }).onfinish = () => el.remove();
  };
  /** 흑백 반전 임팩트 컷 */
  const impact = (dur = 240) => {
    stage.classList.add('an-impact');
    timers.push(setTimeout(() => stage.classList.remove('an-impact'), dur));
  };
  return { at, cut, add, anim, shake, flash, impact, sound, stop: () => timers.forEach(clearTimeout) };
}

/* ═════════════ 장면들 ═════════════ */

const SCENES = {
  /* 늑대인간 승리 */
  wolf(D) {
    // 1. 잠든 마을, 불이 하나씩 꺼진다
    D.at(0, () => {
      D.sound('start:wolf');
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="s1" x2="0" y2="1"><stop offset="0" stop-color="#030712"/><stop offset=".7" stop-color="#0e2458"/><stop offset="1" stop-color="#27508e"/></linearGradient>${MOON_DEFS}</defs><rect width="1600" height="900" fill="url(#s1)"/>${stars(160, 3)}${moonSvg(1150, 260, 150)}`), 'pan-slow')}
        ${layer(svg(trees(40, 700, 120, 120, '#0c1830', 5)), 'pan-mid')}
        ${layer(svg(`<path d="M0 900V720C400 690 1200 700 1600 720V900Z" fill="#070a14"/>${houses(760, true)}`), 'pan-mid2')}
        ${layer(svg(trees(8, 940, 360, 200, '#020308', 8)), 'pan-fast')}
        <div class="an-fog"></div>`);
      D.anim('.pan-slow', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-2%) scale(1.1)' }], { duration: 3600 });
      D.anim('.pan-mid', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-5%) scale(1.1)' }], { duration: 3600 });
      D.anim('.pan-mid2', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-8%) scale(1.1)' }], { duration: 3600 });
      D.anim('.pan-fast', [{ transform: 'translateX(0) scale(1.15)' }, { transform: 'translateX(-18%) scale(1.15)' }], { duration: 3600 });
      D.anim('.win', [{ fill: '#ffc868' }, { fill: '#161c2c' }], { duration: 120, delay: 800, stagger: 120 });
    });
    // 2. 겁에 질린 마을 사람 클로즈업
    D.at(3.4, () => {
      D.sound('whoosh');
      D.cut(`<div class="an-bg" style="background:#0a1020"></div>${focusLines('#3a4a70')}${portrait('villager')}${sfxText('...!?', 'small', 'left:64%;top:16%')}`);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1.05)' }, { transform: 'translate(-50%,-50%) scale(1.35)' }], { duration: 1700, easing: 'ease-out' });
      D.anim('.an-focus', [{ transform: 'scale(1.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300 });
      D.anim('.an-sfx', [{ transform: 'scale(0) rotate(-20deg)' }, { transform: 'scale(1.2) rotate(8deg)' }, { transform: 'scale(1) rotate(6deg)' }], { duration: 350, delay: 300 });
      D.shake(6, 1600);
    });
    // 3. 절벽 위로 늑대인간이 솟아오른다
    D.at(5.2, () => {
      D.sound('whoosh');
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="s3" x2="0" y2="1"><stop offset="0" stop-color="#050a1e"/><stop offset="1" stop-color="#1c3c7c"/></linearGradient>${MOON_DEFS}</defs><rect width="1600" height="900" fill="url(#s3)"/>${stars(120, 7)}${moonSvg(800, 380, 330)}`), 'moon-bg')}
        ${focusLines('#dfe8ff', 70, 360)}
        ${layer(svg('<path d="M420 900L520 700C560 660 640 640 700 650C760 640 860 636 920 660C1000 680 1080 720 1160 900Z" fill="#04050a"/><path d="M700 650C760 640 860 636 920 660" stroke="#dfe8ff" stroke-width="4" fill="none" opacity=".7"/>'))}
        <div class="an-wolf-wrap">${wolfSvg('stand')}</div>`);
      D.anim('.moon-bg', [{ transform: 'scale(1.25)' }, { transform: 'scale(1.05)' }], { duration: 3200, easing: 'ease-out' });
      D.anim('.an-wolf-wrap', [{ transform: 'translate(-50%, 70%) scale(.9)' }, { transform: 'translate(-50%, 0) scale(1)', offset: 0.7 }, { transform: 'translate(-50%, -2%) scale(1.02)' }], { duration: 1500, easing: 'cubic-bezier(.2,.8,.3,1.2)' });
      D.anim('.an-focus', [{ opacity: 0 }, { opacity: 0 }, { opacity: 0.3 }], { duration: 1600 });
      D.anim('.an-eyes', [{ opacity: 0 }, { opacity: 1 }], { duration: 150, delay: 1300 });
    });
    // 4. 고개를 치켜들고 운다
    D.at(6.9, () => {
      const w = document.querySelector('.an-wolf-wrap');
      if (w) w.innerHTML = wolfSvg('howl');
      D.sound('howl');
      D.flash('#dfe8ff', 200);
      D.shake(18, 1400);
      D.add(sfxText('아우우우우—!!', 'howl', 'left:6%;top:12%'));
      D.anim('.an-sfx', [{ transform: 'scale(.3) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(-6deg)', opacity: 1 }, { transform: 'scale(1) rotate(-6deg)', opacity: 1 }], { duration: 400 });
      D.anim('.an-focus', [{ opacity: 0.3, transform: 'scale(1)' }, { opacity: 0.85, transform: 'scale(1.06)' }, { opacity: 0.45, transform: 'scale(1)' }], { duration: 400, iterations: 5 });
    });
    // 5. 눈 초근접 → 임팩트
    D.at(9.1, () => {
      D.cut(`<div class="an-zoomer">${wolfEyes()}</div>`);
      D.anim('.an-zoomer', [{ transform: 'scale(1.7)' }, { transform: 'scale(1.1)' }], { duration: 900, easing: 'cubic-bezier(.1,.9,.2,1)' });
      D.anim('.an-pupil', [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.3)' }], { duration: 300, delay: 500, easing: 'ease-in' });
    });
    D.at(9.85, () => { D.impact(260); D.sound('impact'); D.shake(26, 400); });
    // 6. 할퀴기
    D.at(10.3, () => {
      D.sound('slash');
      D.cut(`<div class="an-bg" style="background:radial-gradient(circle at 50% 50%, #5a0808, #0a0000)"></div>${CLAW}${sfxText('스악!!', 'slash', 'right:8%;bottom:16%')}`);
      D.flash('#fff', 180);
      D.anim('.cl', [{ clipPath: 'inset(0 100% 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 260, stagger: 70, easing: 'cubic-bezier(.2,.9,.3,1)' });
      D.anim('.an-sfx', [{ transform: 'scale(2) rotate(10deg)', opacity: 0 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1 }], { duration: 250, delay: 300 });
      D.shake(30, 600);
    });
    // 7. 핏빛 달 아래 제목
    D.at(11.8, () => {
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="s7" x2="0" y2="1"><stop offset="0" stop-color="#1a0000"/><stop offset=".6" stop-color="#5a0a0a"/><stop offset="1" stop-color="#8a1a10"/></linearGradient>
          <radialGradient id="rm"><stop offset="0" stop-color="#ffd0a0"/><stop offset=".7" stop-color="#e85a30"/><stop offset="1" stop-color="#a02010"/></radialGradient>
          <radialGradient id="rh"><stop offset=".4" stop-color="#ff6040" stop-opacity=".5"/><stop offset="1" stop-color="#ff2000" stop-opacity="0"/></radialGradient></defs>
          <rect width="1600" height="900" fill="url(#s7)"/><circle cx="800" cy="330" r="500" fill="url(#rh)"/><circle cx="800" cy="330" r="240" fill="url(#rm)"/>
          ${trees(36, 760, 140, 110, '#1a0404', 11)}${houses(820, false).replace(/#070a14/g, '#0a0000')}<path d="M0 900V810C500 790 1100 790 1600 810V900Z" fill="#0a0000"/>`), 'title-bg')}
        <div class="an-wolf-wrap small">${wolfSvg('howl', { rim: '#ffb090' })}</div>`, 'with-title');
      D.anim('.title-bg', [{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 3200, easing: 'ease-out' });
      D.flash('#ff2000', 500);
    });
  },

  /* 마을 승리 */
  village(D) {
    // 1. 횃불 행렬이 숲을 가른다
    D.at(0, () => {
      D.sound('start:village');
      let run = '';
      for (let i = 0; i < 8; i++) run += runner(40 + i * 150 + (i % 2) * 40, 590 + (i % 3) * 30, 2.2 + (i % 3) * 0.2, i % 2 ? 'torch' : 'fork', i);
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="v1" x2="0" y2="1"><stop offset="0" stop-color="#050a1e"/><stop offset="1" stop-color="#2a3a6a"/></linearGradient></defs><rect width="1600" height="900" fill="url(#v1)"/>${stars(100, 2)}`))}
        ${layer(svg(trees(34, 720, 160, 120, '#0c1428', 21)), 'pan-mid')}
        ${layer(svg(`<path d="M0 900V760H1600V900Z" fill="#05060a"/><g class="an-march">${run}</g>`))}
        ${layer(svg(trees(7, 960, 380, 160, '#020308', 22)), 'pan-fast')}
        ${speedLines('#ffd8a0', 30)}`);
      D.anim('.pan-mid', [{ transform: 'translateX(0) scale(1.1)' }, { transform: 'translateX(-8%) scale(1.1)' }], { duration: 3200, easing: 'linear' });
      D.anim('.pan-fast', [{ transform: 'translateX(10%) scale(1.2)' }, { transform: 'translateX(-40%) scale(1.2)' }], { duration: 3200, easing: 'linear' });
      D.anim('.an-march', [{ transform: 'translateX(-500px)' }, { transform: 'translateX(300px)' }], { duration: 3200, easing: 'linear' });
      D.anim('.an-speed', [{ transform: 'translateX(40%)' }, { transform: 'translateX(-60%)' }], { duration: 600, iterations: 6, easing: 'linear' });
    });
    // 2. 예언자: "저 녀석이다!"
    D.at(3.2, () => {
      D.sound('whoosh');
      D.cut(`<div class="an-bg" style="background:radial-gradient(circle,#3a4aa0,#0a0a2a)"></div>${focusLines('#b8e0ff')}${portrait('seer', 'glow')}${sfxText('저 녀석이다!', 'shout', 'left:5%;top:10%')}`);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1.3)' }, { transform: 'translate(-50%,-50%) scale(1.1)' }], { duration: 1600, easing: 'ease-out' });
      D.anim('.an-sfx', [{ transform: 'scale(0) rotate(-10deg)' }, { transform: 'scale(1.15) rotate(-6deg)' }, { transform: 'scale(1) rotate(-6deg)' }], { duration: 350, delay: 200 });
      D.anim('.an-focus', [{ transform: 'rotate(0deg)' }, { transform: 'rotate(2deg)' }], { duration: 120, iterations: 14, direction: 'alternate' });
    });
    // 3. 늑대인간 당황
    D.at(5, () => {
      D.cut(`<div class="an-bg" style="background:#1a0a0a"></div>${focusLines('#ff9080', 100, 300)}${portrait('werewolf')}${sfxText('!!', 'small', 'right:16%;top:14%')}`);
      D.shake(12, 900);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1.15)' }, { transform: 'translate(-53%,-50%) scale(1.15)' }], { duration: 60, iterations: 14, direction: 'alternate' });
    });
    // 4. 쇠스랑 일격 → 늑대인간이 날아간다
    D.at(6.4, () => {
      D.sound('impact');
      D.impact(200);
      D.cut(`
        <div class="an-bg" style="background:radial-gradient(circle at 55% 45%, #fff8e0, #ffb050 40%, #6a2010)"></div>
        ${focusLines('#fff', 110, 200)}
        <div class="an-wolf-wrap fly">${wolfSvg('stand', { rim: '#fff4d0', eyes: false })}</div>
        ${sfxText('쾅!!', 'boom', 'left:30%;top:22%')}`);
      D.shake(34, 700);
      D.anim('.an-wolf-wrap', [{ transform: 'translate(-50%, 0) rotate(0) scale(1.1)' }, { transform: 'translate(160%, -90%) rotate(300deg) scale(.08)' }], { duration: 1300, easing: 'cubic-bezier(.3,.1,.6,1)' });
      D.anim('.an-sfx', [{ transform: 'scale(3)', opacity: 0 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1 }], { duration: 220 });
    });
    D.at(7.7, () => D.add('<div class="an-twinkle"></div>'));
    // 5. 새벽이 밝아 오고 환호
    D.at(8.6, () => {
      D.sound('cheer');
      let crowd = '';
      for (let i = 0; i < 11; i++) crowd += person(90 + i * 142, 900, 3.3 + (i % 3) * 0.3, i % 2 ? CHEER : STAND, '#12080a', 'an-cheer');
      D.cut(`
        ${layer(svg(`<defs><linearGradient id="d1" x2="0" y2="1"><stop offset="0" stop-color="#3a5aa0"/><stop offset=".5" stop-color="#f09860"/><stop offset=".8" stop-color="#ffd890"/></linearGradient>
          <radialGradient id="sun"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffe080"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient></defs>
          <rect width="1600" height="900" fill="url(#d1)"/><g class="an-sun"><circle cx="800" cy="640" r="420" fill="url(#sun)"/>
          ${Array.from({ length: 16 }, (_, i) => `<path d="M800 640L${f(800 + Math.cos((i / 16) * Math.PI * 2) * 1400)} ${f(640 + Math.sin((i / 16) * Math.PI * 2) * 1400)}L${f(800 + Math.cos((i / 16 + 0.02) * Math.PI * 2) * 1400)} ${f(640 + Math.sin((i / 16 + 0.02) * Math.PI * 2) * 1400)}Z" fill="#fff4c0" opacity=".18"/>`).join('')}</g>`), 'dawn')}
        ${layer(svg(`${trees(30, 700, 130, 90, '#3a2230', 31)}<path d="M0 900V690C300 660 600 680 800 700C1000 680 1300 660 1600 690V900Z" fill="#2a1420"/>${houses(760, false, 7).replace(/#070a14/g, '#1a0c14')}`))}
        ${layer(svg(crowd))}`, 'with-title');
      D.anim('.an-sun', [{ transform: 'translateY(300px)' }, { transform: 'translateY(0)' }], { duration: 3000, easing: 'ease-out' });
      D.anim('.an-cheer', [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }], { duration: 300, iterations: 20, direction: 'alternate', stagger: 60 });
      D.anim('.dawn', [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 5000 });
    });
  },

  /* 무두장이 승리 */
  tanner(D) {
    const rain = '<div class="an-rain"></div>';
    // 1. 빗속, 무두장이의 섬뜩한 미소
    D.at(0, () => {
      D.sound('start:tanner');
      D.cut(`<div class="an-bg" style="background:#2a303a"></div>${portrait('tanner', 'grey')}${rain}${sfxText('후후…', 'small', 'left:62%;top:18%')}`);
      D.anim('.an-portrait', [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.25)' }], { duration: 2800, easing: 'ease-in' });
    });
    // 2. 손가락질하는 마을 사람들
    D.at(2.8, () => {
      D.sound('whoosh');
      let crowd = '';
      for (let i = 0; i < 7; i++) crowd += person(160 + i * 210, 900, 4.2, POINT, '#10141a', 'an-point');
      D.cut(`<div class="an-bg" style="background:linear-gradient(#4a5260,#2a303a)"></div>${focusLines('#8a94a8', 60, 360)}${layer(svg(crowd))}${sfxText('저놈을 처형하라!', 'shout', 'left:24%;top:10%')}${rain}`);
      D.anim('.an-point', [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }], { duration: 200, iterations: 12, direction: 'alternate', stagger: 40 });
      D.anim('.an-sfx', [{ transform: 'scale(0)' }, { transform: 'scale(1) rotate(-4deg)' }], { duration: 300 });
      D.shake(8, 900);
    });
    // 3. 번개
    D.at(4.6, () => {
      D.sound('thunder');
      D.cut(`${layer(svg(`<rect width="1600" height="900" fill="#1a1e24"/>${trees(30, 760, 160, 100, '#08090c', 41)}<path d="M0 900V760H1600V900Z" fill="#050608"/>
        <path d="M700 0L660 260L740 280L620 560L700 580L560 900" stroke="#fff" stroke-width="10" fill="none"/>
        <g fill="#3a404a"><path d="M300 900V720Q360 660 420 720V900Z"/><path d="M1100 900V700Q1170 630 1240 700V900Z"/></g><path d="M780 900V740H800V700H840V740H860V760H840V900Z" fill="#4a3420"/>`))}${rain}`);
      D.flash('#fff', 180);
      D.shake(20, 600);
    });
    D.at(4.95, () => D.flash('#fff', 300));
    // 4. 무덤에서 유령이 되어 웃으며 떠오른다
    D.at(6.2, () => {
      D.sound('ghost');
      D.cut(`
        ${layer(svg(`<defs><radialGradient id="gg"><stop offset="0" stop-color="#eef4ff" stop-opacity=".6"/><stop offset="1" stop-color="#8aa0c8" stop-opacity="0"/></radialGradient></defs>
          <rect width="1600" height="900" fill="#262c36"/>${trees(30, 760, 160, 100, '#141820', 43)}<path d="M0 900V770H1600V900Z" fill="#0c0e12"/>
          <path d="M700 900V780Q800 740 900 780V900Z" fill="#3a2a1a"/><circle cx="800" cy="480" r="380" fill="url(#gg)"/>`))}
        <div class="an-ghost"><div class="an-ghost-body"><img src="assets/role/tanner.svg" alt=""></div></div>
        ${sfxText('드디어 자유다~!', 'shout ghosty', 'right:5%;top:10%')}
        ${rain}`, 'with-title');
      D.anim('.an-ghost', [{ transform: 'translate(-50%, 60%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, 0) scale(1)', opacity: 0.92 }], { duration: 2200, easing: 'ease-out' });
      D.anim('.an-ghost-body', [{ transform: 'translateY(0) rotate(-3deg)' }, { transform: 'translateY(-18px) rotate(3deg)' }], { duration: 900, iterations: 10, direction: 'alternate' });
      D.anim('.an-sfx', [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1) rotate(4deg)' }], { duration: 500, delay: 1400 });
    });
  },

  /* 모두 패배 */
  none(D) {
    D.at(0, () => {
      D.sound('start:none');
      let crows = '';
      const r = rnd(5);
      for (let i = 0; i < 12; i++) crows += `<path transform="translate(${f(r() * 300)} ${f(150 + r() * 250)}) scale(${f(3 + r() * 3)})" d="M0 0C-3 -3 -8 -3 -12 0C-9 0 -8 2 -8 3C-6 1 -3 2 -2 3L0 1L2 3C3 2 6 1 8 3C8 2 9 0 12 0C8 -3 3 -3 0 0Z" fill="#000"/>`;
      D.cut(`
        ${layer(svg(`<rect width="1600" height="900" fill="#1a2030"/>${stars(40, 9, 300)}${trees(36, 720, 150, 110, '#10141e', 51)}<path d="M0 900V740H1600V900Z" fill="#080a10"/>${houses(790, false)}`), 'pan-slow')}
        ${layer(svg(`<g class="an-crows">${crows}</g>`))}
        <div class="an-fog thick"></div>`, 'with-title');
      D.anim('.pan-slow', [{ transform: 'scale(1.15) translateX(2%)' }, { transform: 'scale(1.05) translateX(-2%)' }], { duration: 9000 });
      D.anim('.an-crows', [{ transform: 'translateX(-300px)' }, { transform: 'translate(1900px, -200px)' }], { duration: 7000, easing: 'linear' });
    });
  },
};

const TITLES = {
  wolf: ['늑대인간의 승리', 11.8],
  village: ['마을의 승리', 9.2],
  tanner: ['무두장이의 승리', 7.4],
  none: ['아무도 이기지 못했다', 3],
};

/** 초승달처럼 가운데가 두껍고 끝이 뾰족한 할퀸 자국 */
function clawPath(x0, y0, x1, y1, w) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const bend = len * 0.08;
  return `M${x0} ${y0}Q${f(mx + nx * bend)} ${f(my + ny * bend)} ${x1} ${y1}Q${f(mx + nx * (bend + w))} ${f(my + ny * (bend + w))} ${x0} ${y0}Z`;
}
const CLAW = `<svg class="an-claw" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a70"/><stop offset=".5" stop-color="#e01a10"/><stop offset="1" stop-color="#5a0000"/></linearGradient>
  <filter id="cblur"><feGaussianBlur stdDeviation="12"/></filter></defs>
  ${[0, 1, 2, 3].map((i) => `<g class="cl"><path d="${clawPath(360 + i * 200, 20 + i * 30, 960 + i * 180, 880 - i * 20, 80 - Math.abs(i - 1.5) * 14)}" fill="#ff2a10" opacity=".6" filter="url(#cblur)"/><path d="${clawPath(360 + i * 200, 20 + i * 30, 960 + i * 180, 880 - i * 20, 62 - Math.abs(i - 1.5) * 12)}" fill="url(#cg)"/><path d="${clawPath(372 + i * 200, 44 + i * 30, 948 + i * 180, 856 - i * 20, 20)}" fill="#1a0000" opacity=".7"/></g>`).join('')}
</svg>`;

/**
 * 결말 영상을 재생한다. 끝나거나 [건너뛰기]를 누르면 resolve.
 * @param {HTMLElement} host
 * @param {'wolf'|'village'|'tanner'|'none'} kind
 * @param {{sub?:string, sound?:(name:string)=>void}} opts
 */
export function playCutscene(host, kind, { sub = '', sound = () => {} } = {}) {
  const k = SCENES[kind] ? kind : 'none';
  const [title, titleAt] = TITLES[k];
  return new Promise((resolve) => {
    host.innerHTML = `<div class="an-stage"></div>
      <div class="cs-bars"></div>
      <div class="an-title" style="animation-delay:${titleAt + 0.4}s"><span>${title}</span>${sub ? `<small>${sub}</small>` : ''}</div>
      <button class="btn btn-sm cs-skip">건너뛰기 ▸</button>`;
    host.hidden = false;
    const D = director(host.querySelector('.an-stage'), sound);
    SCENES[k](D);
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      D.stop();
      host.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      host.hidden = true;
      host.innerHTML = '';
      resolve();
    };
    host.querySelector('.cs-skip').addEventListener('click', end);
    setTimeout(end, LENGTH[k] * 1000 + 500);
  });
}
