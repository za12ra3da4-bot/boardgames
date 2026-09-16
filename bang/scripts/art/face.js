'use strict';
// 초상화 공통 부품: 눈·눈썹·코·입·림라이트, 전신/얼굴 크롭 출력
const { svg, lin, rad, grainFilter, blur, rng, f } = require('./lib');

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
    ${bag ? `<path d="M${f(x0 + 4)} ${f(cy + h * 0.75)}C${f(cx - w * 0.15)} ${f(cy + h * 1.3)} ${f(cx + w * 0.2)} ${f(cy + h * 1.3)} ${f(x1 - 2)} ${f(cy + h * 0.7)}" fill="none" stroke="#6a3a2a" stroke-opacity=".5" stroke-width="1.5"/>` : ''}
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

function mouth({ cx, cy, w = 30, curve = 0, color = '#6a3a2e', lower = '#b06a58', grin = false, gold = false }) {
  if (grin) {
    return `
      <path d="M${cx - w / 2} ${cy - 2}C${cx - w / 4} ${cy + 12} ${cx + w / 4} ${cy + 12} ${cx + w / 2} ${cy - 2}C${cx + w / 4} ${cy + 2} ${cx - w / 4} ${cy + 2} ${cx - w / 2} ${cy - 2}Z" fill="#3a1410"/>
      <path d="M${cx - w * 0.38} ${cy}C${cx - w * 0.2} ${cy + 3} ${cx + w * 0.2} ${cy + 3} ${cx + w * 0.38} ${cy}L${cx + w * 0.34} ${cy + 3}C${cx + w * 0.15} ${cy + 5} ${cx - w * 0.15} ${cy + 5} ${cx - w * 0.34} ${cy + 3}Z" fill="#f4efe4"/>
      ${gold ? `<rect x="${cx + 3}" y="${cy + 0.5}" width="4" height="3.5" fill="#e2b23a"/>` : ''}
      <path d="M${cx - w / 2} ${cy - 2}C${cx - w / 4} ${cy + 12} ${cx + w / 4} ${cy + 12} ${cx + w / 2} ${cy - 2}" fill="none" stroke="${color}" stroke-width="2.2"/>`;
  }
  return `
    <path d="M${cx - w / 2} ${cy}C${cx - w / 6} ${cy + curve} ${cx + w / 6} ${cy + curve} ${cx + w / 2} ${cy}" fill="none" stroke="${color}" stroke-width="2.7" stroke-linecap="round"/>
    <path d="M${cx - w * 0.3} ${cy + 5}C${cx - w * 0.1} ${cy + 10} ${cx + w * 0.1} ${cy + 10} ${cx + w * 0.3} ${cy + 5}" fill="none" stroke="${lower}" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M${cx - w * 0.25} ${cy + 13}C${cx - w * 0.08} ${cy + 15} ${cx + w * 0.08} ${cy + 15} ${cx + w * 0.25} ${cy + 13}" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="3"/>`;
}

const rim = (paths, color, width = 5) =>
  `<g mask="url(#rimMask)" opacity=".8" filter="url(#soft)">${paths.map((d) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`).join('')}</g>`;

function scatter(seed, n, box) {
  const r = rng(seed);
  return Array.from({ length: n }, () => [box[0] + r() * (box[2] - box[0]), box[1] + r() * (box[3] - box[1])]);
}

function portrait({ bg, rimColor, defs, body }) {
  const allDefs = `
    ${rad('bg', bg, 0.5, 0.36, 0.8)}
    ${lin('rimFade', [[0, '#000'], [0.52, '#000'], [1, '#fff']], 0, 0, 1, 0)}
    <mask id="rimMask" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="380"><rect width="300" height="380" fill="url(#rimFade)"/></mask>
    ${rad('vig', [[0.5, '#000', 0], [1, '#000', 0.75]], 0.5, 0.42, 0.78)}
    ${rad('glow', [[0, rimColor, 0.4], [1, rimColor, 0]], 0.5, 0.5, 0.5)}
    ${grainFilter('grain')}
    ${blur('soft', 1.6)}
    ${lin('brass', [[0, '#fff1b8'], [0.45, '#d8a93c'], [1, '#6e4a12']])}
    ${lin('steel', [[0, '#eef2f6'], [0.5, '#9aa3ae'], [1, '#4a5058']])}
    ${defs}`;
  const content = `<rect width="300" height="380" fill="url(#bg)"/>${body}<rect width="300" height="380" fill="url(#vig)"/><rect width="300" height="380" filter="url(#grain)" opacity=".14"/>`;
  return {
    full: svg(300, 380, content, { defs: allDefs }),
    face: svg(200, 200, content, { defs: allDefs, vb: '46 40 208 208' }),
  };
}

module.exports = { eye, brow, nose, mouth, rim, scatter, portrait };
