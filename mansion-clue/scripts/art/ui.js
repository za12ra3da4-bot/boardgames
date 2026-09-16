'use strict';
// UI 아이콘, 로고, 카드 테두리/뒷면, 규칙 설명 그림
const { svg, lin, rad, drop } = require('./lib');

const ICONS = {
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.4" fill="#000"/><circle cx="12" cy="12" r="1.4" fill="#000"/><circle cx="16" cy="16" r="1.4" fill="#000"/>',
  passage: '<path d="M3 21h5v-5h5v-5h5V6h3"/><path d="M14 3h7v7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  gavel: '<path d="M14 13l-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  notebook: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M13 8h4M13 12h4"/>',
  scroll: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.2A8 8 0 1 1 21 12z"/>',
  cards: '<rect x="8" y="3" width="13" height="17" rx="2"/><path d="M5 6.5v12A2.5 2.5 0 0 0 7.5 21H16"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6"/>',
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
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  envelope: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  skull: '<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="11" r="1.5" fill="#000"/><circle cx="15" cy="11" r="1.5" fill="#000"/><path d="M10 20v-2M14 20v-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  hat: '<path d="M2.5 16.5c4 2 15 2 19 0"/><path d="M6 16l1.4-8.2c.3-1.8 2.6-2.4 4.6-.8 2-1.6 4.3-1 4.6.8L18 16"/><path d="M6.8 12.5c3.2 1.2 7.2 1.2 10.4 0"/>',
  dagger: '<path d="M20 4l-9.5 9.5"/><path d="M20 4l-1.2 5.2-6 6"/><path d="M8 11l5 5"/><path d="M10.5 13.5L5 19"/><circle cx="4" cy="20" r="1.5"/>',
  key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8L20.5 2.5M16 7l3 3M18.5 4.5l2 2"/>',
};
const icon = (body) => svg(24, 24, `<g fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g>`);

const LOGO = svg(120, 120, `
  <circle cx="60" cy="60" r="57" fill="url(#sky)" stroke="#d9b45a" stroke-width="3"/>
  <circle cx="82" cy="34" r="17" fill="url(#moon)"/>
  <circle cx="82" cy="34" r="10" fill="#fbefc8"/>
  <path fill="#0c080e" d="M16 96V62l12-10 5 4V44h6v17l21-19 21 19V44h6v12l5-4 12 10v34z"/>
  <g fill="#f2c95a"><rect x="24" y="68" width="5" height="7" rx="1"/><rect x="36" y="68" width="5" height="7" rx="1"/><rect x="57" y="58" width="6" height="8" rx="1"/><rect x="79" y="68" width="5" height="7" rx="1"/><rect x="91" y="68" width="5" height="7" rx="1" opacity=".35"/><rect x="36" y="82" width="5" height="7" rx="1" opacity=".35"/></g>
  <path fill="#2a1d14" d="M55 96V82a5 5 0 0 1 10 0v14z"/>
  <circle cx="71" cy="72" r="17" fill="#f2e6c2" fill-opacity=".12" stroke="#d9b45a" stroke-width="5.5"/>
  <path stroke="#d9b45a" stroke-width="8" stroke-linecap="round" d="M84 85l14 14"/>
  <path fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" d="M62 66a11 11 0 0 1 8-5"/>`, {
  defs: rad('sky', [[0, '#3a2a4a'], [1, '#140d18']], 0.5, 0.3, 0.7) + rad('moon', [[0, '#fff6d8'], [0.6, '#f2e2b0'], [1, '#f2e2b0', 0]]),
});

const ENVELOPE = svg(160, 112, `
  <rect x="4" y="12" width="152" height="96" rx="6" fill="url(#paper)"/>
  <path fill="#a8834c" d="M4 104L64 60h32l60 44z" opacity=".5"/>
  <path fill="#c9a66b" d="M4 18c0-3.3 2.7-6 6-6h140c3.3 0 6 2.7 6 6L80 64z"/>
  <path fill="none" stroke="#9a7440" stroke-width="1.2" d="M4 18L80 64l76-46"/>
  <rect x="14" y="80" width="34" height="3" rx="1.5" fill="#8f6b3a" opacity=".5"/><rect x="14" y="88" width="24" height="3" rx="1.5" fill="#8f6b3a" opacity=".5"/>
  <rect x="104" y="80" width="42" height="14" rx="2" fill="none" stroke="#9e2a2b" stroke-width="2" transform="rotate(-6 125 87)"/>
  <circle cx="80" cy="62" r="15" fill="#9e2a2b"/>
  <circle cx="80" cy="62" r="10" fill="none" stroke="#c9504a" stroke-width="2"/>
  <path fill="none" stroke="#f0c9b8" stroke-width="2.4" stroke-linecap="round" d="M76 58a4 4 0 1 1 5.6 3.7c-1.1.6-1.6 1.4-1.6 2.5"/>
  <circle cx="80" cy="68.5" r="1.4" fill="#f0c9b8"/>`, { defs: lin('paper', [[0, '#d6b57a'], [1, '#b8935a']]) });

const GOLD = lin('gold', [[0, '#fff2c0'], [0.3, '#e0b858'], [0.55, '#8a6420'], [0.8, '#d8b050'], [1, '#fff0b0']], 0, 0, 1, 1);

const corner = '<path d="M0 34C0 15 15 0 34 0"/><path d="M6 30C6 17 17 6 30 6"/><path d="M0 34c7-1 11-6 10-13M34 0c-1 7-6 11-13 10"/><circle cx="14" cy="14" r="2.6"/>';
const corners = (w, h) => [
  `translate(3 3)`, `translate(${w - 3} 3) scale(-1 1)`, `translate(3 ${h - 3}) scale(1 -1)`, `translate(${w - 3} ${h - 3}) scale(-1 -1)`,
].map((t) => `<g transform="${t}" fill="none" stroke="url(#gold)" stroke-width="2">${corner}</g>`).join('');

const CARD_FRAME = svg(250, 350, `
  <rect x="3" y="3" width="244" height="344" rx="14" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <rect x="9.5" y="9.5" width="231" height="331" rx="9" fill="none" stroke="url(#gold)" stroke-width="1.2" opacity=".85"/>
  ${corners(250, 350)}
  <rect x="19" y="41" width="212" height="212" rx="3" fill="none" stroke="url(#gold)" stroke-width="2.6"/>
  <rect x="22.5" y="44.5" width="205" height="205" rx="2" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2"/>
  <path d="M44 33H96M154 33H206" stroke="url(#gold)" stroke-width="1.2"/>
  <path d="M96 33l5-4 5 4-5 4zM144 33l5-4 5 4-5 4z" fill="url(#gold)"/>
  <path d="M34 266H216L230 297L216 328H34L20 297Z" fill="url(#plate)" stroke="url(#gold)" stroke-width="2"/>
  <path d="M41 271.5H209L220.5 297L209 322.5H41L29.5 297Z" fill="none" stroke="url(#gold)" stroke-width=".8" opacity=".7"/>
  <circle cx="125" cy="258" r="16" fill="#140c10" stroke="url(#gold)" stroke-width="2.6"/>
  <path d="M20 297l-6-5v10zM230 297l6-5v10z" fill="url(#gold)"/>`, {
  defs: GOLD + lin('plate', [[0, '#241418', 0.95], [1, '#0a0608', 0.97]]),
});

let rays = '';
for (let i = 0; i < 48; i++) {
  const a = (i / 48) * Math.PI * 2;
  rays += `M125 175L${(125 + Math.cos(a) * 260).toFixed(1)} ${(175 + Math.sin(a) * 260).toFixed(1)}`;
}
const CARD_BACK = svg(250, 350, `
  <rect width="250" height="350" rx="14" fill="url(#backBg)"/>
  <rect width="250" height="350" rx="14" fill="url(#lattice)"/>
  <path d="${rays}" stroke="#e2c066" stroke-opacity=".12" stroke-width="1.2"/>
  <rect x="3" y="3" width="244" height="344" rx="14" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <rect x="14" y="14" width="222" height="322" rx="8" fill="none" stroke="url(#gold)" stroke-width="1.4"/>
  ${corners(250, 350)}
  <circle cx="125" cy="175" r="58" fill="#1a0a12" stroke="url(#gold)" stroke-width="3"/>
  <circle cx="125" cy="175" r="48" fill="none" stroke="url(#gold)" stroke-width="1" stroke-dasharray="3 4"/>
  <circle cx="121" cy="168" r="20" fill="none" stroke="url(#gold)" stroke-width="6"/>
  <path d="M136 184l18 18" stroke="url(#gold)" stroke-width="9" stroke-linecap="round"/>
  <path d="M112 160a12 12 0 0 1 9-5" stroke="#fff5d0" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>
  <text x="125" y="300" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="5" fill="#e2c066">CASE FILE</text>
  <text x="125" y="66" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11" letter-spacing="4" fill="#e2c066" opacity=".8">MIDNIGHT MANOR</text>`, {
  defs: GOLD + rad('backBg', [[0, '#4a1426'], [0.7, '#22080f'], [1, '#12040a']], 0.5, 0.5, 0.75)
    + '<pattern id="lattice" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0h18M0 0v18" stroke="#e2c066" stroke-opacity=".08" stroke-width="1"/></pattern>',
});

const FAVICON = svg(64, 64, `
  <rect width="64" height="64" rx="14" fill="#1a1119"/>
  <circle cx="28" cy="27" r="14" fill="none" stroke="#e2c066" stroke-width="6"/>
  <path stroke="#e2c066" stroke-width="8" stroke-linecap="round" d="M39 38l14 14"/>`);

// ───────────────────────── 규칙 설명 그림 (260x130)

const FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const T = (x, y, size, color, text, anchor = 'middle', weight = 700) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}">${text}</text>`;
const RDEFS = GOLD + lin('rbg', [[0, '#2a1d26'], [1, '#150e14']]) + drop('ds', 2, 2, 0.6)
  + lin('env', [[0, '#d6b57a'], [1, '#b08a50']]);
const rule = (body) => svg(260, 130, `<rect width="260" height="130" rx="12" fill="url(#rbg)"/><rect x="1" y="1" width="258" height="128" rx="11" fill="none" stroke="#6b5130" stroke-width="1.5"/>${body}`, { defs: RDEFS });

const back = (x, y, w, h, rot = 0) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" filter="url(#ds)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#3a1424" stroke="url(#gold)" stroke-width="1.6"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="2" fill="none" stroke="#e2c066" stroke-opacity=".4"/></g>`;
const face = (x, y, r, color, dim = false) => `<g opacity="${dim ? 0.4 : 1}"><circle cx="${x}" cy="${y}" r="${r}" fill="#1a1216" stroke="${color}" stroke-width="3"/><circle cx="${x}" cy="${y - r * 0.2}" r="${r * 0.36}" fill="${color}"/><path d="M${x - r * 0.62} ${y + r * 0.72}a${r * 0.62} ${r * 0.5} 0 0 1 ${r * 1.24} 0" fill="${color}"/></g>`;
const check = (x, y, s = 1, c = '#f2d68a') => `<path d="M${x - 5 * s} ${y}l${3.5 * s} ${4 * s} ${7 * s} ${-8 * s}" stroke="${c}" stroke-width="${2.6 * s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (x, y, s = 1, c = '#ff7a6a') => `<path d="M${x - 4 * s} ${y - 4 * s}l${8 * s} ${8 * s}M${x + 4 * s} ${y - 4 * s}l${-8 * s} ${8 * s}" stroke="${c}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
const arrowHead = (x, y, ang, c = '#f2d68a') => `<path d="M0 0l-8 -4.5v9z" fill="${c}" transform="translate(${x} ${y}) rotate(${ang})"/>`;
const env = (x, y) => `<g transform="translate(${x} ${y})" filter="url(#ds)"><rect x="0" y="8" width="84" height="56" rx="5" fill="url(#env)"/><path d="M0 12L42 42L84 12" fill="#c9a66b" stroke="#9a7440"/><circle cx="42" cy="40" r="10" fill="#9e2a2b"/>${T(42, 45, 13, '#f0c9b8', '?')}</g>`;

const RULE_ART = {
  goal: rule(`
    ${env(18, 26)}
    <path d="M110 64h14" stroke="#f2d68a" stroke-width="2.5"/>${arrowHead(130, 64, 0)}
    ${[['범인', 140, -8], ['흉기', 180, 0], ['장소', 220, 8]].map(([l, x, r]) => `${back(x - 16, 24, 34, 50, r)}${T(x + 1, 56, 20, '#e2c066', '?')}${T(x + 1, 94, 12, '#f2d68a', l)}`).join('')}
    ${T(130, 118, 12, '#e8d8b0', '봉투 속 3장을 가장 먼저 맞히면 승리!', 'middle', 700)}`),
  deal: rule(`
    ${back(114, 30, 30, 44)}${back(118, 26, 30, 44)}${back(122, 22, 30, 44)}
    ${[[36, 34, '#d8433b'], [224, 34, '#e2b23a'], [36, 92, '#4a7fd0'], [224, 92, '#4fa35a']].map(([x, y, c]) => `${face(x, y, 14, c)}${back(x + (x < 130 ? 18 : -34), y - 10, 14, 20, x < 130 ? 10 : -10)}<path d="M${x < 130 ? 116 : 154} ${y < 60 ? 44 : 60}Q130 ${y < 60 ? 44 : 76} ${x < 130 ? x + 36 : x - 36} ${y}" stroke="#f2d68a" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>`).join('')}
    ${T(137, 94, 11, '#f2d68a', '나머지 카드를')}${T(137, 108, 11, '#f2d68a', '똑같이 나눔')}
    <rect x="60" y="112" width="140" height="14" rx="7" fill="#3a1618"/>${cross(72, 119, 0.7)}${T(136, 123, 10.5, '#ffb0a4', '내 손의 카드 = 정답 아님')}`),
  move: rule(`
    ${Array.from({ length: 4 }, (_, j) => Array.from({ length: 9 }, (_, i) => `<rect x="${12 + i * 18}" y="${30 + j * 18}" width="16" height="16" rx="3" fill="${(i + j) % 2 ? '#4b3c2f' : '#44362a'}"/>`).join('')).join('')}
    ${[[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [5, 1], [6, 1], [7, 1], [8, 1]].map(([i, j]) => `<rect x="${12 + i * 18}" y="${30 + j * 18}" width="16" height="16" rx="3" fill="#ffc43a" opacity=".35"/>`).join('')}
    <path d="M21 75H111V57H165H184" stroke="#fff0b8" stroke-width="2.5" stroke-dasharray="2 4" fill="none" stroke-linecap="round"/>
    ${arrowHead(192, 57, 0)}
    <rect x="178" y="24" width="72" height="80" rx="4" fill="#3a2a22" stroke="url(#gold)" stroke-width="2"/>
    <rect x="175" y="48" width="8" height="18" fill="#9a7644"/>
    ${T(218, 72, 13, '#f2d68a', '방')}
    <circle cx="21" cy="75" r="7" fill="#d8433b" stroke="#fff" stroke-width="2"/>
    <circle cx="129" cy="75" r="7" fill="#8a8a8a" stroke="#fff" stroke-width="2"/>${cross(129, 75, 0.5, '#fff')}
    ${[[12, 4, [0, 8, 4]], [34, 4, [0, 2, 6, 8]]].map(([x, y, pips]) => `<rect x="${x}" y="${y}" width="18" height="18" rx="4" fill="#f6efe0"/>${pips.map((p) => `<circle cx="${x + 4.5 + (p % 3) * 4.5}" cy="${y + 4.5 + Math.floor(p / 3) * 4.5}" r="1.5" fill="#2a1c14"/>`).join('')}`).join('')}
    ${T(58, 18, 12, '#f2d68a', '= 7칸 이내', 'start')}
    ${T(130, 122, 11, '#e8d8b0', '빛나는 칸을 눌러 이동 · 방은 금색 문으로만 입장')}`),
  passage: rule(`
    <rect x="14" y="14" width="88" height="54" rx="5" fill="#3a2a22" stroke="url(#gold)" stroke-width="2"/>${T(58, 34, 12, '#f2d68a', '부엌')}
    <path d="M40 56h8v-6h8v-6h8v-6h6" stroke="#e2c066" stroke-width="2.5" fill="none"/>
    <rect x="158" y="62" width="88" height="54" rx="5" fill="#1f2d52" stroke="url(#gold)" stroke-width="2"/>${T(202, 110, 12, '#f2d68a', '서재')}
    <path d="M184 90h8v-6h8v-6h8v-6h6" stroke="#e2c066" stroke-width="2.5" fill="none"/>
    <path d="M102 44C150 40 120 92 150 90" stroke="#f2d68a" stroke-width="2.5" stroke-dasharray="6 4" fill="none"/>${arrowHead(156, 90, 0)}
    ${T(190, 34, 12, '#e8d8b0', '주사위 없이')}${T(190, 50, 12, '#e8d8b0', '바로 이동!')}
    ${T(70, 102, 10.5, '#b8a27a', '온실 ↔ 라운지도 연결')}`),
  suggest: rule(`
    <rect x="12" y="16" width="104" height="96" rx="5" fill="#2a1e1a" stroke="url(#gold)" stroke-width="2"/>${T(64, 34, 12, '#f2d68a', '서재')}
    ${face(40, 74, 14, '#e2b23a')}${face(84, 74, 14, '#8e5bc4')}
    <path d="M140 108C120 108 110 96 100 86" stroke="#ff8a7a" stroke-width="2" stroke-dasharray="3 3" fill="none"/>${arrowHead(98, 84, -130, '#ff8a7a')}
    ${[['누가', 142, 'hat'], ['무엇으로', 186, 'dagger'], ['어디서', 230, 'key']].map(([l, x], i) => `${i ? T(x - 22, 52, 16, '#f2d68a', '+') : ''}<rect x="${x - 17}" y="22" width="34" height="48" rx="4" fill="#f0e3c6" stroke="url(#gold)" stroke-width="2" filter="url(#ds)"/><circle cx="${x}" cy="44" r="10" fill="${['#a8342c', '#4b5566', '#3f7a4c'][i]}"/>${T(x, 88, 11, '#f2d68a', l)}`).join('')}
    ${T(186, 112, 11, '#e8d8b0', '이 방에서 · 이 사람이 · 이 흉기로!')}`),
  disprove: rule(`
    ${[['추리', '#e2b23a'], ['없음', '#d8433b'], ['있음!', '#4a7fd0'], ['끝', '#4fa35a']].map(([l, c], i) => `${T(34 + i * 64, 20, 11, i === 1 ? '#ff9a8a' : '#f2d68a', l)}${face(34 + i * 64, 46, 16, c, i === 3)}`).join('')}
    ${[0, 1].map((i) => `<path d="M${54 + i * 64} 46h24" stroke="#f2d68a" stroke-width="2"/>${arrowHead(82 + i * 64, 46, 0)}`).join('')}
    <path d="M182 46h24" stroke="#f2d68a" stroke-width="2" opacity=".35"/>
    <circle cx="110" cy="32" r="8" fill="#3a1618"/>${cross(110, 32, 0.6)}
    ${back(166, 58, 18, 26, 12)}
    <path d="M160 86C130 116 60 116 38 68" stroke="#f2d68a" stroke-width="2.5" stroke-dasharray="5 4" fill="none"/>${arrowHead(36, 64, -110)}
    <rect x="74" y="98" width="58" height="18" rx="9" fill="#3b3220" stroke="#d9b45a"/>${T(103, 111, 11, '#f2d68a', '몰래 1장')}
    ${T(222, 84, 10, '#8a7f78', '확인 안 함')}`),
  notebook: rule(`
    <rect x="10" y="10" width="240" height="110" rx="6" fill="#1a1216"/>
    ${['#d8433b', '#e2b23a', '#4a7fd0', '#4fa35a'].map((c, i) => `<circle cx="${128 + i * 32}" cy="22" r="8" fill="${c}"/>`).join('')}
    ${[['한여사', ['o', 'x', 'x', 'x']], ['밧줄', ['x', 'x', 'x', 'x']], ['서재', ['?', 'x', 'o', 'x']], ['렌치', ['x', 'o', '?', 'x']]].map(([name, marks], j) => {
      const y = 44 + j * 22;
      return `${j === 1 ? `<rect x="14" y="${y - 11}" width="232" height="21" rx="4" fill="#d8433b" opacity=".22" stroke="#ff8a7a"/>` : ''}
        ${T(20, y + 4, 12, j === 1 ? '#ffb0a4' : '#e8d8b0', name, 'start')}
        ${marks.map((m, i) => (m === 'o' ? check(128 + i * 32, y, 0.9) : m === 'x' ? cross(128 + i * 32, y, 0.8) : T(128 + i * 32, y + 4, 13, '#8fb8ff', '?'))).join('')}`;
    }).join('')}
    ${T(84, 70, 10, '#ff8a7a', '← 모두 없음 = 정답!', 'middle', 900)}`),
  accuse: rule(`
    <path d="M130 14V116" stroke="#6b5130" stroke-width="1.5"/>
    <rect x="22" y="56" width="84" height="44" rx="5" fill="url(#env)"/>
    ${[['#a8342c', 30], ['#4b5566', 52], ['#3f7a4c', 74]].map(([c, x]) => `<rect x="${x}" y="30" width="22" height="32" rx="3" fill="#f0e3c6" stroke="url(#gold)" stroke-width="1.5"/><circle cx="${x + 11}" cy="44" r="6" fill="${c}"/>`).join('')}
    <circle cx="106" cy="30" r="13" fill="#2d6a3e"/>${check(106, 30, 1.2, '#fff')}
    ${T(66, 118, 11, '#a8f0b4', '3장 모두 맞으면 승리')}
    ${[['#a8342c', 152], ['#4b5566', 174], ['#3f7a4c', 196]].map(([c, x], i) => `<rect x="${x}" y="40" width="22" height="32" rx="3" fill="#f0e3c6" stroke="url(#gold)" stroke-width="1.5"/><circle cx="${x + 11}" cy="54" r="6" fill="${c}"/>${i === 1 ? cross(x + 11, 56, 1.3) : ''}`).join('')}
    <circle cx="236" cy="30" r="13" fill="#6a1a1a"/>${cross(236, 30, 1.1, '#fff')}
    ${T(196, 98, 11, '#ffb0a4', '하나라도 틀리면 탈락')}
    ${T(196, 114, 9.5, '#b8a27a', '(반박은 계속 참여)')}`),
};

module.exports = {
  icons: Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [k, icon(v)])),
  logo: LOGO,
  envelope: ENVELOPE,
  cardFrame: CARD_FRAME,
  cardBack: CARD_BACK,
  favicon: FAVICON,
  rules: RULE_ART,
};
