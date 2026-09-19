/* 프로필 캐릭터 그리기 (손그림 느낌의 작은 사람)
   부위마다 따로 묶어 두어서 이모트 때 팔 · 다리 · 머리가 각자 움직인다.
   옷 · 모자 · 장신구 모양은 avatar-items.js, 색은 따로 고른다. */
import './avatar-parts.js';
import { INK, F, L, T, TORSO, hairBack, hairFront, brow, nose, OUTFITS, HATS, ACCS } from './avatar-items.js';

const P = self.AVATAR_PARTS;
export { P as PARTS };

const find = (list, id) => list.find((o) => o.id === id) || list[0];
let uidSeq = 0;

/* ───────── 눈 ───────── */
const EL = [82, 92];
const ER = [118, 92];
function at([x, y], inner, mirror = false) {
  return `<g transform="translate(${x} ${y})${mirror ? ' scale(-1 1)' : ''}">${inner}</g>`;
}
function eyes(style, col) {
  const iris = col === INK ? '#6a4226' : col;
  const one = (m) => {
    switch (style) {
      case 'big': return at(m ? ER : EL, `<ellipse rx="7.5" ry="9.5" fill="${INK}"/><ellipse cy="1.5" rx="5.2" ry="6.5" fill="${iris}"/><circle cx="-2.4" cy="-3.4" r="2.6" fill="#fff"/><circle cx="2.2" cy="3" r="1.2" fill="#fff"/>${L('M-9 -7 Q0 -13 9 -7', 2.6)}`, m);
      case 'sharp': return at(m ? ER : EL, `${F('M-10 1 Q-1 -9 10 -3 Q3 6 -10 1Z', '#fff', 2.6)}<circle cx="1" cy="-1" r="3.6" fill="${col}"/><circle cx="0" cy="-2.2" r="1.1" fill="#fff"/>`, m);
      case 'sleepy': return at(m ? ER : EL, `<path d="M-7 0 Q0 7 7 0Z" fill="${col}"/>${L('M-9 0 L9 0', 3)}`, m);
      case 'smile': return at(m ? ER : EL, L('M-7 3 Q0 -6 7 3', 3.4, col), m);
      case 'round': return at(m ? ER : EL, `${F('M-7.5 0 a7.5 8.5 0 1 1 15 0 a7.5 8.5 0 1 1 -15 0Z', '#fff', 2.4)}<circle cy="1.4" r="4.2" fill="${col}"/><circle cx="-1.4" cy="-.6" r="1.5" fill="#fff"/>`, m);
      case 'lashes': return at(m ? ER : EL, `<ellipse rx="6" ry="8" fill="${INK}"/><ellipse cy="1.4" rx="4.2" ry="5.6" fill="${iris}"/><circle cx="-2" cy="-3" r="2.2" fill="#fff"/>${L('M-8 -6 Q0 -12 8 -6M6 -7 l5 -4M8 -3 l5 -2', 2.6)}`, m);
      case 'cat': return at(m ? ER : EL, `${F('M-10 1 Q0 -10 10 1 Q0 8 -10 1Z', col === INK ? '#c8d84a' : P.mix(col, '#ffffff', 0.35), 2.4)}<ellipse rx="1.6" ry="6" fill="${INK}"/><circle cx="-3" cy="-2" r="1.3" fill="#fff"/>`, m);
      case 'star': return at(m ? ER : EL, `<ellipse rx="7" ry="9" fill="${col}"/><path d="M-2 -6 l1.3 3 3.2 .3 -2.4 2.1 .8 3.1 -2.9 -1.7 -2.9 1.7 .8 -3.1 -2.4 -2.1 3.2 -.3Z" fill="#fff"/><circle cx="2.6" cy="3.6" r="1.4" fill="#fff"/>`, m);
      case 'bags': return at(m ? ER : EL, `<ellipse cy="1" rx="4.4" ry="4.6" fill="${col}"/>${L('M-8 -2.6 L8 -2.6', 2.6)}${L('M-7 7 Q0 11 7 7', 1.6, '#8a5a6a', ' opacity=".7"')}`, m);
      default: return at(m ? ER : EL, `<ellipse rx="4.6" ry="6.2" fill="${col}"/><circle cx="-1.5" cy="-2.2" r="1.7" fill="#fff"/>`, m);
    }
  };
  return one(false) + one(true);
}
/* ───────── 입 ───────── */
function mouthOf(style) {
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

/** 얼굴 (표정이 있으면 눈 · 입 · 눈썹을 표정으로 바꾼다) */
function face(av, expr, skin) {
  const E = find(P.eyes, av.eyes);
  const M = find(P.mouth, av.mouth);
  const col = find(P.eyeColor, av.eyeColor).fill;
  let ey = eyes(E.shape, col);
  let mouth = mouthOf(M.shape);
  let brows = brow(E.brow);
  let extra = '';
  let blushOp = 0.45;
  switch (expr) {
    case 'happy':
      ey = eyes('smile', col);
      mouth = F('M87 110 Q100 128 113 110 Q100 114 87 110Z', '#7a2a22', 2.6) + T('M93 118 Q100 124 107 118 Q100 116 93 118Z', '#e07a7a');
      break;
    case 'content':
      ey = eyes('smile', col);
      mouth = L('M92 113 Q100 119 108 113', 2.8);
      blushOp = 0.7;
      break;
    case 'laugh':
      ey = L('M75 85 L87 92 L75 99', 3.4) + L('M125 85 L113 92 L125 99', 3.4);
      mouth = F('M83 106 L117 106 Q117 132 100 132 Q83 132 83 106Z', '#6a1e1a', 2.8) + T('M89 124 Q100 116 111 124 Q106 131 100 131 Q94 131 89 124Z', '#e07a7a') + T('M85 107 L115 107 L114 112 L86 112Z', '#fff');
      brows = L('M72 76 Q82 70 90 74M110 74 Q118 70 128 76', 2.6);
      extra = `<g class="av-tears">${F('M64 88 q-6 8 -2 12 q6 2 6 -6Z', '#8fd0f0', 1.8)}${F('M136 88 q6 8 2 12 q-6 2 -6 -6Z', '#8fd0f0', 1.8)}</g>`;
      blushOp = 0.75;
      break;
    case 'smug':
      ey = at(EL, `<path d="M-8 -1 Q0 7 8 -1Z" fill="${col}"/>${L('M-10 -1 L9 -3', 3)}`) + at(ER, `<path d="M-8 -1 Q0 7 8 -1Z" fill="${col}"/>${L('M-10 -3 L9 -1', 3)}`);
      brows = L('M73 74 Q82 70 91 76M109 72 Q118 64 128 70', 2.8);
      mouth = F('M86 110 Q102 126 117 106 Q104 116 86 110Z', '#6a1e1a', 2.6) + T('M92 113 L108 112 L106 115 L94 116Z', '#fff');
      break;
    case 'annoyed':
      ey = at(EL, `<ellipse cy="2" rx="4.4" ry="4" fill="${col}"/>${L('M-9 -2 L9 -2', 3)}`) + at(ER, `<ellipse cy="2" rx="4.4" ry="4" fill="${col}"/>${L('M-9 -2 L9 -2', 3)}`);
      brows = L('M72 76 L90 81M110 81 L128 76', 3);
      mouth = L('M90 118 Q100 112 110 118', 3);
      extra = L('M124 50 q4 6 0 12M130 48 q-4 6 0 12M120 56 q6 -2 12 0M120 60 q6 2 14 0', 2.4, '#c8453a');
      blushOp = 0.2;
      break;
    case 'angry':
      ey = at(EL, `${F('M-9 -2 L9 2 Q2 7 -8 4Z', '#fff', 2.4)}<circle cx="1" cy="2.4" r="2.6" fill="${col}"/>`) + at(ER, `${F('M-9 -2 L9 2 Q2 7 -8 4Z', '#fff', 2.4)}<circle cx="1" cy="2.4" r="2.6" fill="${col}"/>`, true);
      brows = L('M70 74 L92 84M108 84 L130 74', 3.8);
      mouth = F('M86 110 L114 110 L112 122 L88 122Z', '#fff', 2.6) + L('M86 116 L114 116M93 110 L93 122M100 110 L100 122M107 110 L107 122', 1.5);
      extra = T('M58 96 Q60 72 100 70 Q140 72 142 96 Q140 110 100 108 Q60 110 58 96Z', '#e04a3a', 0.18);
      blushOp = 0.8;
      break;
    case 'sad':
      ey = at(EL, `<ellipse rx="6" ry="7.5" fill="${col}"/><circle cx="-2" cy="-3" r="2.2" fill="#fff"/><circle cx="2" cy="2.5" r="1.2" fill="#fff"/>`) + at(ER, `<ellipse rx="6" ry="7.5" fill="${col}"/><circle cx="-2" cy="-3" r="2.2" fill="#fff"/><circle cx="2" cy="2.5" r="1.2" fill="#fff"/>`);
      brows = L('M72 80 Q82 72 90 72M110 72 Q118 72 128 80', 2.8);
      mouth = L('M88 121 Q94 114 100 120 Q106 126 112 119', 2.8);
      extra = F('M78 100 q-3 8 0 10 q4 0 3 -6Z', '#8fd0f0', 1.6);
      break;
    case 'tongue':
      ey = at(EL, L('M-8 1 Q0 -6 8 1', 3.4)) + at(ER, `<ellipse rx="5" ry="6.6" fill="${col}"/><circle cx="-1.6" cy="-2.4" r="1.9" fill="#fff"/>`);
      mouth = L('M89 111 Q100 120 111 111', 3) + F('M95 115 Q94 131 102 131 Q110 131 107 115Z', '#ec8a9a', 2.4) + L('M101 119 L101 126', 1.4, '#b04a5a');
      brows = L('M74 80 Q82 76 90 80M110 74 Q118 68 126 72', 2.6);
      break;
    default:
  }
  const blush = `<ellipse cx="71" cy="106" rx="8" ry="4.4" fill="#f07a7a" opacity="${blushOp}"/><ellipse cx="129" cy="106" rx="8" ry="4.4" fill="#f07a7a" opacity="${blushOp}"/>`
    + L('M66 104 l3 -4M71 104 l3 -4M124 104 l3 -4M129 104 l3 -4', 1.3, '#c24a4a', ' opacity=".55"');
  return blush + brows + ey + nose(M.nose, skin) + mouth + extra;
}

/* ───────── 팔 · 다리 ───────── */
function hand(x, y, kind, skin, side) {
  const s = side === 'L' ? -1 : 1;
  let extra = '';
  if (kind === 'point') extra = `<path d="M${x} ${y + 4} L${x - s} ${y + 17}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${x} ${y + 4} L${x - s} ${y + 17}" stroke="${skin.fill}" stroke-width="4.4" stroke-linecap="round"/>`;
  if (kind === 'thumb') extra = `<path d="M${x - 6 * s} ${y + 2} L${x - 8 * s} ${y + 14}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${x - 6 * s} ${y + 2} L${x - 8 * s} ${y + 14}" stroke="${skin.fill}" stroke-width="4.4" stroke-linecap="round"/>`;
  const fist = kind === 'fist' ? L(`M${x - 5} ${y - 1} q5 3 10 0M${x - 5} ${y + 3} q5 3 10 0`, 1.4) : L(`M${x - 4 * s} ${y + 1} q${3 * s} 4 ${7 * s} 2`, 1.4);
  return `${extra}<circle cx="${x}" cy="${y}" r="9" fill="${skin.fill}" stroke="${INK}" stroke-width="2.8"/>${fist}`;
}
function arms(o, skin, cloth, emote) {
  const sc = o.skinArms ? skin : (o.sleeve || cloth);
  const kindR = { mock: 'point', hurry: 'point', nice: 'thumb', angry: 'fist' }[emote] || '';
  const kindL = { angry: 'fist' }[emote] || '';
  const watch = emote === 'hurry' ? F('M61 180 L79 182 L78 190 L60 188Z', '#3a2418', 2) + F('M65 185 a4.5 4.5 0 1 1 9 0 a4.5 4.5 0 1 1 -9 0Z', '#f2d68a', 1.8) : '';
  const armL = `<g class="av-armL">${F('M68 148 Q60 170 63 186 L79 188 Q80 168 86 150Z', sc.fill)}${T('M78 152 Q76 170 78 186 L73 187 Q71 168 74 152Z', '#000', 0.14)}${hand(71, 193, kindL, skin, 'L')}${watch}</g>`;
  const armR = `<g class="av-armR">${F('M132 148 Q140 170 137 186 L121 188 Q120 168 114 150Z', sc.fill)}${T('M132 150 Q138 170 136 185 L130 186 Q132 168 128 150Z', '#000', 0.16)}${hand(129, 193, kindR, skin, 'R')}</g>`;
  return { armL, armR };
}
function legs(o) {
  const pants = o.pants || '#4a5670';
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

/* ───────── 옷 무늬 · 배경 ───────── */
function patternDef(id, kind) {
  const wrap = (w, h, inner) => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${inner}</pattern>`;
  switch (kind) {
    case 'stripe': return wrap(9, 9, '<rect width="9" height="3.2" fill="#fff" opacity=".38"/>');
    case 'dots': return wrap(11, 11, '<circle cx="3" cy="3" r="2.2" fill="#fff" opacity=".5"/><circle cx="8.5" cy="8.5" r="2.2" fill="#fff" opacity=".5"/>');
    case 'check': return wrap(14, 14, '<rect width="7" height="7" fill="#000" opacity=".16"/><rect x="7" y="7" width="7" height="7" fill="#000" opacity=".16"/><rect x="7" width="7" height="7" fill="#fff" opacity=".12"/>');
    case 'stars': return wrap(16, 16, '<path d="M8 3 l1.4 3 3.2 .4 -2.4 2.2 .7 3.2 -2.9 -1.6 -2.9 1.6 .7 -3.2 -2.4 -2.2 3.2 -.4Z" fill="#fff" opacity=".6"/>');
    case 'flowers': return wrap(18, 18, '<g opacity=".6" fill="#fff"><circle cx="9" cy="5" r="2.4"/><circle cx="13" cy="9" r="2.4"/><circle cx="9" cy="13" r="2.4"/><circle cx="5" cy="9" r="2.4"/></g><circle cx="9" cy="9" r="1.8" fill="#f2cf4a"/>');
    case 'hearts': return wrap(16, 16, '<path d="M8 12 c-2 -3 -7 -4 -5 -8 c1.4 -2 4 -1 5 1 c1 -2 3.6 -3 5 -1 c2 4 -3 5 -5 8Z" fill="#fff" opacity=".5"/>');
    case 'zigzag': return wrap(12, 10, '<path d="M0 6 l3 -4 l3 4 l3 -4 l3 4" fill="none" stroke="#fff" stroke-width="1.8" opacity=".5"/>');
    default: return '';
  }
}
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
      for (let i = 0; i < 26; i++) art += `<path transform="translate(${(i * 53) % 220 - 10} ${((i * 97) % 300) - 30}) scale(${0.7 + (i % 3) * 0.3})" d="M0 -8 l2.4 5.2 5.6 .6 -4.2 3.8 1.2 5.6 -5 -2.8 -5 2.8 1.2 -5.6 -4.2 -3.8 5.6 -.6Z" fill="${ink}"/>`;
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
  return `<svg class="av-bg" viewBox="0 -30 200 290" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${bgArt(find(P.bg, id))}</svg>`;
}

/**
 * 캐릭터 SVG 문자열
 * @param {object} av 캐릭터 부위
 * @param {object} o  { expr, emote, crop: 'head'|'full', bg: bool, cls, flat: 손떨림 효과 끄기 }
 */
export function avatarSvg(av, o = {}) {
  av = P.clean(av);
  const uid = `av${++uidSeq}${Math.random().toString(36).slice(2, 6)}`;
  const skin = find(P.skin, av.skin);
  const hc = find(P.hairColor, av.hairColor);
  const cloth = find(P.cloth, av.cloth);
  const bg = find(P.bg, av.bg);
  const hair = find(P.hair, av.hair);
  const hatC = find(P.hatColor, av.hatColor);
  const accC = find(P.accColor, av.accColor);
  const emote = o.emote || '';
  const expr = o.expr || (emote ? (P.EMOTES.find((e) => e.id === emote) || {}).expr : '') || 'neutral';
  const ctx = { clip: `${uid}c`, skin };
  const outfit = (OUTFITS[av.outfit] || OUTFITS.tee)(cloth, ctx);
  const acc = ACCS[av.acc] || ACCS.none;
  const pat = av.pattern !== 'plain' ? `${uid}p` : '';
  const { armL, armR } = arms(outfit, skin, cloth, emote);
  const head = `<g class="av-hm av-head">${F('M56 84 C44 80 42 102 56 104Z', skin.fill, 2.6)}${F('M144 84 C156 80 158 102 144 104Z', skin.fill, 2.6)}`
    + F('M54 88 C54 52 76 40 100 40 C124 40 146 52 146 88 C146 118 126 136 100 136 C74 136 54 118 54 88Z', skin.fill)
    + T('M134 64 C146 84 144 116 122 131 C134 114 138 92 134 64Z', skin.shade, 0.9)
    + face(av, expr, skin) + hairFront(hair.front, hc)
    + (acc.layer === 'neck' ? '' : acc.f(accC, hc))
    + (HATS[av.hat] || HATS.none)(hatC, hc) + '</g>';
  // head: 얼굴만 · bust: 얼굴 + 어깨 (목걸이 · 넥타이가 보이게)
  const vb = o.crop === 'head' ? '36 -20 128 162' : o.crop === 'bust' ? '30 -10 140 206' : '0 -30 200 290';
  const back = o.bg ? bgArt(bg) : '';
  const shadow = o.crop ? '' : '<ellipse class="av-shadow" cx="100" cy="247" rx="40" ry="6" fill="#000" opacity=".2"/>';
  return `<svg class="av ${o.crop === 'head' || o.crop === 'bust' ? 'av-crop' : ''} ${emote ? `emo-${emote}` : ''} ${o.cls || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><clipPath id="${ctx.clip}"><path d="${TORSO}"/></clipPath>${pat ? patternDef(pat, av.pattern) : ''}<filter id="${uid}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="${(uidSeq * 7) % 97}"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs>
${back}${shadow}<g ${o.flat ? '' : `filter="url(#${uid})"`}><g class="av-all">${legs(outfit)}<g class="av-upper">`
    + `<g class="av-hm">${outfit.back || ''}${hairBack(hair.back, hc)}</g>`
    + F('M90 128 L90 146 L110 146 L110 128Z', skin.shade, 2.4)
    + outfit.t + (pat ? `<path d="${TORSO}" fill="url(#${pat})"/>` : '')
    + (acc.layer === 'neck' ? acc.f(accC, hc) : '')
    + head + armL + armR
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
