// 게임이 끝날 때 나오는 3D 결말 영상 (three.js · 약 16초)
import { THREE, PATHS, makeRenderer, sky, moon, forest, village, ground, silhouette, flame, particles, mistLayers, glowTex, span, ease } from './world3d.js';

const LENGTH = 16;
const lerp = (a, b, t) => a + (b - a) * t;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** 카메라를 경로(키프레임)대로 움직인다: [[시간, 위치, 바라볼 곳], ...] */
function cameraPath(cam, keys) {
  const p = new THREE.Vector3();
  const l = new THREE.Vector3();
  return (t) => {
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const [t0, p0, l0] = keys[i];
    const [t1, p1, l1] = keys[i + 1];
    const k = span(t, t0, t1);
    p.lerpVectors(p0, p1, k);
    l.lerpVectors(l0, l1, k);
    cam.position.copy(p);
    cam.lookAt(l);
  };
}

/** 바위 절벽 */
function cliff(scene, x, z, h) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x0c1020, roughness: 1, flatShading: true });
  const rocks = [[0, h * 0.45, 0, h * 0.55], [-h * 0.35, h * 0.25, h * 0.1, h * 0.4], [h * 0.4, h * 0.3, -h * 0.1, h * 0.42], [h * 0.1, h * 0.8, 0, h * 0.3]];
  for (const [rx, ry, rz, s] of rocks) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    m.position.set(rx, ry, rz);
    m.rotation.set(Math.random(), Math.random(), Math.random());
    m.scale.y = 1.3;
    m.castShadow = true;
    g.add(m);
  }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.28, h * 0.36, h * 0.12, 7), mat);
  top.position.y = h * 1.02;
  g.add(top);
  g.position.set(x, 0, z);
  scene.add(g);
  return { group: g, topY: h * 1.08 };
}

function eyes(parent, color = 0xffc830, spread = 0.9, size = 1.4) {
  const mat = new THREE.SpriteMaterial({ map: glowTex('rgba(255,230,120,1)', 'rgba(255,120,0,0)'), color: new THREE.Color(color).multiplyScalar(3), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0 });
  const a = new THREE.Sprite(mat);
  const b = new THREE.Sprite(mat);
  a.scale.setScalar(size);
  b.scale.setScalar(size);
  a.position.x = -spread / 2;
  b.position.x = spread / 2;
  const g = new THREE.Group();
  g.add(a, b);
  parent.add(g);
  return { group: g, mat };
}

const VILLAGE_SPOTS = [[-26, -40, 0.3], [-12, -52, -0.2, 1.1], [4, -44, 0.1], [18, -56, 0.5, 1.2], [30, -42, -0.4], [-38, -60, 0.8], [40, -66, 0.2, 1.3], [-4, -70, 0, 1.4]];

const SCENES = {
  /* 늑대인간 승리: 마을 불이 하나씩 꺼지고, 절벽 위 늑대인간이 달을 보며 운다 */
  wolf(ctx) {
    const { scene, camera, bloomPass } = ctx;
    scene.fog = new THREE.FogExp2(0x0a1432, 0.0065);
    const s = sky(scene);
    const m = moon(scene, v3(0, 90, -330), 190);
    const amb = new THREE.HemisphereLight(0x5a78c8, 0x05070e, 0.55);
    const moonLight = new THREE.DirectionalLight(0xb8c8ff, 1.6);
    moonLight.position.set(0, 60, -200);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    Object.assign(moonLight.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, far: 500 });
    scene.add(amb, moonLight);
    ground(scene, { color: 0x1a2440 });
    const vil = village(scene, VILLAGE_SPOTS);
    forest(scene, { count: 520, inner: 30, outer: 320, color: 0x0a1226, avoid: (x, z) => (Math.abs(x) < 50 && z < -25 && z > -140) || (Math.abs(x) < 14 && z > -30) });
    const c = cliff(scene, 0, -118, 26);
    const wolf = silhouette(PATHS.howl, 22, { color: 0x04050a, rim: 0xd8e4ff });
    wolf.position.set(-2, c.topY - 30, -118);
    scene.add(wolf);
    const e = eyes(wolf, 0xffc020, 0.7, 1.1);
    e.group.position.set(3.1, 20.6, 1.4);
    const red = new THREE.PointLight(0xff2010, 0, 400, 1);
    red.position.set(0, 60, -60);
    scene.add(red);
    mistLayers(scene, { y: 1, count: 22, radius: 160 });
    particles(scene, { count: 160, area: [140, 20, 160], center: v3(0, 0.5, -60), color: 0xb8ff80, size: 0.5 });
    const cam = cameraPath(camera, [
      [0, v3(0, 3.5, 70), v3(0, 14, -200)],
      [5, v3(0, 7, 12), v3(0, 16, -200)],
      [8.5, v3(-12, 12, -48), v3(0, 26, -118)],
      [11, v3(-6, 22, -82), v3(0, 36, -118)],
      [16, v3(18, 14, -70), v3(0, 34, -118)],
    ]);
    const shake = new THREE.Vector3();
    let howled = false;
    let flashed = false;
    return (t) => {
      cam(t);
      // 창문 불빛이 하나씩 꺼진다
      vil.windows.forEach((w, i) => {
        const k = span(t, 2.4 + (i % 16) * 0.22, 2.6 + (i % 16) * 0.22);
        w.mat.color.setRGB(lerp(3, 0.04, k), lerp(1.9, 0.05, k), lerp(0.7, 0.08, k));
      });
      // 늑대인간이 절벽 뒤에서 올라온다
      const rise = span(t, 5, 7.2, ease.back);
      wolf.position.y = c.topY - 30 + rise * 30;
      e.mat.opacity = span(t, 7, 7.4);
      if (t > 7.3 && !howled) { howled = true; ctx.sound('howl'); }
      // 울부짖을 때 흔들림 + 달빛 맥박
      const hw = t > 7.3 && t < 10 ? Math.sin(t * 40) * 0.12 * (1 - span(t, 7.3, 10)) : 0;
      shake.set(hw, hw * 0.6, 0);
      camera.position.add(shake);
      m.halo.scale.setScalar(m.halo.userData.base * (1 + 0.15 * Math.sin(Math.max(0, t - 7.3) * 3) * (t > 7.3 ? 1 : 0)));
      wolf.scale.y = 1 + (t > 7.3 && t < 10 ? Math.sin((t - 7.3) * 5) * 0.02 : 0);
      // 붉은 번개
      const fl = t > 10 ? Math.max(0, 1 - (t - 10) * 1.6) : 0;
      if (t > 10 && !flashed) { flashed = true; ctx.sound('slash'); ctx.overlay('claw'); }
      red.intensity = fl * 60000 + span(t, 10, 16) * 6000;
      amb.color.setRGB(lerp(0.35, 1, fl), lerp(0.47, 0.1, fl), lerp(0.78, 0.08, fl));
      s.uniforms.bottom.value.setRGB(lerp(0.15, 0.5, span(t, 10, 13)), lerp(0.31, 0.05, span(t, 10, 13)), lerp(0.56, 0.08, span(t, 10, 13)));
      bloomPass.strength = 0.7 + fl * 1.2;
    };
  },

  /* 마을 승리: 횃불 든 마을 사람들이 행진하고, 새벽 해가 떠오르며 늑대인간이 쓰러진다 */
  village(ctx) {
    const { scene, camera, bloomPass } = ctx;
    scene.fog = new THREE.FogExp2(0x0a1432, 0.006);
    const s = sky(scene);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,250,220,1)', 'rgba(255,140,40,0)'), color: new THREE.Color(3, 2.2, 1.2), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
    sun.scale.setScalar(170);
    scene.add(sun);
    const amb = new THREE.HemisphereLight(0x5a78c8, 0x05070e, 0.5);
    const sunLight = new THREE.DirectionalLight(0xffb070, 0);
    sunLight.position.set(80, 30, -200);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunLight.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, far: 500 });
    scene.add(amb, sunLight);
    const gr = ground(scene, { color: 0x1a2440 });
    village(scene, VILLAGE_SPOTS.map(([x, z, r, sc]) => [x - 40, z + 20, r, sc]));
    forest(scene, { count: 480, inner: 36, outer: 320, avoid: (x, z) => Math.abs(z + 20) < 22 || (x < -10 && z < -10 && z > -80) || (x < 10 && z > -4 && z < 90) });
    const c = cliff(scene, 42, -34, 14);
    const wolf = silhouette(PATHS.wolf, 12, { color: 0x05060a, rim: 0xffc890 });
    wolf.position.set(42, c.topY, -34);
    wolf.rotation.y = -0.4;
    scene.add(wolf);
    // 행진하는 마을 사람들
    const crowd = [];
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Group();
      const body = silhouette(i % 3 === 0 ? PATHS.cheer : PATHS.coat, 5.4 + (i % 3) * 0.3, { color: 0x06070c, rim: 0xffb070 });
      p.add(body);
      if (i % 2) {
        const fork = silhouette(PATHS.fork, 6.6, { color: 0x1a120a, rim: null });
        fork.position.set(-1.1, 0, 0.1);
        p.add(fork);
      } else {
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4), new THREE.MeshStandardMaterial({ color: 0x2a1a0a }));
        stick.position.set(1.1, 3.8, 0.2);
        stick.rotation.z = -0.25;
        p.add(stick);
        flame(p, v3(1.4, 5.2, 0.2), { size: 1.1, light: 30, range: 22 });
      }
      p.userData.base = v3(-70 - (i % 3) * 6 - i * 2, 0, -14 - (i % 3) * 4);
      p.userData.phase = i * 0.7;
      p.rotation.y = 0.25;
      scene.add(p);
      crowd.push(p);
    }
    const embers = particles(scene, { count: 220, area: [80, 16, 30], center: v3(-30, 1, -18), color: 0xffa040, size: 0.45, speed: [1.2, 1.2, 0] });
    mistLayers(scene, { y: 1, count: 16, radius: 150, color: '#c8b0a0' });
    const cam = cameraPath(camera, [
      [0, v3(-84, 4, 14), v3(-70, 5, -20)],
      [5, v3(-44, 5, 22), v3(-14, 6, -22)],
      [8, v3(-26, 8, 26), v3(24, 10, -30)],
      [11, v3(-30, 12, 40), v3(10, 16, -120)],
      [16, v3(-16, 16, 54), v3(10, 24, -140)],
    ]);
    let hit = false;
    let cheered = false;
    return (t) => {
      cam(t);
      const dawn = span(t, 3, 12);
      s.uniforms.top.value.setRGB(lerp(0.01, 0.22, dawn), lerp(0.03, 0.34, dawn), lerp(0.07, 0.62, dawn));
      s.uniforms.mid.value.setRGB(lerp(0.05, 0.8, dawn), lerp(0.14, 0.42, dawn), lerp(0.35, 0.36, dawn));
      s.uniforms.bottom.value.setRGB(lerp(0.15, 1, dawn), lerp(0.31, 0.7, dawn), lerp(0.56, 0.36, dawn));
      s.starMat.opacity = 0.85 * (1 - dawn);
      scene.fog.color.setRGB(lerp(0.04, 0.42, dawn), lerp(0.08, 0.3, dawn), lerp(0.2, 0.3, dawn));
      scene.fog.density = lerp(0.006, 0.0032, dawn);
      sun.position.set(90, lerp(-60, 70, span(t, 4, 13, ease.out)), -330);
      sunLight.intensity = dawn * 2.4;
      amb.intensity = 0.5 + dawn * 0.5;
      gr.material.color.setRGB(lerp(0.1, 0.45, dawn), lerp(0.14, 0.42, dawn), lerp(0.25, 0.3, dawn));
      // 행진
      const walk = span(t, 0, 8.5, (x) => x);
      crowd.forEach((p, i) => {
        const b = p.userData.base;
        p.position.set(b.x + walk * 80, Math.abs(Math.sin(t * 6 + p.userData.phase)) * 0.35, b.z);
        if (t > 9.4) {
          p.rotation.y = lerp(p.rotation.y, 0.1, 0.05);
          p.position.y = Math.abs(Math.sin(t * 7 + i)) * 1.2;
        }
      });
      // 늑대인간이 쓰러진다
      const fall = span(t, 8.2, 9.6, ease.in);
      if (t > 8.2 && !hit) { hit = true; ctx.sound('hit'); }
      if (t > 9.4 && !cheered) { cheered = true; ctx.sound('cheer'); }
      wolf.rotation.z = -fall * 1.7;
      wolf.position.set(42 + fall * 6, c.topY - fall * c.topY * 1.1, -34 + fall * 3);
      embers.material.opacity = 1 - dawn * 0.6;
      bloomPass.strength = 0.9 + span(t, 9, 12) * 0.5;
    };
  },

  /* 무두장이 승리: 비 내리는 무덤가, 무두장이 유령이 웃으며 떠오른다 */
  tanner(ctx) {
    const { scene, camera, bloomPass } = ctx;
    scene.fog = new THREE.FogExp2(0x3a4250, 0.012);
    const s = sky(scene, { top: '#20242c', mid: '#3a4250', bottom: '#5a6270', stars: 0 });
    const amb = new THREE.HemisphereLight(0x8a94a8, 0x1a1e24, 0.9);
    const dl = new THREE.DirectionalLight(0xc8d0e0, 0.8);
    dl.position.set(-30, 50, 20);
    dl.castShadow = true;
    scene.add(amb, dl);
    ground(scene, { color: 0x3a4030 });
    forest(scene, { count: 300, inner: 40, outer: 260, color: 0x1a1e24 });
    village(scene, VILLAGE_SPOTS.map(([x, z, r, sc]) => [x, z - 30, r, sc]));
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a707a, roughness: 1 });
    const stones = [[-8, -6], [8, -8], [-16, -14], [14, -16], [0, -18], [-22, -4], [22, -4]];
    for (const [x, z] of stones) {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 0.5), stoneMat);
      b.position.y = 1.3;
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16, 1, false, 0, Math.PI), stoneMat);
      tp.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      tp.position.y = 2.6;
      g.add(b, tp);
      g.position.set(x, 0, z);
      g.rotation.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.15);
      g.traverse((o) => { o.castShadow = true; });
      scene.add(g);
    }
    // 새 무덤
    const mound = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 }));
    mound.scale.set(1, 0.35, 1.8);
    scene.add(mound);
    const cross = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a3420 });
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.3), wood);
    v.position.y = 2;
    const hbar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.3), wood);
    hbar.position.y = 3;
    cross.add(v, hbar);
    cross.position.set(0, 0, -5.6);
    scene.add(cross);
    // 둘러선 조문객
    [[-9, 3, 0.6], [-6, 7, 0.3], [7, 6, -0.4], [10, 1, -0.7], [-3, 9, 0.1]].forEach(([x, z, r]) => {
      const p = silhouette(PATHS.coat, 5.6, { color: 0x14161c, rim: 0x8a94a8 });
      p.position.set(x, 0, z);
      p.rotation.y = r + Math.PI;
      p.rotation.x = 0.06;
      scene.add(p);
    });
    // 유령
    const ghost = silhouette(PATHS.ghost, 7, { color: 0xdfe8f8, emissive: 0x8aa0c8, emissiveIntensity: 0.45, rim: 0xc8d8ff, depth: 20 });
    ghost.material.transparent = true;
    ghost.material.opacity = 0;
    scene.add(ghost);
    const face = new THREE.Group();
    const dark = new THREE.MeshBasicMaterial({ color: 0x1a1e24 });
    for (const x of [-0.65, 0.65]) {
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), dark);
      eye.position.set(x, 3.7, 0.95);
      face.add(eye);
    }
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.1, 8, 20, Math.PI), dark);
    smile.rotation.z = Math.PI;
    smile.position.set(0, 3.1, 0.95);
    face.add(smile);
    ghost.add(face);
    const ghostLight = new THREE.PointLight(0xc8d8ff, 0, 30, 1.5);
    ghost.add(ghostLight);
    ghostLight.position.y = 4;
    const rain = particles(scene, { count: 1600, area: [120, 60, 120], center: v3(0, 0, -10), color: 0xaab4c8, size: 0.18, speed: [-2, -38, 0], additive: false, streak: true });
    rain.material.map = null;
    const flash = new THREE.PointLight(0xdfe8ff, 0, 600, 0.6);
    flash.position.set(-40, 80, -60);
    scene.add(flash);
    mistLayers(scene, { y: 0.5, count: 18, radius: 80, color: '#aab4c8', opacity: 0.22 });
    const cam = cameraPath(camera, [
      [0, v3(0, 30, 50), v3(0, 0, -6)],
      [5, v3(0, 10, 26), v3(0, 2, -4)],
      [9, v3(8, 8, 18), v3(0, 8, 0)],
      [16, v3(-6, 14, 22), v3(0, 14, 0)],
    ]);
    let boom = false;
    let rose = false;
    return (t) => {
      cam(t);
      const f = (t > 3 && t < 3.5) || (t > 3.7 && t < 3.9) ? 1 : 0;
      if (t > 3 && !boom) { boom = true; ctx.sound('thunder'); }
      flash.intensity = f * 90000;
      const up = span(t, 5, 10);
      if (t > 5 && !rose) { rose = true; ctx.sound('ghost'); }
      ghost.position.set(Math.sin(t * 1.4) * 0.6 * up, -6 + up * 12 + Math.sin(t * 2) * 0.4, 0);
      ghost.material.opacity = up * 0.8;
      ghostLight.intensity = up * 260;
      ghost.rotation.z = Math.sin(t * 1.8) * 0.08;
      s.uniforms.mid.value.setRGB(0.23 + f * 0.5, 0.26 + f * 0.5, 0.31 + f * 0.5);
      bloomPass.strength = 0.8 + up * 0.6;
    };
  },

  /* 모두 패배: 짙은 안개 속 텅 빈 마을, 까마귀 떼 */
  none(ctx) {
    const { scene, camera } = ctx;
    scene.fog = new THREE.FogExp2(0x1a2030, 0.018);
    sky(scene, { top: '#0a0e18', mid: '#1a2030', bottom: '#2a3040', stars: 200 });
    scene.add(new THREE.HemisphereLight(0x6a7490, 0x0a0c10, 0.7));
    ground(scene, { color: 0x20242c });
    const vil = village(scene, VILLAGE_SPOTS.map(([x, z, r, sc]) => [x, z + 30, r, sc]));
    vil.windows.forEach((w) => w.mat.color.setRGB(0.05, 0.05, 0.07));
    forest(scene, { count: 300, inner: 60, outer: 260, color: 0x10141e });
    mistLayers(scene, { y: 1, count: 30, radius: 100, color: '#8a94a8', opacity: 0.3 });
    const crows = [];
    for (let i = 0; i < 14; i++) {
      const c = silhouette(PATHS.crow, 1.4, { color: 0x000000, rim: null, depth: 2 });
      c.userData.o = v3(-80 - Math.random() * 60, 12 + Math.random() * 12, -30 + Math.random() * 30);
      c.userData.s = 8 + Math.random() * 6;
      scene.add(c);
      crows.push(c);
    }
    const cam = cameraPath(camera, [
      [0, v3(-30, 6, 40), v3(0, 4, -20)],
      [16, v3(30, 10, 36), v3(0, 6, -20)],
    ]);
    return (t) => {
      cam(t);
      crows.forEach((c, i) => {
        c.position.set(c.userData.o.x + t * c.userData.s, c.userData.o.y + Math.sin(t * 3 + i) * 0.8, c.userData.o.z);
        c.scale.y = 0.6 + Math.abs(Math.sin(t * 9 + i)) * 0.8;
      });
    };
  },
};

const TITLES = {
  wolf: '늑대인간의 승리',
  village: '마을의 승리',
  tanner: '무두장이의 승리',
  none: '아무도 이기지 못했다',
};

/** 초승달처럼 가운데가 두껍고 끝이 뾰족한 할퀸 자국 */
function clawPath(x0, y0, x1, y1, w) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const bend = len * 0.08;
  const c1 = [mx + nx * bend, my + ny * bend];
  const c2 = [mx + nx * (bend + w), my + ny * (bend + w)];
  return `M${x0} ${y0}Q${c1[0]} ${c1[1]} ${x1} ${y1}Q${c2[0]} ${c2[1]} ${x0} ${y0}Z`;
}
const CLAW = `<svg class="cs-claw" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a50"/><stop offset=".5" stop-color="#e01a10"/><stop offset="1" stop-color="#5a0000"/></linearGradient>
  <filter id="cblur"><feGaussianBlur stdDeviation="10"/></filter></defs>
  ${[0, 1, 2, 3].map((i) => `<g class="cl c${i}"><path d="${clawPath(420 + i * 190, 40 + i * 30, 980 + i * 170, 860 - i * 20, 70 - Math.abs(i - 1.5) * 12)}" fill="#ff2a10" opacity=".55" filter="url(#cblur)"/><path d="${clawPath(420 + i * 190, 40 + i * 30, 980 + i * 170, 860 - i * 20, 56 - Math.abs(i - 1.5) * 10)}" fill="url(#cg)"/><path d="${clawPath(430 + i * 190, 60 + i * 30, 970 + i * 170, 840 - i * 20, 18)}" fill="#2a0000" opacity=".6"/></g>`).join('')}
</svg>`;

/**
 * 결말 영상을 재생한다. 끝나거나 [건너뛰기]를 누르면 resolve.
 * @param {HTMLElement} host
 * @param {'wolf'|'village'|'tanner'|'none'} kind
 * @param {{sub?:string, sound?:(name:string)=>void}} opts
 */
export function playCutscene(host, kind, { sub = '', sound = () => {}, at = null } = {}) {
  const build = SCENES[kind] || SCENES.none;
  return new Promise((resolve) => {
    host.innerHTML = `<div class="cs-stage"></div>
      <div class="cs-bars"></div>
      <div class="cs-fx"></div>
      <div class="cs-title" style="--d:${kind === 'wolf' ? 11 : kind === 'village' ? 10.5 : kind === 'tanner' ? 10 : 5}s">${TITLES[kind] || TITLES.none}${sub ? `<small>${sub}</small>` : ''}</div>
      <button class="btn btn-sm cs-skip">건너뛰기 ▸</button>`;
    host.hidden = false;
    let world;
    try {
      world = makeRenderer(host.querySelector('.cs-stage'), { bloom: 0.9, threshold: 0.92, radius: 0.45 });
    } catch (e) {
      console.warn('3D를 켤 수 없어 결말 영상을 건너뜁니다', e);
      host.hidden = true;
      host.innerHTML = '';
      resolve();
      return;
    }
    const fx = host.querySelector('.cs-fx');
    const ctx = {
      ...world,
      sound,
      overlay: (name) => {
        if (name === 'claw') {
          fx.innerHTML = CLAW;
          fx.classList.add('go');
        }
      },
    };
    const update = build(ctx);
    world.resetClock();
    world.tickers.add((t) => update(at != null ? at : Math.min(t, LENGTH)));
    sound(`start:${kind}`);
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      world.dispose();
      host.hidden = true;
      host.innerHTML = '';
      resolve();
    };
    host.querySelector('.cs-skip').addEventListener('click', end);
    if (at == null) setTimeout(end, LENGTH * 1000 + 400);
  });
}
