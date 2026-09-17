// 3D 공용 재료: 밤하늘, 보름달, 전나무 숲, 마을, 실루엣 인물, 횃불, 입자, 후처리(빛 번짐)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export { THREE };

export const PATHS = {
  wolf: 'M-13 0L-9 -20C-14 -30 -18 -40 -16 -52C-21 -55 -27 -58 -31 -54L-36 -49L-35 -55L-39 -53L-35 -59C-30 -65 -22 -66 -15 -62C-13 -70 -9 -76 -3 -78L-7 -92L1 -83C4 -85 7 -85 10 -83L13 -96L15 -80C19 -78 25 -76 31 -73L33 -69C27 -69 22 -67 18 -67C18 -63 16 -61 14 -59C22 -57 29 -53 33 -47L39 -45L35 -43L39 -39L33 -41C29 -47 23 -49 16 -49C18 -39 16 -29 12 -19L16 0H8L4 -17H-2L-6 0Z',
  // 달을 보며 우는 늑대인간 (고개를 치켜든 자세)
  howl: 'M-14 0L-10 -22C-16 -34 -18 -46 -14 -56C-20 -58 -28 -58 -32 -52L-38 -46L-37 -53L-42 -50L-38 -57C-32 -64 -22 -66 -14 -63C-12 -70 -8 -74 -2 -76C0 -80 0 -86 2 -90L-2 -102L6 -94C8 -98 12 -104 16 -108L20 -124L22 -110C26 -112 30 -116 32 -118L34 -114C30 -108 26 -104 22 -100C20 -94 18 -86 16 -80C20 -74 18 -66 14 -60C22 -58 30 -54 34 -48L40 -46L36 -44L40 -40L34 -42C30 -48 24 -50 16 -50C18 -40 16 -30 12 -20L16 0H8L4 -18H-2L-6 0Z',
  coat: 'M-6 -79C-13 -78 -17 -74 -18 -66L-21 -38C-21 -35 -17 -35 -16 -37L-14 -56L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -56L16 -37C17 -35 21 -35 21 -38L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z',
  cheer: 'M-6 -79C-13 -78 -17 -74 -18 -66L-24 -96C-25 -99 -21 -100 -20 -97L-14 -68L-14 -28L-13 -1H-3L-1 -38H1L3 -1H13L14 -28L14 -56L16 -37C17 -35 21 -35 21 -38L18 -66C17 -74 13 -78 6 -79ZM-7 -88C-7 -97 7 -97 7 -88C7 -83 4 -79 0 -79C-4 -79 -7 -83 -7 -88Z',
  fork: 'M-1 0H1V-110H-1ZM-6 -110V-122H-5V-112H-1V-124H1V-112H5V-122H6V-110Z',
  ghost: 'M-20 0C-20 -40 -16 -70 0 -70C16 -70 20 -40 20 0L14 -6L8 0L2 -6L-4 0L-10 -6Z',
  crow: 'M0 0C-3 -3 -8 -3 -12 0C-9 0 -8 2 -8 3C-6 1 -3 2 -2 3L0 1L2 3C3 2 6 1 8 3C8 2 9 0 12 0C8 -3 3 -3 0 0Z',
};

const shapeCache = new Map();
/** SVG path → 3D 도형 (키 100 단위, 위쪽이 +y) */
export function pathShapes(d) {
  if (shapeCache.has(d)) return shapeCache.get(d);
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  shapeCache.set(d, shapes);
  return shapes;
}

/** 두께가 있는 실루엣 (높이 h 미터) */
export function silhouette(d, h, { color = 0x05070e, depth = 6, rim = 0x9ab4ff, emissive = 0x000000, emissiveIntensity = 1 } = {}) {
  const geo = new THREE.ExtrudeGeometry(pathShapes(d), { depth, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 0.6, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -depth / 2);
  geo.scale(h / 100, -h / 100, h / 100);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, emissive, emissiveIntensity, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  if (rim) {
    // 가장자리 달빛: 보는 방향과 면이 직각에 가까울수록 밝게 (프레넬)
    const rimMat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(rim).multiplyScalar(1.6) }, power: { value: 2.2 }, strength: { value: 1 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 color; uniform float power; uniform float strength; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), power); gl_FragColor = vec4(color * f * strength, f); }',
    });
    const edge = new THREE.Mesh(geo, rimMat);
    mesh.add(edge);
    mesh.userData.rim = rimMat;
  }
  return mesh;
}

/* ── 캔버스 텍스처 */
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function glowTex(inner = 'rgba(255,240,190,1)', outer = 'rgba(255,200,120,0)') {
  return canvasTex(256, 256, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, inner);
    r.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.5)'));
    r.addColorStop(1, outer);
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
  });
}

function rnd(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/* ── 하늘 (그라데이션 돔 + 별) */
export function sky(scene, { top = '#030712', mid = '#0e2458', bottom = '#27508e', stars = 1400 } = {}) {
  const uniforms = { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, bottom: { value: new THREE.Color(bottom) } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.8, h)) : mix(bottom, mid, smoothstep(-0.05, 0.15, h)); gl_FragColor = vec4(c, 1.0); }`,
  }));
  scene.add(dome);
  const r = rnd(7);
  const pos = [];
  for (let i = 0; i < stars; i++) {
    const a = r() * Math.PI * 2;
    const y = 0.08 + r() * 0.92;
    const rr = Math.sqrt(1 - y * y);
    pos.push(Math.cos(a) * rr * 850, y * 850, Math.sin(a) * rr * 850);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false });
  const points = new THREE.Points(sg, starMat);
  scene.add(points);
  return { dome, uniforms, stars: points, starMat };
}

/* ── 보름달 (크레이터 텍스처 + 빛무리) */
export function moon(scene, pos, size = 80) {
  const tex = canvasTex(512, 512, (g, w) => {
    const r = g.createRadialGradient(w * 0.45, w * 0.42, w * 0.05, w / 2, w / 2, w / 2);
    r.addColorStop(0, '#fffef4');
    r.addColorStop(0.75, '#f6e8b8');
    r.addColorStop(1, '#d8bc78');
    g.fillStyle = r;
    g.beginPath();
    g.arc(w / 2, w / 2, w / 2 - 2, 0, Math.PI * 2);
    g.fill();
    const rr = rnd(3);
    g.fillStyle = 'rgba(160,140,100,.28)';
    for (let i = 0; i < 26; i++) {
      const x = w * 0.2 + rr() * w * 0.6;
      const y = w * 0.2 + rr() * w * 0.6;
      g.beginPath();
      g.ellipse(x, y, 8 + rr() * 50, 6 + rr() * 34, rr() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
  const group = new THREE.Group();
  const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, depthWrite: false, toneMapped: false, color: new THREE.Color(0.86, 0.84, 0.76) }));
  disc.scale.setScalar(size);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,244,200,0.9)', 'rgba(140,170,240,0)'), fog: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.32 }));
  halo.scale.setScalar(size * 2.6);
  halo.userData.base = size * 2.6;
  group.add(halo, disc);
  group.position.copy(pos);
  scene.add(group);
  return { group, disc, halo };
}

/* ── 전나무 (인스턴스로 많이) */
export function forest(scene, { count = 400, inner = 40, outer = 300, seed = 11, color = 0x0b1428, avoid = null } = {}) {
  const r = rnd(seed);
  const trunk = new THREE.CylinderGeometry(0.25, 0.35, 2, 5);
  trunk.translate(0, 1, 0);
  const tiers = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.ConeGeometry(2.6 - i * 0.5, 3.4, 7);
    g.translate(0, 2.6 + i * 1.7, 0);
    tiers.push(g);
  }
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
  const meshes = tiers.map((g) => new THREE.InstancedMesh(g, mat, count));
  const tm = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 1 }), count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let n = 0;
  for (let i = 0; i < count * 3 && n < count; i++) {
    const a = r() * Math.PI * 2;
    const d = inner + Math.pow(r(), 0.7) * (outer - inner);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (avoid && avoid(x, z)) continue;
    const s = 1.4 + r() * 2.4;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6);
    m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s * (0.9 + r() * 0.5), s));
    meshes.forEach((me) => me.setMatrixAt(n, m));
    tm.setMatrixAt(n, m);
    n++;
  }
  const group = new THREE.Group();
  for (const me of [...meshes, tm]) {
    me.count = n;
    me.castShadow = true;
    me.receiveShadow = true;
    group.add(me);
  }
  scene.add(group);
  return group;
}

/* ── 마을 집들 (창문 불빛은 따로 조절 가능) */
export function village(scene, spots, { wall = 0x1a1a24, roof = 0x10101a } = {}) {
  const group = new THREE.Group();
  const windows = [];
  const wallMat = new THREE.MeshStandardMaterial({ color: wall, roughness: 0.95 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roof, roughness: 0.9, flatShading: true });
  spots.forEach(([x, z, rot = 0, s = 1], i) => {
    const h = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), wallMat);
    body.position.y = 2;
    const roofG = new THREE.ConeGeometry(4.9, 3, 4);
    roofG.rotateY(Math.PI / 4);
    roofG.scale(1.25, 1, 1);
    const rf = new THREE.Mesh(roofG, roofMat);
    rf.position.y = 5.5;
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), wallMat);
    chim.position.set(1.6, 6, 0.8);
    h.add(body, rf, chim);
    for (const wx of [-1.5, 1.5]) {
      const wm = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.9, 0.7), toneMapped: false });
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), wm);
      win.position.set(wx, 2.4, 2.51);
      h.add(win);
      windows.push({ mesh: win, mat: wm, i });
    }
    h.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    h.position.set(x, 0, z);
    h.rotation.y = rot;
    h.scale.setScalar(s);
    group.add(h);
  });
  scene.add(group);
  return { group, windows };
}

/* ── 땅 */
export function ground(scene, { color = 0x0a1020, size = 1400 } = {}) {
  const tex = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#6a7060';
    g.fillRect(0, 0, w, w);
    const r = rnd(5);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = `rgba(${40 + r() * 60},${50 + r() * 60},${30 + r() * 40},${0.3 + r() * 0.4})`;
      g.fillRect(r() * w, r() * w, 2 + r() * 3, 2 + r() * 6);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(60, 60);
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 48), new THREE.MeshStandardMaterial({ color, map: tex, roughness: 1 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/* ── 불꽃 (횃불·촛불): 흔들리는 빛 + 빛나는 스프라이트 */
const flameTex = () => glowTex('rgba(255,210,120,1)', 'rgba(255,90,20,0)');
export function flame(parent, pos, { size = 1, light = 2.5, range = 18, color = 0xffa040, glow: glowAmt = 0.5 } = {}) {
  const g = new THREE.Group();
  g.position.copy(pos);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex(), blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2.4, 1.6, 0.8), toneMapped: false }));
  core.scale.set(size * 0.8, size * 1.3, 1);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: glowAmt }));
  glow.scale.setScalar(size * 5);
  const pl = new THREE.PointLight(color, light, range, 1.6);
  g.add(core, glow, pl);
  parent.add(g);
  const seed = Math.random() * 100;
  g.userData.tick = (t) => {
    const k = 0.85 + Math.sin(t * 17 + seed) * 0.08 + Math.sin(t * 29 + seed * 2) * 0.07;
    core.scale.set(size * 0.8 * k, size * 1.3 * (2 - k), 1);
    pl.intensity = light * k;
  };
  return g;
}

/* ── 떠다니는 입자 (반딧불·불씨·비·먼지) */
export function particles(scene, { count = 300, area = [80, 30, 80], center = new THREE.Vector3(), color = 0xffd070, size = 0.35, speed = [0, 0.3, 0], additive = true, streak = false } = {}) {
  const pos = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center.x + (Math.random() - 0.5) * area[0];
    pos[i * 3 + 1] = center.y + Math.random() * area[1];
    pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * area[2];
    vel.push(Math.random());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size, map: glowTex(), transparent: true, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: streak ? 0.5 : 1,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  pts.userData.tick = (t, dt) => {
    for (let i = 0; i < count; i++) {
      const v = vel[i];
      pos[i * 3] += (speed[0] + Math.sin(t * 0.7 + v * 20) * 0.3 * (streak ? 0 : 1)) * dt;
      pos[i * 3 + 1] += speed[1] * (0.5 + v) * dt;
      pos[i * 3 + 2] += (speed[2] + Math.cos(t * 0.6 + v * 30) * 0.3 * (streak ? 0 : 1)) * dt;
      if (pos[i * 3 + 1] > center.y + area[1]) pos[i * 3 + 1] = center.y;
      if (pos[i * 3 + 1] < center.y) pos[i * 3 + 1] = center.y + area[1];
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

/* ── 안개 판 (겹겹이 흐르는 안개) */
export function mistLayers(scene, { y = 1.5, count = 14, radius = 120, opacity = 0.1, color = '#6a7ca8' } = {}) {
  const tex = canvasTex(256, 256, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, `${color}ff`);
    r.addColorStop(1, `${color}00`);
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
  });
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
    const a = Math.random() * Math.PI * 2;
    const d = radius * (0.35 + Math.random() * 0.65);
    s.position.set(Math.cos(a) * d, y + Math.random() * 3, Math.sin(a) * d);
    s.scale.set(60 + Math.random() * 60, 12 + Math.random() * 8, 1);
    s.userData.v = 0.5 + Math.random();
    group.add(s);
  }
  scene.add(group);
  group.userData.tick = (t, dt) => {
    for (const s of group.children) {
      s.position.x += s.userData.v * dt;
      if (s.position.x > radius) s.position.x = -radius;
    }
  };
  return group;
}

/* ── 렌더러 + 빛 번짐 */
export function makeRenderer(container, { bloom = 0.9, radius = 0.6, threshold = 0.72, shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), bloom, radius, threshold);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    composer.setSize(w, h);
    bloomPass.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  const tickers = new Set();
  let raf = 0;
  let last = performance.now();
  let t0 = last;
  let running = true;
  const loop = (now) => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    for (const fn of tickers) fn(t, dt);
    scene.traverse((o) => { if (o.userData.tick) o.userData.tick(t, dt); });
    composer.render();
  };
  raf = requestAnimationFrame(loop);
  return {
    renderer, scene, camera, composer, bloomPass, tickers,
    resetClock() { t0 = performance.now(); },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      composer.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/* ── 부드러운 보간 */
export const ease = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  back: (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2),
};
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** 시간 구간 [a,b] 안에서 0→1 */
export const span = (t, a, b, fn = ease.inOut) => fn(clamp01((t - a) / (b - a)));
