'use strict';
// 귀족 타일 (220×220): 르네상스 초상화 + 왼쪽에 요구 보너스, 위에 3점
const { f, rng, lin, rad, mix, grain } = require('../../../wolf/scripts/art/draw');
const { face, shoulders, neck } = require('../../../wolf/scripts/art/portrait');
const G = require('../../public/shared/gem');

const S = 220;
const LOOK = [
  { skin: '#e8b890', hair: '#3a2414', hat: 'beret', hatColor: '#8a1a2a', coat: '#6a1a2a', trim: '#c8a040', bg: '#2a3a5a', female: false, beard: true },
  { skin: '#d8a880', hair: '#e8e0d0', hat: 'corno', hatColor: '#c8a040', coat: '#8a6a1a', trim: '#f4e4a0', bg: '#1a3a2a', female: false, beard: true },
  { skin: '#f0c8a8', hair: '#8a4a1a', hat: 'pearls', hatColor: '#f4ecd8', coat: '#2a4a8a', trim: '#f4ecd8', bg: '#4a2a2a', female: true },
  { skin: '#e0b090', hair: '#2a1a10', hat: 'cardinal', hatColor: '#b81a1a', coat: '#b81a1a', trim: '#f4ecd8', bg: '#2a2a2a', female: false },
  { skin: '#f4d0b0', hair: '#c8904a', hat: 'crown', hatColor: '#e8c050', coat: '#5a2a7a', trim: '#e8c050', bg: '#2a2a4a', female: true },
  { skin: '#c89070', hair: '#1a1008', hat: 'captain', hatColor: '#1a2a4a', coat: '#1a2a4a', trim: '#c8a040', bg: '#3a4a5a', female: false, beard: true },
  { skin: '#e8b890', hair: '#6a3a1a', hat: 'beret', hatColor: '#1a4a2a', coat: '#1a4a2a', trim: '#c8a040', bg: '#4a3a1a', female: false },
  { skin: '#f0c8a8', hair: '#2a1410', hat: 'veil', hatColor: '#1a1a1a', coat: '#1a1a1a', trim: '#c8a040', bg: '#3a2a3a', female: true },
  { skin: '#d8a880', hair: '#4a2a14', hat: 'cap', hatColor: '#8a2a1a', coat: '#8a2a1a', trim: '#e8c050', bg: '#2a3a3a', female: false },
  { skin: '#e0b898', hair: '#9a9a9a', hat: 'mitre', hatColor: '#f4ecd8', coat: '#6a1a4a', trim: '#e8c050', bg: '#1a2a4a', female: false, beard: true },
];

function hatShape(L, cx) {
  const c = L.hatColor;
  const t = L.trim;
  switch (L.hat) {
    case 'beret': return `<path d="M${cx - 60} 60C${cx - 50} 20 ${cx + 60} 14 ${cx + 66} 50C${cx + 40} 64 ${cx - 40} 70 ${cx - 60} 60Z" fill="${c}"/><path d="M${cx - 50} 62Q${cx} 52 ${cx + 56} 54" stroke="${t}" stroke-width="3" fill="none"/>`;
    case 'corno': return `<path d="M${cx - 50} 70C${cx - 50} 30 ${cx - 10} 10 ${cx + 30} 18C${cx + 50} 22 ${cx + 54} 44 ${cx + 50} 70Z" fill="${c}"/><path d="M${cx - 54} 70H${cx + 54}" stroke="${t}" stroke-width="7"/>`;
    case 'pearls': return `${Array.from({ length: 11 }, (_, i) => `<circle cx="${f(cx - 44 + i * 9)}" cy="${f(52 - Math.sin((i / 10) * Math.PI) * 14)}" r="3.4" fill="${c}"/>`).join('')}<circle cx="${cx}" cy="44" r="6" fill="#2a6ad8" stroke="${t}" stroke-width="2"/>`;
    case 'cardinal': return `<path d="M${cx - 44} 58C${cx - 44} 30 ${cx + 44} 30 ${cx + 44} 58Z" fill="${c}"/>`;
    case 'crown': return `<path d="M${cx - 38} 56L${cx - 42} 24L${cx - 22} 42L${cx} 16L${cx + 22} 42L${cx + 42} 24L${cx + 38} 56Z" fill="${c}" stroke="#8a6010" stroke-width="2"/><circle cx="${cx}" cy="44" r="5" fill="#d82a3a"/><circle cx="${cx - 24}" cy="48" r="4" fill="#1e9a5a"/><circle cx="${cx + 24}" cy="48" r="4" fill="#2a6ad8"/>`;
    case 'captain': return `<path d="M${cx - 70} 62Q${cx} 40 ${cx + 70} 62Q${cx + 40} 30 ${cx} 26Q${cx - 40} 30 ${cx - 70} 62Z" fill="${c}"/><path d="M${cx + 30} 34Q${cx + 70} 20 ${cx + 76} 40" stroke="#f4ecd8" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    case 'veil': return `<path d="M${cx - 58} 150C${cx - 70} 60 ${cx - 40} 30 ${cx} 30C${cx + 40} 30 ${cx + 70} 60 ${cx + 58} 150L${cx + 40} 150C${cx + 46} 80 ${cx + 30} 50 ${cx} 50C${cx - 30} 50 ${cx - 46} 80 ${cx - 40} 150Z" fill="${c}" opacity=".92"/>`;
    case 'cap': return `<path d="M${cx - 46} 56C${cx - 46} 30 ${cx + 46} 30 ${cx + 46} 56Z" fill="${c}"/><path d="M${cx - 48} 56H${cx + 48}" stroke="${t}" stroke-width="4"/>`;
    case 'mitre': return `<path d="M${cx - 34} 64L${cx - 30} 20L${cx} 2L${cx + 30} 20L${cx + 34} 64Z" fill="${c}" stroke="${t}" stroke-width="3"/><path d="M${cx} 8V60M${cx - 14} 30H${cx + 14}" stroke="${t}" stroke-width="4"/>`;
    default: return '';
  }
}

function nobleSvg(noble) {
  const L = LOOK[noble.face];
  const r = rng(noble.face * 13 + 7);
  const cx = 128;
  const hair = L.female
    ? `<path d="M${cx - 46} 150C${cx - 60} 100 ${cx - 44} 60 ${cx} 58C${cx + 44} 60 ${cx + 60} 100 ${cx + 46} 150C${cx + 30} 120 ${cx + 30} 96 ${cx} 90C${cx - 30} 96 ${cx - 30} 120 ${cx - 46} 150Z" fill="${L.hair}"/>`
    : `<path d="M${cx - 42} 108C${cx - 50} 76 ${cx - 30} 58 ${cx} 58C${cx + 30} 58 ${cx + 50} 76 ${cx + 42} 108C${cx + 34} 88 ${cx + 20} 80 ${cx} 80C${cx - 20} 80 ${cx - 34} 88 ${cx - 42} 108Z" fill="${L.hair}"/>`;
  const beard = L.beard ? `<path d="M${cx - 30} 124C${cx - 26} 156 ${cx - 10} 170 ${cx} 170C${cx + 10} 170 ${cx + 26} 156 ${cx + 30} 124C${cx + 20} 138 ${cx + 10} 142 ${cx} 142C${cx - 10} 142 ${cx - 20} 138 ${cx - 30} 124Z" fill="${L.hair}"/>` : '';
  const body = `
    ${shoulders(cx, 176, 170, L.coat, { collar: 'round' })}
    <path d="M${cx - 50} 180Q${cx} 196 ${cx + 50} 180L${cx + 44} 196Q${cx} 208 ${cx - 44} 196Z" fill="${L.trim}" opacity=".9"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${f(cx - 30 + i * 12)}" cy="${f(198 + Math.sin((i / 5) * Math.PI) * 6)}" r="3" fill="${L.trim}"/>`).join('')}
    ${neck(cx, 140, 178, 30, L.skin, mix(L.skin, '#000000', 0.4))}
    ${hair}
    ${face({ id: `nb${noble.face}`, cx, cy: 108, w: 76, h: 94, jaw: L.female ? 0.6 : 0.4, skin: L.skin, lightDir: -1,
    eyes: { mood: 'calm', iris: '#4a3a2a', look: -0.4, open: 0.85 }, brows: { angle: 6, thick: L.female ? 2.4 : 3.6, color: mix(L.hair, '#000000', 0.3) },
    mouth: { curve: 0.08, open: 0 }, blush: L.female ? '#e86a6a' : '#c86a5a', beard })}
    ${hatShape(L, cx)}`;
  // 요구 보너스: 작은 카드 모양
  const req = G.COLORS.filter((c) => noble.req[c]);
  let reqs = '';
  req.forEach((c, i) => {
    const y = S - 16 - (req.length - i) * 44 + 4;
    const g = G.GEMS[c];
    reqs += `<g transform="translate(10 ${y})"><rect width="30" height="40" rx="4" fill="${g.fill}" stroke="${c === 'white' ? '#8a94a8' : '#f4ecd8'}" stroke-width="2"/>
      <rect x="3" y="3" width="24" height="10" rx="2" fill="#fff" opacity=".35"/>
      <text x="15" y="32" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="20" fill="${c === 'white' ? '#1a1a24' : '#ffffff'}">${noble.req[c]}</text></g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>${rad('bg', [[0, mix(L.bg, '#ffffff', 0.25)], [1, mix(L.bg, '#000000', 0.5)]], 0.6, 0.35, 0.8)}${lin('band', [[0, '#f4ecd8', 0.95], [1, '#f4ecd8', 0.75]], 0, 0, 1, 0)}${grain('grain')}
    <filter id="paint"><feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="2" seed="${noble.face + 3}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>
    <clipPath id="clip"><rect x="5" y="5" width="${S - 10}" height="${S - 10}" rx="10"/></clipPath></defs>
  <rect width="${S}" height="${S}" rx="14" fill="#d8c08a"/>
  <g clip-path="url(#clip)">
    <rect width="${S}" height="${S}" fill="url(#bg)"/>
    <path d="M150 0V220M170 0V220" stroke="#000000" stroke-width="10" opacity=".08"/>
    <g filter="url(#paint)">${body}</g>
    <rect x="0" y="0" width="50" height="${S}" fill="url(#band)"/>
    <rect width="${S}" height="${S}" filter="url(#grain)" opacity=".08"/>
  </g>
  <text x="14" y="50" font-family="Georgia, serif" font-weight="700" font-size="42" fill="#ffffff" stroke="#2a1a0a" stroke-width="2.2" paint-order="stroke">3</text>
  ${reqs}
  <rect x="5" y="5" width="${S - 10}" height="${S - 10}" rx="10" fill="none" stroke="#8a6a2a" stroke-width="3"/>
</svg>`;
}

module.exports = { nobleSvg };
