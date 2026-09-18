/* 프로필 캐릭터 그리기 (손그림 느낌의 작은 사람)
   부위마다 따로 묶어 두어서 이모트 때 팔 · 다리 · 머리가 각자 움직인다. */
import './avatar-parts.js';

const P = self.AVATAR_PARTS;
export { P as PARTS };

const INK = '#2a1d14';
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
    default: return '';
  }
}

/* ───────── 얼굴 ───────── */
const EL = [82, 92];
const ER = [118, 92];
function at([x, y], inner, mirror = false) {
  return `<g transform="translate(${x} ${y})${mirror ? ' scale(-1 1)' : ''}">${inner}</g>`;
}
function eyeNeutral(style) {
  const one = (m) => {
    switch (style) {
      case 'big': return at(m ? ER : EL, `<ellipse rx="7.5" ry="9.5" fill="${INK}"/><ellipse cy="1.5" rx="5.2" ry="6.5" fill="#6a4226"/><circle cx="-2.4" cy="-3.4" r="2.6" fill="#fff"/><circle cx="2.2" cy="3" r="1.2" fill="#fff"/>${L('M-9 -7 Q0 -13 9 -7', 2.6)}`, m);
      case 'sharp': return at(m ? ER : EL, `${F('M-10 1 Q-1 -9 10 -3 Q3 6 -10 1Z', '#fff', 2.6)}<circle cx="1" cy="-1" r="3.6" fill="${INK}"/><circle cx="0" cy="-2.2" r="1.1" fill="#fff"/>`, m);
      case 'sleepy': return at(m ? ER : EL, `<path d="M-7 0 Q0 7 7 0Z" fill="${INK}"/>${L('M-9 0 L9 0', 3)}`, m);
      case 'smile': return at(m ? ER : EL, L('M-7 3 Q0 -6 7 3', 3.4), m);
      default: return at(m ? ER : EL, `<ellipse rx="4.6" ry="6.2" fill="${INK}"/><circle cx="-1.5" cy="-2.2" r="1.7" fill="#fff"/>`, m);
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
    default: return L('M89 112 Q100 122 111 112', 3);
  }
}
const browsN = L('M74 78 Q82 74 90 77M110 77 Q118 74 126 78', 2.6);

function face(av, expr) {
  let eyes = eyeNeutral(av.eyes);
  let mouth = mouthNeutral(av.mouth);
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
  return blush + brows + eyes + nose + mouth + extra;
}

/* ───────── 모자 · 장신구 ───────── */
function hat(id, cloth) {
  switch (id) {
    case 'cowboy': return F('M68 46 C64 16 80 6 100 14 C120 6 136 16 132 46Z', '#8a5a32') + T('M112 12 C124 12 132 22 132 46 L118 46 C120 30 118 20 112 12Z', '#000', 0.16)
      + F('M67 38 L133 38 L133 46 L67 46Z', '#3a2418', 2.4) + L('M100 16 Q98 24 100 32', 2)
      + F('M26 50 C44 34 156 34 174 50 C164 60 140 54 100 54 C60 54 36 60 26 50Z', '#9a6a3c') + L('M44 46 Q100 38 156 46', 1.8, '#5a3a20', ' opacity=".6"');
    case 'beanie': return F('M48 72 C46 30 72 14 100 14 C128 14 154 30 152 72Z', cloth.fill)
      + L('M72 22 L68 64M88 16 L86 64M104 15 L104 64M120 18 L122 64M136 26 L138 64', 1.8, cloth.shade)
      + F('M44 62 Q100 54 156 62 L156 80 Q100 72 44 80Z', cloth.shade) + F('M90 6 a10 10 0 1 1 20 0 a10 10 0 1 1 -20 0Z', '#efe2c2', 2.4);
    case 'crown': return F('M62 48 L58 12 L80 30 L100 4 L120 30 L142 12 L138 48Z', '#e8b830') + T('M120 30 L142 12 L138 48 L122 48Z', '#a0741a', 0.45)
      + L('M62 40 L138 40', 2.2) + F('M95 30 a5 5 0 1 1 10 0 a5 5 0 1 1 -10 0Z', '#c8453a', 2) + F('M74 34 a3.4 3.4 0 1 1 6.8 0 a3.4 3.4 0 1 1 -6.8 0Z', '#3a7ac8', 1.8) + F('M119 34 a3.4 3.4 0 1 1 6.8 0 a3.4 3.4 0 1 1 -6.8 0Z', '#3a9a5a', 1.8)
      + '<circle cx="58" cy="12" r="3.4" fill="#fff4c0" stroke="#2a1d14" stroke-width="2"/><circle cx="100" cy="4" r="3.4" fill="#fff4c0" stroke="#2a1d14" stroke-width="2"/><circle cx="142" cy="12" r="3.4" fill="#fff4c0" stroke="#2a1d14" stroke-width="2"/>';
    case 'wizard': return F('M54 54 L100 -12 Q116 -26 132 -14 Q116 -14 110 -4 L148 54Z', '#34497a') + T('M110 -4 L148 54 L126 54Z', '#000', 0.2)
      + F('M86 22 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1Z', '#f2cf4a', 1.6) + F('M114 38 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1Z', '#f2cf4a', 1.4)
      + F('M30 54 Q100 36 170 54 Q100 70 30 54Z', '#3e5690');
    case 'band': return F('M52 66 Q100 48 148 66 L148 78 Q100 60 52 78Z', cloth.fill) + F('M144 66 L168 56 L164 76Z', cloth.fill, 2.4) + F('M144 72 L162 88 L150 90Z', cloth.shade, 2.4)
      + L('M60 70 Q100 56 140 70', 1.6, '#fff', ' opacity=".5"');
    case 'top': return F('M68 46 L70 -8 Q100 -16 130 -8 L132 46Z', '#2a2724') + T('M116 -12 Q126 -10 130 -8 L132 46 L118 46Z', '#fff', 0.1)
      + F('M69 30 L131 30 L131 42 L69 42Z', '#8e2a22', 2.4) + F('M48 46 Q100 34 152 46 Q100 58 48 46Z', '#34302c');
    case 'cap': return F('M50 70 C48 30 74 18 100 18 C126 18 152 30 150 70Z', cloth.fill) + T('M120 22 C140 30 152 44 150 70 L132 70 C134 46 128 32 120 22Z', '#000', 0.16)
      + L('M100 18 L100 68', 1.8, cloth.shade) + F('M118 62 Q162 54 176 70 Q150 76 116 72Z', cloth.shade) + F('M95 18 a5 4 0 1 1 10 0Z', cloth.shade, 2);
    default: return '';
  }
}
function accessory(id, hc) {
  switch (id) {
    case 'glasses': return `<circle cx="82" cy="92" r="12" fill="#bfe4ff" fill-opacity=".18" stroke="${INK}" stroke-width="2.6"/><circle cx="118" cy="92" r="12" fill="#bfe4ff" fill-opacity=".18" stroke="${INK}" stroke-width="2.6"/>`
      + L('M94 91 Q100 86 106 91M70 90 L56 86M130 90 L144 86', 2.4) + L('M76 86 l5 -3M112 86 l5 -3', 1.6, '#fff');
    case 'shades': return F('M66 84 L96 84 Q96 102 82 102 Q66 102 66 84Z', '#1c1a22', 2.6) + F('M104 84 L134 84 Q134 102 118 102 Q104 102 104 84Z', '#1c1a22', 2.6)
      + L('M96 86 Q100 83 104 86M66 85 L54 82M134 85 L146 82', 2.4) + L('M72 88 l6 6M110 88 l6 6', 2, '#fff', ' opacity=".7"');
    case 'patch': return L('M54 70 Q100 56 146 84', 2.4) + F('M106 84 Q118 80 130 86 Q130 102 118 102 Q106 100 106 84Z', '#1c1a22', 2.4);
    case 'mustache': return F('M82 108 Q90 98 100 105 Q110 98 118 108 Q124 112 128 106 Q124 118 112 112 Q106 110 100 108 Q94 110 88 112 Q76 118 72 106 Q76 112 82 108Z', hc.fill, 2.2);
    case 'bandaid': return `<g transform="rotate(-28 126 104)">${F('M114 99 h24 a4 4 0 0 1 0 10 h-24 a4 4 0 0 1 0 -10Z', '#f0c8a0', 2)}${T('M122 100 h8 v8 h-8Z', '#e0a878')}<circle cx="124" cy="102" r=".9" fill="${INK}"/><circle cx="128" cy="106" r=".9" fill="${INK}"/></g>`;
    default: return '';
  }
}

/* ───────── 몸 ───────── */
const PANTS = { tee: '#4a5670', hoodie: '#3e4a60', suit: null, vest: '#5a4630', cloak: '#3a3430', apron: '#6a5a44' };
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
    default: return F(TORSO, cloth.fill) + shade + L('M88 143 Q100 156 112 143', 2.6) + L('M84 156 Q90 162 86 170', 1.4, '#000', ' opacity=".2"');
  }
}
function sleeveColor(av, cloth) {
  if (av.outfit === 'vest' || av.outfit === 'apron') return { fill: '#efe2c2', shade: '#cdbb92' };
  if (av.outfit === 'cloak') return { fill: '#44403c', shade: '#2a2724' };
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
  const pants = PANTS[av.outfit] || cloth.shade;
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
  const { armL, armR } = arms(av, skin, cloth, emote);
  const head = `<g class="av-hm av-head">${F('M56 84 C44 80 42 102 56 104Z', skin.fill, 2.6)}${F('M144 84 C156 80 158 102 144 104Z', skin.fill, 2.6)}`
    + F('M54 88 C54 52 76 40 100 40 C124 40 146 52 146 88 C146 118 126 136 100 136 C74 136 54 118 54 88Z', skin.fill)
    + T('M134 64 C146 84 144 116 122 131 C134 114 138 92 134 64Z', skin.shade, 0.9)
    + face(av, expr) + hairFront(av.hair, hc) + accessory(av.acc, hc) + hat(av.hat, cloth) + '</g>';
  const vb = o.crop === 'head' ? '36 -20 128 162' : '0 -30 200 290';
  const back = o.bg ? `<rect x="-20" y="-40" width="240" height="320" fill="${bg.fill}"/>`
    + `<g opacity=".35" stroke="${bg.ink}" stroke-width="1.6" fill="none">${Array.from({ length: 14 }, (_, i) => `<path d="M${-30 + i * 20} 270 l70 -70"/>`).join('')}</g>` : '';
  const shadow = o.crop === 'head' ? '' : `<ellipse class="av-shadow" cx="100" cy="247" rx="40" ry="6" fill="#000" opacity=".2"/>`;
  return `<svg class="av ${emote ? `emo-${emote}` : ''} ${o.cls || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><filter id="${uid}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="${(uidSeq * 7) % 97}"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs>
${back}${shadow}<g filter="url(#${uid})"><g class="av-all">${legs(av, cloth)}<g class="av-upper">`
    + `<g class="av-hm">${av.outfit === 'cloak' ? F('M72 142 L38 214 Q100 228 162 214 L128 142Z', cloth.shade) : ''}${hairBack(av.hair, hc)}</g>`
    + torso(av, cloth) + F('M90 128 L90 146 L110 146 L110 128Z', skin.shade, 2.4) + head + armL + armR
    + `</g></g>${fx(emote)}</g></svg>`;
}

export const EMOTES = P.EMOTES;
