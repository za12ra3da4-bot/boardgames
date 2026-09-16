// 3D 저택 보드 (three.js): 벽지·징두리판·창문·그림·러그·가구·조명·말 피규어·흉기·주사위·테이블 소품
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const { W, H, ROOMS, ROOM, SUSPECTS, WEAPONS, CENTER, parseKey, grid } = window.CLUE;
const PX = 64;
const T = 0.14;
const WALL = { top: 1.05, side: 0.74, bottom: 0.34 };
const RAIL = 0.42;

const cx = (x) => x - W / 2 + 0.5;
const cz = (y) => y - H / 2 + 0.5;
const ex = (x) => x - W / 2;
const ez = (y) => y - H / 2;
const rb = (r) => {
  const [x, y, w, h] = r.rect;
  return { x0: ex(x), z0: ez(y), x1: ex(x + w), z1: ez(y + h), w, h, cx: ex(x) + w / 2, cz: ez(y) + h / 2 };
};
const sfx = (name) => { if (typeof SFX !== 'undefined') SFX[name](); };

let seedN = 20240915;
const rnd = () => (seedN = (seedN * 16807) % 2147483647) / 2147483647;

let renderer, scene, camera, controls, clock, hemi, container;
let onPick = null;
let lastState = null;
let myChar = null;
let curChar = null;
let reachGroup, pathGroup, suggestMesh, reachKey = '', reach = null, hovered = null;
let camTween = null;
let flashLevel = 0;
let down = null;
let dust = null;
const tokens = {};
const weaponObjs = {};
const flames = [];
const flickers = [];
const tweens = [];
const labelDrawers = [];
const dice = [];
const MAT = {};
const TEX = {};

// ───────────────────────── 기본 헬퍼

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cylG = (rt, rb2, h, s = 20) => new THREE.CylinderGeometry(rt, rb2, h, s);
function add(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function group(parent, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function canvasTex(cv, repeat = false) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function grain(g, w, h, amount) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 255 * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}
function tween(dur, fn, done) {
  tweens.push({ t: 0, dur, fn, done });
}
function svgTexture(url, w, h, draw) {
  const cv = canvas(w, h);
  const tex = canvasTex(cv);
  const img = new Image();
  img.onload = () => {
    const g = cv.getContext('2d');
    if (draw) draw(g, img, w, h);
    else g.drawImage(img, 0, 0, w, h);
    tex.needsUpdate = true;
  };
  img.src = url;
  return tex;
}
function candle(parent, x, y, z, s = 1) {
  add(parent, cylG(0.035 * s, 0.035 * s, 0.18 * s, 10), MAT.cream, x, y + 0.09 * s, z);
  const fl = add(parent, new THREE.ConeGeometry(0.03 * s, 0.09 * s, 8), MAT.flame, x, y + 0.23 * s, z, false);
  fl.userData.dynamic = true;
  flames.push(fl);
  return fl;
}
function turnedLeg(parent, x, z, h, mat) {
  const pts = [[0.045, 0], [0.03, 0.08], [0.045, 0.2], [0.028, 0.4], [0.05, h * 0.78], [0.04, h]].map(([a, b]) => new THREE.Vector2(a, Math.min(b, h)));
  add(parent, new THREE.LatheGeometry(pts, 10), mat, x, 0, z);
}
function table(parent, x, z, w, d, h, m) {
  add(parent, boxG(w, 0.07, d), m, x, h, z);
  add(parent, boxG(w - 0.12, 0.1, d - 0.12), m, x, h - 0.08, z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) turnedLeg(parent, x + sx * (w / 2 - 0.1), z + sz * (d / 2 - 0.1), h - 0.03, m);
}
function chair(parent, x, z, ry, cushion) {
  const g = group(parent, x, 0, z, ry);
  add(g, boxG(0.44, 0.08, 0.44), cushion, 0, 0.46, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) turnedLeg(g, sx * 0.18, sz * 0.18, 0.42, MAT.darkWood);
  add(g, boxG(0.44, 0.06, 0.06), MAT.darkWood, 0, 1.02, -0.2);
  for (const sx of [-0.18, -0.06, 0.06, 0.18]) add(g, boxG(0.03, 0.5, 0.03), MAT.darkWood, sx, 0.76, -0.2);
  return g;
}
function armchair(parent, x, z, ry, m) {
  const g = group(parent, x, 0, z, ry);
  add(g, boxG(0.8, 0.3, 0.7), m, 0, 0.28, 0);
  add(g, boxG(0.72, 0.1, 0.62), MAT.velvetLight, 0, 0.47, 0.02);
  add(g, boxG(0.8, 0.66, 0.18), m, 0, 0.6, -0.28);
  add(g, boxG(0.16, 0.44, 0.7), m, -0.4, 0.42, 0);
  add(g, boxG(0.16, 0.44, 0.7), m, 0.4, 0.42, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, cylG(0.03, 0.02, 0.13, 8), MAT.darkWood, sx * 0.34, 0.065, sz * 0.28);
  return g;
}

// ───────────────────────── 캔버스 텍스처

function ornament(g, x, y, s, color) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, -30);
  g.bezierCurveTo(10, -18, 18, -8, 8, 4);
  g.bezierCurveTo(20, 0, 26, 12, 14, 20);
  g.bezierCurveTo(8, 24, 4, 18, 0, 30);
  g.bezierCurveTo(-4, 18, -8, 24, -14, 20);
  g.bezierCurveTo(-26, 12, -20, 0, -8, 4);
  g.bezierCurveTo(-18, -8, -10, -18, 0, -30);
  g.fill();
  g.globalAlpha = 0.35;
  g.fillStyle = '#000';
  g.beginPath();
  g.arc(0, -2, 4, 0, 7);
  g.fill();
  g.restore();
}

function woodCanvas(w, h, base, dark, planks = 4) {
  const cv = canvas(w, h);
  const g = cv.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const size = h / planks;
  for (let i = 0; i < planks; i++) {
    g.fillStyle = `rgba(${i % 2 ? '255,220,170' : '0,0,0'},${0.04 + rnd() * 0.06})`;
    g.fillRect(0, i * size, w, size);
    g.strokeStyle = dark;
    g.globalAlpha = 0.28;
    g.lineWidth = 1;
    for (let k = 0; k < 7; k++) {
      g.beginPath();
      const off = rnd() * size;
      for (let t = 0; t <= w; t += 6) {
        const yy = i * size + off + Math.sin(t * 0.02 + k * 2) * 2 + Math.sin(t * 0.07 + k) * 0.8;
        if (t === 0) g.moveTo(t, yy);
        else g.lineTo(t, yy);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(0,0,0,.5)';
    g.fillRect(0, i * size, w, 2);
    g.fillRect((rnd() * w) | 0, i * size, 2, size);
  }
  grain(g, w, h, 0.05);
  return cv;
}

function wallpaperCanvas(kind, c1, c2) {
  const cv = canvas(128, 128);
  const g = cv.getContext('2d');
  g.fillStyle = c1;
  g.fillRect(0, 0, 128, 128);
  if (kind === 'damask') {
    ornament(g, 32, 34, 0.95, c2);
    ornament(g, 96, 98, 0.95, c2);
    g.fillStyle = c2;
    g.globalAlpha = 0.55;
    for (const [x, y] of [[96, 34], [32, 98]]) {
      g.beginPath();
      g.moveTo(x, y - 8);
      g.lineTo(x + 6, y);
      g.lineTo(x, y + 8);
      g.lineTo(x - 6, y);
      g.fill();
    }
    g.globalAlpha = 1;
  } else if (kind === 'stripe') {
    g.fillStyle = c2;
    for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 14, 128);
    g.fillStyle = 'rgba(217,180,90,.4)';
    for (let x = 0; x < 128; x += 32) g.fillRect(x + 21, 0, 2, 128);
  } else if (kind === 'tile') {
    g.fillStyle = c2;
    for (let y = 0; y < 128; y += 16) {
      g.fillRect(0, y, 128, 2);
      for (let x = (y / 16) % 2 ? 0 : 16; x < 128; x += 32) g.fillRect(x, y, 2, 16);
    }
  } else if (kind === 'panel') {
    g.fillStyle = c2;
    g.fillRect(10, 10, 108, 108);
    g.strokeStyle = 'rgba(255,220,170,.25)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(10, 118);
    g.lineTo(10, 10);
    g.lineTo(118, 10);
    g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.55)';
    g.beginPath();
    g.moveTo(118, 10);
    g.lineTo(118, 118);
    g.lineTo(10, 118);
    g.stroke();
  }
  grain(g, 128, 128, 0.07);
  return cv;
}

function wainscotCanvas() {
  const cv = woodCanvas(128, 128, '#3a2414', '#140804', 2);
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(255,215,160,.28)';
  g.lineWidth = 4;
  g.strokeRect(16, 18, 96, 92);
  g.strokeStyle = 'rgba(0,0,0,.6)';
  g.lineWidth = 3;
  g.strokeRect(22, 24, 84, 80);
  g.fillStyle = 'rgba(0,0,0,.2)';
  g.fillRect(22, 24, 84, 80);
  return cv;
}

function glassCanvas() {
  const cv = canvas(128, 128);
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(150,200,220,.16)';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#26332e';
  g.fillRect(0, 0, 128, 7);
  g.fillRect(0, 0, 7, 128);
  g.fillRect(60, 0, 5, 128);
  g.fillRect(0, 60, 128, 4);
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.fillRect(14, 12, 6, 44);
  return cv;
}

function rugCanvas(base, border, accent, round = false) {
  const S = 512;
  const cv = canvas(S, S);
  const g = cv.getContext('2d');
  if (round) {
    const rings = [[250, border], [236, accent], [226, base], [150, border], [138, accent], [128, base], [64, border], [40, accent]];
    for (const [r, c] of rings) {
      g.fillStyle = c;
      g.beginPath();
      g.arc(256, 256, r, 0, 7);
      g.fill();
    }
    g.fillStyle = accent;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.save();
      g.translate(256 + Math.cos(a) * 188, 256 + Math.sin(a) * 188);
      g.rotate(a);
      g.beginPath();
      g.ellipse(0, 0, 22, 9, 0, 0, 7);
      g.fill();
      g.restore();
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.save();
      g.translate(256 + Math.cos(a) * 96, 256 + Math.sin(a) * 96);
      g.rotate(a + Math.PI / 2);
      ornament(g, 0, 0, 0.8, border);
      g.restore();
    }
  } else {
    g.fillStyle = border;
    g.fillRect(0, 0, S, S);
    g.fillStyle = accent;
    g.fillRect(18, 18, S - 36, S - 36);
    g.fillStyle = border;
    g.fillRect(28, 28, S - 56, S - 56);
    for (let i = 0; i < 12; i++) {
      const p = 44 + i * 36.5;
      for (const [x, y] of [[p, 44], [p, S - 44], [44, p], [S - 44, p]]) {
        g.fillStyle = accent;
        g.beginPath();
        g.moveTo(x, y - 9);
        g.lineTo(x + 9, y);
        g.lineTo(x, y + 9);
        g.lineTo(x - 9, y);
        g.fill();
      }
    }
    g.fillStyle = base;
    g.fillRect(64, 64, S - 128, S - 128);
    g.globalAlpha = 0.35;
    for (let y = 90; y < S - 90; y += 40) {
      for (let x = 90; x < S - 90; x += 40) ornament(g, x, y, 0.35, accent);
    }
    g.globalAlpha = 1;
    g.fillStyle = border;
    g.beginPath();
    g.ellipse(256, 256, 120, 80, 0, 0, 7);
    g.fill();
    g.fillStyle = accent;
    g.beginPath();
    g.ellipse(256, 256, 96, 60, 0, 0, 7);
    g.fill();
    ornament(g, 256, 256, 1.4, border);
  }
  grain(g, S, S, 0.12);
  return cv;
}

function leafCanvas(light, dark) {
  const cv = canvas(256, 256);
  const g = cv.getContext('2d');
  g.strokeStyle = dark;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(128, 250);
  g.quadraticCurveTo(120, 120, 128, 8);
  g.stroke();
  for (let i = 0; i < 16; i++) {
    const t = i / 16;
    const y = 240 - t * 226;
    const len = 90 * Math.sin(Math.PI * (0.15 + t * 0.85));
    for (const side of [-1, 1]) {
      const grad = g.createLinearGradient(128, y, 128 + side * len, y - 30);
      grad.addColorStop(0, dark);
      grad.addColorStop(1, light);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(126, y);
      g.quadraticCurveTo(128 + side * len * 0.5, y - 26, 128 + side * len, y - 30 - rnd() * 8);
      g.quadraticCurveTo(128 + side * len * 0.5, y - 8, 126, y + 6);
      g.fill();
    }
  }
  return cv;
}

function skyCanvas(moon) {
  const cv = canvas(128, 160);
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, '#060c22');
  grad.addColorStop(0.7, '#1a2a52');
  grad.addColorStop(1, '#2a3a60');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 160);
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(210,225,255,${0.2 + rnd() * 0.6})`;
    g.fillRect(rnd() * 128, rnd() * 90, 1.4, 1.4);
  }
  if (moon) {
    const mg = g.createRadialGradient(84, 44, 4, 84, 44, 40);
    mg.addColorStop(0, 'rgba(250,240,210,.9)');
    mg.addColorStop(0.35, 'rgba(250,240,210,.25)');
    mg.addColorStop(1, 'rgba(250,240,210,0)');
    g.fillStyle = mg;
    g.fillRect(40, 0, 88, 90);
    g.fillStyle = '#f8f0d8';
    g.beginPath();
    g.arc(84, 44, 12, 0, 7);
    g.fill();
  }
  g.fillStyle = '#04060c';
  g.beginPath();
  g.moveTo(0, 130);
  for (let x = 0; x <= 128; x += 8) g.lineTo(x, 118 + Math.sin(x * 0.12) * 8 + rnd() * 6);
  g.lineTo(128, 160);
  g.lineTo(0, 160);
  g.fill();
  return cv;
}

function rainCanvas() {
  const cv = canvas(64, 256);
  const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(190,210,255,.55)';
  g.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 64;
    const y = rnd() * 256;
    g.globalAlpha = 0.25 + rnd() * 0.6;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x - 2, y + 10 + rnd() * 8);
    g.stroke();
  }
  return cv;
}

function landscapeCanvas(kind) {
  const cv = canvas(160, 120);
  const g = cv.getContext('2d');
  if (kind === 'sea') {
    const s = g.createLinearGradient(0, 0, 0, 120);
    s.addColorStop(0, '#2a2e3a');
    s.addColorStop(1, '#6a5a44');
    g.fillStyle = s;
    g.fillRect(0, 0, 160, 120);
    g.fillStyle = '#1a2230';
    g.beginPath();
    g.moveTo(0, 80);
    for (let x = 0; x <= 160; x += 10) g.lineTo(x, 78 + Math.sin(x * 0.2) * 6);
    g.lineTo(160, 120);
    g.lineTo(0, 120);
    g.fill();
    g.fillStyle = '#0a0a0e';
    g.beginPath();
    g.moveTo(60, 76);
    g.lineTo(104, 76);
    g.lineTo(96, 86);
    g.lineTo(66, 86);
    g.fill();
    g.fillRect(80, 40, 3, 36);
    g.beginPath();
    g.moveTo(83, 42);
    g.lineTo(104, 70);
    g.lineTo(83, 70);
    g.fill();
  } else {
    const s = g.createLinearGradient(0, 0, 0, 120);
    s.addColorStop(0, '#1a2238');
    s.addColorStop(1, '#4a3a2a');
    g.fillStyle = s;
    g.fillRect(0, 0, 160, 120);
    g.fillStyle = '#e8dcb0';
    g.beginPath();
    g.arc(118, 30, 10, 0, 7);
    g.fill();
    g.fillStyle = '#14181e';
    g.beginPath();
    g.moveTo(0, 90);
    g.quadraticCurveTo(50, 50, 90, 80);
    g.quadraticCurveTo(130, 60, 160, 76);
    g.lineTo(160, 120);
    g.lineTo(0, 120);
    g.fill();
    g.fillStyle = '#080a0c';
    for (const x of [24, 40, 130]) {
      g.beginPath();
      g.moveTo(x, 96);
      g.lineTo(x + 7, 60);
      g.lineTo(x + 14, 96);
      g.fill();
    }
  }
  grain(g, 160, 120, 0.12);
  return cv;
}

function photoCanvas(i) {
  const cv = canvas(128, 160);
  const g = cv.getContext('2d');
  g.fillStyle = '#efe6d0';
  g.fillRect(0, 0, 128, 160);
  const s = g.createLinearGradient(0, 10, 0, 120);
  s.addColorStop(0, '#8a7456');
  s.addColorStop(1, '#3a2c1e');
  g.fillStyle = s;
  g.fillRect(10, 10, 108, 108);
  g.fillStyle = '#1e160e';
  if (i % 2) {
    g.beginPath();
    g.arc(64, 54, 18, 0, 7);
    g.fill();
    g.fillRect(36, 74, 56, 44);
  } else {
    g.beginPath();
    g.moveTo(20, 118);
    g.lineTo(20, 70);
    g.lineTo(64, 36);
    g.lineTo(108, 70);
    g.lineTo(108, 118);
    g.fill();
  }
  g.strokeStyle = '#a8342c';
  g.lineWidth = 3;
  g.strokeRect(62, 126, 58, 24);
  g.fillStyle = '#a8342c';
  g.font = 'bold 13px sans-serif';
  g.fillText('증거', 76, 144);
  grain(g, 128, 160, 0.1);
  return cv;
}

function paperCanvas() {
  const cv = canvas(256, 180);
  const g = cv.getContext('2d');
  g.fillStyle = '#efe6cf';
  g.fillRect(0, 0, 256, 180);
  g.fillStyle = '#6a4a2a';
  g.fillRect(126, 0, 4, 180);
  g.strokeStyle = 'rgba(80,110,170,.35)';
  for (let y = 22; y < 180; y += 14) {
    g.beginPath();
    g.moveTo(8, y);
    g.lineTo(248, y);
    g.stroke();
  }
  g.strokeStyle = '#2a2230';
  g.lineWidth = 1.3;
  for (let y = 20; y < 170; y += 14) {
    for (const x0 of [14, 140]) {
      g.beginPath();
      let x = x0;
      g.moveTo(x, y);
      while (x < x0 + 90 * (0.5 + rnd() * 0.5)) {
        x += 4;
        g.lineTo(x, y - 3 + rnd() * 5);
      }
      g.stroke();
    }
  }
  return cv;
}

// ───────────────────────── 생성

function build(el, opts) {
  container = el;
  onPick = opts.onPick;
  const t0 = performance.now();
  let last = t0;
  clock = {
    elapsedTime: 0,
    getDelta() {
      const now = performance.now();
      const d = (now - last) / 1000;
      last = now;
      this.elapsedTime = (now - t0) / 1000;
      return d;
    },
  };

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.innerHTML = '';
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b070c');
  scene.fog = new THREE.Fog('#0b070c', 52, 110);
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 240);
  controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableDamping: true, dampingFactor: 0.08, minDistance: 7, maxDistance: 66,
    maxPolarAngle: 1.22, minPolarAngle: 0.02, screenSpacePanning: false, rotateSpeed: 0.6, panSpeed: 0.9,
  });
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

  buildMaterials();
  buildLights();
  buildTable();
  buildFloor();
  buildWalls();
  buildWallDecor();
  buildCenter();
  buildFurniture();
  buildPassages();
  buildRim();
  buildTableProps();
  buildLabels();
  mergeStatic();
  buildTokens();
  buildWeapons();
  buildDice();
  buildDust();

  reachGroup = group(scene);
  pathGroup = group(scene);
  suggestMesh = add(scene, new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 0.05, 0, false);
  suggestMesh.rotation.x = -Math.PI / 2;
  suggestMesh.visible = false;

  const ui = document.createElement('div');
  ui.className = 'cam-ctrl';
  ui.innerHTML = '<button data-view="default">기본 시점</button><button data-view="top">위에서</button><button data-view="me">내 말</button>';
  ui.addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]');
    if (!b) return;
    if (b.dataset.view === 'me') focusMine();
    else view(b.dataset.view);
  });
  el.appendChild(ui);
  const help = document.createElement('div');
  help.className = 'board-help';
  help.textContent = '드래그 회전 · 휠 확대 · 우클릭 드래그 이동';
  el.appendChild(help);

  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, b: e.button }; });
  dom.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const btn = down.b;
    down = null;
    if (moved > 6 || btn !== 0 || !reach) return;
    const to = pickAt(e);
    if (to && onPick) onPick(to);
  });
  dom.addEventListener('pointermove', (e) => {
    if (!reach || down) return;
    setHover(pickAt(e));
  });
  dom.addEventListener('contextmenu', (e) => e.preventDefault());

  new ResizeObserver(resize).observe(el);
  resize();
  view('default', true);

  if (document.fonts && document.fonts.load) {
    document.fonts.load('64px "Black Han Sans"').catch(() => null).then(() => labelDrawers.forEach((f) => f()));
  }
  renderer.setAnimationLoop(loop);
  window.__clue3d = { renderer, scene, camera, controls };
}

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const ROOM_STYLE = {
  kitchen: ['tile', '#e2dbcc', '#b7ad9a'],
  ballroom: ['damask', '#9a7440', '#c8a668'],
  conservatory: ['glass'],
  dining: ['damask', '#521620', '#7c2c3a'],
  billiard: ['stripe', '#1c3828', '#284c36'],
  library: ['panel', '#3e2616', '#2a180c'],
  lounge: ['damask', '#3a1220', '#5e2232'],
  hall: ['stripe', '#cabea6', '#b0a286'],
  study: ['damask', '#18264a', '#2a3e70'],
};

function wuvMat(cv, scale, o = {}) {
  const m = new THREE.MeshStandardMaterial({ map: canvasTex(cv, true), roughness: 0.85, ...o });
  m.userData.wuv = scale;
  return m;
}

function buildMaterials() {
  const tableWood = canvasTex(woodCanvas(512, 512, '#24160e', '#0a0503', 8), true);
  tableWood.repeat.set(10, 10);
  Object.assign(MAT, {
    wood: std('#6b4226', { roughness: 0.55 }),
    darkWood: std('#3a2216', { roughness: 0.6 }),
    gold: std('#c9a23a', { roughness: 0.28, metalness: 0.9 }),
    brass: std('#b08a3a', { roughness: 0.35, metalness: 0.8 }),
    iron: std('#2b2b30', { roughness: 0.45, metalness: 0.6 }),
    cream: std('#eee4cf'),
    red: std('#7e2228', { roughness: 0.9 }),
    velvet: std('#6e1f2c', { roughness: 0.95 }),
    velvetLight: std('#8a2a38', { roughness: 0.95 }),
    stone: std('#8d877d', { roughness: 0.9 }),
    marble: std('#e4dfd2', { roughness: 0.22, metalness: 0.05 }),
    felt: std('#2c6b45', { roughness: 1 }),
    terracotta: std('#a85630', { roughness: 0.8 }),
    flame: new THREE.MeshBasicMaterial({ color: '#ffcf5a' }),
    black: std('#111114', { roughness: 0.3 }),
    steel: std('#cfd4dc', { roughness: 0.22, metalness: 0.92 }),
    trim: std('#a8823f', { roughness: 0.35, metalness: 0.65 }),
    glow: new THREE.MeshBasicMaterial({ color: '#ffe0a0' }),
    table: std('#ffffff', { map: tableWood, roughness: 0.6 }),
    paintingFrame: std('#b8902e', { roughness: 0.3, metalness: 0.85 }),
  });
  MAT.wainscot = wuvMat(wainscotCanvas(), 1 / RAIL, { roughness: 0.6 });
  MAT.papers = {};
  for (const [id, [kind, c1, c2]] of Object.entries(ROOM_STYLE)) {
    MAT.papers[id] = kind === 'glass'
      ? wuvMat(glassCanvas(), 1.2, { transparent: true, roughness: 0.1, metalness: 0.1, color: '#cfe6ee', depthWrite: false })
      : wuvMat(wallpaperCanvas(kind, c1, c2), 1.5);
  }
  TEX.rain = canvasTex(rainCanvas(), true);
  MAT.sky = new THREE.MeshBasicMaterial({ map: canvasTex(skyCanvas(false)) });
  MAT.skyMoon = new THREE.MeshBasicMaterial({ map: canvasTex(skyCanvas(true)) });
  MAT.rain = new THREE.MeshBasicMaterial({ map: TEX.rain, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  MAT.leaf = new THREE.MeshStandardMaterial({ map: canvasTex(leafCanvas('#6cc46e', '#24542c')), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7 });
  MAT.leaf2 = new THREE.MeshStandardMaterial({ map: canvasTex(leafCanvas('#8ad06a', '#2e5a26')), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7 });
}

function buildLights() {
  hemi = new THREE.HemisphereLight('#8790c8', '#2a1a10', 1.0);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight('#cdd6ff', 2.3);
  moon.position.set(-15, 30, 12);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19, near: 5, far: 90 });
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.03;
  scene.add(moon);
  const warm = new THREE.DirectionalLight('#ffb070', 0.6);
  warm.position.set(18, 14, -12);
  scene.add(warm);
  for (const r of ROOMS) {
    const b = rb(r);
    const l = new THREE.PointLight('#ffb35c', 17, 9, 1.6);
    l.position.set(b.cx, 2.4, b.cz);
    scene.add(l);
    flickers.push({ l, base: 17, ph: rnd() * 10 });
  }
}

function buildTable() {
  const top = add(scene, new THREE.PlaneGeometry(160, 160), MAT.table, 0, -0.64, 0, false);
  top.rotation.x = -Math.PI / 2;
  add(scene, boxG(W + 1.6, 0.6, H + 1.6), std('#2e1d12', { roughness: 0.5 }), 0, -0.32, 0);
  add(scene, boxG(W + 2.0, 0.12, H + 2.0), std('#24160e', { roughness: 0.6 }), 0, -0.58, 0);
  const tr = MAT.gold;
  add(scene, boxG(W + 1.7, 0.07, 0.1), tr, 0, 0, (H + 1.6) / 2);
  add(scene, boxG(W + 1.7, 0.07, 0.1), tr, 0, 0, -(H + 1.6) / 2);
  add(scene, boxG(0.1, 0.07, H + 1.7), tr, (W + 1.6) / 2, 0, 0);
  add(scene, boxG(0.1, 0.07, H + 1.7), tr, -(W + 1.6) / 2, 0, 0);
}

function floorPattern(type) {
  const p = canvas(64, 64);
  const g = p.getContext('2d');
  const size = (w, h) => { p.width = w; p.height = h; };
  switch (type) {
    case 'checker':
      g.fillStyle = '#dcd4c4'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#2a2830'; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeRect(0, 0, 32, 32); g.strokeRect(32, 32, 32, 32);
      break;
    case 'parquet':
      size(64, 32);
      g.fillStyle = '#9c6a33'; g.fillRect(0, 0, 64, 32);
      g.fillStyle = '#b37c42'; g.fillRect(0, 0, 32, 16); g.fillRect(48, 16, 16, 16); g.fillRect(0, 16, 16, 16);
      g.strokeStyle = '#6f4a22'; g.lineWidth = 2;
      [[0, 0, 32, 16], [32, 0, 32, 16], [-16, 16, 32, 16], [16, 16, 32, 16], [48, 16, 32, 16]].forEach((a) => g.strokeRect(...a));
      break;
    case 'terracotta':
      size(32, 32);
      g.fillStyle = '#6e3a21'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#ad6139'; rr(g, 2, 2, 28, 28, 3); g.fill();
      break;
    case 'wood':
      return woodCanvas(160, 64, '#5f3a20', '#2a1408', 4);
    case 'felt':
      size(16, 16);
      g.fillStyle = '#285c3e'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#2f6a48'; g.fillRect(3, 3, 2, 2); g.fillStyle = '#214f35'; g.fillRect(11, 11, 2, 2);
      break;
    case 'planks':
      return woodCanvas(64, 160, '#6f4829', '#2a1408', 6);
    case 'damask':
      size(64, 64);
      g.fillStyle = '#5e1a26'; g.fillRect(0, 0, 64, 64);
      ornament(g, 32, 32, 0.7, '#7a2a38');
      break;
    case 'marble':
      g.fillStyle = '#dcd6c8'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#33303a'; g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 32); g.lineTo(32, 64); g.lineTo(0, 32); g.fill();
      g.strokeStyle = 'rgba(140,130,120,.35)'; g.beginPath(); g.moveTo(4, 10); g.quadraticCurveTo(20, 20, 12, 30); g.stroke();
      break;
    default:
      size(24, 24);
      g.fillStyle = '#1c2a4c'; g.fillRect(0, 0, 24, 24);
      g.fillStyle = 'rgba(201,162,58,.5)'; g.beginPath(); g.arc(12, 12, 2, 0, 7); g.fill();
  }
  return p;
}

function buildFloor() {
  const cv = canvas(W * PX, H * PX);
  const c = cv.getContext('2d');
  c.fillStyle = '#211812';
  c.fillRect(0, 0, cv.width, cv.height);
  const hallWood = c.createPattern(woodCanvas(128, 64, '#4a3524', '#1e140c', 4), 'repeat');
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== null) continue;
      const X = x * PX;
      const Y = y * PX;
      c.fillStyle = hallWood;
      c.fillRect(X, Y, PX, PX);
      c.strokeStyle = 'rgba(0,0,0,.35)';
      c.lineWidth = 2;
      c.strokeRect(X + 1, Y + 1, PX - 2, PX - 2);
    }
  }
  // 복도 카펫 러너
  const runners = [[7, 0, 8, 25], [16, 0, 17, 25], [0, 8, 18, 9], [0, 17, 16, 18], [16, 20, 24, 21], [16, 6, 24, 7], [17, 12.5, 24, 13.5]];
  for (const [x0, y0, x1, y1] of runners) {
    const horiz = x1 - x0 > y1 - y0;
    const X = x0 * PX + (horiz ? 0 : PX * 0.16);
    const Y = y0 * PX + (horiz ? PX * 0.16 : 0);
    const w = (x1 - x0) * PX - (horiz ? 0 : PX * 0.32);
    const h = (y1 - y0) * PX - (horiz ? PX * 0.32 : 0);
    c.fillStyle = '#5a1620';
    c.fillRect(X, Y, w, h);
    c.strokeStyle = '#c9a23a';
    c.lineWidth = 3;
    if (horiz) {
      c.beginPath(); c.moveTo(X, Y + 6); c.lineTo(X + w, Y + 6); c.moveTo(X, Y + h - 6); c.lineTo(X + w, Y + h - 6); c.stroke();
    } else {
      c.beginPath(); c.moveTo(X + 6, Y); c.lineTo(X + 6, Y + h); c.moveTo(X + w - 6, Y); c.lineTo(X + w - 6, Y + h); c.stroke();
    }
    c.fillStyle = 'rgba(217,180,90,.55)';
    const n = Math.max(w, h) / PX;
    for (let i = 0; i < n; i++) {
      const mx = horiz ? X + (i + 0.5) * PX : X + w / 2;
      const my = horiz ? Y + h / 2 : Y + (i + 0.5) * PX;
      c.beginPath(); c.moveTo(mx, my - 9); c.lineTo(mx + 9, my); c.lineTo(mx, my + 9); c.lineTo(mx - 9, my); c.fill();
    }
  }
  for (const r of ROOMS) {
    const [x, y, w, h] = r.rect;
    const X = x * PX;
    const Y = y * PX;
    c.fillStyle = c.createPattern(floorPattern(r.floor), 'repeat');
    c.fillRect(X, Y, w * PX, h * PX);
    const gr = c.createRadialGradient(X + (w * PX) / 2, Y + (h * PX) / 2, Math.min(w, h) * PX * 0.2, X + (w * PX) / 2, Y + (h * PX) / 2, Math.max(w, h) * PX * 0.72);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,.5)');
    c.fillStyle = gr;
    c.fillRect(X, Y, w * PX, h * PX);
  }
  const [qx, qy, qw, qh] = CENTER;
  c.fillStyle = '#120c10';
  c.fillRect(qx * PX, qy * PX, qw * PX, qh * PX);
  for (const r of ROOMS) {
    for (const [ox, oy, ix, iy] of r.doors) {
      c.fillStyle = '#8a6a3e';
      if (ox === ix) c.fillRect(ix * PX + 8, Math.max(oy, iy) * PX - 9, PX - 16, 18);
      else c.fillRect(Math.max(ox, ix) * PX - 9, iy * PX + 8, 18, PX - 16);
      c.strokeStyle = 'rgba(242,214,138,.85)';
      c.lineWidth = 5;
      c.lineCap = 'round';
      const mx = ox * PX + PX / 2;
      const my = oy * PX + PX / 2;
      const dx = Math.sign(ix - ox);
      const dy = Math.sign(iy - oy);
      c.beginPath();
      c.moveTo(mx - 11 * dx - 11 * dy, my - 11 * dy - 11 * dx);
      c.lineTo(mx, my);
      c.lineTo(mx - 11 * dx + 11 * dy, my - 11 * dy + 11 * dx);
      c.stroke();
    }
  }
  c.setLineDash([10, 8]);
  c.lineWidth = 5;
  for (const s of SUSPECTS) {
    c.strokeStyle = s.color;
    c.beginPath();
    c.arc(s.start[0] * PX + PX / 2, s.start[1] * PX + PX / 2, 24, 0, Math.PI * 2);
    c.stroke();
  }
  c.setLineDash([]);
  grain(c, cv.width, cv.height, 0.05);

  const tex = canvasTex(cv);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const floor = add(scene, new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78 }), 0, 0, 0, false);
  floor.rotation.x = -Math.PI / 2;
}

function wallSegment(horiz, len, along, line, ht, paper) {
  const lower = Math.min(ht, RAIL);
  const put = (h, y, mat, thick = T) => {
    const geo = horiz ? boxG(len, h, thick) : boxG(thick, h, len);
    return add(scene, geo, mat, horiz ? along : line, y + h / 2, horiz ? line : along);
  };
  put(lower, 0, MAT.wainscot);
  put(0.06, 0, MAT.darkWood, T + 0.03);
  if (ht > RAIL) {
    put(ht - RAIL, RAIL, paper);
    put(0.035, RAIL - 0.01, MAT.trim, T + 0.05);
  }
  put(0.055, ht, MAT.trim, T + 0.08);
}

function buildWalls() {
  for (const r of ROOMS) {
    const [x0, y0, w, h] = r.rect;
    const paper = MAT.papers[r.id];
    const doorSet = new Set(r.doors.map(([ox, oy, ix, iy]) => `${ix},${iy}>${ox},${oy}`));
    const sides = [
      { n: w, inside: (i) => [x0 + i, y0], out: (i) => [x0 + i, y0 - 1], height: WALL.top, horiz: true, line: ez(y0) + T / 2 },
      { n: w, inside: (i) => [x0 + i, y0 + h - 1], out: (i) => [x0 + i, y0 + h], height: WALL.bottom, horiz: true, line: ez(y0 + h) - T / 2 },
      { n: h, inside: (i) => [x0, y0 + i], out: (i) => [x0 - 1, y0 + i], height: WALL.side, horiz: false, line: ex(x0) + T / 2 },
      { n: h, inside: (i) => [x0 + w - 1, y0 + i], out: (i) => [x0 + w, y0 + i], height: WALL.side, horiz: false, line: ex(x0 + w) - T / 2 },
    ];
    for (const s of sides) {
      let start = null;
      const flush = (a, b) => {
        const len = b - a + 1;
        const along = s.horiz ? ex(x0 + a) + len / 2 : ez(y0 + a) + len / 2;
        wallSegment(s.horiz, len, along, s.line, s.height, paper);
      };
      for (let i = 0; i < s.n; i++) {
        const isDoor = doorSet.has(`${s.inside(i)}>${s.out(i)}`);
        if (!isDoor && start === null) start = i;
        if (isDoor && start !== null) { flush(start, i - 1); start = null; }
        if (isDoor) {
          const [ix, iy] = s.inside(i);
          const ht = s.height + 0.14;
          const posts = s.horiz ? [[ex(ix) + 0.05, s.line], [ex(ix + 1) - 0.05, s.line]] : [[s.line, ez(iy) + 0.05], [s.line, ez(iy + 1) - 0.05]];
          for (const [px, pz] of posts) {
            add(scene, boxG(0.11, ht, 0.11), MAT.gold, px, ht / 2, pz);
            add(scene, new THREE.SphereGeometry(0.075, 12, 8), MAT.gold, px, ht + 0.06, pz);
          }
        }
      }
      if (start !== null) flush(start, s.n - 1);
    }
    for (const [px, pz, ht] of [[ex(x0), ez(y0), WALL.top], [ex(x0 + w), ez(y0), WALL.top], [ex(x0), ez(y0 + h), WALL.bottom], [ex(x0 + w), ez(y0 + h), WALL.bottom]]) {
      const x = px + (px === ex(x0) ? T / 2 : -T / 2);
      const z = pz + (pz === ez(y0) ? T / 2 : -T / 2);
      add(scene, boxG(T + 0.1, ht + 0.1, T + 0.1), MAT.darkWood, x, (ht + 0.1) / 2, z);
      add(scene, boxG(T + 0.16, 0.06, T + 0.16), MAT.trim, x, ht + 0.12, z);
    }
  }
}

function windowAt(x, y, z, w, h, rotY, moon) {
  const g = group(scene, x, y, z, rotY);
  add(g, new THREE.PlaneGeometry(w, h), moon ? MAT.skyMoon : MAT.sky, 0, 0, 0, false);
  add(g, new THREE.PlaneGeometry(w, h), MAT.rain, 0, 0, 0.004, false);
  const fr = MAT.darkWood;
  add(g, boxG(w + 0.08, 0.05, 0.05), fr, 0, h / 2, 0.02);
  add(g, boxG(w + 0.08, 0.05, 0.05), fr, 0, -h / 2, 0.02);
  add(g, boxG(0.05, h, 0.05), fr, -w / 2, 0, 0.02);
  add(g, boxG(0.05, h, 0.05), fr, w / 2, 0, 0.02);
  add(g, boxG(0.025, h, 0.03), fr, 0, 0, 0.02);
  add(g, boxG(w, 0.025, 0.03), fr, 0, h * 0.1, 0.02);
  add(g, boxG(w + 0.16, 0.035, 0.1), MAT.trim, 0, -h / 2 - 0.03, 0.05);
  add(g, boxG(0.12, h + 0.14, 0.04), MAT.velvet, -w / 2 - 0.06, 0.02, 0.05);
  add(g, boxG(0.12, h + 0.14, 0.04), MAT.velvet, w / 2 + 0.06, 0.02, 0.05);
  add(g, boxG(w + 0.3, 0.06, 0.06), MAT.brass, 0, h / 2 + 0.09, 0.05);
}

function paintingAt(x, y, z, w, h, rotY, map) {
  const g = group(scene, x, y, z, rotY);
  add(g, boxG(w + 0.09, h + 0.09, 0.03), MAT.paintingFrame, 0, 0, 0);
  add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map, roughness: 0.6 }), 0, 0, 0.018, false);
  const lamp = add(g, boxG(w * 0.5, 0.025, 0.05), MAT.brass, 0, h / 2 + 0.08, 0.05, false);
  lamp.userData.dynamic = false;
}

function sconceAt(x, z, rotY) {
  const g = group(scene, x, 0, z, rotY);
  add(g, boxG(0.08, 0.14, 0.02), MAT.brass, 0, 0.74, 0);
  add(g, boxG(0.03, 0.03, 0.12), MAT.brass, 0, 0.72, 0.06);
  add(g, cylG(0.04, 0.03, 0.03, 10), MAT.brass, 0, 0.74, 0.12);
  candle(g, 0, 0.75, 0.12, 0.9);
}

function buildWallDecor() {
  const portraits = SUSPECTS.map((s) => svgTexture(`assets/face/${s.id}.svg`, 256, 256));
  const scenes = [canvasTex(landscapeCanvas('land')), canvasTex(landscapeCanvas('sea'))];
  let pi = 0;
  for (const r of ROOMS) {
    const b = rb(r);
    const [x0, y0, w, h] = r.rect;
    const topDoors = r.doors.filter(([, oy, , iy]) => oy < iy).map(([, , ix]) => ex(ix) + 0.5);
    const clearX = (x, half) => topDoors.every((d) => Math.abs(d - x) > half + 0.55);
    const zIn = ez(y0) + T + 0.012;
    if (r.id === 'conservatory') continue;
    if (y0 <= 1) {
      const n = w >= 8 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const x = b.x0 + (w * (i + 1)) / (n + 1);
        if (clearX(x, 0.3)) windowAt(x, 0.7, zIn, 0.62, 0.46, 0, i === 1);
      }
    } else if (r.id !== 'library') {
      const cands = [b.cx, b.cx - 1.6, b.cx + 1.6];
      const x = cands.find((c) => clearX(c, 0.4));
      if (x !== undefined) {
        const map = pi % 3 === 2 ? scenes[pi % 2] : portraits[pi % portraits.length];
        paintingAt(x, 0.68, zIn, pi % 3 === 2 ? 0.8 : 0.5, pi % 3 === 2 ? 0.46 : 0.5, 0, map);
        pi++;
      }
    }
    for (const x of [b.x0 + 0.55, b.x1 - 0.55]) if (clearX(x, 0.1)) sconceAt(x, zIn - 0.005, 0);
    const sideZ = [b.cz - h / 4, b.cz + h / 4];
    if (x0 === 0) {
      for (const z of sideZ) {
        const blocked = r.doors.some(([ox, oy, ix, iy]) => ox < ix && Math.abs(ez(iy) + 0.5 - z) < 0.9);
        if (!blocked) windowAt(ex(0) + T + 0.012, 0.5, z, 0.62, 0.3, Math.PI / 2, false);
      }
    }
    if (x0 + w === W) {
      for (const z of sideZ) {
        const blocked = r.doors.some(([ox, oy, ix, iy]) => ox > ix && Math.abs(ez(iy) + 0.5 - z) < 0.9);
        if (!blocked) windowAt(ex(W) - T - 0.012, 0.5, z, 0.62, 0.3, -Math.PI / 2, rnd() > 0.5);
      }
    }
  }
}

function labelCanvas(text, sub) {
  const cv = canvas(512, sub ? 176 : 128);
  const tex = canvasTex(cv);
  const draw = () => {
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    g.font = '64px "Black Han Sans", "Malgun Gothic", sans-serif';
    const tw = Math.min(480, g.measureText(text).width + 80);
    const x = (512 - tw) / 2;
    const grad = g.createLinearGradient(0, 14, 0, 114);
    grad.addColorStop(0, 'rgba(40,24,30,.94)');
    grad.addColorStop(1, 'rgba(12,7,10,.94)');
    g.fillStyle = grad;
    rr(g, x, 14, tw, 100, 50);
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = '#d6b25e';
    g.stroke();
    g.lineWidth = 1.5;
    g.strokeStyle = 'rgba(214,178,94,.6)';
    rr(g, x + 8, 22, tw - 16, 84, 42);
    g.stroke();
    g.fillStyle = '#f5e6c0';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 256, 68);
    if (sub) {
      g.font = 'bold 30px "Noto Sans KR", "Malgun Gothic", sans-serif';
      g.fillStyle = '#e2c066';
      g.fillText(sub, 256, 150);
    }
    tex.needsUpdate = true;
  };
  draw();
  labelDrawers.push(draw);
  return tex;
}

function sprite(tex, sx, sy, x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(sx, sy, 1);
  s.position.set(x, y, z);
  scene.add(s);
  return s;
}

function buildLabels() {
  for (const r of ROOMS) {
    const b = rb(r);
    sprite(labelCanvas(r.name), 2.3, 0.575, b.cx, WALL.top + 0.66, b.z0 + 0.2).renderOrder = 5;
  }
}

function buildCenter() {
  const [x, y, w, h] = CENTER;
  const X = ex(x) + w / 2;
  const Z = ez(y) + h / 2;
  const stone = std('#2a1c22', { roughness: 0.55 });
  add(scene, boxG(w - 0.1, 0.1, h - 0.1), stone, X, 0.05, Z);
  add(scene, boxG(w - 0.5, 0.1, h - 0.5), std('#241820', { roughness: 0.5 }), X, 0.15, Z);
  add(scene, boxG(w - 0.9, 0.12, h - 0.9), std('#1b1216', { roughness: 0.45 }), X, 0.26, Z);
  add(scene, boxG(1.2, 0.012, 0.5), MAT.red, X, 0.106, Z + h / 2 - 0.3, false);
  add(scene, boxG(1.2, 0.012, 0.5), MAT.red, X, 0.206, Z + h / 2 - 0.5, false);
  const hw = (w - 1.1) / 2;
  const hh = (h - 1.1) / 2;
  const railY = 0.32;
  for (const [ax, az, bx, bz] of [[-hw, -hh, hw, -hh], [-hw, hh, -0.8, hh], [0.8, hh, hw, hh], [-hw, -hh, -hw, hh], [hw, -hh, hw, hh]]) {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(2, Math.round(len / 0.3));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      add(scene, cylG(0.018, 0.025, 0.24, 8), MAT.marble, X + ax + (bx - ax) * t, railY + 0.12, Z + az + (bz - az) * t);
    }
    const rail = add(scene, boxG(len + 0.06, 0.04, 0.07), MAT.darkWood, X + (ax + bx) / 2, railY + 0.26, Z + (az + bz) / 2);
    rail.rotation.y = -Math.atan2(bz - az, bx - ax);
  }

  const cv = canvas(512, 612);
  const tex = canvasTex(cv);
  const draw = () => {
    const g = cv.getContext('2d');
    g.fillStyle = '#1a1116';
    g.fillRect(0, 0, 512, 612);
    g.strokeStyle = '#c9a23a';
    g.lineWidth = 6;
    g.strokeRect(14, 14, 484, 584);
    g.lineWidth = 2;
    g.strokeRect(30, 30, 452, 552);
    ornament(g, 256, 300, 3.2, 'rgba(201,162,58,.12)');
    g.fillStyle = '#c9a23a';
    g.textAlign = 'center';
    g.font = 'bold 30px "Noto Sans KR", sans-serif';
    g.fillText('C A S E   F I L E', 256, 86);
    g.font = '58px "Black Han Sans", "Malgun Gothic", sans-serif';
    g.fillStyle = '#f2d68a';
    g.fillText('사건 파일', 256, 500);
    g.font = 'bold 26px "Noto Sans KR", sans-serif';
    g.fillStyle = '#b8a27a';
    g.fillText('범인 · 흉기 · 장소 봉인됨', 256, 548);
    tex.needsUpdate = true;
  };
  draw();
  labelDrawers.push(draw);
  const top = add(scene, new THREE.PlaneGeometry(w - 1.0, h - 1.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 }), X, 0.322, Z, false);
  top.rotation.x = -Math.PI / 2;

  const lectern = group(scene, X, 0.32, Z - 0.7);
  add(lectern, cylG(0.12, 0.18, 0.5, 12), MAT.darkWood, 0, 0.25, 0);
  const desk = add(lectern, boxG(1.3, 0.05, 0.9), MAT.wood, 0, 0.55, 0);
  desk.rotation.x = 0.35;
  const env = add(scene, new THREE.PlaneGeometry(1.15, 0.8), new THREE.MeshStandardMaterial({ map: svgTexture('assets/envelope.svg', 1024, 717), transparent: true, roughness: 0.8, side: THREE.DoubleSide }), X, 0.92, Z - 0.66);
  env.rotation.set(-Math.PI / 2 + 0.35, 0, 0.05);
  env.userData.dynamic = true;
  tweens.push({ t: 0, dur: Infinity, fn: () => { env.position.y = 0.93 + Math.sin(clock.elapsedTime * 1.4) * 0.03; } });

  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = X + dx * (w / 2 - 0.3);
    const pz = Z + dz * (h / 2 - 0.3);
    const pts = [[0.16, 0], [0.12, 0.05], [0.04, 0.12], [0.03, 0.6], [0.07, 0.66], [0.09, 0.7], [0.02, 0.72]].map(([a, b]) => new THREE.Vector2(a, b));
    add(scene, new THREE.LatheGeometry(pts, 14), MAT.gold, px, 0.1, pz);
    for (const [ox, oz] of [[0, 0], [0.09, 0], [-0.09, 0]]) candle(scene, px + ox, 0.82, pz + oz, 1.1);
  }
  const l = new THREE.PointLight('#ffc070', 12, 7, 1.8);
  l.position.set(X, 1.7, Z);
  scene.add(l);
  flickers.push({ l, base: 12, ph: 3 });
}

function rug(x, z, w, d, cv, ry = 0) {
  const m = add(scene, new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: canvasTex(cv), roughness: 1 }), x, 0.014, z, false);
  m.rotation.set(-Math.PI / 2, 0, ry);
  return m;
}

function leafPlant(parent, x, z, s = 1, tall = false) {
  const g = group(parent, x, 0, z, rnd() * Math.PI);
  const pts = [[0.2, 0], [0.24, 0.3], [0.27, 0.36], [0.25, 0.38], [0, 0.38]].map(([a, b]) => new THREE.Vector2(a * s, b * s));
  add(g, new THREE.LatheGeometry(pts, 16), MAT.terracotta, 0, 0, 0);
  add(g, cylG(0.23 * s, 0.23 * s, 0.02, 16), std('#2a1a0e'), 0, 0.37 * s, 0, false);
  if (tall) add(g, cylG(0.03 * s, 0.05 * s, 0.9 * s, 8), MAT.darkWood, 0, 0.8 * s, 0);
  const n = tall ? 7 : 9;
  for (let i = 0; i < n; i++) {
    const leaf = add(g, new THREE.PlaneGeometry(0.62 * s, 0.9 * s), i % 2 ? MAT.leaf : MAT.leaf2, 0, 0, 0, true);
    const a = (i / n) * Math.PI * 2;
    const baseY = tall ? 1.2 * s : 0.4 * s;
    leaf.geometry.translate(0, 0.42 * s, 0);
    leaf.position.set(0, baseY, 0);
    leaf.rotation.set(tall ? 0.9 + rnd() * 0.3 : 0.5 + rnd() * 0.4, a, 0, 'YXZ');
  }
  return g;
}

function buildFurniture() {
  const B = Object.fromEntries(ROOMS.map((r) => [r.id, rb(r)]));

  // 부엌
  {
    const b = B.kitchen;
    const st = group(scene, b.cx + 1.2, 0, b.cz - 0.9);
    add(st, boxG(1.6, 0.85, 0.9), MAT.iron, 0, 0.425, 0);
    add(st, boxG(1.7, 0.06, 1.0), std('#4a4a52', { metalness: 0.6, roughness: 0.4 }), 0, 0.88, 0);
    for (const [dx, dz] of [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.22], [0.4, 0.22]]) add(st, cylG(0.15, 0.15, 0.03), MAT.black, dx, 0.925, dz);
    add(st, boxG(1.1, 0.45, 0.02), std('#1a1a1e', { metalness: 0.7 }), 0, 0.38, 0.46);
    add(st, boxG(0.8, 0.04, 0.04), MAT.gold, 0, 0.66, 0.49);
    add(st, cylG(0.22, 0.2, 0.26, 16), std('#b8622a', { roughness: 0.3, metalness: 0.7 }), 0.4, 1.07, -0.2);
    add(st, cylG(0.08, 0.08, 1.6, 12), MAT.iron, -0.55, 1.6, -0.35);
    table(scene, b.cx - 1.1, b.cz + 0.5, 1.8, 1.0, 0.8, MAT.wood);
    add(scene, boxG(0.7, 0.04, 0.45), std('#c89f6a'), b.cx - 1.3, 0.855, b.cz + 0.5);
    add(scene, boxG(0.28, 0.02, 0.12), MAT.steel, b.cx - 1.3, 0.885, b.cz + 0.45);
    add(scene, new THREE.SphereGeometry(0.1, 12, 8), std('#c0392b', { roughness: 0.35 }), b.cx - 0.6, 0.92, b.cz + 0.3);
    add(scene, new THREE.SphereGeometry(0.09, 12, 8), std('#e2b23a', { roughness: 0.4 }), b.cx - 0.45, 0.91, b.cz + 0.55);
    for (let i = 0; i < 4; i++) add(scene, cylG(0.1, 0.12, 0.16, 12), std('#b8622a', { roughness: 0.3, metalness: 0.75 }), b.x1 - 0.3, 0.9 + (i % 2) * 0.05, b.cz - 1.6 + i * 0.5);
    add(scene, boxG(0.3, 0.05, 2.0), MAT.darkWood, b.x1 - 0.3, 0.8, b.cz - 0.85);
  }
  // 연회장
  {
    const b = B.ballroom;
    rug(b.cx - 0.4, b.cz + 0.3, 4.2, 4.2, rugCanvas('#5a1620', '#c9a23a', '#8a2a34', true));
    const pg = group(scene, b.cx + 2.4, 0, b.cz - 0.9, -0.3);
    const lacq = std('#0e0e12', { roughness: 0.12, metalness: 0.35 });
    add(pg, boxG(1.3, 0.32, 1.0), lacq, 0, 0.78, 0);
    const lid = add(pg, boxG(1.25, 0.03, 0.95), lacq, 0, 1.12, -0.18);
    lid.rotation.x = -0.55;
    add(pg, boxG(0.02, 0.4, 0.02), MAT.gold, 0.5, 1.02, 0.05);
    for (const [dx, dz] of [[-0.5, -0.35], [0.5, -0.35], [0, 0.35]]) add(pg, cylG(0.04, 0.05, 0.62, 8), lacq, dx, 0.31, dz);
    add(pg, boxG(1.0, 0.04, 0.2), MAT.cream, 0, 0.8, 0.55);
    for (let k = 0; k < 14; k++) add(pg, boxG(0.03, 0.015, 0.1), MAT.black, -0.45 + k * 0.07, 0.825, 0.52, false);
    add(pg, boxG(0.6, 0.06, 0.28), MAT.velvet, 0, 0.45, 0.95);
    const ch = group(scene, b.cx - 0.4, 2.55, b.cz + 0.3);
    add(ch, new THREE.TorusGeometry(0.72, 0.035, 8, 40), MAT.gold).rotation.x = Math.PI / 2;
    add(ch, new THREE.TorusGeometry(0.42, 0.025, 8, 32), MAT.gold, 0, 0.18, 0).rotation.x = Math.PI / 2;
    add(ch, cylG(0.015, 0.015, 1.2, 6), MAT.gold, 0, 0.6, 0);
    const crystal = std('#dff2ff', { roughness: 0.02, metalness: 0.1, emissive: '#8ab8d8', emissiveIntensity: 0.5 });
    add(ch, new THREE.OctahedronGeometry(0.12, 0), crystal, 0, -0.12, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      candle(ch, Math.cos(a) * 0.72, 0.03, Math.sin(a) * 0.72, 1.1);
      add(ch, new THREE.OctahedronGeometry(0.035, 0), crystal, Math.cos(a) * 0.62, -0.12, Math.sin(a) * 0.62, false);
    }
    leafPlant(scene, b.x0 + 0.5, b.cz + 2.2, 1.1, true);
    leafPlant(scene, b.x1 - 0.5, b.cz + 2.2, 1.1, true);
  }
  // 온실
  {
    const b = B.conservatory;
    const fx = b.cx - 0.3;
    add(scene, cylG(0.82, 0.92, 0.35, 32), MAT.stone, fx, 0.175, b.cz);
    add(scene, new THREE.TorusGeometry(0.84, 0.05, 8, 40), MAT.marble, fx, 0.35, b.cz).rotation.x = Math.PI / 2;
    add(scene, cylG(0.72, 0.72, 0.02, 32), std('#2f76a8', { roughness: 0.02, metalness: 0.4, emissive: '#0e3a5a', emissiveIntensity: 0.7 }), fx, 0.33, b.cz, false);
    add(scene, cylG(0.09, 0.13, 0.62, 12), MAT.marble, fx, 0.62, b.cz);
    add(scene, cylG(0.32, 0.12, 0.12, 20), MAT.marble, fx, 0.95, b.cz);
    add(scene, new THREE.SphereGeometry(0.08, 12, 8), MAT.marble, fx, 1.06, b.cz);
    leafPlant(scene, b.cx - 2.2, b.cz - 0.9, 1.2, true);
    leafPlant(scene, b.cx + 1.5, b.cz + 0.9, 1.2);
    leafPlant(scene, b.cx - 2.1, b.cz + 1.0, 0.9);
    leafPlant(scene, b.cx + 1.5, b.cz - 0.8, 1.0, true);
    const bench = group(scene, b.cx + 0.6, 0, b.cz + 1.5, Math.PI);
    add(bench, boxG(1.1, 0.04, 0.34), MAT.iron, 0, 0.42, 0);
    add(bench, boxG(1.1, 0.34, 0.04), MAT.iron, 0, 0.62, -0.16);
    for (const sx of [-0.5, 0.5]) add(bench, boxG(0.04, 0.42, 0.34), MAT.iron, sx, 0.21, 0);
  }
  // 식당
  {
    const b = B.dining;
    rug(b.cx, b.cz, 2.6, 4.8, rugCanvas('#3a1a2a', '#1e0e16', '#c9a23a'));
    add(scene, boxG(1.3, 0.08, 3.4), MAT.darkWood, b.cx, 0.78, b.cz);
    add(scene, boxG(1.2, 0.12, 3.3), MAT.darkWood, b.cx, 0.7, b.cz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) turnedLeg(scene, b.cx + sx * 0.5, b.cz + sz * 1.5, 0.74, MAT.darkWood);
    add(scene, boxG(0.46, 0.012, 3.2), MAT.cream, b.cx, 0.826, b.cz, false);
    for (const dz of [-1.1, 0, 1.1]) {
      chair(scene, b.cx - 0.95, b.cz + dz, Math.PI / 2, MAT.red);
      chair(scene, b.cx + 0.95, b.cz + dz, -Math.PI / 2, MAT.red);
      for (const sx of [-1, 1]) {
        add(scene, cylG(0.13, 0.13, 0.015, 16), MAT.cream, b.cx + sx * 0.42, 0.83, b.cz + dz, false);
        const glass = [[0.035, 0], [0.01, 0.01], [0.008, 0.1], [0.05, 0.14], [0.05, 0.22]].map(([a, c]) => new THREE.Vector2(a, c));
        add(scene, new THREE.LatheGeometry(glass, 10), std('#e8f4ff', { transparent: true, opacity: 0.45, roughness: 0.05 }), b.cx + sx * 0.3, 0.83, b.cz + dz - 0.2, false);
      }
    }
    chair(scene, b.cx, b.cz - 2.1, 0, MAT.red);
    chair(scene, b.cx, b.cz + 2.1, Math.PI, MAT.red);
    for (const dz of [-0.9, 0.9]) {
      add(scene, cylG(0.05, 0.1, 0.32, 10), MAT.gold, b.cx, 0.98, b.cz + dz);
      add(scene, boxG(0.34, 0.025, 0.025), MAT.gold, b.cx, 1.12, b.cz + dz);
      for (const dx of [-0.16, 0, 0.16]) candle(scene, b.cx + dx, 1.13, b.cz + dz, 1.1);
    }
    add(scene, new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.steel, b.cx, 0.83, b.cz);
  }
  // 당구장
  {
    const b = B.billiard;
    const X = b.cx + 0.2;
    add(scene, boxG(2.8, 0.1, 1.4), MAT.felt, X, 0.82, b.cz);
    for (const [dx, dz, w, d] of [[0, -0.76, 3.0, 0.12], [0, 0.76, 3.0, 0.12], [-1.46, 0, 0.12, 1.64], [1.46, 0, 0.12, 1.64]]) add(scene, boxG(w, 0.14, d), MAT.darkWood, X + dx, 0.88, b.cz + dz);
    for (const [dx, dz] of [[-1.4, -0.7], [0, -0.72], [1.4, -0.7], [-1.4, 0.7], [0, 0.72], [1.4, 0.7]]) add(scene, cylG(0.07, 0.07, 0.03, 12), MAT.black, X + dx, 0.955, b.cz + dz, false);
    add(scene, boxG(2.5, 0.5, 1.1), MAT.darkWood, X, 0.52, b.cz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) turnedLeg(scene, X + sx * 1.2, b.cz + sz * 0.5, 0.3, MAT.darkWood);
    const colors = ['#e2b23a', '#3a64b7', '#d8433b', '#7a3fb0', '#e07a2c', '#2d8a52', '#111', '#f4efe4'];
    colors.forEach((col, i) => add(scene, new THREE.SphereGeometry(0.065, 16, 12), std(col, { roughness: 0.12 }), X - 0.6 + (i % 4) * 0.28 + (i > 3 ? 0.14 : 0), 0.935, b.cz - 0.2 + (i > 3 ? 0.3 : 0)));
    const cue = add(scene, cylG(0.014, 0.026, 2.2, 8), std('#c9975a', { roughness: 0.4 }), X + 0.2, 0.92, b.cz + 0.45);
    cue.rotation.set(0, 0.25, Math.PI / 2);
    add(scene, boxG(1.9, 0.1, 0.38), std('#1f4a2e', { roughness: 0.4 }), X, 2.05, b.cz);
    add(scene, boxG(1.8, 0.02, 0.32), MAT.glow, X, 1.99, b.cz, false);
    for (const dx of [-0.8, 0.8]) add(scene, cylG(0.008, 0.008, 1.0, 4), MAT.brass, X + dx, 2.6, b.cz, false);
    const rack = group(scene, b.x1 - 0.2, 0, b.cz + 1.6, -Math.PI / 2);
    add(rack, boxG(0.6, 0.9, 0.06), MAT.darkWood, 0, 0.75, 0);
    for (let i = 0; i < 4; i++) add(rack, cylG(0.012, 0.018, 1.0, 6), std('#c9975a'), -0.22 + i * 0.15, 0.7, 0.05);
  }
  // 도서관
  {
    const b = B.library;
    const sx = b.x1 - 0.32;
    add(scene, boxG(0.45, 1.6, 2.8), MAT.darkWood, sx, 0.8, b.cz);
    add(scene, boxG(0.5, 0.08, 2.9), MAT.trim, sx, 1.62, b.cz);
    const bookMats = ['#7a2a2a', '#2f5d8a', '#b08a3a', '#3f7d4a', '#6a3fa0', '#a8562f', '#1f2d52', '#5a4a3a'].map((c) => std(c, { roughness: 0.8 }));
    for (let lvl = 0; lvl < 4; lvl++) {
      const y = 0.08 + lvl * 0.38;
      add(scene, boxG(0.46, 0.03, 2.7), MAT.wood, sx - 0.02, y, b.cz, false);
      let z = b.cz - 1.28;
      while (z < b.cz + 1.2) {
        const bw = 0.05 + rnd() * 0.05;
        const bh = 0.22 + rnd() * 0.1;
        const bk = add(scene, boxG(0.3, bh, bw), bookMats[Math.floor(rnd() * bookMats.length)], sx - 0.06, y + 0.015 + bh / 2, z + bw / 2, false);
        if (rnd() < 0.06) bk.rotation.x = 0.25;
        z += bw + 0.01;
      }
    }
    const ladder = group(scene, sx - 0.35, 0, b.cz + 0.6);
    for (const dz of [-0.2, 0.2]) {
      const rail = add(ladder, boxG(0.04, 1.7, 0.04), MAT.wood, 0, 0.85, dz);
      rail.rotation.z = -0.18;
    }
    for (let i = 0; i < 6; i++) add(ladder, boxG(0.03, 0.03, 0.4), MAT.wood, -0.02 - i * 0.045, 0.2 + i * 0.26, 0);
    rug(b.cx - 0.8, b.cz, 3.4, 2.4, rugCanvas('#2a2244', '#120e22', '#b08a3a'));
    add(scene, cylG(0.5, 0.5, 0.06, 24), MAT.wood, b.cx - 0.8, 0.72, b.cz);
    add(scene, cylG(0.06, 0.2, 0.7, 10), MAT.darkWood, b.cx - 0.8, 0.35, b.cz);
    add(scene, cylG(0.04, 0.07, 0.25, 8), MAT.brass, b.cx - 0.65, 0.87, b.cz - 0.1);
    add(scene, cylG(0.07, 0.16, 0.12, 12), std('#1f6a3a', { emissive: '#3f9a55', emissiveIntensity: 0.6, side: THREE.DoubleSide }), b.cx - 0.65, 1.02, b.cz - 0.1);
    add(scene, boxG(0.3, 0.05, 0.22), MAT.red, b.cx - 0.95, 0.77, b.cz + 0.15);
    armchair(scene, b.cx - 2.1, b.cz + 0.3, Math.PI / 2 + 0.3, MAT.velvet);
    armchair(scene, b.cx + 0.4, b.cz + 0.6, -Math.PI / 2 - 0.4, MAT.velvet);
    const gl = group(scene, b.cx + 1.3, 0, b.cz - 1.4);
    add(gl, cylG(0.03, 0.03, 0.6, 8), MAT.darkWood, 0, 0.3, 0);
    add(gl, new THREE.SphereGeometry(0.28, 24, 16), std('#3a6fb8', { roughness: 0.45 }), 0, 0.85, 0);
    add(gl, new THREE.TorusGeometry(0.33, 0.018, 6, 32), MAT.gold, 0, 0.85, 0).rotation.set(0, 0.6, 0.4);
  }
  // 라운지
  {
    const b = B.lounge;
    const fx = b.x0 + 0.33;
    const fz = b.cz + 0.7;
    add(scene, boxG(0.5, 1.0, 1.9), std('#6e665c', { roughness: 0.95 }), fx, 0.5, fz);
    add(scene, boxG(0.54, 0.1, 2.0), MAT.marble, fx + 0.02, 0.1, fz);
    add(scene, boxG(0.12, 0.55, 1.0), MAT.black, fx + 0.2, 0.33, fz);
    add(scene, boxG(0.7, 0.08, 2.2), MAT.marble, fx + 0.06, 1.03, fz);
    add(scene, boxG(0.15, 0.22, 0.2), MAT.gold, fx + 0.1, 1.18, fz);
    for (const dz of [-0.8, 0.8]) candle(scene, fx + 0.1, 1.07, fz + dz, 1.3);
    const fire = add(scene, new THREE.ConeGeometry(0.22, 0.45, 8), new THREE.MeshBasicMaterial({ color: '#ff8a2a' }), fx + 0.22, 0.28, fz, false);
    fire.userData.dynamic = true;
    flames.push(fire);
    const fire2 = add(scene, new THREE.ConeGeometry(0.12, 0.3, 8), new THREE.MeshBasicMaterial({ color: '#ffd27a' }), fx + 0.24, 0.24, fz + 0.1, false);
    fire2.userData.dynamic = true;
    flames.push(fire2);
    const fl = new THREE.PointLight('#ff7a2a', 9, 5, 1.8);
    fl.position.set(fx + 0.6, 0.5, fz);
    scene.add(fl);
    flickers.push({ l: fl, base: 9, ph: 1.3, fast: true });
    rug(b.cx - 0.2, fz, 3.0, 2.8, rugCanvas('#5a1420', '#2a0a10', '#c9a23a'));
    const sofa = group(scene, b.cx + 0.9, 0, fz);
    add(sofa, boxG(0.8, 0.32, 2.0), MAT.velvet, 0, 0.28, 0);
    add(sofa, boxG(0.66, 0.1, 1.8), MAT.velvetLight, -0.04, 0.47, 0);
    add(sofa, boxG(0.22, 0.66, 2.0), MAT.velvet, 0.36, 0.62, 0);
    add(sofa, boxG(0.9, 0.5, 0.2), MAT.velvet, 0, 0.42, -1.0);
    add(sofa, boxG(0.9, 0.5, 0.2), MAT.velvet, 0, 0.42, 1.0);
    for (const dz of [-0.5, 0.5]) add(sofa, boxG(0.12, 0.3, 0.4), std('#c9a23a', { roughness: 0.9 }), 0.2, 0.62, dz).rotation.z = 0.2;
    table(scene, b.cx - 0.7, fz, 0.6, 0.9, 0.4, MAT.darkWood);
    add(scene, cylG(0.05, 0.07, 0.18, 10), std('#c8862a', { transparent: true, opacity: 0.7, roughness: 0.05 }), b.cx - 0.7, 0.52, fz + 0.2);
    add(scene, cylG(0.03, 0.03, 1.5, 8), MAT.brass, b.cx + 2.3, 0.75, b.cz - 1.2);
    add(scene, cylG(0.14, 0.24, 0.25, 14), std('#e8d7a8', { emissive: '#ffcf7a', emissiveIntensity: 0.8, side: THREE.DoubleSide }), b.cx + 2.3, 1.52, b.cz - 1.2);
  }
  // 현관홀
  {
    const b = B.hall;
    rug(b.cx, b.cz + 0.3, 1.4, 5.2, rugCanvas('#7a1f2a', '#3a0a10', '#c9a23a'));
    for (const sx of [-1, 1]) {
      const X = b.cx + sx * 1.8;
      const Z = b.cz - 1.2;
      add(scene, boxG(0.6, 0.2, 0.6), MAT.marble, X, 0.1, Z);
      add(scene, cylG(0.21, 0.23, 1.5, 20), MAT.marble, X, 0.95, Z);
      add(scene, boxG(0.56, 0.14, 0.56), MAT.marble, X, 1.77, Z);
      add(scene, new THREE.SphereGeometry(0.16, 16, 12), MAT.marble, X, 2.0, Z);
    }
    const cl = group(scene, b.cx - 2.55, 0, b.cz + 1.3);
    add(cl, boxG(0.45, 1.7, 0.4), MAT.darkWood, 0, 0.85, 0);
    add(cl, boxG(0.5, 0.1, 0.45), MAT.trim, 0, 1.72, 0);
    const face = add(cl, cylG(0.16, 0.16, 0.02, 24), MAT.cream, 0.235, 1.42, 0);
    face.rotation.z = Math.PI / 2;
    add(cl, boxG(0.02, 0.4, 0.04), MAT.gold, 0.235, 0.85, 0);
    const armor = group(scene, b.cx + 2.4, 0, b.cz + 1.6, -Math.PI / 2);
    add(armor, boxG(0.4, 0.08, 0.4), MAT.darkWood, 0, 0.04, 0);
    for (const sx of [-0.08, 0.08]) add(armor, cylG(0.05, 0.06, 0.6, 10), MAT.steel, sx, 0.38, 0);
    add(armor, cylG(0.16, 0.12, 0.5, 12), MAT.steel, 0, 0.92, 0);
    add(armor, new THREE.SphereGeometry(0.2, 14, 10), MAT.steel, 0, 1.18, 0);
    add(armor, new THREE.SphereGeometry(0.11, 14, 10), MAT.steel, 0, 1.4, 0);
    add(armor, boxG(0.12, 0.02, 0.02), MAT.black, 0, 1.41, 0.1);
    add(armor, cylG(0.012, 0.012, 1.7, 6), MAT.darkWood, 0.26, 0.85, 0);
    add(armor, new THREE.ConeGeometry(0.04, 0.16, 6), MAT.steel, 0.26, 1.78, 0);
  }
  // 서재
  {
    const b = B.study;
    const X = b.cx - 0.4;
    rug(X, b.cz, 3.0, 2.4, rugCanvas('#1a2a4a', '#0a1020', '#b08a3a'));
    add(scene, boxG(1.9, 0.08, 0.85), MAT.darkWood, X, 0.76, b.cz + 0.1);
    add(scene, boxG(1.7, 0.03, 0.7), std('#2a4a2e', { roughness: 0.9 }), X, 0.805, b.cz + 0.1, false);
    for (const sx of [-1, 1]) add(scene, boxG(0.5, 0.72, 0.8), MAT.wood, X + sx * 0.66, 0.36, b.cz + 0.1);
    for (const sx of [-1, 1]) for (const dy of [0.2, 0.45]) add(scene, boxG(0.12, 0.02, 0.02), MAT.gold, X + sx * 0.66, dy, b.cz + 0.51, false);
    add(scene, cylG(0.08, 0.1, 0.04, 12), MAT.brass, X + 0.6, 0.84, b.cz - 0.05);
    add(scene, cylG(0.015, 0.015, 0.3, 6), MAT.brass, X + 0.6, 0.99, b.cz - 0.05);
    add(scene, cylG(0.06, 0.16, 0.13, 14), std('#1f6a3a', { emissive: '#2fa860', emissiveIntensity: 0.55, side: THREE.DoubleSide }), X + 0.6, 1.16, b.cz - 0.05);
    const paper = add(scene, new THREE.PlaneGeometry(0.34, 0.24), new THREE.MeshStandardMaterial({ map: canvasTex(paperCanvas()), roughness: 0.9 }), X - 0.2, 0.825, b.cz + 0.15, false);
    paper.rotation.set(-Math.PI / 2, 0, 0.3);
    add(scene, boxG(0.34, 0.12, 0.24), MAT.iron, X - 0.6, 0.88, b.cz);
    add(scene, boxG(0.3, 0.02, 0.14), MAT.cream, X - 0.6, 0.97, b.cz - 0.08).rotation.x = -0.5;
    chair(scene, X, b.cz - 0.75, 0, MAT.velvet);
    const gx = b.cx - 2.5;
    const gz = b.cz + 0.3;
    add(scene, cylG(0.18, 0.22, 0.06, 16), MAT.darkWood, gx, 0.03, gz);
    add(scene, cylG(0.03, 0.03, 0.5, 8), MAT.darkWood, gx, 0.3, gz);
    add(scene, new THREE.SphereGeometry(0.3, 24, 16), std('#3a6fb8', { roughness: 0.45 }), gx, 0.85, gz);
    add(scene, new THREE.TorusGeometry(0.35, 0.02, 6, 32), MAT.gold, gx, 0.85, gz).rotation.set(0, 0.6, 0.4);
    const safe = group(scene, b.cx + 2.0, 0, b.cz + 0.4, -Math.PI / 2);
    add(safe, boxG(0.5, 0.6, 0.45), std('#2a2e34', { metalness: 0.6, roughness: 0.4 }), 0, 0.3, 0);
    add(safe, cylG(0.07, 0.07, 0.03, 16), MAT.gold, 0, 0.35, 0.235).rotation.x = Math.PI / 2;
    const sl = new THREE.PointLight('#9fffc0', 3, 3, 2);
    sl.position.set(X + 0.6, 1.2, b.cz);
    scene.add(sl);
  }
}

function buildPassages() {
  for (const r of ROOMS) {
    if (!r.passage) continue;
    const [x, y, w] = r.rect;
    const px = cx(x === 0 ? x : x + w - 1);
    const pz = cz(y + 1);
    add(scene, boxG(0.78, 0.02, 0.78), MAT.black, px, 0.011, pz, false);
    for (let i = 0; i < 3; i++) add(scene, boxG(0.6, 0.02, 0.14), std('#3a2a20'), px, 0.022, pz - 0.2 + i * 0.2, false);
    for (const [dx, dz, ww, dd] of [[0, -0.4, 0.84, 0.06], [0, 0.4, 0.84, 0.06], [-0.4, 0, 0.06, 0.84], [0.4, 0, 0.06, 0.84]]) {
      add(scene, boxG(ww, 0.05, dd), MAT.gold, px + dx, 0.03, pz + dz, false);
    }
    const hatch = group(scene, px, 0.05, pz - 0.39);
    hatch.rotation.x = -1.15;
    add(hatch, boxG(0.72, 0.04, 0.72), MAT.wood, 0, 0, 0.36);
    add(hatch, boxG(0.1, 0.02, 0.05), MAT.brass, 0, 0.03, 0.62);
    sprite(labelCanvas('비밀 통로', `→ ${ROOM[r.passage].name}`), 1.3, 0.45, px, 0.95, pz);
  }
}

function buildRim() {
  const hx = W / 2 + 0.42;
  const hz = H / 2 + 0.42;
  const post = (x, z) => {
    add(scene, boxG(0.12, 0.26, 0.12), MAT.darkWood, x, 0.13, z);
    add(scene, new THREE.SphereGeometry(0.07, 10, 8), MAT.gold, x, 0.31, z);
  };
  for (let x = -hx; x <= hx + 0.01; x += 1.5) { post(x, -hz); post(x, hz); }
  for (let z = -hz + 1.5; z < hz; z += 1.5) { post(-hx, z); post(hx, z); }
  add(scene, boxG(hx * 2, 0.04, 0.06), MAT.trim, 0, 0.22, -hz);
  add(scene, boxG(hx * 2, 0.04, 0.06), MAT.trim, 0, 0.22, hz);
  add(scene, boxG(0.06, 0.04, hz * 2), MAT.trim, -hx, 0.22, 0);
  add(scene, boxG(0.06, 0.04, hz * 2), MAT.trim, hx, 0.22, 0);
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    const pts = [[0.2, 0], [0.12, 0.08], [0.1, 0.2], [0.26, 0.4], [0.3, 0.55], [0.24, 0.6], [0, 0.6]].map(([a, b]) => new THREE.Vector2(a, b));
    add(scene, new THREE.LatheGeometry(pts, 18), MAT.marble, x, 0, z);
    const plantG = leafPlant(scene, x, z, 0.9);
    plantG.position.y = 0.3;
  }
}

function buildTableProps() {
  const y = -0.58;
  // 돋보기
  const mg = group(scene, 15.8, y, 5.5, 0.6);
  add(mg, new THREE.TorusGeometry(0.55, 0.06, 12, 40), MAT.brass, 0, 0.06, 0).rotation.x = Math.PI / 2;
  add(mg, cylG(0.53, 0.53, 0.02, 32), std('#dff2ff', { transparent: true, opacity: 0.25, roughness: 0.02, metalness: 0.2 }), 0, 0.06, 0, false);
  const handle = add(mg, cylG(0.07, 0.08, 1.0, 12), MAT.darkWood, 0, 0.07, 1.05);
  handle.rotation.x = Math.PI / 2;
  // 수첩 + 만년필
  const nb = group(scene, -16.2, y, -3.5, -0.3);
  add(nb, boxG(2.4, 0.08, 1.7), std('#3a1a14'), 0, 0.04, 0);
  const page = add(nb, new THREE.PlaneGeometry(2.3, 1.6), new THREE.MeshStandardMaterial({ map: canvasTex(paperCanvas()), roughness: 0.95 }), 0, 0.085, 0, false);
  page.rotation.x = -Math.PI / 2;
  const pen = add(nb, cylG(0.035, 0.04, 1.2, 10), MAT.black, 0.3, 0.14, 1.1);
  pen.rotation.set(0, 0, Math.PI / 2);
  add(nb, cylG(0.04, 0.04, 0.12, 10), MAT.gold, -0.22, 0.14, 1.1).rotation.z = Math.PI / 2;
  // 증거 사진
  [[-15.6, 7.5, 0.4], [-14.9, 9.2, -0.2], [16.2, -6.5, 0.2], [15.4, -8.4, -0.5]].forEach(([x, z, r], i) => {
    const ph = add(scene, new THREE.PlaneGeometry(1.1, 1.4), new THREE.MeshStandardMaterial({ map: canvasTex(photoCanvas(i)), roughness: 0.8 }), x, y + 0.01 + i * 0.002, z, false);
    ph.rotation.set(-Math.PI / 2, 0, r);
  });
  // 촛대
  const cg = group(scene, 16.5, y, -12);
  const pts = [[0.4, 0], [0.3, 0.06], [0.1, 0.12], [0.07, 0.8], [0.22, 0.86], [0.2, 0.9], [0, 0.9]].map(([a, b]) => new THREE.Vector2(a, b));
  add(cg, new THREE.LatheGeometry(pts, 18), MAT.brass, 0, 0, 0);
  candle(cg, 0, 0.9, 0, 3);
  const cl = new THREE.PointLight('#ffb35c', 30, 14, 1.6);
  cl.position.set(16.5, 1.2, -12);
  scene.add(cl);
  flickers.push({ l: cl, base: 30, ph: 5 });
  // 회중시계
  const pw = group(scene, -15.8, y, 12.5);
  add(pw, cylG(0.5, 0.5, 0.12, 32), MAT.gold, 0, 0.06, 0);
  add(pw, cylG(0.42, 0.42, 0.01, 32), MAT.cream, 0, 0.125, 0, false);
  add(pw, boxG(0.02, 0.01, 0.3), MAT.black, 0, 0.135, -0.1, false);
  add(pw, new THREE.TorusGeometry(0.1, 0.03, 8, 16), MAT.gold, 0, 0.06, -0.6);
  // 찻잔
  const cup = group(scene, 15.2, y, 12.5);
  add(cup, cylG(0.55, 0.45, 0.04, 24), MAT.cream, 0, 0.02, 0);
  const cpts = [[0.2, 0], [0.26, 0.05], [0.32, 0.35], [0.3, 0.36], [0.24, 0.1], [0, 0.1]].map(([a, b]) => new THREE.Vector2(a, b));
  add(cup, new THREE.LatheGeometry(cpts, 20), MAT.cream, 0, 0.04, 0);
  add(cup, cylG(0.26, 0.26, 0.01, 20), std('#3a1e0e', { roughness: 0.1 }), 0, 0.34, 0, false);
}

function buildDust() {
  const n = 320;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (rnd() - 0.5) * W;
    pos[i * 3 + 1] = 0.2 + rnd() * 3;
    pos[i * 3 + 2] = (rnd() - 0.5) * H;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const cv = canvas(32, 32);
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,230,180,1)');
  gr.addColorStop(1, 'rgba(255,230,180,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  dust = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: canvasTex(cv), transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);
}

function applyWorldUV(g, s) {
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    if (ny > nx && ny > nz) uv.setXY(i, x * s, z * s);
    else if (nx > nz) uv.setXY(i, z * s, y * s);
    else uv.setXY(i, x * s, y * s);
  }
}

/** 움직이지 않는 가구·벽을 재질별로 하나의 메시로 합쳐 드로우콜을 줄인다 */
function mergeStatic() {
  scene.updateMatrixWorld(true);
  const buckets = new Map();
  const merged = [];
  scene.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || o.userData.dynamic) return;
    const key = o.material.uuid + (o.castShadow ? '|s' : '|n');
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { mat: o.material, cast: o.castShadow, geos: [] }));
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (o.material.userData.wuv) applyWorldUV(g, o.material.userData.wuv);
    g.clearGroups();
    b.geos.push(g);
    merged.push(o);
  });
  for (const o of merged) o.parent.remove(o);
  for (const b of buckets.values()) {
    const geo = mergeGeometries(b.geos, false);
    for (const g of b.geos) g.dispose();
    if (!geo) continue;
    const m = new THREE.Mesh(geo, b.mat);
    m.castShadow = b.cast;
    m.receiveShadow = true;
    scene.add(m);
  }
}

// ───────────────────────── 말 피규어 / 흉기 / 주사위

function portraitTexture(id, color) {
  return svgTexture(`assets/face/${id}.svg`, 256, 256, (g, img) => {
    g.save();
    g.beginPath();
    g.arc(128, 128, 118, 0, Math.PI * 2);
    g.clip();
    g.drawImage(img, 0, 0, 256, 256);
    g.restore();
    g.lineWidth = 16;
    g.strokeStyle = color;
    g.beginPath();
    g.arc(128, 128, 118, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = '#d6b25e';
    g.beginPath();
    g.arc(128, 128, 109, 0, Math.PI * 2);
    g.stroke();
  });
}

function makeFigure(s) {
  const g = new THREE.Group();
  const col = new THREE.Color(s.color);
  const paint = new THREE.MeshStandardMaterial({ color: col, roughness: 0.38, metalness: 0.25 });
  const paintDark = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.5), roughness: 0.5, metalness: 0.2 });
  const skin = std('#e7c3a0', { roughness: 0.55 });
  const hair = std('#1e1418', { roughness: 0.5 });
  add(g, cylG(0.33, 0.37, 0.08, 32), MAT.darkWood, 0, 0.04, 0);
  add(g, new THREE.TorusGeometry(0.35, 0.022, 8, 40), MAT.gold, 0, 0.08, 0).rotation.x = Math.PI / 2;
  add(g, cylG(0.28, 0.28, 0.012, 32), paintDark, 0, 0.086, 0);
  const skirt = s.id === 'han';
  const prof = (skirt
    ? [[0, 0.09], [0.27, 0.09], [0.25, 0.2], [0.18, 0.42], [0.13, 0.55], [0.17, 0.62], [0.15, 0.7], [0.06, 0.74], [0, 0.74]]
    : [[0, 0.09], [0.21, 0.09], [0.19, 0.2], [0.16, 0.4], [0.15, 0.52], [0.2, 0.6], [0.18, 0.69], [0.06, 0.74], [0, 0.74]]).map(([a, b]) => new THREE.Vector2(a, b));
  add(g, new THREE.LatheGeometry(prof, 36), paint);
  add(g, boxG(0.03, 0.44, 0.025), paintDark, 0, 0.38, 0.165);
  for (const sx of [-1, 1]) {
    const arm = add(g, cylG(0.045, 0.06, 0.4, 10), paint, sx * 0.21, 0.5, 0);
    arm.rotation.z = sx * 0.18;
  }
  add(g, cylG(0.05, 0.06, 0.07, 12), skin, 0, 0.77, 0);
  add(g, new THREE.SphereGeometry(0.125, 24, 18), skin, 0, 0.9, 0);
  const top = (r, color, y = 0.93) => add(g, new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), color, 0, y, 0);
  switch (s.id) {
    case 'han':
      top(0.14, hair, 0.9).scale.set(1.05, 1.1, 1.05);
      add(g, new THREE.SphereGeometry(0.07, 12, 10), hair, 0, 0.95, -0.12);
      add(g, new THREE.SphereGeometry(0.04, 10, 8), std('#a8172a'), 0.1, 1.0, 0.04);
      add(g, new THREE.TorusGeometry(0.075, 0.012, 6, 20), MAT.cream, 0, 0.77, 0).rotation.x = Math.PI / 2;
      break;
    case 'kang': {
      add(g, cylG(0.13, 0.12, 0.08, 20), std('#6d6234'), 0, 1.03, 0);
      add(g, new THREE.TorusGeometry(0.12, 0.012, 6, 20), MAT.gold, 0, 1.0, 0).rotation.x = Math.PI / 2;
      const visor = add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), MAT.black, 0, 0.99, 0.02);
      visor.rotation.y = 0;
      add(g, boxG(0.12, 0.025, 0.03), MAT.cream, 0, 0.86, 0.115);
      break;
    }
    case 'baek':
      top(0.13, std('#dcd9d2'), 0.88).scale.set(1.02, 0.8, 1.05);
      for (const sx of [-1, 1]) add(g, new THREE.ConeGeometry(0.035, 0.07, 8), MAT.cream, sx * 0.035, 0.73, 0.1).rotation.z = sx * Math.PI / 2;
      break;
    case 'oh':
      top(0.14, std('#b8a070'), 0.96);
      add(g, cylG(0.22, 0.22, 0.012, 24), std('#a88e60'), 0, 0.96, 0);
      add(g, new THREE.TorusGeometry(0.14, 0.014, 6, 20), std('#4a6a3a'), 0, 0.97, 0).rotation.x = Math.PI / 2;
      for (const sx of [-1, 1]) add(g, new THREE.TorusGeometry(0.035, 0.008, 6, 16), MAT.gold, sx * 0.045, 0.91, 0.115);
      break;
    case 'yoon':
      top(0.11, std('#16203a'), 0.99);
      add(g, cylG(0.19, 0.19, 0.014, 24), std('#16203a'), 0, 0.99, 0);
      for (const sx of [-1, 1]) add(g, boxG(0.06, 0.03, 0.005), MAT.steel, sx * 0.045, 0.91, 0.122);
      break;
    case 'seo': {
      const beret = add(g, new THREE.SphereGeometry(0.16, 20, 12), std('#3a2450'), 0.02, 1.0, 0);
      beret.scale.set(1.1, 0.35, 1.1);
      beret.rotation.z = -0.25;
      add(g, cylG(0.012, 0.012, 0.04, 6), std('#3a2450'), 0, 1.06, 0);
      add(g, new THREE.TorusGeometry(0.09, 0.03, 8, 20), std('#d9a531'), 0, 0.76, 0).rotation.x = Math.PI / 2;
      break;
    }
    default:
  }
  return g;
}

function buildTokens() {
  const turnGeo = new THREE.RingGeometry(0.44, 0.52, 40);
  for (const s of SUSPECTS) {
    const g = makeFigure(s);
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: portraitTexture(s.id, s.color) }));
    badge.scale.set(0.62, 0.62, 1);
    badge.position.y = 1.45;
    g.add(badge);
    const turn = add(g, turnGeo, new THREE.MeshBasicMaterial({ color: '#ffd66b', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }), 0, 0.03, 0, false);
    turn.rotation.x = -Math.PI / 2;
    turn.visible = false;
    const me = add(g, new THREE.ConeGeometry(0.1, 0.18, 4), new THREE.MeshBasicMaterial({ color: '#ffd66b' }), 0, 1.96, 0, false);
    me.rotation.x = Math.PI;
    me.visible = false;
    const [sx, sy] = s.start;
    g.position.set(cx(sx), 0, cz(sy));
    scene.add(g);
    tokens[s.id] = { group: g, badge, turn, me, target: g.position.clone(), moving: 0 };
  }
}

function weaponModel(id) {
  const g = new THREE.Group();
  add(g, cylG(0.3, 0.34, 0.06, 24), std('#2a1a12', { roughness: 0.5 }), 0, 0.03, 0);
  add(g, new THREE.TorusGeometry(0.32, 0.018, 6, 32), MAT.gold, 0, 0.06, 0).rotation.x = Math.PI / 2;
  const inner = new THREE.Group();
  g.add(inner);
  const silver = std('#dfe3ea', { roughness: 0.18, metalness: 0.95 });
  switch (id) {
    case 'candle': {
      const pts = [[0, 0], [0.16, 0], [0.16, 0.03], [0.06, 0.06], [0.04, 0.2], [0.075, 0.24], [0.035, 0.28], [0.035, 0.42], [0.1, 0.45], [0.1, 0.48], [0, 0.48]].map(([a, b]) => new THREE.Vector2(a, b));
      add(inner, new THREE.LatheGeometry(pts, 20), silver, 0, 0.08, 0);
      candle(inner, 0, 0.56, 0, 1.2);
      break;
    }
    case 'dagger': {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0); sh.lineTo(0.05, 0.06); sh.lineTo(0.04, 0.42); sh.lineTo(0, 0.52); sh.lineTo(-0.04, 0.42); sh.lineTo(-0.05, 0.06); sh.closePath();
      const d = new THREE.Group();
      d.position.y = 0.36;
      d.rotation.z = 0.35;
      inner.add(d);
      add(d, new THREE.ExtrudeGeometry(sh, { depth: 0.015, bevelEnabled: false }), MAT.steel, 0, 0, -0.008);
      add(d, boxG(0.24, 0.035, 0.05), MAT.gold, 0, 0, 0);
      add(d, cylG(0.022, 0.022, 0.15, 8), std('#5a2e1d'), 0, -0.09, 0);
      add(d, new THREE.SphereGeometry(0.035, 10, 8), std('#c0392b', { roughness: 0.15 }), 0, -0.18, 0);
      break;
    }
    case 'rope':
      add(inner, new THREE.TorusKnotGeometry(0.13, 0.034, 90, 8, 2, 3), std('#b98a4b', { roughness: 0.95 }), 0, 0.36, 0);
      add(inner, new THREE.TorusGeometry(0.17, 0.035, 8, 24), std('#a57a40', { roughness: 0.95 }), 0, 0.12, 0).rotation.x = Math.PI / 2;
      break;
    case 'poison': {
      const pts = [[0, 0], [0.1, 0], [0.12, 0.02], [0.12, 0.22], [0.06, 0.3], [0.04, 0.33], [0.04, 0.4], [0, 0.4]].map(([a, b]) => new THREE.Vector2(a, b));
      add(inner, new THREE.LatheGeometry(pts, 20), std('#3fa860', { transparent: true, opacity: 0.82, roughness: 0.08, emissive: '#1f6a33', emissiveIntensity: 0.9 }), 0, 0.08, 0);
      add(inner, cylG(0.038, 0.038, 0.07, 10), std('#8a5a34'), 0, 0.51, 0);
      add(inner, cylG(0.123, 0.123, 0.1, 20), MAT.cream, 0, 0.2, 0);
      break;
    }
    case 'revolver': {
      const dark = std('#3b3f47', { metalness: 0.85, roughness: 0.3 });
      const rv = new THREE.Group();
      rv.position.y = 0.3;
      rv.rotation.set(0, 0.5, 0.15);
      inner.add(rv);
      add(rv, cylG(0.026, 0.026, 0.34, 10), dark, 0.14, 0.07, 0).rotation.z = Math.PI / 2;
      add(rv, cylG(0.055, 0.055, 0.1, 12), dark, -0.04, 0.05, 0).rotation.z = Math.PI / 2;
      add(rv, boxG(0.14, 0.1, 0.05), dark, -0.05, 0.05, 0);
      add(rv, boxG(0.065, 0.2, 0.05), std('#6b3b22'), -0.14, -0.07, 0).rotation.z = -0.35;
      add(rv, new THREE.TorusGeometry(0.035, 0.008, 6, 12), dark, -0.02, -0.03, 0);
      break;
    }
    case 'wrench': {
      const wr = new THREE.Group();
      wr.position.y = 0.3;
      wr.rotation.z = 0.5;
      inner.add(wr);
      add(wr, boxG(0.05, 0.36, 0.025), std('#8a2419', { roughness: 0.5 }), 0, 0, 0);
      const head = add(wr, new THREE.TorusGeometry(0.07, 0.026, 8, 16, Math.PI * 1.45), MAT.steel, 0, 0.24, 0);
      head.rotation.z = -Math.PI * 0.22 + Math.PI / 2;
      add(wr, new THREE.TorusGeometry(0.04, 0.016, 6, 16), MAT.steel, 0, -0.21, 0);
      break;
    }
    default:
  }
  return { g, inner };
}

function buildWeapons() {
  WEAPONS.forEach((w, i) => {
    const m = weaponModel(w.id);
    scene.add(m.g);
    weaponObjs[w.id] = { ...m, target: new THREE.Vector3(), ph: i * 1.3, pulse: 0 };
  });
}

const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function pipTexture(v) {
  const cv = canvas(128, 128);
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(64, 54, 10, 64, 64, 90);
  grad.addColorStop(0, '#fffaf0');
  grad.addColorStop(1, '#e2d6bc');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  for (const [a, b] of PIPS[v]) {
    g.fillStyle = v === 1 ? '#a8342c' : '#2a1c14';
    g.beginPath();
    g.arc(64 + a * 32, 64 + b * 32, v === 1 ? 17 : 12, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.beginPath();
    g.arc(64 + a * 32 - 3, 64 + b * 32 - 3, 4, 0, Math.PI * 2);
    g.fill();
  }
  return canvasTex(cv);
}
const FACE = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [0, 0, Math.PI / 2], 5: [0, 0, -Math.PI / 2], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] };

function buildDice() {
  const mats = [2, 5, 1, 6, 3, 4].map((v) => new THREE.MeshStandardMaterial({ map: pipTexture(v), roughness: 0.3 }));
  const geo = new RoundedBoxGeometry(0.5, 0.5, 0.5, 3, 0.07);
  const [x, y, w, h] = CENTER;
  const X = ex(x) + w / 2;
  const Z = ez(y) + h / 2 + 1.7;
  for (let i = 0; i < 2; i++) {
    const m = add(scene, geo, mats, X - 0.45 + i * 0.9, 0.322 + 0.25, Z);
    m.quaternion.setFromEuler(new THREE.Euler(...FACE[i ? 3 : 4]));
    dice.push({ mesh: m, rest: m.position.clone() });
  }
}

function rollDice(values) {
  values.forEach((v, i) => {
    const d = dice[i];
    if (!d) return;
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 1.2);
    const qf = yaw.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...FACE[v])));
    const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.4, Math.random() - 0.5).normalize();
    const spin = Math.PI * (5 + Math.random() * 3);
    const from = d.rest.clone().add(new THREE.Vector3((i - 0.5) * 1.6, 2.2, 2.4));
    const spinQ = new THREE.Quaternion();
    tween(1.05 + i * 0.12, (t) => {
      const e = 1 - Math.pow(1 - t, 3);
      d.mesh.position.lerpVectors(from, d.rest, e);
      d.mesh.position.y = d.rest.y + Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * 1.6 + (1 - e) * 0.6;
      spinQ.setFromAxisAngle(axis, spin * (1 - e));
      d.mesh.quaternion.copy(qf).multiply(spinQ);
    });
  });
}

// ───────────────────────── 상태 반영

function layout(state) {
  const out = { tokens: {}, weapons: {} };
  const inT = {};
  const inW = {};
  for (const s of SUSPECTS) {
    const p = state.pos[s.id];
    if (p.room) (inT[p.room] = inT[p.room] || []).push(s.id);
    else out.tokens[s.id] = new THREE.Vector3(cx(p.cell[0]), 0, cz(p.cell[1]));
  }
  for (const w of WEAPONS) (inW[state.wpos[w.id]] = inW[state.wpos[w.id]] || []).push(w.id);
  for (const r of ROOMS) {
    const [x, y, w, h] = r.rect;
    const t = inT[r.id] || [];
    t.forEach((id, i) => { out.tokens[id] = new THREE.Vector3(cx(x + Math.floor((w - t.length) / 2) + i), 0, cz(y + h - 1)); });
    const ws = inW[r.id] || [];
    ws.forEach((id, i) => { out.weapons[id] = new THREE.Vector3(cx(x + Math.floor((w - ws.length) / 2) + i), 0, cz(y) + 0.1); });
  }
  return out;
}

function update(state, opts) {
  if (!scene) return;
  lastState = state;
  myChar = opts.myChar;
  curChar = opts.curChar;
  const L = layout(state);
  for (const s of SUSPECTS) {
    const tk = tokens[s.id];
    tk.target.copy(L.tokens[s.id]);
    tk.turn.visible = s.id === curChar;
    tk.me.visible = s.id === myChar;
  }
  for (const w of WEAPONS) weaponObjs[w.id].target.copy(L.weapons[w.id]);

  if (opts.suggestRoom) {
    const b = rb(ROOM[opts.suggestRoom]);
    suggestMesh.visible = true;
    suggestMesh.position.set(b.cx, 0.05, b.cz);
    suggestMesh.scale.set(b.w - 0.3, b.h - 0.3, 1);
  } else {
    suggestMesh.visible = false;
  }

  const key = opts.reach ? JSON.stringify([Object.keys(opts.reach.cells), Object.keys(opts.reach.rooms)]) : '';
  if (key !== reachKey) {
    reachKey = key;
    renderReach(opts.reach);
  }
}

const reachCellGeo = new THREE.PlaneGeometry(0.84, 0.84);
const reachMat = new THREE.MeshBasicMaterial({ color: '#ffc43a', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
const reachRoomMat = new THREE.MeshBasicMaterial({ color: '#ffc43a', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
const hoverMat = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
const frameMat = new THREE.MeshBasicMaterial({ color: '#ffd66b', transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
const dotGeo = new THREE.SphereGeometry(0.09, 12, 8);
const dotMat = new THREE.MeshBasicMaterial({ color: '#fff0b8' });

function clearGroup(g) {
  for (const c of [...g.children]) {
    g.remove(c);
    if (c.geometry && c.geometry !== reachCellGeo && c.geometry !== dotGeo) c.geometry.dispose();
  }
}

function renderReach(r) {
  reach = r;
  hovered = null;
  clearGroup(reachGroup);
  clearGroup(pathGroup);
  renderer.domElement.style.cursor = '';
  if (!r) return;
  for (const rid of Object.keys(r.rooms)) {
    const b = rb(ROOM[rid]);
    const m = add(reachGroup, new THREE.PlaneGeometry(b.w - 0.3, b.h - 0.3), reachRoomMat, b.cx, 0.04, b.cz, false);
    m.rotation.x = -Math.PI / 2;
    m.userData = { to: 'room:' + rid, base: reachRoomMat };
    const sh = new THREE.Shape();
    const hw = (b.w - 0.2) / 2;
    const hh = (b.h - 0.2) / 2;
    sh.moveTo(-hw, -hh); sh.lineTo(hw, -hh); sh.lineTo(hw, hh); sh.lineTo(-hw, hh); sh.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-hw + 0.08, -hh + 0.08); hole.lineTo(-hw + 0.08, hh - 0.08); hole.lineTo(hw - 0.08, hh - 0.08); hole.lineTo(hw - 0.08, -hh + 0.08); hole.closePath();
    sh.holes.push(hole);
    const f = add(reachGroup, new THREE.ShapeGeometry(sh), frameMat, b.cx, 0.05, b.cz, false);
    f.rotation.x = -Math.PI / 2;
  }
  for (const k of Object.keys(r.cells)) {
    const [x, y] = parseKey(k);
    const m = add(reachGroup, reachCellGeo, reachMat, cx(x), 0.035, cz(y), false);
    m.rotation.x = -Math.PI / 2;
    m.userData = { to: k, base: reachMat };
  }
}

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pickAt(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(reachGroup.children, false).filter((h) => h.object.userData.to);
  if (!hits.length) return null;
  const cell = hits.find((h) => !h.object.userData.to.startsWith('room:'));
  return (cell || hits[0]).object.userData.to;
}

function setHover(to) {
  if (hovered === to) return;
  hovered = to;
  for (const m of reachGroup.children) if (m.userData.to) m.material = m.userData.to === to ? hoverMat : m.userData.base;
  renderer.domElement.style.cursor = to ? 'pointer' : '';
  clearGroup(pathGroup);
  if (!to || !reach || !myChar) return;
  const path = to.startsWith('room:') ? reach.rooms[to.slice(5)] : reach.cells[to];
  if (!path) return;
  for (const p of path) {
    let v;
    if (p.startsWith('room:')) {
      const b = rb(ROOM[p.slice(5)]);
      v = [b.cx, b.cz];
    } else {
      const [x, y] = parseKey(p);
      v = [cx(x), cz(y)];
    }
    add(pathGroup, dotGeo, dotMat, v[0], 0.16, v[1], false);
  }
}

function animateMove(char, path) {
  const tk = tokens[char];
  if (!tk || !path || !path.length) return;
  const seq = ++tk.moving;
  const pts = [];
  for (const p of path) {
    if (p.startsWith('room:')) break;
    const [x, y] = parseKey(p);
    pts.push(new THREE.Vector3(cx(x), 0, cz(y)));
  }
  const enters = path[path.length - 1].startsWith('room:');
  let i = 0;
  const next = () => {
    if (tk.moving !== seq) return;
    if (i >= pts.length) {
      tk.moving = 0;
      if (enters) sfx('door');
      return;
    }
    const from = tk.group.position.clone().setY(0);
    const to = pts[i++];
    sfx('step');
    tween(0.13, (t) => {
      tk.group.position.lerpVectors(from, to, t);
      tk.group.position.y = Math.sin(Math.PI * t) * 0.3;
    }, next);
  };
  next();
}

function pulseWeapon(id) {
  const w = weaponObjs[id];
  if (w) w.pulse = 1.6;
}

function flash() {
  flashLevel = 1;
}

// ───────────────────────── 카메라

function viewPreset(name) {
  const far = camera.aspect < 1.15 ? Math.min(1.9, 1.15 / camera.aspect) : 1;
  if (name === 'top') return { pos: new THREE.Vector3(0, 40 * far, 0.01), target: new THREE.Vector3(0, 0, 0) };
  return { pos: new THREE.Vector3(0, 30 * far, 27.5 * far), target: new THREE.Vector3(0, 0, 1.6) };
}
function view(name, instant) {
  const v = viewPreset(name);
  flyTo(v.pos, v.target, instant);
}
function focusMine() {
  if (!myChar) return;
  const p = tokens[myChar].group.position;
  flyTo(new THREE.Vector3(p.x, 11, p.z + 9), new THREE.Vector3(p.x, 0, p.z));
}
function flyTo(pos, target, instant) {
  if (instant) {
    camera.position.copy(pos);
    controls.target.copy(target);
    controls.update();
    return;
  }
  camTween = { t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target };
}

// ───────────────────────── 루프

function loop() {
  const rawDt = Math.min(clock.getDelta(), 0.5);
  const dt = Math.min(rawDt, 0.05);
  const t = clock.elapsedTime;

  if (camTween) {
    camTween.t = Math.min(1, camTween.t + rawDt / 0.8);
    const e = 1 - Math.pow(1 - camTween.t, 3);
    camera.position.lerpVectors(camTween.p0, camTween.p1, e);
    controls.target.lerpVectors(camTween.t0, camTween.t1, e);
    if (camTween.t >= 1) camTween = null;
  }
  controls.update();

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    if (tw.dur === Infinity) { tw.fn(); continue; }
    tw.t += rawDt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) {
      tweens.splice(i, 1);
      if (tw.done) tw.done();
    }
  }

  const smooth = 1 - Math.exp(-rawDt * 9);
  for (const s of SUSPECTS) {
    const tk = tokens[s.id];
    if (!tk.moving) {
      tk.group.position.x += (tk.target.x - tk.group.position.x) * smooth;
      tk.group.position.z += (tk.target.z - tk.group.position.z) * smooth;
      tk.group.position.y += (0 - tk.group.position.y) * smooth;
    }
    if (tk.turn.visible) {
      tk.turn.rotation.z = t * 1.5;
      const sc = 1 + Math.sin(t * 4) * 0.08;
      tk.turn.scale.set(sc, sc, sc);
      tk.badge.position.y = 1.45 + Math.sin(t * 3) * 0.06;
    } else {
      tk.badge.position.y = 1.45;
    }
    if (tk.me.visible) tk.me.position.y = 1.96 + Math.sin(t * 4) * 0.05;
  }
  for (const w of WEAPONS) {
    const o = weaponObjs[w.id];
    o.g.position.x += (o.target.x - o.g.position.x) * smooth;
    o.g.position.z += (o.target.z - o.g.position.z) * smooth;
    o.inner.position.y = 0.05 + Math.sin(t * 1.6 + o.ph) * 0.04;
    o.inner.rotation.y += dt * 0.7;
    if (o.pulse > 0) {
      o.pulse = Math.max(0, o.pulse - rawDt);
      const s = 1 + Math.sin(o.pulse * 12) * 0.18 * Math.min(1, o.pulse);
      o.g.scale.set(s, s, s);
    }
  }

  for (const f of flames) {
    const s = 0.85 + Math.sin(t * 17 + f.id) * 0.1 + Math.sin(t * 29 + f.id * 2) * 0.06;
    f.scale.set(s, 0.9 + (s - 0.85) * 2, s);
  }
  for (const fl of flickers) {
    const n = Math.sin(t * (fl.fast ? 9 : 5) + fl.ph) * 0.07 + Math.sin(t * 13.3 + fl.ph * 2) * 0.05;
    fl.l.intensity = fl.base * (1 + n);
  }
  TEX.rain.offset.y -= rawDt * 0.9;
  if (dust) {
    dust.rotation.y = t * 0.01;
    dust.position.y = Math.sin(t * 0.3) * 0.15;
  }
  const pulse = 0.5 + Math.sin(t * 4) * 0.5;
  reachMat.opacity = 0.42 + pulse * 0.3;
  reachRoomMat.opacity = 0.2 + pulse * 0.18;
  if (suggestMesh.visible) suggestMesh.material.opacity = 0.12 + pulse * 0.16;

  if (flashLevel > 0) flashLevel = Math.max(0, flashLevel - rawDt * 1.4);
  hemi.intensity = 1.0 + flashLevel * 6 * (Math.sin(t * 60) > -0.2 ? 1 : 0.2);

  renderer.render(scene, camera);
}

export const Board = {
  build,
  update,
  animateMove,
  pulseWeapon,
  rollDice,
  flash,
  get ready() { return !!scene; },
};
