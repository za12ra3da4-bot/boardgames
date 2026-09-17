// 효과음은 파일 없이 Web Audio 로 합성
const SFX = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('wolf.muted') === '1'; } catch (_) { /* 저장소 차단 */ }

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone({ f = 440, f2 = 0, type = 'sine', dur = 0.12, vol = 0.12, delay = 0, attack = 0.005 }) {
    const c = ac();
    if (!c || muted) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise({ dur = 0.15, vol = 0.2, delay = 0, freq = 1200, type = 'lowpass', decay = 2 }) {
    const c = ac();
    if (!c || muted) return;
    const t = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(filt).connect(g).connect(c.destination);
    src.start(t);
  }

  return {
    click: () => tone({ f: 900, f2: 620, type: 'triangle', dur: 0.05, vol: 0.05 }),
    card: () => noise({ dur: 0.1, vol: 0.16, freq: 3800, type: 'highpass' }),
    draw: () => { noise({ dur: 0.08, vol: 0.12, freq: 3000, type: 'highpass' }); noise({ dur: 0.08, vol: 0.1, freq: 3200, type: 'highpass', delay: 0.07 }); },
    gun: () => { noise({ dur: 0.35, vol: 0.9, freq: 900, decay: 4 }); tone({ f: 120, f2: 40, type: 'sine', dur: 0.25, vol: 0.5 }); noise({ dur: 0.6, vol: 0.12, freq: 400, delay: 0.08, decay: 3 }); },
    ricochet: () => { tone({ f: 2400, f2: 700, type: 'sawtooth', dur: 0.35, vol: 0.05 }); noise({ dur: 0.05, vol: 0.2, freq: 5000, type: 'highpass' }); },
    hit: () => { tone({ f: 160, f2: 60, type: 'sine', dur: 0.22, vol: 0.4 }); noise({ dur: 0.12, vol: 0.25, freq: 600 }); },
    heal: () => [660, 880, 1320].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.18, vol: 0.06, delay: i * 0.06 })),
    beer: () => { for (let i = 0; i < 4; i++) tone({ f: 300 + Math.random() * 200, f2: 180, type: 'sine', dur: 0.08, vol: 0.12, delay: i * 0.11 }); },
    death: () => { tone({ f: 196, type: 'sawtooth', dur: 0.9, vol: 0.06 }); tone({ f: 146, type: 'sawtooth', dur: 1.2, vol: 0.06, delay: 0.3 }); noise({ dur: 0.4, vol: 0.2, freq: 300 }); },
    boom: () => { noise({ dur: 1.6, vol: 1, freq: 260, decay: 2 }); tone({ f: 80, f2: 30, type: 'sine', dur: 0.8, vol: 0.6 }); },
    clank: () => { tone({ f: 520, f2: 480, type: 'square', dur: 0.12, vol: 0.06 }); tone({ f: 780, type: 'square', dur: 0.2, vol: 0.04, delay: 0.05 }); noise({ dur: 0.15, vol: 0.2, freq: 4000, type: 'bandpass' }); },
    turn: () => { tone({ f: 587, dur: 0.12, vol: 0.08 }); tone({ f: 880, dur: 0.18, vol: 0.08, delay: 0.1 }); },
    bell: () => { tone({ f: 1320, type: 'sine', dur: 0.8, vol: 0.08 }); tone({ f: 1980, type: 'sine', dur: 0.5, vol: 0.04 }); },
    flip: () => noise({ dur: 0.2, vol: 0.2, freq: 2400, type: 'bandpass' }),
    alarm: () => { tone({ f: 740, type: 'square', dur: 0.08, vol: 0.05 }); tone({ f: 740, type: 'square', dur: 0.08, vol: 0.05, delay: 0.14 }); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.35, vol: 0.09, delay: i * 0.11 })),
    lose: () => [392, 349, 311, 262].forEach((f, i) => tone({ f, type: 'sawtooth', dur: 0.35, vol: 0.05, delay: i * 0.16 })),
    tick: () => tone({ f: 1500, type: 'square', dur: 0.025, vol: 0.03 }),
    chat: () => tone({ f: 880, f2: 1250, dur: 0.07, vol: 0.035 }),
    get muted() { return muted; },
    setMuted(v) {
      muted = !!v;
      try { localStorage.setItem('wolf.muted', muted ? '1' : '0'); } catch (_) { /* 무시 */ }
    },
    howl: () => { tone({ f: 300, f2: 640, dur: 1.1, vol: 0.14, attack: 0.3 }); tone({ f: 640, f2: 380, dur: 1.6, vol: 0.13, delay: 1.0, attack: 0.05 }); tone({ f: 302, f2: 650, type: 'triangle', dur: 1.1, vol: 0.05, attack: 0.3 }); },
    rooster: () => { tone({ f: 520, f2: 700, type: 'sawtooth', dur: 0.18, vol: 0.05 }); tone({ f: 700, f2: 880, type: 'sawtooth', dur: 0.2, vol: 0.05, delay: 0.2 }); tone({ f: 880, f2: 560, type: 'sawtooth', dur: 0.7, vol: 0.05, delay: 0.42 }); },
    birds: () => { for (let i = 0; i < 6; i++) tone({ f: 2400 + Math.random() * 900, f2: 3400, dur: 0.07, vol: 0.03, delay: i * 0.13 + (i > 2 ? 0.4 : 0) }); },
    drone: () => { tone({ f: 110, f2: 98, dur: 2.2, vol: 0.08, attack: 0.6 }); tone({ f: 165, f2: 147, dur: 2.2, vol: 0.04, attack: 0.6 }); },
    ghost: () => { tone({ f: 500, f2: 900, dur: 1.2, vol: 0.06, attack: 0.4 }); tone({ f: 900, f2: 400, dur: 1.4, vol: 0.05, delay: 1.1 }); },
    unlock: () => ac(),
  };
})();

window.SFX = SFX;
