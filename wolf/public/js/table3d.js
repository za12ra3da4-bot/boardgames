// 3D 게임 테이블: 달밤 숲속의 둥근 나무 탁자, 촛불, 3D 카드 (뒤집기·바꾸기·엿보기 애니메이션), 투표 화살표
import { THREE, PATHS, makeRenderer, sky, moon, forest, village, ground, silhouette, flame, particles, canvasTex, ease } from './world3d.js';

const W = window.WOLF;
const CARD_W = 1.15;
const CARD_H = 1.61;
const TABLE_R = 7.2;
const SEAT_R = 5.3;
const AV_COLORS = ['#b8322a', '#2a6ab8', '#3a8a4a', '#c8902a', '#7a3aa8', '#2a9a9a', '#c85a8a', '#6a6a2a', '#8a4a2a', '#4a5ab8'];
const TEAM_NAME = { village: '마을 편', wolf: '늑대 편', tanner: '혼자만의 편' };

const loadImg = (src) => new Promise((res) => {
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => res(null);
  im.src = src;
});

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ── 카드 앞면 텍스처: 크림색 틀 + 초상화 + 이름 띠 */
const faceCache = new Map();
async function faceTexture(role) {
  if (faceCache.has(role)) return faceCache.get(role);
  const p = (async () => {
    const R = W.ROLES[role];
    const [art] = await Promise.all([loadImg(`assets/role/${role}.svg`), document.fonts.load('60px "Song Myung"').catch(() => {})]);
    return canvasTex(512, 716, (g) => {
      // 틀
      roundRect(g, 0, 0, 512, 716, 36);
      g.fillStyle = '#f6eed8';
      g.fill();
      const grad = g.createLinearGradient(0, 0, 512, 716);
      grad.addColorStop(0, '#e8c870');
      grad.addColorStop(0.5, '#a8802a');
      grad.addColorStop(1, '#e8c870');
      g.lineWidth = 10;
      g.strokeStyle = grad;
      roundRect(g, 14, 14, 484, 688, 26);
      g.stroke();
      // 그림
      g.save();
      roundRect(g, 34, 34, 444, 444, 18);
      g.clip();
      if (art) g.drawImage(art, 34, 34, 444, 444);
      g.restore();
      g.lineWidth = 3;
      g.strokeStyle = '#2a2010';
      roundRect(g, 34, 34, 444, 444, 18);
      g.stroke();
      // 편 표시
      g.fillStyle = R.team === 'wolf' ? 'rgba(170,30,24,.92)' : R.team === 'tanner' ? 'rgba(110,80,40,.92)' : 'rgba(20,30,50,.8)';
      roundRect(g, 48, 48, 150, 44, 10);
      g.fill();
      g.fillStyle = '#fff';
      g.font = 'bold 26px "Noto Sans KR", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(TEAM_NAME[R.team], 123, 71);
      // 이름 띠
      roundRect(g, 34, 496, 444, 186, 18);
      g.fillStyle = R.color;
      g.fill();
      const shade = g.createLinearGradient(0, 496, 0, 682);
      shade.addColorStop(0, 'rgba(255,255,255,.18)');
      shade.addColorStop(1, 'rgba(0,0,0,.28)');
      g.fillStyle = shade;
      g.fill();
      g.fillStyle = '#fff';
      g.shadowColor = 'rgba(0,0,0,.5)';
      g.shadowOffsetY = 3;
      g.font = `${R.name.length > 4 ? 76 : 92}px "Song Myung", serif`;
      g.fillText(R.name, 256, 572);
      g.shadowOffsetY = 0;
      g.font = 'bold 26px Cinzel, Georgia, serif';
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.fillText(R.en.split('').join(' '), 256, 646);
    });
  })();
  faceCache.set(role, p);
  return p;
}

let backTexP = null;
function backTexture() {
  if (!backTexP) {
    backTexP = loadImg('assets/card-back.svg').then((im) => canvasTex(512, 716, (g) => {
      roundRect(g, 0, 0, 512, 716, 36);
      g.clip();
      if (im) g.drawImage(im, 0, 0, 512, 716);
      else { g.fillStyle = '#0e1c44'; g.fillRect(0, 0, 512, 716); }
    }));
  }
  return backTexP;
}

/** 둥근 모서리 카드 판 (앞/뒤 두 면 + 옆면) */
function cardGeometry() {
  const s = new THREE.Shape();
  const w = CARD_W / 2;
  const h = CARD_H / 2;
  const r = 0.08;
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  const face = new THREE.ShapeGeometry(s, 6);
  // UV 를 0~1 로
  const uv = face.attributes.uv;
  const pos = face.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w) / CARD_W, (pos.getY(i) + h) / CARD_H);
  const edge = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false, curveSegments: 6 });
  edge.translate(0, 0, -0.011);
  return { face, edge };
}
const CARD_GEO = cardGeometry();

class Card3D {
  constructor(scene, key) {
    this.key = key;
    this.group = new THREE.Group();
    this.inner = new THREE.Group();
    this.group.add(this.inner);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7 });
    this.edge = new THREE.Mesh(CARD_GEO.edge, edgeMat);
    this.backMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05 });
    this.frontMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
    const back = new THREE.Mesh(CARD_GEO.face, this.backMat);
    back.position.z = 0.012;
    const front = new THREE.Mesh(CARD_GEO.face, this.frontMat);
    front.position.z = -0.012;
    front.rotation.y = Math.PI;
    this.front = front;
    // 선택 표시 테두리
    const glowG = new THREE.ShapeGeometry(new THREE.Shape().absarc(0, 0, 1, 0, Math.PI * 2));
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W + 0.34, CARD_H + 0.34), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 0.6), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    this.halo.position.z = -0.03;
    glowG.dispose();
    this.inner.add(this.edge, back, front, this.halo);
    this.inner.rotation.x = -Math.PI / 2; // 탁자 위에 눕힌다 (뒷면이 위)
    this.edge.castShadow = true;
    back.receiveShadow = true;
    scene.add(this.group);
    backTexture().then((t) => { this.backMat.map = t; this.backMat.needsUpdate = true; });
    this.role = null;
    this.faceUp = 0;       // 0 뒤, 1 앞 (보간)
    this.faceTarget = 0;
    this.lift = 0;
    this.liftTarget = 0;
    this.home = new THREE.Vector3();
    this.homeRot = 0;
    this.pos = new THREE.Vector3();
    this.hover = false;
    this.pickable = false;
    this.picked = false;
    this.tint = new THREE.Color(1, 1, 1);
    this.fx = null;        // 진행 중인 특수 움직임
    this.pickMesh = back;
  }

  async setRole(role) {
    if (this.role === role) return;
    this.role = role;
    if (!role) return;
    const t = await faceTexture(role);
    if (this.role === role) { this.frontMat.map = t; this.frontMat.needsUpdate = true; }
  }

  tick(t, dt) {
    const k = 1 - Math.pow(0.001, dt);
    this.faceUp += (this.faceTarget - this.faceUp) * Math.min(1, dt * 5);
    const hoverLift = (this.hover && this.pickable ? 0.28 : 0) + (this.picked ? 0.45 : 0);
    this.lift += (this.liftTarget + hoverLift - this.lift) * k;
    let p = this.home;
    let rotY = this.homeRot;
    let tilt = 0;
    if (this.fx) {
      const f = this.fx;
      f.t += dt;
      const u = Math.min(1, f.t / f.dur);
      const r = f.run(u, this);
      p = r.pos;
      rotY = r.rotY ?? rotY;
      tilt = r.tilt ?? 0;
      if (u >= 1) this.fx = null;
    }
    this.pos.lerp(p, this.fx ? 1 : Math.min(1, dt * 8));
    const flip = this.faceUp;
    const arc = Math.sin(flip * Math.PI) * 0.9;
    this.group.position.set(this.pos.x, this.pos.y + 0.02 + this.lift + arc, this.pos.z);
    this.group.rotation.set(0, rotY, 0);
    this.inner.rotation.set(-Math.PI / 2 + tilt, flip * Math.PI, 0);
    const glow = this.picked ? 0.95 : this.pickable ? 0.45 + Math.sin(t * 5) * 0.25 + (this.hover ? 0.3 : 0) : 0;
    this.halo.material.opacity += (glow - this.halo.material.opacity) * Math.min(1, dt * 10);
    this.backMat.color.lerp(this.tint, Math.min(1, dt * 4));
    this.frontMat.color.lerp(this.tint, Math.min(1, dt * 4));
  }

  /** 잠깐 들어서 앞면을 보여주고 다시 내려놓는다 (밤에 몰래 보기) */
  peek(camera, dur = 3.2) {
    const start = this.home.clone();
    const eye = new THREE.Vector3();
    this.fx = {
      t: 0,
      dur,
      run: (u) => {
        camera.getWorldPosition(eye);
        const up = u < 0.2 ? ease.out(u / 0.2) : u > 0.8 ? 1 - ease.inOut((u - 0.8) / 0.2) : 1;
        const target = start.clone().lerp(eye, 0.28);
        target.y = start.y + 2.2;
        this.faceTarget = up > 0.5 ? 1 : 0;
        return { pos: start.clone().lerp(target, up), tilt: up * 0.9 };
      },
    };
  }

  /** 다른 자리로 날아갔다가 (보이는 카드는 같으니) 원래 자리로 */
  travel(to, dur = 1.2) {
    const a = this.home.clone();
    this.fx = {
      t: 0,
      dur,
      run: (u) => {
        const k = ease.inOut(u < 0.5 ? u * 2 : (1 - u) * 2);
        const p = a.clone().lerp(to, k);
        p.y += Math.sin(k * Math.PI) * 1.2;
        return { pos: p, rotY: this.homeRot + k * Math.PI };
      },
    };
  }
}

/* ── 탁자 */
function woodTexture() {
  return canvasTex(1024, 1024, (g, w) => {
    g.fillStyle = '#5a3418';
    g.fillRect(0, 0, w, w);
    for (let i = 0; i < 90; i++) {
      g.strokeStyle = `rgba(${30 + Math.random() * 40},${14 + Math.random() * 20},${4},${0.2 + Math.random() * 0.3})`;
      g.lineWidth = 1 + Math.random() * 4;
      g.beginPath();
      const y = Math.random() * w;
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 8 + Math.random() * 3);
      g.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * w;
      const y = Math.random() * w;
      for (let r = 4; r < 30; r += 4) {
        g.strokeStyle = 'rgba(30,14,4,.35)';
        g.beginPath();
        g.ellipse(x, y, r * 1.8, r, 0, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // 판자 이음새
    for (let x = 0; x < w; x += 128) {
      g.fillStyle = 'rgba(20,8,0,.55)';
      g.fillRect(x, 0, 3, w);
    }
  });
}

function feltTexture() {
  return canvasTex(1024, 1024, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, '#24386a');
    r.addColorStop(0.85, '#14224a');
    r.addColorStop(1, '#0a1430');
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
    for (let i = 0; i < 20000; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      g.fillRect(Math.random() * w, Math.random() * w, 1, 1);
    }
    g.strokeStyle = '#c8a44a';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(w / 2, w / 2, w / 2 - 20, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 2;
    g.setLineDash([6, 10]);
    g.beginPath();
    g.arc(w / 2, w / 2, w / 2 - 36, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    // 가운데 달 무늬
    g.globalAlpha = 0.22;
    g.fillStyle = '#f0d890';
    g.beginPath();
    g.arc(w / 2, w / 2, 150, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1a2a5a';
    g.beginPath();
    g.arc(w / 2 + 60, w / 2 - 30, 130, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 0.5;
    g.strokeStyle = '#c8a44a';
    g.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(w / 2 + Math.cos(a) * 220, w / 2 + Math.sin(a) * 220);
      g.lineTo(w / 2 + Math.cos(a) * 250, w / 2 + Math.sin(a) * 250);
      g.stroke();
    }
  });
}

function buildTable(scene) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7, color: 0xb88a60 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(TABLE_R, TABLE_R - 0.1, 0.4, 64), wood);
  top.position.y = -0.2;
  top.receiveShadow = true;
  top.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(TABLE_R, 0.16, 12, 80), new THREE.MeshStandardMaterial({ color: 0x3a200c, roughness: 0.5 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  const felt = new THREE.Mesh(new THREE.CircleGeometry(TABLE_R - 0.9, 64), new THREE.MeshStandardMaterial({ map: feltTexture(), roughness: 1 }));
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = 0.005;
  felt.receiveShadow = true;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 3.2, 16), wood);
  leg.position.y = -1.8;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 0.3, 24), wood);
  foot.position.y = -3.3;
  g.add(top, rim, felt, leg, foot);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(g);
  // 촛대 + 촛불
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.8, roughness: 0.3 });
  const candle = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.12, 20), brass);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.6, 12), brass);
  stem.position.y = 0.36;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.12, 16), brass);
  cup.position.y = 0.7;
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.6 }));
  wax.position.y = 1.1;
  candle.add(base, stem, cup, wax);
  candle.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  candle.position.set(0, 0, -1.9);
  scene.add(candle);
  const fire = flame(candle, new THREE.Vector3(0, 1.56, 0), { size: 0.3, light: 45, range: 30, color: 0xffa050, glow: 0.18 });
  fire.children[2].castShadow = true;
  fire.children[2].shadow.mapSize.set(1024, 1024);
  fire.children[2].shadow.bias = -0.002;
  return { group: g, candle, fire };
}

/* ── 둘러앉은 사람 (실루엣 + 이름 색 목도리) */
function seatFigure(scene, color) {
  const g = new THREE.Group();
  const body = silhouette(PATHS.coat, 4.6, { color: 0x2a3048, rim: 0xffc890, depth: 26 });
  body.position.y = -3.4;
  g.add(body);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 8, 20), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = -3.4 + 4.6 * 0.78;
  scarf.visible = false;
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.8, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.8 }));
  stool.position.y = -1.6;
  g.add(stool);
  scene.add(g);
  return { group: g, body, scarf };
}

/**
 * 3D 테이블을 만든다.
 * @param {HTMLElement} host   캔버스와 이름표가 들어갈 요소
 * @param {{onPick:(key:string)=>void}} opts
 */
export function createTable(host, { onPick }) {
  const world = makeRenderer(host, { bloom: 0.45, threshold: 0.95, radius: 0.4 });
  const { scene, camera, renderer, bloomPass } = world;
  scene.fog = new THREE.FogExp2(0x0a1432, 0.012);
  const s = sky(scene);
  const mo = moon(scene, new THREE.Vector3(-120, 110, -260), 80);
  const hemi = new THREE.HemisphereLight(0x6a88d0, 0x0a0c14, 0.45);
  const moonLight = new THREE.DirectionalLight(0xa8c0ff, 0.9);
  moonLight.position.set(-30, 40, -40);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  Object.assign(moonLight.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 120 });
  scene.add(hemi, moonLight);
  const gr = ground(scene, { color: 0x243050 });
  gr.position.y = -3.45;
  const woods = forest(scene, { count: 360, inner: 26, outer: 220, color: 0x0c1830 });
  woods.position.y = -3.45;
  const vil = village(scene, [[-30, -60, 0.4], [-14, -70, 0], [8, -66, -0.3, 1.2], [26, -58, -0.6], [44, -40, -1]]);
  vil.group.position.y = -3.45;
  const table = buildTable(scene);
  particles(scene, { count: 70, area: [50, 8, 50], center: new THREE.Vector3(0, -3, 0), color: 0xc8ff90, size: 0.25 });

  camera.fov = 48;
  camera.updateProjectionMatrix();
  const camHome = new THREE.Vector3(0, 11.5, 14.8);
  const camLook = new THREE.Vector3(0, -0.2, -0.4);
  camera.position.copy(camHome);
  camera.lookAt(camLook);

  // 이름표 층
  const labels = document.createElement('div');
  labels.className = 't3-labels';
  host.appendChild(labels);

  const cards = new Map();   // key → Card3D
  const figures = new Map(); // pid → seatFigure
  const plates = new Map();  // key → { el, anchor }
  let arrowGroup = new THREE.Group();
  scene.add(arrowGroup);
  let state = { night: true };
  let dayK = 0;
  let orbit = 0;
  let overT = -1;

  const getCard = (key) => {
    if (!cards.has(key)) cards.set(key, new Card3D(scene, key));
    return cards.get(key);
  };
  const plate = (key) => {
    if (!plates.has(key)) {
      const el = document.createElement('div');
      el.className = 't3-plate';
      labels.appendChild(el);
      plates.set(key, { el, anchor: new THREE.Vector3(), html: '' });
    }
    return plates.get(key);
  };

  /* 화면 갱신 */
  function update(v) {
    state = v;
    const n = v.players.length;
    const myIdx = Math.max(0, v.players.findIndex((p) => p.isMe));
    const alive = new Set();
    v.players.forEach((p, i) => {
      const a = Math.PI / 2 + ((i - myIdx) * 2 * Math.PI) / n;
      const c = getCard(p.pid);
      alive.add(p.pid);
      c.home.set(Math.cos(a) * SEAT_R, 0, Math.sin(a) * SEAT_R);
      c.homeRot = -a + Math.PI / 2;
      if (c.pos.lengthSq() === 0) c.pos.copy(c.home);
      c.pickable = !!p.pick;
      c.picked = !!p.picked;
      c.tint.set(p.dead ? 0x8a5a5a : 0xffffff);
      c.faceTarget = v.faces && v.faces[p.pid] ? 1 : c.fx ? c.faceTarget : 0;
      if (v.faces && v.faces[p.pid]) c.setRole(v.faces[p.pid]);
      // 사람
      if (!p.isMe) {
        if (!figures.has(p.pid)) figures.set(p.pid, seatFigure(scene, AV_COLORS[p.seat % AV_COLORS.length]));
        const f = figures.get(p.pid);
        f.group.position.set(Math.cos(a) * (TABLE_R + 1.6), 0, Math.sin(a) * (TABLE_R + 1.6));
        // 판지 인형처럼 늘 카메라 쪽을 본다
        f.group.rotation.y = Math.atan2(camHome.x - f.group.position.x, camHome.z - f.group.position.z);
        f.dead = !!p.dead;
      }
      const pl = plate(p.pid);
      pl.el.dataset.pid = p.pid;
      pl.anchor.set(Math.cos(a) * (p.isMe ? SEAT_R + 1.4 : TABLE_R + 1.6), p.isMe ? 0.05 : 2.2, Math.sin(a) * (p.isMe ? SEAT_R + 1.4 : TABLE_R + 1.6));
      const html = `<div class="tp-name ${p.isMe ? 'me' : ''} ${p.win ? 'win' : ''} ${p.online ? '' : 'off'}"><span class="tp-dot" style="background:${AV_COLORS[p.seat % AV_COLORS.length]}"></span>${p.nameHtml}</div>
        ${p.label ? `<div class="tp-known ${p.labelTeam || ''}">${p.label}</div>` : ''}
        ${p.state ? `<div class="tp-state">${p.state}</div>` : ''}
        ${p.votes ? `<div class="tp-votes">${p.votes}표</div>` : ''}
        ${p.dead ? '<div class="tp-dead">처형</div>' : ''}`;
      if (html !== pl.html) { pl.el.innerHTML = html; pl.html = html; }
    });
    for (let i = 0; i < 3; i++) {
      const key = `c${i}`;
      const c = getCard(key);
      const cc = v.center[i];
      alive.add(key);
      c.home.set((i - 1) * 1.5, 0, 0.3);
      c.homeRot = 0;
      if (c.pos.lengthSq() === 0) c.pos.copy(c.home);
      c.pickable = !!cc.pick;
      c.picked = !!cc.picked;
      c.faceTarget = v.faces && v.faces[key] ? 1 : c.fx ? c.faceTarget : 0;
      if (v.faces && v.faces[key]) c.setRole(v.faces[key]);
      const pl = plate(key);
      pl.anchor.set((i - 1) * 1.5, 0.05, 0.3 + CARD_H / 2 + 0.25);
      const html = `${cc.label ? `<div class="tp-known ${cc.labelTeam || ''}">${cc.label}</div>` : ''}<div class="tp-center">가운데 ${i + 1}</div>`;
      if (html !== pl.html) { pl.el.innerHTML = html; pl.html = html; }
    }
    for (const [k, c] of cards) {
      if (!alive.has(k)) {
        scene.remove(c.group);
        cards.delete(k);
      }
    }
    for (const [k, p] of plates) {
      if (!alive.has(k)) {
        p.el.remove();
        plates.delete(k);
      }
    }
    for (const [k, f] of figures) {
      if (!alive.has(k)) {
        scene.remove(f.group);
        figures.delete(k);
      }
    }
    // 결과: 투표 화살표
    scene.remove(arrowGroup);
    arrowGroup = new THREE.Group();
    if (v.arrows && v.arrows.length) {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.5, 0.3), toneMapped: false, transparent: true, opacity: 0.9 });
      for (const [from, to] of v.arrows) {
        const a = cards.get(from);
        const b = cards.get(to);
        if (!a || !b) continue;
        const p0 = a.home.clone().setY(0.35);
        const p2 = b.home.clone().setY(0.35);
        const mid = p0.clone().lerp(p2, 0.5).setY(2.2 + p0.distanceTo(p2) * 0.12);
        const end = p0.clone().lerp(p2, 0.86).setY(0.6);
        const curve = new THREE.QuadraticBezierCurve3(p0, mid, end);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.045, 6), mat);
        tube.userData.grow = 0;
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10), mat);
        const tan = curve.getTangent(1);
        head.position.copy(end);
        head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
        arrowGroup.add(tube, head);
      }
      arrowGroup.userData.born = performance.now();
    }
    scene.add(arrowGroup);
    if (v.over && overT < 0) overT = 0;
    if (!v.over) overT = -1;
  }

  /* 특수 효과 */
  function peek(key, role) {
    const c = cards.get(key);
    if (!c) return;
    c.setRole(role).then(() => c.peek(camera));
  }
  function swap(a, b) {
    const A = cards.get(a);
    const B = cards.get(b);
    if (!A || !B) return;
    A.travel(B.home.clone());
    B.travel(A.home.clone());
  }
  function shuffleAll() {
    // 눈 감은 사람에게는 모든 카드가 살짝 들썩이는 것만 보인다
    for (const c of cards.values()) {
      if (c.fx) continue;
      const h = c.home.clone();
      c.fx = { t: 0, dur: 0.5 + Math.random() * 0.3, run: (u) => ({ pos: h.clone().setY(Math.sin(u * Math.PI) * 0.15), rotY: c.homeRot + Math.sin(u * Math.PI) * 0.1 }) };
    }
  }

  /* 클릭 · 마우스 올리기 */
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hovered = null;
  const pickAt = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects([...cards.values()].map((c) => c.group), true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.key) o = o.parent;
      if (o) return cards.get(o.userData.key);
    }
    return null;
  };
  const onMove = (e) => {
    const c = pickAt(e);
    if (hovered && hovered !== c) hovered.hover = false;
    hovered = c;
    if (c) c.hover = true;
    renderer.domElement.style.cursor = c && c.pickable ? 'pointer' : 'default';
  };
  const onClick = (e) => {
    const c = pickAt(e);
    if (c && c.pickable) onPick(c.key);
  };
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('click', onClick);

  /* 매 프레임 */
  const tmp = new THREE.Vector3();
  const dayColors = {
    night: { top: new THREE.Color('#030712'), mid: new THREE.Color('#0e2458'), bottom: new THREE.Color('#27508e'), fog: new THREE.Color(0x0a1432) },
    day: { top: new THREE.Color('#3a6ab8'), mid: new THREE.Color('#8ab4e0'), bottom: new THREE.Color('#e8d8b8'), fog: new THREE.Color(0x9ab0c8) },
  };
  world.tickers.add((t, dt) => {
    for (const [k, c] of cards) {
      c.group.userData.key = k;
      c.tick(t, dt);
    }
    // 낮/밤
    const want = state.night ? 0 : 1;
    dayK += (want - dayK) * Math.min(1, dt * 0.8);
    const N = dayColors.night;
    const D = dayColors.day;
    s.uniforms.top.value.copy(N.top).lerp(D.top, dayK);
    s.uniforms.mid.value.copy(N.mid).lerp(D.mid, dayK);
    s.uniforms.bottom.value.copy(N.bottom).lerp(D.bottom, dayK);
    scene.fog.color.copy(N.fog).lerp(D.fog, dayK);
    scene.fog.density = 0.012 - dayK * 0.006;
    s.starMat.opacity = 0.85 * (1 - dayK);
    mo.group.visible = dayK < 0.95;
    mo.disc.material.opacity = 1 - dayK;
    hemi.intensity = 0.45 + dayK * 0.9;
    hemi.color.setRGB(0.42 + dayK * 0.5, 0.53 + dayK * 0.4, 0.82 - dayK * 0.05);
    moonLight.intensity = 0.9 + dayK * 1.6;
    moonLight.color.setRGB(0.66 + dayK * 0.34, 0.75 + dayK * 0.2, 1 - dayK * 0.2);
    moonLight.position.set(-30 + dayK * 50, 40 + dayK * 10, -40 + dayK * 20);
    renderer.toneMappingExposure = 1.05 + dayK * 0.1;
    vil.windows.forEach((w) => w.mat.color.setRGB(3 - dayK * 2.4, 1.9 - dayK * 1.5, 0.7 - dayK * 0.5));
    // 사람들: 숨쉬기, 처형되면 쓰러짐
    let i = 0;
    for (const f of figures.values()) {
      const target = f.dead ? -1.35 : 0;
      f.body.rotation.x += (target - f.body.rotation.x) * Math.min(1, dt * 3);
      f.body.position.y = -3.4 + (f.dead ? 0 : Math.sin(t * 1.6 + i) * 0.03);
      i++;
    }
    // 카메라: 살짝 숨쉬듯, 결과 때는 천천히 돈다
    if (state.over) {
      overT += dt;
      orbit = Math.min(1, overT / 3);
      const ang = Math.sin(overT * 0.15) * 0.5 * orbit;
      tmp.set(Math.sin(ang) * 14, 13 - orbit * 0.5, Math.cos(ang) * 14);
      camera.position.lerp(tmp, Math.min(1, dt * 1.5));
    } else {
      tmp.copy(camHome);
      tmp.x += Math.sin(t * 0.3) * 0.25;
      tmp.y += Math.sin(t * 0.4) * 0.12;
      camera.position.lerp(tmp, Math.min(1, dt * 2));
    }
    camera.lookAt(camLook);
    // 화살표가 자라난다
    if (arrowGroup.children.length) {
      const k = Math.min(1, (performance.now() - arrowGroup.userData.born) / 1200);
      arrowGroup.children.forEach((m) => { if (m.material) m.material.opacity = 0.9 * k; });
    }
    bloomPass.strength = 0.45 - dayK * 0.2;
    // 이름표 위치
    const w = host.clientWidth;
    const h = host.clientHeight;
    for (const p of plates.values()) {
      tmp.copy(p.anchor).project(camera);
      p.el.style.transform = `translate(-50%, -50%) translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
      p.el.style.display = tmp.z < 1 ? '' : 'none';
    }
  });

  return {
    update,
    peek,
    swap,
    shuffleAll,
    dispose() {
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('click', onClick);
      labels.remove();
      world.dispose();
    },
  };
}
