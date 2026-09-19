/* 프로필 캐릭터 그리기 (손그림 느낌의 작은 사람)
   부위마다 따로 묶어 두어서 이모트 때 팔 · 다리 · 머리가 각자 움직인다. */
import './avatar-parts.js';

const P = self.AVATAR_PARTS;
export { P as PARTS };

const INK = '#2a1d14';
const mixC = (a, b, k) => P.mix(a, b, k);
const find = (list, id) => list.find((o) => o.id === id) || list[0];
let uidSeq = 0;

/** 먹선 있는 면 */
const F = (d, fill, sw = 3, extra = '') => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
/** 선만 */
const L = (d, sw = 2.6, color = INK, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
/** 먹선 없는 면 (그림자 · 빛) */
const T = (d, fill, op = 1) => `<path d="${d}" fill="${fill}" opacity="${op}"/>`;

/* ───────── 머리카락 ───────── */
function bumps(cx, cy, rx, ry, a0, a1, n, r) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    const x = (cx + rx * Math.cos(a)).toFixed(1);
    const y = (cy + ry * Math.sin(a)).toFixed(1);
    d += i === 0 ? `M${x} ${y}` : ` A${r} ${r} 0 0 1 ${x} ${y}`;
  }
  return d;
}
function hairBack(style, hc) {
  switch (style) {
    case 'long': return F('M50 86 C46 40 74 24 100 24 C128 24 156 40 150 86 L160 156 C146 164 132 158 126 148 L74 148 C68 158 54 164 40 156Z', hc.fill)
      + L('M60 110 Q58 132 52 150M140 110 Q142 132 148 150', 2.2, hc.light);
    case 'bob': return F('M48 88 C44 42 72 26 100 26 C130 26 156 42 152 88 L154 126 C142 134 130 130 126 122 L74 122 C70 130 58 134 46 126Z', hc.fill);
    case 'pony': return F('M136 48 C180 46 190 104 166 146 C162 120 158 96 134 74Z', hc.fill)
      + L('M150 70 Q166 96 164 126', 2.2, hc.light)
      + F('M130 44 a9 9 0 1 1 12 12 a9 9 0 1 1 -12 -12Z', '#c8453a', 2.4);
    case 'curly': return F(`${bumps(100, 84, 60, 56, 150, 390, 11, 13)} Z`, hc.fill);
    case 'twin': return F('M56 66 C28 76 22 128 38 158 C44 132 50 106 64 88Z', hc.fill) + F('M144 66 C172 76 178 128 162 158 C156 132 150 106 136 88Z', hc.fill)
      + L('M44 96 Q38 122 40 146M156 96 Q162 122 160 146', 2.2, hc.light)
      + F('M50 78 a7 7 0 1 1 12 8 a7 7 0 1 1 -12 -8Z', '#c8453a', 2.2) + F('M138 86 a7 7 0 1 1 12 -8 a7 7 0 1 1 -12 8Z', '#c8453a', 2.2)
      + F('M50 86 C46 40 74 26 100 26 C128 26 156 40 150 86Z', hc.fill);
    case 'bun': return F('M76 22 a24 20 0 1 1 48 0 a24 20 0 1 1 -48 0Z', hc.fill) + L('M84 16 q16 -12 32 0M86 26 q14 8 28 0', 2, hc.light)
      + F('M50 84 C48 44 74 30 100 30 C126 30 152 44 150 84Z', hc.fill);
    default: return '';
  }
}
/** 머리 꾸밈 (더듬이 · 별 핀 · 브릿지 · 리본) */
function hairDecor(v, base, hc) {
  if (!v || base === 'bald' && v === 3) return '';
  switch (v) {
    case 1: return `<path d="M100 36 q-8 -20 6 -26 q12 -4 6 10" fill="none" stroke="${INK}" stroke-width="7.5" stroke-linecap="round"/><path d="M100 36 q-8 -20 6 -26 q12 -4 6 10" fill="none" stroke="${hc.fill}" stroke-width="3.8" stroke-linecap="round"/>`;
    case 2: return F('M130 52 l3.4 7 7.6 1 -5.6 5.2 1.4 7.6 -6.8 -3.6 -6.8 3.6 1.4 -7.6 -5.6 -5.2 7.6 -1Z', '#f2cf4a', 2) + '<circle cx="130" cy="61" r="1.6" fill="#fff"/>';
    case 3: return `<path d="M70 44 Q80 58 72 74" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M70 44 Q80 58 72 74" fill="none" stroke="#ec5a9a" stroke-width="5.4" stroke-linecap="round"/>`;
    case 4: return F('M132 46 L116 36 L118 58Z', '#d8404a', 2.2) + F('M132 46 L150 38 L146 60Z', '#d8404a', 2.2) + F('M128 42 a5 5 0 1 1 8 8 a5 5 0 1 1 -8 -8Z', '#b02a34', 2);
    default: return '';
  }
}
function hairFront(style, hc) {
  const shine = L('M68 50 Q84 36 104 38', 4, hc.light, ' opacity=".85"');
  switch (style) {
    case 'short': return F('M52 90 C46 46 72 28 102 28 C134 28 156 48 148 90 C144 74 138 64 130 58 C124 68 110 72 98 66 C88 74 72 72 64 64 C58 72 54 80 52 90Z', hc.fill)
      + shine + L('M84 40 Q92 52 88 62M116 36 Q124 48 122 58', 2.2, hc.light);
    case 'spiky': return F('M52 92 L42 66 L58 66 L50 42 L72 50 L74 26 L92 42 L104 18 L114 42 L134 26 L132 50 L154 44 L146 66 L160 72 L148 92 C142 72 126 62 100 64 C76 62 60 72 52 92Z', hc.fill)
      + L('M66 60 L76 46M96 54 L104 32M124 52 L130 38', 2.2, hc.light);
    case 'long': case 'bob': return F('M52 94 C46 46 74 30 100 30 C130 30 156 46 148 94 C144 74 136 60 122 54 C110 66 88 70 70 60 C62 68 56 80 52 94Z', hc.fill)
      + shine + L('M112 40 Q108 54 96 62M128 46 Q132 60 140 72', 2.2, hc.light);
    case 'pony': return F('M53 86 C50 46 76 32 100 32 C126 32 150 46 147 86 C138 62 122 52 100 52 C80 52 62 62 53 86Z', hc.fill)
      + L('M70 52 Q86 40 100 42M112 42 Q128 46 138 58', 2.2, hc.light);
    case 'buzz': {
      let dots = '';
      for (let i = 0; i < 26; i++) {
        const a = Math.PI * (1.08 + (0.84 * ((i * 7) % 26)) / 26);
        const rr = 34 + ((i * 11) % 12);
        dots += `<circle cx="${(100 + rr * 1.25 * Math.cos(a)).toFixed(1)}" cy="${(80 + rr * Math.sin(a)).toFixed(1)}" r="1.1" fill="${INK}" opacity=".45"/>`;
      }
      return F('M55 80 C54 50 76 38 100 38 C124 38 146 50 145 80 C136 60 120 54 100 54 C80 54 64 60 55 80Z', hc.fill, 2.4, ' opacity=".92"') + dots;
    }
    case 'curly': return F(`${bumps(100, 82, 52, 48, 172, 368, 9, 12)} C140 66 120 58 100 60 C80 58 60 66 49 84Z`, hc.fill)
      + L('M70 50 q6 -6 12 0M96 40 q6 -6 12 0M122 50 q6 -6 12 0', 2.2, hc.light);
    case 'bald': return L('M76 52 Q90 44 106 46', 4, '#ffffff', ' opacity=".7"');
    case 'twin': return F('M52 94 C46 46 74 30 100 30 C130 30 156 46 148 94 C142 76 134 62 120 58 C110 68 90 68 76 58 C64 64 56 78 52 94Z', hc.fill)
      + shine + L('M100 34 L100 58', 2.2, hc.light);
    case 'bun': return F('M53 86 C50 46 76 32 100 32 C126 32 150 46 147 86 C138 62 122 52 100 52 C80 52 62 62 53 86Z', hc.fill)
      + L('M72 50 Q86 38 100 40M110 40 Q126 42 138 56', 2.2, hc.light);
    default: return '';
  }
}

/* ───────── 얼굴 ───────── */
const EL = [82, 92];
const ER = [118, 92];
function at([x, y], inner, mirror = false) {
  return `<g transform="translate(${x} ${y})${mirror ? ' scale(-1 1)' : ''}">${inner}</g>`;
}
const EYE_COL = [null, '#2f64b0', '#2f8a4a', '#b0302a', '#7a3ab0'];
function eyeNeutral(style, v = 0) {
  const col = EYE_COL[v] || INK;
  const iris = EYE_COL[v] || '#6a4226';
  const one = (m) => {
    switch (style) {
      case 'round': return at(m ? ER : EL, `${F('M-7.5 0 a7.5 8.5 0 1 1 15 0 a7.5 8.5 0 1 1 -15 0Z', '#fff', 2.4)}<circle cy="1.4" r="4.2" fill="${col}"/><circle cx="-1.4" cy="-.6" r="1.5" fill="#fff"/>`, m);
      case 'lashes': return at(m ? ER : EL, `<ellipse rx="6" ry="8" fill="${INK}"/><ellipse cy="1.4" rx="4.2" ry="5.6" fill="${iris}"/><circle cx="-2" cy="-3" r="2.2" fill="#fff"/>${L('M-8 -6 Q0 -12 8 -6M6 -7 l5 -4M8 -3 l5 -2', 2.6)}`, m);
      case 'cat': return at(m ? ER : EL, `${F('M-10 1 Q0 -10 10 1 Q0 8 -10 1Z', EYE_COL[v] ? mixC(EYE_COL[v], '#ffffff', 0.35) : '#c8d84a', 2.4)}<ellipse cy="0" rx="1.6" ry="6" fill="${INK}"/><circle cx="-3" cy="-2" r="1.3" fill="#fff"/>`, m);
      case 'star': return at(m ? ER : EL, `<ellipse rx="7" ry="9" fill="${col}"/><path d="M-2 -6 l1.3 3 3.2 .3 -2.4 2.1 .8 3.1 -2.9 -1.7 -2.9 1.7 .8 -3.1 -2.4 -2.1 3.2 -.3Z" fill="#fff"/><circle cx="2.6" cy="3.6" r="1.4" fill="#fff"/>`, m);
      case 'bags': return at(m ? ER : EL, `<ellipse cy="1" rx="4.4" ry="4.6" fill="${col}"/>${L('M-8 -2.6 L8 -2.6', 2.6)}${L('M-7 7 Q0 11 7 7', 1.6, '#8a5a6a', ' opacity=".7"')}`, m);
      case 'big': return at(m ? ER : EL, `<ellipse rx="7.5" ry="9.5" fill="${INK}"/><ellipse cy="1.5" rx="5.2" ry="6.5" fill="${iris}"/><circle cx="-2.4" cy="-3.4" r="2.6" fill="#fff"/><circle cx="2.2" cy="3" r="1.2" fill="#fff"/>${L('M-9 -7 Q0 -13 9 -7', 2.6)}`, m);
      case 'sharp': return at(m ? ER : EL, `${F('M-10 1 Q-1 -9 10 -3 Q3 6 -10 1Z', '#fff', 2.6)}<circle cx="1" cy="-1" r="3.6" fill="${INK}"/><circle cx="0" cy="-2.2" r="1.1" fill="#fff"/>`, m);
      case 'sleepy': return at(m ? ER : EL, `<path d="M-7 0 Q0 7 7 0Z" fill="${col}"/>${L('M-9 0 L9 0', 3)}`, m);
      case 'smile': return at(m ? ER : EL, L('M-7 3 Q0 -6 7 3', 3.4, col), m);
      default: return at(m ? ER : EL, `<ellipse rx="4.6" ry="6.2" fill="${col}"/><circle cx="-1.5" cy="-2.2" r="1.7" fill="#fff"/>`, m);
    }
  };
  return one(false) + one(true);
}
function mouthNeutral(style) {
  switch (style) {
    case 'grin': return F('M87 110 Q100 126 113 110Z', '#fff', 2.6) + L('M94 112 L94 118M100 112 L100 120M106 112 L106 118', 1.6);
    case 'flat': return L('M91 116 L109 116', 3);
    case 'cat': return L('M88 112 Q94 119 100 112 Q106 119 112 112', 2.8);
    case 'fang': return L('M89 112 Q100 122 111 112', 3) + F('M103 116 L105.5 122 L108 115Z', '#fff', 1.8);
    case 'open': return F('M94 116 a6 7 0 1 1 12 0 a6 7 0 1 1 -12 0Z', '#6a1e1a', 2.6) + T('M96 120 q4 -3 8 0 q-4 3 -8 0Z', '#e07a7a');
    case 'pout': return L('M96 110 q8 -2 5 4 q7 2 -1 7', 2.8);
    case 'smirk': return L('M88 116 Q102 120 113 108', 3) + L('M111 106 l4 3', 2);
    case 'teeth': return L('M88 112 Q100 120 112 112', 3) + F('M95 115 h5 v6 h-5Z', '#fff', 1.8) + F('M100 115 h5 v6 h-5Z', '#fff', 1.8);
    case 'wavy': return L('M86 115 q3.5 -5 7 0 t7 0 t7 0 t7 0', 2.8);
    default: return L('M89 112 Q100 122 111 112', 3);
  }
}
const browsN = L('M74 78 Q82 74 90 77M110 77 Q118 74 126 78', 2.6);

/** 입 꾸밈: 입술 색은 입 밑에, 점 · 주근깨는 위에 */
function lipsUnder(v) {
  if (v === 1 || v === 2) return T('M88 113 Q94 106 100 110 Q106 106 112 113 Q100 124 88 113Z', v === 1 ? '#d8404a' : '#ec8ab0', 0.9);
  return '';
}
function faceMarks(v) {
  if (v === 3) return '<circle cx="113" cy="123" r="1.7" fill="#2a1d14"/>';
  if (v === 4) return [[66, 100], [71, 104], [62, 105], [130, 100], [135, 104], [138, 99]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#9a5a3a" opacity=".75"/>`).join('');
  return '';
}
function face(av, expr) {
  const [eb, ev] = P.split(av.eyes);
  const [mb, mv] = P.split(av.mouth);
  let eyes = eyeNeutral(eb, ev);
  let mouth = mouthNeutral(mb);
  let brows = browsN;
  let extra = '';
  let blushOp = 0.45;
  switch (expr) {
    case 'happy':
      eyes = eyeNeutral('smile');
      mouth = F('M87 110 Q100 128 113 110 Q100 114 87 110Z', '#7a2a22', 2.6) + T('M93 118 Q100 124 107 118 Q100 116 93 118Z', '#e07a7a');
      break;
    case 'content':
      eyes = eyeNeutral('smile');
      mouth = L('M92 113 Q100 119 108 113', 2.8);
      blushOp = 0.7;
      break;
    case 'laugh':
      eyes = L('M75 85 L87 92 L75 99', 3.4) + L('M125 85 L113 92 L125 99', 3.4);
      mouth = F('M83 106 L117 106 Q117 132 100 132 Q83 132 83 106Z', '#6a1e1a', 2.8) + T('M89 124 Q100 116 111 124 Q106 131 100 131 Q94 131 89 124Z', '#e07a7a') + T('M85 107 L115 107 L114 112 L86 112Z', '#fff');
      brows = L('M72 76 Q82 70 90 74M110 74 Q118 70 128 76', 2.6);
      extra = '<g class="av-tears">' + F('M64 88 q-6 8 -2 12 q6 2 6 -6Z', '#8fd0f0', 1.8) + F('M136 88 q6 8 2 12 q-6 2 -6 -6Z', '#8fd0f0', 1.8) + '</g>';
      blushOp = 0.75;
      break;
    case 'smug':
      eyes = at(EL, `<path d="M-8 -1 Q0 7 8 -1Z" fill="${INK}"/>${L('M-10 -1 L9 -3', 3)}`) + at(ER, `<path d="M-8 -1 Q0 7 8 -1Z" fill="${INK}"/>${L('M-10 -3 L9 -1', 3)}`);
      brows = L('M73 74 Q82 70 91 76M109 72 Q118 64 128 70', 2.8);
      mouth = F('M86 110 Q102 126 117 106 Q104 116 86 110Z', '#6a1e1a', 2.6) + T('M92 113 L108 112 L106 115 L94 116Z', '#fff');
      break;
    case 'annoyed':
      eyes = at(EL, `<ellipse cy="2" rx="4.4" ry="4" fill="${INK}"/>${L('M-9 -2 L9 -2', 3)}`) + at(ER, `<ellipse cy="2" rx="4.4" ry="4" fill="${INK}"/>${L('M-9 -2 L9 -2', 3)}`);
      brows = L('M72 76 L90 81M110 81 L128 76', 3);
      mouth = L('M90 118 Q100 112 110 118', 3);
      extra = L('M124 50 q4 6 0 12M130 48 q-4 6 0 12M120 56 q6 -2 12 0M120 60 q6 2 14 0', 2.4, '#c8453a');
      blushOp = 0.2;
      break;
    case 'angry':
      eyes = at(EL, `${F('M-9 -2 L9 2 Q2 7 -8 4Z', '#fff', 2.4)}<circle cx="1" cy="2.4" r="2.6" fill="${INK}"/>`) + at(ER, `${F('M-9 -2 L9 2 Q2 7 -8 4Z', '#fff', 2.4)}<circle cx="1" cy="2.4" r="2.6" fill="${INK}"/>`, true);
      brows = L('M70 74 L92 84M108 84 L130 74', 3.8);
      mouth = F('M86 110 L114 110 L112 122 L88 122Z', '#fff', 2.6) + L('M86 116 L114 116M93 110 L93 122M100 110 L100 122M107 110 L107 122', 1.5);
      extra = T('M58 96 Q60 72 100 70 Q140 72 142 96 Q140 110 100 108 Q60 110 58 96Z', '#e04a3a', 0.18);
      blushOp = 0.8;
      break;
    case 'sad':
      eyes = at(EL, `<ellipse rx="6" ry="7.5" fill="${INK}"/><circle cx="-2" cy="-3" r="2.2" fill="#fff"/><circle cx="2" cy="2.5" r="1.2" fill="#fff"/>`) + at(ER, `<ellipse rx="6" ry="7.5" fill="${INK}"/><circle cx="-2" cy="-3" r="2.2" fill="#fff"/><circle cx="2" cy="2.5" r="1.2" fill="#fff"/>`);
      brows = L('M72 80 Q82 72 90 72M110 72 Q118 72 128 80', 2.8);
      mouth = L('M88 121 Q94 114 100 120 Q106 126 112 119', 2.8);
      extra = F('M78 100 q-3 8 0 10 q4 0 3 -6Z', '#8fd0f0', 1.6);
      break;
    case 'tongue':
      eyes = at(EL, L('M-8 1 Q0 -6 8 1', 3.4)) + at(ER, `<ellipse rx="5" ry="6.6" fill="${INK}"/><circle cx="-1.6" cy="-2.4" r="1.9" fill="#fff"/>`);
      mouth = L('M89 111 Q100 120 111 111', 3) + F('M95 115 Q94 131 102 131 Q110 131 107 115Z', '#ec8a9a', 2.4) + L('M101 119 L101 126', 1.4, '#b04a5a');
      brows = L('M74 80 Q82 76 90 80M110 74 Q118 68 126 72', 2.6);
      break;
    default:
  }
  const blush = `<ellipse cx="71" cy="106" rx="8" ry="4.4" fill="#f07a7a" opacity="${blushOp}"/><ellipse cx="129" cy="106" rx="8" ry="4.4" fill="#f07a7a" opacity="${blushOp}"/>`
    + L('M66 104 l3 -4M71 104 l3 -4M124 104 l3 -4M129 104 l3 -4', 1.3, '#c24a4a', ' opacity=".55"');
  const nose = L('M100 98 Q104 103 99 105', 2, INK, ' opacity=".55"');
  return blush + brows + eyes + nose + lipsUnder(mv) + mouth + faceMarks(mv) + extra;
}

/* ───────── 모자 · 장신구 ───────── */
const HAT_TINT = [null, { fill: '#c8453a', shade: '#8e2a22' }, { fill: '#34497a', shade: '#1f2d52' }, { fill: '#4d7a3c', shade: '#2f5024' }, { fill: '#e08aa8', shade: '#a85a78' }];
/** '없음' 의 꾸밈: 꽃 · 나비 핀 · 천사 고리 · 악마 뿔 */
function headDecor(v) {
  switch (v) {
    case 1: return [0, 72, 144, 216, 288].map((a) => `<ellipse cx="${(132 + 7 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(52 + 7 * Math.sin(a * Math.PI / 180)).toFixed(1)}" rx="5.4" ry="4" transform="rotate(${a} ${(132 + 7 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(52 + 7 * Math.sin(a * Math.PI / 180)).toFixed(1)})" fill="#f29ab8" stroke="${INK}" stroke-width="1.8"/>`).join('') + '<circle cx="132" cy="52" r="4" fill="#f2cf4a" stroke="#2a1d14" stroke-width="1.6"/>';
    case 2: return F('M72 56 Q56 40 60 60 Q64 70 72 60Z', '#6ab0e8', 2) + F('M72 56 Q88 40 84 60 Q80 70 72 60Z', '#6ab0e8', 2) + F('M72 60 Q62 72 66 76 Q72 72 72 62Z', '#3a80c8', 1.8) + F('M72 60 Q82 72 78 76 Q72 72 72 62Z', '#3a80c8', 1.8) + L('M72 52 L72 66', 2.4);
    case 3: return '<ellipse cx="100" cy="18" rx="32" ry="8" fill="none" stroke="#fff4b0" stroke-width="8" opacity=".55"/><ellipse cx="100" cy="18" rx="32" ry="8" fill="none" stroke="#e8b830" stroke-width="3.6"/>';
    case 4: return F('M70 50 Q56 30 62 16 Q70 30 80 42Z', '#c8302a', 2.4) + F('M130 50 Q144 30 138 16 Q130 30 120 42Z', '#c8302a', 2.4) + L('M64 26 l5 3M136 26 l-5 3', 1.4, '#fff', ' opacity=".6"');
    default: return '';
  }
}
function hat(id, cloth, v = 0, hc = null) {
  const tint = HAT_TINT[v];
  if (tint) cloth = tint;
  const c = (d) => (tint ? tint.fill : d);
  switch (id) {
    case 'beret': return F('M50 62 Q44 32 100 28 Q160 30 152 60 Q126 50 100 56 Q74 52 50 62Z', c('#c8453a')) + T('M120 34 Q150 40 150 58 Q140 52 128 52Z', '#000', 0.18) + F('M97 28 q3 -8 6 0Z', c('#c8453a'), 2) + L('M60 56 Q100 44 140 54', 1.4, '#000', ' opacity=".2"');
    case 'ears': { const f = tint ? tint.fill : (hc ? hc.fill : '#6b4128'); return F('M58 62 L62 22 L92 46Z', f, 2.8) + T('M64 54 L66 32 L84 46Z', '#f29ab8') + F('M142 62 L138 22 L108 46Z', f, 2.8) + T('M136 54 L134 32 L116 46Z', '#f29ab8'); }
    case 'cowboy': return F('M68 46 C64 16 80 6 100 14 C120 6 136 16 132 46Z', c('#8a5a32')) + T('M112 12 C124 12 132 22 132 46 L118 46 C120 30 118 20 112 12Z', '#000', 0.16)
      + F('M67 38 L133 38 L133 46 L67 46Z', '#3a2418', 2.4) + L('M100 16 Q98 24 100 32', 2)
      + F('M26 50 C44 34 156 34 174 50 C164 60 140 54 100 54 C60 54 36 60 26 50Z', tint ? tint.shade : '#9a6a3c') + L('M44 46 Q100 38 156 46', 1.8, '#5a3a20', ' opacity=".6"');
    case 'beanie': return F('M48 72 C46 30 72 14 100 14 C128 14 154 30 152 72Z', cloth.fill)
      + L('M72 22 L68 64M88 16 L86 64M104 15 L104 64M120 18 L122 64M136 26 L138 64', 1.8, cloth.shade)
      + F('M44 62 Q100 54 156 62 L156 80 Q100 72 44 80Z', cloth.shade) + F('M90 6 a10 10 0 1 1 20 0 a10 10 0 1 1 -20 0Z', '#efe2c2', 2.4);
    case 'crown': return F('M62 48 L58 12 L80 30 L100 4 L120 30 L142 12 L138 48Z', tint ? mixC(tint.fill, '#e8b830', 0.35) : '#e8b830') + T('M120 30 L142 12 L138 48 L122 48Z', '#a0741a', 0.45)
      + L('M62 40 L138 40', 2.2) + F('M95 30 a5 5 0 1 1 10 0 a5 5 0 1 1 -10 0Z', '#c8453a', 2) + F('M74 34 a3.4 3.4 0 1 1 6.8 0 a3.4 3.4 0 1 1 -6.8 0Z', '#3a7ac8', 1.8) + F('M119 34 a3.4 3.4 0 1 1 6.8 0 a3.4 3.4 0 1 1 -6.8 0Z', '#3a9a5a', 1.8)
      + '<circle cx="58" cy="12" r="3.4" fill="#fff4c0" stroke="#2a1d14" stroke-width="2"/><circle cx="100" cy="4" r="3.4" fill="#fff4c0" stroke="#2a1d14" stroke-width="2"/><circle cx="142" cy="12" r="3.4" fill="#fff4c0" stroke="#2a1d14" stroke-width="2"/>';
    case 'wizard': return F('M54 54 L100 -12 Q116 -26 132 -14 Q116 -14 110 -4 L148 54Z', c('#34497a')) + T('M110 -4 L148 54 L126 54Z', '#000', 0.2)
      + F('M86 22 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1Z', '#f2cf4a', 1.6) + F('M114 38 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1Z', '#f2cf4a', 1.4)
      + F('M30 54 Q100 36 170 54 Q100 70 30 54Z', tint ? tint.shade : '#3e5690');
    case 'band': return F('M52 66 Q100 48 148 66 L148 78 Q100 60 52 78Z', cloth.fill) + F('M144 66 L168 56 L164 76Z', cloth.fill, 2.4) + F('M144 72 L162 88 L150 90Z', cloth.shade, 2.4)
      + L('M60 70 Q100 56 140 70', 1.6, '#fff', ' opacity=".5"');
    case 'top': return F('M68 46 L70 -8 Q100 -16 130 -8 L132 46Z', tint ? tint.shade : '#2a2724') + T('M116 -12 Q126 -10 130 -8 L132 46 L118 46Z', '#fff', 0.1)
      + F('M69 30 L131 30 L131 42 L69 42Z', '#8e2a22', 2.4) + F('M48 46 Q100 34 152 46 Q100 58 48 46Z', '#34302c');
    case 'cap': return F('M50 70 C48 30 74 18 100 18 C126 18 152 30 150 70Z', cloth.fill) + T('M120 22 C140 30 152 44 150 70 L132 70 C134 46 128 32 120 22Z', '#000', 0.16)
      + L('M100 18 L100 68', 1.8, cloth.shade) + F('M118 62 Q162 54 176 70 Q150 76 116 72Z', cloth.shade) + F('M95 18 a5 4 0 1 1 10 0Z', cloth.shade, 2);
    default: return '';
  }
}
const ACC_TINT = [null, '#c8453a', '#3a6ac8', '#d8a830', '#e87aa0'];
/** '없음' 의 꾸밈: 하트 · 별 스티커 · 눈물점 · 흉터 */
function faceDecor(v) {
  switch (v) {
    case 1: return F('M126 101 c-3 -5 -10 -2 -7 4 l7 7 7 -7 c3 -6 -4 -9 -7 -4Z', '#ec5a8a', 1.8);
    case 2: return F('M74 98 l2.4 5 5.4 .7 -4 3.7 1 5.4 -4.8 -2.6 -4.8 2.6 1 -5.4 -4 -3.7 5.4 -.7Z', '#f2cf4a', 1.8);
    case 3: return '<circle cx="124" cy="101" r="1.8" fill="#2a1d14"/>';
    case 4: return L('M116 98 L134 114', 2.6, '#a0503a') + L('M120 99 l-3 4M125 104 l-3 4M130 109 l-3 4', 1.6, '#a0503a');
    default: return '';
  }
}
function accessory(id, hc, v = 0) {
  const tint = ACC_TINT[v];
  const k = (d) => tint || d;
  switch (id) {
    case 'monocle': return `<circle cx="118" cy="92" r="11" fill="#bfe4ff" fill-opacity=".2" stroke="${k('#d8a830')}" stroke-width="3"/>` + L('M128 98 Q142 118 132 140', 1.6, k('#d8a830'));
    case 'mask': return F('M70 102 Q100 96 130 102 L127 124 Q100 138 73 124Z', k('#f4f4f0'), 2.6) + L('M76 110 Q100 106 124 110M76 118 Q100 114 124 118', 1.4, '#000', ' opacity=".2"') + L('M70 104 L56 94M130 104 L144 94', 1.8);
    case 'beard': return F('M56 96 Q56 142 100 146 Q144 142 144 96 Q138 118 124 124 Q112 118 100 122 Q88 118 76 124 Q62 118 56 96Z', tint || hc.fill, 2.6) + L('M72 128 l2 6M86 134 l1 6M100 136 l0 6M114 134 l-1 6M128 128 l-2 6', 1.4, hc.light);
    case 'earring': return `<circle cx="54" cy="110" r="4.2" fill="none" stroke="${INK}" stroke-width="4.4"/><circle cx="54" cy="110" r="4.2" fill="none" stroke="${k('#e8b830')}" stroke-width="2.2"/><circle cx="146" cy="110" r="4.2" fill="none" stroke="${INK}" stroke-width="4.4"/><circle cx="146" cy="110" r="4.2" fill="none" stroke="${k('#e8b830')}" stroke-width="2.2"/>`;
    case 'glasses': return `<circle cx="82" cy="92" r="12" fill="#bfe4ff" fill-opacity=".18" stroke="${k(INK)}" stroke-width="2.6"/><circle cx="118" cy="92" r="12" fill="#bfe4ff" fill-opacity=".18" stroke="${k(INK)}" stroke-width="2.6"/>`
      + L('M94 91 Q100 86 106 91M70 90 L56 86M130 90 L144 86', 2.4, k(INK)) + L('M76 86 l5 -3M112 86 l5 -3', 1.6, '#fff');
    case 'shades': return F('M66 84 L96 84 Q96 102 82 102 Q66 102 66 84Z', tint ? mixC(tint, '#000000', 0.35) : '#1c1a22', 2.6) + F('M104 84 L134 84 Q134 102 118 102 Q104 102 104 84Z', tint ? mixC(tint, '#000000', 0.35) : '#1c1a22', 2.6)
      + L('M96 86 Q100 83 104 86M66 85 L54 82M134 85 L146 82', 2.4) + L('M72 88 l6 6M110 88 l6 6', 2, '#fff', ' opacity=".7"');
    case 'patch': return L('M54 70 Q100 56 146 84', 2.4) + F('M106 84 Q118 80 130 86 Q130 102 118 102 Q106 100 106 84Z', k('#1c1a22'), 2.4);
    case 'mustache': return F('M82 108 Q90 98 100 105 Q110 98 118 108 Q124 112 128 106 Q124 118 112 112 Q106 110 100 108 Q94 110 88 112 Q76 118 72 106 Q76 112 82 108Z', tint || hc.fill, 2.2);
    case 'bandaid': return `<g transform="rotate(-28 126 104)">${F('M114 99 h24 a4 4 0 0 1 0 10 h-24 a4 4 0 0 1 0 -10Z', tint ? mixC(tint, '#ffffff', 0.45) : '#f0c8a0', 2)}${T('M122 100 h8 v8 h-8Z', '#e0a878')}<circle cx="124" cy="102" r=".9" fill="${INK}"/><circle cx="128" cy="106" r=".9" fill="${INK}"/></g>`;
    default: return '';
  }
}

/* ───────── 몸 ───────── */
const PANTS = { tee: '#4a5670', hoodie: '#3e4a60', suit: null, vest: '#5a4630', cloak: '#3a3430', apron: '#6a5a44', dress: '#f4ecde', overalls: null, hanbok: '#efe2c2', knight: '#8a8e96' };
const TORSO = 'M74 144 C64 152 62 180 66 204 L134 204 C138 180 136 152 126 144 C116 140 84 140 74 144Z';
function torso(av, cloth) {
  const shade = T('M120 146 C132 156 134 184 132 204 L118 204 C124 184 124 162 120 146Z', '#000', 0.16)
    + L('M76 170 l6 -6M76 180 l8 -8M78 190 l8 -8', 1.3, '#000', ' opacity=".18"');
  const cream = '#efe2c2';
  switch (av.outfit) {
    case 'hoodie': return F(TORSO, cloth.fill) + shade + F('M78 146 Q100 168 122 146 Q116 138 100 140 Q84 138 78 146Z', cloth.shade, 2.6)
      + L('M94 154 L92 174M106 154 L108 174', 2) + '<circle cx="92" cy="176" r="2" fill="#efe2c2"/><circle cx="108" cy="176" r="2" fill="#efe2c2"/>'
      + F('M80 182 L120 182 L116 200 L84 200Z', cloth.fill, 2.2);
    case 'suit': return F(TORSO, cloth.fill) + shade + F('M88 143 L100 178 L112 143Z', '#f6f1e6', 2.4)
      + F('M97 150 L103 150 L106 172 L100 180 L94 172Z', '#8e2a22', 2) + F('M86 143 L98 176 L80 158Z', cloth.shade, 2.2) + F('M114 143 L102 176 L120 158Z', cloth.shade, 2.2)
      + '<circle cx="100" cy="188" r="2.2" fill="#2a1d14"/><circle cx="100" cy="197" r="2.2" fill="#2a1d14"/>';
    case 'vest': return F(TORSO, cream) + L('M100 146 L100 204', 1.6, '#b8a478')
      + F('M74 144 C64 152 62 180 66 204 L94 204 L92 162 L86 143Z', cloth.fill) + F('M126 144 C136 152 138 180 134 204 L106 204 L108 162 L114 143Z', cloth.fill)
      + T('M122 150 C132 160 134 184 132 204 L120 204 C124 184 124 164 122 150Z', '#000', 0.18)
      + F('M78 166 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1Z', '#f2cf4a', 1.6) + L('M90 143 Q100 152 110 143', 2);
    case 'cloak': return F(TORSO, '#44403c') + shade + F('M66 146 Q100 132 134 146 L140 166 Q100 176 60 166Z', cloth.fill) + L('M76 158 l-2 8M90 162 l-1 8M110 162 l1 8M124 158 l2 8', 1.4, cloth.shade)
      + F('M94 146 a6 6 0 1 1 12 0 a6 6 0 1 1 -12 0Z', '#e8b830', 2.2);
    case 'apron': return F(TORSO, cream) + shade + F('M84 146 L116 146 L118 164 L82 164Z', cloth.fill, 2.4) + F('M80 162 L120 162 L128 204 L72 204Z', cloth.fill)
      + L('M84 146 L78 140M116 146 L122 140', 2) + F('M88 176 L112 176 L110 192 L90 192Z', cloth.shade, 2) + L('M90 143 Q100 150 110 143', 2);
    case 'dress': return F('M74 144 C66 152 66 168 72 176 L128 176 C134 168 134 152 126 144 C116 140 84 140 74 144Z', cloth.fill)
      + F('M72 172 L128 172 L150 228 Q100 240 50 228Z', cloth.fill) + T('M118 174 L128 172 L150 228 Q140 232 132 233Z', '#000', 0.16)
      + L('M86 180 Q82 206 74 230M100 180 L100 236M114 180 Q118 206 126 232', 1.6, cloth.shade)
      + F('M52 226 Q100 238 148 226 L150 232 Q100 244 50 232Z', '#fffaf0', 2.2) + F('M70 170 Q100 180 130 170 L130 178 Q100 188 70 178Z', '#fffaf0', 2.2)
      + F('M92 172 q8 -8 8 2 q0 -10 8 -2 q-8 8 -8 2 q0 6 -8 -2Z', '#fffaf0', 1.8) + L('M88 143 Q100 152 112 143', 2.4);
    case 'overalls': return F(TORSO, '#efe2c2') + F('M80 160 L120 160 L124 204 L76 204Z', cloth.fill) + F('M86 144 L92 144 L92 162 L86 162Z', cloth.fill, 2) + F('M108 144 L114 144 L114 162 L108 162Z', cloth.fill, 2)
      + '<circle cx="89" cy="164" r="2.6" fill="#e8b830" stroke="#2a1d14" stroke-width="1.4"/><circle cx="111" cy="164" r="2.6" fill="#e8b830" stroke="#2a1d14" stroke-width="1.4"/>'
      + F('M90 174 L110 174 L110 188 L90 188Z', cloth.fill, 2) + T('M116 162 L120 160 L124 204 L116 204Z', '#000', 0.16) + L('M90 143 Q100 150 110 143', 2);
    case 'hanbok': return F(TORSO, cloth.fill) + shade + F('M84 142 L99 170 L105 166 L92 142Z', '#fffaf0', 2.2) + L('M114 143 L100 168', 5, '#fffaf0')
      + F('M100 162 L92 198 L99 198 L104 164Z', '#c8453a', 2) + F('M104 162 L112 194 L118 191 L106 161Z', '#c8453a', 2) + L('M68 196 L132 196', 3, '#fffaf0');
    case 'knight': return F(TORSO, '#b8bcc4') + T('M120 146 C132 156 134 184 132 204 L118 204 C124 184 124 162 120 146Z', '#000', 0.2)
      + L('M70 172 Q100 180 130 172M68 188 Q100 196 132 188', 2, '#6a6e76') + L('M80 150 l4 6M116 150 l-4 6', 1.6, '#fff', ' opacity=".6"')
      + F('M90 152 L110 152 L110 168 Q100 180 90 168Z', cloth.fill, 2.2) + L('M100 154 L100 174M92 160 L108 160', 2.2, '#f2cf4a');
    default: return F(TORSO, cloth.fill) + shade + L('M88 143 Q100 156 112 143', 2.6) + L('M84 156 Q90 162 86 170', 1.4, '#000', ' opacity=".2"');
  }
}
function sleeveColor(av, cloth) {
  if (av.outfit === 'vest' || av.outfit === 'apron' || av.outfit === 'overalls') return { fill: '#efe2c2', shade: '#cdbb92' };
  if (av.outfit === 'cloak') return { fill: '#44403c', shade: '#2a2724' };
  if (av.outfit === 'knight') return { fill: '#b8bcc4', shade: '#8a8e96' };
  return cloth;
}
function hand(x, y, kind, skin, side) {
  const s = side === 'L' ? -1 : 1;
  let extra = '';
  if (kind === 'point') extra = `<path d="M${x} ${y + 4} L${x - s} ${y + 17}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${x} ${y + 4} L${x - s} ${y + 17}" stroke="${skin.fill}" stroke-width="4.4" stroke-linecap="round"/>`;
  if (kind === 'thumb') extra = `<path d="M${x - 6 * s} ${y + 2} L${x - 8 * s} ${y + 14}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${x - 6 * s} ${y + 2} L${x - 8 * s} ${y + 14}" stroke="${skin.fill}" stroke-width="4.4" stroke-linecap="round"/>`;
  const fist = kind === 'fist' ? L(`M${x - 5} ${y - 1} q5 3 10 0M${x - 5} ${y + 3} q5 3 10 0`, 1.4) : L(`M${x - 4 * s} ${y + 1} q${3 * s} 4 ${7 * s} 2`, 1.4);
  return extra + `<circle cx="${x}" cy="${y}" r="9" fill="${skin.fill}" stroke="${INK}" stroke-width="2.8"/>` + fist;
}
function arms(av, skin, cloth, emote) {
  const sc = sleeveColor(av, cloth);
  const kindR = { mock: 'point', hurry: 'point', nice: 'thumb', angry: 'fist' }[emote] || '';
  const kindL = { angry: 'fist' }[emote] || '';
  const watch = emote === 'hurry' ? F('M61 180 L79 182 L78 190 L60 188Z', '#3a2418', 2) + F('M65 185 a4.5 4.5 0 1 1 9 0 a4.5 4.5 0 1 1 -9 0Z', '#f2d68a', 1.8) : '';
  const armL = `<g class="av-armL">${F('M68 148 Q60 170 63 186 L79 188 Q80 168 86 150Z', sc.fill)}${T('M78 152 Q76 170 78 186 L73 187 Q71 168 74 152Z', '#000', 0.14)}${hand(71, 193, kindL, skin, 'L')}${watch}</g>`;
  const armR = `<g class="av-armR">${F('M132 148 Q140 170 137 186 L121 188 Q120 168 114 150Z', sc.fill)}${T('M132 150 Q138 170 136 185 L130 186 Q132 168 128 150Z', '#000', 0.16)}${hand(129, 193, kindR, skin, 'R')}</g>`;
  return { armL, armR };
}
function legs(av, cloth) {
  const pants = av.outfit === 'overalls' ? cloth.fill : PANTS[av.outfit] || cloth.shade;
  const shoe = '#3a2418';
  return `<g class="av-legL">${F('M78 200 L80 232 L96 232 L98 200Z', pants)}${F('M76 232 Q74 245 88 245 L100 245 Q101 235 96 232Z', shoe, 2.6)}</g>`
    + `<g class="av-legR">${F('M102 200 L104 232 L120 232 L122 200Z', pants)}${T('M114 202 L116 232 L120 232 L122 202Z', '#000', 0.18)}${F('M104 232 Q99 235 100 245 L112 245 Q126 245 124 232Z', shoe, 2.6)}</g>`;
}

/* ───────── 이모트 효과 (말 대신 그림으로) ───────── */
function fx(emote) {
  switch (emote) {
    case 'hurry': return `<g class="av-fx-tap">${L('M128 250 l8 -4M130 256 l10 0M128 262 l8 4', 2.6)}</g>`;
    case 'lol': case 'mock': return `<g class="av-fx-shake">${L('M34 70 q-8 10 0 20M24 64 q-10 16 0 32M166 70 q8 10 0 20M176 64 q10 16 0 32', 2.4)}</g>`;
    case 'nice': return `<g class="av-fx-spark">${F('M160 20 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4Z', '#f2cf4a', 2)}${F('M40 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z', '#f2cf4a', 1.8)}</g>`;
    case 'close': return `<g class="av-fx-sweat">${F('M150 50 q-8 12 -4 18 q8 4 10 -4 q0 -6 -6 -14Z', '#8fd0f0', 2)}</g>`;
    case 'angry': return `<g class="av-fx-steam">${F('M44 30 a10 10 0 0 1 16 -8 a12 12 0 0 1 20 6 a9 9 0 0 1 -4 16 h-26 a8 8 0 0 1 -6 -14Z', '#f4f0e8', 2.2)}${F('M126 22 a10 10 0 0 1 16 -8 a12 12 0 0 1 20 6 a9 9 0 0 1 -4 16 h-26 a8 8 0 0 1 -6 -14Z', '#f4f0e8', 2.2)}</g>`;
    case 'tease': return `<g class="av-fx-notes">${F('M30 60 v-24 l16 -4 v22', 'none', 2.4)}<ellipse cx="26" cy="61" rx="5" ry="4" fill="${INK}"/><ellipse cx="42" cy="55" rx="5" ry="4" fill="${INK}"/>${F('M162 44 v-20', 'none', 2.4)}<ellipse cx="158" cy="45" rx="5" ry="4" fill="${INK}"/>${L('M162 24 q8 2 8 10', 2.4)}</g>`;
    default: return '';
  }
}

/** 옷 무늬 (줄 · 물방울 · 체크 · 별) */
function patternDef(id, v) {
  switch (v) {
    case 1: return `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="3.2" fill="#fff" opacity=".38"/></pattern>`;
    case 2: return `<pattern id="${id}" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#fff" opacity=".5"/><circle cx="8.5" cy="8.5" r="2.2" fill="#fff" opacity=".5"/></pattern>`;
    case 3: return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#000" opacity=".16"/><rect x="7" y="7" width="7" height="7" fill="#000" opacity=".16"/><rect x="7" width="7" height="7" fill="#fff" opacity=".12"/></pattern>`;
    case 4: return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M8 3 l1.4 3 3.2 .4 -2.4 2.2 .7 3.2 -2.9 -1.6 -2.9 1.6 .7 -3.2 -2.4 -2.2 3.2 -.4Z" fill="#fff" opacity=".6"/></pattern>`;
    default: return '';
  }
}
/** 배경 그림 (줄무늬 · 물방울 · 체크 · 별 · 물결) */
export function bgArt(bg) {
  const ink = bg.ink;
  let art = '';
  switch (bg.pattern) {
    case 'dots':
      for (let y = -30; y < 280; y += 22) for (let x = -10; x < 220; x += 22) art += `<circle cx="${x + ((y / 22) % 2 ? 11 : 0)}" cy="${y}" r="4" fill="${ink}"/>`;
      break;
    case 'check':
      for (let y = -40; y < 280; y += 24) for (let x = -20; x < 220; x += 24) if (((x + y) / 24) % 2 === 0) art += `<rect x="${x}" y="${y}" width="24" height="24" fill="${ink}"/>`;
      break;
    case 'stars':
      for (let i = 0; i < 26; i++) {
        const x = (i * 53) % 220 - 10;
        const y = ((i * 97) % 300) - 30;
        art += `<path transform="translate(${x} ${y}) scale(${0.7 + (i % 3) * 0.3})" d="M0 -8 l2.4 5.2 5.6 .6 -4.2 3.8 1.2 5.6 -5 -2.8 -5 2.8 1.2 -5.6 -4.2 -3.8 5.6 -.6Z" fill="${ink}"/>`;
      }
      break;
    case 'waves':
      for (let y = -30; y < 280; y += 18) art += `<path d="M-20 ${y} q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="${ink}" stroke-width="2.4"/>`;
      break;
    default:
      art = `<g stroke="${ink}" stroke-width="1.6" fill="none">${Array.from({ length: 14 }, (_, i) => `<path d="M${-30 + i * 20} 270 l70 -70"/>`).join('')}</g>`;
  }
  return `<rect x="-20" y="-40" width="240" height="320" fill="${bg.fill}"/><g opacity=".32">${art}</g>`;
}
export function bgSvg(id) {
  const bg = find(P.bg, id);
  return `<svg class="av-bg" viewBox="0 -30 200 290" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${bgArt(bg)}</svg>`;
}

/**
 * 캐릭터 SVG 문자열
 * @param {object} av 캐릭터 부위
 * @param {object} o  { expr, emote, crop: 'head'|'full', bg: bool, cls }
 */
export function avatarSvg(av, o = {}) {
  av = P.clean(av);
  const uid = `av${++uidSeq}${Math.random().toString(36).slice(2, 6)}`;
  const skin = find(P.skin, av.skin);
  const hc = find(P.hairColor, av.hairColor);
  const cloth = find(P.cloth, av.cloth);
  const bg = find(P.bg, av.bg);
  const emote = o.emote || '';
  const expr = o.expr || (emote ? (P.EMOTES.find((e) => e.id === emote) || {}).expr : '') || 'neutral';
  const [hb, hv] = P.split(av.hair);
  const [ob, ov] = P.split(av.outfit);
  const [tb, tv] = P.split(av.hat);
  const [ab, avv] = P.split(av.acc);
  const body = { ...av, outfit: ob };
  const pat = ov ? `${uid}p` : '';
  const { armL, armR } = arms(body, skin, cloth, emote);
  const head = `<g class="av-hm av-head">${F('M56 84 C44 80 42 102 56 104Z', skin.fill, 2.6)}${F('M144 84 C156 80 158 102 144 104Z', skin.fill, 2.6)}`
    + F('M54 88 C54 52 76 40 100 40 C124 40 146 52 146 88 C146 118 126 136 100 136 C74 136 54 118 54 88Z', skin.fill)
    + T('M134 64 C146 84 144 116 122 131 C134 114 138 92 134 64Z', skin.shade, 0.9)
    + face(av, expr) + hairFront(hb, hc) + hairDecor(hv, hb, hc)
    + (ab === 'none' ? faceDecor(avv) : accessory(ab, hc, avv))
    + (tb === 'none' ? headDecor(tv) : hat(tb, cloth, tv, hc)) + '</g>';
  const vb = o.crop === 'head' ? '36 -20 128 162' : '0 -30 200 290';
  const back = o.bg ? bgArt(bg) : '';
  const shadow = o.crop === 'head' ? '' : `<ellipse class="av-shadow" cx="100" cy="247" rx="40" ry="6" fill="#000" opacity=".2"/>`;
  return `<svg class="av ${o.crop === 'head' ? 'av-crop' : ''} ${emote ? `emo-${emote}` : ''} ${o.cls || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>${pat ? patternDef(pat, ov) : ''}<filter id="${uid}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="${(uidSeq * 7) % 97}"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs>
${back}${shadow}<g ${o.flat ? '' : `filter="url(#${uid})"`}><g class="av-all">${legs(body, cloth)}<g class="av-upper">`
    + `<g class="av-hm">${ob === 'cloak' ? F('M72 142 L38 214 Q100 228 162 214 L128 142Z', cloth.shade) : ''}${hairBack(hb, hc)}</g>`
    + torso(body, cloth) + (pat ? `<path d="${ob === 'dress' ? 'M74 144 C66 152 66 168 72 176 L72 172 L50 228 Q100 240 150 228 L128 172 L128 176 C134 168 134 152 126 144 C116 140 84 140 74 144Z' : TORSO}" fill="url(#${pat})"/>` : '') + F('M90 128 L90 146 L110 146 L110 128Z', skin.shade, 2.4) + head + armL + armR
    + `</g></g>${fx(emote)}</g></svg>`;
}

export const EMOTES = P.EMOTES;

/* ───── 방 사람 얼굴 (로그인한 사람은 꾸민 캐릭터, 손님 · AI 는 아이디마다 정해진 캐릭터) */
const faceCache = new Map();
export function memberAvatar(m) {
  return (m && m.avatar) || P.fromSeed((m && m.pid) || 'guest');
}
export function memberFace(m) {
  const av = memberAvatar(m);
  const key = JSON.stringify(av);
  if (!faceCache.has(key)) faceCache.set(key, avatarSvg(av, { crop: 'head', bg: true }));
  return faceCache.get(key);
}
/** 둥근 얼굴 칩 */
export function faceChip(m, size = 56, cls = '') {
  return `<span class="av-face ${cls}" style="width:${size}px;height:${size}px">${memberFace(m)}</span>`;
}
