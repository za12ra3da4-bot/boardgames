'use strict';
// 역할 카드용 반신 초상화 그리기 도구 (400×400, 달빛 역광 + 유화 느낌)
const { f, mix } = require('./draw');

/** 얼굴 윤곽: 가운데 (cx, cy), 너비 w, 높이 h, 턱 뾰족함 jaw(0~1) */
function faceShape(cx, cy, w, h, jaw = 0.5) {
  const hw = w / 2;
  const top = cy - h * 0.52;
  const cheek = cy + h * 0.08;
  const chinY = cy + h * 0.48;
  const chinW = hw * (0.55 - jaw * 0.35);
  return `M${f(cx)} ${f(top)}
    C${f(cx + hw * 0.62)} ${f(top)} ${f(cx + hw)} ${f(top + h * 0.2)} ${f(cx + hw)} ${f(cy - h * 0.08)}
    C${f(cx + hw)} ${f(cheek)} ${f(cx + hw * 0.92)} ${f(cy + h * 0.24)} ${f(cx + chinW + hw * 0.18)} ${f(cy + h * 0.38)}
    C${f(cx + chinW)} ${f(chinY - 2)} ${f(cx + chinW * 0.5)} ${f(chinY)} ${f(cx)} ${f(chinY)}
    C${f(cx - chinW * 0.5)} ${f(chinY)} ${f(cx - chinW)} ${f(chinY - 2)} ${f(cx - chinW - hw * 0.18)} ${f(cy + h * 0.38)}
    C${f(cx - hw * 0.92)} ${f(cy + h * 0.24)} ${f(cx - hw)} ${f(cheek)} ${f(cx - hw)} ${f(cy - h * 0.08)}
    C${f(cx - hw)} ${f(top + h * 0.2)} ${f(cx - hw * 0.62)} ${f(top)} ${f(cx)} ${f(top)}Z`;
}

/** 눈: open 0(감음)~1, look -1~1 (좌우 시선), mood: 'calm'|'sly'|'wide'|'sad'|'sleepy' */
function eye(x, y, s, { open = 1, look = 0, iris = '#4a3a2a', mood = 'calm', glow = null, side = 1 } = {}) {
  const w = s;
  const h = s * 0.46 * open;
  const lidTilt = { calm: 0, sly: -0.22, wide: 0.05, sad: 0.25, sleepy: 0 }[mood] * side;
  let o = '';
  if (open > 0.05) {
    // 흰자
    o += `<path d="M${f(x - w / 2)} ${f(y)}Q${f(x)} ${f(y - h - lidTilt * s)} ${f(x + w / 2)} ${f(y - lidTilt * s * 0.4)}Q${f(x)} ${f(y + h * 0.9)} ${f(x - w / 2)} ${f(y)}Z" fill="${glow ? '#2a1a04' : '#efe6d8'}"/>`;
    const ix = x + look * w * 0.18;
    const ir = s * 0.24 * (mood === 'wide' ? 0.8 : 1);
    o += `<clipPath id="ec${f(x)}${f(y)}"><path d="M${f(x - w / 2)} ${f(y)}Q${f(x)} ${f(y - h - lidTilt * s)} ${f(x + w / 2)} ${f(y - lidTilt * s * 0.4)}Q${f(x)} ${f(y + h * 0.9)} ${f(x - w / 2)} ${f(y)}Z"/></clipPath>`;
    o += `<g clip-path="url(#ec${f(x)}${f(y)})">`;
    if (glow) {
      o += `<circle cx="${f(ix)}" cy="${f(y)}" r="${f(ir * 1.3)}" fill="${glow}"/><ellipse cx="${f(ix)}" cy="${f(y)}" rx="${f(ir * 0.25)}" ry="${f(ir * 0.9)}" fill="#1a0a00"/>`;
    } else {
      o += `<circle cx="${f(ix)}" cy="${f(y + h * 0.05)}" r="${f(ir)}" fill="${iris}"/><circle cx="${f(ix)}" cy="${f(y + h * 0.05)}" r="${f(ir * 0.5)}" fill="#0a0604"/>`;
      o += `<path d="M${f(x - w / 2)} ${f(y)}Q${f(x)} ${f(y - h - lidTilt * s)} ${f(x + w / 2)} ${f(y - lidTilt * s * 0.4)}" stroke="#000" stroke-opacity=".35" stroke-width="${f(s * 0.22)}" fill="none"/>`;
    }
    o += `<circle cx="${f(ix + ir * 0.35)}" cy="${f(y - ir * 0.35)}" r="${f(ir * 0.28)}" fill="#fff" opacity=".9"/></g>`;
  }
  // 윗눈꺼풀 선
  o += `<path d="M${f(x - w / 2 - s * 0.06)} ${f(y + s * 0.02)}Q${f(x)} ${f(y - h - lidTilt * s - s * 0.04)} ${f(x + w / 2 + s * 0.04)} ${f(y - lidTilt * s * 0.4)}" stroke="#1a0e08" stroke-width="${f(s * 0.09)}" fill="none" stroke-linecap="round"/>`;
  if (mood === 'sleepy' || mood === 'sad') o += `<path d="M${f(x - w * 0.42)} ${f(y + h * 0.9 + s * 0.12)}Q${f(x)} ${f(y + h + s * 0.3)} ${f(x + w * 0.42)} ${f(y + h * 0.9 + s * 0.12)}" stroke="#5a3048" stroke-width="${f(s * 0.12)}" fill="none" opacity=".45" stroke-linecap="round"/>`;
  return o;
}

function brow(x, y, len, angle, { thick = 4, color = '#2a1a10', side = 1 } = {}) {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a) * len / 2;
  const dy = Math.sin(a) * len / 2 * side;
  return `<path d="M${f(x - dx)} ${f(y - dy)}Q${f(x)} ${f(y - thick * 0.9)} ${f(x + dx)} ${f(y + dy)}" stroke="${color}" stroke-width="${thick}" fill="none" stroke-linecap="round"/>`;
}

function nose(x, y, s, skinDark) {
  return `<path d="M${f(x - s * 0.05)} ${f(y - s * 0.9)}C${f(x - s * 0.02)} ${f(y - s * 0.4)} ${f(x + s * 0.25)} ${f(y - s * 0.1)} ${f(x + s * 0.2)} ${f(y + s * 0.08)}" stroke="${skinDark}" stroke-width="${f(s * 0.08)}" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M${f(x - s * 0.28)} ${f(y + s * 0.05)}Q${f(x - s * 0.18)} ${f(y + s * 0.2)} ${f(x - s * 0.04)} ${f(y + s * 0.12)}M${f(x + s * 0.08)} ${f(y + s * 0.14)}Q${f(x + s * 0.24)} ${f(y + s * 0.2)} ${f(x + s * 0.3)} ${f(y + s * 0.04)}" stroke="${skinDark}" stroke-width="${f(s * 0.07)}" fill="none" stroke-linecap="round"/>
    <ellipse cx="${f(x + s * 0.05)}" cy="${f(y - s * 0.1)}" rx="${f(s * 0.08)}" ry="${f(s * 0.14)}" fill="#fff" opacity=".22"/>`;
}

/** 입: curve>0 웃음, <0 찡그림, open 벌림 정도, grin 이 보이는지 */
function mouth(x, y, w, { curve = 0.2, open = 0, teeth = false, lip = '#8a3a30', skew = 0 } = {}) {
  const c = curve * w * 0.4;
  const l = { x: x - w / 2, y: y - c + skew * w * 0.2 };
  const r = { x: x + w / 2, y: y - c - skew * w * 0.2 };
  let o = '';
  if (open > 0) {
    o += `<path d="M${f(l.x)} ${f(l.y)}Q${f(x)} ${f(y + c * 0.6 - 2)} ${f(r.x)} ${f(r.y)}Q${f(x)} ${f(y + c + open * w * 0.5)} ${f(l.x)} ${f(l.y)}Z" fill="#2a0a08"/>`;
    if (teeth) o += `<path d="M${f(l.x + w * 0.1)} ${f(l.y + 1)}Q${f(x)} ${f(y + c * 0.6)} ${f(r.x - w * 0.1)} ${f(r.y + 1)}L${f(r.x - w * 0.14)} ${f(r.y + w * 0.08)}Q${f(x)} ${f(y + c * 0.6 + w * 0.1)} ${f(l.x + w * 0.14)} ${f(l.y + w * 0.08)}Z" fill="#f4ecd8"/>`;
  }
  o += `<path d="M${f(l.x)} ${f(l.y)}Q${f(x)} ${f(y + c * 0.6 + (open ? -2 : 0))} ${f(r.x)} ${f(r.y)}" stroke="#3a1410" stroke-width="${f(w * 0.06)}" fill="none" stroke-linecap="round"/>`;
  o += `<path d="M${f(x - w * 0.28)} ${f(y + w * 0.1 + Math.max(0, c * 0.3) + open * w * 0.4)}Q${f(x)} ${f(y + w * 0.2 + Math.max(0, c * 0.4) + open * w * 0.45)} ${f(x + w * 0.28)} ${f(y + w * 0.1 + Math.max(0, c * 0.3) + open * w * 0.4)}" stroke="${lip}" stroke-width="${f(w * 0.08)}" fill="none" stroke-linecap="round" opacity=".55"/>`;
  return o;
}

/** 어깨·몸통 */
function shoulders(cx, top, w, color, { collar = 'v', dark = null } = {}) {
  const d = dark || mix(color, '#000', 0.5);
  const y = top;
  let o = `<path d="M${f(cx - w * 0.14)} ${f(y - 10)}C${f(cx - w * 0.3)} ${f(y + 6)} ${f(cx - w * 0.5)} ${f(y + 20)} ${f(cx - w * 0.56)} ${f(y + 80)}L${f(cx - w * 0.62)} 400H${f(cx + w * 0.62)}L${f(cx + w * 0.56)} ${f(y + 80)}C${f(cx + w * 0.5)} ${f(y + 20)} ${f(cx + w * 0.3)} ${f(y + 6)} ${f(cx + w * 0.14)} ${f(y - 10)}Z" fill="${color}"/>`;
  // 옷 주름
  o += `<path d="M${f(cx - w * 0.36)} ${f(y + 60)}q10 50 -4 110M${f(cx + w * 0.34)} ${f(y + 50)}q-12 60 6 120M${f(cx - w * 0.1)} ${f(y + 90)}q6 40 -2 80" stroke="${d}" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>`;
  if (collar === 'v') o += `<path d="M${f(cx - w * 0.16)} ${f(y - 6)}L${f(cx)} ${f(y + 56)}L${f(cx + w * 0.16)} ${f(y - 6)}Z" fill="${d}"/>`;
  if (collar === 'shirt') o += `<path d="M${f(cx - w * 0.16)} ${f(y - 8)}L${f(cx - w * 0.02)} ${f(y + 40)}L${f(cx - w * 0.2)} ${f(y + 30)}Z M${f(cx + w * 0.16)} ${f(y - 8)}L${f(cx + w * 0.02)} ${f(y + 40)}L${f(cx + w * 0.2)} ${f(y + 30)}Z" fill="#e8dcc0" stroke="${d}" stroke-width="2"/>`;
  if (collar === 'round') o += `<path d="M${f(cx - w * 0.18)} ${f(y - 6)}Q${f(cx)} ${f(y + 30)} ${f(cx + w * 0.18)} ${f(y - 6)}" stroke="${d}" stroke-width="6" fill="none"/>`;
  return o;
}

/** 목 */
function neck(cx, y0, y1, w, skin, skinDark) {
  return `<path d="M${f(cx - w / 2)} ${f(y0)}L${f(cx - w / 2 - 3)} ${f(y1)}Q${f(cx)} ${f(y1 + 14)} ${f(cx + w / 2 + 3)} ${f(y1)}L${f(cx + w / 2)} ${f(y0)}Z" fill="${skin}"/>
    <path d="M${f(cx - w / 2)} ${f(y0)}L${f(cx - w / 2 - 3)} ${f(y1)}Q${f(cx)} ${f(y1 + 14)} ${f(cx + w / 2 + 3)} ${f(y1)}L${f(cx + w / 2)} ${f(y0)}Q${f(cx)} ${f(y0 + 26)} ${f(cx - w / 2)} ${f(y0)}Z" fill="${skinDark}" opacity=".55"/>`;
}

/**
 * 얼굴 한 장 완성
 * o: { cx, cy, w, h, jaw, skin, eyes:{...}, brows:{angle,thick,color,lift}, mouth:{...}, blush, beard, scar, lightDir }
 */
function face(o) {
  const { cx, cy, w, h, jaw = 0.5, skin = '#e8b890', lightDir = 1, id = 'f' } = o;
  const skinDark = mix(skin, '#3a1a10', 0.45);
  const skinLight = mix(skin, '#fff4e0', 0.35);
  const shape = faceShape(cx, cy, w, h, jaw);
  const ex = w * 0.2;
  const ey = cy - h * 0.05;
  const es = w * 0.2;
  const e = o.eyes || {};
  const b = o.brows || {};
  let s = '';
  // 귀
  if (!o.noEars) {
    for (const side of [-1, 1]) {
      s += `<path d="M${f(cx + side * w * 0.48)} ${f(cy - h * 0.1)}C${f(cx + side * w * 0.62)} ${f(cy - h * 0.2)} ${f(cx + side * w * 0.66)} ${f(cy + h * 0.06)} ${f(cx + side * w * 0.47)} ${f(cy + h * 0.12)}Z" fill="${side === lightDir ? skin : skinDark}"/>`;
    }
  }
  s += `<defs><clipPath id="${id}-clip"><path d="${shape}"/></clipPath>
    <radialGradient id="${id}-shade" cx="${lightDir > 0 ? 0.7 : 0.3}" cy=".35" r=".8"><stop offset="0" stop-color="${skinLight}"/><stop offset=".45" stop-color="${skin}"/><stop offset="1" stop-color="${skinDark}"/></radialGradient></defs>`;
  s += `<path d="${shape}" fill="url(#${id}-shade)"/>`;
  s += `<g clip-path="url(#${id}-clip)">`;
  // 그늘진 반쪽 (달 반대편)
  s += `<ellipse cx="${f(cx - lightDir * w * 0.62)}" cy="${f(cy + h * 0.1)}" rx="${f(w * 0.42)}" ry="${f(h * 0.7)}" fill="${skinDark}" opacity=".5"/>`;
  // 눈두덩 그늘
  s += `<ellipse cx="${f(cx - ex)}" cy="${f(ey - es * 0.1)}" rx="${f(es * 0.8)}" ry="${f(es * 0.5)}" fill="${skinDark}" opacity=".35"/><ellipse cx="${f(cx + ex)}" cy="${f(ey - es * 0.1)}" rx="${f(es * 0.8)}" ry="${f(es * 0.5)}" fill="${skinDark}" opacity=".35"/>`;
  if (o.blush !== false) s += `<ellipse cx="${f(cx - w * 0.28)}" cy="${f(cy + h * 0.14)}" rx="${f(w * 0.12)}" ry="${f(h * 0.06)}" fill="${o.blush || '#d8604a'}" opacity=".28"/><ellipse cx="${f(cx + w * 0.28)}" cy="${f(cy + h * 0.14)}" rx="${f(w * 0.12)}" ry="${f(h * 0.06)}" fill="${o.blush || '#d8604a'}" opacity=".28"/>`;
  if (o.stubble) s += `<path d="M${f(cx - w * 0.44)} ${f(cy + h * 0.12)}Q${f(cx)} ${f(cy + h * 0.2)} ${f(cx + w * 0.44)} ${f(cy + h * 0.12)}L${f(cx + w * 0.4)} ${f(cy + h * 0.6)}H${f(cx - w * 0.4)}Z" fill="${o.stubble}" opacity=".35"/>`;
  // 턱 밑 그늘
  s += `<ellipse cx="${f(cx)}" cy="${f(cy + h * 0.58)}" rx="${f(w * 0.5)}" ry="${f(h * 0.14)}" fill="${skinDark}" opacity=".45"/>`;
  s += '</g>';
  // 윤곽선 (붓 자국)
  s += `<path d="${shape}" fill="none" stroke="${mix(skinDark, '#000', 0.4)}" stroke-width="2.2" opacity=".6"/>`;
  // 림라이트 (달빛)
  s += `<path d="${shape}" fill="none" stroke="#dfe8ff" stroke-width="3" opacity=".55" clip-path="url(#${id}-rim)"/>`;
  s += `<defs><clipPath id="${id}-rim"><rect x="${lightDir > 0 ? cx + w * 0.25 : cx - w}" y="${cy - h}" width="${w * 0.75}" height="${h * 2}"/></clipPath></defs>`;
  // 이목구비
  const side = (k) => ({ ...e, side: k, look: e.look ?? 0 });
  s += eye(cx - ex, ey, es, side(-1));
  s += eye(cx + ex, ey, es, side(1));
  const bl = b.lift ?? 0;
  s += brow(cx - ex, ey - es * 0.75 - bl, es * 1.25, -(b.angle ?? 8), { thick: b.thick ?? 4, color: b.color, side: 1 });
  s += brow(cx + ex, ey - es * 0.75 - bl * (b.asym ?? 1), es * 1.25, b.angle ?? 8, { thick: b.thick ?? 4, color: b.color, side: 1 });
  s += nose(cx + lightDir * w * 0.02, cy + h * 0.14, w * 0.2, skinDark);
  s += mouth(cx, cy + h * 0.3, w * 0.34, { lip: mix(skin, '#8a2020', 0.5), ...(o.mouth || {}) });
  if (o.beard) s += o.beard;
  return s;
}

module.exports = { faceShape, face, eye, brow, nose, mouth, shoulders, neck };
