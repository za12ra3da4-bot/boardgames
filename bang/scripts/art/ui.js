'use strict';
// UI 아이콘, 체력 탄환, 역할 카드 그림, 규칙 설명 그림, 로고
const { svg, lin, rad, drop, rng, f } = require('./lib');
const { art, burst, suitShape, INK, frame } = require('./cards');

const ICONS = {
  spade: '<path d="M12 2C18 8 22 11 22 15a4.5 4.5 0 0 1-8 2.6L15.5 22h-7l1.5-4.4A4.5 4.5 0 0 1 2 15c0-4 4-7 10-13z" fill="#000" stroke="none"/>',
  heart: '<path d="M12 21C4 15 2 11 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3-2 7-10 13z" fill="#000" stroke="none"/>',
  diamond: '<path d="M12 2l8 10-8 10-8-10z" fill="#000" stroke="none"/>',
  club: '<circle cx="12" cy="7" r="4.6" fill="#000" stroke="none"/><circle cx="6.5" cy="13.5" r="4.6" fill="#000" stroke="none"/><circle cx="17.5" cy="13.5" r="4.6" fill="#000" stroke="none"/><path d="M10.5 13h3l1.5 9h-6z" fill="#000" stroke="none"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
  star: '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z"/>',
  skull: '<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="11" r="1.5" fill="#000"/><circle cx="15" cy="11" r="1.5" fill="#000"/><path d="M10 20v-2M14 20v-2"/>',
  hat: '<path d="M2.5 16.5c4 2 15 2 19 0"/><path d="M6 16l1.4-8.2c.3-1.8 2.6-2.4 4.6-.8 2-1.6 4.3-1 4.6.8L18 16"/><path d="M6.8 12.5c3.2 1.2 7.2 1.2 10.4 0"/>',
  gun: '<path d="M3 8h15v4H9l-1 3H5l1-3H3z"/><path d="M18 8V6M9 12l1 5h3l-1-5"/>',
  shield: '<path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z"/>',
  cards: '<rect x="8" y="3" width="13" height="17" rx="2"/><path d="M5 6.5v12A2.5 2.5 0 0 0 7.5 21H16"/>',
  deck: '<rect x="4" y="6" width="14" height="16" rx="2"/><path d="M7 3h11a2 2 0 0 1 2 2v13"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v2M15 13v2M2 14h2M20 14h2"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  door: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  volume: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M23 9l-6 6M17 9l6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  play: '<path d="M7 4v16l13-8z" fill="#000"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  scroll: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.2A8 8 0 1 1 21 12z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6"/>',
  heal: '<path d="M12 21C4 15 2 11 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3-2 7-10 13z"/><path d="M12 9v6M9 12h6"/>',
  swap: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
};
const icon = (body) => svg(24, 24, `<g fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g>`);

const BULLET = svg(20, 44, `
  <defs>${lin('b', [[0, '#8a5a1a'], [0.35, '#fff0b0'], [0.6, '#d8a93c'], [1, '#6e4a12']], 0, 0, 1, 0)}${lin('c', [[0, '#6a6e76'], [0.4, '#e8ecf0'], [1, '#3a3e46']], 0, 0, 1, 0)}</defs>
  <path d="M4 18C4 8 7 2 10 2C13 2 16 8 16 18Z" fill="url(#c)" stroke="#1a120a" stroke-width="1.2"/>
  <rect x="3" y="17" width="14" height="24" rx="1.5" fill="url(#b)" stroke="#1a120a" stroke-width="1.2"/>
  <rect x="2" y="38" width="16" height="4" rx="1" fill="url(#b)" stroke="#1a120a" stroke-width="1"/>
  <path d="M5 22h10" stroke="#6e4a12" stroke-width="1"/>`);
const BULLET_EMPTY = svg(20, 44, `
  <rect x="3" y="17" width="14" height="24" rx="1.5" fill="none" stroke="#6a5a4a" stroke-width="1.4" stroke-dasharray="2 2"/>
  <path d="M4 18C4 8 7 2 10 2C13 2 16 8 16 18" fill="none" stroke="#6a5a4a" stroke-width="1.4" stroke-dasharray="2 2"/>`);

const LOGO = svg(160, 160, `
  <defs>${rad('sky', [[0, '#f8c868'], [0.55, '#c8582a'], [1, '#3a1208']], 0.5, 0.6, 0.7)}${lin('g', [[0, '#fff2c0'], [0.5, '#d8a93c'], [1, '#6e4a12']])}</defs>
  <circle cx="80" cy="80" r="76" fill="url(#sky)" stroke="#2a1408" stroke-width="5"/>
  <circle cx="80" cy="96" r="30" fill="#ffe7a0" opacity=".9"/>
  <path d="M6 108C40 98 120 98 154 108V140C130 160 30 160 6 140Z" fill="#2a1408"/>
  <path d="M26 108L34 70L40 70L42 84L50 84L52 62L58 62L62 108M118 108L122 78L128 78L132 92L138 60L142 60L146 108" fill="#2a1408"/>
  <path d="M80 18l9.4 20.5 22.4 2.6-16.6 15.2 4.6 22.1L80 67.2 60.2 78.4l4.6-22.1L48.2 41.1l22.4-2.6z" fill="url(#g)" stroke="#2a1408" stroke-width="3"/>
  <circle cx="80" cy="50" r="7" fill="#2a1408"/>`);

// ───────────────────────── 역할 카드 그림

function star(cx, cy, r, fill, stroke = INK) {
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.55 : r;
    pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`);
  }
  const tips = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r)}" r="${f(r * 0.1)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`;
  }).join('');
  return `<path d="M${pts.join('L')}Z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>${tips}`;
}

// ───────────────────────── 역할 카드 (실제 뱅 역할 카드처럼: 위 한글·영문 이름, 가운데 검은 실루엣, 아래 목표)

const KFONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const SIL = '#17110b';

/** 끝마다 구슬이 달린 보안관 별 */
function badgeStar(cx, cy, n, R, r) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r : R;
    pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`);
  }
  const balls = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `<circle cx="${f(cx + Math.cos(a) * (R + 3))}" cy="${f(cy + Math.sin(a) * (R + 3))}" r="8" fill="url(#silver)" stroke="${SIL}" stroke-width="3.4"/>`;
  }).join('');
  const hatch = Array.from({ length: 9 }, (_, i) => `<path d="M${cx + 6 + i * 6} ${cy - R}l-40 ${R * 2}" stroke="${SIL}" stroke-width="1.2" opacity=".35"/>`).join('');
  return `<g>
    <path d="M${pts.join('L')}Z" fill="url(#silver)" stroke="${SIL}" stroke-width="4.5" stroke-linejoin="round"/>
    <clipPath id="starClip"><path d="M${pts.join('L')}Z"/></clipPath>
    <g clip-path="url(#starClip)">${hatch}</g>
    ${balls}
    <circle cx="${cx}" cy="${cy}" r="${f(r * 0.72)}" fill="none" stroke="${SIL}" stroke-width="2.4"/>
  </g>`;
}

function banner(cx, cy, w, text, size) {
  return `<path d="M${cx - w / 2 - 10} ${cy - 12}H${cx + w / 2 + 10}L${cx + w / 2 + 2} ${cy}L${cx + w / 2 + 10} ${cy + 12}H${cx - w / 2 - 10}L${cx - w / 2 - 2} ${cy}Z" fill="#fbf6ea" stroke="${SIL}" stroke-width="3"/>
    <text x="${cx}" y="${cy + size * 0.36}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${size}" letter-spacing="1.5" fill="${SIL}">${text}</text>`;
}

/** 무법자: 모자 · 복면 · 긴 외투 · 비스듬한 장총 */
const OUTLAW = `<g transform="translate(0 4)">
  <path d="M74 236L176 128" stroke="${SIL}" stroke-width="6" stroke-linecap="round"/>
  <path d="M170 124l14-12 6 6-12 14z" fill="${SIL}"/>
  <path d="M66 244l18-18 8 8-16 16z" fill="${SIL}"/>
  <path d="M101 146C94 176 90 222 84 258H112L119 214L125 222L131 214L138 258H166C160 222 156 176 149 146C140 138 110 138 101 146Z" fill="${SIL}"/>
  <path d="M104 150L146 196" stroke="#fbf6ea" stroke-width="4" stroke-dasharray="3 5"/>
  <circle cx="125" cy="124" r="15" fill="${SIL}"/>
  <path d="M104 111C104 90 110 84 125 84C140 84 146 90 146 111Z" fill="${SIL}"/>
  <path d="M116 88C120 94 130 94 134 88" stroke="#fbf6ea" stroke-width="1.6" fill="none" opacity=".6"/>
  <ellipse cx="125" cy="111" rx="38" ry="7.5" fill="${SIL}"/>
  <path d="M113 121h8M129 121h8" stroke="#fbf6ea" stroke-width="3" stroke-linecap="round"/>
  <path d="M108 127H142L125 146Z" fill="${SIL}" stroke="#fbf6ea" stroke-width="1.4"/>
  <circle cx="120" cy="132" r="1.6" fill="#fbf6ea"/><circle cx="130" cy="132" r="1.6" fill="#fbf6ea"/><circle cx="125" cy="138" r="1.6" fill="#fbf6ea"/>
  <path d="M84 258h30M136 258h30" stroke="${SIL}" stroke-width="6" stroke-linecap="round"/></g>`;

/** 배신자: 챙 넓은 모자를 눌러쓴 험상궂은 얼굴 (가슴 위까지) */
const RENEGADE = `
  <path d="M104 190L100 212C80 218 62 234 56 262H194C188 234 170 218 150 212L146 190Z" fill="${SIL}"/>
  <path d="M100 206C112 216 138 216 150 206L154 222C136 234 114 234 96 222Z" fill="${SIL}" stroke="#fbf6ea" stroke-width="1.6"/>
  ${[[106, 216], [118, 222], [131, 222], [143, 216], [112, 228], [138, 228]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fbf6ea"/>`).join('')}
  <path d="M96 118C94 150 99 176 111 191C118 200 132 200 139 191C151 176 156 150 154 118Z" fill="${SIL}"/>
  <path d="M104 128L120 134M146 128L130 134" stroke="#fbf6ea" stroke-width="3" stroke-linecap="round"/>
  <path d="M106 139C110 136 117 136 121 139C117 142 110 142 106 139ZM129 139C133 136 140 136 144 139C140 142 133 142 129 139Z" fill="#fbf6ea"/>
  <circle cx="114" cy="139" r="2.1" fill="${SIL}"/><circle cx="136" cy="139" r="2.1" fill="${SIL}"/>
  <path d="M125 142V160L120 164" stroke="#fbf6ea" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M125 168C118 164 106 166 98 176C108 174 116 176 125 174C134 176 142 174 152 176C144 166 132 164 125 168Z" fill="#fbf6ea"/>
  <path d="M112 182C120 186 130 186 138 182" stroke="#fbf6ea" stroke-width="1.8" fill="none"/>
  ${[[106, 186], [110, 190], [140, 186], [144, 190], [116, 192], [134, 192], [125, 194]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#fbf6ea"/>`).join('')}
  <path d="M140 146L146 158" stroke="#fbf6ea" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M90 120C90 90 102 78 125 78C148 78 160 90 160 120Z" fill="${SIL}"/>
  <path d="M112 84C116 94 134 94 138 84" stroke="#fbf6ea" stroke-width="1.8" fill="none"/>
  <path d="M92 110C112 116 138 116 158 110" stroke="#fbf6ea" stroke-width="3"/>
  <path d="M56 124C74 108 176 108 194 124C182 134 68 134 56 124Z" fill="${SIL}"/>
  <path d="M64 124C84 116 166 116 186 124" stroke="#fbf6ea" stroke-width="1.2" fill="none" opacity=".7"/>`;

const ROLE_INFO = {
  sheriff: { ko: '보안관', en: 'SHERIFF', goal: ['무법자와 배신자를', '모두 잡아라!'] },
  deputy: { ko: '부관', en: 'DEPUTY', goal: ['보안관을 지켜라!'] },
  outlaw: { ko: '무법자', en: 'OUTLAW', goal: ['보안관을 쓰러뜨려라!'] },
  renegade: { ko: '배신자', en: 'RENEGADE', goal: ['모두 쓰러뜨리고', '홀로 남아라!'] },
};

function roleCard(id, pic) {
  const info = ROLE_INFO[id];
  const lines = info.goal.map((g, i) => `<text x="125" y="${f(296 + (i - (info.goal.length - 1) / 2) * 21)}" text-anchor="middle" font-family="${KFONT}" font-weight="800" font-size="17" fill="${SIL}">${g}</text>`).join('');
  return svg(250, 350, `
    ${frame('brown').replace('<svg ', '<svg x="0" y="0" ')}
    <text x="125" y="55" text-anchor="middle" font-family="${KFONT}" font-weight="800" font-size="30" letter-spacing="6" fill="${SIL}">${info.ko}</text>
    <text x="125" y="75" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11" letter-spacing="3" fill="${SIL}">${info.en}</text>
    ${pic}
    ${lines}`, {
    defs: lin('silver', [[0, '#ffffff'], [0.5, '#dcdcdc'], [1, '#9a9a9a']], 0, 0, 1, 1),
  });
}

/** 역할 카드 뒷면 (숨겨진 역할) */
const ROLE_BACK = svg(250, 350, `
  <rect width="250" height="350" rx="14" fill="url(#rb)"/>
  <rect width="250" height="350" rx="14" fill="#000" filter="url(#rgrain)" opacity=".28"/>
  <rect x="12" y="12" width="226" height="326" rx="9" fill="none" stroke="#d9a94a" stroke-width="3"/>
  <rect x="20" y="20" width="210" height="310" rx="6" fill="none" stroke="#d9a94a" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="6 4"/>
  ${star(125, 160, 70, 'none', '#d9a94a')}
  <text x="125" y="186" text-anchor="middle" font-family="Georgia, serif" font-size="74" font-weight="700" fill="#e8c070">?</text>
  <text x="125" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="4" fill="#d9a94a">ROLE</text>`, {
  defs: rad('rb', [[0, '#5a3418'], [1, '#1c0c04']], 0.5, 0.45, 0.8)
    + '<filter id="rgrain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -.62"/></filter>',
});

const ROLE_ART = {
  back: ROLE_BACK,
  sheriff: roleCard('sheriff', `${badgeStar(125, 172, 6, 70, 40)}${banner(125, 176, 92, 'SHERIFF', 17)}`),
  deputy: roleCard('deputy', `${badgeStar(125, 172, 5, 70, 32)}${banner(125, 178, 84, 'DEPUTY', 16)}`),
  outlaw: roleCard('outlaw', OUTLAW),
  renegade: roleCard('renegade', RENEGADE),
};

// ───────────────────────── 규칙 설명 그림 (260x130)

const FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const T = (x, y, size, color, text, anchor = 'middle', weight = 700) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}">${text}</text>`;
const RDEFS = lin('rbg', [[0, '#3a2414'], [1, '#1e120a']]) + lin('gold', [[0, '#fff1b8'], [0.45, '#d8a93c'], [1, '#6e4a12']]) + drop('ds', 2, 2, 0.6);
const rule = (body) => svg(260, 130, `<rect width="260" height="130" rx="12" fill="url(#rbg)"/><rect x="1" y="1" width="258" height="128" rx="11" fill="none" stroke="#8a5a28" stroke-width="1.5"/>${body}`, { defs: RDEFS });
const miniCard = (x, y, w, h, label, color, rot = 0) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" filter="url(#ds)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#f0dcae" stroke="${color}" stroke-width="3"/>${T(x + w / 2, y + h / 2 + 4, 11, '#2b1a0f', label)}</g>`;
const seat = (x, y, color, label, me = false) => `<circle cx="${x}" cy="${y}" r="13" fill="#1a120a" stroke="${color}" stroke-width="${me ? 4 : 2.5}"/>${T(x, y + 4, 10, me ? '#f2d68a' : '#e8d8b0', label)}`;
const ah = (x, y, ang, c = '#f2d68a') => `<path d="M0 0l-8-4.5v9z" fill="${c}" transform="translate(${x} ${y}) rotate(${ang})"/>`;

const RULE_ART = {
  roles: rule(`
    <g transform="translate(34 40) scale(.36)">${star(0, 0, 60, 'url(#gold)')}</g>${T(34, 80, 11, '#f2d68a', '보안관')}
    <g transform="translate(84 40) scale(.3)">${star(0, 0, 60, '#c9ccd4')}</g>${T(84, 80, 11, '#dfe6ee', '부관')}
    ${T(59, 102, 10, '#b8a27a', '같은 편')}
    <path d="M110 20V110" stroke="#8a5a28" stroke-width="1.5" stroke-dasharray="3 3"/>
    <rect x="128" y="24" width="40" height="34" rx="3" fill="#f0dcae" stroke="#2b1a0f" stroke-width="2"/>${T(148, 45, 9, '#2b1a0f', 'WANTED')}${T(148, 80, 11, '#ff9a8a', '무법자')}${T(148, 96, 9.5, '#b8a27a', '보안관을 노림')}
    <path d="M190 34C200 24 216 26 222 34C216 42 200 42 190 34Z" fill="#111"/><circle cx="200" cy="34" r="2.5" fill="#e8342a"/><circle cx="214" cy="34" r="2.5" fill="#e8342a"/>
    ${T(206, 80, 11, '#ff9a8a', '배신자')}${T(206, 96, 9.5, '#b8a27a', '혼자 살아남기')}
    ${T(130, 122, 10.5, '#e8d8b0', '보안관만 공개 · 나머지 역할은 비밀')}`),
  turn: rule(`
    ${[['1', '카드 2장', '뽑기'], ['2', '카드를', '원하는 만큼'], ['3', '체력 수까지만', '남기고 버리기']].map(([n, a, b], i) => `
      <rect x="${12 + i * 84}" y="20" width="72" height="84" rx="8" fill="#2a1a10" stroke="url(#gold)" stroke-width="2"/>
      <circle cx="${48 + i * 84}" cy="38" r="11" fill="url(#gold)"/>${T(48 + i * 84, 42, 12, '#2b1a0f', n)}
      ${T(48 + i * 84, 70, 11, '#f2d68a', a)}${T(48 + i * 84, 86, 11, '#f2d68a', b)}
      ${i < 2 ? `<path d="M${86 + i * 84} 62h8" stroke="#f2d68a" stroke-width="2"/>${ah(98 + i * 84, 62, 0)}` : ''}`).join('')}
    ${T(130, 122, 10.5, '#e8d8b0', '뱅!은 차례마다 1번 · 파란 카드는 내 앞에 장착')}`),
  distance: rule(`
    ${[[130, 22, '1', true], [196, 44, '1'], [210, 92, '2'], [130, 112, '3'], [50, 92, '2'], [64, 44, '1']].map(([x, y, l, me], i) => (i === 0 ? seat(x, y, '#f2d68a', '나', true) : seat(x, y, '#c8a070', l))).join('')}
    <ellipse cx="130" cy="66" rx="64" ry="34" fill="none" stroke="#8a5a28" stroke-width="1.5" stroke-dasharray="3 4"/>
    ${T(130, 70, 10, '#b8a27a', '자리 사이 칸 수 = 거리')}
    ${T(12, 124, 9.5, '#e8d8b0', '야생마: 남이 볼 때 +1 · 조준경: 내가 볼 때 -1', 'start')}`),
  shoot: rule(`
    ${miniCard(20, 26, 50, 72, '뱅!', '#b3261e', -6)}
    <path d="M78 60H118" stroke="#f2d68a" stroke-width="3" stroke-dasharray="6 4"/>${ah(126, 60, 0)}
    ${seat(146, 60, '#c8a070', '상대')}
    ${miniCard(176, 22, 50, 72, '빗나감!', '#2a6a4a', 6)}
    ${T(130, 112, 10.5, '#e8d8b0', '사거리 안이면 쏠 수 있어요 · 빗나감!이 없으면 체력 -1')}`),
  check: rule(`
    ${miniCard(22, 22, 46, 66, '술통', '#2e6a96')}
    <path d="M78 55h22" stroke="#f2d68a" stroke-width="2.5"/>${ah(106, 55, 0)}
    <rect x="114" y="22" width="46" height="66" rx="4" fill="#f0dcae" stroke="#2b1a0f" stroke-width="2.5"/>${suitShape('H', 137, 50, 26, '#b3261e')}${T(137, 80, 11, '#2b1a0f', '7')}
    ${T(206, 44, 12, '#a8f0b4', '하트 = 성공!')}${T(206, 62, 10, '#e8d8b0', '술통: 총알 회피')}${T(206, 78, 10, '#e8d8b0', '감옥: 탈출')}
    ${T(130, 116, 10, '#e8d8b0', '판정! = 덱 맨 위 카드의 무늬로 결과 결정 · 다이너마이트는 스페이드 2~9면 펑')}`),
  death: rule(`
    <path d="M40 30a18 18 0 0 0-11 32v8h22v-8A18 18 0 0 0 40 30z" fill="#e8d8b0"/><circle cx="34" cy="48" r="4" fill="#1e120a"/><circle cx="46" cy="48" r="4" fill="#1e120a"/>
    ${T(40, 92, 10.5, '#e8d8b0', '체력 0 → 탈락')}${T(40, 106, 9.5, '#b8a27a', '맥주로 버티기 가능')}
    <path d="M84 20V110" stroke="#8a5a28" stroke-width="1.5" stroke-dasharray="3 3"/>
    ${T(170, 40, 11.5, '#a8f0b4', '무법자를 쓰러뜨리면')}${T(170, 58, 11.5, '#a8f0b4', '카드 3장 보상!')}
    ${T(170, 86, 11.5, '#ff9a8a', '보안관이 부관을 쏘면')}${T(170, 104, 11.5, '#ff9a8a', '가진 카드 전부 잃음')}`),
};

module.exports = {
  icons: Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [k, icon(v)])),
  bullet: BULLET,
  bulletEmpty: BULLET_EMPTY,
  logo: LOGO,
  roles: ROLE_ART,
  rules: RULE_ART,
};
