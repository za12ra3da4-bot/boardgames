'use strict';
// 흉기 6종: 금속 반사, 각인, 그림자가 들어간 사실적인 일러스트
const { svg, lin, rad, blur, rng, f } = require('./lib');

const wrap = (defs, body) => svg(300, 300, body, { defs: `${blur('shadowBlur', 6)}${defs}` });
const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity=".5" filter="url(#shadowBlur)"/>`;

function candle() {
  const defs = [
    lin('silver', [[0, '#4e555e'], [0.18, '#c9d0d8'], [0.32, '#ffffff'], [0.46, '#aab2bc'], [0.7, '#626a74'], [0.86, '#d6dce2'], [1, '#3e444c']], 0, 0, 1, 0),
    lin('wax', [[0, '#fff8e6'], [0.5, '#f0e2c0'], [1, '#bea57a']], 0, 0, 1, 0),
    rad('flameGlow', [[0, '#ffd27a', 0.75], [0.4, '#ff9a3a', 0.28], [1, '#ff7a1a', 0]]),
    lin('flame', [[0, '#fff6d0'], [0.5, '#ffc24a'], [1, '#ff6a1a']]),
  ].join('');
  return wrap(defs, `
    <circle cx="150" cy="40" r="78" fill="url(#flameGlow)"/>
    ${shadow(150, 278, 90, 12)}
    <ellipse cx="150" cy="264" rx="72" ry="16" fill="#2e333a"/>
    <path d="M78 262C80 246 106 236 150 236C194 236 220 246 222 262C220 271 194 277 150 277C106 277 80 271 78 262Z" fill="url(#silver)"/>
    <path d="M92 254C110 246 190 246 208 254" stroke="#fff" stroke-width="2" opacity=".6" fill="none"/>
    <path d="M96 266c10 4 20 4 26 0m56 0c6 4 16 4 26 0" stroke="#6a727c" stroke-width="2" fill="none"/>
    <ellipse cx="150" cy="238" rx="44" ry="9" fill="url(#silver)"/>
    <path d="M136 236C128 224 124 212 134 204C140 199 141 191 137 185C130 176 133 166 142 162L142 134C132 130 130 120 140 116L160 116C170 120 168 130 158 134L158 162C167 166 170 176 163 185C159 191 160 199 166 204C176 212 172 224 164 236Z" fill="url(#silver)"/>
    <ellipse cx="150" cy="204" rx="17" ry="5" fill="#fff" opacity=".25"/>
    <ellipse cx="150" cy="164" rx="10" ry="3.5" fill="#fff" opacity=".3"/>
    <path d="M143 136V160M140 186C136 192 136 200 142 206" stroke="#fff" stroke-width="2.4" opacity=".55" fill="none" stroke-linecap="round"/>
    <path d="M108 118C110 107 128 103 150 103C172 103 190 107 192 118C190 127 172 131 150 131C128 131 110 127 108 118Z" fill="url(#silver)"/>
    <path d="M108 118C101 116 97 109 102 104M192 118C199 116 203 109 198 104" stroke="#b8c0c8" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="134" y="52" width="32" height="62" rx="3" fill="url(#wax)"/>
    <path d="M134 60C134 56 166 56 166 60L166 70C163 74 161 66 159 72C157 84 153 84 152 72C151 66 148 66 147 78C146 90 141 90 140 76C139 68 136 70 134 74Z" fill="#fffaf0"/>
    <ellipse cx="150" cy="56" rx="16" ry="4" fill="#e8d6ae"/>
    <path d="M150 56V45" stroke="#2a2018" stroke-width="2"/>
    <path d="M150 6C160 18 166 28 164 38C162 46 156 50 150 50C144 50 138 46 136 38C134 28 140 18 150 6Z" fill="url(#flame)"/>
    <path d="M150 24C154 30 156 36 154 42C153 45 151 46 150 46C149 46 147 45 146 42C144 36 146 30 150 24Z" fill="#fff" opacity=".85"/>`);
}

function dagger() {
  const defs = [
    lin('blade', [[0, '#5f6873'], [0.35, '#e9eef3'], [0.5, '#9aa4ae'], [0.52, '#4e565f'], [0.75, '#c3cbd3'], [1, '#6b737c']], 0, 0, 1, 0),
    lin('gold', [[0, '#fff1b0'], [0.4, '#d9a83a'], [0.7, '#9a6a1a'], [1, '#e8c060']]),
    lin('leather', [[0, '#4a2a1a'], [0.5, '#2a160e'], [1, '#1a0c06']], 0, 0, 1, 0),
    rad('ruby', [[0, '#ff8a8a'], [0.45, '#c0182a'], [1, '#4a0610']], 0.35, 0.3, 0.7),
  ].join('');
  return wrap(defs, `
    ${shadow(150, 262, 116, 14)}
    <g transform="rotate(42 150 150)">
      <path d="M150 6L166 52L163 186L150 204L137 186L134 52Z" fill="url(#blade)"/>
      <path d="M150 48V176" stroke="#4a525b" stroke-width="5" stroke-linecap="round"/>
      <path d="M151.5 48V176" stroke="#dfe6ec" stroke-width="1.2" opacity=".8"/>
      <path d="M150 6L134 52M150 6L166 52" stroke="#fff" stroke-width="1.4" opacity=".7"/>
      <path d="M140 150c6-4 6-10 2-14m16 14c-6-4-6-10-2-14m-8 30c-4-6-2-12 4-14" stroke="#b9c2cb" stroke-width="1.2" fill="none" opacity=".7"/>
      <path d="M153 16C157 32 159 50 157 64C155 56 153 40 153 16Z" fill="#6a0c14" opacity=".75"/>
      <path d="M96 204C108 194 130 196 150 200C170 196 192 194 204 204C210 214 200 224 188 219C176 214 164 214 150 216C136 214 124 214 112 219C100 224 90 214 96 204Z" fill="url(#gold)"/>
      <circle cx="94" cy="208" r="7" fill="url(#gold)"/><circle cx="206" cy="208" r="7" fill="url(#gold)"/>
      <path d="M104 206C120 200 136 202 150 205C164 202 180 200 196 206" stroke="#fff5c8" stroke-width="1.5" fill="none" opacity=".7"/>
      <circle cx="150" cy="210" r="8" fill="url(#ruby)"/><circle cx="147" cy="207" r="2.2" fill="#fff" opacity=".8"/>
      <path d="M140 220L160 220L158 270L142 270Z" fill="url(#leather)"/>
      <path d="M140 226L160 234M140 236L160 244M140 246L160 254M140 256L160 264M160 226L140 234M160 236L140 244M160 246L140 254M160 256L140 264" stroke="#0e0604" stroke-width="1.6" opacity=".7"/>
      <path d="M143 224V266" stroke="#7a4a2a" stroke-width="1.5" opacity=".5"/>
      <ellipse cx="150" cy="272" rx="14" ry="5" fill="url(#gold)"/>
      <circle cx="150" cy="284" r="13" fill="url(#gold)"/>
      <circle cx="150" cy="284" r="6" fill="url(#ruby)"/><circle cx="146" cy="280" r="3" fill="#fff" opacity=".5"/>
    </g>`);
}

function rope() {
  const defs = [
    `<pattern id="twist" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="16" height="16" fill="#b98c52"/><rect width="7" height="16" fill="#8f6534"/><rect x="7" width="2" height="16" fill="#e0b57a"/><rect x="13" width="1.5" height="16" fill="#6e4a22"/></pattern>`,
    lin('ropeShade', [[0, '#fff', 0.22], [0.45, '#fff', 0], [0.6, '#000', 0], [1, '#000', 0.55]]),
  ].join('');
  const coil = (cy, rx, ry) => `<ellipse cx="150" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#twist)" stroke-width="22"/><ellipse cx="150" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#ropeShade)" stroke-width="22"/>`;
  const loop = 'M204 178C248 138 244 58 190 40C136 24 100 70 116 112C126 140 158 150 176 136';
  return wrap(defs, `
    ${shadow(150, 270, 120, 16)}
    ${coil(236, 104, 36)}
    ${coil(213, 98, 34)}
    ${coil(190, 90, 31)}
    <path d="${loop}" fill="none" stroke="url(#twist)" stroke-width="18" stroke-linecap="round"/>
    <path d="${loop}" fill="none" stroke="url(#ropeShade)" stroke-width="18" stroke-linecap="round"/>
    <g transform="rotate(-38 190 160)">
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="170" y="${140 + i * 9}" width="40" height="9" rx="4" fill="url(#twist)" stroke="#5a3a18" stroke-width="1"/>`).join('')}
      <rect x="170" y="140" width="40" height="45" rx="5" fill="url(#ropeShade)" opacity=".6"/>
    </g>
    <path d="M176 136l14-8M178 140l12 2M174 132l8-14" stroke="#c9a06a" stroke-width="2" stroke-linecap="round"/>`);
}

function poison() {
  const r = rng(13);
  const bubbles = Array.from({ length: 10 }, () => `<circle cx="${f(116 + r() * 70)}" cy="${f(170 + r() * 96)}" r="${f(1.5 + r() * 3.5)}" fill="none" stroke="#e0ffd0" stroke-opacity=".6" stroke-width="1.2"/>`).join('');
  const dots = Array.from({ length: 14 }, () => `<circle cx="${f(134 + r() * 32)}" cy="${f(26 + r() * 26)}" r="${f(0.8 + r())}"/>`).join('');
  const defs = [
    lin('glass', [[0, '#0b2a18'], [0.2, '#2e7a4a'], [0.35, '#5ab07a'], [0.5, '#1d5a36'], [0.85, '#2a6e44'], [1, '#07190e']], 0, 0, 1, 0),
    rad('liquid', [[0, '#b8ff9a'], [0.5, '#46c45a'], [1, '#0e5a24']], 0.45, 0.35, 0.75),
    rad('aura', [[0, '#6aff7a', 0.42], [1, '#6aff7a', 0]]),
    lin('label', [[0, '#efe2c4'], [1, '#c4ad84']]),
    lin('cork', [[0, '#c89a64'], [1, '#7a5430']], 0, 0, 1, 0),
    rad('wax', [[0, '#d23a3a'], [1, '#5a0c10']], 0.4, 0.3, 0.8),
  ].join('');
  return wrap(defs, `
    <ellipse cx="150" cy="170" rx="122" ry="132" fill="url(#aura)"/>
    ${shadow(150, 280, 72, 12)}
    <path d="M102 124C102 102 120 92 126 82L126 60L174 60L174 82C180 92 198 102 198 124L198 254C198 268 188 278 174 278L126 278C112 278 102 268 102 254Z" fill="url(#glass)"/>
    <path d="M104 158C124 150 176 150 196 158L196 254C196 266 186 276 174 276L126 276C114 276 104 266 104 254Z" fill="url(#liquid)" opacity=".9"/>
    <path d="M104 158C124 166 176 166 196 158" stroke="#d8ffc8" stroke-width="2" fill="none" opacity=".7"/>
    ${bubbles}
    <path d="M114 110V250" stroke="#fff" stroke-width="7" opacity=".16" stroke-linecap="round"/>
    <path d="M122 112V156" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>
    <path d="M188 120V250" stroke="#000" stroke-width="6" opacity=".25" stroke-linecap="round"/>
    <rect x="120" y="52" width="60" height="14" rx="5" fill="#2e6a44"/><rect x="120" y="52" width="60" height="5" rx="2.5" fill="#6ab88a" opacity=".6"/>
    <rect x="130" y="22" width="40" height="34" rx="6" fill="url(#cork)"/>
    <g fill="#5a3a1a" opacity=".5">${dots}</g>
    <path d="M126 42C126 32 174 32 174 42L174 58C170 66 166 58 162 64C158 72 154 60 150 66C146 74 142 62 138 66C132 72 128 62 126 58Z" fill="url(#wax)"/>
    <circle cx="150" cy="46" r="7" fill="#8a1a1f" stroke="#c84a4a" stroke-width="1.2"/>
    <path d="M110 172C130 168 170 168 190 172L190 244C170 248 130 248 110 244Z" fill="url(#label)"/>
    <path d="M110 172C130 168 170 168 190 172L190 244C170 248 130 248 110 244Z" fill="none" stroke="#6a4a2a" stroke-width="1.5"/>
    <path d="M116 180C134 177 166 177 184 180M116 236C134 239 166 239 184 236" stroke="#7a1a1a" stroke-width="1.2" fill="none"/>
    <path d="M132 222L168 192M132 192L168 222" stroke="#2a1a14" stroke-width="4" stroke-linecap="round"/>
    <path d="M150 186C138 186 131 193 131 202C131 209 135 213 140 215L140 221L160 221L160 215C165 213 169 209 169 202C169 193 162 186 150 186Z" fill="#2a1a14"/>
    <ellipse cx="143" cy="202" rx="4.5" ry="5" fill="#e4d4b0"/><ellipse cx="157" cy="202" rx="4.5" ry="5" fill="#e4d4b0"/>
    <path d="M150 206l-2.5 5h5z" fill="#e4d4b0"/>
    <path d="M144 217v4M148 217v4M152 217v4M156 217v4" stroke="#e4d4b0" stroke-width="1.2"/>
    <text x="150" y="236" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11" font-weight="700" letter-spacing="2.5" fill="#7a1414">POISON</text>`);
}

function revolver() {
  const defs = [
    lin('steelV', [[0, '#c9d0d8'], [0.3, '#7c848e'], [0.55, '#3a4048'], [0.8, '#5a626c'], [1, '#22262c']]),
    lin('steelH', [[0, '#3a4048'], [0.5, '#8a929c'], [1, '#2a2e34']], 0, 0, 1, 0),
    lin('wood', [[0, '#8a4e2c'], [0.5, '#5a2e16'], [1, '#2a140a']], 0, 0, 1, 1),
    `<pattern id="check" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0h6M0 0v6" stroke="#1a0a04" stroke-width="1" opacity=".55"/></pattern>`,
  ].join('');
  return wrap(defs, `
    ${shadow(150, 252, 124, 14)}
    <g transform="rotate(-10 150 150)">
      <rect x="140" y="98" width="142" height="20" rx="3" fill="url(#steelV)"/>
      <rect x="140" y="92" width="140" height="8" rx="2" fill="#5a626c"/>
      <path d="M142 104H278" stroke="#fff" stroke-width="2.5" opacity=".55"/>
      <rect x="270" y="86" width="5" height="7" fill="#2a2e34"/>
      <rect x="276" y="94" width="10" height="26" rx="2" fill="#2a2e34"/>
      <rect x="156" y="118" width="100" height="10" rx="5" fill="url(#steelV)"/>
      <circle cx="256" cy="123" r="5.5" fill="#3a4048"/>
      <path d="M58 92L152 90L152 154L120 162L98 164L84 142L58 132Z" fill="url(#steelV)"/>
      <path d="M70 110c10-8 20-8 26 0s18 6 24-2M72 124c8 4 16 4 22-2" stroke="#b9c2cc" stroke-width="1.1" fill="none" opacity=".55"/>
      <rect x="98" y="90" width="60" height="60" rx="11" fill="url(#steelV)"/>
      <rect x="106" y="94" width="7" height="52" rx="3" fill="#22262c" opacity=".85"/>
      <rect x="123" y="92" width="7" height="56" rx="3" fill="#22262c" opacity=".85"/>
      <rect x="140" y="94" width="7" height="52" rx="3" fill="#22262c" opacity=".85"/>
      <path d="M114 94V146M131 94V146" stroke="#e6ebf0" stroke-width="1.6" opacity=".6"/>
      <path d="M62 92L46 62C44 55 52 50 59 54L78 90Z" fill="#2e3238"/>
      <path d="M50 60l6 4M52 66l6 4M54 72l6 4" stroke="#5a626c" stroke-width="1.2"/>
      <path d="M102 160C102 192 140 200 152 170" stroke="url(#steelH)" stroke-width="7" fill="none"/>
      <path d="M118 158C116 172 120 182 128 186" stroke="#1e2226" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M60 128L100 150C98 192 100 224 114 256L58 266C36 230 36 170 60 128Z" fill="url(#wood)"/>
      <path d="M60 128L100 150C98 192 100 224 114 256L58 266C36 230 36 170 60 128Z" fill="url(#check)"/>
      <path d="M60 128L100 150C98 192 100 224 114 256" stroke="#3a4048" stroke-width="4" fill="none"/>
      <path d="M62 140C54 170 52 210 62 246" stroke="#c88a5a" stroke-width="2" fill="none" opacity=".45"/>
      <circle cx="78" cy="196" r="4.5" fill="#c9d0d8"/><path d="M75.5 196h5" stroke="#3a4048" stroke-width="1.2"/>
      <circle cx="84" cy="266" r="7" fill="none" stroke="#5a626c" stroke-width="3"/>
    </g>`);
}

function wrench() {
  const r = rng(5);
  const chips = Array.from({ length: 9 }, () => `<ellipse cx="${f(134 + r() * 32)}" cy="${f(150 + r() * 120)}" rx="${f(2 + r() * 4)}" ry="${f(1.5 + r() * 3)}" fill="#aab2ba" opacity=".7"/>`).join('');
  const rust = Array.from({ length: 12 }, () => `<circle cx="${f(112 + r() * 76)}" cy="${f(36 + r() * 94)}" r="${f(1.5 + r() * 3.5)}" fill="#8a4a1a" opacity=".45"/>`).join('');
  const defs = [
    lin('steel', [[0, '#5f6873'], [0.35, '#dfe5eb'], [0.55, '#8e98a2'], [1, '#3e454d']], 0, 0, 1, 0),
    lin('red', [[0, '#b8392c'], [0.5, '#8a2419'], [1, '#4e120c']], 0, 0, 1, 0),
    `<pattern id="knurl" width="4" height="12" patternUnits="userSpaceOnUse"><rect width="4" height="12" fill="#8e98a2"/><rect width="2" height="12" fill="#3e454d"/></pattern>`,
  ].join('');
  return wrap(defs, `
    ${shadow(150, 272, 104, 14)}
    <g transform="rotate(-36 150 160)">
      <path d="M134 128L166 128L172 292C172 302 128 302 128 292Z" fill="url(#red)"/>
      <path d="M146 136L154 136L156 284L144 284Z" fill="#3a0c08" opacity=".45"/>
      ${chips}
      <ellipse cx="150" cy="276" rx="9" ry="6" fill="#1a0806"/>
      <path d="M136 132L140 290" stroke="#e86a5a" stroke-width="2" opacity=".35"/>
      <path d="M108 30L194 30L204 58L180 66L180 96L120 96L120 66L96 58Z" fill="url(#steel)"/>
      <path d="M96 58L120 66L180 66L204 58" stroke="#2a3036" stroke-width="2" fill="none"/>
      <path d="M122 66l6 7 6-7 6 7 6-7 6 7 6-7 6 7 6-7 6 7" stroke="#2a3036" stroke-width="2" fill="none"/>
      <rect x="124" y="96" width="52" height="16" fill="url(#knurl)"/>
      <rect x="124" y="96" width="52" height="16" fill="none" stroke="#2a3036" stroke-width="1.5"/>
      <path d="M118 112L182 112L184 136L116 136Z" fill="url(#steel)"/>
      <path d="M124 112l6-7 6 7 6-7 6 7 6-7 6 7 6-7 6 7 6-7 6 7" stroke="#2a3036" stroke-width="2" fill="none"/>
      ${rust}
      <path d="M112 34L190 34" stroke="#fff" stroke-width="2" opacity=".5"/>
    </g>`);
}

module.exports = { candle, dagger, rope, poison, revolver, wrench };
