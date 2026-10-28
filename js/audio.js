/* CALOTA — âm thanh tổng hợp bằng WebAudio (không cần file) */
(function (C) {
  let ac = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
  let hiss = null, musicTimer = null, musicMode = null;
  const S = C.sfx = { on: C.store.get('sound', true) };

  function ctx() {
    if (ac) return ac;
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { } // iPhone: bỏ qua nút gạt im lặng
    ac = new A();
    master = ac.createGain(); master.gain.value = S.on ? 0.9 : 0; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = 0.22; musBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  S.unlock = function () { const a = ctx(); if (a && a.state === 'suspended') a.resume(); };
  S.setOn = function (v) { S.on = v; C.store.set('sound', v); if (master) master.gain.value = v ? 0.9 : 0; };

  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f0, f1, dur, vol, bus) {
    const a = ctx(); if (!a) return; const t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, vol, dur); o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, fType, f0, f1, q) {
    const a = ctx(); if (!a) return; const t = a.currentTime;
    const s = a.createBufferSource(); s.buffer = noiseBuf;
    const f = a.createBiquadFilter(); f.type = fType || 'lowpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = a.createGain(); env(g, t, 0.005, vol, dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  let lastShot = 0;
  S.play = function (n) {
    if (!S.on) return; const a = ctx(); if (!a) return;
    switch (n) {
      case 'shoot': if (a.currentTime - lastShot < 0.07) return; lastShot = a.currentTime; tone('square', 880, 520, 0.06, 0.05); break;
      case 'hit': tone('triangle', 300, 120, 0.08, 0.12); break;
      case 'kill': noise(0.25, 0.35, 'lowpass', 2400, 300); tone('square', 420, 90, 0.2, 0.08); break;
      case 'explode': noise(0.7, 0.6, 'lowpass', 1800, 80); tone('sine', 120, 40, 0.6, 0.4); break;
      case 'pickup': tone('sine', 880, 1760, 0.12, 0.15); setTimeout(() => tone('sine', 1320, 2200, 0.1, 0.12), 60); break;
      case 'hurt': tone('sawtooth', 300, 80, 0.3, 0.18); noise(0.2, 0.2, 'bandpass', 1200, 400, 2); break;
      case 'shield': tone('sine', 600, 1200, 0.3, 0.15); break;
      case 'bossShot': noise(0.25, 0.4, 'lowpass', 900, 120); tone('square', 160, 60, 0.2, 0.15); break;
      case 'warn': tone('square', 520, 520, 0.25, 0.12); setTimeout(() => tone('square', 390, 390, 0.25, 0.12), 300); break;
      case 'dash': noise(0.25, 0.25, 'bandpass', 600, 3000, 1.5); break;
      case 'sizzle': noise(0.18, 0.12, 'highpass', 4000, 6000); break;
      case 'shieldBreak': noise(0.6, 0.5, 'bandpass', 3000, 300, 1); tone('triangle', 900, 200, 0.5, 0.2); break;
      case 'ult':
        tone('sawtooth', 110, 880, 0.9, 0.2); noise(1.0, 0.35, 'bandpass', 300, 5000, 1.2);
        setTimeout(() => { tone('square', 1320, 1320, 0.12, 0.1); tone('square', 1760, 1760, 0.2, 0.08); }, 700); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone('triangle', f, f, 0.3, 0.18), i * 140)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone('triangle', f, f, 0.35, 0.16), i * 180)); break;
    }
  };

  /** Tiếng xịt hóa chất: nhiễu lọc dải + rung, cường độ 0..1 (1.0 = Siêu phun) */
  S.hiss = function (level) {
    const a = ctx(); if (!a) return;
    if (!hiss && level > 0 && S.on) {
      const s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3800; bp.Q.value = 0.8;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
      const g = a.createGain(); g.gain.value = 0; const g2 = a.createGain(); g2.gain.value = 0;
      const lfo = a.createOscillator(), lfoG = a.createGain(); lfo.frequency.value = 13; lfoG.gain.value = 0.05;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      s.connect(bp); bp.connect(g); g.connect(sfxBus); s.connect(lp); lp.connect(g2); g2.connect(sfxBus);
      s.start(); lfo.start(); hiss = { s, g, g2, bp, lfo };
    }
    if (hiss) {
      const t = a.currentTime;
      hiss.g.gain.setTargetAtTime(level * 0.32, t, 0.04);
      hiss.g2.gain.setTargetAtTime(level > 0.9 ? 0.5 : level * 0.12, t, 0.05);
      hiss.bp.frequency.setTargetAtTime(level > 0.9 ? 2400 : 3800, t, 0.1);
      if (level <= 0) { const h = hiss; hiss = null; setTimeout(() => { try { h.s.stop(); h.lfo.stop(); } catch (e) { } }, 300); }
    }
  };

  // ---------- nhạc nền tổng hợp ----------
  const scale = [0, 3, 5, 7, 10, 12, 15];
  S.music = function (mode) {
    if (musicMode === mode) return; musicMode = mode;
    clearInterval(musicTimer); musicTimer = null;
    if (!mode) return;
    const a = ctx(); if (!a) return;
    const boss = mode === 'boss'; const bpm = boss ? 148 : 118; const step = 60 / bpm / 2;
    const root = boss ? 45 : 50; let i = 0;
    const prog = boss ? [0, 0, -2, -4] : [0, -4, -7, -2];
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    musicTimer = setInterval(() => {
      if (!S.on || a.state !== 'running') { i++; return; }
      const bar = Math.floor(i / 8) % 4, r = root + prog[bar];
      if (i % 2 === 0) tone('triangle', mtof(r - 12), 0, step * 1.8, boss ? 0.5 : 0.4, musBus);
      const n = scale[(i * (boss ? 5 : 3) + bar) % scale.length];
      if (boss || i % 2 === 1) tone(boss ? 'sawtooth' : 'square', mtof(r + 12 + n), 0, step * 0.9, boss ? 0.09 : 0.12, musBus);
      if (boss && i % 4 === 0) noise(0.08, 0.25, 'lowpass', 300, 60);
      if (i % 4 === 2) noise(0.04, boss ? 0.12 : 0.07, 'highpass', 6000, 8000);
      i++;
    }, step * 1000);
  };
})(window.C);
