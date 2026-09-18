'use strict';
// 손그림 도구: 굵기가 변하는 붓선, 펜 빗금, 번지는 수채 물감 (도형을 합치지 않고 선을 긋는다)
const { f, rng } = require('../../../wolf/scripts/art/draw');

/** Catmull-Rom 으로 점들을 부드럽게 잇는다 */
function smooth(pts, steps = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * 붓선 하나: 시작과 끝이 가늘고 가운데가 굵은 잉크 자국.
 * 손 떨림(jit)과 굵기 변화(press)를 준다.
 */
function stroke(r, pts, { w = 3, color = '#140c08', op = 1, jit = 0.8, taper = 0.25, press = 0.35 } = {}) {
  const sp = smooth(pts.map(([x, y]) => [x + (r() - 0.5) * jit * 2, y + (r() - 0.5) * jit * 2]));
  const n = sp.length;
  const L = [];
  const R = [];
  const phase = r() * 6;
  for (let i = 0; i < n; i++) {
    const [x, y] = sp[i];
    const [ax, ay] = sp[Math.max(0, i - 1)];
    const [bx, by] = sp[Math.min(n - 1, i + 1)];
    let dx = bx - ax;
    let dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const t = i / (n - 1);
    const tp = Math.min(1, t / taper, (1 - t) / taper);
    const ww = (w / 2) * Math.max(0.12, tp) * (1 + Math.sin(t * 7 + phase) * press * 0.5);
    L.push([x - dy * ww, y + dx * ww]);
    R.push([x + dy * ww, y - dx * ww]);
  }
  const d = `M${L.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}L${R.reverse().map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
  return `<path d="${d}" fill="${color}" opacity="${op}"/>`;
}

/** 같은 선을 두세 번 겹쳐 그은 듯한 윤곽선 */
function inkLine(r, pts, opts = {}) {
  const k = opts.passes || 2;
  let s = '';
  for (let i = 0; i < k; i++) s += stroke(r, pts, { ...opts, w: (opts.w || 3) * (i ? 0.6 : 1), op: (opts.op || 1) * (i ? 0.55 : 1), jit: (opts.jit || 0.8) * (1 + i) });
  return s;
}

/**
 * 펜 빗금: clipId 안쪽을 angle 방향 평행선으로 채운다.
 * cross: 교차 빗금을 한 겹 더
 */
function hatch(r, clipId, box, { angle = -35, gap = 5, w = 1.1, color = '#140c08', op = 0.7, cross = false, len = 1 } = {}) {
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const one = (ang) => {
    let s = '';
    const a = (ang * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    for (let o = -R; o <= R; o += gap * (0.8 + r() * 0.4)) {
      const px = cx - uy * o;
      const py = cy + ux * o;
      const half = R * len * (0.7 + r() * 0.3);
      const sx = px - ux * half;
      const sy = py - uy * half;
      const ex = px + ux * half;
      const ey = py + uy * half;
      const mx = (sx + ex) / 2 + (r() - 0.5) * 3;
      const my = (sy + ey) / 2 + (r() - 0.5) * 3;
      s += `<path d="M${f(sx)} ${f(sy)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" stroke="${color}" stroke-width="${f(w * (0.7 + r() * 0.6))}" fill="none" stroke-linecap="round" opacity="${f(op * (0.7 + r() * 0.3))}"/>`;
    }
    return s;
  };
  return `<g clip-path="url(#${clipId})">${one(angle)}${cross ? one(angle + 70) : ''}</g>`;
}

/** 수채 물감: 가장자리가 번지고 진해지는 얼룩 (filter 'wc' 필요) */
function wash(d, color, op = 0.8, filter = 'wc') {
  return `<path d="${d}" fill="${color}" opacity="${op}" filter="url(#${filter})"/>`;
}

/** 수채 필터: 가장자리 번짐 + 테두리 진해짐 + 얼룩 */
const washFilter = (id, seed = 3, scale = 10) => `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="${seed}" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feMorphology in="d" operator="erode" radius="2" result="e"/>
  <feComposite in="d" in2="e" operator="out" result="edge0"/>
  <feColorMatrix in="edge0" type="matrix" values=".55 0 0 0 0  0 .55 0 0 0  0 0 .55 0 0  0 0 0 .7 0" result="edge"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="${seed + 5}" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 1.1" result="ga"/>
  <feComposite in="d" in2="ga" operator="in" result="grainy"/>
  <feMerge><feMergeNode in="grainy"/><feMergeNode in="edge"/></feMerge>
</filter>`;

/** 짧은 털 붓질을 영역 안에 흩뿌린다 */
function furStrokes(r, n, inside, { len = [10, 22], w = [1.2, 3], colors = ['#140c08', '#2a1c14', '#5a4436'], dir = [0.2, 1] } = {}) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = inside(r);
    const L = len[0] + r() * (len[1] - len[0]);
    const dx = (dir[0] + (r() - 0.5) * 0.6) * L;
    const dy = (dir[1] + (r() - 0.5) * 0.3) * L;
    s += stroke(r, [[x, y], [x + dx * 0.5 + (r() - 0.5) * 4, y + dy * 0.5], [x + dx, y + dy]], { w: w[0] + r() * (w[1] - w[0]), color: colors[Math.floor(r() * colors.length)], jit: 0.4, op: 0.85 });
  }
  return s;
}

module.exports = { smooth, stroke, inkLine, hatch, wash, washFilter, furStrokes, rng, f };
