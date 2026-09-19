/* 구룡 살인사건 - 카드 그림 (펜 선 + 수채 번짐, 카드마다 물건 하나씩 손그림)
   물건 그림은 100×100 안에 그린다. */
const INK = '#1a1210';
const o = (d, fill, sw = 2.6) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const l = (d, sw = 2, c = INK, op = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
const s = (d, op = 0.2) => `<path d="${d}" fill="#000" opacity="${op}"/>`;
const c = (x, y, r, fill, sw = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const e = (x, y, rx, ry, fill, sw = 2.4, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}/>`;
const hl = (d) => l(d, 2, '#fff', 0.7);
const METAL = '#b8bec8';
const STEEL = '#8a929e';
const WOOD = '#9a6a3a';
const GLASS = '#bfe0ea';
const BLOOD = '#8e1a1a';

/** 물건 그림: key → SVG 조각 */
export const OBJ = {
  /* ───── 수단 */
  knife: o('M20 76 L64 32 Q76 22 82 20 Q80 30 70 40 L28 82Z', METAL) + hl('M30 70 L66 34') + o('M14 82 L26 70 L32 76 L20 88Z', '#3a2418') + l('M18 80 l4 4', 1.6, '#c8a878') + s('M28 82 L70 40 L74 44 L32 86Z', 0.15) + o('M70 36 q4 4 2 8 q-4 -2 -2 -8Z', BLOOD, 1.4),
  axe: o('M24 86 L66 26 L72 30 L32 90Z', WOOD) + o('M58 18 Q78 12 88 30 Q74 36 66 44 L56 30Z', METAL) + hl('M64 22 Q76 20 82 28') + l('M40 64 l6 4M46 56 l6 4', 1.4, '#5a3a1a'),
  hammer: o('M44 88 L52 40 L60 41 L54 90Z', WOOD) + o('M28 24 L74 32 L72 50 L26 42Z', STEEL) + o('M74 32 L84 30 L84 48 L72 50Z', METAL) + hl('M32 28 L70 34'),
  pistol: o('M14 38 L78 38 L80 48 L46 50 L42 58 L36 58 L34 52 L28 52 L22 84 L10 84 L16 50 L14 48Z', '#3a3a40') + o('M36 50 Q38 62 46 62', 'none', 2) + hl('M18 42 L74 42') + c(70, 43, 2, '#1a1210', 1),
  shotgun: o('M6 44 L70 38 L72 44 L8 50Z', STEEL) + o('M70 36 L94 30 Q96 46 90 52 L66 52 L60 46Z', WOOD) + o('M40 48 L48 48 L46 58 L40 58Z', '#3a3a40') + hl('M10 45 L66 40'),
  rope: l('M50 14 Q20 20 26 44 Q34 66 54 58 Q76 48 66 30 Q54 14 40 30 Q28 48 44 70 Q56 86 78 82', 7, INK) + l('M50 14 Q20 20 26 44 Q34 66 54 58 Q76 48 66 30 Q54 14 40 30 Q28 48 44 70 Q56 86 78 82', 4.4, '#c8a060') + l('M34 26 l4 3M28 42 l4 1M46 60 l2 -3M64 40 l-3 2M48 76 l3 -2', 1.2, '#7a5a2a'),
  necktie: o('M42 10 L58 10 L56 22 L44 22Z', '#8e2a3a') + o('M44 22 L56 22 L66 76 L50 92 L34 76Z', '#b8364a') + l('M46 34 L60 30M42 50 L62 46M40 66 L64 62', 3, '#f2cf4a', 0.8),
  pillow: o('M16 32 Q50 20 84 32 Q92 54 84 72 Q50 84 16 72 Q8 54 16 32Z', '#f0ece2') + l('M24 40 Q50 32 76 40M24 64 Q50 72 76 64', 1.4, '#9aa0b0') + s('M60 34 Q82 34 84 50 Q84 66 78 70 Q72 50 60 34Z', 0.12),
  poison: o('M40 14 h20 v12 l12 14 v38 q0 10 -10 10 h-24 q-10 0 -10 -10 v-38 l12 -14Z', '#7a9a4a') + o('M38 8 h24 v8 h-24Z', '#3a2418') + o('M32 50 h36 v22 h-36Z', '#efe2c2', 1.8) + c(50, 58, 5, '#f4f0e6', 1.4) + l('M44 66 l12 4M56 66 l-12 4', 1.6) + hl('M36 44 v30'),
  pills: o('M26 34 h48 v48 q0 6 -6 6 h-36 q-6 0 -6 -6Z', '#e8a03a') + o('M24 24 h52 v12 h-52Z', '#f4f0e6') + o('M36 52 h28 v18 h-28Z', '#f4f0e6', 1.6) + e(22, 88, 7, 4, '#fff', 1.8, -20) + e(80, 90, 7, 4, '#9ad0f0', 1.8, 20),
  syringe: o('M24 70 L62 32 L72 42 L34 80Z', GLASS) + o('M62 32 L74 20 L84 30 L72 42Z', '#f4f0e6') + o('M78 16 L90 28 L86 32 L74 20Z', STEEL) + l('M24 70 L10 84', 2.2) + l('M34 64 l4 4M40 58 l4 4M46 52 l4 4', 1.4) + s('M30 72 L56 46 L62 52 L36 78Z', 0.12) + o('M28 66 L48 46 L56 54 L36 74Z', '#c8403a55', 0),
  cable: l('M10 70 Q30 30 50 50 Q70 70 88 30', 8, INK) + l('M10 70 Q30 30 50 50 Q70 70 88 30', 5, '#2a2a30') + o('M82 18 h12 v14 h-12Z', '#3a3a40') + l('M86 12 v6M92 12 v6', 2.4, '#c8b060') + l('M40 20 l6 8 -6 2 8 10', 2.4, '#f2cf4a'),
  dryer: o('M20 30 Q20 16 40 16 L74 16 Q88 16 88 30 Q88 44 74 44 L40 44 Q20 44 20 30Z', '#e0507a') + o('M42 44 L56 44 L52 86 L40 86Z', '#e0507a') + e(22, 30, 5, 12, '#3a3a40', 2) + l('M92 22 q6 8 0 16M98 18 q8 12 0 24', 1.8, '#9ad0f0') + l('M46 86 Q50 96 60 94', 2),
  brick: o('M16 40 L66 30 L86 44 L36 56Z', '#c0603a') + o('M16 40 L36 56 L36 76 L16 60Z', '#9a4a2a') + o('M36 56 L86 44 L86 64 L36 76Z', '#b0543a') + l('M46 62 v12M66 58 v12M26 52 v10', 1.2, '#5a2a1a', 0.6) + l('M40 36 l20 -4', 1.2, '#fff', 0.4),
  golf: o('M28 88 L68 12 L72 14 L32 90Z', METAL) + o('M18 82 Q16 94 30 94 L44 92 Q46 84 34 84Z', STEEL) + o('M64 10 L76 16 L72 28 L62 22Z', '#1a1a1a') + c(58, 90, 5, '#fff', 1.8),
  bat: o('M20 86 L28 78 Q60 36 80 18 Q90 14 88 24 Q72 44 32 88Z', '#d8b070') + e(22, 88, 5, 3, '#a07a3a', 2, -45) + l('M40 70 L72 30', 1.2, '#8a5a2a', 0.5) + hl('M44 62 L74 26'),
  scissors: o('M50 50 L84 14 L88 18 L54 54Z', METAL) + o('M50 50 L86 30 L88 36 L54 54Z', METAL) + c(32, 68, 12, 'none', 4.6) + c(52, 78, 12, 'none', 4.6) + l('M32 68m-12 0a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', 2.6, '#c8403a') + c(51, 51, 2.4, STEEL, 1.4),
  bottle: o('M42 10 h16 v18 q14 8 14 24 v34 q0 6 -6 6 h-32 q-6 0 -6 -6 v-34 q0 -16 14 -24Z', '#3a6a3a') + o('M40 6 h20 v6 h-20Z', '#c8a060') + o('M32 50 h36 v20 h-36Z', '#efe2c2', 1.6) + hl('M36 38 Q34 60 36 82'),
  shard: o('M30 14 L58 30 L74 70 L46 86 L22 60Z', GLASS + 'cc') + o('M58 30 L84 22 L74 70Z', '#9ac8d8cc') + hl('M34 22 L50 34M30 50 L40 66') + o('M46 86 q-2 6 2 8 q4 -2 0 -8Z', BLOOD, 1.2) + o('M70 64 q4 2 2 6 q-4 -2 -2 -6Z', BLOOD, 1.2),
  bag: o('M26 30 Q22 60 30 82 Q50 90 70 82 Q78 60 74 30 Q66 36 60 30 Q50 38 40 30 Q32 36 26 30Z', '#e4ecf0cc') + o('M34 16 Q30 26 36 30 L42 30 Q42 20 38 16Z', '#e4ecf0cc', 2) + o('M66 16 Q70 26 64 30 L58 30 Q58 20 62 16Z', '#e4ecf0cc', 2) + hl('M34 44 Q32 60 38 76M58 50 Q62 62 60 72'),
  pot: o('M26 50 h48 l-6 40 h-36Z', '#c0603a') + o('M22 44 h56 v10 h-56Z', '#a84a2a') + o('M50 44 Q30 26 36 10 Q50 20 50 44Z', '#5a9a3a', 2) + o('M50 44 Q70 22 66 8 Q52 18 50 44Z', '#6aaa4a', 2) + o('M50 44 Q52 24 50 16', 'none', 2),
  snake: l('M12 80 Q30 90 40 72 Q50 54 64 64 Q78 74 82 54 Q86 36 70 30', 11, INK) + l('M12 80 Q30 90 40 72 Q50 54 64 64 Q78 74 82 54 Q86 36 70 30', 8, '#6a9a3a') + l('M20 84 l2 -3M34 80 l3 -2M52 62 l1 3M70 68 l2 -3', 1.6, '#f2cf4a') + e(64, 26, 10, 7, '#6a9a3a', 2.4, -20) + c(62, 24, 1.8, '#f2cf4a', 0.8) + l('M54 30 l-8 2 m8 -2 l-6 5', 1.4, '#c8303a'),
  bee: [[34, 40], [62, 30], [50, 62], [76, 58]].map(([x, y]) => e(x, y, 9, 6, '#e8c43a', 2) + l(`M${x - 3} ${y - 5} v10M${x + 3} ${y - 5} v10`, 2.4) + e(x - 2, y - 8, 5, 3, '#e8f4ff', 1.4, -20) + e(x + 3, y - 8, 5, 3, '#e8f4ff', 1.4, 20)).join('') + l('M20 80 q10 -6 18 2 q10 8 20 -2', 1.2, INK, 0.5),
  car: o('M8 62 Q10 48 24 46 L34 32 Q40 26 54 26 L70 26 Q80 28 86 44 Q94 46 94 58 L94 66 L8 66Z', '#b8303a') + o('M36 34 L46 30 L60 30 L60 44 L32 44Z', GLASS) + o('M64 30 L72 30 L80 44 L64 44Z', GLASS) + c(26, 68, 9, '#2a2a2e') + c(76, 68, 9, '#2a2a2e') + c(26, 68, 3.4, METAL, 1.4) + c(76, 68, 3.4, METAL, 1.4) + o('M88 52 h6 v6 h-6Z', '#f2e8a0', 1.4),
  bike: c(24, 70, 14, 'none', 5) + c(78, 70, 14, 'none', 5) + l('M24 70 L44 50 L66 50 L78 70M44 50 L50 66 L66 50M60 40 L66 50', 3, '#c8303a') + o('M40 44 h14 l4 6 h-18Z', '#2a2a2e', 2) + l('M60 40 L72 36', 3, METAL),
  gas: o('M22 28 h44 l12 12 v46 q0 4 -4 4 h-52 q-4 0 -4 -4 v-54 q0 -4 4 -4Z', '#c8303a') + o('M62 16 h12 v12 h-12Z', '#e8c43a') + l('M28 50 L70 80M70 50 L28 80', 3, '#f2cf4a', 0.9) + o('M34 22 h20 v6 h-20Z', '#2a2a2e') + o('M80 70 q6 6 2 14 q-8 -4 -2 -14Z', '#f08a2a', 1.6),
  match: [0, 1, 2].map((i) => `<g transform="rotate(${-30 + i * 22} 50 80)">${o('M48 30 h4 v52 h-4Z', '#e8d0a0', 1.6)}${e(50, 28, 4, 6, '#c8303a', 1.8)}</g>`).join('') + o('M58 12 Q66 20 60 26 Q54 20 58 12Z', '#f2a23a', 1.4) + o('M59 17 Q62 21 59 24 Q57 21 59 17Z', '#f8e060', 0.8),
  candle: o('M40 36 h20 v30 h-20Z', '#f4ecd8') + o('M28 66 h44 l-6 10 h-32Z', '#d8a830') + o('M44 76 h12 v10 h-12Z', '#d8a830') + o('M30 86 h40 v6 h-40Z', '#b88a20') + l('M50 36 v-6', 1.8) + o('M50 12 Q58 22 50 30 Q42 22 50 12Z', '#f2a23a', 1.6) + l('M42 42 q2 8 -1 14', 1.4, '#e8d8b0'),
  trophy: o('M30 14 h40 v18 q0 20 -20 24 q-20 -4 -20 -24Z', '#e8b830') + l('M30 20 q-12 0 -10 10 q2 10 12 8M70 20 q12 0 10 10 q-2 10 -12 8', 3) + o('M46 56 h8 v14 h-8Z', '#d8a020') + o('M34 70 h32 v10 h-32Z', '#6a3a1a') + o('M30 80 h40 v8 h-40Z', '#5a2a10') + hl('M36 20 q0 16 10 26'),
  ice: o('M24 34 L56 20 L82 36 L78 72 L44 86 L20 68Z', '#d8f0fa') + o('M56 20 L82 36 L52 48 L24 34Z', '#eef8fc') + o('M52 48 L82 36 L78 72 L44 86Z', '#b8dcec') + hl('M30 40 L48 32M58 56 L70 50') + l('M60 70 q-2 8 2 12', 1.4, '#6aa8c8'),
  bathtub: o('M8 44 h84 v8 q0 26 -24 28 h-36 q-24 -2 -24 -28Z', '#f4f0e6') + o('M12 52 h76 q-2 20 -20 22 h-36 q-18 -2 -20 -22Z', '#8ac4e0') + l('M18 58 q8 -4 16 0 t16 0 t16 0 t16 0', 1.6, '#fff') + o('M20 80 l-4 10M80 80 l4 10', 'none', 3) + o('M78 20 h10 v24 h-4 v-18 h-6Z', METAL, 2),
  mushroom: o('M16 52 Q18 18 50 16 Q82 18 84 52Z', '#c8303a') + o('M40 52 h20 q4 30 -2 36 h-16 q-6 -6 -2 -36Z', '#f4ecd8') + [[32, 36, 5], [52, 26, 6], [70, 40, 5], [44, 44, 3]].map(([x, y, r]) => c(x, y, r, '#fff', 1.6)).join('') + l('M44 60 q6 4 12 0', 1.2, INK, 0.5),
  choco: o('M16 30 L76 18 L84 60 L24 72Z', '#5a2e1a') + [[30, 34], [50, 30], [68, 26], [34, 52], [54, 48], [72, 44]].map(([x, y]) => o(`M${x - 7} ${y - 5} l12 -2 l2 10 l-12 2Z`, '#6e3a22', 1.4)).join('') + o('M50 60 L86 52 L92 90 L56 98Z', '#c8303a') + o('M60 64 L84 58 L88 84 L64 90Z', '#e8b830', 1.6),
  wine: o('M34 8 h12 v14 q8 6 8 18 v46 q0 4 -4 4 h-20 q-4 0 -4 -4 v-46 q0 -12 8 -18Z', '#4a1a2a') + o('M30 50 h24 v18 h-24Z', '#efe2c2', 1.4) + o('M62 40 h26 q0 22 -13 24 q-13 -2 -13 -24Z', GLASS + 'aa', 2) + o('M64 50 h22 q-2 12 -11 13 q-9 -1 -11 -13Z', '#8e1a3a', 0) + l('M75 64 v20M66 86 h18', 2.4),
  fishline: l('M16 90 L62 12', 4, WOOD) + c(28, 72, 7, METAL, 2) + l('M62 12 Q84 30 76 60 Q72 80 80 86', 1.4, INK) + l('M80 86 q6 4 2 8 q-6 0 -6 -6', 2, STEEL) + e(78, 58, 4, 6, '#e8503a', 1.6),
  scarf: o('M20 30 Q50 18 80 30 Q84 40 78 46 Q50 34 22 46 Q16 40 20 30Z', '#7a4aa0') + o('M60 40 L70 90 L56 92 L50 42Z', '#7a4aa0') + l('M60 90 v6M64 90 v6M68 89 v6', 1.8) + l('M28 36 Q50 26 72 36', 1.6, '#e8c43a', 0.8) + l('M58 56 L66 54M60 70 L68 68', 1.6, '#e8c43a', 0.8),
  chain: Array.from({ length: 6 }, (_, i) => e(18 + i * 13, 30 + i * 9 + (i % 2) * 2, 9, 5.5, 'none', 3.6, 35 + (i % 2) * 40)).join('') + Array.from({ length: 6 }, (_, i) => e(18 + i * 13, 30 + i * 9 + (i % 2) * 2, 9, 5.5, 'none', 0, 0).replace('stroke-width="0"', `stroke="${METAL}" stroke-width="1.6"`)).join(''),
  chainsaw: o('M40 36 L92 34 Q98 44 92 52 L40 54Z', METAL) + l('M42 34 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3', 1.6) + o('M8 30 h36 v34 h-36Z', '#e8843a') + o('M14 20 h24 v12 h-24Z', '#2a2a2e') + l('M8 64 Q14 80 30 80', 3) + s('M8 48 h36 v16 h-36Z', 0.15),
  bow: l('M30 10 Q72 50 30 90', 5, INK) + l('M30 10 Q72 50 30 90', 3, WOOD) + l('M30 10 L30 90', 1.2) + o('M12 50 L86 50', 'none', 2.4) + o('M86 50 l-10 -5 v10Z', STEEL, 1.6) + o('M12 50 l-6 -6 l6 3 l6 -3Z', '#c8303a', 1.4) + o('M12 50 l-6 6 l6 -3 l6 3Z', '#c8303a', 1.4),
  stairs: o('M10 90 v-16 h16 v-16 h16 v-16 h16 v-16 h16 v-16 h16 v80Z', '#9a7a5a') + l('M10 74 h16M26 58 h16M42 42 h16M58 26 h16', 2, '#5a3a1a') + s('M78 10 h14 v80 h-14Z', 0.2) + l('M20 88 q8 -2 10 -8', 1.6, '#8e1a1a'),
  crowbar: l('M18 88 L72 20 Q78 12 86 16 Q90 24 82 26', 8, INK) + l('M18 88 L72 20 Q78 12 86 16 Q90 24 82 26', 5, '#c8303a') + l('M18 88 l-6 -4', 5, INK) + hl('M26 76 L66 26'),
  pan: o('M8 44 Q10 76 42 78 Q72 76 74 44Z', '#3a3a40') + e(41, 44, 33, 8, '#4a4a52', 2.6) + o('M72 42 L96 36 L98 44 L74 50Z', '#2a1810') + hl('M20 48 q20 6 40 0'),
  harpoon: l('M10 90 L80 20', 4, WOOD) + o('M80 20 L94 6 L90 24Z', STEEL) + o('M84 16 l-10 -2 l4 8Z', STEEL, 1.6) + l('M10 90 Q30 96 40 82 Q46 70 60 76', 1.4),
  wire: l('M20 20 Q70 10 76 40 Q80 70 40 72 Q16 70 24 50 Q30 34 56 40 Q70 46 60 60', 2.4, STEEL) + l('M20 20 l-8 -6M60 60 l6 8', 2.4, STEEL) + hl('M40 16 Q60 14 70 26'),
  acid: o('M36 12 h28 v10 l14 20 v40 q0 8 -8 8 h-40 q-8 0 -8 -8 v-40 l14 -20Z', GLASS + 'cc') + o('M26 54 h48 v26 q0 6 -6 6 h-36 q-6 0 -6 -6Z', '#b8e04a') + l('M36 60 q6 -4 12 0 t12 0', 1.6, '#fff') + o('M38 30 h24 v14 h-24Z', '#f4f0e6', 1.4) + l('M44 34 l12 6M56 34 l-12 6', 1.6, '#c8303a') + c(40, 50, 2, '#d8f07a', 1),
  firecracker: [0, 1, 2].map((i) => o(`M${28 + i * 18} 30 h12 v54 h-12Z`, i % 2 ? '#e8c43a' : '#c8303a')).join('') + l('M34 30 Q30 18 40 12M52 30 Q52 16 60 10M70 30 Q74 18 80 14', 1.6) + o('M80 6 l4 6 l6 -2 l-3 6 l5 4 l-7 1 l-1 7 l-4 -5 l-6 3 l2 -7 l-6 -3 l7 -2Z', '#f8e060', 1.2),
  dumbbell: o('M26 44 h48 v12 h-48Z', STEEL) + o('M10 30 h16 v40 h-16Z', '#3a3a40') + o('M74 30 h16 v40 h-16Z', '#3a3a40') + o('M4 36 h6 v28 h-6Z', '#2a2a2e', 2) + o('M90 36 h6 v28 h-6Z', '#2a2a2e', 2) + hl('M30 47 h40'),
  sword: o('M46 6 L54 6 L56 66 L44 66Z', METAL) + hl('M50 10 L50 62') + o('M30 66 h40 v6 h-40Z', '#d8a830') + o('M46 72 h8 v18 h-8Z', '#6a2a1a') + c(50, 93, 4, '#d8a830', 1.8) + o('M52 20 q6 2 4 8Z', BLOOD, 1.2),

  /* ───── 단서 */
  ring: e(50, 58, 24, 22, 'none', 8) + e(50, 58, 24, 22, 'none', 0).replace('stroke-width="0"', 'stroke="#e8b830" stroke-width="5"') + o('M40 30 L50 18 L60 30 L50 40Z', '#9ad8f0') + hl('M44 28 L50 22'),
  key: c(28, 36, 16, '#d8a830') + c(28, 36, 6, '#f6ecd4', 2) + o('M40 44 L82 72 L78 78 L72 74 L68 80 L62 76 L64 70 L36 52Z', '#d8a830') + hl('M18 30 q6 -8 14 -6'),
  glasses: c(30, 52, 16, GLASS + '66', 3.4) + c(70, 52, 16, GLASS + '66', 3.4) + l('M46 50 Q50 44 54 50M14 50 L4 40M86 50 L96 40', 3) + hl('M22 44 l8 -4M62 44 l8 -4') + l('M66 42 L78 60', 1.2, INK, 0.6),
  hanky: o('M16 24 L80 16 L86 78 L22 86Z', '#f4f0e6') + l('M22 30 L78 22 L82 72 L28 80Z', 1.4, '#6a8ac8') + o('M60 60 q10 -2 14 8 q-8 6 -14 -8Z', '#c8506a', 1.4) + s('M50 20 L80 16 L86 78 L60 82Z', 0.08) + l('M30 40 q10 4 20 0', 1, '#bbb'),
  lipstick: o('M34 40 h22 v48 h-22Z', '#d8a830') + o('M36 20 L54 12 L54 40 L36 40Z', '#c8203a') + hl('M40 24 L40 38') + o('M58 58 h14 v30 h-14Z', '#2a2a2e') + l('M36 60 h20', 1.4, '#8a6a10'),
  wallet: o('M12 30 h70 q6 0 6 6 v44 q0 6 -6 6 h-70Z', '#6a3a1a') + o('M52 44 h36 v20 h-36Z', '#7a4a2a') + c(62, 54, 3.4, '#d8a830', 1.6) + o('M20 20 h40 v14 h-40Z', '#6ac47a', 1.6) + l('M16 36 h40', 1.2, '#c8a870', 0.6),
  receipt: o('M26 8 h48 v80 l-6 -4 l-6 4 l-6 -4 l-6 4 l-6 -4 l-6 4 l-6 -4 l-6 4Z', '#f8f4ea') + l('M34 20 h32M34 30 h24M34 40 h28M34 50 h20M34 62 h32', 2, '#6a6a70') + l('M50 70 h16', 3, INK),
  letter: o('M12 26 h76 v52 h-76Z', '#f4ead0') + l('M12 26 L50 56 L88 26', 2.4) + c(50, 52, 8, '#b8203a', 2) + l('M46 50 l4 4 l4 -6', 1.4, '#f4d0b0'),
  photo: o('M18 20 L78 14 L84 80 L24 86Z', '#f8f4ea') + o('M24 26 L74 22 L78 66 L28 70Z', '#6a7a8a') + e(52, 42, 8, 9, '#d8b89a', 1.6) + o('M36 68 Q38 52 52 52 Q66 52 70 66Z', '#3a3a4a', 1.6) + l('M24 26 L78 66', 2.4, '#c8303a'),
  newspaper: o('M12 20 h70 v64 h-70Z', '#e8e0cc') + o('M82 26 h8 v58 h-8Z', '#d0c8b4') + o('M18 26 h58 v12 h-58Z', '#3a3a40', 1.4) + o('M18 44 h26 v22 h-26Z', '#9a9aa0', 1.4) + l('M50 46 h26M50 52 h26M50 58 h22M18 72 h58M18 78 h50', 1.6, '#6a6a70'),
  book: o('M16 22 Q34 16 50 24 Q66 16 84 22 L84 80 Q66 74 50 82 Q34 74 16 80Z', '#7a3a2a') + o('M20 26 Q34 20 48 28 L48 78 Q34 72 20 76Z', '#e8dcc0', 1.6) + o('M52 28 Q66 20 80 26 L80 76 Q66 72 52 78Z', '#e8dcc0', 1.6) + l('M26 36 h16M26 44 h18M58 34 h16M58 42 h18M58 50 h14', 1.2, '#8a7a60'),
  keycard: o('M18 26 h64 q4 0 4 4 v40 q0 4 -4 4 h-64 q-4 0 -4 -4 v-40 q0 -4 4 -4Z', '#e8ecf0') + o('M24 34 h14 v10 h-14Z', '#d8a830', 1.6) + o('M18 56 h68 v8 h-68Z', '#3a3a40', 0) + l('M46 36 h30M46 44 h20', 2, '#6a8ac8') + c(78, 30, 3, '#ffffff', 1.2),
  phone: o('M30 10 h40 q6 0 6 6 v68 q0 6 -6 6 h-40 q-6 0 -6 -6 v-68 q0 -6 6 -6Z', '#2a2a2e') + o('M34 18 h32 v56 h-32Z', '#6ab0e8', 1.6) + l('M36 22 L64 70M42 18 L66 60', 1, '#fff', 0.5) + l('M34 40 L66 30', 1.6, '#fff', 0.9) + c(50, 82, 2.6, '#6a6a70', 1),
  watch: o('M40 8 h20 v20 h-20Z', '#6a3a1a') + o('M40 72 h20 v20 h-20Z', '#6a3a1a') + c(50, 50, 22, '#d8a830') + c(50, 50, 17, '#f8f4ea', 2) + l('M50 50 L50 38M50 50 L60 56', 2.4) + l('M50 35 v2M65 50 h-2M50 65 v-2M35 50 h2', 2),
  cigarette: o('M14 60 L72 44 L76 54 L18 70Z', '#f4f0e6') + o('M60 47 L72 44 L76 54 L64 57Z', '#e0a060') + o('M14 60 L22 58 L25 68 L18 70Z', '#6a6a70') + l('M20 56 Q24 40 16 30 Q10 20 20 12', 1.6, '#9a9aa0', 0.7) + o('M12 62 q-4 2 -2 6', 'none', 1.4),
  lighter: o('M28 36 h40 v52 q0 4 -4 4 h-32 q-4 0 -4 -4Z', METAL) + o('M28 24 h40 v12 h-40Z', STEEL) + c(56, 30, 4, '#3a3a40', 1.4) + o('M40 20 Q46 6 42 2 Q52 8 48 20Z', '#f2a23a', 1.4) + hl('M34 42 v40'),
  coffee: o('M24 36 h44 v34 q0 14 -14 14 h-16 q-14 0 -14 -14Z', '#f4f0e6') + l('M68 44 q14 0 12 12 q-2 10 -12 10', 3.4) + e(46, 38, 22, 4, '#6a3a1a', 2) + l('M36 26 q4 -8 0 -14M48 24 q4 -8 0 -14', 1.6, '#9a9aa0', 0.7) + e(46, 88, 30, 4, '#e8e0cc', 2) + o('M44 52 q8 2 10 8', 'none', 1.4),
  umbrella: o('M10 48 Q50 0 90 48 Q84 42 76 48 Q70 42 62 48 Q56 42 50 48 Q44 42 38 48 Q30 42 24 48 Q16 42 10 48Z', '#2a2a30') + l('M50 14 Q56 30 62 48M50 14 Q44 30 38 48', 1.2, '#6a6a70') + l('M50 10 v74 q0 8 -8 8 q-6 0 -6 -6', 3) + l('M30 34 q6 -10 16 -14', 1.6, '#fff', 0.4),
  gloves: o('M20 44 Q18 22 26 22 L28 38 L30 18 Q36 16 36 20 L38 38 L40 20 Q46 18 46 24 L46 42 Q52 34 56 40 Q52 52 48 60 L48 84 L24 84 Q20 62 20 44Z', '#3a2a3a') + o('M56 50 Q54 28 62 28 L64 44 L66 24 Q72 22 72 26 L74 44 L76 26 Q82 24 82 30 L82 48 Q88 40 92 46 Q88 58 84 66 L84 88 L60 88 Q56 68 56 50Z', '#4a3a4a') + l('M24 76 h22M60 80 h22', 2, '#8a7a8a'),
  sneakers: o('M8 62 Q10 44 24 46 Q34 36 44 44 L60 52 Q82 54 90 64 L90 76 L8 76Z', '#f4f0e6') + o('M8 70 h82 v8 h-82Z', '#c8303a') + l('M34 46 l6 6M40 44 l6 6M46 46 l6 6', 1.8, '#3a3a40') + o('M60 58 q10 -2 18 4', 'none', 2),
  heels: o('M14 56 Q16 40 30 44 Q52 50 64 42 Q80 34 88 46 L84 56 Q72 52 60 60 L34 66 Q22 66 14 56Z', '#c8203a') + o('M78 50 L82 50 L84 88 L80 88Z', '#c8203a', 2) + hl('M24 50 q16 4 30 0'),
  hat: o('M10 64 Q50 50 90 64 Q84 74 50 72 Q16 74 10 64Z', '#3a3230') + o('M26 62 Q24 28 40 24 Q50 32 60 24 Q76 28 74 62Z', '#4a403c') + o('M26 52 h48 v8 h-48Z', '#8e2a2a') + l('M40 28 Q50 38 60 28', 1.6, '#2a2220'),
  hair: l('M14 70 Q40 30 60 50 T92 30', 1.6, '#3a2a20') + l('M16 76 Q42 38 62 56 T90 40', 1.4, '#4a3020') + l('M20 80 Q46 48 66 62 T88 50', 1.2, '#5a3a24') + e(50, 88, 36, 5, '#00000010', 0),
  button: c(50, 50, 30, '#8a5a3a') + c(50, 50, 22, '#9a6a4a', 1.6) + [[42, 42], [58, 42], [42, 58], [58, 58]].map(([x, y]) => c(x, y, 4, '#4a2a1a', 1.4)).join('') + l('M36 34 q8 -6 16 -6', 2, '#fff', 0.4),
  perfume: o('M28 40 h44 v40 q0 8 -8 8 h-28 q-8 0 -8 -8Z', '#f0b8d0aa') + o('M40 28 h20 v12 h-20Z', '#d8a830') + e(50, 20, 12, 8, '#d8a8e8', 2) + hl('M34 46 v32') + l('M76 20 l6 -2M78 28 l8 0M76 36 l6 2', 1.4, '#9a9aa0'),
  petal: [[30, 40, -30], [56, 30, 20], [44, 62, 60], [70, 58, -10], [22, 70, 40]].map(([x, y, r]) => `<path d="M${x} ${y - 10} Q${x + 10} ${y} ${x} ${y + 10} Q${x - 10} ${y} ${x} ${y - 10}Z" fill="#d8304a" stroke="${INK}" stroke-width="1.8" transform="rotate(${r} ${x} ${y})"/>`).join(''),
  soil: o('M10 70 Q20 50 40 52 Q56 40 72 50 Q90 52 92 70 Q60 80 10 70Z', '#6a4a2a') + [[30, 62], [52, 56], [70, 62], [42, 68], [80, 66]].map(([x, y]) => c(x, y, 2.4, '#4a2e1a', 1)).join('') + o('M56 50 Q50 34 60 26 Q62 40 56 50Z', '#5a9a3a', 1.4),
  sand: o('M8 74 Q30 56 50 60 Q74 52 92 72 Q50 84 8 74Z', '#e0c890') + Array.from({ length: 22 }, (_, i) => `<circle cx="${14 + (i * 37) % 74}" cy="${62 + (i * 13) % 14}" r="1" fill="#9a7a40"/>`).join('') + o('M66 50 q6 -8 14 -4 q-4 8 -14 4Z', '#f4ecd8', 1.6),
  coin: e(40, 56, 26, 26, '#d8a830', 2.6) + e(40, 56, 19, 19, 'none', 1.6) + e(66, 44, 22, 22, '#c89820', 2.6) + l('M60 40 h12M66 34 v20', 2.4, '#8a6410') + hl('M24 46 q6 -8 16 -8'),
  dice: o('M24 34 L54 22 L80 36 L50 50Z', '#f8f4ea') + o('M24 34 L50 50 L50 84 L24 68Z', '#e8e0d0') + o('M50 50 L80 36 L80 70 L50 84Z', '#d8d0c0') + c(52, 36, 3, '#c8303a', 1) + [[32, 52], [42, 64], [60, 60], [72, 54], [60, 74], [72, 66]].map(([x, y]) => c(x, y, 2.6, INK, 0)).join(''),
  chess: o('M34 88 h32 v-8 h-32Z', '#2a2a2e') + o('M38 80 Q40 62 44 56 h12 Q60 62 62 80Z', '#2a2a2e') + o('M42 56 Q30 44 40 30 Q44 20 58 22 Q70 26 66 40 Q64 50 58 56Z', '#2a2a2e') + c(54, 32, 2, '#fff', 1) + l('M44 28 Q48 22 58 24', 1.4, '#fff', 0.4),
  teddy: c(34, 26, 9, '#b0804a') + c(66, 26, 9, '#b0804a') + c(50, 40, 20, '#c0905a') + e(50, 72, 22, 20, '#c0905a') + e(50, 46, 8, 6, '#e8c8a0', 1.6) + c(43, 36, 2.4, INK, 0) + c(57, 36, 2.4, INK, 0) + c(50, 44, 2.4, INK, 0) + e(28, 66, 7, 10, '#b0804a', 2.2, 30) + e(72, 66, 7, 10, '#b0804a', 2.2, -30) + o('M44 90 l-4 -4 l8 -6 l8 6 l-4 4Z', '#c8303a', 1.6),
  balloon: e(50, 38, 24, 28, '#d8303a') + o('M47 66 L53 66 L50 70Z', '#d8303a', 1.6) + l('M50 70 Q42 82 52 90 Q58 96 52 100', 1.6) + hl('M36 28 Q38 18 48 14'),
  candy: o('M34 36 Q50 26 66 36 Q72 50 66 64 Q50 74 34 64 Q28 50 34 36Z', '#e05a8a') + o('M34 40 L14 30 L18 50 L14 70 L34 60Z', '#f4b0c8') + o('M66 40 L86 30 L82 50 L86 70 L66 60Z', '#f4b0c8') + l('M40 38 Q56 50 44 62M54 36 Q64 50 56 64', 2, '#fff', 0.6),
  bread: o('M10 60 Q10 34 50 32 Q90 34 90 60 Q90 72 76 72 L24 72 Q10 72 10 60Z', '#d89a4a') + l('M30 42 q4 8 0 16M50 38 q4 8 0 16M70 42 q4 8 0 16', 2.4, '#8a5a1a') + hl('M20 50 Q30 38 46 36'),
  fishbone: e(20, 50, 10, 12, '#e8e0cc', 2.4) + c(16, 46, 2.4, INK, 0) + l('M28 50 L82 50', 3) + [36, 46, 56, 66, 76].map((x) => l(`M${x} 50 L${x - 6} 36M${x} 50 L${x - 6} 64`, 2)).join('') + o('M82 50 L94 38 L92 50 L94 62Z', '#e8e0cc', 2),
  feather: o('M24 86 Q30 40 76 12 Q70 44 38 76Z', '#6a8ac8') + l('M24 86 Q46 50 72 18', 1.8) + l('M40 64 l-8 -6M50 50 l-8 -6M58 38 l-6 -6M46 58 l8 2M54 46 l8 0M62 34 l8 0', 1.2, '#fff', 0.6),
  footprint: o('M30 34 Q28 58 36 70 Q46 76 50 66 Q54 50 46 34 Q38 26 30 34Z', '#3a2a20') + [[28, 22, 4], [36, 16, 4.4], [45, 16, 4], [52, 22, 3.4]].map(([x, y, r]) => c(x, y, r, '#3a2a20', 0)).join('') + o('M60 64 Q58 82 64 90 Q72 94 76 86 Q80 74 74 64 Q68 58 60 64Z', '#3a2a2088'),
  flashlight: o('M18 58 L60 36 L68 50 L26 72Z', '#3a3a40') + o('M58 30 L74 22 L84 42 L68 50Z', '#d8a830') + o('M74 22 Q82 14 90 30 Q88 40 84 42Z', '#f8f0a0') + o('M84 30 L100 18 L100 60 L86 40Z', '#f8f0a055', 0) + c(38, 56, 3, '#c8303a', 1.2),
  wax: o('M20 70 Q18 56 30 56 Q34 44 44 50 Q54 38 64 50 Q78 48 80 62 Q90 64 86 74 Q50 82 20 70Z', '#f4ecd0') + o('M40 50 q-2 10 2 14 q4 -6 -2 -14Z', '#f4ecd0', 1.4) + o('M66 52 q-2 8 2 12', 'none', 1.4) + e(52, 70, 18, 4, '#e8dcb8', 0),
  recorder: o('M14 30 h72 q4 0 4 4 v36 q0 4 -4 4 h-72 q-4 0 -4 -4 v-36 q0 -4 4 -4Z', '#3a3a40') + c(34, 50, 10, '#c8c0b0', 2) + c(66, 50, 10, '#c8c0b0', 2) + o('M40 44 h20 v12 h-20Z', '#6a4a2a', 1.4) + c(22, 36, 2.4, '#e0303a', 1),
  string: l('M12 80 Q30 20 50 50 Q70 80 88 20', 1.4, '#d8d8e0') + l('M14 84 Q32 26 52 56 Q72 86 90 26', 1.2, '#c8a860') + c(12, 80, 3, '#d8a830', 1.2) + c(88, 20, 3, '#d8a830', 1.2),
  ticket: o('M10 30 h80 v14 q-6 0 -6 6 q0 6 6 6 v14 h-80 v-14 q6 0 6 -6 q0 -6 -6 -6Z', '#e8c43a') + l('M66 30 v40', 1.6, INK, 0.6) + l('M18 40 h40M18 50 h30M18 60 h36', 2, '#8a5a1a') + o('M74 44 l4 -6 l4 6 l-4 6Z', '#c8303a', 1.2),
  map: o('M10 24 L36 16 L64 26 L90 18 L90 76 L64 84 L36 74 L10 82Z', '#e8dcb0') + l('M36 16 v58M64 26 v58', 1.2, '#9a8a60') + l('M18 64 Q34 40 50 52 Q64 62 78 36', 2, '#6a8ac8') + l('M70 46 l8 8M78 46 l-8 8', 2.6, '#c8303a'),
  medbottle: o('M30 30 h40 v50 q0 6 -6 6 h-28 q-6 0 -6 -6Z', '#c87a3a') + o('M32 18 h36 v12 h-36Z', '#f4f0e6') + o('M34 46 h32 v22 h-32Z', '#f4f0e6', 1.6) + l('M44 52 v10M39 57 h10', 2, '#c8303a') + hl('M36 34 v42'),
  bandage: e(40, 54, 26, 26, '#f4f0e6', 2.6) + e(40, 54, 10, 10, '#e0d8c8', 2) + o('M60 44 L92 36 L94 50 L64 58Z', '#f4f0e6', 2.2) + l('M22 44 q18 -8 36 0', 1, '#bbb') + o('M80 42 q6 2 4 8 q-6 0 -4 -8Z', BLOOD, 1),
  thermo: o('M20 76 L70 26 Q76 20 82 26 Q86 32 80 38 L30 88Z', GLASS + 'cc') + c(22, 82, 7, '#c8303a') + l('M26 78 L58 46', 3, '#c8303a') + l('M40 58 l4 4M50 48 l4 4M60 38 l4 4', 1.2),
  necklace: l('M14 16 Q16 70 50 76 Q84 70 86 16', 2, '#d8a830') + [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const t = i / 8; const x = 14 + 72 * t; const y = 16 + 60 * Math.sin(Math.PI * t) ** 1.1; return c(x.toFixed(1), y.toFixed(1), 3, '#f8f4ea', 1.2); }).join('') + o('M44 76 L50 88 L56 76 L50 70Z', '#3a8ad8', 1.6),
  mahjong: o('M22 16 h40 q4 0 4 4 v58 q0 4 -4 4 h-40 q-4 0 -4 -4 v-58 q0 -4 4 -4Z', '#f4f0e6') + o('M62 20 h6 v58 h-6Z', '#3a8a4a', 1.6) + l('M32 30 h20M42 30 v24M32 42 h20M30 54 q12 10 24 0', 2.6, '#c8303a') + o('M50 26 h36 q4 0 4 4 v58 q0 4 -4 4 h-36Z', '#e8e0d0', 2) + [[58, 40], [74, 40], [66, 56], [58, 72], [74, 72]].map(([x, y]) => c(x, y, 4, '#3a6ac8', 1.4)).join(''),
  chopsticks: o('M20 90 L70 10 L74 12 L26 92Z', '#b0803a') + o('M32 92 L86 14 L90 16 L38 94Z', '#b0803a') + l('M62 22 l6 4M78 26 l6 4', 1.6, '#c8303a'),
  fan: o('M50 86 L10 40 Q50 0 90 40Z', '#c8303a') + l('M50 86 L10 40M50 86 L22 26M50 86 L36 16M50 86 L50 12M50 86 L64 16M50 86 L78 26M50 86 L90 40', 1.4, '#6a1a1a') + c(50, 86, 3, '#d8a830', 1.4) + o('M36 40 q10 -8 20 0 q-10 10 -20 0Z', '#f2cf4a', 1.2),
  lantern: l('M50 4 v10', 2) + o('M36 14 h28 v6 h-28Z', '#2a1a10') + e(50, 48, 26, 30, '#d8303a') + l('M50 18 v60M32 26 Q26 48 32 70M68 26 Q74 48 68 70', 1.4, '#8a1a1a') + o('M36 76 h28 v6 h-28Z', '#2a1a10') + l('M44 82 v12M50 82 v14M56 82 v12', 1.6, '#e8b830') + e(50, 48, 12, 16, '#f8c060', 0),
  tape: e(46, 50, 30, 30, '#d8c8a0', 2.6) + e(46, 50, 14, 14, '#f6ecd4', 2) + o('M72 36 L94 30 L96 44 L74 50Z', '#e8dcb8cc', 1.6) + l('M22 40 q10 -14 26 -16', 1.4, '#fff', 0.6),
  nail: o('M22 30 h36 v8 h-36Z', STEEL) + o('M36 38 h8 v40 l-4 12 l-4 -12Z', METAL) + hl('M38 42 v34') + o('M60 50 h28 v6 h-28Z', STEEL, 1.8) + o('M66 56 h5 v28 l-2.5 8 l-2.5 -8Z', METAL, 1.8),
  paint: o('M24 34 h52 v50 q0 6 -6 6 h-40 q-6 0 -6 -6Z', METAL) + e(50, 34, 26, 6, '#c8203a') + o('M30 36 q4 20 0 30 q6 4 8 -4 q2 -16 -2 -26Z', '#c8203a', 1.6) + l('M24 30 Q50 6 76 30', 2) + o('M60 92 q6 -8 14 0Z', '#c8203a', 1.4),
  mask: o('M18 38 Q50 22 82 38 Q86 64 70 72 Q58 70 50 60 Q42 70 30 72 Q14 64 18 38Z', '#f4f0e6') + e(36, 46, 8, 5, '#1a1210', 1.6, 10) + e(64, 46, 8, 5, '#1a1210', 1.6, -10) + l('M40 62 Q50 66 60 62', 1.8) + l('M24 38 Q14 30 8 36M76 38 Q86 30 92 36', 1.6, '#c8303a') + o('M44 28 Q50 20 56 28', 'none', 2, ),
  bell: o('M50 16 Q28 20 28 50 L22 66 L78 66 L72 50 Q72 20 50 16Z', '#d8a830') + c(50, 72, 6, '#b88a20') + c(50, 12, 4, 'none', 2.4) + l('M30 60 h40', 2) + hl('M38 30 Q34 44 36 56') + l('M14 44 q-6 6 0 12M86 44 q6 6 0 12', 1.6, INK, 0.6),
  towel: o('M16 30 h60 v52 h-60Z', '#6ab0c8') + o('M16 30 Q10 34 14 40 L16 82', 'none', 2) + l('M16 70 h60M16 76 h60', 3, '#f4f0e6') + o('M76 30 Q84 34 80 42 L76 82', '#5a9ab0', 2) + l('M24 40 q6 4 12 0', 1.2, '#fff', 0.5),
  battery: o('M18 36 h58 v28 h-58Z', '#2a2a2e') + o('M18 36 h20 v28 h-20Z', '#d8a830') + o('M76 44 h6 v12 h-6Z', METAL, 1.8) + l('M56 44 v12M50 50 h12', 2.4, '#f4f0e6') + hl('M22 40 h50'),
  leaf: o('M20 80 Q16 30 70 14 Q86 50 44 76Z', '#c8783a') + l('M20 80 Q42 50 66 20', 1.8, '#6a3a1a') + l('M34 60 l-8 -8M44 48 l-6 -10M52 38 l-2 -10M40 56 l10 2M50 44 l12 0', 1.2, '#6a3a1a'),
};

/* 카드 앞면 영어 이름 (실제 인쇄 카드처럼 한 줄 곁들인다) */
const EN = { fishline: 'FISHING LINE', bathtub: 'BATHTUB', choco: 'CHOCOLATE', dryer: 'HAIR DRYER', golf: 'GOLF CLUB', bat: 'BASEBALL BAT', shard: 'BROKEN GLASS', bag: 'PLASTIC BAG', pot: 'FLOWER POT', bee: 'BEE SWARM', bike: 'MOTORBIKE', gas: 'GASOLINE', pills: 'SLEEPING PILLS', cable: 'POWER CORD', firecracker: 'FIRECRACKER', hanky: 'HANDKERCHIEF', keycard: 'KEY CARD', cigarette: 'CIGARETTE BUTT', sneakers: 'SNEAKERS', heels: 'HIGH HEELS', hat: 'FEDORA', petal: 'PETALS', soil: 'SOIL', chess: 'CHESS PIECE', teddy: 'TEDDY BEAR', fishbone: 'FISH BONE', footprint: 'FOOTPRINT', wax: 'CANDLE WAX', recorder: 'TAPE RECORDER', string: 'GUITAR STRING', ticket: 'CONCERT TICKET', medbottle: 'MEDICINE', thermo: 'THERMOMETER', mahjong: 'MAHJONG TILE', lantern: 'PAPER LANTERN', paint: 'RED PAINT', mask: 'OPERA MASK' };
const enName = (card) => (EN[card.key] || card.key.replace(/([a-z])([A-Z])/g, '$1 $2')).toUpperCase();
const CARD_NO = {};

/** 카드 한 장 (수단 = 청록 테두리, 단서 = 빨간 테두리). w 픽셀 너비
    실제 인쇄 카드처럼: 결 있는 테두리 · 머리띠 · 조명 받은 입체 물건 · 이름 띠 */
let seq = 0;
export function cardSvg(card, { w = 96, sel = false, dim = false, uid = '' } = {}) {
  const id = `kc${++seq}${uid}`;
  const means = card.kind === 'm';
  const frame = means ? '#16505c' : '#8a1a22';
  const frame2 = means ? '#2a8a9a' : '#c8343c';
  const deep = means ? '#0a2a32' : '#4a0a10';
  const glow = means ? '#e4f4f4' : '#fbeee6';
  const art = OBJ[card.key] || '';
  if (!CARD_NO[card.id]) CARD_NO[card.id] = String(Object.keys(CARD_NO).length + 1).padStart(3, '0');
  const name = card.name;
  const big = name.length <= 4 ? 25 : name.length <= 6 ? 21 : 17;
  const icon = means
    ? '<path d="M-7 7 L5 -5 L8 -8 L9 -9 L8 -6 L6 -3 L-5 8Z M-9 5 L-5 9" fill="#f4ecd8" stroke="#f4ecd8" stroke-width="1.4" stroke-linejoin="round"/>'
    : '<circle cx="-2" cy="-2" r="5.4" fill="none" stroke="#f4ecd8" stroke-width="2.4"/><path d="M2 2 L8 8" stroke="#f4ecd8" stroke-width="3" stroke-linecap="round"/>';
  return `<svg class="kcard ${means ? 'means' : 'clue'} ${sel ? 'sel' : ''} ${dim ? 'dim' : ''}" viewBox="0 0 200 280" width="${w}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}">
<defs>
  <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${frame2}"/><stop offset=".45" stop-color="${frame}"/><stop offset="1" stop-color="${deep}"/></linearGradient>
  <radialGradient id="${id}bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="${glow}"/><stop offset="1" stop-color="${means ? '#9cc4c8' : '#dcaea4'}"/></radialGradient>
  <linearGradient id="${id}band" x2="0" y2="1"><stop offset="0" stop-color="${deep}"/><stop offset="1" stop-color="#0a0608"/></linearGradient>
  <filter id="${id}tx" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="${seq % 40}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter>
  <!-- 물건을 입체로: 가장자리 부풀림 + 반짝이는 빛 + 아래 그림자 -->
  <filter id="${id}3d" x="-20%" y="-20%" width="140%" height="150%">
    <feMorphology in="SourceAlpha" operator="erode" radius="1" result="core"/>
    <feGaussianBlur in="core" stdDeviation="3.2" result="bump"/>
    <feSpecularLighting in="bump" surfaceScale="5" specularConstant=".95" specularExponent="22" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="235" elevation="42"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feDiffuseLighting in="bump" surfaceScale="5" diffuseConstant="1.05" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting>
    <feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="SourceGraphic" operator="arithmetic" k1="0" k2=".55" k3=".55" k4="0" result="mixd"/>
    <feComposite in="mixd" in2="specIn" operator="arithmetic" k1="0" k2="1" k3=".75" k4="0" result="shiny"/>
    <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="${seq % 50}" result="wob"/>
    <feDisplacementMap in="shiny" in2="wob" scale="1.6" result="drawn"/>
    <feDropShadow in="drawn" dx="3" dy="7" stdDeviation="4" flood-color="#1a0a06" flood-opacity=".45"/>
  </filter>
  <clipPath id="${id}w"><rect x="16" y="46" width="168" height="168" rx="8"/></clipPath>
</defs>
<rect x="1" y="1" width="198" height="278" rx="14" fill="#0a0608"/>
<rect x="4" y="4" width="192" height="272" rx="12" fill="url(#${id}f)"/>
<rect x="4" y="4" width="192" height="272" rx="12" filter="url(#${id}tx)"/>
<rect x="9" y="9" width="182" height="262" rx="9" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="1.2"/>
<g transform="translate(26 27)"><circle r="12" fill="${deep}" stroke="#f4ecd8" stroke-opacity=".7" stroke-width="1.4"/>${icon}</g>
<text x="44" y="25" font-family="'Black Han Sans','Noto Sans KR',sans-serif" font-size="15" fill="#f8f0dc" letter-spacing="1">${means ? '수단' : '단서'}</text>
<text x="44" y="37" font-family="'Special Elite',monospace" font-size="8.5" fill="#f8f0dc" fill-opacity=".75" letter-spacing="2">${means ? 'MEANS OF MURDER' : 'KEY EVIDENCE'}</text>
<text x="184" y="30" text-anchor="end" font-family="'Special Elite',monospace" font-size="10" fill="#f8f0dc" fill-opacity=".6">No.${CARD_NO[card.id]}</text>
<g clip-path="url(#${id}w)">
  <rect x="16" y="46" width="168" height="168" fill="url(#${id}bg)"/>
  <g opacity=".13" stroke="${frame}" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<path d="M${16 + i * 16} 214 l24 -24"/>`).join('')}</g>
  <ellipse cx="100" cy="196" rx="58" ry="9" fill="#2a1410" opacity=".22"/>
  <g filter="url(#${id}3d)" transform="translate(21 42) scale(1.58)">${art}</g>
  <rect x="16" y="46" width="168" height="168" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="6"/>
</g>
<rect x="16" y="46" width="168" height="168" rx="8" fill="none" stroke="#f8f0dc" stroke-opacity=".85" stroke-width="2"/>
<rect x="12" y="222" width="176" height="48" rx="7" fill="url(#${id}band)"/>
<rect x="12" y="222" width="176" height="48" rx="7" fill="none" stroke="${frame2}" stroke-opacity=".8" stroke-width="1.4"/>
<text x="100" y="${big > 20 ? 250 : 248}" text-anchor="middle" font-family="'Black Han Sans','Noto Sans KR',sans-serif" font-size="${big}" fill="#fbf4e2" letter-spacing=".5">${name}</text>
<text x="100" y="263" text-anchor="middle" font-family="'Special Elite',monospace" font-size="8.5" fill="${means ? '#8ad8e4' : '#f4a0a0'}" letter-spacing="2.2">${enName(card)}</text>
</svg>`;
}
