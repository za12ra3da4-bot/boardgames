// 영화 연출 도구: 카메라(팬 · 줌 · 흔들림) · 원근 레이어 · 빗방울과 물보라 · 대사 자막 · 합성 음악
import { Puppet } from './puppet.js';

/* ═════════ 무대: 1600×900 좌표계, 레이어마다 원근(depth) ═════════
   depth 0 = 무한히 먼 배경(카메라를 거의 안 따라감), 1 = 인물이 서는 면, >1 = 카메라 앞 전경 */
export function stage(shotEl) {
  const root = document.createElement('div');
  root.className = 'cn-root';
  root.style.cssText = 'position:absolute;inset:0;overflow:hidden';
  shotEl.appendChild(root);
  const layers = [];
  const cam = { x: 800, y: 450, z: 1, rot: 0, shake: 0 };
  const fit = () => Math.max(root.clientWidth / 1600, root.clientHeight / 900);
  function layer(depth, html = '', { blur = 0 } = {}) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:0;top:0;width:1600px;height:900px;transform-origin:0 0;${blur ? `filter:blur(${blur}px);` : ''}`;
    el.innerHTML = html;
    root.appendChild(el);
    const L = { el, depth };
    layers.push(L);
    return L;
  }
  function render(t) {
    const s = fit();
    const sh = cam.shake;
    const jx = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    const jy = sh ? (Math.random() - 0.5) * sh * 2 : 0;
    for (const L of layers) {
      // 먼 레이어일수록 카메라 이동 · 줌을 덜 받는다
      const k = L.depth;
      const z = 1 + (cam.z - 1) * k;
      const dx = (cam.x - 800) * k;
      const dy = (cam.y - 450) * k;
      L.el.style.transform = `translate(${root.clientWidth / 2 + jx}px, ${root.clientHeight / 2 + jy}px) scale(${s * z}) rotate(${cam.rot * Math.min(1, k)}deg) translate(${-800 - dx}px, ${-450 - dy}px)`;
    }
    void t;
  }
  return { root, layer, cam, render };
}

/** 카메라 키프레임: [[초, {x,y,z,rot}], ...] 부드럽게 보간 */
export function camPath(cam, keys) {
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  return (s) => {
    let i = 0;
    while (i < keys.length - 1 && s > keys[i + 1][0]) i++;
    const [t0, a] = keys[i];
    const [t1, b] = keys[Math.min(i + 1, keys.length - 1)];
    const k = t1 > t0 ? ease(Math.max(0, Math.min(1, (s - t0) / (t1 - t0)))) : 1;
    for (const key of ['x', 'y', 'z', 'rot']) if (a[key] != null || b[key] != null) cam[key] = (a[key] ?? cam[key]) + ((b[key] ?? a[key] ?? cam[key]) - (a[key] ?? cam[key])) * k;
  };
}

/* ═════════ 비: 캔버스에 빗줄기 + 바닥에 튀는 물방울 ═════════ */
export function rain(host, { count = 260, groundY = 0.72, color = '200,215,255', wind = -2.2 } = {}) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  host.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0;
  let H = 0;
  const drops = [];
  const splashes = [];
  const resize = () => { W = cv.width = host.clientWidth; H = cv.height = host.clientHeight; };
  resize();
  for (let i = 0; i < count; i++) drops.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.7 });
  return (dt) => {
    if (cv.width !== host.clientWidth) resize();
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (const d of drops) {
      const sp = (900 + 700 * d.z) * dt;
      d.y += sp;
      d.x += wind * sp * 0.12;
      const gy = H * (groundY + (1 - groundY) * (1 - d.z));
      if (d.y > gy) {
        if (Math.random() < 0.7) splashes.push({ x: d.x, y: gy, t: 0, z: d.z });
        d.y = -20 - Math.random() * 60;
        d.x = Math.random() * W * 1.2;
      }
      ctx.strokeStyle = `rgba(${color},${0.18 + d.z * 0.4})`;
      ctx.lineWidth = 0.6 + d.z * 1.4;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + wind * 3 * d.z, d.y - 14 - 22 * d.z);
      ctx.stroke();
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.t += dt;
      if (s.t > 0.35) { splashes.splice(i, 1); continue; }
      const k = s.t / 0.35;
      ctx.strokeStyle = `rgba(${color},${(1 - k) * 0.55 * s.z})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 3 + k * 12 * s.z, 1 + k * 3 * s.z, 0, 0, Math.PI * 2);
      ctx.stroke();
      // 튀어 오르는 작은 물방울 두 개
      ctx.fillStyle = `rgba(${color},${(1 - k) * 0.6})`;
      ctx.fillRect(s.x - 4 - k * 6, s.y - Math.sin(k * Math.PI) * 10 * s.z, 1.6, 1.6);
      ctx.fillRect(s.x + 4 + k * 6, s.y - Math.sin(k * Math.PI) * 8 * s.z, 1.6, 1.6);
    }
  };
}

/* ═════════ 대사 자막 (타자 치듯) ═════════ */
export function say(host, who, text, dur = 2.4, color = '#46f2e4') {
  const box = document.createElement('div');
  box.className = 'cn-say';
  box.innerHTML = `<b style="color:${color}">${who}</b><span></span>`;
  host.appendChild(box);
  const span = box.querySelector('span');
  let i = 0;
  const tick = setInterval(() => { span.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(tick); }, 42);
  box.animate([{ opacity: 0, transform: 'translate(-50%, 10px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 250, fill: 'forwards' });
  setTimeout(() => {
    box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = () => box.remove();
  }, dur * 1000);
  return box;
}
export const CINE_CSS = `<style>
.cn-say { position:absolute; left:50%; bottom:13%; transform:translateX(-50%); max-width:80%; text-align:center; font: 600 clamp(16px,2.4vw,30px)/1.35 'Noto Sans KR',sans-serif; color:#fff;
  text-shadow: 0 2px 0 #000, 0 0 12px #000; z-index:30; pointer-events:none; opacity:0; }
.cn-say b { display:block; font: clamp(11px,1.3vw,16px) 'Black Han Sans',sans-serif; letter-spacing:.2em; margin-bottom:4px; }
.cn-say span::after { content:'▌'; animation: cnb .6s steps(1) infinite; opacity:.7; }
@keyframes cnb { 50% { opacity: 0; } }
.cn-flash { position:absolute; inset:0; pointer-events:none; mix-blend-mode:screen; }
</style>`;

/* ═════════ 인형들을 무대 레이어에 세우고 매 프레임 갱신 ═════════ */
export function cast(layerEl) {
  const list = [];
  return {
    add(o) { const p = new Puppet(layerEl, o); list.push(p); return p; },
    update(dt) { for (const p of list) p.update(dt); },
  };
}

/* ═════════ 합성 음악: 누아르 재즈 (워킹 베이스 · 브러시 드럼 · 패드 · 색소폰) ═════════ */
export function score({ bpm = 92, length = 20, muted = false, cues = [] } = {}) {
  if (muted) return { stop() {}, hit() {} };
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return { stop() {}, hit() {} };
  const ac = new AC();
  const out = ac.createGain();
  out.gain.value = 0.55;
  // 방 울림 (짧은 잔향)
  const conv = ac.createConvolver();
  const len = ac.sampleRate * 1.8;
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  conv.buffer = ir;
  const wet = ac.createGain();
  wet.gain.value = 0.25;
  out.connect(ac.destination);
  out.connect(conv).connect(wet).connect(ac.destination);
  const t0 = ac.currentTime + 0.1;
  const beat = 60 / bpm;
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

  function bass(t, m, dur) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const f = ac.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midi(m), t);
    f.type = 'lowpass';
    f.frequency.value = 700;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.9);
    o.connect(f).connect(g).connect(out);
    o.start(t);
    o.stop(t + dur);
  }
  function brush(t, vol = 0.12, dur = 0.18, hp = 3000) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out);
    s.start(t);
    s.stop(t + dur);
  }
  function kick(t, vol = 0.5) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.32);
  }
  function pad(t, notes, dur, vol = 0.05) {
    for (const m of notes) {
      const o = ac.createOscillator();
      const f = ac.createBiquadFilter();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.value = midi(m);
      o.detune.value = (Math.random() - 0.5) * 12;
      f.type = 'lowpass';
      f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }
  function sax(t, m, dur, vol = 0.12) {
    const o = ac.createOscillator();
    const lfo = ac.createOscillator();
    const lg = ac.createGain();
    const f = ac.createBiquadFilter();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(midi(m) * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(midi(m), t + 0.08);
    lfo.frequency.value = 5.2;
    lg.gain.value = midi(m) * 0.012;
    lfo.connect(lg).connect(o.frequency);
    f.type = 'bandpass';
    f.frequency.value = 1400;
    f.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.setValueAtTime(vol * 0.8, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(out);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }
  function brass(t, notes, vol = 0.1) {
    for (const m of notes) {
      const o = ac.createOscillator();
      const f = ac.createBiquadFilter();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.value = midi(m);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(3000, t + 0.08);
      f.frequency.exponentialRampToValueAtTime(900, t + 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(f).connect(g).connect(out);
      o.start(t);
      o.stop(t + 1.5);
    }
  }
  // D 단조 워킹 베이스 (한 마디 4박) · 코드 진행 Dm9 → Gm7 → Bb7 → A7
  const prog = [[38, [50, 53, 57, 60, 64]], [43, [50, 53, 55, 58, 62]], [46, [50, 53, 56, 58, 62]], [45, [49, 52, 55, 57, 61]]];
  const walks = [[0, 3, 5, 7], [0, 2, 3, 5], [0, 4, 7, 9], [0, -1, -3, -4]];
  const bars = Math.ceil(length / (beat * 4));
  for (let b = 0; b < bars; b++) {
    const [root, chord] = prog[b % 4];
    const tb = t0 + b * beat * 4;
    pad(tb, chord, beat * 4, 0.028);
    walks[b % 4].forEach((iv, k) => bass(tb + k * beat, root + iv, beat * 0.95));
    for (let k = 0; k < 8; k++) brush(tb + k * beat * 0.5 + (k % 2 ? beat * 0.16 : 0), k % 2 ? 0.05 : 0.08, 0.09, 6000);
    brush(tb + beat, 0.12, 0.3, 1800);
    brush(tb + beat * 3, 0.12, 0.3, 1800);
    if (b % 2 === 0) kick(tb, 0.3);
  }
  // 색소폰 선율 (두 번째 마디부터 한 줄)
  const line = [[62, 1], [65, 0.5], [67, 0.5], [69, 1.5], [67, 0.5], [65, 1], [64, 1], [62, 2], [60, 0.5], [62, 0.5], [65, 1], [64, 2]];
  let tt = t0 + beat * 4;
  for (const [m, d] of line) { if (tt - t0 < length - 2) sax(tt, m, d * beat * 0.95); tt += d * beat; }
  // 정해진 순간의 금관 한 방 (정답 공개 등)
  for (const c of cues) brass(t0 + c.at, c.notes || [50, 57, 62, 65], c.vol || 0.1);
  const master = out.gain;
  master.setValueAtTime(0.55, t0 + length - 1.5);
  master.linearRampToValueAtTime(0.0001, t0 + length);
  return {
    stop() { try { master.cancelScheduledValues(ac.currentTime); master.setTargetAtTime(0.0001, ac.currentTime, 0.1); setTimeout(() => ac.close(), 600); } catch (_) { /* 이미 닫힘 */ } },
    hit(notes) { brass(ac.currentTime + 0.01, notes || [50, 57, 62, 65], 0.12); kick(ac.currentTime + 0.01, 0.6); },
  };
}
