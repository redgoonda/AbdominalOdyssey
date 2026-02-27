// music.js — Procedural Web Audio API music for Abdominal Odyssey
// Three looping tracks + a thundering boss intro stinger.

window.MusicSystem = (function () {

  let _ctx = null;
  let _master = null;
  let _currentTrack = null;
  let _loopTimer = null;
  let _nodes = [];

  // ── Note frequency table ───────────────────────────────────────────────────
  const N = {
    A1:55.00, Bb1:58.27, B1:61.74,
    C2:65.41,  D2:73.42,  Eb2:77.78, E2:82.41, F2:87.31,  G2:98.00,
    Ab2:103.83,A2:110.00, Bb2:116.54,B2:123.47,
    C3:130.81, D3:146.83, Eb3:155.56,E3:164.81, F3:174.61, G3:196.00,
    Ab3:207.65,A3:220.00, Bb3:233.08,B3:246.94,
    C4:261.63, D4:293.66, Eb4:311.13,E4:329.63, F4:349.23, G4:392.00,
    Ab4:415.30,A4:440.00, Bb4:466.16,B4:493.88,
    C5:523.25, D5:587.33, Eb5:622.25,E5:659.25, F5:698.46, G5:783.99,
    A5:880.00, Bb5:932.33,
  };

  // ── Audio context ──────────────────────────────────────────────────────────
  function _init() {
    if (_ctx) return true;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _master = _ctx.createGain();
      _master.gain.value = 0.14;
      _master.connect(_ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  function _resume() {
    if (_ctx && _ctx.state === 'suspended') _ctx.resume().catch(() => {});
  }

  // ── Node helpers ───────────────────────────────────────────────────────────
  function _clearNodes() {
    _nodes.forEach(n => { try { n.stop(0); n.disconnect(); } catch (e) {} });
    _nodes = [];
  }

  function _stopAll() {
    if (_loopTimer) { clearTimeout(_loopTimer); _loopTimer = null; }
    _clearNodes();
    _currentTrack = null;
  }

  // Schedule a single oscillator note
  function _osc(freq, start, dur, type = 'square', vol = 0.18) {
    if (!_ctx || !freq) return;
    const o = _ctx.createOscillator();
    const g = _ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(_master);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.012);
    g.gain.setValueAtTime(vol, start + dur * 0.72);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.start(start);
    o.stop(start + dur + 0.02);
    _nodes.push(o);
  }

  // Synthesised kick drum (sine frequency sweep)
  function _kick(start, f0 = 120, f1 = 18, dur = 0.4, vol = 0.7) {
    if (!_ctx) return;
    const o = _ctx.createOscillator();
    const g = _ctx.createGain();
    o.type = 'sine';
    o.connect(g); g.connect(_master);
    o.frequency.setValueAtTime(f0, start);
    o.frequency.exponentialRampToValueAtTime(f1, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.start(start); o.stop(start + dur + 0.02);
    _nodes.push(o);
  }

  // Filtered noise burst (hihat / cymbal)
  function _noise(start, dur, vol = 0.08, hpFreq = 4000) {
    if (!_ctx) return;
    const len = Math.ceil(_ctx.sampleRate * dur);
    const buf = _ctx.createBuffer(1, len, _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    const hp = _ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = hpFreq;
    const g = _ctx.createGain();
    src.connect(hp); hp.connect(g); g.connect(_master);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.start(start);
    _nodes.push(src);
  }

  // ── TRACK: Corridor — "Radiology Blues" ───────────────────────────────────
  // Key: A minor pentatonic | BPM: 118 | 8th = 0.254s | 32 notes = 8.13s
  function _corridorTrack(t) {
    const s = 0.254;
    const mel = [
      N.E5, N.C5, N.A4, N.G4,   N.E4, N.G4, N.A4, N.C5,
      N.D5, N.C5, N.A4, N.G4,   N.A4, N.C5, N.E5, N.G5,
      N.E5, N.D5, N.C5, N.A4,   N.G4, N.E4, N.D4, N.E4,
      N.G4, N.A4, N.C5, N.E5,   N.D5, N.C5, N.A4, N.G4,
    ];
    // Counter-melody a 3rd below (softened)
    const ctr = [
      N.C5, N.A4, N.E4, N.D4,   N.C4, N.D4, N.E4, N.G4,
      N.A4, N.G4, N.E4, N.D4,   N.E4, N.G4, N.C5, N.E5,
      N.C5, N.A4, N.G4, N.E4,   N.D4, N.C4, N.A3, N.C4,
      N.D4, N.E4, N.G4, N.C5,   N.A4, N.G4, N.E4, N.D4,
    ];
    const bass = [
      N.A2, N.A2, N.E2, N.E2,   N.G2, N.G2, N.C2, N.C2,
      N.F2, N.F2, N.E2, N.E2,   N.A2, N.A2, N.D2, N.A2,
    ];
    mel.forEach((f, i) => _osc(f, t + i * s, s * 0.82, 'triangle', 0.18));
    ctr.forEach((f, i) => _osc(f, t + i * s + s * 0.5, s * 0.75, 'triangle', 0.07));
    bass.forEach((f, i) => _osc(f, t + i * s * 2, s * 1.85, 'square', 0.13));
    return mel.length * s;
  }

  // ── TRACK: Mini Boss — "The Cancer God's Fury" ────────────────────────────
  // Key: D minor | BPM: 148 | 8th = 0.203s | 32 notes ≈ 6.5s
  function _minibossTrack(t) {
    const s = 0.203;
    const mel = [
      N.D5, N.F5, N.A5, N.F5,   N.D5, N.C5, N.Bb4, N.A4,
      N.F4, N.A4, N.C5, N.D5,   N.F5, N.D5, N.C5, N.Bb4,
      N.A4, N.G4, N.F4, N.D4,   N.F4, N.A4, N.Bb4, N.C5,
      N.D5, N.F5, N.A5, N.G5,   N.F5, N.D5, N.C5, N.A4,
    ];
    const bass = [
      N.D2, N.A1,  N.D2, N.A1,   N.Bb1, N.F2, N.Bb1, N.F2,
      N.A1, N.E2,  N.A1, N.D2,   N.F2,  N.C2, N.Bb1, N.D2,
    ];
    // Quarter-note kicks + offbeat hihats
    for (let i = 0; i < 16; i++) {
      if (i % 2 === 0) _kick(t + i * s * 2, 100, 22, 0.3, 0.55);
      _noise(t + i * s * 2 + s, 0.07, 0.13, 6000);
    }
    mel.forEach((f, i) => _osc(f, t + i * s, s * 0.72, 'sawtooth', 0.14));
    bass.forEach((f, i) => _osc(f, t + i * s * 2, s * 1.75, 'square', 0.19));
    return mel.length * s;
  }

  // ── TRACK: Final Boss — "The Clinical God's Decree" ───────────────────────
  // Key: D minor + tritone | BPM: 158 | 8th = 0.190s | 30 notes ≈ 5.7s
  function _finalbossTrack(t) {
    const s = 0.190;
    const mel = [
      N.D4, N.F4,  N.Ab4, N.F4,   N.D4, N.Bb3, N.Ab3, N.G3,
      N.F3, N.Ab3, N.C4,  N.D4,   N.F4, N.Ab4, N.Bb4, N.Ab4,
      N.F4, N.D4,  N.C4,  N.Bb3,  N.Ab3, N.F3, N.D3,  N.F3,
      N.Ab3,N.C4,  N.D4,  N.F4,   N.Ab4, N.F4,
    ];
    const bass = [
      N.D2, N.Ab2, N.Bb2, N.F2,   N.D2, N.Ab1, N.C2, N.D2,
      N.F2, N.Bb1, N.Ab1, N.D2,   N.C2, N.Ab1, N.F2, N.D2,
    ];
    // Heavy double kick on every beat
    for (let i = 0; i < 15; i++) {
      if (i % 2 === 0) {
        _kick(t + i * s * 2,       80, 14, 0.5, 0.85);
        _kick(t + i * s * 2 + 0.04, 70, 12, 0.4, 0.6); // double hit
      }
      if (i % 4 === 2) _noise(t + i * s * 2, 0.12, 0.22, 3000); // crash on 3
    }
    // Detuned sawtooth pair for thickness
    mel.forEach((f, i) => {
      _osc(f,          t + i * s, s * 0.78, 'sawtooth', 0.13);
      _osc(f * 1.009,  t + i * s, s * 0.78, 'sawtooth', 0.05);
    });
    bass.forEach((f, i) => _osc(f, t + i * s * 2, s * 1.92, 'sine', 0.24));
    return mel.length * s;
  }

  // ── ONE-SHOT: Boss Intro Stinger (~2.8s thunder) ──────────────────────────
  function _playBossIntro(onDone) {
    if (!_ctx) { setTimeout(onDone, 100); return; }
    _resume();
    _clearNodes();
    const t = _ctx.currentTime + 0.05;

    // Three thunder hits (kick cascades)
    _kick(t,        160, 14, 0.70, 1.0);
    _noise(t,       0.35, 0.45, 200);
    _kick(t + 0.38, 130, 14, 0.60, 0.9);
    _noise(t+0.38,  0.30, 0.35, 300);
    _kick(t + 0.70, 110, 14, 0.50, 0.85);
    _noise(t+0.70,  0.25, 0.30, 400);

    // Rising sawtooth sweep D3 → D5
    const sweep = _ctx.createOscillator();
    const sweepG = _ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.connect(sweepG); sweepG.connect(_master);
    sweep.frequency.setValueAtTime(N.D3, t + 0.85);
    sweep.frequency.exponentialRampToValueAtTime(N.D5, t + 1.75);
    sweepG.gain.setValueAtTime(0.14, t + 0.85);
    sweepG.gain.exponentialRampToValueAtTime(0.0001, t + 1.85);
    sweep.start(t + 0.85); sweep.stop(t + 1.90);
    _nodes.push(sweep);

    // Final impact chord: D minor triad ff
    _kick(t + 1.82, 55, 10, 0.85, 1.0);
    _noise(t + 1.82, 0.55, 0.50, 200);
    [[N.D3, 0.20], [N.F3, 0.17], [N.A3, 0.16], [N.D4, 0.14], [N.F4, 0.10]]
      .forEach(([f, v]) => _osc(f, t + 1.82, 0.85, 'sawtooth', v));

    setTimeout(() => { if (onDone) onDone(); }, 2800);
  }

  // ── Loop scheduler ────────────────────────────────────────────────────────
  const _tracks = {
    corridor:  _corridorTrack,
    miniboss:  _minibossTrack,
    finalboss: _finalbossTrack,
  };

  function _scheduleLoop(name) {
    if (!_ctx || _currentTrack !== name) return;
    const fn = _tracks[name];
    if (!fn) return;
    const t = _ctx.currentTime + 0.05;
    const dur = fn(t);
    _loopTimer = setTimeout(() => {
      if (_currentTrack !== name) return;
      _nodes = []; // old notes have ended naturally by now
      _scheduleLoop(name);
    }, Math.max(100, (dur - 0.08) * 1000));
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    play(trackName) {
      if (!_init()) return;
      if (_currentTrack === trackName) { _resume(); return; }
      _stopAll();
      _currentTrack = trackName;
      _resume();
      _scheduleLoop(trackName);
    },

    // Plays the thundering intro stinger, then fades into the named track
    playBossIntro(trackName, onDone) {
      if (!_init()) { if (onDone) onDone(); return; }
      _stopAll();
      _currentTrack = null;
      _resume();
      _playBossIntro(() => {
        _currentTrack = trackName;
        _scheduleLoop(trackName);
        if (onDone) onDone();
      });
    },

    stop() { _stopAll(); },

    resume() { _resume(); },
  };
})();
