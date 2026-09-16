'use strict';
// 방 9곳: 원근감 있는 실내 풍경 일러스트
const { svg, lin, rad, grainFilter, blur, rng, f } = require('./lib');

const BX0 = 70;
const BX1 = 230;
const BY0 = 58;
const BY1 = 186;

/** 바닥 좌표 (u: 왼→오 0~1, v: 안쪽→앞 0~1) → 화면 좌표 */
function fp(u, v) {
  const t = Math.pow(v, 1.3);
  const y = BY1 + (300 - BY1) * t;
  const l = BX0 * (1 - t);
  const r = BX1 + (300 - BX1) * t;
  return [l + (r - l) * u, y];
}
const up = ([x, y], h) => [x, y - h * (0.45 + (0.55 * (y - BY1)) / (300 - BY1))];
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const poly = (pts, fill, extra = '') => `<path d="M${pts.map(P).join('L')}Z" fill="${fill}" ${extra}/>`;

function box(u0, v0, u1, v1, h, top, front, side) {
  const bl = fp(u0, v0);
  const br = fp(u1, v0);
  const fr = fp(u1, v1);
  const fl = fp(u0, v1);
  let s = (u0 + u1) / 2 < 0.5
    ? poly([br, fr, up(fr, h), up(br, h)], side)
    : poly([bl, fl, up(fl, h), up(bl, h)], side);
  s += poly([fl, fr, up(fr, h), up(fl, h)], front);
  s += poly([up(bl, h), up(br, h), up(fr, h), up(fl, h)], top);
  return s;
}

function checker(rows, cols, c1, c2) {
  let s = '';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      s += poly([fp(i / cols, j / rows), fp((i + 1) / cols, j / rows), fp((i + 1) / cols, (j + 1) / rows), fp(i / cols, (j + 1) / rows)], (i + j) % 2 ? c1 : c2);
    }
  }
  return s;
}

function planks(n, line, seed) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i <= n; i++) s += `<path d="M${P(fp(i / n, 0))}L${P(fp(i / n, 1))}" stroke="${line}" stroke-width="1.2"/>`;
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      const v = r();
      s += `<path d="M${P(fp(i / n, v))}L${P(fp((i + 1) / n, v))}" stroke="${line}" stroke-width="1"/>`;
    }
  }
  return s;
}

function shell({ back, floor, left, right, ceil = '#0a0708', trim = '#2a1c12' }) {
  return `
    <rect width="300" height="300" fill="${ceil}"/>
    <path d="M0 0L${BX0} ${BY0}L${BX0} ${BY1}L0 300Z" fill="${left}"/>
    <path d="M300 0L${BX1} ${BY0}L${BX1} ${BY1}L300 300Z" fill="${right}"/>
    <rect x="${BX0}" y="${BY0}" width="${BX1 - BX0}" height="${BY1 - BY0}" fill="${back}"/>
    <path d="M0 300L${BX0} ${BY1}L${BX1} ${BY1}L300 300Z" fill="${floor}"/>
    <path d="M0 0L${BX0} ${BY0}L${BX0} ${BY1}L0 300Z" fill="url(#sideL)"/>
    <path d="M300 0L${BX1} ${BY0}L${BX1} ${BY1}L300 300Z" fill="url(#sideR)"/>
    <path d="M0 0L300 0L${BX1} ${BY0}L${BX0} ${BY0}Z" fill="url(#ceil)"/>`;
}

function trims(color = '#2a1c12', wainscot = null) {
  let s = '';
  if (wainscot) {
    const wy = BY1 - 34;
    s += `<rect x="${BX0}" y="${wy}" width="${BX1 - BX0}" height="34" fill="${wainscot}"/>`;
    s += `<path d="M0 ${f(300 - 300 * 34 / 128)}L${BX0} ${wy}L${BX0} ${BY1}L0 300Z" fill="${wainscot}"/>`;
    s += `<path d="M300 ${f(300 - 300 * 34 / 128)}L${BX1} ${wy}L${BX1} ${BY1}L300 300Z" fill="${wainscot}"/>`;
    s += `<path d="M${BX0} ${wy}H${BX1}M0 ${f(300 - 300 * 34 / 128)}L${BX0} ${wy}M300 ${f(300 - 300 * 34 / 128)}L${BX1} ${wy}" stroke="#c9a23a" stroke-width="1.6" opacity=".7"/>`;
    for (let i = 1; i < 6; i++) {
      const x = BX0 + ((BX1 - BX0) * i) / 6;
      s += `<rect x="${f(x - 10)}" y="${wy + 7}" width="20" height="20" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>`;
    }
  }
  s += `<path d="M${BX0} ${BY1}L${BX1} ${BY1}M0 300L${BX0} ${BY1}M300 300L${BX1} ${BY1}M${BX0} ${BY0}L${BX0} ${BY1}M${BX1} ${BY0}L${BX1} ${BY1}" stroke="${color}" stroke-width="3" fill="none"/>`;
  s += `<path d="M0 0L${BX0} ${BY0}L${BX1} ${BY0}L300 0" stroke="#c9a23a" stroke-width="2" fill="none" opacity=".45"/>`;
  return s;
}

function windowRain(x, y, w, h, seed, { arch = false, moon = false, flash = false } = {}) {
  const r = rng(seed);
  const id = `win${seed}`;
  const shape = arch
    ? `M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`
    : `M${x} ${y}h${w}v${h}h${-w}Z`;
  const rain = Array.from({ length: Math.round((w * h) / 70) }, () =>
    `<path d="M${f(x + r() * w)} ${f(y + r() * h)}l-2.5 8" stroke="#a8c8ff" stroke-opacity="${f(0.2 + r() * 0.4)}" stroke-width="1"/>`).join('');
  return `
    <clipPath id="${id}"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="url(#night)"/>
    <g clip-path="url(#${id})">
      ${flash ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dfe8ff" opacity=".35"/><path d="M${x + w * 0.62} ${y}l-10 ${h * 0.35} 8 0 -12 ${h * 0.4}" stroke="#fff" stroke-width="2.5" fill="none"/>` : ''}
      ${moon ? `<circle cx="${x + w * 0.66}" cy="${y + h * 0.28}" r="${f(w * 0.36)}" fill="#f4ecd0" opacity=".12"/><circle cx="${x + w * 0.66}" cy="${y + h * 0.28}" r="${f(w * 0.15)}" fill="#f6eed6"/>` : ''}
      <path d="M${x} ${y + h * 0.8}q${w * 0.3} -12 ${w * 0.55} -4t${w * 0.45} -6V${y + h}H${x}Z" fill="#050810" opacity=".8"/>
      ${rain}
    </g>
    <path d="${shape}" fill="none" stroke="#1e140c" stroke-width="5"/>
    <path d="M${x + w / 2} ${y + (arch ? 4 : 0)}V${y + h}M${x} ${f(y + h * 0.55)}H${x + w}" stroke="#1e140c" stroke-width="3"/>
    <rect x="${x - 6}" y="${y + h}" width="${w + 12}" height="6" fill="#3a2a1c"/>`;
}

const glow = (x, y, r, op = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#warm)" opacity="${op}"/>`;

function flame(x, y, s = 1) {
  return `${glow(x, y, 16 * s, 0.8)}<path d="M${f(x)} ${f(y - 7 * s)}c${f(3 * s)} ${f(4 * s)} ${f(4 * s)} ${f(6 * s)} ${f(2.5 * s)} ${f(8.5 * s)}c${f(-1.5 * s)} ${f(1.5 * s)} ${f(-3.5 * s)} ${f(1.5 * s)} ${f(-5 * s)} 0c${f(-1.5 * s)} ${f(-2.5 * s)} ${f(-0.5 * s)} ${f(-4.5 * s)} ${f(2.5 * s)} ${f(-8.5 * s)}z" fill="#ffd27a"/>`;
}

function chandelier(cx, y, s = 1) {
  const arms = [-3, -2, -1, 1, 2, 3].map((k) => [cx + k * 13 * s, y + Math.abs(k) * -2 * s]);
  return `
    <path d="M${cx} 0V${y - 10 * s}" stroke="#b08a3a" stroke-width="${1.5 * s}"/>
    ${glow(cx, y, 60 * s, 0.5)}
    <path d="M${cx - 42 * s} ${y - 6 * s}Q${cx} ${y + 18 * s} ${cx + 42 * s} ${y - 6 * s}" stroke="url(#gold)" stroke-width="${3 * s}" fill="none"/>
    <path d="M${cx - 8 * s} ${y - 12 * s}h${16 * s}l${-3 * s} ${16 * s}h${-10 * s}z" fill="url(#gold)"/>
    ${arms.map(([ax, ay]) => `<rect x="${f(ax - 1.5 * s)}" y="${f(ay - 14 * s)}" width="${3 * s}" height="${8 * s}" fill="#f3ead6"/>${flame(ax, ay - 17 * s, s * 0.8)}`).join('')}
    ${[-2, -1, 0, 1, 2].map((k) => `<path d="M${cx + k * 10 * s} ${y + 6 * s}l${2 * s} ${5 * s}l${-2 * s} ${5 * s}l${-2 * s} ${-5 * s}z" fill="#cfeaff" opacity=".85"/>`).join('')}`;
}

function books(x, y, w, h, rows, seed) {
  const r = rng(seed);
  const colors = ['#7a2a2a', '#2a4a7a', '#8a6a2a', '#2e5a36', '#5a2a6a', '#8a4a22', '#1e2a4a', '#6a5a4a', '#9a3a2a'];
  const rh = h / rows;
  let s = `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" fill="#2a180c"/>`;
  for (let j = 0; j < rows; j++) {
    const by = y + j * rh;
    s += `<rect x="${x}" y="${f(by)}" width="${w}" height="${f(rh)}" fill="#140a06"/>`;
    let bx = x + 1;
    while (bx < x + w - 3) {
      const bw = 2.5 + r() * 4.5;
      const bh = rh * (0.62 + r() * 0.3);
      const c = colors[Math.floor(r() * colors.length)];
      if (r() < 0.08) {
        s += `<rect x="${f(bx)}" y="${f(by + rh - bh * 0.7)}" width="${f(bh * 0.7)}" height="${f(bw)}" fill="${c}"/>`;
        bx += bh * 0.7 + 1;
        continue;
      }
      s += `<rect x="${f(bx)}" y="${f(by + rh - bh - 1)}" width="${f(bw)}" height="${f(bh)}" fill="${c}"/><rect x="${f(bx)}" y="${f(by + rh - bh + 3)}" width="${f(bw)}" height="1.2" fill="#e2c066" opacity=".6"/>`;
      bx += bw + 0.6;
    }
    s += `<rect x="${x - 4}" y="${f(by + rh - 1.5)}" width="${w + 8}" height="3" fill="#4a2e18"/>`;
  }
  return s;
}

function frame(x, y, w, h, inner) {
  return `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" fill="url(#gold)"/><rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="#3a2a10"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
}

const PORTRAIT = `<rect width="100" height="120" fill="#1a1210"/><ellipse cx="50" cy="40" rx="40" ry="46" fill="#3a2a1a" opacity=".6"/><path d="M14 120C16 90 32 76 50 74C68 76 84 90 86 120Z" fill="#0e0a08"/><ellipse cx="50" cy="48" rx="15" ry="19" fill="#b8866a"/><path d="M35 44C34 28 42 22 50 22C60 22 66 30 65 44C62 36 56 32 50 32C44 32 38 36 35 44Z" fill="#2a1a12"/><path d="M42 60C46 64 54 64 58 60" stroke="#5a3222" stroke-width="2" fill="none"/><path d="M46 78L50 90L54 78" fill="#e8e2d6"/>`;
const LANDSCAPE = `<rect width="100" height="120" fill="#1c2438"/><circle cx="70" cy="30" r="10" fill="#e8dcb0"/><path d="M0 80Q25 55 50 72T100 64V120H0Z" fill="#141a22"/><path d="M0 95Q30 80 60 92T100 88V120H0Z" fill="#0a0e14"/><path d="M20 90l4-18 4 18z" fill="#060808"/>`;

function curtain(x, y, w, h, color) {
  return `<path d="M${x} ${y}h${w}c-4 ${h * 0.3} -2 ${h * 0.7} ${w * 0.2} ${h}h${-w * 1.1}c2 ${-h * 0.4} 4 ${-h * 0.7} ${-w * 0.1} ${-h}z" fill="${color}"/>
    <path d="M${x + w * 0.3} ${y}c-2 ${h * 0.4} 0 ${h * 0.7} 2 ${h}M${x + w * 0.65} ${y}c-2 ${h * 0.4} 0 ${h * 0.7} 2 ${h}" stroke="#000" stroke-opacity=".35" stroke-width="2.5" fill="none"/>`;
}

const COMMON = [
  rad('vig', [[0.45, '#000', 0], [1, '#000', 0.82]], 0.5, 0.46, 0.72),
  grainFilter('grain'),
  blur('b3', 3),
  lin('night', [[0, '#081028'], [0.6, '#18264a'], [1, '#26365a']]),
  rad('warm', [[0, '#ffcf7a', 0.85], [0.35, '#ff9a3a', 0.32], [1, '#ff7a1a', 0]]),
  lin('gold', [[0, '#fff1b8'], [0.45, '#d8a93c'], [1, '#6e4a12']]),
  lin('sideL', [[0, '#000', 0.55], [1, '#000', 0.1]], 0, 0, 1, 0),
  lin('sideR', [[0, '#000', 0.1], [1, '#000', 0.55]], 0, 0, 1, 0),
  lin('ceil', [[0, '#000', 0.2], [1, '#000', 0.7]]),
].join('');

const room = (defs, body) => svg(300, 300, `${body}<rect width="300" height="300" fill="url(#vig)"/><rect width="300" height="300" filter="url(#grain)" opacity=".12"/>`, { defs: COMMON + defs });

function kitchen() {
  const defs = `<pattern id="tile" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" fill="#d6cebc"/><path d="M0 9.5h14M13.5 0v10" stroke="#8e8472" stroke-width="1"/></pattern>
    ${lin('copper', [[0, '#f5b070'], [0.5, '#b8622a'], [1, '#5a2a0e']], 0, 0, 1, 0)}`;
  const tt = up(fp(0.5, 0.62), 46);
  return room(defs, `
    ${shell({ back: 'url(#tile)', floor: '#1c1a20', left: '#6e6252', right: '#5e5446' })}
    ${checker(7, 8, '#d8d0c0', '#26242c')}
    ${trims()}
    ${windowRain(84, 70, 54, 62, 3, { moon: true })}
    <rect x="152" y="80" width="60" height="4" fill="#4a3020"/>
    <rect x="156" y="66" width="9" height="14" rx="2" fill="#8a9aa8" opacity=".85"/><rect x="168" y="70" width="8" height="10" rx="2" fill="#c9a060"/><rect x="180" y="64" width="10" height="16" rx="2" fill="#6a8a5a" opacity=".85"/><rect x="194" y="68" width="8" height="12" rx="2" fill="#a85a3a"/>
    <rect x="186" y="58" width="12" height="70" fill="#1a1a1e"/>
    <path d="M160 128H226V186H160Z" fill="#1a1a20"/><path d="M156 122H230V130H156Z" fill="#3a3a44"/>
    <ellipse cx="176" cy="124" rx="9" ry="2.5" fill="#050506"/><ellipse cx="208" cy="124" rx="9" ry="2.5" fill="#050506"/>
    <rect x="168" y="142" width="50" height="34" rx="2" fill="#0e0e12" stroke="#5a5a64" stroke-width="2"/>
    <path d="M172 138H214" stroke="url(#gold)" stroke-width="3"/>
    ${glow(193, 160, 22, 0.55)}
    <path d="M10 92L58 82" stroke="#3a2a1a" stroke-width="3"/>
    ${[[18, 96, 11], [36, 92, 9], [52, 88, 8]].map(([x, y, rr]) => `<path d="M${x} ${y - 8}V${y}" stroke="#2a2a2a"/><path d="M${x - rr} ${y}h${rr * 2}a${rr} ${rr * 0.9} 0 0 1 ${-rr * 2} 0z" fill="url(#copper)"/>`).join('')}
    <path d="M150 0V40" stroke="#2a2a2a" stroke-width="1.5"/><path d="M138 52h24l-4-12h-16z" fill="#2e4a3a"/>${glow(150, 60, 70, 0.55)}
    ${box(0.26, 0.45, 0.74, 0.8, 46, '#b8864e', '#6a4424', '#4e3018')}
    ${[[0.29, 0.8], [0.71, 0.8]].map(([u, v]) => { const p = fp(u, v); return `<rect x="${f(p[0] - 3)}" y="${f(p[1] - 2)}" width="6" height="10" fill="#3a2410"/>`; }).join('')}
    <path d="M${f(tt[0] - 30)} ${f(tt[1] - 6)}l34 -3 3 10 -34 3z" fill="#c9d0d8"/><path d="M${f(tt[0] + 7)} ${f(tt[1] - 9)}l18 -2 1 5 -18 2z" fill="#3a2410"/>
    <circle cx="${f(tt[0] - 44)}" cy="${f(tt[1] + 2)}" r="7" fill="#c83a2a"/><circle cx="${f(tt[0] + 38)}" cy="${f(tt[1] + 4)}" r="6" fill="#d9b45a"/><circle cx="${f(tt[0] + 48)}" cy="${f(tt[1])}" r="5" fill="#e8dcc0"/>`);
}

function ballroom() {
  const defs = `<pattern id="dmk" width="24" height="30" patternUnits="userSpaceOnUse"><rect width="24" height="30" fill="#7a5a30"/><path d="M12 3c5 5 8 9 4 14 4-1 6 3 3 6-3 2-6 0-7-3-1 3-4 5-7 3-3-3-1-7 3-6-4-5-1-9 4-14z" fill="#9a7a42"/></pattern>`;
  return room(defs, `
    ${shell({ back: 'url(#dmk)', floor: '#5a3a1e', left: '#6a4a26', right: '#5a3e20' })}
    ${planks(14, '#3a2410', 21)}
    <ellipse cx="150" cy="248" rx="96" ry="30" fill="#ffd28a" opacity=".12"/>
    ${trims('#2a1c12', '#3a2414')}
    ${windowRain(82, 72, 38, 96, 11, { arch: true })}
    ${windowRain(131, 68, 38, 100, 12, { arch: true, moon: true })}
    ${windowRain(180, 72, 38, 96, 13, { arch: true })}
    ${curtain(72, 64, 12, 108, '#7a1a22')}${curtain(118, 64, 12, 108, '#7a1a22')}${curtain(170, 64, 12, 108, '#7a1a22')}${curtain(216, 64, 12, 108, '#7a1a22')}
    <path d="M70 62Q110 78 150 62Q190 78 230 62V58H70Z" fill="#8a1e28"/>
    ${[18, 42].map((x) => `<path d="M${x} ${40 + x * 0.3}V${260 - x * 0.6}" stroke="#c9a23a" stroke-width="4" opacity=".35"/>`).join('')}
    ${chandelier(150, 40, 1.3)}
    <path d="M196 236L262 222C272 222 282 232 278 244L268 262L204 262Z" fill="#0c0c10"/>
    <path d="M204 234L258 178L270 190L220 238Z" fill="#141418"/><path d="M204 234L258 178" stroke="#6a6a78" stroke-width="1.5"/>
    <path d="M200 244H268" stroke="#f4f0e6" stroke-width="4"/><path d="M204 244h60" stroke="#111" stroke-width="2" stroke-dasharray="2 3"/>
    <path d="M210 262v26M262 262v26" stroke="#0c0c10" stroke-width="5"/>`);
}

function conservatory() {
  let glass = '';
  for (let x = BX0; x <= BX1; x += 20) glass += `<path d="M${x} ${BY0}V${BY1}" stroke="#2a3a34" stroke-width="3"/>`;
  for (let y = BY0; y <= BY1; y += 32) glass += `<path d="M${BX0} ${y}H${BX1}" stroke="#2a3a34" stroke-width="3"/>`;
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    glass += `<path d="M${f(BX0 * t)} ${f(BY0 * t)}L${f(BX0 * t)} ${f(300 - (300 - BY1) * t)}" stroke="#2a3a34" stroke-width="3"/>`;
    glass += `<path d="M${f(300 - (300 - BX1) * t)} ${f(BY0 * t)}L${f(300 - (300 - BX1) * t)} ${f(300 - (300 - BY1) * t)}" stroke="#2a3a34" stroke-width="3"/>`;
  }
  const r = rng(31);
  const frond = (x, y, a, len, col) => `<path d="M${x} ${y}q${f(Math.cos(a) * len * 0.5)} ${f(Math.sin(a) * len * 0.5 - 12)} ${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}" stroke="${col}" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 7 }, (_, k) => { const t = (k + 1) / 8; const px = x + Math.cos(a) * len * t; const py = y + Math.sin(a) * len * t - 10 * Math.sin(Math.PI * t); return `<path d="M${f(px)} ${f(py)}l${f(-6 + r() * 3)} ${f(10 + r() * 4)}M${f(px)} ${f(py)}l${f(6 - r() * 3)} ${f(10 + r() * 4)}" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/>`; }).join('')}`;
  const fc = fp(0.5, 0.35);
  return room('', `
    <rect width="300" height="300" fill="url(#night)"/>
    <circle cx="186" cy="92" r="16" fill="#f4ecd0"/><circle cx="186" cy="92" r="40" fill="#f4ecd0" opacity=".08"/>
    <path d="M0 300L${BX0} ${BY1}L${BX1} ${BY1}L300 300Z" fill="#7a3e22"/>
    ${checker(6, 8, '#a8582e', '#8a4424')}
    ${glass}
    <path d="M0 0L${BX0} ${BY0}L${BX1} ${BY0}L300 0" stroke="#2a3a34" stroke-width="6" fill="none"/>
    <path d="M${BX0} ${BY1}H${BX1}" stroke="#3a2a1a" stroke-width="4"/>
    <ellipse cx="${f(fc[0])}" cy="${f(fc[1] + 6)}" rx="42" ry="11" fill="#6a665e"/>
    <ellipse cx="${f(fc[0])}" cy="${f(fc[1])}" rx="40" ry="10" fill="#8a867c"/>
    <ellipse cx="${f(fc[0])}" cy="${f(fc[1])}" rx="34" ry="7" fill="#3a7aa8"/>
    <rect x="${f(fc[0] - 4)}" y="${f(fc[1] - 34)}" width="8" height="34" fill="#8a867c"/>
    <ellipse cx="${f(fc[0])}" cy="${f(fc[1] - 34)}" rx="14" ry="4" fill="#8a867c"/>
    <path d="M${f(fc[0])} ${f(fc[1] - 38)}c-12 -6 -22 6 -24 30M${f(fc[0])} ${f(fc[1] - 38)}c12 -6 22 6 24 30" stroke="#a8d8ff" stroke-width="1.8" fill="none" opacity=".7"/>
    <path d="M36 300C34 250 44 200 40 150" stroke="#5a3a1e" stroke-width="9" fill="none"/>
    ${[-2.6, -2.1, -1.6, -1.1, -0.6, -0.2].map((a, i) => frond(40, 150, a, 60 + (i % 2) * 14, i % 2 ? '#3f8a4a' : '#2e6e38')).join('')}
    ${[-2.8, -2.3, -1.8, -1.3, -0.8, -0.4].map((a, i) => frond(252, 232, a, 44, i % 2 ? '#4a9a52' : '#2e6e38')).join('')}
    <path d="M232 300L240 250H266L274 300Z" fill="#a85630"/><path d="M236 250H270" stroke="#7a3a1e" stroke-width="5"/>
    <path d="M96 272L108 244H140L152 272Z" fill="#a85630"/>
    ${[-2.5, -2, -1.5, -1, -0.5].map((a) => frond(124, 244, a, 34, '#3f8a4a')).join('')}
    <path d="M176 262h56M180 262v22M228 262v22M176 248h56" stroke="#1a1a1a" stroke-width="3" fill="none"/>`);
}

function dining() {
  const defs = `<pattern id="dmkR" width="22" height="28" patternUnits="userSpaceOnUse"><rect width="22" height="28" fill="#4a1420"/><path d="M11 3c4 4 7 8 3 12 4-1 5 3 3 5-3 2-5 0-6-2-1 2-3 4-6 2-2-2-1-6 3-5-4-4-1-8 3-12z" fill="#6a2232"/></pattern>`;
  const legs = [[0.32, 0.25], [0.68, 0.25], [0.32, 0.92], [0.68, 0.92]].map(([u, v]) => { const p = fp(u, v); return `<rect x="${f(p[0] - 2)}" y="${f(p[1] - 30)}" width="4" height="30" fill="#2a1408"/>`; }).join('');
  const chairs = [0.35, 0.55, 0.78].flatMap((v) => [[0.24, v], [0.76, v]]).map(([u, v]) => {
    const p = fp(u, v);
    const s = 0.5 + v * 0.6;
    return `<path d="M${f(p[0] - 9 * s)} ${f(p[1] - 30 * s)}h${f(18 * s)}v${f(-40 * s)}q${f(-9 * s)} ${f(-8 * s)} ${f(-18 * s)} 0z" fill="#3a1a12"/><path d="M${f(p[0] - 6 * s)} ${f(p[1] - 66 * s)}h${f(12 * s)}v${f(30 * s)}h${f(-12 * s)}z" fill="#8a2a2a"/>`;
  }).join('');
  const cands = [0.32, 0.55, 0.8].map((v) => { const p = up(fp(0.5, v), 32); const s = 0.6 + v * 0.7; return `<path d="M${f(p[0])} ${f(p[1])}V${f(p[1] - 22 * s)}M${f(p[0] - 8 * s)} ${f(p[1] - 16 * s)}H${f(p[0] + 8 * s)}" stroke="url(#gold)" stroke-width="${f(2 * s)}"/>${[-8, 0, 8].map((dx) => flame(p[0] + dx * s, p[1] - (dx ? 20 : 26) * s, s * 0.7)).join('')}`; }).join('');
  const plates = [0.35, 0.55, 0.78].flatMap((v) => [0.4, 0.6].map((u) => { const p = up(fp(u, v), 32); return `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(5 + v * 6)}" ry="${f(2 + v * 2)}" fill="#f4f0e6" stroke="#c9a23a" stroke-width=".8"/>`; })).join('');
  return room(defs, `
    ${shell({ back: 'url(#dmkR)', floor: '#2a1810', left: '#3a1018', right: '#321018' })}
    ${planks(10, '#1a0c06', 44)}
    ${trims('#1a0c06', '#2a160c')}
    ${frame(122, 70, 56, 70, PORTRAIT)}
    ${glow(150, 120, 50, 0.25)}
    ${curtain(72, 60, 22, 124, '#6a1420')}${curtain(208, 60, 22, 124, '#6a1420')}
    ${chandelier(150, 34, 1)}
    ${chairs}
    ${legs}
    ${poly([up(fp(0.3, 0.22), 32), up(fp(0.7, 0.22), 32), up(fp(0.7, 0.95), 32), up(fp(0.3, 0.95), 32)], '#efe9dc')}
    ${poly([up(fp(0.3, 0.95), 32), up(fp(0.7, 0.95), 32), up(fp(0.7, 0.95), 18), up(fp(0.3, 0.95), 18)], '#d8d0c0')}
    ${poly([up(fp(0.45, 0.22), 32.2), up(fp(0.55, 0.22), 32.2), up(fp(0.55, 0.95), 32.2), up(fp(0.45, 0.95), 32.2)], '#8a1e28')}
    ${plates}
    ${cands}`);
}

function billiard() {
  const defs = `<pattern id="strG" width="12" height="10" patternUnits="userSpaceOnUse"><rect width="12" height="10" fill="#1a3424"/><rect width="5" height="10" fill="#22402e"/></pattern>
    ${lin('cone', [[0, '#fff2c8', 0.4], [1, '#fff2c8', 0]])}`;
  const r = rng(8);
  const tl = up(fp(0.22, 0.38), 30);
  const tr = up(fp(0.78, 0.38), 30);
  const brc = up(fp(0.8, 0.85), 30);
  const blc = up(fp(0.2, 0.85), 30);
  const ballColors = ['#e2b23a', '#3a64b7', '#d8433b', '#7a3fb0', '#e07a2c', '#2d8a52', '#111', '#f4efe4'];
  const balls = ballColors.map((c) => { const u = 0.3 + r() * 0.4; const v = 0.45 + r() * 0.35; const p = up(fp(u, v), 31); const s = 3 + v * 2.5; return `<circle cx="${f(p[0])}" cy="${f(p[1] - s * 0.6)}" r="${f(s)}" fill="${c}"/><circle cx="${f(p[0] - s * 0.3)}" cy="${f(p[1] - s)}" r="${f(s * 0.3)}" fill="#fff" opacity=".7"/>`; }).join('');
  return room(defs, `
    ${shell({ back: 'url(#strG)', floor: '#2a1a10', left: '#1a2e20', right: '#16281c' })}
    ${planks(10, '#140a04', 18)}
    ${trims('#140a04', '#3a2210')}
    <rect x="86" y="80" width="40" height="64" fill="#2a1608" stroke="#5a3a1a" stroke-width="2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${92 + i * 7} 86V140" stroke="#c9975a" stroke-width="2.5"/><circle cx="${92 + i * 7}" cy="86" r="1.8" fill="#4a7fd0"/>`).join('')}
    <rect x="160" y="84" width="56" height="34" fill="#141410" stroke="#8a6a3a" stroke-width="3"/>
    <path d="M168 94h16M168 102h24M168 110h12M196 94v16" stroke="#e8e2d0" stroke-width="1.5" opacity=".8"/>
    ${poly([blc, brc, fp(0.8, 0.85), fp(0.2, 0.85)], '#3a200e')}
    ${poly([tl, tr, brc, blc], '#4a2a14')}
    ${poly([up(fp(0.25, 0.42), 31), up(fp(0.75, 0.42), 31), up(fp(0.77, 0.81), 31), up(fp(0.23, 0.81), 31)], '#2c7a4a')}
    ${[tl, tr, brc, blc].map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="5" fill="#050505"/>`).join('')}
    ${balls}
    <path d="${`M${P(up(fp(0.3, 0.6), 33))}L${P(up(fp(0.82, 0.95), 40))}`}" stroke="#d8a868" stroke-width="3" stroke-linecap="round"/>
    <path d="M100 0V60M200 0V60" stroke="#222" stroke-width="1.5"/>
    <path d="M96 60H204L212 76H88Z" fill="#1e5a36"/><path d="M92 76H208" stroke="#e2c066" stroke-width="2"/>
    <path d="M96 78H204L250 240H50Z" fill="url(#cone)"/>
    ${glow(150, 80, 50, 0.6)}`);
}

function library() {
  const r = rng(61);
  let sideShelves = '';
  for (const side of ['L', 'R']) {
    for (let k = 0; k < 4; k++) {
      const t0 = k / 4 + 0.03;
      const x = side === 'L' ? BX0 * (1 - t0) : 300 - (300 - BX1) * (1 - t0);
      const ytop = BY0 * (1 - t0) + 8;
      const ybot = 300 - (300 - BY1) * (1 - t0) - 20;
      for (let j = 0; j < 24; j++) {
        const yy = ytop + ((ybot - ytop) * j) / 24;
        sideShelves += `<rect x="${f(x - 6)}" y="${f(yy)}" width="${f(3 + r() * 4)}" height="${f((ybot - ytop) / 26)}" fill="${['#6a2a2a', '#2a4a6a', '#6a5a2a', '#2e4a2e'][Math.floor(r() * 4)]}" opacity=".85"/>`;
      }
    }
  }
  const lamp = up(fp(0.2, 0.7), 40);
  return room('', `
    ${shell({ back: '#2a180c', floor: '#2a1a10', left: '#2a180c', right: '#24140a' })}
    <path d="M0 300L${BX0} ${BY1}L${BX1} ${BY1}L300 300Z" fill="#3a2414"/>
    ${planks(9, '#1a0c06', 9)}
    ${books(BX0 + 4, BY0 + 6, 44, 118, 5, 71)}
    ${books(BX1 - 48, BY0 + 6, 44, 118, 5, 72)}
    ${windowRain(126, 70, 48, 90, 21, { arch: true, moon: true })}
    <path d="M0 0L${BX0} ${BY0}L${BX0} ${BY1}L0 300Z" fill="url(#sideL)"/>
    ${sideShelves}
    ${trims('#140a04')}
    <path d="M250 40L276 300M270 40L296 300" stroke="#6a4424" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${f(252 + i * 3.1)} ${50 + i * 32}h20" stroke="#6a4424" stroke-width="3"/>`).join('')}
    ${poly([fp(0.2, 0.55), fp(0.8, 0.55), fp(0.85, 1), fp(0.15, 1)], '#5a1a24')}
    ${poly([fp(0.25, 0.62), fp(0.75, 0.62), fp(0.79, 0.95), fp(0.21, 0.95)], 'none', 'stroke="#d9b45a" stroke-width="2" opacity=".6"')}
    <path d="M40 300C40 250 44 230 56 222H96C108 230 112 250 112 300Z" fill="#6a1a24"/><path d="M44 236C44 212 52 196 76 196C100 196 108 212 108 236Z" fill="#7a2230"/>
    <rect x="${f(lamp[0] + 40)}" y="${f(lamp[1] + 10)}" width="6" height="${f(300 - lamp[1] - 10)}" fill="#2a1408"/>
    <path d="M${f(lamp[0] + 26)} ${f(lamp[1] + 10)}h34" stroke="#3a2210" stroke-width="5"/>
    <path d="M${f(lamp[0] + 34)} ${f(lamp[1] - 6)}h18l4 10h-26z" fill="#2e7a4a"/>${glow(lamp[0] + 43, lamp[1] + 6, 40, 0.8)}`);
}

function lounge() {
  const defs = `<pattern id="dmkB" width="22" height="28" patternUnits="userSpaceOnUse"><rect width="22" height="28" fill="#3a1018"/><path d="M11 3c4 4 7 8 3 12 4-1 5 3 3 5-3 2-5 0-6-2-1 2-3 4-6 2-2-2-1-6 3-5-4-4-1-8 3-12z" fill="#561a26"/></pattern>
    ${rad('fire', [[0, '#fff2b0'], [0.4, '#ffb040'], [1, '#c8401a', 0]], 0.5, 0.8, 0.7)}
    <pattern id="rugP" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#5a1422"/><path d="M8 2l6 6-6 6-6-6z" fill="#8a2a34"/><circle cx="8" cy="8" r="2" fill="#d9b45a"/></pattern>`;
  return room(defs, `
    ${shell({ back: 'url(#dmkB)', floor: '#24140c', left: '#2e0c14', right: '#280a12' })}
    ${planks(10, '#140a04', 77)}
    ${trims('#140a04', '#2a160c')}
    ${glow(150, 170, 110, 0.55)}
    <path d="M104 106H196V186H104Z" fill="#6a6258"/><path d="M98 100H202V110H98Z" fill="#3a2414"/>
    <path d="M122 132H178V186H122Z" fill="#0a0604"/>
    <path d="M122 132Q150 118 178 132" fill="#0a0604"/>
    <path d="M128 186C124 170 136 162 140 150C144 166 150 160 150 146C158 160 166 164 162 176C170 170 172 176 172 186Z" fill="url(#fire)"/>
    <path d="M138 186c0-10 6-14 8-22 4 10 10 12 8 22z" fill="#fff2b0"/>
    <path d="M126 184h48" stroke="#3a1a0a" stroke-width="5"/>
    ${flame(110, 90, 0.8)}${flame(190, 90, 0.8)}<path d="M110 100V92M190 100V92" stroke="url(#gold)" stroke-width="3"/>
    <circle cx="150" cy="90" r="8" fill="url(#gold)"/><circle cx="150" cy="90" r="5.5" fill="#f4ecd8"/>
    ${frame(128, 62, 44, 22, LANDSCAPE)}
    ${poly([fp(0.18, 0.5), fp(0.82, 0.5), fp(0.9, 0.98), fp(0.1, 0.98)], 'url(#rugP)')}
    ${poly([fp(0.18, 0.5), fp(0.82, 0.5), fp(0.9, 0.98), fp(0.1, 0.98)], 'none', 'stroke="#d9b45a" stroke-width="3"')}
    <path d="M6 300C4 250 12 222 36 216C60 212 76 222 80 240L84 300Z" fill="#7a1a22"/>
    <path d="M14 232C10 196 24 176 52 178C72 180 80 196 80 214L78 232Z" fill="#8e2430"/>
    <path d="M294 300C296 250 288 222 264 216C240 212 224 222 220 240L216 300Z" fill="#7a1a22"/>
    <path d="M286 232C290 196 276 176 248 178C228 180 220 196 220 214L222 232Z" fill="#8e2430"/>
    <ellipse cx="150" cy="262" rx="30" ry="8" fill="#2a1408"/><rect x="146" y="262" width="8" height="30" fill="#2a1408"/>
    <path d="M140 258V244L144 236H150L154 244V258Z" fill="#c8862a" opacity=".85"/><path d="M160 258V250H168V258Z" fill="#dfe8f0" opacity=".6"/>`);
}

function hall() {
  const steps = 9;
  let stair = '';
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const w = 120 - t * 60;
    const y = 250 - i * 12;
    stair += `<path d="M${f(150 - w / 2)} ${y}H${f(150 + w / 2)}L${f(150 + w / 2 - 3)} ${y - 12}H${f(150 - w / 2 + 3)}Z" fill="${i % 2 ? '#d8d0c0' : '#c4baa6'}"/>`;
    stair += `<path d="M${f(150 - w * 0.18)} ${y}H${f(150 + w * 0.18)}L${f(150 + w * 0.18 - 2)} ${y - 12}H${f(150 - w * 0.18 + 2)}Z" fill="#8a1a24"/>`;
  }
  return room('', `
    ${shell({ back: '#bdb09a', floor: '#2a2830', left: '#a89c86', right: '#9a8e78' })}
    ${checker(7, 8, '#e6dfd0', '#2a2830')}
    ${trims('#3a2e24', '#6a5a46')}
    ${windowRain(122, 66, 56, 44, 51, { arch: true, moon: true })}
    ${stair}
    <path d="M90 250L120 142M210 250L180 142" stroke="#3a2414" stroke-width="5"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${f(92 + i * 4.3)} ${f(246 - i * 15.4)}v14M${f(208 - i * 4.3)} ${f(246 - i * 15.4)}v14" stroke="#3a2414" stroke-width="2"/>`).join('')}
    ${chandelier(150, 36, 1.2)}
    <g transform="translate(40 150)">
      <rect x="-3" y="-10" width="6" height="150" fill="#8a8e96"/>
      <path d="M-14 12C-14 -6 14 -6 14 12V40H-14Z" fill="#aab0ba"/><path d="M-8 10H8" stroke="#1a1a1a" stroke-width="3"/>
      <path d="M-20 44H20L16 100H-16Z" fill="#9aa0aa"/><path d="M-16 60H16M-16 76H16" stroke="#6a707a" stroke-width="2"/>
      <path d="M-14 100L-18 140M14 100L18 140" stroke="#8a8e96" stroke-width="9"/>
      <path d="M-12 20L-4 60" stroke="#fff" stroke-width="2" opacity=".5"/>
    </g>
    <rect x="236" y="150" width="28" height="120" fill="#3a2010"/><circle cx="250" cy="176" r="10" fill="#efe6d0" stroke="url(#gold)" stroke-width="3"/>
    <path d="M250 176l0-6M250 176l5 2" stroke="#1a1a1a" stroke-width="1.5"/><path d="M250 196v40" stroke="url(#gold)" stroke-width="2"/><circle cx="250" cy="238" r="5" fill="url(#gold)"/>`);
}

function study() {
  const defs = `<pattern id="dmkN" width="22" height="28" patternUnits="userSpaceOnUse"><rect width="22" height="28" fill="#141e38"/><path d="M11 3c4 4 7 8 3 12 4-1 5 3 3 5-3 2-5 0-6-2-1 2-3 4-6 2-2-2-1-6 3-5-4-4-1-8 3-12z" fill="#1e2c50"/></pattern>
    ${lin('lampCone', [[0, '#c8ffd8', 0.35], [1, '#c8ffd8', 0]])}`;
  const d0 = up(fp(0.28, 0.62), 36);
  return room(defs, `
    ${shell({ back: 'url(#dmkN)', floor: '#1e140e', left: '#101a30', right: '#0e1628' })}
    ${planks(10, '#0e0804', 13)}
    ${trims('#0e0804', '#2a180c')}
    ${windowRain(104, 68, 92, 84, 81, { flash: true })}
    ${curtain(94, 60, 16, 116, '#2a1a3a')}${curtain(190, 60, 16, 116, '#2a1a3a')}
    ${books(8, 110, 44, 120, 5, 83)}
    ${box(0.24, 0.6, 0.76, 0.88, 36, '#5a3620', '#3a2210', '#2a180a')}
    ${poly([up(fp(0.3, 0.88), 30), up(fp(0.46, 0.88), 30), up(fp(0.46, 0.88), 8), up(fp(0.3, 0.88), 8)], 'none', 'stroke="#c9a23a" stroke-width="1.5"')}
    ${poly([up(fp(0.54, 0.88), 30), up(fp(0.7, 0.88), 30), up(fp(0.7, 0.88), 8), up(fp(0.54, 0.88), 8)], 'none', 'stroke="#c9a23a" stroke-width="1.5"')}
    <path d="M${f(d0[0] + 20)} ${f(d0[1] - 4)}l30 -4 6 12 -30 4z" fill="#efe8d6"/><path d="M${f(d0[0] + 40)} ${f(d0[1] + 2)}l26 -2 4 10 -26 2z" fill="#e4dcc6"/>
    <path d="M${f(d0[0] + 62)} ${f(d0[1] - 16)}h40v14h-40z" fill="#1a1a1e"/><path d="M${f(d0[0] + 66)} ${f(d0[1] - 22)}h32v6h-32z" fill="#2a2a30"/>
    <path d="M${f(d0[0] + 10)} ${f(d0[1] - 2)}v-26" stroke="url(#gold)" stroke-width="3"/>
    <path d="M${f(d0[0])} ${f(d0[1] - 30)}h22l4 8h-30z" fill="#1f6a3a"/>
    <path d="M${f(d0[0] - 6)} ${f(d0[1] - 22)}h34l30 40h-94z" fill="url(#lampCone)"/>
    ${glow(d0[0] + 11, d0[1] - 22, 30, 0.6)}
    <path d="M258 300V236" stroke="#3a2210" stroke-width="5"/><ellipse cx="258" cy="300" rx="18" ry="5" fill="#2a180a"/>
    <circle cx="258" cy="214" r="24" fill="#2a5a9a"/><path d="M244 204c6-6 16-4 18 4s-6 10-2 16M262 196c6 2 10 8 10 14" stroke="#4a8a4a" stroke-width="5" fill="none"/>
    <path d="M234 190a30 30 0 0 1 44 46" stroke="url(#gold)" stroke-width="3" fill="none"/>`);
}

module.exports = { kitchen, ballroom, conservatory, dining, billiard, library, lounge, hall, study };
