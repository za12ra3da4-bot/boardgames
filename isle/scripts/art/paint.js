'use strict';
// 손으로 칠한 그림 느낌을 만드는 도구들: 붓 필터, 울퉁불퉁한 모양, 흙·풀 결
const f = (n) => Number(n.toFixed(1));

const svg = (w, h, body, { defs = '', vb } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb || `0 0 ${w} ${h}`}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

const stops = (arr) => arr.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lin = (id, arr, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(arr)}</linearGradient>`;
const rad = (id, arr, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(arr)}</radialGradient>`;

/** 결과가 매번 같은 난수 */
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * 붓으로 칠한 느낌: 전체가 살짝 휘고, 선이 떨리고, 색이 번지고, 윤곽에 먹선이 들어간다.
 * 필터를 거는 묶음 안에는 불투명한 바탕이 있어야 한다.
 */
function paintFilter(id, { seed = 3, bend = 5, wobble = 1.8, ink = 2.4, soft = 0.9 } = {}) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="${seed}" result="bn"/>
    <feDisplacementMap in="SourceGraphic" in2="bn" scale="${bend}" xChannelSelector="R" yChannelSelector="G" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="${seed + 3}" result="jn"/>
    <feDisplacementMap in="b" in2="jn" scale="${wobble}" xChannelSelector="R" yChannelSelector="G" result="c"/>
    <feGaussianBlur in="c" stdDeviation="${soft}" result="soft"/>
    <feColorMatrix in="soft" type="saturate" values="0.9" result="wc"/>
    <feColorMatrix in="c" type="matrix" values=".3 .59 .11 0 0  .3 .59 .11 0 0  .3 .59 .11 0 0  0 0 0 1 0" result="g"/>
    <feConvolveMatrix in="g" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e"/>
    <feColorMatrix in="e" type="matrix" values="0 0 0 0 .16  0 0 0 0 .09  0 0 0 0 .04  ${ink} 0 0 0 -.12" result="lines"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.95 0.22" numOctaves="2" seed="${seed + 9}" result="br"/>
    <feColorMatrix in="br" type="matrix" values="0 0 0 0 .22  0 0 0 0 .13  0 0 0 0 .05  0 0 0 .55 -.2" result="tex"/>
    <feComposite in="tex" in2="SourceGraphic" operator="in" result="tex2"/>
    <feMerge><feMergeNode in="wc"/><feMergeNode in="tex2"/><feMergeNode in="lines"/></feMerge>
  </filter>`;
}

/** 종이 결 (덮어 씌우는 용도) */
const paperGrain = (id, seed = 5) => `<filter id="${id}" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="${seed}"/>
  <feColorMatrix values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .6 -.22"/>
</filter>`;

const blur = (id, s) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;

/** 점들을 매끈한 곡선으로 잇는다 (닫힌 모양) */
function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/** 점들을 매끈한 곡선으로 잇는다 (열린 선) */
function smoothOpen(pts) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** 울퉁불퉁한 덩어리 (나뭇잎 뭉치, 구름, 바위…) */
function blob(cx, cy, rx, ry, r, { n = 9, jag = 0.18 } = {}) {
  const pts = [];
  const off = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * jag;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts);
}

/** 가로로 넘실대는 언덕 윤곽 (아래는 bottom 까지 채움) */
function ridge(x0, x1, y, amp, r, { steps = 7, bottom = 400 } = {}) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    pts.push([x0 + ((x1 - x0) * i) / steps, y + (r() - 0.5) * 2 * amp]);
  }
  return `${smoothOpen(pts)}L${x1} ${bottom}L${x0} ${bottom}Z`;
}

/** 가는 붓 획 여러 개 (풀, 결, 파도) */
function strokes(r, n, box, { len = 8, ang = -80, jitter = 25, color = '#000', w = 1.2, op = 0.4 } = {}) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]);
    const y = box[1] + r() * (box[3] - box[1]);
    const a = ((ang + (r() - 0.5) * jitter) * Math.PI) / 180;
    const l = len * (0.6 + r() * 0.8);
    const bx = x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 2;
    const by = y + Math.sin(a) * l * 0.5;
    d += `M${f(x)} ${f(y)}Q${f(bx)} ${f(by)} ${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}`;
  }
  return `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none" opacity="${op}"/>`;
}

/** 색을 섞는다 */
function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

module.exports = { f, svg, lin, rad, rng, paintFilter, paperGrain, blur, smoothClosed, smoothOpen, blob, ridge, strokes, mix, pick };
