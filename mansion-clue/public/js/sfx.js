// 효과음은 파일 없이 Web Audio 로 합성
const SFX = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('clue.muted') === '1'; } catch (_) { /* 저장소 차단 */ }

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

  function noise({ dur = 0.15, vol = 0.2, delay = 0, freq = 1200, type = 'lowpass' }) {
    const c = ac();
    if (!c || muted) return;
    const t = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
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
    dice: () => { for (let i = 0; i < 6; i++) noise({ dur: 0.05, vol: 0.25, delay: i * 0.07, freq: 2500 + Math.random() * 1500, type: 'bandpass' }); },
    step: () => noise({ dur: 0.05, vol: 0.12, freq: 700 }),
    door: () => { tone({ f: 180, f2: 120, type: 'triangle', dur: 0.25, vol: 0.12 }); noise({ dur: 0.2, vol: 0.12, freq: 500, delay: 0.05 }); },
    turn: () => { tone({ f: 587, dur: 0.12, vol: 0.08 }); tone({ f: 880, dur: 0.18, vol: 0.08, delay: 0.1 }); },
    card: () => noise({ dur: 0.12, vol: 0.18, freq: 3500, type: 'highpass' }),
    suggest: () => { tone({ f: 330, type: 'triangle', dur: 0.2, vol: 0.09 }); tone({ f: 415, type: 'triangle', dur: 0.2, vol: 0.09, delay: 0.14 }); tone({ f: 494, type: 'triangle', dur: 0.3, vol: 0.09, delay: 0.28 }); },
    none: () => { tone({ f: 220, f2: 330, type: 'sawtooth', dur: 0.4, vol: 0.06 }); tone({ f: 440, type: 'sine', dur: 0.5, vol: 0.08, delay: 0.3 }); },
    alarm: () => { tone({ f: 523, type: 'sawtooth', dur: 0.16, vol: 0.07 }); tone({ f: 392, type: 'sawtooth', dur: 0.3, vol: 0.07, delay: 0.17 }); },
    thunder: () => { noise({ dur: 1.6, vol: 0.5, freq: 180 }); noise({ dur: 0.4, vol: 0.3, freq: 900, delay: 0.05 }); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.35, vol: 0.09, delay: i * 0.11 })),
    lose: () => [392, 349, 311, 262].forEach((f, i) => tone({ f, type: 'sawtooth', dur: 0.35, vol: 0.05, delay: i * 0.16 })),
    tick: () => tone({ f: 1500, type: 'square', dur: 0.025, vol: 0.03 }),
    chat: () => tone({ f: 880, f2: 1250, dur: 0.07, vol: 0.035 }),
    get muted() { return muted; },
    setMuted(v) {
      muted = !!v;
      try { localStorage.setItem('clue.muted', muted ? '1' : '0'); } catch (_) { /* 무시 */ }
    },
    unlock: () => ac(),
  };
})();
