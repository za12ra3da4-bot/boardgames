'use strict';
// 용의자 초상화 6종: 명암·림라이트·필름 그레인이 들어간 누아르 유화풍
const { svg, lin, rad, grainFilter, blur, rng, f } = require('./lib');

function lattice(color, op, step = 30) {
  let d = '';
  for (let k = -400; k < 700; k += step) d += `M${k} 0L${k + 380} 380M${k} 380L${k + 380} 0`;
  return `<path d="${d}" stroke="${color}" stroke-opacity="${op}" stroke-width="1" fill="none"/>`;
}

function eye(o) {
  const { cx, cy, w = 30, h = 13, iris = '#4a3020', skin, lid = '#1a1012', heavy = 0, squint = 0, lash = false, side = 'L', id, bag = false } = o;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const topY = cy - h * 0.72 + squint * h * 0.35;
  const botY = cy + h * 0.5 - squint * h * 0.25;
  const almond = `M${f(x0)} ${cy}C${f(cx - w * 0.22)} ${f(topY)} ${f(cx + w * 0.22)} ${f(topY)} ${f(x1)} ${cy}C${f(cx + w * 0.22)} ${f(botY)} ${f(cx - w * 0.22)} ${f(botY)} ${f(x0)} ${cy}Z`;
  const lidY = topY + heavy * h * 0.85;
  const lidPath = `M${f(x0 - 1)} ${cy}C${f(cx - w * 0.22)} ${f(lidY)} ${f(cx + w * 0.22)} ${f(lidY)} ${f(x1 + 1)} ${cy}`;
  const r = h * 0.5;
  const ix = cx + (side === 'L' ? 1.2 : -1.2);
  const dir = side === 'L' ? -1 : 1;
  const outer = side === 'L' ? x0 : x1;
  return `
    <clipPath id="${id}"><path d="${almond}"/></clipPath>
    <path d="${almond}" fill="#efe6dc"/>
    <g clip-path="url(#${id})">
      <circle cx="${f(ix)}" cy="${f(cy + 0.6)}" r="${f(r)}" fill="${iris}"/>
      <circle cx="${f(ix)}" cy="${f(cy + 0.6)}" r="${f(r * 0.72)}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="${f(r * 0.3)}"/>
      <circle cx="${f(ix)}" cy="${f(cy + 0.6)}" r="${f(r * 0.42)}" fill="#0a0707"/>
      <circle cx="${f(ix - r * 0.35)}" cy="${f(cy - r * 0.3)}" r="${f(r * 0.2)}" fill="#fff" fill-opacity=".92"/>
      <path d="M${f(x0 - 2)} ${f(cy - h * 1.2)}L${f(x1 + 2)} ${f(cy - h * 1.2)}L${f(x1 + 2)} ${cy}C${f(cx + w * 0.22)} ${f(lidY)} ${f(cx - w * 0.22)} ${f(lidY)} ${f(x0 - 2)} ${cy}Z" fill="${skin}"/>
      <path d="${lidPath}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="${f(h * 0.4)}"/>
    </g>
    <path d="${lidPath}" fill="none" stroke="${lid}" stroke-width="${o.lidW || 2.6}" stroke-linecap="round"/>
    <path d="M${f(x0 + 2)} ${f(cy - h * 0.3)}C${f(cx - w * 0.2)} ${f(lidY - h * 0.6)} ${f(cx + w * 0.2)} ${f(lidY - h * 0.6)} ${f(x1 - 1)} ${f(cy - h * 0.35)}" fill="none" stroke="${o.crease || '#7a4a3a'}" stroke-opacity=".5" stroke-width="1.3"/>
    <path d="M${f(x0 + 3)} ${f(cy + 1.5)}C${f(cx - w * 0.2)} ${f(botY + 1)} ${f(cx + w * 0.2)} ${f(botY + 1)} ${f(x1 - 3)} ${f(cy + 1.5)}" fill="none" stroke="${o.lower || '#8e5e4c'}" stroke-opacity=".55" stroke-width="1.1"/>
    ${bag ? `<path d="M${f(x0 + 4)} ${f(cy + h * 0.75)}C${f(cx - w * 0.15)} ${f(cy + h * 1.3)} ${f(cx + w * 0.2)} ${f(cy + h * 1.3)} ${f(x1 - 2)} ${f(cy + h * 0.7)}" fill="none" stroke="${o.bagColor || '#7a4a3a'}" stroke-opacity=".5" stroke-width="1.5"/>` : ''}
    ${lash ? `<path d="M${f(outer)} ${cy}l${dir * 7} -4M${f(outer - dir * 3)} ${f(cy - h * 0.38)}l${dir * 5} -6M${f(outer - dir * 8)} ${f(cy - h * 0.58)}l${dir * 2.5} -6.5" stroke="${lid}" stroke-width="1.7" stroke-linecap="round"/>` : ''}`;
}

const brow = (x1, y1, x2, y2, arch, w, color) =>
  `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${Math.min(y1, y2) - arch} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
   <path d="M${x1} ${y1 + w * 0.15}Q${(x1 + x2) / 2} ${Math.min(y1, y2) - arch + w * 0.2} ${x2} ${y2}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="${w * 0.5}" stroke-linecap="round"/>`;

function nose({ cx, top, bottom, w = 18, shade = '#a8664a', big = 0 }) {
  const b = bottom;
  return `
    <path d="M${cx + 3} ${top}C${cx + 6} ${(top + b) / 2} ${cx + 9 + big} ${b - 10} ${cx + 11 + big} ${b - 3}" fill="none" stroke="${shade}" stroke-width="2.6" stroke-opacity=".75" stroke-linecap="round"/>
    <path d="M${cx - w / 2 - big} ${b - 2}C${cx - w / 2 - 4 - big} ${b + 4} ${cx - 5} ${b + 6} ${cx - 2} ${b + 2}" fill="none" stroke="${shade}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M${cx + w / 2 + big} ${b - 2}C${cx + w / 2 + 4 + big} ${b + 4} ${cx + 5} ${b + 6} ${cx + 2} ${b + 2}" fill="none" stroke="${shade}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M${cx - 12 - big} ${b + 1}C${cx - 6} ${b + 9} ${cx + 6} ${b + 9} ${cx + 12 + big} ${b + 1}" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="4"/>
    <ellipse cx="${cx - 1}" cy="${b - 6}" rx="${4 + big * 0.6}" ry="3" fill="#fff" opacity=".22"/>`;
}

function mouth({ cx, cy, w = 30, curve = 0, color = '#6a3a2e', lower = '#b06a58' }) {
  return `
    <path d="M${cx - w / 2} ${cy}C${cx - w / 6} ${cy + curve} ${cx + w / 6} ${cy + curve} ${cx + w / 2} ${cy}" fill="none" stroke="${color}" stroke-width="2.7" stroke-linecap="round"/>
    <path d="M${cx - w * 0.3} ${cy + 5}C${cx - w * 0.1} ${cy + 10} ${cx + w * 0.1} ${cy + 10} ${cx + w * 0.3} ${cy + 5}" fill="none" stroke="${lower}" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M${cx - w * 0.25} ${cy + 13}C${cx - w * 0.08} ${cy + 15} ${cx + w * 0.08} ${cy + 15} ${cx + w * 0.25} ${cy + 13}" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="3"/>`;
}

const rim = (paths, color, width = 5) =>
  `<g mask="url(#rimMask)" opacity=".8" filter="url(#soft)">${paths.map((d) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`).join('')}</g>`;

function tufts(seed, pts, colors) {
  const r = rng(seed);
  return pts.map(([x, y]) => {
    const a = r() * Math.PI * 2;
    const len = 5 + r() * 6;
    return `<path d="M${f(x)} ${f(y)}q${f(Math.cos(a) * len * 0.6)} ${f(Math.sin(a) * len * 0.6 - 3)} ${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}" stroke="${colors[Math.floor(r() * colors.length)]}" stroke-width="${f(1.3 + r() * 1.2)}" fill="none" stroke-linecap="round"/>`;
  }).join('');
}

function scatter(seed, n, box) {
  const r = rng(seed);
  return Array.from({ length: n }, () => [box[0] + r() * (box[2] - box[0]), box[1] + r() * (box[3] - box[1])]);
}

function portrait({ bg, rimColor, defs, body }) {
  const allDefs = `
    ${rad('bg', bg, 0.5, 0.36, 0.8)}
    ${lin('rimFade', [[0, '#000'], [0.52, '#000'], [1, '#fff']], 0, 0, 1, 0)}
    <mask id="rimMask" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="380"><rect width="300" height="380" fill="url(#rimFade)"/></mask>
    ${rad('vig', [[0.5, '#000', 0], [1, '#000', 0.78]], 0.5, 0.42, 0.78)}
    ${rad('glow', [[0, rimColor, 0.42], [1, rimColor, 0]], 0.5, 0.5, 0.5)}
    ${grainFilter('grain')}
    ${blur('soft', 1.6)}
    ${lin('gold', [[0, '#fff1b8'], [0.45, '#d8a93c'], [1, '#6e4a12']])}
    ${defs}`;
  const content = `<rect width="300" height="380" fill="url(#bg)"/>${body}<rect width="300" height="380" fill="url(#vig)"/><rect width="300" height="380" filter="url(#grain)" opacity=".13"/>`;
  return {
    full: svg(300, 380, content, { defs: allDefs }),
    face: svg(200, 200, content, { defs: allDefs, vb: '48 56 204 204' }),
  };
}

// ───────────────────────── 한여사: 은퇴한 영화배우

function han() {
  const lidSkin = '#e3ad8a';
  const pearls = Array.from({ length: 15 }, (_, i) => {
    const t = i / 14;
    return `<circle cx="${f(116 + 68 * t)}" cy="${f(301 + 24 * Math.sin(Math.PI * t))}" r="3.5" fill="url(#pearl)"/>`;
  }).join('');
  const furL = `
    <path d="M34 380C34 330 56 297 96 292C121 296 129 318 121 341C109 365 89 373 83 380Z" fill="url(#fur)"/>
    ${tufts(11, [[44, 334], [52, 316], [64, 304], [80, 296], [98, 294], [112, 300], [121, 314], [122, 330], [116, 348], [104, 362], [92, 372], [60, 350], [74, 330], [90, 318], [100, 340]], ['#f7f0e4', '#cabfae', '#a3967f'])}`;
  const defs = [
    lin('skin', [[0, '#f8dcc4'], [0.5, '#ecbd9b'], [1, '#bf7c5d']], 0, 0, 1, 0.2),
    lin('hair', [[0, '#3d2733'], [1, '#0b0508']]),
    lin('dress', [[0, '#e2483e'], [0.55, '#a8211f'], [1, '#55080d']], 0, 0, 1, 1),
    rad('fur', [[0, '#fffaf2'], [0.65, '#e2d7c7'], [1, '#9e907c']], 0.45, 0.35, 0.75),
    rad('pearl', [[0, '#ffffff'], [0.55, '#ece6dc'], [1, '#9c9387']], 0.35, 0.3, 0.75),
  ].join('');
  const headD = 'M150 78C112 78 96 110 98 150C100 184 112 214 132 230C140 236 146 238 150 238C154 238 160 236 168 230C188 214 200 184 202 150C204 110 188 78 150 78Z';
  const hairD = 'M150 50C94 48 58 92 62 150C64 198 48 236 68 266C84 290 114 288 120 266L180 266C186 288 216 290 232 266C252 236 236 198 238 150C242 92 206 48 150 50Z';
  return portrait({
    bg: [[0, '#5a1a20'], [0.55, '#260a0e'], [1, '#0a0305']],
    rimColor: '#ff5a48',
    defs,
    body: `
    <ellipse cx="150" cy="160" rx="135" ry="160" fill="url(#glow)"/>
    ${lattice('#ff9a8a', 0.05)}
    <path d="${hairD}" fill="url(#hair)"/>
    <path d="M126 220C126 246 122 264 114 280L186 280C178 264 174 246 174 220Z" fill="url(#skin)"/>
    <path d="M126 222C138 244 162 244 174 222L174 244C162 258 138 258 126 244Z" fill="#8e5038" opacity=".45"/>
    <path d="M58 380C60 318 96 284 150 280C204 284 240 318 242 380Z" fill="url(#skin)"/>
    <path d="M104 300C120 307 134 307 145 302M155 302C166 307 180 307 196 300" fill="none" stroke="#a86a4e" stroke-width="2" opacity=".55"/>
    <path d="M50 380C54 344 70 324 92 316C114 336 132 348 150 348C168 348 186 336 208 316C230 324 246 344 250 380Z" fill="url(#dress)"/>
    <path d="M94 330C110 348 120 362 124 380" fill="none" stroke="#ff8a7a" stroke-width="3" opacity=".45"/>
    <path d="M206 330C194 350 186 364 184 380M150 350V380" fill="none" stroke="#3a0508" stroke-width="4" opacity=".5"/>
    ${furL}
    <g transform="translate(300 0) scale(-1 1)">${furL}</g>
    ${pearls}
    <path d="M150 324l-4.5 7 4.5 11 4.5-11z" fill="url(#pearl)"/>
    <path d="${headD}" fill="url(#skin)"/>
    <path d="M188 112C202 132 206 162 199 190C193 213 179 229 164 235C181 214 191 187 191 160C191 139 190 124 188 112Z" fill="#9e5c42" opacity=".38"/>
    <path d="M106 176C112 194 122 208 134 216C122 214 110 200 104 184Z" fill="#b8745a" opacity=".22"/>
    <path d="M99 150C89 145 86 165 93 176C97 181 102 179 102 172Z" fill="url(#skin)"/>
    <circle cx="97" cy="182" r="2.4" fill="url(#gold)"/><path d="M97 184v6" stroke="#d4a23a" stroke-width="1.2"/><circle cx="97" cy="195" r="4.8" fill="url(#pearl)"/>
    ${eye({ cx: 128, cy: 153, w: 32, h: 13, iris: '#4a2e1e', skin: lidSkin, heavy: 0.34, lash: true, side: 'L', id: 'hanL', lidW: 3.3, crease: '#6a2a3a' })}
    ${eye({ cx: 172, cy: 153, w: 32, h: 13, iris: '#4a2e1e', skin: lidSkin, heavy: 0.34, lash: true, side: 'R', id: 'hanR', lidW: 3.3, crease: '#6a2a3a' })}
    <path d="M111 148C118 134 138 133 147 147C139 140 120 140 111 148Z" fill="#5a1e30" opacity=".42"/>
    <path d="M153 147C162 133 182 134 189 148C180 140 161 140 153 147Z" fill="#5a1e30" opacity=".42"/>
    ${brow(144, 134, 110, 131, 10, 2.8, '#24141a')}
    ${brow(156, 134, 190, 131, 10, 2.8, '#24141a')}
    ${nose({ cx: 150, top: 160, bottom: 196, w: 17, shade: '#a0603f' })}
    <ellipse cx="116" cy="187" rx="15" ry="8" fill="#e46e6e" opacity=".2"/><ellipse cx="184" cy="187" rx="15" ry="8" fill="#e46e6e" opacity=".2"/>
    <path d="M131 214C139 207 145 207 150 211C155 207 161 207 169 214C160 217 140 217 131 214Z" fill="#860d20"/>
    <path d="M131 214C141 228 159 228 169 214C159 219 141 219 131 214Z" fill="#c4213a"/>
    <path d="M142 221C147 223 153 223 158 221" stroke="#ff9aa6" stroke-width="1.8" opacity=".55" fill="none" stroke-linecap="round"/>
    <path d="M169 214l4-2.5" stroke="#7a3a2e" stroke-width="1.4"/>
    <circle cx="171" cy="202" r="1.7" fill="#2a1418"/>
    <path d="M150 70C104 66 84 104 90 152C94 130 104 112 120 102C140 90 168 92 186 104C200 114 206 132 208 156C214 108 196 72 150 70Z" fill="url(#hair)"/>
    <path d="M120 100C150 84 198 92 212 132C216 150 214 172 207 194C202 162 190 134 170 121C156 112 140 107 120 100Z" fill="url(#hair)"/>
    <g fill="none" stroke-linecap="round">
      <path d="M116 99C140 86 172 88 194 104" stroke="#6e4858" stroke-width="3" opacity=".75"/>
      <path d="M130 92C146 86 164 88 178 96" stroke="#9a7282" stroke-width="1.6" opacity=".6"/>
      <path d="M176 112C194 124 204 144 205 166" stroke="#5a3844" stroke-width="2.5" opacity=".7"/>
      <path d="M100 124C94 138 92 152 92 166" stroke="#4a2c38" stroke-width="2.5" opacity=".6"/>
      <path d="M88 172C80 192 86 214 78 234C74 248 84 258 96 250" stroke="#3e2632" stroke-width="3.2" opacity=".85"/>
      <path d="M214 182C222 202 216 224 224 242C228 256 216 264 206 256" stroke="#3e2632" stroke-width="3.2" opacity=".85"/>
      <path d="M70 210C66 230 74 248 70 262" stroke="#2e1a24" stroke-width="3" opacity=".8"/>
    </g>
    <circle cx="192" cy="94" r="9" fill="#a8172a"/><circle cx="192" cy="94" r="5" fill="none" stroke="#e24a5a" stroke-width="1.5"/>
    <path d="M198 88c14-10 30-10 36-2-10 0-22 4-32 10z" fill="#1a0c10" opacity=".85"/>
    ${rim([headD, hairD, 'M58 380C60 318 96 284 150 280C204 284 240 318 242 380'], '#ff5a48')}`,
  });
}

// ───────────────────────── 강대령: 퇴역 육군 대령

function kang() {
  const headD = 'M150 84C110 84 94 110 94 150C94 188 100 214 116 232C128 244 140 250 150 250C160 250 172 244 184 232C200 214 206 188 206 150C206 110 190 84 150 84Z';
  const medals = ['#b73a36', '#3a64b7', '#e2b23a', '#2d7a4a', '#7a3fb0', '#e2e2e2'];
  const defs = [
    lin('skin', [[0, '#eebd96'], [0.5, '#dca47c'], [1, '#9e6444']], 0, 0, 1, 0.2),
    lin('uni', [[0, '#7c7040'], [0.6, '#5a5028'], [1, '#2e2912']], 0, 0, 1, 1),
    lin('cap', [[0, '#7a6e3c'], [1, '#403818']]),
    lin('visor', [[0, '#3a332a'], [0.4, '#0e0c0a'], [1, '#050404']]),
    lin('stache', [[0, '#f2eee6'], [1, '#a7a196']]),
  ].join('');
  return portrait({
    bg: [[0, '#4e3f16'], [0.55, '#1e1808'], [1, '#080602']],
    rimColor: '#f2c14a',
    defs,
    body: `
    <ellipse cx="150" cy="170" rx="140" ry="160" fill="url(#glow)"/>
    ${lattice('#f2d68a', 0.04, 36)}
    <path d="M40 380C44 320 84 290 150 286C216 290 256 320 260 380Z" fill="url(#uni)"/>
    <path d="M150 300V380" stroke="#2a2410" stroke-width="3" opacity=".6"/>
    <path d="M124 234L176 234L178 276L122 276Z" fill="url(#skin)"/>
    <path d="M122 240C138 258 162 258 178 240L178 262C162 274 138 274 122 262Z" fill="#6a3a22" opacity=".45"/>
    <path d="M130 272L150 302L170 272Z" fill="#d9cfb2"/>
    <path d="M144 282L156 282L161 322L150 338L139 322Z" fill="#3a331a"/>
    <path d="M112 262L150 304L188 262L198 292L150 330L102 292Z" fill="#665c30"/>
    <path d="M112 262L150 304L188 262" fill="none" stroke="#9a8c56" stroke-width="2" opacity=".6"/>
    <path d="M114 282l6 2-4 5 1-6-5-3zM186 282l-6 2 4 5-1-6 5-3z" fill="#e2b23a"/>
    <path d="M48 318C68 300 98 294 114 298L110 318C92 316 72 322 56 334Z" fill="url(#gold)"/>
    <path d="M252 318C232 300 202 294 186 298L190 318C208 316 228 322 244 334Z" fill="url(#gold)"/>
    <path d="M58 334l-4 12M66 328l-3 13M74 324l-2 13M82 321l-1 13M90 319v13M98 318l1 13M244 334l4 12M236 328l3 13M228 324l2 13M220 321l1 13M212 319v13M204 318l-1 13" stroke="#b08a2a" stroke-width="2"/>
    ${medals.map((c, i) => `<rect x="${172 + (i % 3) * 16}" y="${326 + Math.floor(i / 3) * 10}" width="14" height="8" fill="${c}"/><rect x="${172 + (i % 3) * 16}" y="${326 + Math.floor(i / 3) * 10}" width="14" height="8" fill="none" stroke="#000" stroke-opacity=".35"/>`).join('')}
    <path d="M186 348v10" stroke="#b73a36" stroke-width="5"/><circle cx="186" cy="364" r="7" fill="url(#gold)"/><path d="M186 359l1.6 3.4 3.8.5-2.8 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.8-2.6 3.8-.5z" fill="#8a6a1a"/>
    <circle cx="150" cy="346" r="4" fill="url(#gold)"/><circle cx="150" cy="370" r="4" fill="url(#gold)"/>
    <path d="M95 150C84 146 82 170 90 180C94 184 98 182 98 176Z" fill="url(#skin)"/>
    <path d="M205 150C216 146 218 170 210 180C206 184 202 182 202 176Z" fill="#b87a56"/>
    <path d="${headD}" fill="url(#skin)"/>
    <path d="M190 120C204 142 206 176 198 204C192 224 180 238 166 246C184 224 194 196 194 168C194 146 192 132 190 120Z" fill="#7a4228" opacity=".38"/>
    <path d="M96 130C94 142 94 154 96 164L103 164C101 152 101 140 103 130ZM204 130C206 142 206 154 204 164L197 164C199 152 199 140 197 130Z" fill="#bdb6a8"/>
    <path d="M100 146C120 158 180 158 200 146L200 132L100 132Z" fill="#000" opacity=".28"/>
    ${eye({ cx: 128, cy: 156, w: 30, h: 12, iris: '#5a6a78', skin: '#d59c74', heavy: 0.38, squint: 0.45, side: 'L', id: 'kangL', bag: true, lidW: 2.8 })}
    ${eye({ cx: 172, cy: 156, w: 30, h: 12, iris: '#5a6a78', skin: '#c88e66', heavy: 0.38, squint: 0.45, side: 'R', id: 'kangR', bag: true, lidW: 2.8 })}
    <path d="M110 162l-5 4M110 158l-6 1M190 162l5 4M190 158l6 1" stroke="#8a5234" stroke-width="1.3" opacity=".7"/>
    ${brow(142, 144, 108, 138, 3, 7, '#d6d0c4')}
    ${brow(158, 144, 192, 138, 3, 7, '#d6d0c4')}
    <circle cx="172" cy="157" r="17" fill="#d8ecf8" fill-opacity=".13" stroke="url(#gold)" stroke-width="3.2"/>
    <path d="M160 146a15 15 0 0 1 14-5" stroke="#fff" stroke-width="2" opacity=".55" fill="none"/>
    <path d="M188 164C200 196 206 236 200 272" stroke="#d9b45a" stroke-width="1.6" stroke-dasharray="3 2" fill="none"/>
    <path d="M182 176L194 212" stroke="#a86a52" stroke-width="3.5" stroke-linecap="round"/><path d="M183 177L195 213" stroke="#e8b89a" stroke-width="1.2" opacity=".8"/>
    ${nose({ cx: 150, top: 164, bottom: 200, w: 22, shade: '#8a5234', big: 3 })}
    <path d="M126 204C120 214 120 226 126 236M174 204C180 214 180 226 174 236" stroke="#8a5234" stroke-width="2" opacity=".5" fill="none"/>
    <path d="M150 204C140 200 124 200 114 208C104 216 92 216 84 208C86 220 98 226 112 224C126 222 140 216 150 212C160 216 174 222 188 224C202 226 214 220 216 208C208 216 196 216 186 208C176 200 160 200 150 204Z" fill="url(#stache)"/>
    <path d="M144 208C132 206 120 210 110 216M156 208C168 206 180 210 190 216M146 212C134 214 122 218 112 222M154 212C166 214 178 218 188 222" stroke="#8f897e" stroke-width="1.2" fill="none" opacity=".8"/>
    <path d="M136 232C146 229 154 229 164 232" stroke="#6a3a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M146 244C148 248 152 248 154 244" stroke="#8a5234" stroke-width="1.5" fill="none" opacity=".6"/>
    <path d="M86 122C84 88 116 64 152 64C192 64 220 84 218 114L214 126L88 128Z" fill="url(#cap)"/>
    <path d="M104 90C124 74 176 72 200 88" stroke="#a89a60" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M88 112L214 110L214 128L88 130Z" fill="#2a2414"/>
    <path d="M88 112L214 110M88 130L214 128" stroke="url(#gold)" stroke-width="2.6"/>
    <path d="M110 121h82" stroke="#d9b45a" stroke-width="1.4" stroke-dasharray="4 3"/>
    <circle cx="150" cy="96" r="13" fill="url(#gold)"/><circle cx="150" cy="96" r="9" fill="none" stroke="#7a5a1a" stroke-width="1.4"/>
    <path d="M150 88l2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z" fill="#7a5a1a"/>
    <path d="M134 98c-6-2-10-8-10-14M166 98c6-2 10-8 10-14" stroke="#d9b45a" stroke-width="2" fill="none"/>
    <path d="M84 128C110 120 192 120 220 126C214 144 188 150 150 150C112 150 88 144 84 128Z" fill="url(#visor)"/>
    <path d="M98 132C124 126 178 126 204 130" stroke="#6a6258" stroke-width="2" fill="none" opacity=".7"/>
    ${rim([headD, 'M86 122C84 88 116 64 152 64C192 64 220 84 218 114', 'M40 380C44 320 84 290 150 286C216 290 256 320 260 380'], '#ffd05a')}`,
  });
}

// ───────────────────────── 백집사: 30년 차 집사

function baek() {
  const headD = 'M150 70C116 70 102 100 102 144C102 190 110 222 126 240C136 250 144 254 150 254C156 254 164 250 174 240C190 222 198 190 198 144C198 100 184 70 150 70Z';
  const defs = [
    lin('skin', [[0, '#f5dcc6'], [0.5, '#e6c2a6'], [1, '#a88068']], 0, 0, 1, 0.2),
    lin('silver', [[0, '#f4f2ee'], [0.6, '#c9c6be'], [1, '#86837c']]),
    lin('coat', [[0, '#2a2b33'], [0.5, '#131419'], [1, '#050507']], 0, 0, 1, 1),
    lin('satin', [[0, '#3e404a'], [1, '#15161b']], 0, 0, 1, 0),
    lin('shirt', [[0, '#ffffff'], [1, '#cfcac0']]),
  ].join('');
  return portrait({
    bg: [[0, '#3a4252'], [0.55, '#161a22'], [1, '#06070a']],
    rimColor: '#dfe6ff',
    defs,
    body: `
    <ellipse cx="150" cy="170" rx="140" ry="165" fill="url(#glow)"/>
    ${lattice('#dfe6ff', 0.035, 26)}
    <path d="M44 380C48 322 88 292 150 288C212 292 252 322 256 380Z" fill="url(#coat)"/>
    <path d="M132 290L150 380L168 290Z" fill="url(#shirt)"/>
    <path d="M128 300L150 380L172 300L164 294L150 316L136 294Z" fill="#6b6e78"/>
    <circle cx="150" cy="332" r="2.6" fill="#c9ccd6"/><circle cx="150" cy="352" r="2.6" fill="#c9ccd6"/>
    <path d="M136 350C146 364 166 362 176 346" stroke="url(#gold)" stroke-width="2.2" fill="none"/>
    <path d="M122 286L150 380L98 380L90 318Z" fill="url(#satin)"/>
    <path d="M178 286L150 380L202 380L210 318Z" fill="url(#satin)"/>
    <path d="M122 286L150 380M178 286L150 380" stroke="#6a6c78" stroke-width="1.6" opacity=".7"/>
    <path d="M126 232L174 232L178 276L122 276Z" fill="url(#skin)"/>
    <path d="M126 238C138 256 162 256 174 238L176 262C162 272 138 272 124 262Z" fill="#7a5540" opacity=".4"/>
    <path d="M147 250C150 256 153 256 154 250" stroke="#9a7058" stroke-width="1.4" fill="none"/>
    <path d="M124 262L150 282L176 262L182 284L150 298L118 284Z" fill="url(#shirt)"/>
    <path d="M150 292C136 282 122 284 120 292C122 300 136 302 150 294C164 302 178 300 180 292C178 284 164 282 150 292Z" fill="#f6f4ee"/>
    <path d="M150 292C136 282 122 284 120 292C122 300 136 302 150 294C164 302 178 300 180 292C178 284 164 282 150 292Z" fill="none" stroke="#a8a49a" stroke-width="1"/>
    <rect x="145" y="287" width="10" height="10" rx="2" fill="#e8e5dc" stroke="#a8a49a"/>
    <path d="M103 146C92 142 90 164 97 174C100 178 105 176 105 170Z" fill="url(#skin)"/>
    <path d="M197 146C208 142 210 164 203 174C200 178 195 176 195 170Z" fill="#b89078"/>
    <path d="${headD}" fill="url(#skin)"/>
    <path d="M182 110C196 132 198 170 192 200C186 224 176 240 162 250C178 226 186 198 186 170C186 144 186 124 182 110Z" fill="#7e5a44" opacity=".35"/>
    <path d="M104 128C100 92 120 64 152 62C184 64 202 90 196 128C190 110 186 100 176 94C160 88 140 88 124 94C114 100 108 112 104 128Z" fill="url(#silver)"/>
    <path d="M102 128C100 150 102 168 106 180L112 172C110 158 110 142 110 128ZM198 128C200 150 198 168 194 180L188 172C190 158 190 142 190 128Z" fill="url(#silver)"/>
    <path d="M118 90C136 80 164 80 184 90M112 104C132 92 168 92 190 104M122 78C140 70 162 70 180 78" stroke="#8f8c84" stroke-width="1.3" fill="none" opacity=".75"/>
    <path d="M122 114C138 110 162 110 178 114M126 122C140 119 160 119 174 122" stroke="#a88068" stroke-width="1.3" fill="none" opacity=".45"/>
    ${eye({ cx: 129, cy: 152, w: 29, h: 11, iris: '#6a6e76', skin: '#e0b89a', heavy: 0.55, side: 'L', id: 'baekL', bag: true, lidW: 2.6 })}
    ${eye({ cx: 171, cy: 151, w: 29, h: 11, iris: '#6a6e76', skin: '#cfa688', heavy: 0.42, side: 'R', id: 'baekR', bag: true, lidW: 2.6 })}
    ${brow(142, 138, 114, 135, 2, 4.6, '#ebe8e2')}
    ${brow(158, 134, 188, 124, 7, 4.6, '#ebe8e2')}
    ${nose({ cx: 150, top: 158, bottom: 202, w: 16, shade: '#9a7058' })}
    <path d="M124 200C120 212 122 224 128 232M176 200C180 212 178 224 172 232" stroke="#9a7058" stroke-width="1.8" fill="none" opacity=".5"/>
    ${mouth({ cx: 151, cy: 222, w: 30, curve: -2, color: '#7a4a3c', lower: '#b88876' })}
    <path d="M166 220l5-2" stroke="#7a4a3c" stroke-width="1.6"/>
    ${rim([headD, 'M104 128C100 92 120 64 152 62C184 64 202 90 196 128', 'M44 380C48 322 88 292 150 288C212 292 252 322 256 380'], '#e8eeff')}`,
  });
}

// ───────────────────────── 오박사: 괴짜 식물학자

function oh() {
  const headD = 'M150 80C112 80 96 108 96 148C96 188 106 218 124 236C134 246 142 250 150 250C158 250 166 246 176 236C194 218 204 188 204 148C204 108 188 80 150 80Z';
  const leaves = scatter(41, 14, [10, 20, 290, 250]).map(([x, y], i) => `<path d="M${f(x)} ${f(y)}c12-14 30-14 38 0-10 12-26 14-38 0z" fill="#2e6a38" opacity=".22" transform="rotate(${i * 37} ${f(x)} ${f(y)})"/>`).join('');
  const stubble = scatter(52, 90, [112, 196, 188, 246]).filter(([x, y]) => ((x - 150) / 40) ** 2 + ((y - 214) / 34) ** 2 < 1 && !(y > 208 && y < 228 && Math.abs(x - 150) < 18)).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r=".8" fill="#3a2a1e" opacity=".55"/>`).join('');
  const defs = [
    lin('skin', [[0, '#f0c49c'], [0.5, '#e0aa80'], [1, '#9e6a48']], 0, 0, 1, 0.2),
    lin('hair', [[0, '#6a4628'], [1, '#2a180c']]),
    lin('shirt', [[0, '#e6dcc4'], [1, '#9c8e70']]),
    `<pattern id="tweed" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#3e5a30"/><path d="M0 0h8M0 4h8" stroke="#56743f" stroke-width="1.4"/><path d="M0 2h8" stroke="#2c4222" stroke-width="1"/></pattern>`,
  ].join('');
  return portrait({
    bg: [[0, '#244a2c'], [0.55, '#0d1c10'], [1, '#040a05']],
    rimColor: '#7ee08a',
    defs,
    body: `
    <ellipse cx="150" cy="170" rx="140" ry="160" fill="url(#glow)"/>
    ${leaves}
    <path d="M40 380C44 322 84 292 150 288C216 292 256 322 260 380Z" fill="url(#shirt)"/>
    <path d="M126 232L174 232L178 278L122 278Z" fill="url(#skin)"/>
    <path d="M126 238C138 256 162 256 174 238L176 262C162 274 138 274 124 262Z" fill="#6a4228" opacity=".45"/>
    <path d="M118 272L150 312L182 272L190 300L150 330L110 300Z" fill="#cfc4a8"/>
    <path d="M144 304L156 304L162 360L150 374L138 360Z" fill="#6a2a2a"/><path d="M144 304L156 304L154 316L146 316Z" fill="#4a1a1a"/>
    <path d="M58 380C60 340 78 310 112 296L146 380Z" fill="url(#tweed)"/>
    <path d="M242 380C240 340 222 310 188 296L154 380Z" fill="url(#tweed)"/>
    <path d="M112 296L146 380M188 296L154 380" stroke="#22341a" stroke-width="2.5"/>
    <rect x="196" y="334" width="30" height="24" rx="2" fill="#324a26" stroke="#22341a"/>
    <path d="M204 334V318" stroke="#8a6a3a" stroke-width="4"/><circle cx="204" cy="310" r="9" fill="#cfe8f5" fill-opacity=".35" stroke="url(#gold)" stroke-width="2.5"/>
    <path d="M100 326c-8-10-6-24 4-30 2 10 0 22-4 30z" fill="#4f9a45"/><path d="M104 320c10-6 22-2 26 6-10 2-20 0-26-6z" fill="#3f8a3a"/>
    <circle cx="108" cy="314" r="3.2" fill="#4a1a5a"/><circle cx="114" cy="318" r="3" fill="#3a0f4a"/><circle cx="104" cy="320" r="2.8" fill="#5a2a6a"/>
    <path d="M96 150C85 146 83 170 91 180C95 184 99 182 99 176Z" fill="url(#skin)"/>
    <path d="M204 150C215 146 217 170 209 180C205 184 201 182 201 176Z" fill="#b07a54"/>
    <path d="${headD}" fill="url(#skin)"/>
    <path d="M186 116C200 138 204 172 196 202C190 224 178 240 164 248C182 224 192 194 192 166C192 144 190 128 186 116Z" fill="#6a4228" opacity=".35"/>
    <path d="M112 196C114 222 132 244 150 246C168 244 186 222 188 196C180 214 166 226 150 226C134 226 120 214 112 196Z" fill="#4a3a2e" opacity=".22"/>
    ${stubble}
    ${eye({ cx: 129, cy: 152, w: 30, h: 13, iris: '#6a5a2a', skin: '#dca278', heavy: 0.25, squint: 0.4, side: 'L', id: 'ohL', bag: true })}
    ${eye({ cx: 171, cy: 151, w: 30, h: 14, iris: '#6a5a2a', skin: '#c89068', heavy: 0.05, side: 'R', id: 'ohR', bag: true })}
    ${brow(143, 140, 112, 138, 2, 5.5, '#4a301c')}
    ${brow(157, 134, 190, 126, 8, 5.5, '#4a301c')}
    <circle cx="129" cy="152" r="18" fill="#dff3ff" fill-opacity=".1" stroke="url(#gold)" stroke-width="2.6"/>
    <circle cx="171" cy="152" r="18" fill="#dff3ff" fill-opacity=".1" stroke="url(#gold)" stroke-width="2.6"/>
    <path d="M147 150C149 146 151 146 153 150M111 148L98 144M189 148L202 144" stroke="#b08a3a" stroke-width="2.2" fill="none"/>
    <path d="M116 142a16 16 0 0 1 10-6M158 142a16 16 0 0 1 10-6" stroke="#fff" stroke-width="2" opacity=".55" fill="none"/>
    ${nose({ cx: 150, top: 164, bottom: 200, w: 22, shade: '#8e5a3a', big: 2 })}
    <path d="M132 222C144 225 157 220 170 214" stroke="#6a3a2e" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M140 230C148 233 156 231 162 227" stroke="#b07a60" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M96 130C88 100 100 70 128 62C124 72 130 76 138 70C146 56 172 56 180 66C178 72 184 76 192 72C208 84 212 110 204 130C198 116 190 104 176 98C170 108 158 104 150 96C142 106 128 104 122 98C110 106 100 118 96 130Z" fill="url(#hair)"/>
    <path d="M160 64C166 74 170 86 176 98C168 90 162 78 160 64Z" fill="#c9c0b0"/>
    <path d="M104 96C112 84 124 76 136 74M184 80C196 88 202 100 204 114M120 70L112 56M176 62L186 50M144 60L146 46" stroke="#8a6440" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
    ${rim([headD, 'M96 130C88 100 100 70 128 62C146 56 172 56 180 66C208 84 212 110 204 130', 'M40 380C44 322 84 292 150 288C216 292 256 322 260 380'], '#8ef09a')}`,
  });
}

// ───────────────────────── 윤교수: 천문학 교수

function yoon() {
  const headD = 'M150 76C114 76 100 104 100 146C100 180 108 208 124 228C134 242 144 250 150 250C156 250 166 242 176 228C192 208 200 180 200 146C200 104 186 76 150 76Z';
  const r = rng(77);
  const stars = Array.from({ length: 40 }, () => `<circle cx="${f(r() * 300)}" cy="${f(r() * 260)}" r="${f(0.5 + r() * 1.3)}" fill="#cfe0ff" opacity="${f(0.2 + r() * 0.5)}"/>`).join('');
  const defs = [
    lin('skin', [[0, '#f6d6b8'], [0.5, '#e8bc98'], [1, '#a4765a']], 0, 0, 1, 0.2),
    lin('hair', [[0, '#1e2230'], [1, '#040508']]),
    lin('suit', [[0, '#2c4270'], [0.55, '#1a2a4c'], [1, '#080e1e']], 0, 0, 1, 1),
    `<pattern id="pin" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="none"/><path d="M4.5 0v9" stroke="#8aa6e0" stroke-opacity=".16" stroke-width="1"/></pattern>`,
  ].join('');
  return portrait({
    bg: [[0, '#1c2c54'], [0.55, '#0a1024'], [1, '#03050c']],
    rimColor: '#7fb0ff',
    defs,
    body: `
    <ellipse cx="150" cy="170" rx="140" ry="160" fill="url(#glow)"/>
    ${stars}
    <path d="M30 60L80 40L120 70L170 30M200 90L250 60L280 100" stroke="#9ab8ff" stroke-opacity=".2" stroke-width="1" fill="none"/>
    <path d="M42 380C46 320 86 290 150 286C214 290 254 320 258 380Z" fill="url(#suit)"/>
    <path d="M42 380C46 320 86 290 150 286C214 290 254 320 258 380Z" fill="url(#pin)"/>
    <path d="M130 286L150 380L170 286Z" fill="#e9eef8"/>
    <path d="M144 296L156 296L161 350L150 366L139 350Z" fill="#1a2e5c"/>
    <circle cx="150" cy="312" r="1.5" fill="#e2c066"/><circle cx="147" cy="328" r="1.5" fill="#e2c066"/><circle cx="153" cy="342" r="1.5" fill="#e2c066"/>
    <path d="M124 284L150 380L100 380L86 330L112 312L100 300Z" fill="#162444"/>
    <path d="M176 284L150 380L200 380L214 330L188 312L200 300Z" fill="#162444"/>
    <path d="M124 284L150 380M176 284L150 380M100 300L112 312L86 330M200 300L188 312L214 330" stroke="#3a5288" stroke-width="1.6" fill="none"/>
    <path d="M198 326l14-6 4 12-16 2z" fill="#f4f6fa"/>
    <path d="M110 336l1.8 3.8 4.2.6-3 2.9.7 4.2-3.7-2-3.7 2 .7-4.2-3-2.9 4.2-.6z" fill="url(#gold)"/>
    <path d="M126 230L174 230L176 274L124 274Z" fill="url(#skin)"/>
    <path d="M126 236C138 254 162 254 174 236L176 258C162 268 138 268 124 258Z" fill="#6a4630" opacity=".45"/>
    <path d="M120 270L150 290L180 270L184 288L150 304L116 288Z" fill="#f2f5fa"/>
    <path d="M101 146C90 142 88 164 95 174C98 178 103 176 103 170Z" fill="url(#skin)"/>
    <path d="${headD}" fill="url(#skin)"/>
    <path d="M186 114C198 136 200 170 194 196C188 218 176 236 162 246C178 222 188 196 188 168C188 144 188 128 186 114Z" fill="#6e4a34" opacity=".38"/>
    <path d="M106 170C112 186 120 198 132 206C120 204 108 190 104 176ZM194 170C188 186 180 198 168 206C180 204 192 190 196 176Z" fill="#9e6a50" opacity=".3"/>
    ${eye({ cx: 129, cy: 153, w: 29, h: 11, iris: '#2a2218', skin: '#e4b28e', heavy: 0.3, squint: 0.3, side: 'L', id: 'yoonL' })}
    ${eye({ cx: 171, cy: 153, w: 29, h: 11, iris: '#2a2218', skin: '#d4a07c', heavy: 0.3, squint: 0.3, side: 'R', id: 'yoonR' })}
    ${brow(143, 139, 112, 135, 1, 4.6, '#111318')}
    ${brow(157, 139, 188, 135, 1, 4.6, '#111318')}
    <rect x="111" y="142" width="36" height="22" rx="4" fill="#cfe0ff" fill-opacity=".1" stroke="#a8b4cc" stroke-width="2.2"/>
    <rect x="153" y="142" width="36" height="22" rx="4" fill="#cfe0ff" fill-opacity=".1" stroke="#a8b4cc" stroke-width="2.2"/>
    <path d="M147 150h6M111 148l-10-3M189 148l10-3" stroke="#a8b4cc" stroke-width="2"/>
    <path d="M116 146l10 0M158 146l10 0" stroke="#fff" stroke-width="1.6" opacity=".5"/>
    ${nose({ cx: 150, top: 160, bottom: 198, w: 15, shade: '#9a6a4e' })}
    <path d="M136 208C144 203 156 203 164 208" stroke="#15161c" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${mouth({ cx: 150, cy: 220, w: 26, curve: 1, color: '#7a4a3e', lower: '#b8867a' })}
    <path d="M142 232C146 250 154 250 158 232C154 236 146 236 142 232Z" fill="#111318"/>
    <path d="M98 136C92 94 116 62 156 62C194 64 210 96 202 134C196 112 184 96 164 92C150 90 132 96 118 88C110 104 102 118 98 136Z" fill="url(#hair)"/>
    <path d="M128 76C150 68 176 72 192 86M118 88C126 80 134 76 142 74" stroke="#56688e" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
    <path d="M118 88C112 100 106 114 100 132" stroke="#3a4668" stroke-width="1.5" fill="none" opacity=".6"/>
    ${rim([headD, 'M98 136C92 94 116 62 156 62C194 64 210 96 202 134', 'M42 380C46 320 86 290 150 286C214 290 254 320 258 380'], '#8ab8ff')}`,
  });
}

// ───────────────────────── 서화백: 몰락한 화가

function seo() {
  const headD = 'M150 84C116 84 102 110 102 148C102 186 110 214 126 232C136 244 144 250 150 250C156 250 164 244 174 232C190 214 198 186 198 148C198 110 184 84 150 84Z';
  const hairD = 'M150 60C100 58 72 96 76 150C78 200 64 240 70 280C90 300 110 290 116 268L184 268C190 290 210 300 230 280C236 240 222 200 224 150C228 96 200 58 150 60Z';
  const r = rng(99);
  const splat = ['#d8433b', '#4a7fd0', '#e2b23a', '#4fa35a', '#f2f2f2'];
  const paint = Array.from({ length: 16 }, () => `<circle cx="${f(60 + r() * 180)}" cy="${f(300 + r() * 80)}" r="${f(1.5 + r() * 4)}" fill="${splat[Math.floor(r() * splat.length)]}" opacity=".85"/>`).join('');
  const bgSmudge = Array.from({ length: 7 }, () => `<ellipse cx="${f(r() * 300)}" cy="${f(r() * 240)}" rx="${f(20 + r() * 40)}" ry="${f(6 + r() * 14)}" fill="${splat[Math.floor(r() * 4)]}" opacity=".07" transform="rotate(${f(r() * 180)} 150 150)"/>`).join('');
  const defs = [
    lin('skin', [[0, '#eec8a6'], [0.5, '#dcae8a'], [1, '#94684c']], 0, 0, 1, 0.2),
    lin('hair', [[0, '#342630'], [1, '#0e080c']]),
    lin('smock', [[0, '#6a3a9a'], [0.55, '#46236e'], [1, '#1c0c30']], 0, 0, 1, 1),
    lin('beret', [[0, '#3a2450'], [1, '#0e0716']]),
    lin('silk', [[0, '#f2c24a'], [0.6, '#c48f24'], [1, '#7a5410']], 0, 0, 1, 1),
  ].join('');
  return portrait({
    bg: [[0, '#321c4a'], [0.55, '#140a22'], [1, '#05020a']],
    rimColor: '#b98aff',
    defs,
    body: `
    <ellipse cx="150" cy="170" rx="140" ry="160" fill="url(#glow)"/>
    ${bgSmudge}
    <path d="${hairD}" fill="url(#hair)"/>
    <path d="M36 380C40 324 82 294 150 290C218 294 260 324 264 380Z" fill="url(#smock)"/>
    <path d="M84 320C96 340 100 360 98 380M216 320C204 342 200 362 202 380M150 330C146 350 148 366 146 380" stroke="#1c0c30" stroke-width="4" fill="none" opacity=".55"/>
    <path d="M92 318C104 336 110 352 110 372" stroke="#9a6ad0" stroke-width="2.5" fill="none" opacity=".45"/>
    ${paint}
    <path d="M128 230L172 230L174 276L126 276Z" fill="url(#skin)"/>
    <path d="M128 236C140 254 160 254 172 236L174 260C160 270 140 270 126 260Z" fill="#5a3a2a" opacity=".45"/>
    <path d="M122 280C136 296 164 296 178 280C184 300 172 314 150 314C128 314 116 300 122 280Z" fill="url(#silk)"/>
    <path d="M146 310L134 364L150 358ZM154 310L168 366L156 360Z" fill="url(#silk)"/>
    <path d="M136 290C144 300 156 300 164 290" stroke="#fff3c0" stroke-width="1.6" fill="none" opacity=".5"/>
    <path d="M103 150C93 146 91 166 97 176C100 180 105 178 105 172Z" fill="url(#skin)"/>
    <path d="${headD}" fill="url(#skin)"/>
    <path d="M184 118C196 140 198 174 192 200C186 222 176 238 162 246C178 222 186 196 186 170C186 146 186 130 184 118Z" fill="#5a3a2a" opacity=".4"/>
    <path d="M110 178C116 196 126 208 136 214C124 212 112 198 108 184ZM190 178C184 196 174 208 164 214C176 212 188 198 192 184Z" fill="#6a4432" opacity=".32"/>
    ${eye({ cx: 129, cy: 154, w: 29, h: 12, iris: '#3a2418', skin: '#d8a482', heavy: 0.52, side: 'L', id: 'seoL', bag: true, bagColor: '#5a3040' })}
    ${eye({ cx: 171, cy: 154, w: 29, h: 12, iris: '#3a2418', skin: '#c8946e', heavy: 0.52, side: 'R', id: 'seoR', bag: true, bagColor: '#5a3040' })}
    <path d="M116 166C124 172 136 172 144 166M156 166C164 172 176 172 184 166" stroke="#5a3040" stroke-width="3" opacity=".25" fill="none"/>
    ${brow(142, 136, 114, 142, 4, 3.8, '#2a1e24')}
    ${brow(158, 136, 186, 142, 4, 3.8, '#2a1e24')}
    ${nose({ cx: 150, top: 160, bottom: 202, w: 15, shade: '#8a5a40' })}
    <path d="M150 206C142 202 128 202 120 210C116 214 112 212 110 208C112 218 122 216 130 212C138 208 146 208 150 210C154 208 162 208 170 212C178 216 188 218 190 208C188 212 184 214 180 210C172 202 158 202 150 206Z" fill="#1e1418"/>
    ${mouth({ cx: 150, cy: 222, w: 26, curve: 2, color: '#6a3a34', lower: '#a87464' })}
    <path d="M147 236L153 236L150 244Z" fill="#1e1418"/>
    <path d="M166 186c8-2 14 2 16 8" stroke="#4a7fd0" stroke-width="4" opacity=".7" fill="none" stroke-linecap="round"/>
    <path d="M170 196c5 0 9 2 10 5" stroke="#e2b23a" stroke-width="3" opacity=".7" fill="none" stroke-linecap="round"/>
    <path d="M104 118C98 150 100 182 92 216M196 118C202 150 200 182 208 216M112 112C108 136 110 160 104 186" stroke="#2a1e26" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M118 108C124 124 122 140 116 152" stroke="#342630" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M84 118C80 84 120 62 162 64C206 68 230 90 222 112C218 124 196 128 152 126C116 124 90 126 84 118Z" fill="url(#beret)"/>
    <path d="M90 110C120 118 184 118 216 106" stroke="#5a3a78" stroke-width="2.5" fill="none" opacity=".6"/>
    <path d="M100 86C130 70 180 70 206 86" stroke="#4a2e64" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M160 64l4-10" stroke="#1a0e24" stroke-width="4" stroke-linecap="round"/>
    <path d="M226 176L260 118" stroke="#8a5a2a" stroke-width="5" stroke-linecap="round"/>
    <path d="M258 122L270 100" stroke="#c9ccd6" stroke-width="5"/><path d="M268 104l6-12" stroke="#d8433b" stroke-width="6" stroke-linecap="round"/>
    ${rim([headD, hairD, 'M36 380C40 324 82 294 150 290C218 294 260 324 264 380'], '#c49aff')}`,
  });
}

module.exports = { han, kang, baek, oh, yoon, seo };
