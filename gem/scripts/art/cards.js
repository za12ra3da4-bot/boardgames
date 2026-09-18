'use strict';
// 개발 카드 (240×336): 붓으로 그린 듯한 르네상스 풍경 + 위 띠(점수 · 보너스 보석) + 왼쪽 아래 비용 칩
const { f, rng, lin, rad, mix, grain } = require('../../../wolf/scripts/art/draw');
const G = require('../../public/shared/gem');
const { facetGem, sparkle } = require('./gems');

const W = 240;
const H = 336;

const paint = (id, seed) => `<filter id="${id}" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="3" seed="${seed}" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="wob"/>
  <feGaussianBlur in="wob" stdDeviation=".6" result="soft"/>
  <feColorMatrix in="soft" type="matrix" values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 1 0" result="lum"/>
  <feConvolveMatrix in="lum" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" divisor="1" preserveAlpha="true" result="edges"/>
  <feColorMatrix in="edges" type="matrix" values="0 0 0 0 .09  0 0 0 0 .05  0 0 0 0 .03  3.2 3.2 3.2 0 -.12" result="inkLines"/>
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="${seed + 2}" result="brk"/>
  <feComposite in="inkLines" in2="brk" operator="arithmetic" k1="1.6" k2=".2" k3="0" k4="0" result="inkBroken"/>
  <feImage href="#hatchTile" x="0" y="0" width="10" height="10" result="hTile"/>
  <feTile in="hTile" result="hatch"/>
  <feColorMatrix in="lum" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.05" result="darkMask"/>
  <feComposite in="hatch" in2="darkMask" operator="in" result="hatchDark"/>
  <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="4" seed="${seed + 7}" result="bleed"/>
  <feColorMatrix in="bleed" type="matrix" values="0 0 0 0 1  0 0 0 0 .96  0 0 0 0 .88  0 0 0 -.9 .38" result="bleedMask"/>
  <feComposite in="bleedMask" in2="wob" operator="in" result="bleedIn"/>
  <feMerge><feMergeNode in="wob"/><feMergeNode in="bleedIn"/><feMergeNode in="hatchDark"/><feMergeNode in="inkBroken"/></feMerge>
</filter>`;
const HATCH_TILE = '<pattern id="hp" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 3H6" stroke="#1a0e06" stroke-width=".9" opacity=".55"/></pattern>'
  + '<svg id="hatchTile" width="10" height="10" viewBox="0 0 10 10"><path d="M-2 12L12 -2M-7 7L7 -7M3 17L17 3" stroke="#1a0e06" stroke-width=".8" opacity=".6"/></svg>';

/** 울퉁불퉁한 능선 */
function ridge(r, y, amp, n = 8, x0 = -10, x1 = W + 10) {
  let d = `M${x0} ${H}L${x0} ${f(y)}`;
  for (let i = 1; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    d += `Q${f(x - (x1 - x0) / n / 2)} ${f(y - amp * r())} ${f(x)} ${f(y + (r() - 0.5) * amp * 0.6)}`;
  }
  return `${d}L${x1} ${H}Z`;
}
const stones = (r, n, x0, y0, x1, y1, col) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    const w = 4 + r() * 10;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w)}" ry="${f(w * 0.6)}" fill="${mix(col, r() > 0.5 ? '#ffffff' : '#000000', r() * 0.3)}"/>`;
  }
  return s;
};
/** 바위에 박힌 보석 결정들 */
function crystals(r, n, x0, y0, x1, y1, color, size = 10) {
  const g = G.GEMS[color];
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    const h = size * (0.6 + r());
    const a = (r() - 0.5) * 50;
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="M0 ${f(-h)}L${f(h * 0.3)} ${f(-h * 0.2)}L0 0L${f(-h * 0.3)} ${f(-h * 0.2)}Z" fill="${g.fill}" stroke="${g.dark}" stroke-width=".8"/><path d="M0 ${f(-h)}L${f(h * 0.3)} ${f(-h * 0.2)}L0 ${f(-h * 0.4)}Z" fill="${g.light}" opacity=".85"/></g>`;
  }
  return s;
}
const glowAt = (x, y, rr, color, op = 0.5) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${color}" opacity="${op}" filter="url(#soft)"/>`;

/* ═════════ 사람 (펜으로 그린 작은 인물) ═════════ */
function figure(x, y, s, { hat = 'cap', tool = null, color = '#3a2414', pose = 'stand' } = {}) {
  const k = s / 40;
  const T = (px, py) => `${f(x + px * k)} ${f(y + py * k)}`;
  const skin = '#d8a878';
  let o = '';
  // 다리
  if (pose === 'walk') o += `<path d="M${T(-2, -16)}L${T(-8, 0)}M${T(2, -16)}L${T(7, -1)}" stroke="#2a1a0c" stroke-width="${f(3.2 * k)}" stroke-linecap="round"/>`;
  else o += `<path d="M${T(-3, -16)}L${T(-4, 0)}M${T(3, -16)}L${T(4, 0)}" stroke="#2a1a0c" stroke-width="${f(3.2 * k)}" stroke-linecap="round"/>`;
  // 몸통 (외투)
  o += `<path d="M${T(-7, -16)}C${T(-8, -24)} ${T(-7, -32)} ${T(-4, -34)}L${T(4, -34)}C${T(7, -32)} ${T(8, -24)} ${T(7, -16)}Z" fill="${color}" stroke="#1a0e06" stroke-width="${f(0.9 * k)}"/>`;
  o += `<path d="M${T(-6, -20)}H${T(6, -20).split(' ')[0]}" stroke="#1a0e06" stroke-width="${f(1.2 * k)}"/>`;
  // 팔
  const arm = pose === 'lift' ? `M${T(-5, -32)}L${T(-10, -44)}M${T(5, -32)}L${T(10, -44)}` : pose === 'dig' ? `M${T(-5, -31)}L${T(-12, -24)}M${T(5, -31)}L${T(12, -38)}` : `M${T(-5, -32)}L${T(-8, -20)}M${T(5, -32)}L${T(8, -20)}`;
  o += `<path d="${arm}" stroke="${color}" stroke-width="${f(3 * k)}" stroke-linecap="round"/>`;
  // 머리
  o += `<circle cx="${f(x)}" cy="${f(y - 38 * k)}" r="${f(4.2 * k)}" fill="${skin}" stroke="#1a0e06" stroke-width="${f(0.8 * k)}"/>`;
  if (hat === 'cap') o += `<path d="M${T(-5, -40)}Q${T(0, -46)} ${T(5, -40)}L${T(7, -39)}H${T(-5, -39).split(' ')[0]}Z" fill="#6a2a1a"/>`;
  if (hat === 'lamp') o += `<path d="M${T(-5, -40)}Q${T(0, -47)} ${T(5, -40)}Z" fill="#6a5a3a"/><circle cx="${f(x)}" cy="${f(y - 44 * k)}" r="${f(1.8 * k)}" fill="#fff0a0"/>`;
  if (hat === 'turban') o += `<path d="M${T(-5, -40)}C${T(-6, -47)} ${T(6, -47)} ${T(5, -40)}Z" fill="#f4ecd8" stroke="#8a7a60" stroke-width="${f(0.6 * k)}"/>`;
  if (hat === 'beret') o += `<path d="M${T(-6, -41)}Q${T(0, -47)} ${T(7, -42)}Q${T(0, -40)} ${T(-6, -41)}Z" fill="#8a1a2a"/>`;
  if (hat === 'veil') o += `<path d="M${T(-5, -34)}C${T(-7, -44)} ${T(-4, -46)} ${T(0, -46)}C${T(4, -46)} ${T(7, -44)} ${T(5, -34)}Z" fill="#2a2a4a" opacity=".9"/>`;
  // 도구
  if (tool === 'pick') o += `<path d="M${T(12, -38)}L${T(2, -18)}" stroke="#5a3a1a" stroke-width="${f(1.6 * k)}"/><path d="M${T(6, -42)}Q${T(12, -44)} ${T(18, -36)}" stroke="#8a8a90" stroke-width="${f(2 * k)}" fill="none"/>`;
  if (tool === 'lantern') o += `<path d="M${T(8, -20)}V${T(8, -14).split(' ')[1]}" stroke="#3a2a14" stroke-width="${f(0.8 * k)}"/><rect x="${f(x + 5.5 * k)}" y="${f(y - 14 * k)}" width="${f(5 * k)}" height="${f(6 * k)}" fill="#ffd070" stroke="#3a2a14" stroke-width="${f(0.6 * k)}"/><circle cx="${f(x + 8 * k)}" cy="${f(y - 11 * k)}" r="${f(9 * k)}" fill="#ffc050" opacity=".25"/>`;
  if (tool === 'sack') o += `<path d="M${T(-14, -30)}C${T(-20, -28)} ${T(-20, -18)} ${T(-12, -16)}C${T(-6, -16)} ${T(-6, -28)} ${T(-12, -30)}Z" fill="#b8986a" stroke="#5a4a2a" stroke-width="${f(0.8 * k)}"/>`;
  if (tool === 'scroll') o += `<rect x="${f(x + 6 * k)}" y="${f(y - 24 * k)}" width="${f(6 * k)}" height="${f(8 * k)}" fill="#f4ecd8" stroke="#8a7a60" stroke-width="${f(0.6 * k)}"/>`;
  return `<g>${o}</g>`;
}
/** 먼 곳 새 떼 */
const birds = (r, n, x0, y0, x1, y1) => Array.from({ length: n }, () => { const x = x0 + r() * (x1 - x0); const y = y0 + r() * (y1 - y0); const s = 3 + r() * 3; return `<path d="M${f(x - s)} ${f(y)}q${f(s / 2)} ${f(-s / 2)} ${f(s)} 0q${f(s / 2)} ${f(-s / 2)} ${f(s)} 0" stroke="#2a1a14" stroke-width="1.1" fill="none"/>`; }).join('');
/** 구름 */
const cloud = (x, y, w, c = '#fff8ec', op = 0.8) => `<path d="M${f(x)} ${f(y)}c${f(w * 0.1)} ${f(-w * 0.18)} ${f(w * 0.32)} ${f(-w * 0.2)} ${f(w * 0.4)} ${f(-w * 0.06)}c${f(w * 0.12)} ${f(-w * 0.16)} ${f(w * 0.36)} ${f(-w * 0.1)} ${f(w * 0.38)} ${f(w * 0.06)}c${f(w * 0.14)} 0 ${f(w * 0.22)} ${f(w * 0.12)} ${f(w * 0.1)} ${f(w * 0.14)}H${f(x)}Z" fill="${c}" opacity="${op}"/>`;

/* ═════════ 1단계: 광산 ═════════ */
const MINES = [
  // 동굴 입구
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyDay)"/>`;
    s += `<path d="${ridge(r, 150, 60)}" fill="#8a7a6a"/><path d="${ridge(r, 200, 40)}" fill="#6a5a4a"/>`;
    s += `<path d="M40 336L60 190C80 150 160 150 180 190L200 336Z" fill="#5a4a3a"/>`;
    s += `<path d="M78 336L84 230C96 200 144 200 156 230L162 336Z" fill="#140c08"/>`;
    s += crystals(r, 14, 70, 220, 170, 330, c, 12) + glowAt(120, 280, 40, G.GEMS[c].fill, 0.35);
    s += `<path d="M80 236h80M78 250h84" stroke="#6a4a2a" stroke-width="6"/><path d="M84 230V336M156 230V336" stroke="#6a4a2a" stroke-width="7"/>`;
    s += stones(r, 18, 0, 300, W, 336, '#7a6a58');
    s += cloud(20, 70, 90) + cloud(150, 50, 70) + birds(r, 4, 120, 30, 220, 80);
    s += figure(196, 318, 44, { hat: 'lamp', tool: 'pick', color: '#4a3a2a', pose: 'dig' }) + figure(40, 322, 38, { hat: 'cap', tool: 'sack', color: '#5a3a24' });
    return s;
  },
  // 레일 위 광차
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="#1a120c"/>`;
    s += `<path d="M0 0H240V120Q120 80 0 120Z" fill="#3a2a1c"/><path d="M0 336L90 170H150L240 336Z" fill="#2a1e14"/>`;
    s += `<path d="M60 336L108 170M180 336L132 170" stroke="#6a6a70" stroke-width="3"/>`;
    for (let i = 0; i < 8; i++) { const y = 180 + i * i * 2.4; s += `<path d="M${f(118 - (y - 170) * 0.45)} ${f(y)}H${f(122 + (y - 170) * 0.45)}" stroke="#4a3a2a" stroke-width="${f(2 + i * 0.6)}"/>`; }
    s += `<path d="M70 250H170L160 300H80Z" fill="#5a4a3a" stroke="#2a1e14" stroke-width="3"/><circle cx="92" cy="304" r="9" fill="#2a2a2a"/><circle cx="148" cy="304" r="9" fill="#2a2a2a"/>`;
    s += crystals(r, 12, 80, 238, 160, 256, c, 14) + glowAt(120, 244, 40, G.GEMS[c].fill, 0.4);
    s += `<path d="M190 60V110" stroke="#2a1e14" stroke-width="2"/><path d="M182 110h16l-2 20h-12Z" fill="#6a5020"/><circle cx="190" cy="120" r="6" fill="#ffd070"/>` + glowAt(190, 120, 50, '#ffb040', 0.45);
    s += crystals(r, 8, 0, 60, 60, 200, c, 9) + crystals(r, 8, 190, 150, 240, 280, c, 9);
    s += figure(58, 300, 46, { hat: 'lamp', tool: 'lantern', color: '#3a2a1a', pose: 'walk' });
    return s;
  },
  // 강가 사금 채취
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyDay)"/>`;
    s += `<path d="${ridge(r, 110, 50)}" fill="#7a8a9a" opacity=".8"/><path d="${ridge(r, 160, 40)}" fill="#4a6a4a"/>`;
    s += `<path d="M0 220Q120 200 240 230V336H0Z" fill="#5a8ab0"/><path d="M0 240Q120 220 240 250M0 270Q120 250 240 280" stroke="#9ac8e8" stroke-width="2" fill="none" opacity=".7"/>`;
    s += `<path d="M0 300Q120 280 240 310V336H0Z" fill="#a89070"/>`;
    s += `<g fill="#2a1e14"><circle cx="150" cy="200" r="9"/><path d="M142 208L136 250L160 250L156 208Z"/><path d="M140 222L118 238L122 244L144 230Z"/><path d="M138 250L132 280H140L146 252M152 252L156 280H164L158 250Z"/><path d="M130 196L170 196L162 188L138 188Z"/></g>`;
    s += `<ellipse cx="112" cy="244" rx="20" ry="7" fill="#6a5a4a" stroke="#2a1e14" stroke-width="2"/>` + crystals(r, 5, 100, 238, 124, 244, c, 6);
    s += crystals(r, 10, 10, 300, 230, 330, c, 7);
    s += cloud(30, 60, 80) + cloud(160, 80, 60) + birds(r, 5, 20, 20, 220, 70);
    s += figure(40, 296, 30, { hat: 'cap', color: '#6a4a2a', pose: 'dig' });
    return s;
  },
  // 수정 동굴
  (r, c) => {
    const g = G.GEMS[c];
    let s = `<rect width="${W}" height="${H}" fill="${mix(g.dark, '#000000', 0.5)}"/>`;
    s += glowAt(120, 180, 140, g.fill, 0.35);
    s += `<path d="M0 0H240V60Q120 110 0 60Z" fill="#140e0a"/><path d="M0 336V260Q120 220 240 260V336Z" fill="#140e0a"/>`;
    for (let i = 0; i < 9; i++) {
      const x = 10 + i * 27 + r() * 10;
      const h = 60 + r() * 90;
      const w = 12 + r() * 12;
      s += `<path d="M${f(x)} 290L${f(x - w)} ${f(290 - h * 0.6)}L${f(x)} ${f(290 - h)}L${f(x + w)} ${f(290 - h * 0.6)}Z" fill="${g.fill}" stroke="${g.dark}" stroke-width="1.5"/><path d="M${f(x)} 290L${f(x)} ${f(290 - h)}L${f(x + w)} ${f(290 - h * 0.6)}Z" fill="${g.dark}" opacity=".45"/><path d="M${f(x - w * 0.6)} ${f(290 - h * 0.55)}L${f(x)} ${f(290 - h * 0.9)}" stroke="${g.light}" stroke-width="2"/>`;
    }
    for (let i = 0; i < 6; i++) { const x = r() * W; const h = 30 + r() * 40; s += `<path d="M${f(x)} 50L${f(x - 8)} ${f(50 + h * 0.4)}L${f(x)} ${f(50 + h)}L${f(x + 8)} ${f(50 + h * 0.4)}Z" fill="${g.fill}" opacity=".85"/>`; }
    s += sparkle(70, 150, 10) + sparkle(170, 120, 8) + sparkle(130, 210, 7);
    s += figure(120, 322, 42, { hat: 'lamp', tool: 'lantern', color: '#2a2030', pose: 'lift' });
    return s;
  },
  // 채석장 절벽 · 사다리 · 곡괭이
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyWarm)"/>`;
    s += `<path d="M0 90L60 80L70 140L140 130L150 190L240 180V336H0Z" fill="#b8987a"/><path d="M0 90L60 80L70 140L0 150Z" fill="#8a6a50"/><path d="M70 140L140 130L150 190L80 196Z" fill="#9a7a60"/>`;
    s += `<path d="M150 190L240 180V336H150Z" fill="#a88a6a"/>`;
    s += crystals(r, 10, 80, 150, 140, 190, c, 9) + crystals(r, 10, 160, 200, 230, 260, c, 10);
    s += `<path d="M40 160L60 300M58 160L78 300" stroke="#5a3a1a" stroke-width="4"/>`;
    for (let i = 0; i < 7; i++) s += `<path d="M${f(42 + i * 2.8)} ${f(175 + i * 18)}H${f(60 + i * 2.8)}" stroke="#5a3a1a" stroke-width="3"/>`;
    s += `<path d="M150 300L200 250" stroke="#6a4a2a" stroke-width="5"/><path d="M186 244Q204 238 214 256L200 250Z" fill="#8a8a90" stroke="#3a3a40" stroke-width="2"/>`;
    s += stones(r, 22, 0, 290, W, 336, '#9a7a5a');
    s += cloud(120, 50, 90, '#fff4e0', 0.7) + birds(r, 3, 150, 20, 230, 60);
    s += figure(50, 230, 34, { hat: 'cap', color: '#5a3a24', pose: 'lift' }) + figure(190, 300, 40, { hat: 'cap', tool: 'pick', color: '#4a2a1a', pose: 'dig' });
    return s;
  },
  // 산속 광부 오두막, 노을
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyDusk)"/>`;
    s += `<circle cx="180" cy="90" r="26" fill="#ffd890" opacity=".9"/>`;
    s += `<path d="M0 200L70 70L120 150L160 100L240 190V336H0Z" fill="#5a4a5a"/><path d="M70 70L80 90L60 100Z M160 100L170 116L150 120Z" fill="#e8e0f0"/>`;
    s += `<path d="${ridge(r, 240, 30)}" fill="#3a3a2a"/>`;
    s += `<path d="M40 280V240L70 220L100 240V280Z" fill="#6a4a2a"/><path d="M34 244L70 214L106 244" stroke="#3a2a14" stroke-width="6" fill="none"/><rect x="60" y="250" width="14" height="14" fill="#ffc860"/>`;
    s += `<path d="M150 290C150 260 190 260 190 290Z" fill="#140c08"/>` + crystals(r, 6, 152, 272, 188, 290, c, 8) + glowAt(170, 282, 24, G.GEMS[c].fill, 0.5);
    s += `<path d="M110 336Q140 300 170 292" stroke="#8a6a4a" stroke-width="10" fill="none"/>`;
    s += birds(r, 6, 100, 60, 230, 130);
    s += figure(130, 318, 36, { hat: 'lamp', tool: 'sack', color: '#3a2a1a', pose: 'walk' });
    return s;
  },
];

/* ═════════ 2단계: 공방 · 교역 ═════════ */
const TRADE = [
  // 보석 세공사의 작업대
  (r, c) => {
    const g = G.GEMS[c];
    let s = `<rect width="${W}" height="${H}" fill="#2a1a10"/>`;
    s += `<rect x="20" y="20" width="80" height="110" fill="#8ab8e0" opacity=".25"/><path d="M60 20V130M20 75H100" stroke="#1a0e08" stroke-width="5"/>`;
    s += glowAt(150, 150, 110, '#ffb050', 0.35);
    s += `<path d="M0 230H240V336H0Z" fill="#5a3a1c"/><path d="M0 230H240" stroke="#8a6030" stroke-width="4"/>`;
    s += `<path d="M150 90L168 90L176 130H142Z" fill="#8a6a2a"/><path d="M159 90V60" stroke="#3a2a14" stroke-width="3"/><circle cx="159" cy="138" r="8" fill="#ffe8a0"/>`;
    s += `<ellipse cx="120" cy="228" rx="46" ry="10" fill="#6a6a70"/><ellipse cx="120" cy="224" rx="46" ry="10" fill="#9a9aa0" stroke="#4a4a50" stroke-width="2"/>`;
    s += `<g transform="translate(120 200)">${facetGem(0, 0, 22, c)}</g>` + glowAt(120, 200, 40, g.fill, 0.35);
    s += `<path d="M30 260L90 250L94 258L34 268Z" fill="#8a8a90"/><path d="M180 256L220 250L222 256L182 262Z" fill="#c8a040"/>`;
    s += `<path d="M0 336C20 300 50 280 70 290L60 336Z" fill="#c89a70"/><path d="M58 292L74 300" stroke="#8a6a4a" stroke-width="3"/>`;
    s += crystals(r, 5, 170, 262, 230, 280, c, 6);
    s += figure(206, 232, 60, { hat: 'beret', color: '#3a2a4a', pose: 'lift' });
    return s;
  },
  // 항구의 상선
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyDay)"/>`;
    s += `<path d="M0 200H240V336H0Z" fill="#3a6a9a"/><path d="M0 220Q60 214 120 222T240 220M0 250Q60 244 120 252T240 250" stroke="#9ac8e8" stroke-width="2" fill="none" opacity=".6"/>`;
    s += `<path d="M150 200V120L170 110L190 120V200Z M190 200V150H220V200Z" fill="#c8b090"/><path d="M146 124L170 104L194 124" fill="#a84a2a"/>`;
    s += `<path d="M30 210H130L118 236H44Z" fill="#6a3a1a" stroke="#2a1408" stroke-width="2"/><path d="M80 210V90M60 210V120" stroke="#3a2412" stroke-width="3"/>`;
    s += `<path d="M82 96Q120 120 82 170Z" fill="#f4ecd8" stroke="#8a7a60"/><path d="M62 124Q90 144 62 190Z" fill="#f4ecd8" stroke="#8a7a60"/><path d="M80 90L96 84L80 80Z" fill="${G.GEMS[c].fill}"/>`;
    s += `<path d="M0 290H240V336H0Z" fill="#6a4a2a"/><path d="M0 290H240" stroke="#3a2412" stroke-width="3"/>`;
    s += `<rect x="150" y="262" width="36" height="28" fill="#8a5a2a" stroke="#3a2412" stroke-width="2"/>` + crystals(r, 6, 152, 258, 184, 264, c, 7);
    s += cloud(20, 70, 90) + cloud(170, 50, 60) + birds(r, 6, 100, 30, 230, 90);
    s += figure(120, 290, 34, { hat: 'cap', tool: 'sack', color: '#5a3a24', pose: 'walk' }) + figure(210, 290, 36, { hat: 'beret', tool: 'scroll', color: '#6a1a2a' });
    return s;
  },
  // 사막의 낙타 대상
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyWarm)"/>`;
    s += `<circle cx="60" cy="100" r="30" fill="#fff0c0"/>`;
    s += `<path d="M0 220Q60 190 120 210T240 200V336H0Z" fill="#e8b870"/><path d="M0 260Q80 230 160 250T240 250V336H0Z" fill="#d8a060"/>`;
    const camel = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#3a2414"><path d="M0 0C4 -20 16 -24 24 -14C30 -26 44 -26 48 -10L60 -30L68 -28L60 -4L56 0L54 30H50L48 6H14L12 30H8L6 4C2 4 0 2 0 0Z"/><path d="M20 -18h14v-8h-14Z" fill="${G.GEMS[c].fill}"/></g>`;
    s += camel(30, 230, 1) + camel(100, 240, 1.1) + camel(170, 236, 0.9);
    s += `<g fill="#2a1a0c"><circle cx="86" cy="206" r="4"/><path d="M83 210h6l2 20h-10Z"/></g>`;
    s += crystals(r, 8, 0, 300, 240, 330, c, 6);
    s += figure(210, 262, 34, { hat: 'turban', color: '#e8dcc0', pose: 'walk' });
    return s;
  },
  // 도시로 가는 마차
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyDay)"/>`;
    s += `<path d="${ridge(r, 170, 30)}" fill="#6a8a5a"/>`;
    s += `<path d="M150 170V120H160V110H170V120H190V100L200 90L210 100V170Z" fill="#b8a080"/><path d="M168 110V100L175 94L182 100V110Z" fill="#a84a2a"/>`;
    s += `<path d="M120 336Q130 250 170 170H180Q160 250 200 336Z" fill="#c8a878"/>`;
    s += `<path d="M20 250H100V290H20Z" fill="#6a3a1a" stroke="#2a1408" stroke-width="2"/><path d="M16 250Q60 220 104 250Z" fill="#e8dcc0"/><circle cx="36" cy="296" r="12" fill="#2a1a0c"/><circle cx="84" cy="296" r="12" fill="#2a1a0c"/>`;
    s += `<g fill="#2a1a0c"><path d="M104 270L150 262C160 250 172 250 176 262L180 290H174L170 276L150 280L148 300H142L140 280Z"/><path d="M172 256L184 238L190 244L180 262Z"/></g>`;
    s += crystals(r, 6, 30, 244, 90, 252, c, 8) + glowAt(60, 246, 26, G.GEMS[c].fill, 0.4);
    s += cloud(10, 60, 80) + cloud(120, 40, 70) + birds(r, 4, 40, 20, 140, 60);
    s += figure(200, 310, 34, { hat: 'beret', color: '#2a4a6a', pose: 'walk' });
    return s;
  },
  // 보석상 가게 진열창
  (r, c) => {
    const g = G.GEMS[c];
    let s = `<rect width="${W}" height="${H}" fill="#3a2a2a"/>`;
    s += `<path d="M0 0H240V60H0Z" fill="#5a3a2a"/><path d="M10 60L30 30H210L230 60Z" fill="#8a2a2a"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M${10 + i * 37} 60q18 14 37 0" fill="${i % 2 ? '#f4ecd8' : '#8a2a2a'}"/>`;
    s += `<rect x="30" y="90" width="180" height="150" fill="#1a1010" stroke="#c8a040" stroke-width="6"/>` + glowAt(120, 165, 90, '#ffd070', 0.3);
    s += `<path d="M40 210H200" stroke="#8a2a2a" stroke-width="16"/>`;
    s += `<g transform="translate(80 185)">${facetGem(0, 0, 16, c)}</g><g transform="translate(160 185)">${facetGem(0, 0, 14, c)}</g><g transform="translate(120 170)">${facetGem(0, 0, 20, c)}</g>`;
    s += `<path d="M60 130q60 30 120 0" stroke="#e8c870" stroke-width="3" fill="none"/>` + [0, 1, 2, 3, 4].map((i) => `<circle cx="${70 + i * 25}" cy="${f(137 + Math.sin((i / 4) * Math.PI) * 12)}" r="4" fill="${g.light}"/>`).join('');
    s += `<path d="M0 260H240V336H0Z" fill="#6a6a70"/>` + stones(r, 24, 0, 270, W, 336, '#7a7a80');
    s += figure(24, 336, 70, { hat: 'veil', color: '#5a2a5a' }) + figure(216, 336, 70, { hat: 'beret', color: '#2a3a5a', tool: 'scroll' });
    return s;
  },
  // 폭풍 속 갤리온
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyStorm)"/>`;
    s += `<path d="M150 0L130 60L150 64L120 130" stroke="#fff4c0" stroke-width="3" fill="none"/>`;
    s += `<path d="M0 220Q40 180 80 220T160 210T240 220V336H0Z" fill="#1a3a5a"/><path d="M0 250Q60 220 120 250T240 250V336H0Z" fill="#2a4a6a"/>`;
    s += `<g transform="rotate(-8 120 220)"><path d="M50 220H190L176 250H64Z" fill="#4a2a14" stroke="#1a0e06" stroke-width="2"/><path d="M90 220V70M130 220V60M170 220V100" stroke="#2a1a0c" stroke-width="4"/>`;
    s += `<path d="M92 76Q130 100 92 140Z M132 66Q176 96 132 150Z M172 104Q200 124 172 170Z" fill="#e8dcc0"/><path d="M130 60l18 -6l-18 -6Z" fill="${G.GEMS[c].fill}"/></g>`;
    s += `<path d="M0 300Q60 270 120 300T240 296V336H0Z" fill="#dfe8f0" opacity=".25"/>`;
    s += crystals(r, 6, 60, 196, 110, 214, c, 7);
    s += birds(r, 3, 20, 60, 110, 110);
    return s;
  },
];

/* ═════════ 3단계: 궁정 · 도시 ═════════ */
const CITY = [
  // 둥근 지붕 성당이 있는 도시
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyDusk)"/>`;
    s += `<path d="M0 200H240V336H0Z" fill="#c89870"/>`;
    s += `<path d="M90 200V150H150V200Z" fill="#d8b890"/><path d="M84 150Q120 70 156 150Z" fill="#a84a2a"/><path d="M120 76V60M114 64h12" stroke="#c8a040" stroke-width="3"/><path d="M84 150Q120 100 156 150" stroke="#f4ecd8" stroke-width="3" fill="none"/>`;
    s += `<path d="M175 200V110H190V200Z" fill="#e8d8c0"/><path d="M172 110L182 90L193 110Z" fill="#a84a2a"/>`;
    for (let i = 0; i < 9; i++) { const x = i * 28 - 10; const h = 30 + r() * 40; s += `<path d="M${x} 336V${f(250 - h)}H${x + 26}V336Z" fill="${mix('#c89870', '#6a3a2a', r() * 0.6)}"/><path d="M${x - 2} ${f(250 - h)}L${x + 13} ${f(236 - h)}L${x + 28} ${f(250 - h)}Z" fill="#a84a2a"/><rect x="${x + 8}" y="${f(262 - h)}" width="8" height="12" fill="#ffd070" opacity=".8"/>`; }
    s += glowAt(120, 140, 80, G.GEMS[c].fill, 0.25) + `<g transform="translate(120 162)">${facetGem(0, 0, 10, c)}</g>`;
    s += birds(r, 7, 10, 40, 230, 110);
    s += figure(60, 320, 30, { hat: 'veil', color: '#6a2a3a', pose: 'walk' }) + figure(180, 322, 32, { hat: 'beret', color: '#2a3a5a' });
    return s;
  },
  // 정원이 있는 궁전
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyDay)"/>`;
    s += `<path d="M20 200V120H220V200Z" fill="#f0e4cc"/><path d="M10 120L120 70L230 120Z" fill="#b8a080"/><path d="M100 120V90H140V120Z" fill="#e8dcc0"/><circle cx="120" cy="104" r="8" fill="${G.GEMS[c].fill}" stroke="#c8a040" stroke-width="2"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${30 + i * 21}" y="136" width="10" height="20" rx="5" fill="#5a7aa0"/><rect x="${30 + i * 21}" y="168" width="10" height="20" rx="5" fill="#5a7aa0"/>`;
    s += `<path d="M0 200H240V336H0Z" fill="#6a9a4a"/><path d="M120 200L90 336H150Z" fill="#e8d8b0"/>`;
    for (let i = 0; i < 6; i++) { const x = i < 3 ? 20 + i * 22 : 150 + (i - 3) * 26; s += `<path d="M${x} 300V250" stroke="#3a2a14" stroke-width="3"/><path d="M${x - 10} 260L${x} 220L${x + 10} 260Z" fill="#2a5a2a"/>`; }
    s += `<ellipse cx="120" cy="250" rx="30" ry="10" fill="#8ac0e0" stroke="#c8b890" stroke-width="3"/><path d="M120 250V226" stroke="#dfe8ff" stroke-width="3"/>`;
    s += cloud(20, 50, 70) + cloud(150, 40, 80) + birds(r, 4, 10, 20, 90, 60);
    s += figure(104, 320, 30, { hat: 'veil', color: '#8a2a4a' }) + figure(136, 320, 32, { hat: 'beret', color: '#2a2a5a' });
    return s;
  },
  // 운하 도시와 다리
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyWarm)"/>`;
    s += `<path d="M0 60H70V230H0Z" fill="#c87a5a"/><path d="M170 80H240V230H170Z" fill="#d8a878"/>`;
    for (let i = 0; i < 3; i++) s += `<path d="M${14 + i * 18} ${90 + 0} v30 q5 -8 10 0 v-30z" fill="#3a2a2a"/><path d="M${184 + i * 18} 110v30q5 -8 10 0v-30z" fill="#3a2a2a"/>`;
    s += `<path d="M60 170Q120 110 180 170L180 184Q120 130 60 184Z" fill="#e8dcc0" stroke="#8a7a60" stroke-width="2"/>`;
    s += `<path d="M0 230H240V336H0Z" fill="#2a6a7a"/><path d="M0 250Q120 244 240 252M0 280Q120 272 240 282" stroke="#8ad0d8" stroke-width="2" fill="none" opacity=".6"/>`;
    s += `<path d="M70 290Q120 300 170 286L166 296Q120 310 74 300Z" fill="#1a1a1a"/><path d="M160 286L172 270" stroke="#1a1a1a" stroke-width="3"/><path d="M140 290V260" stroke="#2a1a1a" stroke-width="3"/><circle cx="140" cy="256" r="5" fill="#2a1a1a"/>`;
    s += `<path d="M110 292h20v-6h-20Z" fill="${G.GEMS[c].fill}"/>` + crystals(r, 4, 110, 284, 130, 288, c, 5);
    s += birds(r, 5, 80, 20, 220, 70);
    s += figure(96, 172, 18, { hat: 'veil', color: '#6a2a5a' }) + figure(144, 170, 18, { hat: 'beret', color: '#2a3a6a' });
    return s;
  },
  // 대성당 탑
  (r, c) => {
    let s = `<rect width="${W}" height="${H}" fill="url(#skyNight)"/>`;
    s += `<circle cx="190" cy="60" r="18" fill="#fff4d0"/>`;
    s += `<path d="M60 336V120L80 60L100 120V336Z M140 336V120L160 60L180 120V336Z" fill="#3a3040"/><path d="M100 336V180H140V336Z" fill="#4a4050"/>`;
    s += `<circle cx="120" cy="210" r="18" fill="${G.GEMS[c].fill}" opacity=".85"/><circle cx="120" cy="210" r="18" fill="none" stroke="#c8a040" stroke-width="3"/><path d="M102 210H138M120 192V228" stroke="#c8a040" stroke-width="2"/>`;
    s += glowAt(120, 210, 40, G.GEMS[c].fill, 0.5);
    s += `<rect x="72" y="150" width="16" height="30" rx="8" fill="#ffd070"/><rect x="152" y="150" width="16" height="30" rx="8" fill="#ffd070"/>`;
    s += `<path d="M0 300H240V336H0Z" fill="#1a1620"/>`;
    s += figure(120, 336, 40, { hat: 'veil', tool: 'lantern', color: '#3a2a4a', pose: 'walk' });
    return s;
  },
  // 옥좌의 방
  (r, c) => {
    const g = G.GEMS[c];
    let s = `<rect width="${W}" height="${H}" fill="#3a1a1a"/>`;
    s += `<path d="M40 0V336M200 0V336" stroke="#5a2a1a" stroke-width="30"/><path d="M26 0V336M214 0V336" stroke="#c8a040" stroke-width="3"/>`;
    s += `<path d="M80 40Q120 20 160 40V300H80Z" fill="#8a1a2a"/><path d="M80 40Q120 20 160 40" stroke="#c8a040" stroke-width="4" fill="none"/>`;
    s += `<path d="M96 110H144V200H154V250H86V200H96Z" fill="#c8a040" stroke="#6a4a10" stroke-width="3"/><path d="M104 120H136V200H104Z" fill="#6a1020"/>`;
    s += `<g transform="translate(120 106)">${facetGem(0, 0, 13, c)}</g>` + glowAt(120, 106, 30, g.fill, 0.5);
    s += `<path d="M0 260H240V336H0Z" fill="#6a2a1a"/><path d="M60 336L100 250H140L180 336Z" fill="#a82a2a"/>`;
    s += `<path d="M112 250h16l-2 -8h-12Z" fill="#c8a040"/>`;
    s += figure(58, 336, 66, { hat: 'cap', color: '#1a2a4a', tool: 'scroll' }) + figure(184, 336, 66, { hat: 'veil', color: '#4a1a3a' });
    return s;
  },
  // 불꽃놀이 아래의 성
  (r, c) => {
    const g = G.GEMS[c];
    let s = `<rect width="${W}" height="${H}" fill="url(#skyNight)"/>`;
    for (let k = 0; k < 3; k++) {
      const cx = 50 + k * 70 + r() * 20;
      const cy = 60 + r() * 40;
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; s += `<path d="M${f(cx + Math.cos(a) * 6)} ${f(cy + Math.sin(a) * 6)}L${f(cx + Math.cos(a) * 26)} ${f(cy + Math.sin(a) * 26)}" stroke="${k === 1 ? g.light : k ? '#ffd070' : '#ff8a8a'}" stroke-width="2" stroke-linecap="round"/>`; }
    }
    s += `<path d="${ridge(r, 250, 20)}" fill="#1a1a2a"/>`;
    s += `<path d="M60 250V170H80V150H90V170H150V150H160V170H180V250Z" fill="#2a2638"/><path d="M110 170V110H130V170Z" fill="#2a2638"/><path d="M106 110L120 86L134 110Z" fill="#3a3448"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${70 + i * 22}" y="${196 + (i % 2) * 14}" width="6" height="10" fill="#ffd070"/>`;
    s += `<path d="M120 86V74" stroke="#c8a040" stroke-width="2"/><path d="M120 74l12 4l-12 4Z" fill="${g.fill}"/>`;
    s += figure(40, 330, 34, { hat: 'veil', color: '#3a2a5a' }) + figure(66, 332, 36, { hat: 'beret', color: '#2a2a3a', pose: 'lift' });
    return s;
  },
];

const SCENES = { 1: MINES, 2: TRADE, 3: CITY };

function cardSvg(card) {
  const r = rng(card.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 99991 + 1);
  const scene = SCENES[card.tier][card.art % 6](r, card.bonus);
  const costs = G.COLORS.filter((c) => card.cost[c]);
  let chips = '';
  costs.slice().reverse().forEach((c, i) => {
    const y = H - 30 - i * 38;
    const g = G.GEMS[c];
    chips += `<g transform="translate(26 ${y})"><circle r="17" fill="#000" opacity=".35" transform="translate(1.5 2)"/><circle r="16" fill="${g.fill}" stroke="${c === 'white' ? '#8a94a8' : '#f4ecd8'}" stroke-width="2.5"/>
      <circle r="12" fill="none" stroke="${c === 'white' ? '#c8d0dc' : g.light}" stroke-width="1" opacity=".7"/>
      <text y="7" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="20" fill="${c === 'white' ? '#1a1a24' : '#ffffff'}" stroke="${c === 'white' ? 'none' : '#000'}" stroke-width=".6">${card.cost[c]}</text></g>`;
  });
  const tierPips = Array.from({ length: card.tier }, (_, i) => `<circle cx="${f(W / 2 - (card.tier - 1) * 6 + i * 12)}" cy="${H - 10}" r="3.2" fill="#f4ecd8" stroke="#3a2a14" stroke-width="1"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    ${lin('skyDay', [[0, '#6a9ad0'], [0.6, '#b8d4ec'], [1, '#e8e0c8']])}
    ${lin('skyWarm', [[0, '#e89a50'], [0.6, '#f8c880'], [1, '#fce8c0']])}
    ${lin('skyDusk', [[0, '#3a3a6a'], [0.5, '#c86a5a'], [1, '#f8b870']])}
    ${lin('skyNight', [[0, '#0a1030'], [1, '#2a3a6a']])}
    ${lin('skyStorm', [[0, '#1a2030'], [1, '#4a5a6a']])}
    ${lin('band', [[0, '#ffffff', 0.92], [1, '#f4ecd8', 0.82]])}
    ${rad('vig', [[0.6, '#000', 0], [1, '#000', 0.45]], 0.5, 0.5, 0.75)}
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    ${HATCH_TILE}${paint('paint', r() * 90 | 0)}${grain('grain')}
    <clipPath id="clip"><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="14" fill="#f4ecd8"/>
  <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="12" fill="none" stroke="#c8a040" stroke-width="1.4" opacity=".8"/>
  <g clip-path="url(#clip)">
    <g filter="url(#paint)">${scene}</g>
    <rect width="${W}" height="${H}" fill="url(#vig)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".08"/>
    <rect x="0" y="0" width="${W}" height="66" fill="url(#band)"/>
    <path d="M0 66H${W}" stroke="${G.GEMS[card.bonus].dark}" stroke-width="2" opacity=".5"/>
  </g>
  ${card.points ? `<text x="20" y="54" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="50" fill="#ffffff" stroke="#2a1a0a" stroke-width="2.4" paint-order="stroke">${card.points}</text>` : ''}
  <g transform="translate(${W - 38} 34)">${facetGem(0, 0, 22, card.bonus)}</g>
  ${chips}
  ${tierPips}
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="none" stroke="#2a1a0a" stroke-width="1.5" opacity=".5"/>
</svg>`;
}

/** 카드 뒷면: 1 초록 · 2 노랑 · 3 파랑 */
function backSvg(tier) {
  const col = { 1: ['#1e6a3a', '#0a3a1a'], 2: ['#c8901e', '#6a4a08'], 3: ['#2a4aa0', '#0e1e5a'] }[tier];
  let orn = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    orn += `<path d="M${f(120 + Math.cos(a) * 40)} ${f(168 + Math.sin(a) * 40)}Q${f(120 + Math.cos(a + 0.26) * 80)} ${f(168 + Math.sin(a + 0.26) * 80)} ${f(120 + Math.cos(a + 0.52) * 40)} ${f(168 + Math.sin(a + 0.52) * 40)}" stroke="#f4dc90" stroke-width="2" fill="none" opacity=".7"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>${rad('bg', [[0, mix(col[0], '#ffffff', 0.15)], [1, col[1]]], 0.5, 0.45, 0.8)}${grain('grain')}</defs>
  <rect width="${W}" height="${H}" rx="14" fill="#f4ecd8"/>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="url(#bg)"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="6" fill="none" stroke="#f4dc90" stroke-width="2"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="4" fill="none" stroke="#f4dc90" stroke-width="1" stroke-dasharray="2 5"/>
  ${orn}
  <circle cx="120" cy="168" r="36" fill="${col[1]}" stroke="#f4dc90" stroke-width="3"/>
  ${Array.from({ length: tier }, (_, i) => `<circle cx="${f(120 - (tier - 1) * 12 + i * 24)}" cy="168" r="8" fill="#f4dc90"/>`).join('')}
  <text x="120" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="5" fill="#f4dc90">${['', 'MINIERA', 'BOTTEGA', 'PALAZZO'][tier]}</text>
  <rect width="${W}" height="${H}" rx="14" filter="url(#grain)" opacity=".1"/>
</svg>`;
}

module.exports = { cardSvg, backSvg };
