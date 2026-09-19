/* 캐릭터 옷장: 옷 · 모자 · 장신구 50가지씩, 머리 앞/뒤 · 눈썹 · 코 모양
   색은 따로 고르므로 여기서는 모양만 그린다. (c = { fill, shade } 고른 색, 없으면 물건 기본색) */
import './avatar-parts.js';

const P = self.AVATAR_PARTS;
export const INK = '#2a1d14';
const mix = (a, b, k) => P.mix(a, b, k);
export const F = (d, fill, sw = 3, extra = '') => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
export const L = (d, sw = 2.6, color = INK, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
export const T = (d, fill, op = 1) => `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
const C = (x, y, r, fill, sw = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
/** 고른 색이 있으면 그 색, 없으면 기본색 */
const pick = (c, def) => (c && c.fill ? c : { fill: def, shade: mix(def, '#000000', 0.3) });
const star = (x, y, r, fill, sw = 1.6) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return F(`M${pts.join('L')}Z`, fill, sw);
};
const heart = (x, y, s, fill, sw = 1.8) => F(`M${x} ${y + 3 * s} c${-3 * s} ${-5 * s} ${-10 * s} ${-2 * s} ${-7 * s} ${4 * s} l${7 * s} ${7 * s} ${7 * s} ${-7 * s} c${3 * s} ${-6 * s} ${-4 * s} ${-9 * s} ${-7 * s} ${-4 * s}Z`, fill, sw);
const flower = (x, y, r, fill, core = '#f2cf4a') => [0, 72, 144, 216, 288].map((a) => {
  const px = (x + r * 0.9 * Math.cos((a * Math.PI) / 180)).toFixed(1);
  const py = (y + r * 0.9 * Math.sin((a * Math.PI) / 180)).toFixed(1);
  return `<ellipse cx="${px}" cy="${py}" rx="${r * 0.75}" ry="${r * 0.55}" transform="rotate(${a} ${px} ${py})" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>`;
}).join('') + C(x, y, r * 0.5, core, 1.4);

/* ═════════ 머리: 뒷머리 (얼굴 뒤) · 앞머리 (얼굴 위) ═════════ */
function bumps(cx, cy, rx, ry, a0, a1, n, r) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    d += `${i ? ` A${r} ${r} 0 0 1 ` : 'M'}${(cx + rx * Math.cos(a)).toFixed(1)} ${(cy + ry * Math.sin(a)).toFixed(1)}`;
  }
  return d;
}
const CAP = 'M50 86 C46 40 74 26 100 26 C128 26 156 40 150 86Z';
export function hairBack(back, hc) {
  switch (back) {
    case 'long': return F('M50 86 C46 40 74 24 100 24 C128 24 156 40 150 86 L160 156 C146 164 132 158 126 148 L74 148 C68 158 54 164 40 156Z', hc.fill) + L('M60 110 Q58 132 52 150M140 110 Q142 132 148 150', 2.2, hc.light);
    case 'bob': return F('M48 88 C44 42 72 26 100 26 C130 26 156 42 152 88 L154 126 C142 134 130 130 126 122 L74 122 C70 130 58 134 46 126Z', hc.fill);
    case 'pony': return F('M136 48 C180 46 190 104 166 146 C162 120 158 96 134 74Z', hc.fill) + L('M150 70 Q166 96 164 126', 2.2, hc.light) + F('M130 44 a9 9 0 1 1 12 12 a9 9 0 1 1 -12 -12Z', '#c8453a', 2.4) + F(CAP, hc.fill);
    case 'twin': return F('M56 66 C28 76 22 128 38 158 C44 132 50 106 64 88Z', hc.fill) + F('M144 66 C172 76 178 128 162 158 C156 132 150 106 136 88Z', hc.fill)
      + L('M44 96 Q38 122 40 146M156 96 Q162 122 160 146', 2.2, hc.light)
      + F('M50 78 a7 7 0 1 1 12 8 a7 7 0 1 1 -12 -8Z', '#c8453a', 2.2) + F('M138 86 a7 7 0 1 1 12 -8 a7 7 0 1 1 -12 8Z', '#c8453a', 2.2) + F(CAP, hc.fill);
    case 'bun': return F('M76 22 a24 20 0 1 1 48 0 a24 20 0 1 1 -48 0Z', hc.fill) + L('M84 16 q16 -12 32 0M86 26 q14 8 28 0', 2, hc.light) + F(CAP, hc.fill);
    case 'braid': {
      let s = F(CAP, hc.fill);
      for (let i = 0; i < 6; i++) s += `<ellipse cx="${146 + i * 1.6}" cy="${98 + i * 13}" rx="8" ry="9" fill="${hc.fill}" stroke="${INK}" stroke-width="2.4" transform="rotate(${i % 2 ? 18 : -18} ${146 + i * 1.6} ${98 + i * 13})"/>`;
      return s + F('M148 170 l-6 12 l12 0Z', hc.fill, 2) + F('M143 166 h12 v5 h-12Z', '#c8453a', 1.8);
    }
    case 'afro': return F(`${bumps(100, 84, 60, 56, 150, 390, 11, 13)} Z`, hc.fill);
    default: return '';
  }
}
export function hairFront(front, hc) {
  const shine = L('M68 50 Q84 36 104 38', 4, hc.light, ' opacity=".85"');
  switch (front) {
    case 'short': return F('M52 90 C46 46 72 28 102 28 C134 28 156 48 148 90 C144 74 138 64 130 58 C124 68 110 72 98 66 C88 74 72 72 64 64 C58 72 54 80 52 90Z', hc.fill) + shine + L('M84 40 Q92 52 88 62M116 36 Q124 48 122 58', 2.2, hc.light);
    case 'spiky': return F('M52 92 L42 66 L58 66 L50 42 L72 50 L74 26 L92 42 L104 18 L114 42 L134 26 L132 50 L154 44 L146 66 L160 72 L148 92 C142 72 126 62 100 64 C76 62 60 72 52 92Z', hc.fill) + L('M66 60 L76 46M96 54 L104 32M124 52 L130 38', 2.2, hc.light);
    case 'side': return F('M52 94 C46 46 74 30 100 30 C130 30 156 46 148 94 C144 74 136 60 122 54 C110 66 88 70 70 60 C62 68 56 80 52 94Z', hc.fill) + shine + L('M112 40 Q108 54 96 62M128 46 Q132 60 140 72', 2.2, hc.light);
    case 'slick': return F('M53 86 C50 46 76 32 100 32 C126 32 150 46 147 86 C138 62 122 52 100 52 C80 52 62 62 53 86Z', hc.fill) + L('M70 52 Q86 40 100 42M112 42 Q128 46 138 58', 2.2, hc.light);
    case 'straight': return F('M50 98 C46 46 74 28 100 28 C126 28 154 46 150 98 L145 98 L144 70 L56 70 L55 98Z', hc.fill) + shine + L('M70 52 L70 68M86 46 L86 68M100 44 L100 68M114 46 L114 68M130 52 L130 68', 1.8, hc.light);
    case 'center': return F('M52 94 C46 46 74 30 100 30 C130 30 156 46 148 94 C142 76 134 62 120 58 C110 68 104 62 100 50 C96 62 90 68 76 58 C64 64 56 78 52 94Z', hc.fill) + shine + L('M100 34 L100 50', 2.2, hc.light);
    case 'messy': return F('M50 92 L46 70 L56 72 L52 52 L66 58 L68 40 L80 50 L88 32 L98 46 L108 30 L114 46 L128 36 L128 52 L144 48 L140 64 L152 70 L148 92 C140 74 126 66 110 72 L104 60 L96 72 C84 64 70 66 60 78Z', hc.fill) + L('M72 56 l8 -6M98 44 l6 -8M122 50 l6 -6', 2.2, hc.light);
    case 'curly': return F(`${bumps(100, 82, 52, 48, 172, 368, 9, 12)} C140 66 120 58 100 60 C80 58 60 66 49 84Z`, hc.fill) + L('M70 50 q6 -6 12 0M96 40 q6 -6 12 0M122 50 q6 -6 12 0', 2.2, hc.light);
    case 'buzz': {
      let dots = '';
      for (let i = 0; i < 26; i++) {
        const a = Math.PI * (1.08 + (0.84 * ((i * 7) % 26)) / 26);
        const rr = 34 + ((i * 11) % 12);
        dots += dot((100 + rr * 1.25 * Math.cos(a)).toFixed(1), (80 + rr * Math.sin(a)).toFixed(1), 1.1, `${INK}88`);
      }
      return F('M55 80 C54 50 76 38 100 38 C124 38 146 50 145 80 C136 60 120 54 100 54 C80 54 64 60 55 80Z', hc.fill, 2.4, ' opacity=".92"') + dots;
    }
    case 'bald': return L('M76 52 Q90 44 106 46', 4, '#ffffff', ' opacity=".7"');
    default: return '';
  }
}

/* ═════════ 눈썹 · 코 ═════════ */
export function brow(kind) {
  switch (kind) {
    case 'thick': return L('M71 79 Q81 71 92 76M108 76 Q119 71 129 79', 5);
    case 'sharp': return L('M72 81 L91 74M109 74 L128 81', 3);
    case 'worry': return L('M72 78 Q82 79 91 73M109 73 Q118 79 128 78', 2.8);
    case 'dots': return '<ellipse cx="82" cy="75" rx="4.6" ry="2.8" fill="#2a1d14"/><ellipse cx="118" cy="75" rx="4.6" ry="2.8" fill="#2a1d14"/>';
    default: return L('M74 78 Q82 74 90 77M110 77 Q118 74 126 78', 2.6);
  }
}
export function nose(kind, skin) {
  switch (kind) {
    case 'round': return F('M95 102 a5 4 0 0 0 10 0', skin.shade, 1.8);
    case 'dot': return dot(97, 103, 1.3, INK) + dot(103, 103, 1.3, INK);
    case 'button': return L('M95 100 q5 6 10 0', 2) + dot(97.5, 102.5, 1.1, INK) + dot(102.5, 102.5, 1.1, INK);
    case 'long': return L('M100 86 L104 102 L98 104', 2, INK, ' opacity=".7"');
    default: return L('M100 98 Q104 103 99 105', 2, INK, ' opacity=".55"');
  }
}

/* ═════════ 옷 50가지 ═════════ */
export const TORSO = 'M74 144 C64 152 62 180 66 204 L134 204 C138 180 136 152 126 144 C116 140 84 140 74 144Z';
const CREAM = { fill: '#efe2c2', shade: '#cdbb92' };
const WHITE = { fill: '#f6f1e6', shade: '#d8d0c0' };
const BLACK = { fill: '#2e2a28', shade: '#1a1816' };
const shadeR = T('M120 146 C132 156 134 184 132 204 L118 204 C124 184 124 162 120 146Z', '#000', 0.16);
const hatchL = L('M76 170 l6 -6M76 180 l8 -8M78 190 l8 -8', 1.3, '#000', ' opacity=".18"');
const body = (fill) => F(TORSO, fill) + shadeR + hatchL;
const neckV = (fill = '#f6f1e6') => F('M90 143 L100 162 L110 143Z', fill, 2);
const skirt = (fill, y = 188, w = 8, bottom = 226) => F(`M${70 - w / 2} ${y} L${130 + w / 2} ${y} L${138 + w} ${bottom} Q100 ${bottom + 8} ${62 - w} ${bottom}Z`, fill);
const buttons = (x, ys, fill = '#2a1d14') => ys.map((y) => dot(x, y, 2.2, fill)).join('');
const clip = (ctx, inner) => `<g clip-path="url(#${ctx.clip})">${inner}</g>`;

/**
 * 옷마다: t(몸통), sleeve(소매 색), pants(바지 색), back(몸 뒤 망토 · 날개 등), skinArms(맨팔), long(다리를 덮음)
 * 인자: c = 옷 색 { fill, shade }, ctx = { clip, skin }
 */
export const OUTFITS = {
  tee: (c) => ({ t: body(c.fill) + L('M88 143 Q100 156 112 143', 2.6), pants: '#4a5670' }),
  hoodie: (c) => ({ t: body(c.fill) + F('M78 146 Q100 168 122 146 Q116 138 100 140 Q84 138 78 146Z', c.shade, 2.6) + L('M94 154 L92 174M106 154 L108 174', 2) + dot(92, 176, 2, '#efe2c2') + dot(108, 176, 2, '#efe2c2') + F('M80 182 L120 182 L116 200 L84 200Z', c.fill, 2.2), pants: '#3e4a60' }),
  suit: (c) => ({ t: body(c.fill) + F('M88 143 L100 178 L112 143Z', '#f6f1e6', 2.4) + F('M97 150 L103 150 L106 172 L100 180 L94 172Z', '#8e2a22', 2) + F('M86 143 L98 176 L80 158Z', c.shade, 2.2) + F('M114 143 L102 176 L120 158Z', c.shade, 2.2) + buttons(100, [188, 197]), pants: c.shade }),
  vest: (c) => ({ t: F(TORSO, CREAM.fill) + L('M100 146 L100 204', 1.6, '#b8a478') + F('M74 144 C64 152 62 180 66 204 L94 204 L92 162 L86 143Z', c.fill) + F('M126 144 C136 152 138 180 134 204 L106 204 L108 162 L114 143Z', c.fill) + star(80, 172, 6, '#f2cf4a') + L('M90 143 Q100 152 110 143', 2), sleeve: CREAM, pants: '#5a4630' }),
  cloak: (c) => ({ back: F('M72 142 L38 214 Q100 228 162 214 L128 142Z', c.shade), t: body('#44403c') + F('M66 146 Q100 132 134 146 L140 166 Q100 176 60 166Z', c.fill) + L('M76 158 l-2 8M90 162 l-1 8M110 162 l1 8M124 158 l2 8', 1.4, c.shade) + C(100, 146, 6, '#e8b830'), sleeve: { fill: '#44403c', shade: '#2a2724' }, pants: '#3a3430' }),
  apron: (c) => ({ t: body(CREAM.fill) + F('M84 146 L116 146 L118 164 L82 164Z', c.fill, 2.4) + F('M80 162 L120 162 L128 204 L72 204Z', c.fill) + L('M84 146 L78 140M116 146 L122 140', 2) + F('M88 176 L112 176 L110 192 L90 192Z', c.shade, 2) + L('M90 143 Q100 150 110 143', 2), sleeve: CREAM, pants: '#6a5a44' }),
  dress: (c) => ({ t: F('M74 144 C66 152 66 168 72 176 L128 176 C134 168 134 152 126 144 C116 140 84 140 74 144Z', c.fill) + F('M72 172 L128 172 L150 228 Q100 240 50 228Z', c.fill) + T('M118 174 L128 172 L150 228 Q140 232 132 233Z', '#000', 0.16) + L('M86 180 Q82 206 74 230M100 180 L100 236M114 180 Q118 206 126 232', 1.6, c.shade) + F('M52 226 Q100 238 148 226 L150 232 Q100 244 50 232Z', '#fffaf0', 2.2) + F('M70 170 Q100 180 130 170 L130 178 Q100 188 70 178Z', '#fffaf0', 2.2) + L('M88 143 Q100 152 112 143', 2.4), pants: '#f4ecde', long: true }),
  overalls: (c) => ({ t: F(TORSO, CREAM.fill) + F('M80 160 L120 160 L124 204 L76 204Z', c.fill) + F('M86 144 L92 144 L92 162 L86 162Z', c.fill, 2) + F('M108 144 L114 144 L114 162 L108 162Z', c.fill, 2) + C(89, 164, 2.6, '#e8b830', 1.4) + C(111, 164, 2.6, '#e8b830', 1.4) + F('M90 174 L110 174 L110 188 L90 188Z', c.fill, 2) + L('M90 143 Q100 150 110 143', 2), sleeve: CREAM, pants: c.fill }),
  hanbok: (c) => ({ t: body(c.fill) + F('M84 142 L99 170 L105 166 L92 142Z', '#fffaf0', 2.2) + L('M114 143 L100 168', 5, '#fffaf0') + F('M100 162 L92 198 L99 198 L104 164Z', '#c8453a', 2) + F('M104 162 L112 194 L118 191 L106 161Z', '#c8453a', 2) + L('M68 196 L132 196', 3, '#fffaf0'), pants: '#efe2c2' }),
  knight: (c) => ({ t: F(TORSO, '#b8bcc4') + shadeR + L('M70 172 Q100 180 130 172M68 188 Q100 196 132 188', 2, '#6a6e76') + F('M90 152 L110 152 L110 168 Q100 180 90 168Z', c.fill, 2.2) + L('M100 154 L100 174M92 160 L108 160', 2.2, '#f2cf4a'), sleeve: { fill: '#b8bcc4', shade: '#8a8e96' }, pants: '#8a8e96' }),
  sweater: (c) => ({ t: body(c.fill) + F('M86 128 L114 128 L117 148 Q100 154 83 148Z', c.shade, 2.4) + L('M88 134 h24M88 140 h26', 1.4, '#000', ' opacity=".2"') + L('M94 154 q5 7 0 14 q-5 7 0 14 q5 7 0 14M106 154 q-5 7 0 14 q5 7 0 14 q-5 7 0 14', 1.8, c.shade) + L('M70 198 h60', 3, c.shade), pants: '#4a4236' }),
  jersey: (c) => ({ t: F('M80 144 Q76 170 70 204 L130 204 Q124 170 120 144 Q110 158 100 160 Q90 158 80 144Z', c.fill) + shadeR + L('M80 146 Q90 158 100 160 Q110 158 120 146', 3, '#f6f1e6') + L('M92 172 h14 l-8 20', 3.4, '#f6f1e6') + L('M72 200 h56', 2, '#f6f1e6'), skinArms: true, pants: c.shade }),
  sailor: (c) => ({ t: body(WHITE.fill) + F('M76 144 L100 172 L124 144 L134 152 L128 164 L100 178 L72 164 L66 152Z', c.fill) + L('M74 150 L100 170 L126 150', 1.8, '#f6f1e6') + F('M95 170 L100 178 L105 170 L103 190 L97 190Z', '#c8453a', 1.8), sleeve: WHITE, pants: c.fill }),
  labcoat: (c) => ({ t: body(WHITE.fill) + F('M90 143 L100 166 L110 143Z', c.fill, 2) + F('M88 143 L98 176 L82 160Z', WHITE.shade, 2) + F('M112 143 L102 176 L118 160Z', WHITE.shade, 2) + F('M110 176 h14 v14 h-14Z', WHITE.fill, 1.8) + L('M114 176 v-8M118 176 v-6', 2.4, '#3a6ac8') + buttons(100, [186, 196], '#9a9a9e'), sleeve: WHITE, pants: '#4a5670' }),
  qipao: (c) => ({ t: body(c.fill) + F('M88 128 h24 v16 h-24Z', c.shade, 2.2) + L('M100 146 Q114 152 120 164', 2.6, '#e8b830') + C(106, 150, 2, '#e8b830', 1.2) + C(114, 156, 2, '#e8b830', 1.2) + flower(84, 176, 5, '#f2cf4a', c.shade) + F('M70 200 L130 200 L126 238 L74 238Z', c.fill) + L('M116 204 L114 236', 2, c.shade), pants: c.fill, long: true }),
  trench: (c) => ({ t: body(c.fill) + F('M92 143 L100 160 L108 143Z', '#f6f1e6', 2) + F('M84 143 L98 172 L76 160Z', c.shade, 2.2) + F('M116 143 L102 172 L124 160Z', c.shade, 2.2) + F('M66 184 h68 v8 h-68Z', c.shade, 2) + F('M96 183 h8 v10 h-8Z', '#e8b830', 1.6) + buttons(92, [168, 178], c.shade) + buttons(108, [168, 178], c.shade) + F('M66 200 L134 200 L140 228 L60 228Z', c.fill) + L('M100 200 L100 228', 1.6, c.shade), pants: '#4a4236' }),
  tank: (c) => ({ t: F('M82 144 Q80 172 70 204 L130 204 Q120 172 118 144 Q100 160 82 144Z', c.fill) + shadeR + L('M84 144 L84 132M116 144 L116 132', 3, c.fill), skinArms: true, pants: '#4a5670' }),
  cardigan: (c) => ({ t: body(CREAM.fill) + L('M90 143 Q100 152 110 143', 2) + F('M74 144 C64 152 62 180 66 204 L96 204 L96 164 L88 143Z', c.fill) + F('M126 144 C136 152 138 180 134 204 L104 204 L104 164 L112 143Z', c.fill) + buttons(99, [170, 182, 194], '#e8b830') + F('M72 184 h14 v10 h-14Z', c.shade, 1.6) + F('M114 184 h14 v10 h-14Z', c.shade, 1.6), pants: '#4a4236' }),
  tuxedo: (c) => ({ t: body(BLACK.fill) + F('M88 143 L100 180 L112 143Z', '#f6f1e6', 2.2) + F('M86 143 L98 178 L80 158Z', '#44403c', 2) + F('M114 143 L102 178 L120 158Z', '#44403c', 2) + F('M90 146 L100 151 L110 146 L110 156 L100 151 L90 156Z', c.fill, 2) + dot(100, 162, 1.5, INK) + dot(100, 170, 1.5, INK), sleeve: BLACK, pants: BLACK.fill }),
  police: (c) => ({ t: body(c.fill) + F('M76 158 h16 v12 h-16Z', c.shade, 1.8) + F('M108 158 h16 v12 h-16Z', c.shade, 1.8) + star(84, 150, 5.5, '#e8b830') + F('M97 146 L103 146 L105 168 L100 174 L95 168Z', '#1c1a22', 1.6) + L('M72 146 h14M114 146 h14', 4, c.shade) + F('M66 190 h68 v6 h-68Z', '#2a1d14', 1.4), pants: c.shade }),
  chef: (c) => ({ t: body(WHITE.fill) + buttons(92, [158, 170, 182]) + buttons(108, [158, 170, 182]) + F('M88 140 L112 140 L100 156Z', c.fill, 2) + L('M100 146 L100 204', 1.4, WHITE.shade), sleeve: WHITE, pants: '#5a5a5e' }),
  pajama: (c, ctx) => ({ t: body(c.fill) + clip(ctx, L('M80 140 v70M92 140 v70M108 140 v70M120 140 v70', 3, '#fff', ' opacity=".45"')) + F('M86 143 L100 160 L96 146Z', '#f6f1e6', 1.8) + F('M114 143 L100 160 L104 146Z', '#f6f1e6', 1.8) + buttons(100, [168, 180, 192], '#f6f1e6') + F('M74 176 h14 v12 h-14Z', c.shade, 1.6), pants: c.fill }),
  raincoat: (c) => ({ back: F('M76 146 C70 128 86 124 100 132 C114 124 130 128 124 146Z', c.shade), t: body(c.fill) + [160, 174, 188].map((y) => F(`M96 ${y} h8 v4 h-8Z`, '#8a5a32', 1.4)).join('') + L('M104 162 h6M104 176 h6M104 190 h6', 1.4) + F('M74 180 h16 v4 h-16Z', c.shade, 1.4) + F('M110 180 h16 v4 h-16Z', c.shade, 1.4), pants: '#4a5670' }),
  leather: (c) => ({ t: body(c.shade) + F('M90 143 L100 160 L110 143Z', '#f6f1e6', 2) + F('M84 143 L96 166 L74 156Z', mix(c.shade, '#000000', 0.25), 2) + F('M116 143 L104 166 L126 156Z', mix(c.shade, '#000000', 0.25), 2) + L('M106 160 L110 204', 2, '#b8bcc4') + L('M78 170 l6 8M120 170 l-6 8', 1.4, '#fff', ' opacity=".35"'), sleeve: { fill: c.shade, shade: mix(c.shade, '#000000', 0.3) }, pants: '#2e2a28' }),
  varsity: (c) => ({ t: body(c.fill) + L('M88 143 Q100 152 112 143', 3, '#f6f1e6') + F('M78 156 h16 v18 h-16Z', '#f6f1e6', 2) + L('M82 160 v10 h6 q3 -2 0 -5 q3 -3 0 -5 h-6', 1.8, c.fill) + buttons(106, [158, 170, 182, 194], '#f6f1e6') + L('M68 200 h64', 3.4, '#f6f1e6'), sleeve: WHITE, pants: '#3e4a60' }),
  track: (c) => ({ t: body(c.fill) + L('M100 144 L100 204', 2, '#e8e8e8') + L('M76 148 L68 204M124 148 L132 204', 3, '#f6f1e6') + L('M90 143 Q100 150 110 143', 2.4, '#f6f1e6'), pants: c.fill }),
  school: (c) => ({ t: body(c.fill) + F('M88 143 L100 178 L112 143Z', '#f6f1e6', 2.2) + F('M97 148 L103 148 L106 172 L100 178 L94 172Z', '#c8453a', 1.8) + L('M96 156 l8 -2M95 164 l10 -2', 1.2, '#fff') + F('M86 143 L98 176 L80 158Z', c.shade, 2) + F('M114 143 L102 176 L120 158Z', c.shade, 2) + F('M112 160 h12 v12 Q118 178 112 172Z', '#e8b830', 1.6) + buttons(100, [188], '#e8b830'), pants: '#3a3a44' }),
  nurse: (c) => ({ t: body(WHITE.fill) + F('M84 143 L100 154 L116 143 L114 150 L100 160 L86 150Z', WHITE.shade, 1.8) + F('M96 164 h8 v6 h6 v8 h-6 v6 h-8 v-6 h-6 v-8 h6Z', c.fill, 1.6) + skirt(WHITE.fill, 194, 6, 222) + F('M68 190 h64 v5 h-64Z', c.fill, 1.4), sleeve: WHITE, pants: '#f4ecde' }),
  pirate: (c) => ({ t: body(WHITE.fill) + L('M96 146 L100 168 L104 146M95 152 h10M95 160 h10', 1.6) + F('M74 144 C64 152 62 180 66 204 L92 204 L90 162 L84 143Z', c.fill) + F('M126 144 C136 152 138 180 134 204 L108 204 L110 162 L116 143Z', c.fill) + F('M66 186 L134 186 L134 196 L66 196Z', '#c8453a', 2) + F('M122 192 l8 18 l-12 -2Z', '#c8453a', 1.8), sleeve: WHITE, pants: '#3a2f28' }),
  ninja: (c) => ({ t: body('#2a2830') + L('M80 146 L118 198', 9, c.fill) + F('M66 184 h68 v8 h-68Z', c.fill, 1.8) + F('M126 186 l10 14 l-8 2Z', c.fill, 1.6), sleeve: { fill: '#2a2830', shade: '#18161c' }, pants: '#2a2830' }),
  astro: (c) => ({ t: body(WHITE.fill) + F('M84 126 Q100 120 116 126 L118 144 Q100 150 82 144Z', '#b8bcc4', 2.2) + F('M84 158 h32 v22 h-32Z', '#d8d8dc', 2) + dot(90, 164, 2.6, '#c8453a') + dot(98, 164, 2.6, '#3a9a5a') + dot(106, 164, 2.6, '#e8b830') + L('M88 172 h24', 2, '#6a6e76') + F('M110 150 h10 v6 h-10Z', c.fill, 1.4), sleeve: WHITE, pants: WHITE.fill }),
  bee: (c, ctx) => ({ back: `<ellipse cx="70" cy="150" rx="18" ry="11" transform="rotate(-30 70 150)" fill="#dff2ff" stroke="${INK}" stroke-width="2.2" opacity=".9"/><ellipse cx="130" cy="150" rx="18" ry="11" transform="rotate(30 130 150)" fill="#dff2ff" stroke="${INK}" stroke-width="2.2" opacity=".9"/>`, t: body('#e8c43a') + clip(ctx, L('M60 162 h80M60 180 h80M60 198 h80', 8, '#2a2724')), sleeve: { fill: '#2a2724', shade: '#18161c' }, pants: '#2a2724' }),
  prince: (c) => ({ t: body(c.fill) + F('M66 144 Q74 138 84 144 L82 150 L66 150Z', '#e8b830', 1.8) + F('M134 144 Q126 138 116 144 L118 150 L134 150Z', '#e8b830', 1.8) + L('M86 146 L122 198', 7, '#f6f1e6') + buttons(92, [160, 172, 184], '#e8b830') + L('M68 202 h64', 3, '#e8b830'), pants: '#f6f1e6' }),
  gown: (c) => ({ t: F('M76 144 C70 152 72 166 76 174 L124 174 C128 166 130 152 124 144 C114 140 86 140 76 144Z', c.fill) + F('M66 146 a10 9 0 1 1 16 -2Z', c.fill, 2) + F('M134 146 a10 9 0 1 0 -16 -2Z', c.fill, 2) + F('M76 170 L124 170 L166 240 Q100 254 34 240Z', c.fill) + T('M110 172 L124 170 L166 240 Q150 246 138 247Z', '#000', 0.14) + L('M88 180 Q72 212 56 240M100 182 L100 250M112 180 Q128 212 144 244', 1.6, c.shade) + [[74, 214], [100, 222], [126, 214]].map(([x, y]) => flower(x, y, 3.6, '#fffaf0', '#f2cf4a')).join('') + L('M88 143 Q100 152 112 143', 2.4), pants: '#f4ecde', long: true }),
  aloha: (c) => ({ t: body(c.fill) + [[80, 160], [112, 170], [86, 190], [118, 194], [100, 154]].map(([x, y]) => flower(x, y, 4.4, '#fffaf0', '#f2cf4a')).join('') + F('M86 143 L100 156 L94 146Z', '#fffaf0', 1.6) + F('M114 143 L100 156 L106 146Z', '#fffaf0', 1.6) + buttons(100, [168, 182, 196], '#fffaf0'), pants: '#d8c29a' }),
  flannel: (c, ctx) => ({ t: body(c.fill) + clip(ctx, L('M60 156 h80M60 172 h80M60 188 h80', 3, c.shade, ' opacity=".7"') + L('M78 140 v70M94 140 v70M110 140 v70M126 140 v70', 3, c.shade, ' opacity=".7"') + L('M60 164 h80M60 196 h80M86 140 v70M118 140 v70', 1.4, '#fff', ' opacity=".4"')) + neckV() + buttons(100, [168, 180, 192], '#f6f1e6') + F('M74 158 h14 v12 h-14Z', c.fill, 1.6), pants: '#4a5670' }),
  hanbokdress: (c) => ({ t: F('M74 144 C68 150 68 162 72 170 L128 170 C132 162 132 150 126 144 C116 140 84 140 74 144Z', '#f6f1e6') + F('M84 142 L99 164 L105 160 L92 142Z', c.fill, 2) + F('M100 158 L94 186 L100 186 L104 160Z', c.fill, 1.8) + F('M104 158 L110 182 L116 180 L106 158Z', c.fill, 1.8) + F('M70 166 L130 166 L150 240 Q100 250 50 240Z', c.shade) + L('M86 172 Q78 206 68 238M100 172 L100 246M114 172 Q122 206 132 240', 1.6, mix(c.shade, '#000000', 0.25)), sleeve: WHITE, pants: '#f4ecde', long: true }),
  robe: (c) => ({ t: body(c.shade) + F('M66 190 L134 190 L142 240 L58 240Z', c.shade) + star(82, 170, 5, '#f2cf4a') + star(118, 214, 4, '#f2cf4a') + F('M110 166 a7 7 0 1 0 6 10 a5 5 0 1 1 -6 -10Z', '#f2cf4a', 1.4) + L('M66 188 Q100 196 134 188', 3, '#e8b830') + F('M100 192 l-4 16 h8Z', '#e8b830', 1.4) + L('M88 143 Q100 152 112 143', 2.4), sleeve: { fill: c.shade, shade: mix(c.shade, '#000000', 0.3) }, pants: c.shade, long: true }),
  jumpsuit: (c) => ({ t: body(c.fill) + L('M100 144 L100 204', 2, '#9a9a9e') + F('M76 154 h18 v8 h-18Z', '#f6f1e6', 1.6) + L('M79 158 h12', 1.2, '#c8453a') + F('M108 170 h16 v14 h-16Z', c.shade, 1.6) + L('M112 170 v-8', 3, '#9a9a9e') + F('M66 188 h68 v5 h-68Z', c.shade, 1.4), pants: c.fill }),
  bathrobe: (c) => ({ t: body(c.fill) + F('M84 142 L106 186 L118 150Z', c.shade, 2) + F('M116 142 L94 186 L82 150Z', c.fill, 2) + F('M66 180 h68 v8 h-68Z', c.shade, 1.8) + F('M92 184 l-6 18 l6 0 l4 -16Z', c.shade, 1.6) + F('M66 196 L134 196 L136 222 L64 222Z', c.fill) + L('M72 164 l3 3M122 164 l3 3M76 204 l3 3M120 206 l3 3', 1.2, '#fff', ' opacity=".6"'), pants: '#f0c8a0' }),
  poncho: (c) => ({ t: body('#f6f1e6') + F('M58 150 Q100 136 142 150 L154 208 L100 216 L46 208Z', c.fill) + L('M54 176 L100 186 L146 176M52 190 L100 200 L148 190', 3.4, '#f6f1e6') + L('M56 180 l6 -6 l6 6 l6 -6 l6 6M120 180 l6 -6 l6 6 l6 -6 l6 6', 1.6, c.shade) + L('M52 210 v8M64 212 v8M76 213 v8M88 214 v8M100 215 v8M112 214 v8M124 213 v8M136 212 v8M148 210 v8', 1.6, c.shade), pants: '#4a4236' }),
  cheer: (c) => ({ t: F('M76 144 C68 152 68 172 72 184 L128 184 C132 172 132 152 124 144 C114 140 86 140 76 144Z', c.fill) + L('M86 143 L100 160 L114 143', 3.4, '#f6f1e6') + star(100, 172, 6, '#f6f1e6') + F('M68 180 L132 180 L142 214 L58 214Z', c.fill) + L('M76 182 l-6 30M88 182 l-4 32M100 182 v32M112 182 l4 32M124 182 l6 30', 1.8, c.shade) + L('M60 212 L140 212', 3, '#f6f1e6'), skinArms: true, pants: '#f0c8a0' }),
  soccer: (c, ctx) => ({ t: body(c.fill) + clip(ctx, L('M84 140 v70M100 140 v70M116 140 v70', 6, '#f6f1e6', ' opacity=".8"')) + L('M88 143 Q100 152 112 143', 3.4, c.shade) + F('M106 160 h10 v14 h-10Z', c.shade, 1.4), pants: '#f6f1e6' }),
  marine: (c, ctx) => ({ t: body(WHITE.fill) + clip(ctx, L('M60 156 h80M60 170 h80M60 184 h80M60 198 h80', 4.6, c.fill)) + L('M84 142 Q100 148 116 142', 2.6), sleeve: WHITE, pants: '#4a5670' }),
  hero: (c) => ({ back: F('M76 142 L50 230 Q100 240 150 230 L124 142Z', c.shade), t: body(c.fill) + F('M88 156 L100 150 L112 156 L108 174 L100 180 L92 174Z', '#f2cf4a', 2) + star(100, 164, 5, c.fill, 1.4) + F('M66 186 h68 v7 h-68Z', '#f2cf4a', 1.8), pants: c.fill }),
  lifevest: (c) => ({ t: body('#f6f1e6') + F('M74 144 C64 152 62 180 66 200 L96 200 L96 150 L86 143Z', c.fill) + F('M126 144 C136 152 138 180 134 200 L104 200 L104 150 L114 143Z', c.fill) + L('M68 170 h28M104 170 h28M68 184 h28M104 184 h28', 3, '#f6f1e6') + F('M94 174 h12 v6 h-12Z', '#2a1d14', 1.2) + F('M94 188 h12 v6 h-12Z', '#2a1d14', 1.2), pants: '#4a5670' }),
  butler: (c) => ({ back: F('M76 186 L70 238 L94 230Z', BLACK.fill) + F('M124 186 L130 238 L106 230Z', BLACK.fill), t: body(BLACK.fill) + F('M86 143 L100 184 L114 143Z', c.fill, 2) + F('M92 143 L100 162 L108 143Z', '#f6f1e6', 1.8) + F('M92 146 L100 150 L108 146 L108 154 L100 150 L92 154Z', '#1c1a18', 1.6) + buttons(100, [166, 174, 182], '#e8b830'), sleeve: BLACK, pants: BLACK.fill }),
  maid: (c) => ({ t: body(BLACK.fill) + F('M84 143 L100 150 L116 143 L114 152 L100 158 L86 152Z', '#f6f1e6', 1.8) + F('M96 150 L100 156 L104 150 L102 160 L98 160Z', c.fill, 1.4) + F('M82 166 L118 166 L122 204 L78 204Z', '#f6f1e6', 2) + skirt(BLACK.fill, 196, 8, 224) + F('M76 204 L124 204 L126 222 Q100 228 74 222Z', '#f6f1e6', 2) + L('M76 222 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0', 1.6), sleeve: BLACK, pants: '#2a2724' }),
  scrubs: (c) => ({ t: body(c.fill) + F('M88 143 L100 164 L112 143Z', c.shade, 2) + F('M78 164 h14 v12 h-14Z', c.shade, 1.6) + L('M82 164 v-7', 2.4, '#3a6ac8'), pants: c.fill }),
  dino: (c) => ({ back: [0, 1, 2, 3, 4].map((i) => F(`M${124 + i * 3} ${130 + i * 18} l14 4 l-10 10Z`, c.shade, 2)).join('') + F('M128 196 Q170 200 176 232 Q156 214 130 214Z', c.fill), t: body(c.fill) + F('M84 156 Q100 150 116 156 L118 200 Q100 206 82 200Z', '#f2e2b0', 2) + L('M84 168 h32M84 180 h34M84 192 h34', 1.4, '#c8a870'), pants: c.fill }),
};

/* ═════════ 모자 50가지 ═════════
   h(c, hc): c = 고른 모자 색(없으면 기본), hc = 머리색 */
const brimEll = (y, rx, ry, fill) => F(`M${100 - rx} ${y} Q100 ${y - ry * 2} ${100 + rx} ${y} Q100 ${y + ry * 1.6} ${100 - rx} ${y}Z`, fill);
export const HATS = {
  none: () => '',
  cowboy: (c) => { const k = pick(c, '#8a5a32'); return F('M68 46 C64 16 80 6 100 14 C120 6 136 16 132 46Z', k.fill) + T('M112 12 C124 12 132 22 132 46 L118 46 C120 30 118 20 112 12Z', '#000', 0.16) + F('M67 38 L133 38 L133 46 L67 46Z', '#3a2418', 2.4) + L('M100 16 Q98 24 100 32', 2) + F('M26 50 C44 34 156 34 174 50 C164 60 140 54 100 54 C60 54 36 60 26 50Z', mix(k.fill, '#ffffff', 0.1)); },
  beanie: (c) => { const k = pick(c, '#c8453a'); return F('M48 72 C46 30 72 14 100 14 C128 14 154 30 152 72Z', k.fill) + L('M72 22 L68 64M88 16 L86 64M104 15 L104 64M120 18 L122 64M136 26 L138 64', 1.8, k.shade) + F('M44 62 Q100 54 156 62 L156 80 Q100 72 44 80Z', k.shade) + C(100, 8, 10, '#efe2c2', 2.4); },
  crown: (c) => { const k = pick(c, '#e8b830'); return F('M62 48 L58 12 L80 30 L100 4 L120 30 L142 12 L138 48Z', k.fill) + T('M120 30 L142 12 L138 48 L122 48Z', '#000', 0.2) + L('M62 40 L138 40', 2.2) + C(100, 30, 5, '#c8453a', 2) + C(78, 34, 3.4, '#3a7ac8', 1.8) + C(122, 34, 3.4, '#3a9a5a', 1.8) + C(58, 12, 3.4, '#fff4c0') + C(100, 4, 3.4, '#fff4c0') + C(142, 12, 3.4, '#fff4c0'); },
  wizard: (c) => { const k = pick(c, '#34497a'); return F('M54 54 L100 -12 Q116 -26 132 -14 Q116 -14 110 -4 L148 54Z', k.fill) + T('M110 -4 L148 54 L126 54Z', '#000', 0.2) + star(92, 28, 6, '#f2cf4a') + star(116, 42, 4, '#f2cf4a') + F('M30 54 Q100 36 170 54 Q100 70 30 54Z', k.shade); },
  band: (c) => { const k = pick(c, '#c8453a'); return F('M52 66 Q100 48 148 66 L148 78 Q100 60 52 78Z', k.fill) + F('M144 66 L168 56 L164 76Z', k.fill, 2.4) + F('M144 72 L162 88 L150 90Z', k.shade, 2.4) + L('M60 70 Q100 56 140 70', 1.6, '#fff', ' opacity=".5"'); },
  top: (c) => { const k = pick(c, '#2a2724'); return F('M68 46 L70 -8 Q100 -16 130 -8 L132 46Z', k.fill) + T('M116 -12 Q126 -10 130 -8 L132 46 L118 46Z', '#fff', 0.1) + F('M69 30 L131 30 L131 42 L69 42Z', '#8e2a22', 2.4) + F('M48 46 Q100 34 152 46 Q100 58 48 46Z', k.shade); },
  cap: (c) => { const k = pick(c, '#34497a'); return F('M50 70 C48 30 74 18 100 18 C126 18 152 30 150 70Z', k.fill) + T('M120 22 C140 30 152 44 150 70 L132 70 C134 46 128 32 120 22Z', '#000', 0.16) + L('M100 18 L100 68', 1.8, k.shade) + F('M118 62 Q162 54 176 70 Q150 76 116 72Z', k.shade) + F('M95 18 a5 4 0 1 1 10 0Z', k.shade, 2); },
  beret: (c) => { const k = pick(c, '#c8453a'); return F('M50 62 Q44 32 100 28 Q160 30 152 60 Q126 50 100 56 Q74 52 50 62Z', k.fill) + T('M120 34 Q150 40 150 58 Q140 52 128 52Z', '#000', 0.18) + F('M97 28 q3 -8 6 0Z', k.fill, 2); },
  ears: (c, hc) => { const f = c && c.fill ? c.fill : hc.fill; return F('M58 62 L62 22 L92 46Z', f, 2.8) + T('M64 54 L66 32 L84 46Z', '#f29ab8') + F('M142 62 L138 22 L108 46Z', f, 2.8) + T('M136 54 L134 32 L116 46Z', '#f29ab8'); },
  bunny: (c) => { const k = pick(c, '#f4f0e6'); return F('M76 52 Q62 -10 80 -12 Q96 -8 92 48Z', k.fill, 2.8) + T('M80 44 Q72 0 82 -4 Q88 0 86 44Z', '#f29ab8') + F('M124 52 Q138 -10 120 -12 Q104 -8 108 48Z', k.fill, 2.8) + T('M120 44 Q128 0 118 -4 Q112 0 114 44Z', '#f29ab8'); },
  bear: (c, hc) => { const f = c && c.fill ? c.fill : mix(hc.fill, '#8a5a32', 0.5); return C(64, 44, 14, f, 2.8) + dot(64, 44, 7, '#f0b8a0') + C(136, 44, 14, f, 2.8) + dot(136, 44, 7, '#f0b8a0'); },
  fox: (c) => { const k = pick(c, '#e0843a'); return F('M56 64 L58 6 L94 44Z', k.fill, 2.8) + F('M58 6 L62 22 L68 18Z', '#fffaf0', 1.4) + T('M62 54 L63 26 L84 44Z', '#fff0e0') + F('M144 64 L142 6 L106 44Z', k.fill, 2.8) + F('M142 6 L138 22 L132 18Z', '#fffaf0', 1.4) + T('M138 54 L137 26 L116 44Z', '#fff0e0'); },
  horns: (c) => { const k = pick(c, '#c8302a'); return F('M70 50 Q56 30 62 12 Q70 30 80 42Z', k.fill, 2.4) + F('M130 50 Q144 30 138 12 Q130 30 120 42Z', k.fill, 2.4) + L('M64 24 l5 3M136 24 l-5 3', 1.4, '#fff', ' opacity=".6"'); },
  halo: (c) => { const k = pick(c, '#e8b830'); return `<ellipse cx="100" cy="16" rx="32" ry="8" fill="none" stroke="#fff4b0" stroke-width="9" opacity=".5"/><ellipse cx="100" cy="16" rx="32" ry="8" fill="none" stroke="${k.fill}" stroke-width="3.6"/>`; },
  flowers: (c) => { const k = pick(c, '#f29ab8'); const pts = [[58, 60], [68, 44], [84, 34], [100, 31], [116, 34], [132, 44], [142, 60]]; return L('M56 64 Q100 20 144 64', 3, '#5a8a3a') + pts.map(([x, y], i) => flower(x, y, 5.6, i % 2 ? '#fffaf0' : k.fill)).join(''); },
  tiara: (c) => { const k = pick(c, '#d8d8e0'); return L('M66 54 Q100 38 134 54', 4, k.fill) + F('M84 46 L88 34 L94 42 L100 26 L106 42 L112 34 L116 46 Q100 40 84 46Z', k.fill, 2) + C(100, 34, 3.4, '#ec5a9a', 1.6) + dot(89, 38, 1.6, '#8ad8f0') + dot(111, 38, 1.6, '#8ad8f0'); },
  tricorn: (c) => { const k = pick(c, '#2a2724'); return F('M36 48 Q66 14 100 28 Q134 14 164 48 Q132 36 100 50 Q68 36 36 48Z', k.fill) + L('M42 46 Q68 22 100 32 Q132 22 158 46', 2, '#e8b830') + C(100, 38, 6, '#f6f1e6', 1.8) + dot(98, 37, 1.2, INK) + dot(102, 37, 1.2, INK); },
  toque: (c) => { const k = pick(c, '#f6f1e6'); return F('M66 52 L68 28 Q56 10 76 4 Q88 -12 104 -2 Q124 -10 132 8 Q146 20 132 30 L134 52Z', k.fill) + L('M82 26 Q84 14 90 10M112 24 Q114 12 120 10', 1.6, '#000', ' opacity=".2"') + F('M66 42 h68 v10 h-68Z', k.fill, 2.2); },
  policecap: (c) => { const k = pick(c, '#2e3f6a'); return F('M56 48 Q56 22 100 18 Q144 22 144 48Z', k.fill) + F('M56 46 h88 v6 h-88Z', '#1c1a22', 2) + F('M62 50 Q100 64 138 50 Q124 62 100 64 Q76 62 62 50Z', '#1c1a22', 2) + star(100, 34, 6, '#e8b830'); },
  helmet: (c) => { const k = pick(c, '#6a7a44'); return F('M46 68 Q46 16 100 14 Q154 16 154 68 Q100 58 46 68Z', k.fill) + L('M58 40 L142 40M54 54 L146 54M78 18 L72 62M100 14 L100 60M122 18 L128 62', 1.4, k.shade) + L('M52 68 Q60 110 86 126', 2, '#3a2418'); },
  knighthelm: (c) => { const k = pick(c, '#b8bcc4'); return F('M48 80 Q46 18 100 16 Q154 18 152 80 L140 80 Q136 44 100 42 Q64 44 60 80Z', k.fill) + F('M97 42 h6 v40 h-6Z', k.fill, 2) + L('M60 30 L140 30', 1.6, k.shade) + F('M96 16 Q90 -8 108 -14 Q104 0 106 16Z', '#c8453a', 2); },
  viking: (c) => { const k = pick(c, '#9a8a6a'); return F('M54 60 Q52 18 100 16 Q148 18 146 60Z', k.fill) + F('M52 54 h96 v8 h-96Z', mix(k.fill, '#000000', 0.25), 2) + [60, 80, 100, 120, 140].map((x) => dot(x, 58, 1.8, '#e8e0c0')).join('') + F('M54 50 Q30 40 30 10 Q44 28 60 36Z', '#f4f0e6') + F('M146 50 Q170 40 170 10 Q156 28 140 36Z', '#f4f0e6'); },
  straw: (c) => { const k = pick(c, '#e8c878'); return F('M20 56 Q100 30 180 56 Q100 76 20 56Z', k.fill) + F('M66 50 Q64 20 100 18 Q136 20 134 50Z', k.fill) + F('M66 42 Q100 34 134 42 L134 50 Q100 42 66 50Z', '#c8453a', 2) + L('M34 56 l10 -4M52 50 l10 -3M140 50 l10 3M156 54 l10 4M80 26 l4 10M100 22 l0 10M120 26 l-4 10', 1.2, '#a07a30'); },
  sunhat: (c) => { const k = pick(c, '#f4e6c8'); return F('M12 60 Q40 36 100 36 Q160 36 188 60 Q170 74 100 66 Q30 74 12 60Z', k.fill) + F('M68 52 Q66 24 100 22 Q134 24 132 52Z', k.fill) + F('M68 44 Q100 36 132 44 L132 52 Q100 44 68 52Z', '#ec8ab0', 2) + flower(130, 44, 5.4, '#f29ab8'); },
  bucket: (c) => { const k = pick(c, '#6a8a5a'); return F('M60 60 L68 24 Q100 16 132 24 L140 60Z', k.fill) + F('M42 64 Q100 50 158 64 L150 78 Q100 66 50 78Z', k.shade) + L('M64 42 Q100 36 136 42', 1.4, '#fff', ' stroke-dasharray="3 3" opacity=".6"'); },
  hardhat: (c) => { const k = pick(c, '#f2c230'); return F('M50 62 Q50 20 100 18 Q150 20 150 62Z', k.fill) + F('M92 18 Q100 14 108 18 L108 60 L92 60Z', mix(k.fill, '#ffffff', 0.3), 2) + F('M40 60 h120 q4 8 -6 10 h-108 q-10 -2 -6 -10Z', k.fill); },
  grad: (c) => { const k = pick(c, '#1c1a22'); return F('M68 30 L68 50 Q100 58 132 50 L132 30Z', k.fill) + F('M100 8 L162 24 L100 40 L38 24Z', k.fill) + L('M100 24 L148 30 L150 52', 2, '#e8b830') + F('M146 50 h8 l2 12 h-12Z', '#e8b830', 1.6); },
  santa: (c) => { const k = pick(c, '#c8302a'); return F('M52 58 Q56 18 100 14 Q140 12 156 40 Q168 56 160 72 Q150 44 136 36 Q140 52 148 58Z', k.fill) + C(162, 76, 9, '#f6f1e6', 2.4) + F('M46 56 Q100 44 154 56 L154 70 Q100 58 46 70Z', '#f6f1e6', 2.6); },
  party: (c) => { const k = pick(c, '#3a8ad8'); return `<g transform="rotate(-12 100 40)">${F('M80 48 L100 -8 L120 48Z', k.fill)}${L('M87 30 L113 30M92 16 L108 16M84 42 L116 42', 3, '#f2cf4a')}${C(100, -10, 6, '#ec5a9a', 2)}</g>`; },
  phones: (c) => { const k = pick(c, '#2e2a28'); return L('M52 92 Q48 20 100 16 Q152 20 148 92', 9, INK) + L('M52 92 Q48 20 100 16 Q152 20 148 92', 5, k.fill) + F('M40 76 h16 v28 h-16Z', k.fill, 2.4) + F('M144 76 h16 v28 h-16Z', k.fill, 2.4) + L('M44 82 v16M156 82 v16', 2, '#fff', ' opacity=".4"'); },
  bandana: (c) => { const k = pick(c, '#c8453a'); return F('M48 72 Q46 28 100 26 Q154 28 152 72 Q100 60 48 72Z', k.fill) + F('M148 64 L170 72 L160 82Z', k.fill, 2) + F('M148 66 L166 88 L152 86Z', k.shade, 2) + [[70, 50], [90, 40], [112, 42], [132, 52], [100, 58], [80, 62]].map(([x, y]) => dot(x, y, 2, '#fff')).join(''); },
  gat: (c) => { const k = pick(c, '#1c1a18'); return `<g opacity=".86">${F('M14 58 Q100 38 186 58 Q100 72 14 58Z', k.fill, 2.4)}${F('M76 54 L78 6 Q100 0 122 6 L124 54Z', k.fill, 2.4)}</g>` + L('M20 58 Q100 42 180 58', 1, '#fff', ' opacity=".3"') + L('M78 58 Q70 110 88 132M122 58 Q130 110 112 132', 1.6, '#3a2418') + [0, 1, 2, 3].map((i) => dot(80 + i * 2, 70 + i * 16, 2.2, '#c8453a')).join(''); },
  satgat: (c) => { const k = pick(c, '#d8b878'); return F('M18 60 Q100 -6 182 60 Q100 74 18 60Z', k.fill) + L('M100 4 L40 58M100 4 L70 64M100 4 L100 66M100 4 L130 64M100 4 L160 58', 1.4, mix(k.fill, '#000000', 0.35)) + L('M60 30 Q100 22 140 30M40 46 Q100 34 160 46', 1.2, mix(k.fill, '#000000', 0.3)); },
  nursecap: (c) => { const k = pick(c, '#f6f1e6'); return F('M72 44 L78 22 Q100 16 122 22 L128 44 Q100 38 72 44Z', k.fill) + F('M96 24 h8 v5 h5 v7 h-5 v5 h-8 v-5 h-5 v-7 h5Z', '#c8453a', 1.4); },
  mushroom: (c) => { const k = pick(c, '#d8403a'); return F('M32 68 Q36 2 100 0 Q164 2 168 68 Q100 54 32 68Z', k.fill) + [[64, 30, 8], [100, 16, 9], [136, 30, 8], [84, 48, 5], [118, 48, 5]].map(([x, y, r]) => C(x, y, r, '#fffaf0', 1.8)).join(''); },
  frog: (c) => { const k = pick(c, '#6ab04a'); return F('M48 68 Q46 24 100 22 Q154 24 152 68 Q100 58 48 68Z', k.fill) + C(74, 24, 12, k.fill, 2.6) + C(126, 24, 12, k.fill, 2.6) + C(74, 24, 6, '#fffaf0', 1.6) + C(126, 24, 6, '#fffaf0', 1.6) + dot(75, 25, 3, INK) + dot(127, 25, 3, INK) + L('M70 54 Q100 64 130 54', 2.4); },
  sailorhat: (c) => { const k = pick(c, '#f6f1e6'); return F('M58 50 Q56 26 100 24 Q144 26 142 50Z', k.fill) + F('M56 42 h88 v10 h-88Z', '#34497a', 2.2) + F('M140 48 L150 64 L144 66Z', '#34497a', 1.6) + F('M138 48 L140 68 L134 66Z', '#34497a', 1.6); },
  jester: (c) => { const k = pick(c, '#c8453a'); const b = '#e8c43a'; return F('M60 58 Q44 22 22 26 Q40 34 56 50Z', k.fill) + F('M84 48 Q92 4 100 -10 Q108 4 116 48Z', b) + F('M140 58 Q156 22 178 26 Q160 34 144 50Z', k.fill) + F('M52 62 Q100 36 148 62 L148 72 Q100 50 52 72Z', b, 2.4) + C(22, 26, 5, b) + C(100, -12, 5, k.fill) + C(178, 26, 5, b); },
  propeller: (c) => { const k = pick(c, '#e8c43a'); return F('M50 70 C48 30 74 20 100 20 C126 20 152 30 150 70Z', k.fill) + L('M72 26 L66 66M100 20 L100 66M128 26 L134 66', 5, '#c8453a') + L('M100 20 L100 6', 2.6) + `<ellipse cx="84" cy="6" rx="16" ry="4" fill="#3a8ad8" stroke="${INK}" stroke-width="2"/><ellipse cx="116" cy="6" rx="16" ry="4" fill="#3a8ad8" stroke="${INK}" stroke-width="2"/>` + C(100, 6, 3, '#e8c43a', 1.6); },
  deerstalker: (c, _hc, ctx) => { const k = pick(c, '#9a7a4a'); return F('M52 66 Q50 24 100 20 Q150 24 148 66Z', k.fill) + L('M60 40 h80M56 52 h88M80 22 v44M100 20 v46M120 22 v44', 1.2, k.shade, ' opacity=".7"') + F('M62 60 Q100 72 138 60 Q128 74 100 74 Q72 74 62 60Z', k.shade, 2) + F('M56 50 Q48 76 58 90 L64 88 Q58 72 64 52Z', k.fill, 2) + F('M144 50 Q152 76 142 90 L136 88 Q142 72 136 52Z', k.fill, 2) + L('M96 20 q4 -8 8 0', 2) + (ctx ? '' : ''); },
  fedora: (c) => { const k = pick(c, '#6a5a4a'); return F('M66 48 Q62 18 84 14 Q100 22 116 14 Q138 18 134 48Z', k.fill) + L('M88 18 Q100 30 112 18', 1.8, k.shade) + F('M66 38 h68 v9 h-68Z', '#2a1d14', 2) + F('M34 50 Q100 34 166 50 Q150 60 100 54 Q50 60 34 50Z', k.fill); },
  bowler: (c) => { const k = pick(c, '#2a2724'); return F('M66 48 Q64 10 100 10 Q136 10 134 48Z', k.fill) + T('M114 14 Q132 22 132 46 L120 46 Q122 26 114 14Z', '#fff', 0.12) + F('M66 40 h68 v8 h-68Z', '#6a2a1a', 2) + F('M52 50 Q100 38 148 50 Q140 56 100 54 Q60 56 52 50Z', k.fill); },
  bow: (c) => { const k = pick(c, '#e0507a'); return F('M122 42 L94 22 L96 60Z', k.fill, 2.4) + F('M122 42 L150 22 L148 60Z', k.fill, 2.4) + C(122, 42, 7, k.shade, 2.2) + L('M100 30 l6 6M144 30 l-6 6', 1.4, '#fff', ' opacity=".5"'); },
  goggles: (c) => { const k = pick(c, '#8a5a32'); return L('M50 58 Q100 44 150 58', 6, k.fill) + C(82, 50, 12, '#9ad0e8', 3) + C(118, 50, 12, '#9ad0e8', 3) + L('M76 44 l6 -3M112 44 l6 -3', 2, '#fff') + L('M94 50 h12', 3); },
  antlers: (c) => { const k = pick(c, '#8a5a32'); const a = 'M72 50 Q64 24 52 10M64 30 Q52 26 44 30M58 18 Q64 8 62 0'; const b = 'M128 50 Q136 24 148 10M136 30 Q148 26 156 30M142 18 Q136 8 138 0'; return L(a, 8, INK) + L(a, 4.4, k.fill) + L(b, 8, INK) + L(b, 4.4, k.fill); },
  unicorn: (c) => { const k = pick(c, '#f2cf4a'); return F('M92 44 L100 -4 L108 44Z', k.fill, 2.4) + L('M94 34 L106 30M95 22 L105 18M97 10 L103 8', 1.6, mix(k.fill, '#000000', 0.3)) + F('M62 52 L66 30 L80 46Z', '#f6f1e6', 2.2) + F('M138 52 L134 30 L120 46Z', '#f6f1e6', 2.2); },
  antenna: (c) => { const k = pick(c, '#6ad04a'); return L('M84 42 Q76 20 70 6M116 42 Q124 20 130 6', 3) + C(70, 4, 6, k.fill, 2.4) + C(130, 4, 6, k.fill, 2.4) + dot(68, 2, 1.6, '#fff') + dot(128, 2, 1.6, '#fff'); },
  bikehelm: (c) => { const k = pick(c, '#3a8ad8'); return F('M44 70 Q42 18 104 16 Q160 20 160 64 Q150 58 140 62 Q100 50 60 66Z', k.fill) + L('M70 30 L80 50M96 22 L100 46M122 24 L118 48M144 36 L134 54', 4, '#1c1a22') + L('M56 68 Q64 110 88 126', 2, '#1c1a22'); },
  flowerpin: (c) => { const k = pick(c, '#f29ab8'); return flower(132, 52, 7, k.fill) + L('M124 60 l-8 6', 2, '#5a8a3a'); },
};

/* ═════════ 장신구 50가지 ═════════
   layer: 'face' 얼굴 위 · 'neck' 목 (몸통 위, 머리 아래) */
const glassesPair = (col, shape) => shape + L('M94 91 Q100 86 106 91', 2.4, col);
export const ACCS = {
  none: { f: () => '' },
  glasses: { f: (c) => { const k = pick(c, INK).fill; return C(82, 92, 12, '#bfe4ff2e', 2.6).replace(INK, k) + C(118, 92, 12, '#bfe4ff2e', 2.6).replace(INK, k) + L('M94 91 Q100 86 106 91M70 90 L56 86M130 90 L144 86', 2.4, k) + L('M76 86 l5 -3M112 86 l5 -3', 1.6, '#fff'); } },
  shades: { f: (c) => { const k = pick(c, '#1c1a22').fill; return F('M66 84 L96 84 Q96 102 82 102 Q66 102 66 84Z', k, 2.6) + F('M104 84 L134 84 Q134 102 118 102 Q104 102 104 84Z', k, 2.6) + L('M96 86 Q100 83 104 86M66 85 L54 82M134 85 L146 82', 2.4) + L('M72 88 l6 6M110 88 l6 6', 2, '#fff', ' opacity=".7"'); } },
  patch: { f: (c) => L('M54 70 Q100 56 146 84', 2.4) + F('M106 84 Q118 80 130 86 Q130 102 118 102 Q106 100 106 84Z', pick(c, '#1c1a22').fill, 2.4) },
  mustache: { f: (c, hc) => F('M82 108 Q90 98 100 105 Q110 98 118 108 Q124 112 128 106 Q124 118 112 112 Q106 110 100 108 Q94 110 88 112 Q76 118 72 106 Q76 112 82 108Z', c && c.fill ? c.fill : hc.fill, 2.2) },
  bandaid: { f: (c) => `<g transform="rotate(-28 126 104)">${F('M114 99 h24 a4 4 0 0 1 0 10 h-24 a4 4 0 0 1 0 -10Z', pick(c, '#f0c8a0').fill, 2)}${T('M122 100 h8 v8 h-8Z', '#00000022')}${dot(124, 102, 0.9, INK)}${dot(128, 106, 0.9, INK)}</g>` },
  monocle: { f: (c) => { const k = pick(c, '#d8a830').fill; return `<circle cx="118" cy="92" r="11" fill="#bfe4ff33" stroke="${k}" stroke-width="3"/>` + L('M128 98 Q142 118 132 140', 1.6, k); } },
  mask: { f: (c) => F('M70 102 Q100 96 130 102 L127 124 Q100 138 73 124Z', pick(c, '#f4f4f0').fill, 2.6) + L('M76 110 Q100 106 124 110M76 118 Q100 114 124 118', 1.4, '#000', ' opacity=".2"') + L('M70 104 L56 94M130 104 L144 94', 1.8) },
  beard: { f: (c, hc) => F('M56 96 Q56 142 100 146 Q144 142 144 96 Q138 118 124 124 Q112 118 100 122 Q88 118 76 124 Q62 118 56 96Z', c && c.fill ? c.fill : hc.fill, 2.6) + L('M72 128 l2 6M86 134 l1 6M100 136 l0 6M114 134 l-1 6M128 128 l-2 6', 1.4, hc.light) },
  earring: { f: (c) => { const k = pick(c, '#e8b830').fill; return [54, 146].map((x) => `<circle cx="${x}" cy="110" r="4.4" fill="none" stroke="${INK}" stroke-width="4.6"/><circle cx="${x}" cy="110" r="4.4" fill="none" stroke="${k}" stroke-width="2.2"/>`).join(''); } },
  square: { f: (c) => { const k = pick(c, '#1c1a22').fill; return F('M68 83 h26 v18 h-26Z', '#bfe4ff2e', 3.4).replace(INK, k) + F('M106 83 h26 v18 h-26Z', '#bfe4ff2e', 3.4).replace(INK, k) + L('M94 90 h12M68 88 L56 86M132 88 L144 86', 3, k); } },
  cateye: { f: (c) => { const k = pick(c, '#c8453a').fill; return F('M66 88 Q72 80 94 84 Q94 100 82 101 Q68 100 66 88 L60 80Z', '#bfe4ff2e', 2.8).replace(INK, k) + F('M134 88 Q128 80 106 84 Q106 100 118 101 Q132 100 134 88 L140 80Z', '#bfe4ff2e', 2.8).replace(INK, k) + L('M94 90 Q100 86 106 90', 2.4, k); } },
  heartshades: { f: (c) => { const k = pick(c, '#e0406a').fill; return heart(82, 86, 1.9, k, 2.4) + heart(118, 86, 1.9, k, 2.4) + L('M92 90 Q100 86 108 90M68 88 L56 86M132 88 L144 86', 2.4); } },
  starshades: { f: (c) => { const k = pick(c, '#e8c43a').fill; return star(82, 92, 13, k, 2.4) + star(118, 92, 13, k, 2.4) + L('M94 90 Q100 86 106 90', 2.4); } },
  '3d': { f: () => F('M66 84 h28 v16 h-28Z', '#e0403a99', 2.6) + F('M106 84 h28 v16 h-28Z', '#3a8ad899', 2.6) + L('M94 88 h12M66 88 L56 86M134 88 L144 86', 2.6, '#f6f1e6') },
  reading: { f: (c) => { const k = pick(c, '#8a5a32').fill; return F('M72 100 h20 Q92 110 82 110 Q72 110 72 100Z', '#bfe4ff33', 2.2).replace(INK, k) + F('M108 100 h20 Q128 110 118 110 Q108 110 108 100Z', '#bfe4ff33', 2.2).replace(INK, k) + L('M92 101 Q100 96 108 101', 2, k); } },
  goatee: { f: (c, hc) => F('M90 124 Q100 146 110 124 Q100 130 90 124Z', c && c.fill ? c.fill : hc.fill, 2.2) },
  stubble: { f: (c, hc) => { let s = ''; for (let i = 0; i < 34; i++) { const a = Math.PI * (0.12 + (0.76 * i) / 33); s += dot((100 - 40 * Math.cos(a) + ((i * 7) % 5) - 2).toFixed(1), (104 + 26 * Math.sin(a) + ((i * 11) % 6) - 3).toFixed(1), 0.9, c && c.fill ? c.fill : hc.fill); } return s; } },
  chevron: { f: (c, hc) => F('M82 108 Q100 98 118 108 L116 113 Q100 106 84 113Z', c && c.fill ? c.fill : hc.fill, 2.2) },
  pencil: { f: (c, hc) => L('M88 107 Q100 103 112 107', 2.2, c && c.fill ? c.fill : hc.fill) },
  sideburns: { f: (c, hc) => F('M54 78 L57 114 L64 116 L62 80Z', c && c.fill ? c.fill : hc.fill, 2) + F('M146 78 L143 114 L136 116 L138 80Z', c && c.fill ? c.fill : hc.fill, 2) },
  clown: { f: (c) => C(100, 101, 7.5, pick(c, '#e0302a').fill, 2.4) + dot(97.5, 98.5, 2, '#fff') },
  heart: { f: (c) => heart(126, 101, 1.1, pick(c, '#ec5a8a').fill) },
  star: { f: (c) => star(74, 104, 6, pick(c, '#f2cf4a').fill) },
  mole: { f: (c) => dot(124, 101, 1.8, pick(c, '#2a1d14').fill) },
  scar: { f: (c) => { const k = pick(c, '#a0503a').fill; return L('M116 98 L134 114', 2.6, k) + L('M120 99 l-3 4M125 104 l-3 4M130 109 l-3 4', 1.6, k); } },
  whiskers: { f: (c) => L('M58 100 L76 104M56 108 L76 108M58 116 L76 112M142 100 L124 104M144 108 L124 108M142 116 L124 112', 1.8, pick(c, '#2a1d14').fill) + dot(100, 101, 3, pick(c, '#2a1d14').fill) },
  tiger: { f: (c) => { const k = pick(c, '#e0843a').fill; return L('M58 98 l14 4M60 108 l12 0M142 98 l-14 4M140 108 l-12 0M92 52 l4 10M100 50 v12M108 52 l-4 10', 3.4, k); } },
  warpaint: { f: (c) => { const k = pick(c, '#c8453a').fill; return L('M68 104 h22M68 110 h20M110 104 h22M112 110 h20', 3, k); } },
  freckles: { f: (c) => [[66, 100], [71, 104], [62, 105], [74, 99], [130, 100], [135, 104], [138, 99], [126, 105]].map(([x, y]) => dot(x, y, 1.3, pick(c, '#9a5a3a').fill)).join('') },
  nosering: { f: (c) => `<circle cx="104" cy="104" r="3" fill="none" stroke="${pick(c, '#c0c4cc').fill}" stroke-width="1.8"/>` },
  studs: { f: (c) => [54, 146].map((x) => star(x, 108, 3.4, pick(c, '#bfe8ff').fill, 1.2)).join('') },
  pearls: { f: (c) => [54, 146].map((x) => C(x, 110, 3.6, pick(c, '#fbf6ec').fill, 1.4) + dot(x - 1, 109, 1, '#fff')).join('') },
  stardrop: { f: (c) => [54, 146].map((x) => L(`M${x} 106 v8`, 1.4) + star(x, 118, 5, pick(c, '#e8c43a').fill, 1.4)).join('') },
  choker: { layer: 'neck', f: (c) => F('M88 134 Q100 140 112 134 L112 140 Q100 146 88 140Z', pick(c, '#1c1a22').fill, 1.8) + C(100, 144, 2.6, '#e0507a', 1.2) },
  necklace: { layer: 'neck', f: (c) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const a = Math.PI * (0.1 + (0.8 * i) / 8); return C((100 - 18 * Math.cos(a)).toFixed(1), (140 + 14 * Math.sin(a)).toFixed(1), 2.6, pick(c, '#fbf6ec').fill, 1.2); }).join('') },
  chain: { layer: 'neck', f: (c) => L('M84 142 Q100 164 116 142', 3.4, pick(c, '#e8b830').fill) + F('M96 156 h8 v10 h-8Z', pick(c, '#e8b830').fill, 1.6) },
  bowtie: { layer: 'neck', f: (c) => F('M88 138 L100 144 L112 138 L112 152 L100 146 L88 152Z', pick(c, '#c8453a').fill, 2) + C(100, 145, 3, pick(c, '#c8453a').shade, 1.6) },
  scarf: { layer: 'neck', f: (c) => { const k = pick(c, '#c8453a'); return F('M80 132 Q100 146 120 132 L124 146 Q100 160 76 146Z', k.fill) + F('M110 148 L118 186 L106 186 L102 152Z', k.fill, 2.4) + L('M108 182 v6M112 182 v6M116 182 v6', 1.6) + L('M84 140 Q100 150 116 140', 1.6, k.shade); } },
  kerchief: { layer: 'neck', f: (c) => F('M84 136 Q100 144 116 136 L100 164Z', pick(c, '#3a8ad8').fill, 2.2) + dot(96, 146, 1.6, '#fff') + dot(104, 150, 1.6, '#fff') },
  medal: { layer: 'neck', f: (c) => L('M86 138 L98 170M114 138 L102 170', 4, '#3a6ac8') + C(100, 176, 8, pick(c, '#e8b830').fill, 2.2) + star(100, 176, 4, '#fff4c0', 1) },
  stetho: { layer: 'neck', f: (c) => { const k = pick(c, '#6a6e76').fill; return L('M84 136 Q76 170 96 184 Q112 190 116 170M116 136 Q124 160 116 170', 2.6, k) + C(116, 174, 5, '#c0c4cc', 2); } },
  headset: { f: (c) => { const k = pick(c, '#2e2a28').fill; return F('M44 84 h10 v20 h-10Z', k, 2.2) + L('M48 104 Q54 120 84 116', 2.4, k) + C(86, 116, 3, k, 1.6); } },
  pipe: { f: (c) => { const k = pick(c, '#6a3a1a').fill; return L('M104 116 L124 124', 4, INK) + L('M104 116 L124 124', 2, k) + F('M122 116 h12 v14 q-6 6 -12 0Z', k, 2) + L('M128 110 q-4 -6 2 -12', 1.4, '#9a9a9e', ' opacity=".7"'); } },
  lolly: { f: (c) => L('M106 116 L122 126', 2.4, '#f6f1e6') + C(128, 130, 8, pick(c, '#ec5a9a').fill, 2) + L('M123 128 q5 -6 10 0', 1.6, '#fff') },
  rose: { f: (c) => L('M92 116 L124 108', 2.4, '#3a7a3a') + F('M114 110 l4 -4 l2 4Z', '#3a7a3a', 1.2) + C(128, 106, 6.4, pick(c, '#c8303a').fill, 2) + L('M124 106 q4 -4 8 0 q-4 4 -8 0', 1.4, '#fff', ' opacity=".5"') },
  toothpick: { f: () => L('M106 116 L128 110', 2.2, '#d8b878') },
  gum: { f: (c) => C(106, 118, 9, pick(c, '#f29ab8').fill, 2.2) + dot(102, 114, 2.2, '#fff') },
  masquerade: { f: (c) => { const k = pick(c, '#7a3a9a').fill; return `<path d="M58 84 Q80 74 100 86 Q120 74 142 84 L136 100 Q118 106 100 96 Q82 106 64 100Z M72 92 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0Z M108 92 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0Z" fill="${k}" fill-rule="evenodd" stroke="${INK}" stroke-width="2.4"/>` + star(58, 80, 4, '#e8b830', 1.2) + star(142, 80, 4, '#e8b830', 1.2); } },
  headwrap: { f: (c) => F('M52 66 Q100 52 148 66 L148 80 Q100 66 52 80Z', pick(c, '#f6f1e6').fill, 2.4) + L('M60 72 Q100 60 140 72', 1.2, '#000', ' opacity=".2"') + F('M144 70 l16 -4 l-4 10Z', pick(c, '#f6f1e6').fill, 1.8) + dot(78, 68, 3, '#c8403a') },
};
