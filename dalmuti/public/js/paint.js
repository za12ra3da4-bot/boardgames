/* 달무티 카드 그림 도구 (펜 선 · 얼굴 · 몸 · 손): 판마다 카드 그림이 같이 쓴다 */
export const INK = '#1a0e08';
export const o = (d, fill, sw = 2.4) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
export const f = (d, fill, op = 1) => `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
export const l = (d, sw = 2, c = INK, op = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
export const c = (x, y, r, fill, sw = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
export const dot = (x, y, r, fill, op = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${op}"/>`;

/* ═════════ 얼굴 (정면에서 살짝 비껴 본 3/4, 머리 중심 120,112) ═════════ */
export function face(P) {
  const { skin, shade, eye = '#4a2a1a', brow = '#3a2418', lips = '#9a4a3a', age = 0, fem = false, mood = 'calm', w = 1 } = P;
  const sx = (x) => 120 + (x - 120) * w;
  const faceD = `M${sx(86)} 110 C${sx(86)} 78 ${sx(100)} 62 120 62 C${sx(142)} 62 ${sx(156)} 78 ${sx(155)} 110 C${sx(155)} ${fem ? 138 : 142} ${sx(142)} ${fem ? 160 : 164} 120 ${fem ? 164 : 168} C${sx(98)} ${fem ? 160 : 164} ${sx(86)} ${fem ? 138 : 142} ${sx(86)} 110Z`;
  let s = `<path d="M${sx(106)} 156 L${sx(108)} 188 L${sx(134)} 188 L${sx(134)} 156Z" fill="${shade}" stroke="${INK}" stroke-width="2.2"/>`;
  s += o(`M${sx(84)} 104 C${sx(74)} 100 ${sx(74)} 124 ${sx(86)} 128Z`, skin, 2) + o(`M${sx(156)} 104 C${sx(166)} 100 ${sx(166)} 124 ${sx(154)} 128Z`, skin, 2);
  s += `<path d="${faceD}" fill="url(#skin)" stroke="${INK}" stroke-width="2.6"/>`;
  // 볼 그늘 (왼쪽이 어둡다) · 턱 밑 그림자
  s += f(`M${sx(88)} 110 C${sx(88)} 138 ${sx(100)} 158 118 164 C${sx(100)} 150 ${sx(94)} 132 ${sx(96)} 108Z`, shade, 0.55);
  s += f(`M${sx(100)} 158 Q120 170 ${sx(140)} 158 Q120 176 ${sx(100)} 158Z`, shade, 0.6);
  // 눈
  const eyeD = (x) => `<path d="M${x - 11} 110 C${x - 6} 103 ${x + 6} 103 ${x + 11} 110 C${x + 6} 115 ${x - 6} 115 ${x - 11} 110Z" fill="#f6f0e6"/>
    <circle cx="${x + 1}" cy="109.5" r="4.6" fill="${eye}"/><circle cx="${x + 1}" cy="109.5" r="2.2" fill="#0e0604"/><circle cx="${x + 2.6}" cy="107.8" r="1.4" fill="#fff"/>
    ${l(`M${x - 12} 109 C${x - 6} ${mood === 'sly' ? 104 : 102} ${x + 6} ${mood === 'sly' ? 104 : 102} ${x + 12} 108`, fem ? 2.6 : 2.2)}
    ${l(`M${x - 9} 113.5 C${x - 3} 116 ${x + 4} 116 ${x + 9} 113`, 1, '#6a3a28', 0.7)}
    ${fem ? l(`M${x + 10} 107 l4 -3 M${x + 8} 105 l3 -4`, 1.4) : ''}`;
  s += eyeD(sx(105)) + eyeD(sx(136));
  // 눈썹 (표정)
  const b = { calm: [98, 96], stern: [100, 94], worry: [94, 100], sly: [96, 98], happy: [95, 95] }[mood] || [98, 96];
  s += l(`M${sx(94)} ${b[0]} Q${sx(104)} ${b[1] - 4} ${sx(115)} ${b[1]}`, fem ? 2.4 : 3.6, brow) + l(`M${sx(126)} ${b[1]} Q${sx(137)} ${b[1] - 4} ${sx(147)} ${b[0]}`, fem ? 2.4 : 3.6, brow);
  // 코 (오른쪽이 밝고 왼쪽 그늘)
  s += f(`M${sx(118)} 112 C${sx(116)} 124 ${sx(112)} 130 ${sx(110)} 134 C${sx(116)} 138 ${sx(124)} 138 ${sx(129)} 134 C${sx(124)} 134 ${sx(119)} 128 ${sx(118)} 112Z`, shade, 0.7);
  s += l(`M${sx(112)} 134 C${sx(116)} 138 ${sx(124)} 138 ${sx(129)} 134`, 1.8, '#6a3a28');
  // 입
  const m = { calm: `M${sx(108)} 148 Q120 152 ${sx(133)} 148`, stern: `M${sx(108)} 150 Q120 148 ${sx(133)} 150`, worry: `M${sx(109)} 151 Q120 146 ${sx(132)} 151`, sly: `M${sx(108)} 149 Q122 152 ${sx(135)} 144`, happy: `M${sx(106)} 146 Q120 158 ${sx(135)} 146` }[mood];
  if (fem) s += o(`M${sx(108)} 148 Q${sx(114)} 144 120 146 Q${sx(126)} 144 ${sx(133)} 148 Q120 156 ${sx(108)} 148Z`, lips, 1.4);
  else s += l(m, 2.4, '#5a2a1a');
  if (mood === 'happy') s += f(`M${sx(108)} 147 Q120 156 ${sx(133)} 147 Q120 151 ${sx(108)} 147Z`, '#f4f0ea');
  // 볼 · 주름
  s += `<ellipse cx="${sx(100)}" cy="130" rx="9" ry="5" fill="#e07a6a" opacity="${fem ? 0.3 : 0.15}"/><ellipse cx="${sx(142)}" cy="130" rx="9" ry="5" fill="#e07a6a" opacity="${fem ? 0.3 : 0.15}"/>`;
  if (age > 0) s += l(`M${sx(94)} 118 q4 6 3 12 M${sx(146)} 118 q-4 6 -3 12 M${sx(104)} 92 q16 -4 32 0`, 1.2, '#6a3a28', 0.6 * age);
  return s;
}
/** 몸 (어깨 · 가슴): 옷 색 두 가지 */
export const body = (fill, dark) => `<path d="M24 290 C28 222 60 196 120 188 C180 196 212 222 216 290Z" fill="url(#cloth)" stroke="${INK}" stroke-width="2.6"/>` + f('M24 290 C28 222 60 196 100 190 C74 214 62 250 60 290Z', dark, 0.55);
export const hand = (x, y, skin, shade, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})">${o('M-12 -8 C-16 4 -12 16 -2 18 L10 16 C16 8 14 -4 10 -10 Z', skin, 2)}${l('M-8 2 h14 M-8 8 h13', 1.2, shade)}${o('M8 -8 C16 -12 20 -6 16 0 L10 -2Z', skin, 1.6)}</g>`;

export const SKIN = { a: ['#f0c8a8', '#b8826a'], b: ['#e0b090', '#a47050'], c: ['#c89068', '#8a5a3a'], d: ['#a87050', '#6a4028'] };
