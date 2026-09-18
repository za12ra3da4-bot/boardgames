// 보드게임 사이트 공용: 2D 애니메이션 결말 영상 도구 (배경 조각 · 집중선 · 컷 연출 · 영상 틀)
import { clock } from './rig2d.js';

/* ═════════════ 그림 조각 ═════════════ */

export const rnd = (seed) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
export const f = (n) => Math.round(n * 10) / 10;

export function pine(x, y, h, fill) {
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
export const trees = (n, y, hmin, hvar, fill, seed, x0 = -100, x1 = 1700) => {
  const r = rnd(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += pine(x0 + ((x1 - x0) * (i + r() * 0.8)) / n, y + r() * 20, hmin + r() * hvar, fill);
  return s;
};
export const svg = (body, vb = '0 0 1600 900') => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
export const layer = (html, cls = '') => `<div class="an-layer ${cls}">${html}</div>`;

export function houses(y, lit, seed = 3) {
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

export function stars(n, seed, h = 600) {
  const r = rnd(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f(r() * 1600)}" cy="${f(r() * h)}" r="${f(0.6 + r() * 1.6)}" fill="#fff" opacity="${f(0.3 + r() * 0.7)}"/>`;
  return s;
}

export const MOON_DEFS = `<radialGradient id="mG"><stop offset="0" stop-color="#fffdf0"/><stop offset=".75" stop-color="#f6e8b4"/><stop offset="1" stop-color="#d8bc70"/></radialGradient>
  <radialGradient id="mH"><stop offset=".45" stop-color="#fff4c8" stop-opacity=".55"/><stop offset="1" stop-color="#8aa8e8" stop-opacity="0"/></radialGradient>`;
export const moonSvg = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="url(#mH)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#mG)"/>
  <g fill="#b8a070" opacity=".3"><ellipse cx="${cx - r * 0.3}" cy="${cy - r * 0.2}" rx="${r * 0.22}" ry="${r * 0.15}"/><ellipse cx="${cx + r * 0.28}" cy="${cy + r * 0.25}" rx="${r * 0.17}" ry="${r * 0.12}"/><ellipse cx="${cx + r * 0.1}" cy="${cy - r * 0.5}" rx="${r * 0.1}" ry="${r * 0.07}"/></g>`;

/** 달리는 사람 (옆모습 두 동작) */
const RUN = [
  'M40 20C40 10 52 8 55 16C58 24 50 30 44 28C38 44 36 58 38 74L52 92L46 124L40 122L42 96L28 82L16 104L6 100L20 72L26 50L12 60L6 54L28 36Z',
  'M40 20C40 10 52 8 55 16C58 24 50 30 44 28C40 44 40 58 42 74L30 94L36 124L28 124L22 96L34 74L28 52L14 44L18 38L32 44Z',
];
export function runner(x, y, s, tool, i) {
  const toolSvg = tool === 'torch'
    ? '<path d="M44 40L70 -6" stroke="#2a1a0a" stroke-width="4"/><circle cx="72" cy="-18" r="26" fill="#ffa040" opacity=".35"/><path class="an-flame" d="M70 -6C60 -18 66 -32 72 -44C76 -32 88 -22 76 -6Z" fill="#ffb040"/>'
    : '<path d="M20 60L90 -10" stroke="#3a2412" stroke-width="3.5"/><path d="M84 -18L96 -6M88 -22L100 -10M92 -26L104 -14" stroke="#8a8a90" stroke-width="3"/>';
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="an-runner" style="animation-delay:${(i % 3) * 0.07}s">
    ${toolSvg}
    <path class="an-run0" d="${RUN[0]}" fill="#06070c"/><path class="an-run1" d="${RUN[1]}" fill="#06070c"/>
  </g></g>`;
}

/** 서 있는 사람 실루엣 (환호 · 조문) */
export const STAND = 'M-6 -79C-13 -78 -17 -74 -18 -66L-21 -38C-21 -35 -17 -35 -16 -37L-14 -56L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -56L16 -37C17 -35 21 -35 21 -38L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z';
export const CHEER = 'M-6 -79C-13 -78 -17 -74 -18 -66L-26 -100C-27 -103 -22 -104 -21 -101L-14 -68L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -68L21 -101C22 -104 27 -103 26 -100L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z';
export const POINT = 'M-6 -79C-13 -78 -17 -74 -18 -66L-21 -38C-21 -35 -17 -35 -16 -37L-14 -56L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -60L46 -66L46 -61L17 -56L16 -37L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z';
export const person = (x, y, s, d, fill = '#06070c', cls = '') => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}"><path d="${d}" fill="${fill}"/></g></g>`;

/* ═════════════ 효과 ═════════════ */

/** 집중선 (가운데로 모이는 만화 선) */
export function focusLines(color = '#fff', count = 90, inner = 260) {
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
export function speedLines(color = '#fff', count = 40) {
  const r = rnd(12);
  let s = '';
  for (let i = 0; i < count; i++) s += `<rect x="${f(r() * 1600)}" y="${f(r() * 900)}" width="${f(200 + r() * 600)}" height="${f(1 + r() * 4)}" opacity="${f(0.3 + r() * 0.6)}"/>`;
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="none" class="an-speed"><g fill="${color}">${s}</g></svg>`;
}
// 의성어는 쓰지 않는다. 대사(shout)만 영화 자막처럼 아래에 띄운다.
export const sfxText = (text, cls = '') => (cls.includes('shout') ? `<div class="an-sub">${text}</div>` : '');
export const portrait = (role, cls = '', base = '/wolf/assets/role/') => `<div class="an-portrait ${cls}"><img src="${base}${role}.svg" alt=""></div>`;

/* ═════════════ 연출 도구 ═════════════ */

export function director(stage, sound) {
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
  // 1600×900 좌표계 무대 (인형을 올린다)
  const world = () => {
    const w = document.createElement('div');
    w.className = 'an-world';
    const fit = () => {
      const s = Math.max(stage.clientWidth / 1600, stage.clientHeight / 900);
      w.style.transform = `scale(${s}) translate(-800px, -450px)`;
    };
    fit();
    current.appendChild(w);
    return w;
  };
  // 매 프레임 움직임 (컷이 바뀌면 지운다)
  let ticks = [];
  const tickStop = clock((sec) => { for (const fn of ticks) fn(sec); });
  const tick = (fn) => { const t0 = performance.now() / 1000; ticks.push((s) => fn(performance.now() / 1000 - t0, s)); };
  const cut0 = cut;
  const cut2 = (html, cls) => { ticks = []; return cut0(html, cls); };
  return { at, cut: cut2, add, anim, shake, flash, impact, sound, world, tick, stop: () => { timers.forEach(clearTimeout); tickStop(); } };
}


/**
 * 짧은 애니메이션 영상 틀: 화면 비율 고정, 필름 결, 비네트, 레터박스, 제목, 건너뛰기.
 * @param {HTMLElement} host
 * @param {{scene:(D)=>void, length:number, title:string, titleAt:number, sub?:string, sound?:Function}} o
 */
export function playFilm(host, { scene, length, title, titleAt, sub = '', sound = () => {} }) {
  return new Promise((resolve) => {
    host.innerHTML = `<div class="an-stage"></div>
      <div class="an-vignette"></div><div class="an-grain"></div>
      <div class="cs-bars"></div>
      <div class="an-title"><span>${title}</span>${sub ? `<small>${sub}</small>` : ''}</div>
      <button class="an-skip">건너뛰기 ▸</button>`;
    host.hidden = false;
    host.classList.add('an-host');
    const D = director(host.querySelector('.an-stage'), sound);
    scene(D);
    D.at(titleAt + 0.4, () => host.querySelector('.an-title').animate(
      [{ opacity: 0, transform: 'scale(1.6)', letterSpacing: '.3em' }, { opacity: 1, transform: 'scale(1)', letterSpacing: '0em' }],
      { duration: 900, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'forwards' },
    ));
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      D.stop();
      host.getAnimations({ subtree: true }).forEach((x) => x.cancel());
      host.hidden = true;
      host.innerHTML = '';
      resolve();
    };
    host.querySelector('.an-skip').addEventListener('click', end);
    setTimeout(end, length * 1000 + 500);
  });
}
