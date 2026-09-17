'use strict';
// 게임 상자 앞면 그림: 폭풍우 치는 밤, 큰 창 앞에 선 여섯 용의자 (역광 실루엣 한 장면)
const { svg, lin, rad, grainFilter, blur, rng, f } = require('./lib');

const W = 760;
const H = 544;
const WIN = { x: 400, top: 40, w: 150, bottom: 360 }; // 뒤쪽 큰 창 (가운데 x)

// 색 섞기
function mix(a, b, t) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/* ── 사람 모양 (발 = 0,0 · 키 100) */
const SHAPES = {
  coat: 'M-6 -79C-13 -78 -18 -74 -19 -66L-22 -37C-22 -34 -18 -34 -17 -36L-15 -56L-15 -28L-14 -1H-3L-1 -38H1L3 -1H14L15 -28L15 -56L17 -36C18 -34 22 -34 22 -37L19 -66C18 -74 13 -78 6 -79Z',
  dress: 'M-6 -79C-13 -78 -16 -73 -16 -66L-18 -40C-18 -37 -15 -37 -14 -39L-12 -56L-11 -46C-16 -30 -22 -12 -25 0H25C22 -12 16 -30 11 -46L12 -56L14 -39C15 -37 18 -37 18 -40L16 -66C16 -73 13 -78 6 -79Z',
  head: 'M-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z',
};

function figure(o) {
  const { id, x, y, s, shape, color, lightDir, extra = '', over = '', glow } = o;
  const dark = mix(color, '#05070e', 0.82);
  const lit = mix(color, '#cfe0ff', 0.4);
  const body = SHAPES[shape];
  const cid = `clip-${id}`;
  const dx = -lightDir * 1.7;
  // 몸 + 소품을 한 덩어리로 (같은 좌표계)
  const solid = `<path d="${body}"/><path d="${SHAPES.head}"/>${extra}`;
  // 바닥에 드리운 긴 그림자 (창 빛이 사람 앞쪽으로 떨어진다)
  const shadow = `<g transform="translate(${x} ${y}) scale(${s * 0.8} ${-s * 0.32}) skewX(${-lightDir * 38})" fill="#02040a" opacity=".55" filter="url(#soft)">${solid}</g>`;
  return `${shadow}
  <g transform="translate(${x} ${y}) scale(${s * 0.8} ${s})">
    <defs><clipPath id="${cid}">${solid}</clipPath></defs>
    <g fill="${lit}">${solid}</g>
    <g clip-path="url(#${cid})">
      <g fill="${dark}" transform="translate(${dx} 0.6)">${solid}</g>
      <rect x="-40" y="-110" width="80" height="112" fill="url(#bodyFade)"/>
      ${glow ? `<circle cx="${glow.x}" cy="${glow.y}" r="${glow.r}" fill="url(#candleLight)"/>` : ''}
    </g>
    ${over}
  </g>`;
}

/* ── 인물별 소품 (몸과 같은 좌표계, fill은 부모 색을 따른다) */
const PEOPLE = [
  // 서화백: 베레모, 팔레트, 긴 머리
  {
    id: 'seo', x: 92, y: 478, s: 2.62, shape: 'coat', color: '#8e5bc4', lightDir: 1,
    extra: '<path d="M-10 -94C-12 -101 2 -104 10 -99C12 -97 10 -94 6 -94Z"/><path d="M-7 -88C-9 -82 -9 -78 -6 -75L-4 -80Z"/><path d="M19 -46C27 -50 34 -46 33 -40C32 -35 24 -34 20 -37C23 -40 22 -44 19 -46Z"/>',
    over: '<circle cx="28" cy="-42" r="1.3" fill="#e8c040"/><circle cx="31" cy="-39" r="1.2" fill="#c84040"/><circle cx="26" cy="-38" r="1.2" fill="#4a90d0"/><path d="M-4 -77L-8 -60L-3 -70L0 -58L2 -70L6 -62L4 -77Z" fill="#8e5bc4" opacity=".9"/>',
  },
  // 강대령: 군모, 견장, 지팡이
  {
    id: 'kang', x: 196, y: 490, s: 2.86, shape: 'coat', color: '#e2b23a', lightDir: 1,
    extra: '<path d="M-10 -93C-10 -100 10 -100 10 -93L12 -91H-12Z"/><path d="M-22 -68H-14V-65H-22Z M14 -68H22V-65H14Z"/><path d="M21 -38L23 -38L25 0L23 0Z"/><path d="M-7 -83C-4 -80 4 -80 7 -83L5 -81C2 -79 -2 -79 -5 -81Z"/>',
    over: '<path d="M-12 -91H12" stroke="#e2b23a" stroke-width="1.2"/><path d="M-22 -67H-14 M14 -67H22" stroke="#e2b23a" stroke-width="1.6"/><circle cx="-4" cy="-60" r="1" fill="#e2b23a"/><circle cx="-4" cy="-52" r="1" fill="#e2b23a"/><circle cx="-4" cy="-44" r="1" fill="#e2b23a"/><circle cx="3.5" cy="-89" r="1.6" fill="none" stroke="#f4e0a0" stroke-width=".5"/>',
  },
  // 한여사: 물결 단발, 붉은 드레스, 긴 담뱃대
  {
    id: 'han', x: 298, y: 474, s: 2.74, shape: 'dress', color: '#d8433b', lightDir: 1,
    extra: '<path d="M-9 -88C-11 -99 9 -101 9 -90C10 -86 8 -83 7 -82C8 -86 6 -92 0 -92C-5 -92 -7 -88 -7 -84C-9 -85 -9 -86 -9 -88Z"/><path d="M-10 -95C-8 -99 -3 -100 0 -99L-2 -96Z"/><path d="M-17 -44L-26 -64L-25 -65L-15 -46Z"/>',
    over: '<path d="M-26 -65l-2 -3" stroke="#ffb070" stroke-width="1.4" stroke-linecap="round"/><path d="M-28 -69c-2 -5 2 -8 -1 -14c-2 -4 1 -7 0 -10" stroke="#aab4c8" stroke-width=".6" fill="none" opacity=".6"/><path d="M-15 -70C-8 -64 8 -64 15 -70C12 -64 6 -61 0 -61C-6 -61 -12 -64 -15 -70Z" fill="#d8433b" opacity=".85"/><circle cx="3" cy="-80" r=".9" fill="#f4f0e0"/><circle cx="-3" cy="-80" r=".9" fill="#f4f0e0"/>',
  },
  // 백집사: 연미복, 흰 장갑, 촛대 (얼굴을 촛불이 비춘다) · 맨 앞 가운데
  {
    id: 'baek', x: 404, y: 514, s: 3.12, shape: 'coat', color: '#e9e4d8', lightDir: -1,
    extra: '<path d="M-6 -89C-7 -96 7 -96 7 -90L6 -93C2 -95 -3 -95 -6 -89Z"/><path d="M-15 -28L-19 -8H-13L-11 -26Z M15 -28L19 -8H13L11 -26Z"/><path d="M-19 -50L-24 -54L-20 -56L-15 -52Z"/><path d="M-26 -54H-18V-52H-26Z"/><path d="M-23 -54V-64H-21V-54Z"/>',
    over: '<path d="M-3 -78L0 -70L3 -78Z" fill="#f4f0e4"/><path d="M-2 -76L0 -78L2 -76L0 -74Z" fill="#101010"/><circle cx="-22" cy="-53" r="2" fill="#f4f0e4"/><circle cx="18" cy="-37" r="2" fill="#f4f0e4"/><path d="M-22 -64C-24 -67 -22 -71 -22 -73C-20 -70 -20 -67 -22 -64Z" fill="#ffd26a"/><path d="M-22 -65C-23 -67 -22 -69 -22 -70C-21 -68 -21 -67 -22 -65Z" fill="#fff6d0"/>',
    glow: { x: -20, y: -68, r: 34 },
  },
  // 오박사: 챙 넓은 모자, 조끼, 화분
  {
    id: 'oh', x: 516, y: 480, s: 2.7, shape: 'coat', color: '#4fa35a', lightDir: -1,
    extra: '<path d="M-15 -92C-9 -94 -8 -101 0 -101C8 -101 9 -94 15 -92C8 -90 -8 -90 -15 -92Z"/><path d="M-24 -40H-14L-15 -32H-23Z"/><path d="M-19 -40C-24 -48 -26 -54 -22 -58C-20 -52 -19 -48 -18 -44C-16 -50 -12 -54 -9 -54C-12 -50 -15 -45 -17 -40Z"/><path d="M-6 -86H6V-84H-6Z"/>',
    over: '<path d="M-19 -40C-24 -48 -26 -54 -22 -58C-20 -52 -19 -48 -18 -44C-16 -50 -12 -54 -9 -54C-12 -50 -15 -45 -17 -40Z" fill="#4fa35a" opacity=".85"/><path d="M-6 -78L6 -78L5 -50L-5 -50Z" fill="#4fa35a" opacity=".35"/><circle cx="-3" cy="-85" r="2" fill="none" stroke="#dfe8ff" stroke-width=".6"/><circle cx="3" cy="-85" r="2" fill="none" stroke="#dfe8ff" stroke-width=".6"/>',
  },
  // 윤교수: 둥근 안경, 책, 망원경 통
  {
    id: 'yoon', x: 628, y: 494, s: 2.9, shape: 'coat', color: '#4a7fd0', lightDir: -1,
    extra: '<path d="M-8 -90C-9 -99 8 -100 8 -91C6 -95 -5 -95 -8 -90Z"/><path d="M14 -46L26 -44L25 -34L13 -36Z"/><path d="M-20 -58L-34 -86L-30 -88L-16 -60Z"/>',
    over: '<circle cx="-3" cy="-87" r="2.4" fill="#dfe8ff" opacity=".85"/><circle cx="3.2" cy="-87" r="2.4" fill="#dfe8ff" opacity=".85"/><path d="M-0.6 -87H.8" stroke="#dfe8ff" stroke-width=".5"/><path d="M14 -46L26 -44L25.6 -41L13.6 -43Z" fill="#4a7fd0"/><path d="M-6 -78L-2 -60L0 -76L2 -60L6 -78Z" fill="#4a7fd0" opacity=".6"/><path d="M-34 -86L-30 -88" stroke="#d8c890" stroke-width="1.6"/>',
  },
];

function box() {
  const r = rng(77);
  const { x: wx, top, w: ww, bottom } = WIN;
  const L = wx - ww / 2;
  const Rt = wx + ww / 2;
  const arch = `M${L} ${bottom}V${top + ww / 2}A${ww / 2} ${ww / 2} 0 0 1 ${Rt} ${top + ww / 2}V${bottom}Z`;

  /* 방 */
  let room = `<rect width="${W}" height="${H}" fill="url(#wall)"/>`;
  // 벽 판넬
  for (let i = 0; i < 8; i++) {
    const px = 12 + i * 96;
    if (px > L - 90 && px < Rt + 10) continue;
    room += `<rect x="${px}" y="120" width="76" height="210" rx="3" fill="none" stroke="#2c3a5c" stroke-width="2.5" opacity=".7"/>`;
    room += `<rect x="${px + 8}" y="128" width="60" height="194" rx="2" fill="#0e1628" opacity=".45"/>`;
  }
  // 초상화 액자 (왼쪽 벽)
  room += `<rect x="40" y="36" width="96" height="120" fill="#5a4418" stroke="#2a1e08" stroke-width="3"/>
    <rect x="50" y="46" width="76" height="100" fill="#1a1a24"/>
    <path d="M88 64C76 64 72 78 76 88C68 92 62 104 62 146H114C114 104 108 92 100 88C104 78 100 64 88 64Z" fill="#2a2a38"/>`;
  // 창 (폭풍 하늘 + 번개 + 빗줄기)
  room += `<path d="${arch}" fill="#0a1020" transform="translate(0 -6) scale(1 1)" stroke="#1a2438" stroke-width="16"/>`;
  room += `<g clip-path="url(#winClip)">
    <rect x="${L}" y="${top}" width="${ww}" height="${bottom - top}" fill="url(#storm)"/>
    <path d="M${wx + 24} ${top}L${wx + 6} ${top + 70}L${wx + 20} ${top + 74}L${wx - 12} ${top + 160}L${wx - 2} ${top + 164}L${wx - 30} ${top + 250}" fill="none" stroke="#f4f8ff" stroke-width="3.2" stroke-linejoin="bevel" filter="url(#glowF)"/>
    <path d="M${wx + 6} ${top + 70}L${wx - 18} ${top + 110}M${wx - 12} ${top + 160}L${wx + 20} ${top + 196}" stroke="#dfe8ff" stroke-width="1.4" fill="none"/>
    ${Array.from({ length: 70 }, () => { const x = L + r() * ww; const y = top + r() * (bottom - top); return `<path d="M${f(x)} ${f(y)}l-4 14" stroke="#9ab0d8" stroke-width=".8" opacity=".5"/>`; }).join('')}
    <path d="M${L} ${bottom - 60}C${L + 30} ${bottom - 90} ${L + 60} ${bottom - 70} ${wx} ${bottom - 96}C${wx + 40} ${bottom - 80} ${Rt - 30} ${bottom - 100} ${Rt} ${bottom - 70}V${bottom}H${L}Z" fill="#0a1222"/>
    <path d="M${wx + 30} ${bottom - 96}l6 -40l4 10l4 -14l4 44Z" fill="#0a1222"/>
  </g>`;
  // 창살
  room += `<g stroke="#1a2438" stroke-width="6">
    <path d="M${wx} ${top}V${bottom}"/><path d="M${L} ${top + 150}H${Rt}"/><path d="M${L} ${top + 240}H${Rt}"/>
  </g>`;
  // 커튼
  room += `<path d="M${L - 34} 20C${L - 20} 120 ${L - 8} 260 ${L - 28} ${bottom + 20}H${L + 6}C${L - 2} 240 ${L + 4} 110 ${L + 14} 20Z" fill="url(#curtain)"/>`;
  room += `<path d="M${Rt + 34} 20C${Rt + 20} 120 ${Rt + 8} 260 ${Rt + 28} ${bottom + 20}H${Rt - 6}C${Rt + 2} 240 ${Rt - 4} 110 ${Rt - 14} 20Z" fill="url(#curtain)"/>`;
  room += `<path d="M${L - 50} 14H${Rt + 50}V28C${Rt} 42 ${L} 42 ${L - 50} 28Z" fill="#4a0c12"/>`;
  // 오른쪽 큰 계단과 난간
  room += `<path d="M${W} 170L640 300V${H}H${W}Z" fill="#0c1220"/>`;
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    room += `<path d="M${f(760 - (120 * (1 - t)))} ${f(170 + 130 * (1 - t) + 40 * t)}H${W}" stroke="#1e2a44" stroke-width="2"/>`;
  }
  room += `<path d="M632 300L${W} 150" stroke="#3a2814" stroke-width="7"/><path d="M634 300V420" stroke="#3a2814" stroke-width="8"/><circle cx="634" cy="298" r="7" fill="#4a3418"/>`;
  for (let i = 1; i < 8; i++) room += `<path d="M${634 + i * 16} ${f(300 - i * 13.6)}V${f(300 - i * 13.6 + 70)}" stroke="#2c1e0e" stroke-width="3"/>`;
  // 바닥 (체크 대리석, 원근)
  let floor = `<rect y="360" width="${W}" height="${H - 360}" fill="#0a0f1c"/>`;
  const VP = { x: wx, y: 250 };
  for (let row = 0; row < 7; row++) {
    const y0 = 360 + Math.pow(row / 7, 1.6) * 184;
    const y1 = 360 + Math.pow((row + 1) / 7, 1.6) * 184;
    for (let col = -12; col < 12; col++) {
      if ((row + col) % 2) continue;
      const xAt = (c, y) => VP.x + (c * 70 - 0) * ((y - VP.y) / (H - VP.y)) * 1.6;
      floor += `<path d="M${f(xAt(col, y0))} ${f(y0)}L${f(xAt(col + 1, y0))} ${f(y0)}L${f(xAt(col + 1, y1))} ${f(y1)}L${f(xAt(col, y1))} ${f(y1)}Z" fill="#1c2438"/>`;
    }
  }
  // 창빛이 바닥에 떨어진 자리
  floor += `<path d="M${L} 360H${Rt}L${Rt + 120} ${H}H${L - 120}Z" fill="url(#beam)"/>`;
  // 앞쪽 소품: 쓰러진 촛대, 돋보기, 편지
  const props = `
    <g transform="translate(560 522) rotate(-12)">
      <ellipse cx="30" cy="10" rx="46" ry="6" fill="#000" opacity=".5"/>
      <path d="M-8 -4H62L66 2H-12Z" fill="#b8902e"/><path d="M-8 -4H62" stroke="#f4d880" stroke-width="1.4"/>
      <circle cx="-14" cy="-1" r="9" fill="#a07a22"/><path d="M-20 -4a8 6 0 0 1 10 -4" stroke="#f4d880" stroke-width="1.2" fill="none"/>
      <path d="M66 -2h14v6h-14z" fill="#e8e0c8"/>
    </g>
    <g transform="translate(118 520) rotate(18)">
      <ellipse cx="4" cy="12" rx="40" ry="5" fill="#000" opacity=".45"/>
      <path d="M-26 -8L30 -14L34 8L-22 12Z" fill="#d8ccb0"/><path d="M-18 -2L22 -6M-17 3L18 0" stroke="#6a5a40" stroke-width="1"/>
      <path d="M-26 -8L2 4L30 -14" fill="none" stroke="#a89878" stroke-width="1"/>
      <circle cx="-4" cy="0" r="3" fill="#8a1c1c"/>
    </g>
    <g transform="translate(236 530) rotate(-24)">
      <path d="M16 0H48" stroke="#3a2210" stroke-width="7" stroke-linecap="round"/>
      <circle r="17" fill="#8ab0d0" opacity=".25" stroke="#c8a040" stroke-width="4"/>
      <path d="M-8 -8a11 11 0 0 1 10 -4" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>
    </g>`;

  // 인물은 뒤(발 y 작은 쪽)부터
  const people = PEOPLE.slice().sort((a, b) => a.y - b.y).map(figure).join('');

  return svg(W, H, `
    <g filter="url(#rough)">${room}${floor}</g>
    <rect width="${W}" height="${H}" fill="url(#coldLight)"/>
    <g filter="url(#roughS)">${people}</g>
    ${props}
    <rect width="${W}" height="${H}" fill="url(#vig)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".22"/>`, {
    defs: `
      <clipPath id="winClip"><path d="${arch}"/></clipPath>
      ${lin('wall', [[0, '#0c1428'], [0.6, '#16213e'], [1, '#0a1020']])}
      ${lin('storm', [[0, '#3a4c78'], [0.4, '#6a84b8'], [0.7, '#9ab4e0'], [1, '#4a5c88']])}
      ${lin('curtain', [[0, '#3a080e'], [0.4, '#7a1420'], [0.7, '#5a0e18'], [1, '#2a0408']], 0, 0, 1, 0)}
      ${lin('beam', [[0, '#9ab4e0', 0.28], [1, '#9ab4e0', 0]])}
      ${lin('bodyFade', [[0, '#000', 0], [0.7, '#000', 0], [1, '#000', 0.5]])}
      ${rad('candleLight', [[0, '#ffd88a', 0.95], [0.35, '#ffb050', 0.55], [1, '#ff8030', 0]])}
      ${rad('coldLight', [[0, '#b8ccff', 0.12], [0.5, '#6a84c8', 0.06], [1, '#000', 0]], 0.53, 0.3, 0.55)}
      ${rad('vig', [[0.5, '#000', 0], [1, '#000', 0.7]], 0.5, 0.45, 0.72)}
      ${grainFilter('grain', 0.85)}
      ${blur('soft', 1.2)}
      <filter id="glowF" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="rough" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>
      <filter id="roughS" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>`,
  });
}

module.exports = { box };
