'use strict';
// 카드 22종 일러스트 + 카드 테두리(갈색/파란색) + 총알 구멍 + 카드 뒷면
// 실제 뱅 카드처럼 그림이 카드 한 면을 가득 채우는 서부 유화풍.
// 빛은 항상 왼쪽 위에서 온다: 왼위 = 하이라이트, 오른아래 = 그림자 + 땅에 드리운 그림자.
const { svg, lin, rad, grainFilter, blur, rng, f } = require('./lib');

const INK = '#2b1a0f';
const GROUND = 196;          // 사물이 서 있는 바닥 높이 (그림 좌표계)

/* ═════════════ 공통 재질 ═════════════ */

/** 왼쪽 위에서 빛을 받는 입체 재질 */
const solid = (id, light, base, dark) => lin(id, [[0, light], [0.42, base], [1, dark]], 0.15, 0, 0.9, 1);

const DEFS = [
  rad('pap', [[0, '#f6e7c4'], [0.65, '#e2c795'], [1, '#b99462']], 0.5, 0.45, 0.75),
  `<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="${INK}" stroke-width="1.3" opacity=".35"/></pattern>`,
  grainFilter('grain', 0.8),
  blur('b4', 4),
  blur('b7', 7),
  blur('b2', 2),
  // 금속
  solid('steel', '#f4f8fc', '#9aa4b0', '#252b33'),
  solid('brass', '#fff4c8', '#cf9f36', '#5e3d0e'),
  solid('blued', '#94a0b2', '#39424f', '#10151c'),
  solid('iron', '#b9c2cc', '#5e6772', '#1c2128'),
  // 나무 · 가죽
  solid('wood', '#c78a4e', '#7d4726', '#3e2010'),
  solid('wood2', '#e0a862', '#a4642f', '#53290f'),
  solid('leatherBrown', '#c08a52', '#7a4a24', '#36200e'),
  // 기타
  solid('beerGold', '#ffe98a', '#e8a418', '#8a5406'),
  solid('dyn', '#e9604a', '#b3261e', '#5e1008'),
  solid('glassBlue', '#e8f6ff', '#9ec8e4', '#3c6a86'),
  rad('vig', [[0.55, '#000', 0], [1, '#3a2410', 0.55]], 0.5, 0.5, 0.72),
  rad('flash', [[0, '#fffdf0'], [0.35, '#ffd25a', 0.95], [1, '#e0621c', 0]], 0.5, 0.5, 0.5),
  rad('glow', [[0, '#ffe9a8', 0.8], [1, '#ffb040', 0]], 0.5, 0.5, 0.5),
].join('');

const SCENE_DEFS = [
  rad('sky', [[0, '#ffeab4'], [0.42, '#efb864'], [1, '#c0783a']], 0.5, 0.4, 0.85),
  lin('dirt', [[0, '#a4652f'], [1, '#6b3c18']]),
  rad('vig2', [[0.5, '#000', 0], [1, '#2a1708', 0.62]], 0.5, 0.48, 0.74),
  `<filter id="mono"><feColorMatrix type="saturate" values="0.05"/><feComponentTransfer><feFuncR type="linear" slope="1.06" intercept="0.02"/><feFuncG type="linear" slope="1.02"/><feFuncB type="linear" slope="0.97"/></feComponentTransfer></filter>`,
].join('');

/* ═════════════ 그리기 도구 ═════════════ */

function sunRays(cx, cy, color, op) {
  let d = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const b = a + Math.PI / 48;
    d += `M${cx} ${cy}L${f(cx + Math.cos(a) * 260)} ${f(cy + Math.sin(a) * 260)}L${f(cx + Math.cos(b) * 260)} ${f(cy + Math.sin(b) * 260)}Z`;
  }
  return `<path d="${d}" fill="${color}" opacity="${op}"/>`;
}

function burst(cx, cy, n, r1, r2, fill, stroke = INK) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? r2 : r1 * (0.8 + ((i * 37) % 10) / 45);
    pts.push(`${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`);
  }
  return `<path d="M${pts.join('L')}Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`;
}

function suitShape(s, x, y, size, color) {
  const paths = {
    H: 'M0 .38C-.95-.2-.6-.95 0-.42C.6-.95.95-.2 0 .38Z',
    D: 'M0-.6L.44 0L0 .6L-.44 0Z',
    S: 'M0-.62C.95 0 .58.62.1.26L.24.62H-.24L-.1.26C-.58.62-.95 0 0-.62Z',
  };
  if (s === 'C') {
    return `<g transform="translate(${x} ${y}) scale(${size})" fill="${color}"><circle cx="0" cy="-.32" r=".26"/><circle cx="-.3" cy=".08" r=".26"/><circle cx=".3" cy=".08" r=".26"/><path d="M-.07.05H.07L.2.6H-.2Z"/></g>`;
  }
  return `<path d="${paths[s]}" fill="${color}" transform="translate(${x} ${y}) scale(${size})"/>`;
}

/** 땅에 드리운 그림자 (사물을 바닥에 붙여 준다) */
const cast = (cx, rx, ry = 7, y = GROUND + 2, op = 0.42) =>
  `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="#2a1408" opacity="${op}" filter="url(#b7)"/>`;

/** 왼쪽 위 가장자리에 걸리는 빛 */
const rim = (d, w = 2.2, color = '#ffe8b4', op = 0.6) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;

/** 오른아래로 떨어지는 안쪽 그늘 */
const shade = (d, op = 0.3) => `<path d="${d}" fill="#1a0c04" opacity="${op}"/>`;

const outline = (d, fill, w = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;

const spokes = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return `<path d="M${cx} ${cy}L${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}" stroke="${INK}" stroke-width="2.6"/>`;
}).join('');

/** 먼지 · 흙먼지 */
const dust = (seed, cx, cy, n = 10, spread = 60) => {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = f(cx + (r() - 0.5) * spread);
    const y = f(cy + (r() - 0.5) * spread * 0.4);
    return `<ellipse cx="${x}" cy="${y}" rx="${f(5 + r() * 14)}" ry="${f(3 + r() * 7)}" fill="#e6c08a" opacity="${f(0.06 + r() * 0.14)}"/>`;
  }).join('');
};

/* ═════════════ 되풀이해 쓰는 사물 ═════════════ */

function horse(x, y, s, rear = false) {
  const body = `
    <path d="M-30-8C-26-22-6-26 14-22C26-20 34-14 36-4C38 6 30 12 20 12L-18 12C-30 12-34 2-30-8Z" fill="url(#leatherBrown)" stroke="${INK}" stroke-width="3"/>
    <path d="M-24-14L-40-40L-48-38L-56-30L-52-24L-42-26L-30-4Z" fill="url(#leatherBrown)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-44-40l-2-9 6 6z" fill="${INK}"/>
    <path d="M-20 8L-40 24L-44 20M-8 10L-12 34M18 10L36 26L40 22M28 6L20 34" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M34-8C48-12 54 0 50 12" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M-30-30C-24-36-16-34-14-24" stroke="#2a1408" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${rim('M-28-12C-22-22-4-24 12-20', 2.4)}
    ${rim('M-40-38L-52-30', 2)}
    ${shade('M-26 2C-10 10 18 10 32 2C34 8 28 12 20 12L-18 12C-26 12-28 8-26 2Z', 0.35)}`;
  return `<g transform="translate(${x} ${y}) scale(${s})${rear ? ' rotate(-16)' : ''}">${body}</g>`;
}

function gunslinger(x, y, s, flip) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M-16 44C-16 18-10 2 0 2C10 2 16 18 16 44Z" fill="#241309" stroke="${INK}" stroke-width="3"/>
    <path d="M-13 40C-13 18-8 6 0 6C6 6 10 14 12 26" fill="none" stroke="#6a4424" stroke-width="2.4" opacity=".7"/>
    <circle cx="0" cy="-8" r="9" fill="#241309" stroke="${INK}" stroke-width="3"/>
    <path d="M-16-14H16L12-20H-12Z" fill="#241309" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-14" rx="21" ry="5" fill="#1a0e05" stroke="${INK}" stroke-width="3"/>
    ${rim('M-14 40C-14 16-8 4 0 4', 2.2, '#c89a5a', 0.5)}
    ${rim('M-19-15A21 5 0 0 1 4-18', 2, '#c89a5a', 0.55)}
    <path d="M14 16L30 24L34 18" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>`;
}

function arrow(x, y, ang, i) {
  return `<g transform="translate(${x} ${y}) rotate(${ang})">
    <path d="M-44 0H16" stroke="url(#wood)" stroke-width="4" stroke-linecap="round"/>
    <path d="M-44 0H16" stroke="${INK}" stroke-width="1" opacity=".5"/>
    <path d="M16 0L34 0L16-8V8Z" fill="url(#steel)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-44 0l-12-8v16zM-36 0l-11-7v14z" fill="${i % 2 ? '#c8322a' : '#e8d8b0'}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  </g>`;
}

function pistol({ len, frame, barrel, lever = false, rod = false }) {
  return `<g transform="translate(58 96)">
    ${cast(70, 46, 8, 104, 0.35)}
    <path d="M0 0h${len}v16H0Z" fill="${barrel}" stroke="${INK}" stroke-width="3"/>
    <path d="M4 3h${len - 8}" stroke="#fff" stroke-opacity=".35" stroke-width="2.4"/>
    ${rod ? `<path d="M6 19h${len - 16}v6H6Z" fill="${barrel}" stroke="${INK}" stroke-width="2.4"/>` : ''}
    <path d="M${len - 4} -3h10v22h-10Z" fill="url(#steel)" stroke="${INK}" stroke-width="2.4"/>
    <path d="M${len + 4} 1L${len + 12} 1" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M-34-6h40v30h-40Z" fill="${frame}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="-14" cy="9" r="14" fill="url(#iron)" stroke="${INK}" stroke-width="3"/>
    ${Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return `<circle cx="${f(-14 + Math.cos(a) * 8)}" cy="${f(9 + Math.sin(a) * 8)}" r="2.6" fill="#0d0603"/>`;
  }).join('')}
    <path d="M-34 20C-44 46-40 62-26 68L-2 60C-12 48-14 34-12 22Z" fill="url(#wood)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-30 28C-36 46-34 56-26 60" stroke="#3e2010" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M2 22C2 34 8 38 16 38" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M6 24C6 32 10 34 15 34" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    ${lever ? `<path d="M-6 26C10 44 26 44 40 32" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` : ''}
    ${rim(`M-2-4h${len - 2}`, 2, '#fff', 0.35)}
    ${rim('M-32-4h36', 2, '#fff', 0.3)}
  </g>`;
}

function rifle({ len, receiver, lever }) {
  return `<g transform="translate(24 96) rotate(-7)">
    ${cast(110, 66, 8, 108, 0.3)}
    <path d="M60 2h${len}v13H60Z" fill="url(#blued)" stroke="${INK}" stroke-width="3"/>
    <path d="M64 5h${len - 8}" stroke="#fff" stroke-opacity=".32" stroke-width="2"/>
    <path d="M60 17h${len - 26}v9H60Z" fill="url(#wood2)" stroke="${INK}" stroke-width="2.6"/>
    <path d="M${60 + len} 0h9v17h-9Z" fill="url(#steel)" stroke="${INK}" stroke-width="2.4"/>
    <path d="M20-4h44v30H20Z" fill="${receiver}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 0h36v8H24Z" fill="#1a1f26" opacity=".45"/>
    <path d="M-38 6C-44 4-44 22-34 26L20 26V-2L-14-2C-24-2-32 2-38 6Z" fill="url(#wood)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-30 8C-36 12-36 20-30 22" stroke="#3e2010" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M30 26C30 36 36 40 44 40" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${lever ? `<path d="M22 26C16 48 40 54 58 42" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>` : ''}
    ${rim(`M62 4h${len - 6}`, 2, '#fff', 0.35)}
    ${rim('M-34 8C-40 12-40 20-32 24', 2, '#c89a5a', 0.45)}
  </g>`;
}

/* ═════════════ 배경 ═════════════ */

const SCENE_BACK = `
  <path d="M0 158L28 132L50 146L76 118L102 142L128 122L156 146L184 124L212 144L240 130V300H0Z" fill="#b9793f" opacity=".42"/>
  <path d="M0 186L34 166L62 182L92 160L124 184L154 164L188 184L216 166L240 180V300H0Z" fill="#8d5526" opacity=".5"/>`;

const SCENE_FRONT = `
  <path d="M0 262Q60 250 124 258T240 252V300H0Z" fill="url(#dirt)"/>
  <path d="M0 276Q70 268 132 274T240 270V300H0Z" fill="#5a3014" opacity=".75"/>
  <g fill="#3a1d0a" opacity=".72">
    <ellipse cx="26" cy="284" rx="15" ry="5"/><ellipse cx="206" cy="290" rx="19" ry="6"/>
    <path d="M214 272c0-8 3-13 6-13s6 5 6 13v14h-12z"/>
    <path d="M214 276c-5 0-8-4-8-9s2-6 4-6 4 3 4 8zM226 274c5 0 9-4 9-10s-2-7-4-7-4 4-4 9z"/>
  </g>`;

/**
 * 그림이 카드 한 면을 가득 채운다 (240×300).
 * mono: 무기는 실제 뱅처럼 흑백 일러스트.
 */
const art = (body, { rays = true, bg = 'url(#sky)', extraDefs = '', mono = false, lift = 30, zoom = 1.2 } = {}) => {
  const inner = `
    <rect width="240" height="300" fill="${bg}"/>
    ${rays ? sunRays(120, 110, '#fff6dc', 0.15) : ''}
    <ellipse cx="120" cy="120" rx="118" ry="90" fill="url(#glow)" opacity=".28"/>
    ${SCENE_BACK}
    <g transform="translate(120 ${lift}) scale(${zoom}) translate(-120 0)">${body}</g>
    ${SCENE_FRONT}`;
  return svg(240, 300, `
    ${mono ? `<g filter="url(#mono)">${inner}</g>` : inner}
    <rect width="240" height="300" fill="url(#vig2)"/>
    <rect width="240" height="300" filter="url(#grain)" opacity=".2"/>`, { defs: DEFS + SCENE_DEFS + extraDefs });
};

/* ═════════════ 카드 22종 ═════════════ */

const ART = {
  // 정면으로 겨눈 리볼버가 불을 뿜는다
  bang: () => art(`
    ${cast(120, 56, 9, GROUND - 6, 0.4)}
    ${dust(5, 150, 150, 8, 90)}
    <g transform="translate(6 10)">
      ${pistol({ len: 62, frame: 'url(#brass)', barrel: 'url(#blued)' })}
    </g>
    <circle cx="196" cy="96" r="44" fill="url(#flash)" opacity=".9"/>
    ${burst(196, 96, 14, 42, 18, '#ffd15a')}
    ${burst(196, 96, 10, 24, 10, '#fff8dc', 'none')}
    <path d="M168 58l-10-16M186 46l-2-20M216 52l12-16M226 84l18-6M214 132l14 14M176 132l-8 16"
      stroke="#e0621c" stroke-width="4" stroke-linecap="round" opacity=".85"/>`),

  // 총알이 모자를 스치고 지나간다
  missed: () => art(`
    ${cast(122, 58, 10, GROUND - 4, 0.4)}
    <path d="M4 74L128 52" stroke="#fff3cf" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    <path d="M4 74L128 52" stroke="${INK}" stroke-width="2" stroke-dasharray="9 7" opacity=".7"/>
    <g transform="translate(0 10)">
      ${outline('M60 116C56 62 88 44 122 54C156 44 188 62 184 116Z', 'url(#leatherBrown)')}
      ${shade('M122 56C112 74 110 98 116 116L92 116C86 92 92 66 106 54Z', 0.22)}
      ${outline('M62 98C92 110 152 110 182 98L184 118C154 130 90 130 60 118Z', '#3a2416')}
      ${outline('M10 124C32 100 92 120 122 120C152 120 212 100 234 124C212 148 152 150 122 150C92 150 32 148 10 124Z', 'url(#wood2)')}
      ${rim('M64 106C58 68 86 50 118 58', 2.6)}
      ${rim('M16 122C40 106 88 118 120 118', 2.4)}
      <path d="M30 128C62 140 182 140 214 128" stroke="#f6d8a8" stroke-width="2.4" opacity=".45" fill="none"/>
    </g>
    <circle cx="140" cy="60" r="8" fill="#140a04" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="137" cy="57" r="2.6" fill="#8a5a28" opacity=".8"/>
    ${dust(9, 150, 66, 6, 44)}`),

  // 거품 넘치는 맥주잔
  beer: () => art(`
    ${cast(120, 44, 8, GROUND, 0.45)}
    <g transform="translate(0 6)">
      ${outline('M74 74h84v104c0 10-8 16-18 16H92c-10 0-18-6-18-16Z', 'url(#beerGold)')}
      ${shade('M132 74h26v104c0 10-8 16-18 16h-18c10 0 10-6 10-16Z', 0.22)}
      ${outline('M158 96c22-6 32 8 30 26c-2 18-16 26-30 22Z', 'url(#glassBlue)', 2.6)}
      <path d="M86 92v84M104 96v76" stroke="#fff6d0" stroke-width="3" opacity=".45" stroke-linecap="round"/>
      ${outline('M70 74c0-20 20-30 46-30s46 10 46 30c0 8-12 6-20 10c-10 5-16-2-26-2s-16 7-26 2c-8-4-20-2-20-10Z', '#fff8e4', 3)}
      ${rim('M76 62c6-10 24-16 44-16', 3, '#fff', 0.75)}
      <circle cx="98" cy="122" r="5" fill="#fff6d0" opacity=".55"/>
      <circle cx="122" cy="146" r="4" fill="#fff6d0" opacity=".5"/>
      <circle cx="112" cy="104" r="3.4" fill="#fff6d0" opacity=".5"/>
      <circle cx="136" cy="128" r="3" fill="#fff6d0" opacity=".45"/>
    </g>`),

  // 남의 카드를 낚아채는 손
  panic: () => art(`
    ${cast(126, 54, 9, GROUND, 0.38)}
    <g transform="translate(150 118) rotate(14)">
      ${outline('M-34-56h54v76h-54Z', '#f2e2be', 2.6)}
      ${outline('M-30-52h46v22h-46Z', '#b3261e', 2)}
    </g>
    <g transform="translate(108 108) rotate(-10)">
      ${outline('M-36-58h56v78h-56Z', '#fbf1d8', 3)}
      <path d="M-26-46h36M-26-36h28M-26-26h34" stroke="#8a6a44" stroke-width="3" stroke-linecap="round"/>
      ${rim('M-34-56h52', 2.4, '#fff', 0.8)}
    </g>
    <g transform="translate(66 132)">
      ${outline('M-24 46C-34 24-32 2-18-8C-10-14 0-12 4-4C10-14 22-14 26-4C32-12 44-8 44 4C44 22 34 44 18 52C6 58-14 60-24 46Z', 'url(#leatherBrown)')}
      ${rim('M-16-6C-8-12 0-10 4-2', 2.6)}
      <path d="M4-4C10 6 14 14 14 24M24-2C28 8 30 16 28 26M40 2C42 12 40 20 36 26" stroke="${INK}" stroke-width="2.4" fill="none" opacity=".55"/>
      ${shade('M-20 40C-8 54 10 54 22 46C10 58-12 58-20 40Z', 0.3)}
    </g>
    ${dust(3, 150, 150, 6, 70)}`),

  // 손에서 뜯겨 날아가는 카드
  catbalou: () => art(`
    ${cast(120, 56, 9, GROUND, 0.34)}
    ${[[-34, -18, 72, 0.9], [26, 6, -20, 1], [96, -30, 34, 0.8], [148, 22, -46, 0.95], [176, -14, 18, 0.75]]
    .map(([x, y, a, s], i) => `<g transform="translate(${x + 40} ${y + 96}) rotate(${a}) scale(${s})">
        ${outline('M0 0h50v70H0Z', i % 2 ? '#fbf1d8' : '#f0dfb8', 3)}
        <path d="M8 10h34M8 20h26" stroke="#8a6a44" stroke-width="3" stroke-linecap="round" opacity=".8"/>
        ${rim('M0 0h48', 2.2, '#fff', 0.7)}
      </g>`).join('')}
    <path d="M18 52C46 34 84 30 118 40M210 150C180 166 140 168 108 158"
      stroke="#e8d2a4" stroke-width="3" stroke-linecap="round" fill="none" opacity=".5" stroke-dasharray="10 8"/>
    ${dust(11, 120, 120, 8, 120)}`),

  // 말 두 마리가 끄는 역마차
  stagecoach: () => art(`
    ${cast(130, 92, 10, GROUND + 2, 0.4)}
    ${dust(13, 60, 180, 10, 120)}
    ${horse(48, 152, 1.05)}
    ${horse(86, 158, 0.92)}
    <g transform="translate(120 108)">
      ${outline('M0 0h96v58H0Z', 'url(#wood2)')}
      ${outline('M-8-8h112v16H-8Z', '#6a3a18', 2.6)}
      ${outline('M12 10h30v26H12ZM56 10h30v26H56Z', '#2a1608', 2.4)}
      <path d="M16 14h22v18H16Z" fill="#8a6a44" opacity=".35"/>
      ${rim('M0 2h92', 2.4, '#e8b878', 0.6)}
      <circle cx="20" cy="66" r="18" fill="none" stroke="${INK}" stroke-width="4"/>
      ${spokes(20, 66, 16)}
      <circle cx="76" cy="68" r="22" fill="none" stroke="${INK}" stroke-width="4.5"/>
      ${spokes(76, 68, 20)}
    </g>`),

  // 웰스파고 현금 상자
  wellsfargo: () => art(`
    ${cast(122, 64, 10, GROUND, 0.45)}
    <g transform="translate(58 92)">
      ${outline('M0 28h124v74H0Z', 'url(#wood)')}
      ${outline('M-6 4h136v26H-6Z', 'url(#wood2)', 3)}
      ${outline('M0 28h124v10H0Z', '#4a2612', 2)}
      <path d="M-2 10h128M0 92h124" stroke="url(#brass)" stroke-width="6" stroke-linecap="round"/>
      ${outline('M50 50h24v26H50Z', 'url(#brass)', 2.6)}
      <circle cx="62" cy="60" r="5" fill="#2a1608"/>
      <path d="M62 62v10" stroke="#2a1608" stroke-width="3.4" stroke-linecap="round"/>
      <text x="62" y="92" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="17" fill="#f0d8a0" opacity=".9">W.F.&amp;Co.</text>
      ${rim('M-4 8h130', 2.6, '#ffe0a0', 0.6)}
    </g>
    ${[[42, 176, -14], [186, 172, 12], [30, 158, 26]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})">
      <circle r="11" fill="url(#brass)" stroke="${INK}" stroke-width="2.4"/><circle r="6" fill="none" stroke="#6e4a12" stroke-width="1.6"/></g>`).join('')}`),

  // 개틀링이 불을 뿜는다
  gatling: () => art(`
    ${cast(122, 72, 10, GROUND + 2, 0.45)}
    <g transform="translate(46 96)">
      <circle cx="30" cy="70" r="24" fill="none" stroke="${INK}" stroke-width="4.5"/>
      ${spokes(30, 70, 22)}
      ${outline('M18 22h44v44H18Z', 'url(#iron)')}
      ${outline('M56 26h20v34H56Z', 'url(#brass)', 2.6)}
      ${[0, 1, 2, 3].map((i) => `<path d="M72 ${30 + i * 9}h58v7H72Z" fill="url(#blued)" stroke="${INK}" stroke-width="2.2"/>`).join('')}
      ${outline('M126 24h12v50h-12Z', 'url(#steel)', 2.6)}
      <path d="M22 62C8 76 4 96 10 112" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="10" cy="44" r="10" fill="url(#brass)" stroke="${INK}" stroke-width="2.6"/>
      ${rim('M20 24h40', 2.4, '#fff', 0.35)}
    </g>
    <circle cx="188" cy="136" r="34" fill="url(#flash)" opacity=".85"/>
    ${burst(188, 136, 12, 30, 13, '#ffd15a')}
    ${[[196, 62], [214, 86], [178, 52]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${30 + i * 40})">
      <rect x="-3" y="-8" width="6" height="16" rx="2" fill="url(#brass)" stroke="${INK}" stroke-width="1.6"/></g>`).join('')}`),

  // 화살이 비처럼 쏟아진다
  indians: () => art(`
    ${cast(120, 66, 9, GROUND, 0.3)}
    ${[[30, 34, 34], [92, 20, 42], [154, 40, 30], [56, 92, 38], [126, 84, 44], [188, 70, 32], [20, 140, 40], [96, 148, 36], [166, 134, 42]]
    .map(([x, y, a], i) => arrow(x + 20, y + 16, a, i)).join('')}
    <path d="M6 20C40 8 80 6 118 14" stroke="#fff3cf" stroke-width="3" opacity=".35" fill="none"/>
    ${dust(17, 120, 176, 10, 160)}`),

  // 등지고 선 두 총잡이
  duel: () => art(`
    ${cast(66, 26, 7, GROUND, 0.45)}
    ${cast(176, 26, 7, GROUND, 0.45)}
    ${gunslinger(66, 132, 1.18, false)}
    ${gunslinger(176, 132, 1.18, true)}
    <path d="M104 118h34" stroke="${INK}" stroke-width="3" stroke-dasharray="7 6" opacity=".55"/>
    <circle cx="121" cy="118" r="13" fill="none" stroke="#c8322a" stroke-width="3.4"/>
    <path d="M121 100v-9M121 145v9M103 118h-9M148 118h9" stroke="#c8322a" stroke-width="3.4" stroke-linecap="round"/>
    ${dust(19, 120, 186, 8, 170)}`),

  // 잡화점 진열대
  store: () => art(`
    ${cast(120, 88, 10, GROUND + 2, 0.4)}
    <g transform="translate(40 76)">
      ${outline('M0 30h160v92H0Z', 'url(#wood)')}
      ${outline('M-10 6h180v26H-10Z', '#7a3a18', 3)}
      <text x="80" y="26" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="17" fill="#f6dfaa">GENERAL STORE</text>
      ${[0, 1].map((row) => `<path d="M6 ${62 + row * 32}h148" stroke="${INK}" stroke-width="3.4"/>`).join('')}
      ${[[18, 56], [46, 56], [76, 56], [110, 56], [140, 56]].map(([x, y], i) => `<rect x="${x}" y="${y - 22}" width="18" height="24" rx="3" fill="${['#b3261e', '#e8a418', '#3a7a4a', '#8a5a28', '#c8322a'][i]}" stroke="${INK}" stroke-width="2.2"/>`).join('')}
      ${[[24, 88], [58, 88], [96, 88], [132, 88]].map(([x, y], i) => `<rect x="${x}" y="${y - 20}" width="22" height="22" rx="3" fill="${['#d8a93c', '#7a4424', '#9ccaf0', '#e8d8b0'][i]}" stroke="${INK}" stroke-width="2.2"/>`).join('')}
      ${rim('M-8 8h176', 2.6, '#ffd8a0', 0.55)}
    </g>`),

  // 살롱 스윙도어
  saloon: () => art(`
    ${cast(120, 74, 10, GROUND + 2, 0.4)}
    <g transform="translate(48 66)">
      ${outline('M-8 0h160v20H-8Z', '#7a3a18', 3)}
      <text x="72" y="16" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="16" fill="#f6dfaa">SALOON</text>
      ${outline('M0 24h68v96H0Z', 'url(#wood2)')}
      ${outline('M76 24h68v96H76Z', 'url(#wood2)')}
      ${[0, 1, 2].map((i) => `<path d="M6 ${44 + i * 26}h56M82 ${44 + i * 26}h56" stroke="${INK}" stroke-width="3"/>`).join('')}
      <path d="M68 24v96M76 24v96" stroke="${INK}" stroke-width="3"/>
      ${rim('M2 26h64', 2.4, '#e8b878', 0.5)}
      <path d="M0 122h144" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    </g>
    ${[[78, 172], [120, 176], [162, 172]].map(([x, y]) => `<g transform="translate(${x} ${y})">
      <path d="M-9-18h18l-3 20h-12Z" fill="url(#beerGold)" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-9-18h18" stroke="#fff8e4" stroke-width="3.4"/></g>`).join('')}`),

  // 참나무 술통
  barrel: () => art(`
    ${cast(120, 52, 9, GROUND, 0.45)}
    <g transform="translate(120 122)">
      ${outline('M-46-56C-58-22-58 22-46 56C-24 68 24 68 46 56C58 22 58-22 46-56C24-68-24-68-46-56Z', 'url(#wood2)')}
      ${[-56, -18, 20, 56].map((y, i) => `<path d="M${i === 0 || i === 3 ? -47 : -57} ${y}C-20 ${y + (i === 0 ? -10 : i === 3 ? 10 : 0)} 20 ${y + (i === 0 ? -10 : i === 3 ? 10 : 0)} ${i === 0 || i === 3 ? 47 : 57} ${y}" fill="none" stroke="url(#iron)" stroke-width="8"/>
        <path d="M${i === 0 || i === 3 ? -47 : -57} ${y}C-20 ${y + (i === 0 ? -10 : i === 3 ? 10 : 0)} 20 ${y + (i === 0 ? -10 : i === 3 ? 10 : 0)} ${i === 0 || i === 3 ? 47 : 57} ${y}" fill="none" stroke="${INK}" stroke-width="2"/>`).join('')}
      <path d="M-22-62C-26-20-26 20-22 62M0-64V64M22-62C26-20 26 20 22 62" stroke="${INK}" stroke-width="2.4" opacity=".55" fill="none"/>
      ${shade('M18-62C26-20 26 20 18 62C32 60 42 58 46 56C58 22 58-22 46-56C42-58 32-60 18-62Z', 0.26)}
      ${rim('M-44-54C-54-24-54 18-44 50', 3)}
      <circle cx="-4" cy="4" r="9" fill="#3a2010" stroke="${INK}" stroke-width="2.6"/>
      <path d="M-4 4h16" stroke="url(#brass)" stroke-width="6" stroke-linecap="round"/>
    </g>`),

  // 놋쇠 망원경
  scope: () => art(`
    ${cast(120, 60, 9, GROUND, 0.4)}
    <g transform="translate(120 120) rotate(-16)">
      ${outline('M-72-16h56v32h-56Z', 'url(#brass)')}
      ${outline('M-18-21h44v42h-44Z', 'url(#brass)')}
      ${outline('M24-26h40v52H24Z', 'url(#brass)')}
      ${outline('M62-30h14v60H62Z', 'url(#steel)', 2.6)}
      <path d="M-70-10h52M-16-15h40M26-20h36" stroke="#fff6d0" stroke-width="3.4" opacity=".55"/>
      <path d="M-20-21v42M22-26v52" stroke="${INK}" stroke-width="3"/>
      ${shade('M-72 6h56v10h-56ZM-18 10h44v11h-44ZM24 14h40v12H24Z', 0.24)}
      <ellipse cx="69" cy="0" rx="5" ry="26" fill="#0d1a22" stroke="${INK}" stroke-width="2.4"/>
      <ellipse cx="69" cy="-9" rx="2.4" ry="8" fill="#9ccaf0" opacity=".65"/>
    </g>
    <g stroke="#c8322a" stroke-width="3" opacity=".8" fill="none">
      <circle cx="190" cy="66" r="17"/><path d="M190 42v-8M190 90v8M166 66h-8M214 66h8"/>
    </g>`),

  // 앞발 든 야생마
  mustang: () => art(`
    ${cast(122, 62, 9, GROUND + 2, 0.4)}
    ${dust(23, 120, 180, 12, 140)}
    <g transform="translate(126 156) scale(1.55)">
      <path d="M-30-8C-26-22-6-26 14-22C26-20 34-14 36-4C38 6 30 12 20 12L-18 12C-30 12-34 2-30-8Z" fill="url(#leatherBrown)" stroke="${INK}" stroke-width="3"/>
      <path d="M-24-14L-44-42L-52-40L-60-30L-55-23L-44-26L-30-4Z" fill="url(#leatherBrown)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-48-42l-2-10 7 6z" fill="${INK}"/>
      <path d="M-22 6L-44 2L-52-8M-6 8L-30 8L-38 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M16 12L24 34L32 32M28 10L40 30L46 26" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M34-8C50-14 58 2 52 16" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M-30-30C-22-38-12-36-10-24M-24-26C-18-32-12-31-10-24" stroke="#2a1408" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      ${rim('M-28-12C-22-22-4-24 12-20', 2.4)}
      ${rim('M-42-40L-56-30', 2)}
    </g>`),

  // 창살 너머
  jail: () => art(`
    ${cast(120, 66, 9, GROUND + 4, 0.4)}
    <g transform="translate(58 66)">
      ${outline('M-12-8h148v136H-12Z', '#4a2a14')}
      ${outline('M0 4h124v112H0Z', '#150c06', 3)}
      ${[0, 1, 2, 3].map((i) => `<rect x="${12 + i * 30}" y="0" width="11" height="120" rx="3" fill="url(#iron)" stroke="${INK}" stroke-width="2.4"/>`).join('')}
      <rect x="-8" y="30" width="140" height="10" rx="3" fill="url(#iron)" stroke="${INK}" stroke-width="2.4"/>
      <rect x="-8" y="82" width="140" height="10" rx="3" fill="url(#iron)" stroke="${INK}" stroke-width="2.4"/>
      ${rim('M14 2v114', 2.2, '#dfe6ee', 0.4)}
      ${rim('M-6 32h136', 2, '#dfe6ee', 0.35)}
      <circle cx="92" cy="60" r="7" fill="#f6dfaa" opacity=".5"/>
      <circle cx="108" cy="60" r="7" fill="#f6dfaa" opacity=".5"/>
    </g>
    <g transform="translate(196 168) rotate(18)">
      <circle r="13" fill="none" stroke="url(#brass)" stroke-width="5"/>
      <path d="M0 13v24M-7 26h14M-7 34h10" stroke="url(#brass)" stroke-width="5" stroke-linecap="round"/>
    </g>`),

  // 심지에 불붙은 다이너마이트 묶음
  dynamite: () => art(`
    ${cast(118, 46, 8, GROUND, 0.45)}
    <g transform="translate(88 92)">
      ${[0, 1, 2, 3].map((i) => `<g transform="translate(${i * 17} ${i % 2 ? 5 : 0})">
        ${outline('M0 0h16v96H0Z', 'url(#dyn)', 2.6)}
        <path d="M3 8h10M3 88h10" stroke="#5e1008" stroke-width="3"/>
        ${i === 0 ? rim('M1 2v92', 2.2, '#ff9a86', 0.6) : ''}
      </g>`).join('')}
      ${outline('M-6 32h76v14H-6Z', '#6a4424', 2.4)}
      ${outline('M-6 62h76v14H-6Z', '#6a4424', 2.4)}
      <path d="M26 0C22-22 40-34 52-26" fill="none" stroke="#3e2010" stroke-width="4.5" stroke-linecap="round"/>
    </g>
    <circle cx="148" cy="62" r="24" fill="url(#glow)"/>
    ${burst(148, 62, 10, 20, 8, '#ffd15a', 'none')}
    ${burst(148, 62, 8, 11, 5, '#fff8dc', 'none')}
    <path d="M140 44l-4-12M158 46l8-10M164 66l14-2" stroke="#ffb040" stroke-width="3" stroke-linecap="round" opacity=".75"/>`),

  // 무기 5종 - 실제 뱅처럼 흑백
  volcanic: () => art(pistol({ len: 58, frame: 'url(#brass)', barrel: 'url(#blued)', lever: true }), { mono: true }),
  schofield: () => art(pistol({ len: 76, frame: 'url(#steel)', barrel: 'url(#steel)' }), { mono: true }),
  remington: () => art(pistol({ len: 96, frame: 'url(#blued)', barrel: 'url(#blued)', rod: true }), { mono: true }),
  carabine: () => art(rifle({ len: 78, receiver: 'url(#blued)', lever: false }), { mono: true }),
  winchester: () => art(rifle({ len: 104, receiver: 'url(#brass)', lever: true }), { mono: true }),
};

/* ═════════════ 테두리 · 총알 구멍 · 뒷면 ═════════════ */

function frame(kind) {
  const blue = kind === 'blue';
  const c = blue ? ['#2f6d9a', '#0d2a45', '#9ccaf0'] : ['#8a5228', '#3a2210', '#f0c080'];
  const r = rng(blue ? 11 : 7);
  const scuff = Array.from({ length: 7 }, () => `<ellipse cx="${f(12 + r() * 226)}" cy="${f(12 + r() * 326)}" rx="${f(8 + r() * 26)}" ry="${f(4 + r() * 12)}" fill="#000" opacity=".06"/>`).join('');
  return svg(250, 350, `
    <rect width="250" height="350" rx="14" fill="url(#edge)"/>
    ${scuff}
    <rect width="250" height="350" rx="14" fill="#000" filter="url(#grain)" opacity=".16"/>
    <rect x="3.5" y="3.5" width="243" height="343" rx="12" fill="none" stroke="${c[2]}" stroke-opacity=".4" stroke-width="1.5"/>
    <rect x="9" y="9" width="232" height="332" rx="9" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1"/>
    <rect x="15" y="15" width="220" height="255" fill="#1a0e05"/>
    <rect x="15" y="15" width="220" height="255" fill="none" stroke="${INK}" stroke-width="2.5"/>
    <rect x="15" y="276" width="220" height="44" rx="4" fill="url(#plate)" stroke="${INK}" stroke-width="2"/>
    <path d="M22 281H228M22 315H228" stroke="${c[2]}" stroke-opacity=".35" stroke-width="1"/>
    ${[[24, 332], [226, 332]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="url(#brass)" stroke="${INK}" stroke-width="1.2"/>`).join('')}`, {
    defs: DEFS + lin('edge', [[0, c[0]], [0.55, c[1]], [1, c[0]]], 0, 0, 1, 1) + lin('plate', [[0, c[0]], [1, c[1]]]),
  });
}

/** 갈색 카드에만 있는 총알 구멍 (파란 테두리 카드에는 없다) */
function bulletHoles() {
  const r = rng(29);
  const spots = [[27, 63], [223, 121], [21, 214], [229, 247], [46, 300], [204, 41]];
  const body = spots.map(([x, y]) => {
    const rot = f(r() * 360);
    const rr = f(4.4 + r() * 1.8);
    const cracks = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 + r();
      const d = rr + 1.5 + r() * 3.5;
      return `<path d="M${f(Math.cos(a) * rr * 0.8)} ${f(Math.sin(a) * rr * 0.8)}L${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)}" stroke="#0d0603" stroke-width="1.4" stroke-linecap="round" opacity=".75"/>`;
    }).join('');
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      <ellipse rx="${f(rr + 3.4)}" ry="${f(rr + 2.6)}" fill="#000" opacity=".28"/>
      <ellipse rx="${rr}" ry="${f(rr * 0.86)}" fill="#0d0603"/>
      <path d="M${f(-rr - 2)} 0A${f(rr + 2)} ${f(rr + 1.6)} 0 0 1 ${f(rr + 2)} 0" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.3"/>
      ${cracks}
    </g>`;
  }).join('');
  return svg(250, 350, body);
}

function cardBack() {
  const r = rng(21);
  const holes = Array.from({ length: 5 }, () => [f(40 + r() * 170), f(70 + r() * 220)]);
  return svg(250, 350, `
    <rect width="250" height="350" rx="14" fill="url(#leather)"/>
    <rect width="250" height="350" rx="14" fill="#000" filter="url(#grain)" opacity=".3"/>
    ${sunRays(125, 175, '#f0c080', 0.08)}
    <rect x="10" y="10" width="230" height="330" rx="9" fill="none" stroke="#e0b070" stroke-width="3"/>
    <rect x="18" y="18" width="214" height="314" rx="6" fill="none" stroke="#e0b070" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="6 4"/>
    <circle cx="125" cy="160" r="64" fill="#2a1408" stroke="#e0b070" stroke-width="4"/>
    ${Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${f(125 + Math.cos(a) * 36)}" cy="${f(160 + Math.sin(a) * 36)}" r="13" fill="#140a04" stroke="#b8864a" stroke-width="3"/>`; }).join('')}
    <circle cx="125" cy="160" r="8" fill="#b8864a"/>
    <text x="125" y="270" text-anchor="middle" font-family="Impact, 'Arial Black', Georgia, sans-serif" font-size="54" letter-spacing="2" fill="#c8322a" stroke="#140a04" stroke-width="3" paint-order="stroke">BANG!</text>
    ${holes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#050201"/>`).join('')}`, {
    defs: DEFS + rad('leather', [[0, '#7a3a1a'], [0.7, '#3e1a0a'], [1, '#1e0a04']], 0.5, 0.45, 0.75),
  });
}

module.exports = { ART, frame, bulletHoles, cardBack, suitShape, burst, sunRays, INK, DEFS, art };
