'use strict';
/* SUPER-NAT — audio.js : fully procedural WebAudio SFX (no assets) */

const Sfx = (() => {
  let ac = null, master = null, noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem('supernat_muted') === '1'; } catch (e) { /* private mode */ }
  const last = {};

  function ensure() {
    if (!ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.5;
        master.connect(ac.destination);
        const len = Math.floor(ac.sampleRate * 1.5);
        noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        ambient();
      } catch (e) { ac = null; return; }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
  }

  function ok(name, gap) {
    if (!ac || muted) return false;
    const t = ac.currentTime;
    if (last[name] && t - last[name] < (gap || 0.03)) return false;
    last[name] = t;
    return true;
  }

  function tone(o) {
    if (!ac) return;
    try {
      const t = ac.currentTime + (o.delay || 0);
      const dur = o.dur || 0.1;
      const osc = ac.createOscillator();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(Math.max(1, o.f0), t);
      if (o.f1 && o.f1 !== o.f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + dur);
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(o.g || 0.2, t + (o.a || 0.004));
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gn); gn.connect(master);
      osc.start(t); osc.stop(t + dur + 0.05);
    } catch (e) { /* ignore */ }
  }

  function noise(o) {
    if (!ac) return;
    try {
      const t = ac.currentTime + (o.delay || 0);
      const dur = o.dur || 0.1;
      const src = ac.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const fl = ac.createBiquadFilter();
      fl.type = o.type || 'lowpass';
      fl.frequency.setValueAtTime(o.f0 || 1000, t);
      if (o.f1) fl.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + dur);
      fl.Q.value = o.q || 0.8;
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(o.g || 0.2, t + (o.a || 0.002));
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(fl); fl.connect(gn); gn.connect(master);
      src.start(t, Math.random() * 1.2); src.stop(t + dur + 0.05);
    } catch (e) { /* ignore */ }
  }

  /* faint radioactive-wind ambience */
  function ambient() {
    if (!ac) return;
    try {
      const src = ac.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const fl = ac.createBiquadFilter();
      fl.type = 'lowpass'; fl.frequency.value = 190; fl.Q.value = 0.5;
      const gn = ac.createGain();
      gn.gain.value = 0.028;
      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.09;
      const lg = ac.createGain(); lg.gain.value = 0.016;
      lfo.connect(lg); lg.connect(gn.gain);
      src.connect(fl); fl.connect(gn); gn.connect(master);
      src.start(); lfo.start();
    } catch (e) { /* ignore */ }
  }

  return {
    ensure,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('supernat_muted', muted ? '1' : '0'); } catch (e) {}
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    shoot(w) {
      if (!ok('sh' + w, w === 'smg' ? 0.045 : 0.02)) return;
      if (w === 'pistol') {
        noise({ dur: 0.09, type: 'highpass', f0: 650, g: 0.42 });
        tone({ type: 'triangle', f0: 210, f1: 62, dur: 0.08, g: 0.3 });
      } else if (w === 'smg') {
        noise({ dur: 0.06, type: 'highpass', f0: 900, g: 0.32 });
        tone({ type: 'triangle', f0: 260, f1: 90, dur: 0.05, g: 0.2 });
      } else if (w === 'shotgun') {
        noise({ dur: 0.3, f0: 2400, f1: 260, g: 0.7 });
        tone({ type: 'sine', f0: 120, f1: 38, dur: 0.24, g: 0.5 });
      } else {
        noise({ dur: 0.13, f0: 3200, f1: 420, g: 0.55 });
        tone({ type: 'square', f0: 820, f1: 110, dur: 0.09, g: 0.16 });
      }
    },
    hit() {
      if (!ok('hit', 0.025)) return;
      noise({ dur: 0.055, f0: 620, g: 0.26 });
      tone({ f0: 150, f1: 72, dur: 0.06, g: 0.22 });
    },
    kill(big) {
      if (!ok('kill', 0.03)) return;
      noise({ dur: big ? 0.34 : 0.16, type: 'bandpass', f0: 420, f1: 110, q: 1.6, g: big ? 0.5 : 0.4 });
      tone({ f0: big ? 160 : 230, f1: 40, dur: big ? 0.28 : 0.14, g: 0.3 });
      if (big) { noise({ dur: 0.5, f0: 900, f1: 70, g: 0.55, delay: 0.02 }); tone({ f0: 70, f1: 26, dur: 0.45, g: 0.5 }); }
    },
    hurt() {
      if (!ok('hurt', 0.1)) return;
      tone({ f0: 115, f1: 52, dur: 0.24, g: 0.5 });
      noise({ dur: 0.18, f0: 500, f1: 130, g: 0.34 });
      tone({ type: 'sawtooth', f0: 210, f1: 120, dur: 0.14, g: 0.1 });
    },
    pickup(kind) {
      if (!ok('pk', 0.05)) return;
      if (kind === 'weapon') {
        tone({ type: 'triangle', f0: 392, dur: 0.08, g: 0.22 });
        tone({ type: 'triangle', f0: 523, dur: 0.08, g: 0.22, delay: 0.07 });
        tone({ type: 'triangle', f0: 784, dur: 0.12, g: 0.22, delay: 0.14 });
      } else if (kind === 'adr') {
        tone({ type: 'square', f0: 660, f1: 1320, dur: 0.16, g: 0.14 });
      } else {
        tone({ type: 'triangle', f0: 523, dur: 0.07, g: 0.2 });
        tone({ type: 'triangle', f0: 784, dur: 0.1, g: 0.2, delay: 0.06 });
      }
    },
    dash() {
      if (!ok('dash', 0.08)) return;
      noise({ dur: 0.2, type: 'bandpass', f0: 280, f1: 2600, q: 1.2, g: 0.3 });
    },
    wave() {
      tone({ type: 'sawtooth', f0: 82, dur: 0.75, g: 0.16, a: 0.06 });
      tone({ type: 'sawtooth', f0: 110, dur: 0.75, g: 0.12, a: 0.06 });
      tone({ type: 'square', f0: 660, dur: 0.09, g: 0.09, delay: 0.55 });
      tone({ type: 'square', f0: 660, dur: 0.09, g: 0.09, delay: 0.75 });
    },
    cleared() {
      tone({ type: 'triangle', f0: 523, dur: 0.1, g: 0.18 });
      tone({ type: 'triangle', f0: 659, dur: 0.1, g: 0.18, delay: 0.09 });
      tone({ type: 'triangle', f0: 880, dur: 0.16, g: 0.2, delay: 0.18 });
    },
    boom() {
      if (!ok('boom', 0.05)) return;
      noise({ dur: 0.5, f0: 1100, f1: 70, g: 0.6 });
      tone({ f0: 68, f1: 26, dur: 0.45, g: 0.55 });
    },
    click() {
      if (!ok('click', 0.02)) return;
      tone({ type: 'square', f0: 1350, dur: 0.03, g: 0.1 });
      noise({ dur: 0.02, type: 'highpass', f0: 2500, g: 0.1 });
    },
    empty() {
      if (!ok('empty', 0.08)) return;
      tone({ type: 'square', f0: 900, f1: 500, dur: 0.04, g: 0.1 });
    },
    combo(n) {
      if (!ok('combo', 0.04)) return;
      tone({ type: 'triangle', f0: 420 * (1 + n * 0.13), f1: 640 * (1 + n * 0.13), dur: 0.09, g: 0.2 });
    },
    record() {
      tone({ type: 'triangle', f0: 523, dur: 0.09, g: 0.2 });
      tone({ type: 'triangle', f0: 659, dur: 0.09, g: 0.2, delay: 0.08 });
      tone({ type: 'triangle', f0: 784, dur: 0.09, g: 0.2, delay: 0.16 });
      tone({ type: 'triangle', f0: 1047, dur: 0.2, g: 0.24, delay: 0.24 });
    },
    over() {
      tone({ type: 'sawtooth', f0: 196, dur: 0.5, g: 0.16, a: 0.03 });
      tone({ type: 'sawtooth', f0: 155, dur: 0.5, g: 0.16, a: 0.03, delay: 0.3 });
      tone({ type: 'sawtooth', f0: 110, dur: 0.9, g: 0.18, a: 0.03, delay: 0.6 });
      noise({ dur: 0.8, f0: 700, f1: 90, g: 0.3, delay: 0.05 });
    },
    spit() {
      if (!ok('spit', 0.05)) return;
      noise({ dur: 0.12, type: 'bandpass', f0: 900, f1: 300, q: 2, g: 0.2 });
    },
    lunge() {
      if (!ok('lunge', 0.06)) return;
      tone({ type: 'sawtooth', f0: 130, f1: 320, dur: 0.16, g: 0.14 });
    },
  };
})();
