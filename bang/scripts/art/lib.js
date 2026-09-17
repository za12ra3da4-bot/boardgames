'use strict';
// SVG 그림 생성용 공통 도구

const svg = (w, h, body, { defs = '', vb } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb || `0 0 ${w} ${h}`}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

const stops = (arr) => arr.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lin = (id, arr, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(arr)}</linearGradient>`;
const rad = (id, arr, cx = 0.5, cy = 0.5, r = 0.5, extra = '') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${extra}>${stops(arr)}</radialGradient>`;

/** 필름 그레인: R 채널 밝기에 따라 검은 점을 뿌린다 */
const grainFilter = (id, freq = 0.9) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.62"/></filter>`;
const blur = (id, s) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
const drop = (id, dy = 4, s = 4, op = 0.5) =>
  `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${s}" flood-color="#000" flood-opacity="${op}"/></filter>`;

/** 결과가 매번 같은 난수 */
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const f = (n) => Number(n.toFixed(1));

/** 빗금 한 칸 (필터 안에서 바둑판처럼 이어 붙인다) */
const hatchTile = (d, w = 0.9) => `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7"><path d="${d}" stroke="#3e2210" stroke-width="${w}" stroke-linecap="square" fill="none"/></svg>`,
)}`;

/**
 * 펜 스케치 필터: 그림을 누런 종이 위 세피아 펜 그림으로 바꾼다.
 * 밝기에 따라 빗금(한 겹 → 두 겹 → 촘촘히)을 치고, 윤곽은 떨리는 펜 선으로 뽑는다.
 * 필터를 거는 묶음 안에는 반드시 불투명한 바탕이 있어야 한다.
 */
function sketchFilter(id, { wobble = 2.2, bend = 6, ink = 3.2, seed = 3, tile = 8 } = {}) {
  const t1 = hatchTile('M-1 9L9 -1M-1 1L1 -1M7 9L9 7', 1);
  const t2 = hatchTile('M-1 -1L9 9M-1 7L1 9M7 -1L9 1', 1);
  const t3 = hatchTile('M0 2.2C2 1.6 5 2.8 8 2M0 6C3 5.4 5 6.6 8 5.8', 0.9);
  const tileAttr = `x="0" y="0" width="${tile}" height="${tile}"`;
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix" values=".3 .59 .11 0 0  .3 .59 .11 0 0  .3 .59 .11 0 0  0 0 0 1 0" result="gray"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="${seed}" result="bendN"/>
    <feDisplacementMap in="gray" in2="bendN" scale="${bend}" xChannelSelector="R" yChannelSelector="G" result="g0"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${seed + 1}" result="jitA"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${seed + 7}" result="jitB"/>
    <feDisplacementMap in="g0" in2="jitA" scale="${wobble}" xChannelSelector="R" yChannelSelector="G" result="g"/>
    <feDisplacementMap in="g0" in2="jitB" scale="${wobble * 1.6}" xChannelSelector="G" yChannelSelector="R" result="gB"/>
    <feColorMatrix in="g" type="matrix" values=".40 0 0 0 .58  .46 0 0 0 .47  .52 0 0 0 .33  0 0 0 1 0" result="wash"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1 0 0 0 1" result="dark"/>
    <feComponentTransfer in="dark" result="m1"><feFuncA type="discrete" tableValues="0 0 1 1 1"/></feComponentTransfer>
    <feComponentTransfer in="dark" result="m2"><feFuncA type="discrete" tableValues="0 0 0 1 1"/></feComponentTransfer>
    <feComponentTransfer in="dark" result="m3"><feFuncA type="discrete" tableValues="0 0 0 0 1"/></feComponentTransfer>
    <feImage href="${t1}" ${tileAttr} result="i1"/><feTile in="i1" result="p1"/>
    <feImage href="${t2}" ${tileAttr} result="i2"/><feTile in="i2" result="p2"/>
    <feImage href="${t3}" ${tileAttr} result="i3"/><feTile in="i3" result="p3"/>
    <feDisplacementMap in="p1" in2="jitB" scale="3" xChannelSelector="R" yChannelSelector="G" result="q1"/>
    <feDisplacementMap in="p2" in2="jitA" scale="3" xChannelSelector="G" yChannelSelector="R" result="q2"/>
    <feComposite in="q1" in2="m1" operator="in" result="k1"/>
    <feComposite in="q2" in2="m2" operator="in" result="k2"/>
    <feComposite in="p3" in2="m3" operator="in" result="k3"/>
    <feConvolveMatrix in="g" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e"/>
    <feColorMatrix in="e" type="matrix" values="0 0 0 0 .22  0 0 0 0 .12  0 0 0 0 .05  ${ink} 0 0 0 -.1" result="lines"/>
    <feConvolveMatrix in="gB" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="eB"/>
    <feColorMatrix in="eB" type="matrix" values="0 0 0 0 .30  0 0 0 0 .18  0 0 0 0 .08  ${ink * 0.55} 0 0 0 -.12" result="lines2"/>
    <feMerge><feMergeNode in="wash"/><feMergeNode in="k1"/><feMergeNode in="k2"/><feMergeNode in="k3"/><feMergeNode in="lines2"/><feMergeNode in="lines"/></feMerge>
  </filter>`;
}

module.exports = { svg, lin, rad, grainFilter, blur, drop, rng, f, stops, sketchFilter };
