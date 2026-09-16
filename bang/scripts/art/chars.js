'use strict';
// 서부 총잡이 16명 초상화: 모자·수염·옷차림 조합으로 각자 뚜렷한 실루엣
const { lin, rad, rng, f } = require('./lib');
const { eye, brow, nose, mouth, rim, scatter, portrait } = require('./face');

const HEADS = {
  round: 'M150 80C112 80 96 108 96 148C96 188 106 218 124 236C134 246 142 250 150 250C158 250 166 246 176 236C194 218 204 188 204 148C204 108 188 80 150 80Z',
  square: 'M150 84C110 84 94 110 94 150C94 188 100 214 116 232C128 244 140 250 150 250C160 250 172 244 184 232C200 214 206 188 206 150C206 110 190 84 150 84Z',
  narrow: 'M150 72C116 72 102 102 102 146C102 190 110 222 126 240C136 250 144 254 150 254C156 254 164 250 174 240C190 222 198 190 198 146C198 102 184 72 150 72Z',
  soft: 'M150 78C112 78 96 110 98 150C100 184 112 214 132 230C140 236 146 238 150 238C154 238 160 236 168 230C188 214 200 184 202 150C204 110 188 78 150 78Z',
  kid: 'M150 90C116 90 102 116 102 152C102 186 112 208 130 224C138 232 144 236 150 236C156 236 162 232 170 224C188 208 198 186 198 152C198 116 184 90 150 90Z',
};
const SHOULDERS = 'M40 380C44 322 84 292 150 288C216 292 256 322 260 380Z';

function sunRays(color) {
  let d = '';
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const a2 = a + Math.PI / 56;
    d += `M150 150L${f(150 + Math.cos(a) * 320)} ${f(150 + Math.sin(a) * 320)}L${f(150 + Math.cos(a2) * 320)} ${f(150 + Math.sin(a2) * 320)}Z`;
  }
  return `<path d="${d}" fill="${color}" opacity=".07"/>`;
}

function outfit(o) {
  const c = o.cloth;
  switch (o.outfit) {
    case 'vest':
      return `<path d="${SHOULDERS}" fill="url(#shirt)"/>
        <path d="M150 300C146 330 148 356 146 380" stroke="#000" stroke-opacity=".15" stroke-width="2" fill="none"/>
        <path d="M58 380C60 340 78 310 114 296L146 380Z" fill="url(#cloth)"/><path d="M242 380C240 340 222 310 186 296L154 380Z" fill="url(#cloth)"/>
        <path d="M114 296L146 380M186 296L154 380" stroke="#000" stroke-opacity=".4" stroke-width="2.5"/>
        <circle cx="136" cy="336" r="3.2" fill="url(#brass)"/><circle cx="140" cy="360" r="3.2" fill="url(#brass)"/>
        <path d="M196 336h26" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`;
    case 'duster':
      return `<path d="${SHOULDERS}" fill="url(#cloth)"/>
        <path d="M140 300L150 380L160 300Z" fill="url(#shirt)"/>
        <path d="M120 288L150 380L94 380L80 326Z" fill="#000" opacity=".22"/><path d="M180 288L150 380L206 380L220 326Z" fill="#000" opacity=".22"/>
        <path d="M108 262L150 312L192 262L212 300L150 348L88 300Z" fill="url(#cloth2)"/>
        <path d="M108 262L150 312L192 262" stroke="#fff" stroke-opacity=".12" stroke-width="2" fill="none"/>`;
    case 'poncho': {
      const stripe = (y, col, w) => `<path d="M${f(40 + (y - 300) * 0.25)} ${y}C${f(90)} ${y - 18} ${f(210)} ${y - 18} ${f(260 - (y - 300) * 0.25)} ${y}" stroke="${col}" stroke-width="${w}" fill="none"/>`;
      return `<path d="M20 380C38 322 90 290 150 286C210 290 262 322 280 380Z" fill="url(#cloth)"/>
        ${stripe(322, c[3] || '#e2b23a', 7)}${stripe(340, c[4] || '#1e5a8a', 4)}${stripe(356, c[3] || '#e2b23a', 7)}
        <path d="M40 332l10 8 10-8 10 8 10-8M220 332l10 8 10-8 10 8 10-8" stroke="#f4efe4" stroke-width="2" fill="none" opacity=".7"/>
        <path d="M128 286L150 316L172 286Z" fill="#000" opacity=".35"/>`;
    }
    case 'fringe':
      return `<path d="${SHOULDERS}" fill="url(#cloth)"/>
        <path d="M130 292L150 380L170 292Z" fill="url(#shirt)"/>
        <path d="M52 334C90 314 210 314 248 334" stroke="#3a2010" stroke-width="3" fill="none"/>
        ${Array.from({ length: 22 }, (_, i) => { const x = 56 + i * 9; return `<path d="M${x} ${f(332 - Math.sin((i / 21) * Math.PI) * 14)}v14" stroke="#e0b880" stroke-width="2" opacity=".8"/>`; }).join('')}`;
    case 'suit':
      return `<path d="${SHOULDERS}" fill="url(#cloth)"/>
        <path d="M130 290L150 380L170 290Z" fill="url(#shirt)"/>
        <path d="M126 300L150 380L174 300L166 294L150 318L134 294Z" fill="url(#cloth2)"/>
        <circle cx="150" cy="336" r="2.4" fill="url(#brass)"/><circle cx="150" cy="356" r="2.4" fill="url(#brass)"/>
        <path d="M120 286L150 380L98 380L88 320Z" fill="#000" opacity=".3"/><path d="M180 286L150 380L202 380L212 320Z" fill="#000" opacity=".3"/>
        <path d="M120 286L150 380M180 286L150 380" stroke="#fff" stroke-opacity=".15" stroke-width="1.5"/>`;
    case 'armor':
      return `<path d="${SHOULDERS}" fill="url(#cloth)"/>
        <path d="M96 304C120 296 180 296 204 304L210 380L90 380Z" fill="url(#steel)"/>
        <path d="M96 304C120 296 180 296 204 304" stroke="#2a2e34" stroke-width="3" fill="none"/>
        ${[[106, 316], [194, 316], [104, 360], [196, 360], [150, 312]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#5a626c"/><circle cx="${x - 1}" cy="${y - 1}" r="1.2" fill="#fff" opacity=".7"/>`).join('')}
        <path d="M124 320L136 376M170 318L160 372" stroke="#3a3e46" stroke-width="3" opacity=".6"/>
        <path d="M120 318l8 4M178 330l-6 6" stroke="#fff" stroke-width="2" opacity=".55"/>`;
    case 'fur':
      return `<path d="${SHOULDERS}" fill="url(#cloth)"/>
        ${Array.from({ length: 14 }, (_, i) => { const a = Math.PI * (0.05 + (i / 13) * 0.9); return `<circle cx="${f(150 - Math.cos(a) * 78)}" cy="${f(300 - Math.sin(a) * 18)}" r="${f(16 + (i % 3) * 3)}" fill="${i % 2 ? '#8a6a4a' : '#6a4e34'}"/>`; }).join('')}
        <path d="M90 300C110 320 190 320 210 300" stroke="#3a2818" stroke-width="3" fill="none" opacity=".6"/>`;
    case 'dress':
      return `<path d="${SHOULDERS}" fill="url(#skin)"/>
        <path d="M44 380C48 344 66 326 90 318C112 334 132 344 150 344C168 344 188 334 210 318C234 326 252 344 256 380Z" fill="url(#cloth)"/>
        <path d="M90 318C112 334 132 344 150 344C168 344 188 334 210 318" stroke="#fff" stroke-width="4" fill="none" stroke-dasharray="2 4" opacity=".85"/>
        <path d="M150 344V380M120 350l-4 30M180 350l4 30" stroke="#000" stroke-opacity=".2" stroke-width="3"/>`;
    case 'kid':
      return `<path d="${SHOULDERS}" fill="url(#cloth)"/>
        <path d="M110 296L118 380M190 296L182 380" stroke="#4a2a14" stroke-width="10"/>
        <circle cx="116" cy="350" r="3" fill="url(#brass)"/><circle cx="184" cy="350" r="3" fill="url(#brass)"/>
        <path d="M60 330c20-6 40-6 50 0M190 330c10-6 30-6 50 0" stroke="#000" stroke-opacity=".2" stroke-width="3" fill="none"/>`;
    default:
      return `<path d="${SHOULDERS}" fill="url(#cloth)"/>`;
  }
}

function neckwear(type, color) {
  switch (type) {
    case 'bandana':
      return `<path d="M116 270C132 290 168 290 184 270L178 300L150 322L122 300Z" fill="${color}"/>
        <path d="M116 270C132 290 168 290 184 270" stroke="#000" stroke-opacity=".3" stroke-width="3" fill="none"/>
        <g fill="#fff" opacity=".55"><circle cx="138" cy="296" r="2"/><circle cx="152" cy="306" r="2"/><circle cx="164" cy="294" r="2"/><circle cx="150" cy="290" r="1.5"/></g>
        <path d="M176 276l14 10-6 4" fill="${color}" stroke="#000" stroke-opacity=".3"/>`;
    case 'stringtie':
      return `<path d="M130 270L150 292L170 270" stroke="#f4efe4" stroke-width="8" fill="none"/>
        <path d="M147 292l-8 44M153 292l8 44" stroke="#1a1410" stroke-width="2"/>
        <circle cx="150" cy="294" r="6" fill="url(#brass)" stroke="#3a2a10"/>`;
    case 'scarf':
      return `<path d="M118 268C132 286 168 286 182 268L186 286C170 304 130 304 114 286Z" fill="${color}"/>
        <path d="M160 294l14 50-14-4-6-40z" fill="${color}"/>
        <path d="M122 280C136 292 164 292 178 280" stroke="#000" stroke-opacity=".25" stroke-width="2" fill="none"/>`;
    default:
      return '';
  }
}

function hairBack(style, color) {
  if (style === 'long' || style === 'braid') {
    return `<path d="M150 62C100 60 76 98 80 150C82 200 70 240 76 282C96 300 116 292 120 272L180 272C184 292 204 300 224 282C230 240 218 200 220 150C224 98 200 60 150 62Z" fill="url(#hair)"/>`;
  }
  if (style === 'curly') {
    return Array.from({ length: 18 }, (_, i) => {
      const a = Math.PI * (0.9 + (i / 17) * 1.2);
      return `<circle cx="${f(150 + Math.cos(a) * 62)}" cy="${f(160 + Math.sin(a) * 76)}" r="${f(18 + (i % 3) * 4)}" fill="${i % 2 ? color[0] : color[1]}"/>`;
    }).join('') + '<rect x="80" y="170" width="140" height="90" rx="40" fill="url(#hair)"/>';
  }
  return '';
}

function hairFront(style, color, jaw) {
  switch (style) {
    case 'short':
      return `<path d="M96 128C94 142 94 154 96 166L103 166C101 154 101 140 103 128ZM204 128C206 142 206 154 204 166L197 166C199 154 199 140 197 128Z" fill="url(#hair)"/>`;
    case 'slick':
      return `<path d="M100 132C100 146 100 160 104 172L110 166C108 152 108 140 108 130ZM200 132C200 146 200 160 196 172L190 166C192 152 192 140 192 130Z" fill="url(#hair)"/>`;
    case 'messy':
      return `<path d="M98 132C92 112 100 96 112 88C110 98 116 100 122 94C126 84 136 80 146 84C144 92 150 94 156 88C164 82 176 84 180 92C178 98 184 100 190 96C200 104 206 118 202 134C194 124 184 116 170 114C158 118 140 118 128 114C114 118 104 124 98 132Z" fill="url(#hair)"/>
        <path d="M104 132C102 148 104 160 100 176M196 132C198 148 196 160 200 176" stroke="${color[0]}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
    case 'long':
      return `<path d="M104 118C96 150 100 196 90 236M196 118C204 150 200 196 210 236" stroke="${color[0]}" stroke-width="11" stroke-linecap="round" fill="none"/>
        <path d="M112 112C104 140 106 170 100 196" stroke="${color[1]}" stroke-width="3" fill="none" opacity=".6"/>`;
    case 'braid':
      return `<path d="M104 118C96 150 100 196 94 230" stroke="${color[0]}" stroke-width="10" stroke-linecap="round" fill="none"/>
        ${Array.from({ length: 8 }, (_, i) => `<ellipse cx="${f(200 + i * 2.2)}" cy="${f(212 + i * 17)}" rx="10" ry="11" fill="${i % 2 ? color[0] : color[1]}" stroke="#000" stroke-opacity=".25"/>`).join('')}
        <path d="M204 350l6 18M210 350l-4 18" stroke="#b33a2a" stroke-width="4"/>`;
    case 'curly':
      return Array.from({ length: 9 }, (_, i) => `<circle cx="${f(108 + i * 10.5)}" cy="${f(108 - Math.sin((i / 8) * Math.PI) * 16)}" r="11" fill="${i % 2 ? color[0] : color[1]}"/>`).join('')
        + `<circle cx="98" cy="170" r="12" fill="${color[1]}"/><circle cx="202" cy="170" r="12" fill="${color[1]}"/>`;
    case 'bald':
      return `<path d="M98 150C96 164 98 178 104 188L112 176C108 166 106 156 106 148ZM202 150C204 164 202 178 196 188L188 176C192 166 194 156 194 148Z" fill="url(#hair)"/>
        <ellipse cx="136" cy="98" rx="22" ry="8" fill="#fff" opacity=".25" transform="rotate(-18 136 98)"/>`;
    default:
      return '';
  }
}

function hat(type, tilt = 0) {
  const wrap = (s) => `<g transform="rotate(${tilt} 150 110)">${s}</g>`;
  switch (type) {
    case 'stetson':
      return wrap(`
        <path d="M96 122C92 84 114 54 150 54C186 54 208 84 204 122Z" fill="url(#hat)"/>
        <path d="M150 58C140 72 138 92 142 110M126 70C122 86 124 100 128 112M174 70C178 86 176 100 172 112" stroke="#000" stroke-opacity=".3" stroke-width="3" fill="none"/>
        <path d="M96 106C120 114 180 114 204 106L204 122C180 130 120 130 96 122Z" fill="url(#band)"/>
        <path d="M34 124C52 106 90 124 150 124C210 124 248 106 266 124C250 144 210 146 150 146C90 146 50 144 34 124Z" fill="url(#hat)"/>
        <path d="M44 126C70 136 230 136 256 126" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/>
        <path d="M100 146C120 156 180 156 200 146" stroke="#000" stroke-opacity=".3" stroke-width="10" fill="none"/>`);
    case 'sombrero':
      return wrap(`
        <path d="M108 122C106 70 126 34 150 34C174 34 194 70 192 122Z" fill="url(#hat)"/>
        <path d="M110 104C130 112 170 112 190 104L192 120C170 128 130 128 108 120Z" fill="url(#band)"/>
        ${[118, 134, 150, 166, 182].map((x) => `<circle cx="${x}" cy="113" r="3" fill="#f2d68a"/>`).join('')}
        <path d="M-6 132C30 94 110 124 150 124C190 124 270 94 306 132C280 158 220 160 150 160C80 160 20 158 -6 132Z" fill="url(#hat)"/>
        <path d="M10 134C60 150 240 150 290 134" stroke="#f2d68a" stroke-width="3" stroke-dasharray="4 5" fill="none"/>
        <path d="M100 160C120 170 180 170 200 160" stroke="#000" stroke-opacity=".3" stroke-width="12" fill="none"/>`);
    case 'bowler':
      return wrap(`
        <path d="M104 118C102 80 122 62 150 62C178 62 198 80 196 118Z" fill="url(#hat)"/>
        <path d="M104 104C124 110 176 110 196 104L196 118C176 124 124 124 104 118Z" fill="url(#band)"/>
        <path d="M84 120C104 108 196 108 216 120C206 132 94 132 84 120Z" fill="url(#hat)"/>
        <ellipse cx="130" cy="80" rx="14" ry="6" fill="#fff" opacity=".18" transform="rotate(-20 130 80)"/>`);
    case 'tophat':
      return wrap(`
        <path d="M112 118V52C112 44 188 44 188 52V118Z" fill="url(#hat)"/>
        <path d="M112 98H188V116H112Z" fill="url(#band)"/>
        <path d="M84 120C104 108 196 108 216 120C206 134 94 134 84 120Z" fill="url(#hat)"/>
        <path d="M120 56V110" stroke="#fff" stroke-opacity=".2" stroke-width="5"/>`);
    case 'flatcap':
      return wrap(`
        <path d="M94 126C88 94 118 74 152 74C192 74 216 96 212 120C200 126 120 132 94 126Z" fill="url(#hat)"/>
        <path d="M94 124C120 134 172 134 204 122L212 132C180 146 120 146 90 134Z" fill="url(#band)"/>
        <path d="M112 90C130 82 170 82 196 96" stroke="#000" stroke-opacity=".25" stroke-width="2" fill="none"/>
        <circle cx="152" cy="76" r="4" fill="url(#hat)"/>`);
    case 'lady':
      return wrap(`
        <path d="M112 102C110 80 128 68 150 68C172 68 190 80 188 102Z" fill="url(#hat)"/>
        <path d="M84 106C104 94 196 94 216 106C204 118 96 118 84 106Z" fill="url(#hat)"/>
        <path d="M112 96H188V104H112Z" fill="url(#band)"/>
        <path d="M184 96C204 70 236 60 250 66C236 74 214 86 192 100Z" fill="#f4efe4"/>
        <path d="M188 98C208 78 232 68 246 68" stroke="#b8a890" stroke-width="1.5" fill="none"/>`);
    default:
      return '';
  }
}

function facialHair(type, color) {
  switch (type) {
    case 'stubble':
      return scatter(type.length * 7 + color.length, 110, [110, 190, 190, 250])
        .filter(([x, y]) => ((x - 150) / 42) ** 2 + ((y - 214) / 36) ** 2 < 1 && !(y > 208 && y < 230 && Math.abs(x - 150) < 18))
        .map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r=".85" fill="${color}" opacity=".6"/>`).join('')
        + `<path d="M112 196C114 222 132 244 150 246C168 244 186 222 188 196C180 214 166 226 150 226C134 226 120 214 112 196Z" fill="${color}" opacity=".16"/>`;
    case 'beard':
      return `<path d="M104 176C104 232 126 270 150 274C174 270 196 232 196 176C188 208 172 228 150 230C128 228 112 208 104 176Z" fill="url(#hair)"/>
        <path d="M150 202C136 198 118 204 112 222C124 214 138 212 150 214C162 212 176 214 188 222C182 204 164 198 150 202Z" fill="url(#hair)"/>
        <path d="M124 236C132 252 142 262 150 264M176 236C168 252 158 262 150 264" stroke="#000" stroke-opacity=".25" stroke-width="2" fill="none"/>`;
    case 'goatee':
      return `<path d="M136 206C144 201 156 201 164 206" stroke="${color}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M142 232C146 252 154 252 158 232C154 236 146 236 142 232Z" fill="${color}"/>`;
    case 'handlebar':
      return `<path d="M150 204C140 200 124 200 114 208C104 216 92 216 84 208C86 220 98 226 112 224C126 222 140 216 150 212C160 216 174 222 188 224C202 226 214 220 216 208C208 216 196 216 186 208C176 200 160 200 150 204Z" fill="url(#hair)"/>`;
    case 'walrus':
      return `<path d="M150 200C130 196 110 204 106 232C118 220 136 216 150 218C164 216 182 220 194 232C190 204 170 196 150 200Z" fill="url(#hair)"/>
        <path d="M130 206l-6 20M142 204l-3 18M158 204l3 18M170 206l6 20" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>`;
    case 'thin':
      return `<path d="M150 206C142 202 128 202 120 210C116 214 112 212 110 208C112 218 122 216 130 212C138 208 146 208 150 210C154 208 162 208 170 212C178 216 188 218 190 208C188 212 184 214 180 210C172 202 158 202 150 206Z" fill="${color}"/>`;
    default:
      return '';
  }
}

function extra(name, o) {
  switch (name) {
    case 'scar':
      return '<path d="M178 172L192 208" stroke="#9a5a4a" stroke-width="3.5" stroke-linecap="round"/><path d="M179 173L193 209" stroke="#f0c0a8" stroke-width="1.2" opacity=".8"/><path d="M181 184l6-3M185 196l6-3" stroke="#9a5a4a" stroke-width="1.5"/>';
    case 'eyescar':
      return '<path d="M162 132L182 176" stroke="#8a4a3a" stroke-width="3.5" stroke-linecap="round"/><path d="M163 133L183 177" stroke="#e8b8a0" stroke-width="1.2" opacity=".8"/>';
    case 'plaster':
      return '<g transform="rotate(-30 116 182)"><rect x="104" y="176" width="24" height="10" rx="2" fill="#e8d8b8"/><path d="M110 176v10M122 176v10" stroke="#b8a888"/></g>';
    case 'monocle':
      return '<circle cx="172" cy="153" r="16" fill="#d8ecf8" fill-opacity=".14" stroke="url(#brass)" stroke-width="3"/><path d="M188 160C198 196 202 236 196 272" stroke="#d9b45a" stroke-width="1.5" stroke-dasharray="3 2" fill="none"/>';
    case 'glasses':
      return '<circle cx="128" cy="153" r="15" fill="#dff3ff" fill-opacity=".1" stroke="url(#brass)" stroke-width="2.4"/><circle cx="172" cy="153" r="15" fill="#dff3ff" fill-opacity=".1" stroke="url(#brass)" stroke-width="2.4"/><path d="M143 151C146 147 154 147 157 151M113 150L100 146M187 150L200 146" stroke="#b08a3a" stroke-width="2" fill="none"/>';
    case 'toothpick':
      return '<path d="M166 220L192 212" stroke="#d8b878" stroke-width="2.5" stroke-linecap="round"/>';
    case 'bandolier':
      return `<path d="M70 320L230 380" stroke="#4a2a14" stroke-width="18"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${f(80 + i * 19)}" y="${f(318 + i * 7.1)}" width="6" height="16" rx="2" fill="url(#brass)" transform="rotate(20 ${f(83 + i * 19)} ${f(326 + i * 7.1)})"/>`).join('')}`;
    case 'cardInHat':
      return '<g transform="rotate(12 184 100)"><rect x="176" y="84" width="16" height="22" rx="2" fill="#f4efe4" stroke="#3a2a1a"/><path d="M184 90l3 5-3 5-3-5z" fill="#b3261e"/></g>';
    case 'horseshoe':
      return '<path d="M200 330a9 9 0 1 1 14 0" stroke="url(#steel)" stroke-width="5" fill="none"/><circle cx="201" cy="334" r="1.5" fill="#333"/><circle cx="213" cy="334" r="1.5" fill="#333"/>';
    case 'herb':
      return '<path d="M186 110C196 90 206 80 218 76" stroke="#4a7a3a" stroke-width="2.5" fill="none"/><path d="M196 94c6-8 14-8 16-4-6 2-10 4-16 4zM204 86c4-8 12-10 16-6-6 2-10 4-16 6zM192 102c4-8 12-8 14-4-6 2-8 4-14 4z" fill="#6aa84a"/>';
    case 'spyglass':
      return '<g transform="rotate(-28 230 330)"><rect x="196" y="318" width="80" height="18" rx="4" fill="url(#brass)"/><rect x="180" y="320" width="20" height="14" rx="3" fill="#6a4a1a"/><rect x="270" y="314" width="12" height="26" rx="3" fill="url(#brass)"/><path d="M204 322h60" stroke="#fff" stroke-width="2" opacity=".5"/></g>';
    case 'freckles':
      return scatter(29, 16, [112, 172, 188, 196]).filter(([x]) => Math.abs(x - 150) > 12).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.3" fill="#a8603a" opacity=".55"/>`).join('');
    case 'earrings':
      return '<circle cx="97" cy="186" r="4.5" fill="url(#brass)"/><circle cx="203" cy="186" r="4.5" fill="url(#brass)"/>';
    case 'feather':
      return '<path d="M196 118C214 80 236 56 250 52C244 70 226 96 204 122Z" fill="#b3261e"/><path d="M200 120C218 88 236 66 248 56" stroke="#5a1010" stroke-width="1.5" fill="none"/>';
    case 'lips':
      return '<path d="M133 216C140 210 146 210 150 213C154 210 160 210 167 216C160 219 140 219 133 216Z" fill="#8a2230"/><path d="M133 216C142 228 158 228 167 216C158 220 142 220 133 216Z" fill="#b8323e"/><path d="M143 222C147 224 153 224 157 222" stroke="#ff9aa6" stroke-width="1.6" opacity=".5" fill="none"/>';
    case 'wrinkles':
      return '<path d="M122 118C138 114 162 114 178 118M126 126C140 123 160 123 174 126" stroke="#000" stroke-opacity=".18" stroke-width="1.4" fill="none"/><path d="M106 160l-6 3M106 154l-7 0M194 160l6 3M194 154l7 0" stroke="#000" stroke-opacity=".22" stroke-width="1.3"/><path d="M124 200C118 212 120 226 126 234M176 200C182 212 180 226 174 234" stroke="#000" stroke-opacity=".2" stroke-width="2" fill="none"/>';
    default:
      return '';
  }
}

function western(o) {
  const H = HEADS[o.jaw];
  const kid = o.jaw === 'kid';
  const ey = kid ? 160 : 153;
  const [sk1, sk2, sk3] = o.skin;
  const defs = [
    lin('skin', [[0, sk1], [0.5, sk2], [1, sk3]], 0, 0, 1, 0.2),
    lin('cloth', [[0, o.cloth[0]], [0.6, o.cloth[1]], [1, o.cloth[2]]], 0, 0, 1, 1),
    lin('cloth2', [[0, o.cloth2 ? o.cloth2[0] : o.cloth[1]], [1, o.cloth2 ? o.cloth2[1] : o.cloth[2]]], 0, 0, 1, 1),
    lin('shirt', [[0, o.shirt ? o.shirt[0] : '#e8dcc4'], [1, o.shirt ? o.shirt[1] : '#a8987a']]),
    lin('hat', [[0, o.hatColor[0]], [1, o.hatColor[1]]]),
    lin('band', [[0, o.bandColor || '#2a1a10'], [1, '#0e0806']]),
    lin('hair', [[0, o.hairColor[0]], [1, o.hairColor[1]]]),
  ].join('');
  const earL = kid ? 'M103 152C92 148 90 170 97 180C100 184 105 182 105 176Z' : 'M97 150C86 146 84 170 92 180C96 184 100 182 100 176Z';
  const earR = kid ? 'M197 152C208 148 210 170 203 180C200 184 195 182 195 176Z' : 'M203 150C214 146 216 170 208 180C204 184 200 182 200 176Z';
  const body = `
    <ellipse cx="150" cy="170" rx="140" ry="165" fill="url(#glow)"/>
    ${sunRays(o.rim)}
    ${hairBack(o.hair, o.hairColor)}
    ${outfit(o)}
    <path d="M126 ${kid ? 222 : 230}L174 ${kid ? 222 : 230}L178 278L122 278Z" fill="url(#skin)"/>
    <path d="M126 ${kid ? 228 : 236}C138 254 162 254 174 ${kid ? 228 : 236}L176 262C162 274 138 274 124 262Z" fill="#000" opacity=".28"/>
    ${neckwear(o.neck, o.neckColor)}
    ${(o.extras || []).includes('bandolier') ? extra('bandolier', o) : ''}
    ${(o.extras || []).includes('horseshoe') ? extra('horseshoe', o) : ''}
    ${(o.extras || []).includes('spyglass') ? extra('spyglass', o) : ''}
    <path d="${earL}" fill="url(#skin)"/><path d="${earR}" fill="${sk3}"/>
    <path d="${H}" fill="url(#skin)"/>
    <path d="M188 118C202 140 206 174 198 204C192 226 180 240 166 248C184 224 194 196 194 168C194 146 192 130 188 118Z" fill="#000" opacity=".2"/>
    ${facialHair(o.stubble ? 'stubble' : '', o.hairColor[1])}
    ${(o.extras || []).filter((x) => ['scar', 'eyescar', 'plaster', 'freckles', 'wrinkles', 'earrings'].includes(x)).map((x) => extra(x, o)).join('')}
    ${eye({ cx: 128, cy: ey, w: kid ? 30 : 30, h: kid ? 14 : 12.5, iris: o.iris, skin: sk2, heavy: o.heavy || 0, squint: o.squint || 0, lash: !!o.lash, side: 'L', id: 'eyeL', bag: !!o.bag })}
    ${eye({ cx: 172, cy: ey, w: kid ? 30 : 30, h: kid ? 14 : 12.5, iris: o.iris, skin: sk3, heavy: o.heavy || 0, squint: o.squint || 0, lash: !!o.lash, side: 'R', id: 'eyeR', bag: !!o.bag })}
    ${o.angry ? brow(143, ey - 10, 110, ey - 18, 1, o.browW || 5, o.hairColor[1]) + brow(157, ey - 10, 190, ey - 18, 1, o.browW || 5, o.hairColor[1]) : brow(143, ey - 14, 110, ey - 16, o.arch || 5, o.browW || 4.5, o.hairColor[1]) + brow(157, ey - 14, 190, ey - 16, o.arch || 5, o.browW || 4.5, o.hairColor[1])}
    ${nose({ cx: 150, top: ey + 8, bottom: kid ? 194 : 198, w: o.noseW || 18, shade: sk3, big: o.bigNose || 0 })}
    ${(o.extras || []).includes('lips') ? extra('lips', o) : mouth({ cx: 150, cy: kid ? 212 : 222, w: o.mouthW || 28, curve: o.smile || 0, grin: !!o.grin, gold: !!o.gold, color: '#5a2a22', lower: sk3 })}
    ${facialHair(o.beard || '', o.hairColor[1])}
    ${(o.extras || []).filter((x) => ['monocle', 'glasses', 'toothpick'].includes(x)).map((x) => extra(x, o)).join('')}
    ${hairFront(o.hair, o.hairColor, o.jaw)}
    ${hat(o.hat, o.tilt || 0)}
    ${(o.extras || []).filter((x) => ['cardInHat', 'herb', 'feather'].includes(x)).map((x) => extra(x, o)).join('')}
    ${rim([H, SHOULDERS], o.rim)}`;
  return portrait({ bg: o.bg, rimColor: o.rim, defs, body });
}

const SKIN = {
  fair: ['#f8dcc4', '#ecbd9b', '#b87a5a'],
  tan: ['#eebd96', '#d8a078', '#945e3e'],
  brown: ['#d9a070', '#b87a4e', '#6e4226'],
  ruddy: ['#f2b896', '#dc9a78', '#9a5a40'],
  pale: ['#f2dcc8', '#dcbca4', '#9a7a66'],
  old: ['#e8c0a0', '#cc9c7c', '#8a5e46'],
};

const CHARS = {
  ben: { jaw: 'square', skin: SKIN.tan, bg: [[0, '#6a4a28'], [0.6, '#2a1a0c'], [1, '#0a0604']], rim: '#ffb060', hat: 'stetson', hatColor: ['#8a5a32', '#4a2a14'], hair: 'short', hairColor: ['#4a3020', '#1e140c'], stubble: true, beard: '', outfit: 'vest', cloth: ['#6a6660', '#4a4640', '#26241e'], neck: 'bandana', neckColor: '#9e2a22', iris: '#4a3a2a', squint: 0.4, heavy: 0.2, angry: true, bag: true, extras: ['scar', 'plaster'] },
  jack: { jaw: 'narrow', skin: SKIN.pale, bg: [[0, '#3a1a2a'], [0.6, '#160a10'], [1, '#050204']], rim: '#e84a5a', hat: 'bowler', hatColor: ['#2a2a30', '#08080a'], bandColor: '#6a1a22', hair: 'slick', hairColor: ['#1e1a1e', '#060506'], beard: 'thin', outfit: 'suit', cloth: ['#1e1e24', '#0e0e12', '#040406'], cloth2: ['#a8242a', '#5a0e12'], neck: 'stringtie', iris: '#2a2a2a', heavy: 0.5, smile: 3, extras: ['cardInHat', 'toothpick'] },
  janet: { jaw: 'soft', skin: SKIN.ruddy, bg: [[0, '#7a4a22'], [0.6, '#321a0a'], [1, '#0e0604']], rim: '#ffb050', hat: 'stetson', tilt: -6, hatColor: ['#c89a5a', '#7a5228'], hair: 'braid', hairColor: ['#8a3a1a', '#4a1a0a'], outfit: 'fringe', cloth: ['#9a6a3a', '#6a4220', '#3a220e'], neck: 'bandana', neckColor: '#2a5a8a', iris: '#3a5a2a', lash: true, squint: 0.15, angry: true, browW: 3.5, extras: ['lips', 'earrings'] },
  lobo: { jaw: 'square', skin: SKIN.brown, bg: [[0, '#8a3a1a'], [0.6, '#3a1408'], [1, '#100402']], rim: '#ff8a40', hat: 'sombrero', hatColor: ['#b8864a', '#6a4420'], bandColor: '#8a1a1a', hair: 'short', hairColor: ['#2a1a12', '#0a0604'], stubble: true, beard: 'walrus', outfit: 'poncho', cloth: ['#a8342a', '#7a1e18', '#3a0a08', '#e2b23a', '#1e5a8a'], iris: '#2a1a10', squint: 0.45, angry: true, extras: ['bandolier', 'scar'] },
  jesse: { jaw: 'round', skin: SKIN.fair, bg: [[0, '#4a4a5a'], [0.6, '#1a1a24'], [1, '#06060a']], rim: '#9ab8ff', hat: 'flatcap', hatColor: ['#6a6a70', '#34343a'], hair: 'messy', hairColor: ['#6a4428', '#2e1c0e'], outfit: 'vest', cloth: ['#3a3a44', '#24242c', '#0e0e14'], neck: 'bandana', neckColor: '#6a1a22', iris: '#5a4a2a', heavy: 0.35, smile: -2, grin: false, extras: ['freckles', 'toothpick'] },
  jordan: { jaw: 'square', skin: SKIN.ruddy, bg: [[0, '#4a5058'], [0.6, '#1a1e24'], [1, '#06080a']], rim: '#cfe0f0', hat: 'bowler', hatColor: ['#6a4a2a', '#2e1e0e'], hair: 'short', hairColor: ['#b8622a', '#6a3010'], beard: 'beard', outfit: 'armor', cloth: ['#4a3a2a', '#2e2418', '#140e08'], iris: '#4a6a7a', heavy: 0.15, browW: 7, noseW: 22, bigNose: 2, extras: [] },
  kit: { jaw: 'narrow', skin: SKIN.pale, bg: [[0, '#3a2a4a'], [0.6, '#160e20'], [1, '#05030a']], rim: '#c49aff', hat: 'tophat', hatColor: ['#2a2430', '#08060a'], bandColor: '#5a2a8a', hair: 'slick', hairColor: ['#8a8a90', '#3a3a40'], beard: 'goatee', outfit: 'suit', cloth: ['#2a2430', '#141018', '#050408'], cloth2: ['#6a2a9a', '#2e0e4a'], neck: 'stringtie', iris: '#3a3a4a', heavy: 0.4, smile: 2, extras: ['monocle'] },
  luke: { jaw: 'round', skin: SKIN.tan, bg: [[0, '#7a6a2a'], [0.6, '#2e280c'], [1, '#0a0804']], rim: '#ffd860', hat: 'stetson', tilt: 8, hatColor: ['#f0e6d0', '#b8aa90'], bandColor: '#3a2a1a', hair: 'short', hairColor: ['#8a6a3a', '#4a3418'], outfit: 'vest', cloth: ['#2a4a7a', '#1a2e52', '#0a1428'], neck: 'bandana', neckColor: '#d8a22a', iris: '#3a5a8a', grin: true, gold: true, extras: ['horseshoe'] },
  paul: { jaw: 'narrow', skin: SKIN.tan, bg: [[0, '#5a3a2a'], [0.6, '#22140c'], [1, '#080404']], rim: '#ffa070', hat: 'stetson', tilt: -3, hatColor: ['#2a2420', '#0a0806'], hair: 'slick', hairColor: ['#5a3a22', '#241408'], beard: 'handlebar', outfit: 'duster', cloth: ['#4a4440', '#2a2622', '#0e0c0a'], cloth2: ['#3a3430', '#1a1614'], iris: '#4a3a2a', heavy: 0.3, smile: 4, arch: 8, extras: [] },
  pedro: { jaw: 'round', skin: SKIN.brown, bg: [[0, '#3a5a3a'], [0.6, '#142414'], [1, '#040804]'.slice(0, 7)]], rim: '#a8e070', hat: 'sombrero', hatColor: ['#6a5a2a', '#342a0e'], bandColor: '#2a5a2a', hair: 'short', hairColor: ['#1e140c', '#060402'], beard: 'goatee', outfit: 'poncho', cloth: ['#e8e0cc', '#b8aa8a', '#6a5e44', '#2a5a9a', '#b3261e'], neck: 'scarf', neckColor: '#2a6a3a', iris: '#2a1a0e', smile: 4, extras: [] },
  rose: { jaw: 'soft', skin: SKIN.fair, bg: [[0, '#2a4a3a'], [0.6, '#0e1e16'], [1, '#030806]'.slice(0, 7)]], rim: '#80e0b0', hat: 'stetson', hatColor: ['#2a4a3a', '#0e1e14'], hair: 'long', hairColor: ['#c84a1a', '#6a1e08'], outfit: 'fringe', cloth: ['#3a2a1e', '#22160e', '#0a0604'], neck: 'scarf', neckColor: '#e2c066', iris: '#2a7a5a', lash: true, squint: 0.35, angry: true, browW: 3.4, extras: ['lips', 'feather', 'spyglass'] },
  sid: { jaw: 'narrow', skin: SKIN.old, bg: [[0, '#4a5a2a'], [0.6, '#1a220c'], [1, '#060804]'.slice(0, 7)]], rim: '#d0e880', hat: 'stetson', tilt: 4, hatColor: ['#7a7064', '#3a342c'], hair: 'short', hairColor: ['#d8d4cc', '#8a867e'], beard: 'beard', outfit: 'vest', cloth: ['#6a4a2a', '#4a3018', '#221408'], iris: '#4a5a3a', heavy: 0.45, bag: true, extras: ['glasses', 'herb', 'wrinkles'] },
  cole: { jaw: 'square', skin: SKIN.pale, bg: [[0, '#2a2a2a'], [0.6, '#0e0e0e'], [1, '#020202']], rim: '#ff4a3a', hat: 'stetson', hatColor: ['#1e1e20', '#050506'], bandColor: '#5a0e0e', hair: 'short', hairColor: ['#2a2420', '#0a0806'], stubble: true, outfit: 'duster', cloth: ['#1e1e20', '#0e0e10', '#030304'], cloth2: ['#2a2a2e', '#0e0e10'], iris: '#6a7a7a', heavy: 0.55, squint: 0.35, angry: true, browW: 5.5, extras: ['eyescar'] },
  suzy: { jaw: 'soft', skin: SKIN.fair, bg: [[0, '#7a3a5a'], [0.6, '#2e1022'], [1, '#0a0408']], rim: '#ff9ad0', hat: 'lady', tilt: -8, hatColor: ['#e28ab0', '#9a4a70'], bandColor: '#6a1a3a', hair: 'curly', hairColor: ['#f0cc6a', '#c89a2a'], outfit: 'dress', cloth: ['#d85a8a', '#9a2a5a', '#4a0e28'], iris: '#3a6aa8', lash: true, smile: 5, arch: 9, browW: 3, extras: ['lips', 'earrings', 'freckles'] },
  vic: { jaw: 'narrow', skin: SKIN.old, bg: [[0, '#5a4a3a'], [0.6, '#221a12'], [1, '#080604']], rim: '#e0c090', hat: '', hatColor: ['#000', '#000'], hair: 'bald', hairColor: ['#c8c4bc', '#7a766e'], outfit: 'fur', cloth: ['#3a2a1e', '#22160e', '#0a0604'], iris: '#6a5a1a', squint: 0.3, heavy: 0.2, bigNose: 4, noseW: 22, browW: 6, angry: true, smile: -3, bag: true, extras: ['wrinkles'] },
  will: { jaw: 'kid', skin: SKIN.fair, bg: [[0, '#6a5a3a'], [0.6, '#261e10'], [1, '#080604']], rim: '#ffd080', hat: 'stetson', tilt: 10, hatColor: ['#a87a4a', '#5a3a1e'], hair: 'messy', hairColor: ['#e8c060', '#a8802a'], outfit: 'kid', cloth: ['#c8b89a', '#9a8a6a', '#4a3e2a'], neck: 'bandana', neckColor: '#b3261e', iris: '#4a6aa8', grin: true, mouthW: 26, extras: ['freckles'] },
};

module.exports = Object.fromEntries(Object.entries(CHARS).map(([id, o]) => [id, () => western(o)]));
