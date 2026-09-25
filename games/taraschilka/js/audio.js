'use strict';

const A = {
  ctx: null, master: null, started: false, muted: false,
  nextNoteTime: 0, step: 0, timer: null,
  lookahead: 25, scheduleAhead: 0.12,
  bpm: 120, intensity: 0,
  onKick: null, onSnare: null, onBeat: null, onBar: null, onStep: null,
  trackId: 'default',
  reverb: null, delay: null,
};
A.stepDur = () => 60 / A.bpm / 4;

const nb = {};

function makeNoise(ctx, dur) {
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function pKick(c, out, at, gain) {
  gain = gain === undefined ? 1 : gain;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(135, at);
  o.frequency.exponentialRampToValueAtTime(45, at + 0.11);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(1.0 * gain, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
  o.connect(g); g.connect(out); o.start(at); o.stop(at + 0.25);
  const c2 = c.createOscillator(), g2 = c.createGain();
  c2.type = 'square'; c2.frequency.value = 1800;
  g2.gain.setValueAtTime(0.18 * gain, at);
  g2.gain.exponentialRampToValueAtTime(0.0001, at + 0.015);
  c2.connect(g2); g2.connect(out); c2.start(at); c2.stop(at + 0.02);
}

function pSnare(c, out, at, gain) {
  gain = gain === undefined ? 1 : gain;
  const n = c.createBufferSource(); n.buffer = nb.snare;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.9;
  const g = c.createGain(); g.gain.setValueAtTime(0.55 * gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  n.connect(f); f.connect(g); g.connect(out); n.start(at); n.stop(at + 0.2);
  const o = c.createOscillator(), og = c.createGain();
  o.type = 'triangle'; o.frequency.value = 200;
  og.gain.setValueAtTime(0.35 * gain, at);
  og.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
  o.connect(og); og.connect(out); o.start(at); o.stop(at + 0.12);
}

function pHH(c, out, at, open, gain) {
  gain = gain === undefined ? 1 : gain;
  const dur = open ? 0.13 : 0.035;
  const n = c.createBufferSource(); n.buffer = nb.hh;
  const f = c.createBiquadFilter(); f.type = 'highpass';
  f.frequency.value = open ? 6500 : 8500;
  const g = c.createGain();
  g.gain.setValueAtTime((open ? 0.16 : 0.13) * gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  n.connect(f); f.connect(g); g.connect(out); n.start(at); n.stop(at + dur + 0.01);
}

function pBass(c, out, freq, at, dur, gain) {
  gain = gain === undefined ? 1 : gain;
  const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.value = freq;
  f.type = 'lowpass'; f.frequency.setValueAtTime(900, at);
  f.frequency.exponentialRampToValueAtTime(260, at + dur); f.Q.value = 5;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.34 * gain, at + 0.01);
  g.gain.setValueAtTime(0.34 * gain, at + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(f); f.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.02);
}

function pPad(c, out, notes, at, dur, bright, gain) {
  gain = gain === undefined ? 1 : gain;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = bright; filter.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(0.075 * gain, at + 0.2);
  g.gain.setValueAtTime(0.075 * gain, at + dur - 0.4);
  g.gain.linearRampToValueAtTime(0.0001, at + dur);
  filter.connect(g); g.connect(out);
  notes.forEach(freq => {
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.value = freq; o.detune.value = (Math.random() - 0.5) * 14;
    o.connect(filter); o.start(at); o.stop(at + dur + 0.05);
  });
}

function pLead(c, out, freq, at, dur, gain) {
  gain = gain === undefined ? 1 : gain;
  const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.value = freq;
  f.type = 'lowpass'; f.frequency.setValueAtTime(2400, at);
  f.frequency.exponentialRampToValueAtTime(800, at + dur); f.Q.value = 4;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.12 * gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(f); f.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.02);
  const eo = c.createOscillator(), eg = c.createGain(), ef = c.createBiquadFilter();
  eo.type = 'sawtooth'; eo.frequency.value = freq;
  ef.type = 'lowpass'; ef.frequency.value = 1100;
  eg.gain.setValueAtTime(0.0001, at + 0.16);
  eg.gain.exponentialRampToValueAtTime(0.035 * gain, at + 0.17);
  eg.gain.exponentialRampToValueAtTime(0.0001, at + 0.17 + dur * 0.6);
  eo.connect(ef); ef.connect(eg); eg.connect(out);
  eo.start(at + 0.16); eo.stop(at + 0.16 + dur + 0.02);
}

function playStep(step, time) {
  const c = A.ctx, out = A.master; if (!c || !out) return;
  const s = step % 16, bar = Math.floor(step / 16) % 8, I = A.intensity;
  const chord = CHORDS[bar];
  if (s === 0 || s === 8) { pKick(c, out, time, 1); A.onKick && A.onKick(); }
  else if (I > 0.4 && (s === 6 || s === 14)) { pKick(c, out, time, 0.7); A.onKick && A.onKick(); }
  if ((s === 4 || s === 12) && I > 0.15) { pSnare(c, out, time, 0.7 + I * 0.4); A.onSnare && A.onSnare(); }
  if (I > 0.3 && s % 2 === 0) pHH(c, out, time, false, 0.6 + I * 0.5);
  if (I > 0.7) pHH(c, out, time, false, 0.4);
  if (I > 0.85 && s === 7) pHH(c, out, time, true, 0.6);
  const bassPat = I > 0.5
    ? [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,1]
    : [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0];
  if (bassPat[s]) pBass(c, out, chord.bass, time, A.stepDur() * 1.7, 0.9 + I * 0.35);
  if (s === 0) pPad(c, out, chord.pad, time, A.stepDur() * 16 * 1.02, 1200 + I * 700, 0.95);
  if (I > 0.5) { const note = LEADS[bar][s]; if (note) pLead(c, out, note, time, A.stepDur() * 1.4, 0.9); }
  if (s % 4 === 0) A.onBeat && A.onBeat();
  if (s === 0) A.onBar && A.onBar(bar);
  if (A.onStep) A.onStep(s, bar);
}

const VOID_CHORDS = [
  { bass: 36.71, reese: 73.42, pad: [146.83, 174.61, 220.00] },
  { bass: 29.14, reese: 58.27, pad: [116.54, 146.83, 174.61] },
  { bass: 43.65, reese: 87.31, pad: [174.61, 220.00, 261.63] },
  { bass: 41.20, reese: 82.41, pad: [164.81, 207.65, 246.94] },
  { bass: 36.71, reese: 73.42, pad: [146.83, 174.61, 220.00] },
  { bass: 29.14, reese: 58.27, pad: [116.54, 146.83, 174.61] },
  { bass: 43.65, reese: 87.31, pad: [174.61, 220.00, 261.63] },
  { bass: 41.20, reese: 82.41, pad: [164.81, 207.65, 246.94] },
];
const VOID_LEADS = [
  [587.33, 0, 698.46, 0, 880.00, 0, 698.46, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [466.16, 0, 587.33, 0, 698.46, 0, 587.33, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [698.46, 0, 880.00, 0, 1046.50, 0, 880.00, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [659.25, 0, 523.25, 0, 440.00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [880.00, 0, 698.46, 0, 587.33, 0, 698.46, 0, 880.00, 0, 0, 0, 0, 0, 0, 0],
  [698.46, 0, 587.33, 0, 466.16, 0, 587.33, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [880.00, 0, 1046.50, 0, 1318.51, 0, 1046.50, 0, 880.00, 0, 0, 0, 0, 0, 0, 0],
  [987.77, 0, 880.00, 0, 659.25, 0, 523.25, 0, 440.00, 0, 0, 0, 0, 0, 0, 0],
];
const VOID_KICK  = [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0];
const VOID_SNARE = [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0];
const VOID_GHOST = [0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1];
const VOID_HH    = [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0];
const VOID_OHH   = [0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0];

let _voidDistCurve = null;
function _voidGetDistCurve() {
  if (_voidDistCurve) return _voidDistCurve;
  const n = 1024;
  const arr = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    arr[i] = Math.tanh(x * 4);
  }
  _voidDistCurve = arr;
  return arr;
}

function vSub(c, out, freq, at, dur, gain) {
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(0.55 * gain, at + 0.03);
  g.gain.setValueAtTime(0.55 * gain, at + dur - 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(out);
  o.start(at); o.stop(at + dur + 0.05);
}

function vReese(c, out, freq, at, dur, gain) {
  const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = freq; o1.detune.value = -14;
  const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq; o2.detune.value = 14;
  const f = c.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(200, at);
  f.frequency.linearRampToValueAtTime(700, at + dur * 0.4);
  f.frequency.linearRampToValueAtTime(280, at + dur * 0.9);
  f.Q.value = 4;
  const lfo = c.createOscillator(); lfo.type = 'sine';
  lfo.frequency.value = 0.35 + Math.random() * 0.4;
  const lfoG = c.createGain(); lfoG.gain.value = 180;
  lfo.connect(lfoG); lfoG.connect(f.frequency);
  const ws = c.createWaveShaper();
  ws.curve = _voidGetDistCurve();
  ws.oversample = '2x';
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(0.2 * gain, at + 0.04);
  g.gain.setValueAtTime(0.2 * gain, at + dur - 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o1.connect(f); o2.connect(f); f.connect(ws); ws.connect(g); g.connect(out);
  o1.start(at); o2.start(at); lfo.start(at);
  o1.stop(at + dur + 0.05); o2.stop(at + dur + 0.05); lfo.stop(at + dur + 0.05);
}

let _voidLastLead = 0;
let _voidLastBar = -1;

function vLead(c, out, freq, at, dur, gain, bright) {
  const attack = Math.min(0.08, dur * 0.18);
  const release = Math.min(0.4, dur * 0.35);
  const sustainEnd = at + dur - release;

  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(bright ? 3000 : 2000, at);
  f.frequency.linearRampToValueAtTime(bright ? 4000 : 2800, at + dur * 0.4);
  f.frequency.linearRampToValueAtTime(bright ? 1600 : 1100, at + dur);
  f.Q.value = 4;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(0.2 * gain, at + attack);
  g.gain.setValueAtTime(0.2 * gain, sustainEnd);
  g.gain.linearRampToValueAtTime(0.0001, at + dur);

  const vib = c.createOscillator();
  vib.type = 'sine'; vib.frequency.value = 5.4;
  const vibG = c.createGain(); vibG.gain.value = 4;
  vib.connect(vibG);

  const o1 = c.createOscillator();
  o1.type = 'sawtooth';
  if (_voidLastLead > 0 && Math.abs(_voidLastLead - freq) / freq < 0.6) {
    o1.frequency.setValueAtTime(_voidLastLead, at);
    o1.frequency.exponentialRampToValueAtTime(freq, at + attack * 1.8);
  } else {
    o1.frequency.setValueAtTime(freq, at);
  }
  o1.detune.value = -5;
  vibG.connect(o1.detune);

  const o2 = c.createOscillator();
  o2.type = 'triangle';
  o2.frequency.value = freq;
  o2.detune.value = 5;
  vibG.connect(o2.detune);

  const o1g = c.createGain(); o1g.gain.value = 0.5;
  const o2g = c.createGain(); o2g.gain.value = 0.5;
  o1.connect(o1g); o1g.connect(f);
  o2.connect(o2g); o2g.connect(f);
  f.connect(g);

  const dry = c.createGain(); dry.gain.value = 0.75;
  g.connect(dry); dry.connect(out);

  if (A.reverb) {
    const rv = c.createGain(); rv.gain.value = 0.5;
    g.connect(rv); rv.connect(A.reverb);
  }
  if (A.delay) {
    const dl = c.createGain(); dl.gain.value = 0.35;
    g.connect(dl); dl.connect(A.delay);
  }

  const stopAt = at + dur + 0.15;
  vib.start(at); vib.stop(stopAt);
  o1.start(at); o1.stop(stopAt);
  o2.start(at); o2.stop(stopAt);
}

function vCrash(c, out, at, gain) {
  const dur = 1.8;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const bd = buf.getChannelData(0);
  for (let i = 0; i < len; i++) bd[i] = Math.random() * 2 - 1;
  const n = c.createBufferSource(); n.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.28 * gain, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  n.connect(f); f.connect(g); g.connect(out);
  if (A.reverb) g.connect(A.reverb);
  n.start(at); n.stop(at + dur + 0.05);
}

function playStepVoid(step, time) {
  const c = A.ctx, out = A.master; if (!c || !out) return;
  const s = step % 16, bar = Math.floor(step / 16) % 8, I = A.intensity;
  const chord = VOID_CHORDS[bar];

  if (bar !== _voidLastBar) { _voidLastLead = 0; _voidLastBar = bar; }

  if (s === 0 && bar === 0) vCrash(c, out, time, 0.7);

  const dg = 0.85 + I * 0.15;
  if (VOID_KICK[s])  { pKick(c, out, time, dg); A.onKick && A.onKick(); }
  if (VOID_SNARE[s]) pSnare(c, out, time, dg * 0.9);
  if (VOID_GHOST[s]) pSnare(c, out, time, dg * 0.55);
  if (VOID_HH[s])    pHH(c, out, time, false, dg * 0.65);
  if (VOID_OHH[s])   pHH(c, out, time, true, dg * 0.75);

  if (bar === 7 && s >= 12) {
    const intens = (s - 11) / 5;
    pSnare(c, out, time, intens * 0.55);
  }

  if (s === 0) {
    const dur = A.stepDur() * 15.5;
    vSub(c, out, chord.bass, time, dur, 0.9 * (0.8 + I * 0.4));
    vReese(c, out, chord.reese, time, dur, 0.9 * (0.8 + I * 0.4));
  }
  if (s === 8 && I > 0.5) {
    vReese(c, out, chord.reese * 1.5, time, A.stepDur() * 5.5, 0.35);
  }

  if (s === 0) {
    pPad(c, out, chord.pad, time, A.stepDur() * 16, 1000, 0.9);
  }

  const note = VOID_LEADS[bar][s];
  if (note) {
    const dur = A.stepDur() * 2.6;
    vLead(c, out, note, time, dur, 0.85 * (0.75 + I * 0.3), I > 0.7);
    _voidLastLead = note;
  }

  if (s % 4 === 0) A.onBeat && A.onBeat();
  if (s === 0) A.onBar && A.onBar(bar);
  if (A.onStep) A.onStep(s, bar);
}

// ═══════════════════════════════════════════════
//  KYRIE — Liturgical Lament Stutter
//  Полный порт flkka.html. Key D (38), 96 BPM, 32 бара.
//  Слой 1 (keygen) играет всегда.
//  Слой 2 (stutter) — окна пения с обрывом на барах 7 / 19 / 31.
// ═══════════════════════════════════════════════

const _litNoise = { buf: null };
function litNoise() {
  if (_litNoise.buf) return _litNoise.buf;
  const c = A.ctx;
  _litNoise.buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = _litNoise.buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return _litNoise.buf;
}
function litMidi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
function litOut(node, wet) {
  if (!A.master) return;
  node.connect(A.master);
  if (wet > 0 && A.reverb) {
    const g = A.ctx.createGain();
    g.gain.value = wet;
    node.connect(g);
    g.connect(A.reverb);
  }
}
function litEnv(g, t, peak, dur, attack, release) {
  attack = attack == null ? 0.006 : attack;
  release = release == null ? 0.05 : release;
  const a = Math.min(attack, dur * 0.3);
  const r = Math.min(release, dur * 0.3);
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + Math.max(a, dur - r));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
let _litDistCurve = null;
function litDistCurve() {
  if (_litDistCurve) return _litDistCurve;
  const n = 1024, c = new Float32Array(n), k = 20;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = (1 + k) * x / (1 + k * Math.abs(x));
  }
  _litDistCurve = c;
  return c;
}

// ---- инструменты ----
function litKick(t, a, pitch, decay) {
  a = a == null ? 0.85 : a;
  pitch = pitch == null ? 158 : pitch;
  decay = decay == null ? 0.26 : decay;
  const c = A.ctx;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(pitch, t);
  o.frequency.exponentialRampToValueAtTime(38, t + decay * 0.55);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(a, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g); g.connect(A.master);
  o.start(t); o.stop(t + decay + 0.05);
}
function litSnare(t, a, d) {
  a = a == null ? 0.5 : a;
  d = d == null ? 0.18 : d;
  const c = A.ctx;
  const n = c.createBufferSource();
  n.buffer = litNoise();
  const f = c.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 1300;
  const g = c.createGain();
  g.gain.setValueAtTime(a, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(f); f.connect(g);
  litOut(g, 0.12);
  n.start(t, Math.random() * 1.5); n.stop(t + d + 0.02);
  const o = c.createOscillator(), g2 = c.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(92, t + d);
  g2.gain.setValueAtTime(a * 0.55, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.7);
  o.connect(g2); g2.connect(A.master);
  o.start(t); o.stop(t + d + 0.02);
}
function litHat(t, a, d) {
  a = a == null ? 0.1 : a;
  d = d == null ? 0.04 : d;
  const c = A.ctx;
  const n = c.createBufferSource();
  n.buffer = litNoise();
  const f = c.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 7500;
  const g = c.createGain();
  g.gain.setValueAtTime(a, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(f); f.connect(g); g.connect(A.master);
  n.start(t, Math.random() * 1.5); n.stop(t + d + 0.02);
}
function litBass(freq, t, d, a, cut, wave) {
  a = a == null ? 0.22 : a;
  cut = cut == null ? 600 : cut;
  wave = wave || 'sawtooth';
  const c = A.ctx;
  const o = c.createOscillator();
  o.type = wave; o.frequency.value = freq;
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 4;
  const g = c.createGain();
  litEnv(g, t, a, d, 0.005, 0.04);
  o.connect(f); f.connect(g); g.connect(A.master);
  o.start(t); o.stop(t + d + 0.03);
}
function litOrgan(freqs, t, d, a) {
  a = a == null ? 0.05 : a;
  const c = A.ctx;
  const bus = c.createGain();
  bus.gain.setValueAtTime(0.0001, t);
  bus.gain.linearRampToValueAtTime(1, t + 0.06);
  bus.gain.setValueAtTime(1, t + Math.max(0.1, d - 0.15));
  bus.gain.exponentialRampToValueAtTime(0.0001, t + d);
  litOut(bus, 0.35);
  const harms = [1, 2, 4];
  for (let k = 0; k < freqs.length; k++) {
    const f = freqs[k];
    for (let j = 0; j < harms.length; j++) {
      const o = c.createOscillator();
      o.type = 'sine'; o.frequency.value = f * harms[j];
      o.detune.value = k * 4 + j * 3 - 8;
      const hg = c.createGain();
      hg.gain.value = a / (j + 1);
      o.connect(hg); hg.connect(bus);
      o.start(t); o.stop(t + d + 0.05);
    }
  }
}
function litLead(freq, t, d, a, wave) {
  a = a == null ? 0.05 : a;
  wave = wave || 'square';
  const c = A.ctx;
  const o = c.createOscillator();
  o.type = wave; o.frequency.value = freq;
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 3500; f.Q.value = 1;
  const g = c.createGain();
  litEnv(g, t, a, d, 0.006, 0.03);
  o.connect(f); f.connect(g);
  litOut(g, 0.18);
  o.start(t); o.stop(t + d + 0.03);
}
function litBell(freq, t, d, a) {
  a = a == null ? 0.07 : a;
  const c = A.ctx;
  const car = c.createOscillator();
  car.type = 'sine'; car.frequency.value = freq;
  const mod = c.createOscillator();
  mod.type = 'sine'; mod.frequency.value = freq * 2.76;
  const mg = c.createGain();
  mg.gain.setValueAtTime(freq * 1.6, t);
  mg.gain.exponentialRampToValueAtTime(0.5, t + d * 0.75);
  mod.connect(mg); mg.connect(car.frequency);
  const g = c.createGain();
  litEnv(g, t, a, d, 0.005, 0.05);
  car.connect(g);
  litOut(g, 0.5);
  car.start(t); car.stop(t + d + 0.05);
  mod.start(t); mod.stop(t + d + 0.05);
}
function litTimpani(freq, t, d, a) {
  a = a == null ? 0.4 : a;
  const c = A.ctx;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq * 1.4, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(a, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  litOut(g, 0.4);
  o.start(t); o.stop(t + d + 0.03);
  const n = c.createBufferSource();
  n.buffer = litNoise();
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 200;
  const g2 = c.createGain();
  g2.gain.setValueAtTime(a * 0.3, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  n.connect(f); f.connect(g2); g2.connect(A.master);
  n.start(t, Math.random() * 1.5); n.stop(t + 0.1);
}
function litPad(freqs, t, d, a) {
  a = a == null ? 0.03 : a;
  const c = A.ctx;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(a, t + Math.min(0.5, d * 0.2));
  g.gain.setValueAtTime(a, t + Math.max(0.5, d - 0.5));
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  lp.connect(g);
  litOut(g, 0.3);
  for (const f of freqs) {
    for (const det of [-5, 5]) {
      const o = c.createOscillator();
      o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
      o.connect(lp);
      o.start(t); o.stop(t + d + 0.05);
    }
  }
}
function litChoir(freqs, t, d, opts) {
  opts = opts || {};
  const c = A.ctx;
  const a = opts.amp || 0.075;
  const attack = opts.attack || 0.5;
  const release = opts.release != null ? opts.release : 0.7;
  const formants = opts.formants || [[780, 5], [1180, 6], [2600, 7]];
  const detune = opts.detune != null ? opts.detune : 8;
  const vibRate = opts.vibRate || 4.4;
  const vibDepth = opts.vibDepth || 3.5;
  const breath = opts.breath != null ? opts.breath : 0.02;

  const raw = c.createGain();
  const pre = c.createBiquadFilter();
  pre.type = 'highpass'; pre.frequency.value = 400; pre.Q.value = 0.7;
  const shaper = c.createWaveShaper();
  shaper.curve = litDistCurve(); shaper.oversample = '4x';
  const post = c.createBiquadFilter();
  post.type = 'highpass'; post.frequency.value = 450; post.Q.value = 0.7;
  const formantMix = c.createGain();
  formants.forEach(([f, q], i) => {
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = c.createGain();
    g.gain.value = i === 0 ? 1.6 : (i === 1 ? 1.0 : 0.55);
    post.connect(bp); bp.connect(g); g.connect(formantMix);
  });
  const envNode = c.createGain();
  envNode.gain.setValueAtTime(0.0001, t);
  envNode.gain.linearRampToValueAtTime(a, t + attack);
  envNode.gain.setValueAtTime(a, t + Math.max(attack + 0.05, d - release));
  envNode.gain.exponentialRampToValueAtTime(0.0001, t + d);
  formantMix.connect(envNode);
  litOut(envNode, 0.5);
  raw.connect(pre); pre.connect(shaper); shaper.connect(post);
  if (breath > 0) {
    const n = c.createBufferSource();
    n.buffer = litNoise(); n.loop = true;
    const nf = c.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 2200; nf.Q.value = 1.8;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(breath, t + attack);
    ng.gain.setValueAtTime(breath, t + Math.max(attack + 0.05, d - release));
    ng.gain.exponentialRampToValueAtTime(0.0001, t + d);
    n.connect(nf); nf.connect(ng); ng.connect(envNode);
    n.start(t, Math.random() * 1.5); n.stop(t + d + 0.03);
  }
  const lfo = c.createOscillator();
  lfo.type = 'sine'; lfo.frequency.value = vibRate;
  const lg = c.createGain(); lg.gain.value = vibDepth;
  lfo.connect(lg);
  lfo.start(t); lfo.stop(t + d + 0.03);
  for (const f of freqs) {
    for (const det of [-detune, 0, detune]) {
      const o = c.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
      lg.connect(o.detune);
      o.connect(raw);
      o.start(t); o.stop(t + d + 0.03);
    }
  }
}

// ---- гармония ----
const LIT_CHORDS = [[0, 3, 7], [8, 12, 15], [10, 14, 17], [7, 11, 14]];
const LIT_ARP = [
  [0, 3, 7, 12, 7, 3],
  [8, 12, 15, 20, 15, 12],
  [10, 14, 17, 22, 17, 14],
  [7, 11, 14, 19, 14, 11],
];
const LIT_KEY = 38;
const LIT_BARS = 32;

function _litIsSingingBar(bar) {
  if (bar < 4)  return false;
  if (bar < 8)  return true;
  if (bar < 12) return false;
  if (bar < 20) return true;
  if (bar < 24) return false;
  return true;
}
function _litIsLastOfSinging(bar) {
  return bar === 7 || bar === 19 || bar === 31;
}

function _litStepKeygen(time, bar, s, section, idx) {
  const root = LIT_KEY;
  const beat = 60 / A.bpm;
  const barDur = beat * 4;
  const c = LIT_CHORDS[idx].map(n => litMidi(root + n + 12));

  if (s === 0) litOrgan(c, time, barDur, 0.05);

  const arp = LIT_ARP[idx];
  const note = arp[s % 6] + (s >= 8 ? 12 : 0);
  litLead(litMidi(root + note + 12), time, beat * 0.19, 0.045, 'square');

  if (section === 0) {
    if (s === 0 || s === 8) { litKick(time, 0.78, 150, 0.24); A.onKick && A.onKick(); }
    if (s === 4 || s === 12) litSnare(time, 0.4, 0.18);
  } else {
    if (section >= 2 || s % 2 === 0) { litKick(time, 0.45, 152, 0.15); A.onKick && A.onKick(); }
    if (s === 4 || s === 12) litSnare(time, 0.45, 0.18);
    if (s % 2 === 1) litHat(time, 0.06, 0.03);
  }

  if (section >= 2 && s % 2 === 0) {
    const bn = LIT_CHORDS[idx][(s >> 1) % 3];
    litBass(litMidi(root + bn), time, beat * 0.4, 0.2, 420, 'sawtooth');
  }
}

function playStepKyrie(step, time) {
  const c = A.ctx, out = A.master; if (!c || !out) return;
  const loopStep = step % (LIT_BARS * 16);
  const root = LIT_KEY;
  const beat = 60 / A.bpm;
  const barDur = beat * 4;
  const bar = Math.floor(loopStep / 16);
  const s = loopStep % 16;
  const section = Math.floor(bar / 8);
  const idx = bar & 3;

  // keygen layer — всегда
  _litStepKeygen(time, bar, s, section, idx);

  // stutter layer — окна пения
  const sing = _litIsSingingBar(bar);
  const hardCut = _litIsLastOfSinging(bar);

  if (s === 0 && sing) {
    const ch = LIT_CHORDS[idx];
    const dur = hardCut ? barDur * 0.98 : barDur * 2 * 0.98;
    const rel = hardCut ? 0.06 : 0.7;
    litChoir([
      litMidi(root + ch[0] + 24),
      litMidi(root + ch[1] + 24),
      litMidi(root + ch[2] + 24),
      litMidi(root + ch[0] + 36),
    ], time, dur, {
      amp: 0.075, attack: 0.5, release: rel,
      formants: [[780, 5], [1180, 6], [2600, 7]],
      detune: 8, vibRate: 4.4, vibDepth: 3.5,
      breath: 0.02,
    });
  }

  if (s === 0 && sing && bar % 4 === 0) {
    litTimpani(litMidi(root - 12), time, beat * 2.0, 0.38);
  }
  if (s === 14 && sing) {
    for (let i = 0; i < 3; i++) {
      litTimpani(litMidi(root - 12), time + i * (beat / 4) * 0.6, beat * 0.35, 0.18);
    }
  }
  if (s === 0 && sing && bar % 8 === 0) {
    litBell(litMidi(root - 12), time, barDur * 4, 0.08);
  }
  if (sing && section >= 1) {
    const mel = [24, 27, 31, 36, 34, 31, 27, 24];
    if (s % 2 === 0) {
      litLead(litMidi(root + mel[(s >> 1) % 8] + 12), time, beat * 0.7, 0.075, 'triangle');
    }
    if (s % 2 === 1) {
      litLead(litMidi(root + mel[((s - 1) >> 1) % 8] + 12), time, beat * 0.32, 0.05, 'sawtooth');
    }
  }
  if (s === 0 && !sing) {
    const ch = LIT_CHORDS[idx];
    litPad([
      litMidi(root + 12 + ch[0]),
      litMidi(root + 12 + ch[1]),
    ], time, barDur * 1.05, 0.02);
  }

  if (s % 4 === 0) A.onBeat && A.onBeat();
  if (s === 0) A.onBar && A.onBar(bar);
  if (A.onStep) A.onStep(s, bar);
}

// ═══════════════════════════════════════════════
//  SCHEDULER
// ═══════════════════════════════════════════════

function schedulerTick() {
  if (!A.ctx) return;
  if (A.ctx.state === 'suspended') A.ctx.resume();
  while (A.nextNoteTime < A.ctx.currentTime + A.scheduleAhead) {
    if (A.trackId === 'void') playStepVoid(A.step, A.nextNoteTime);
    else if (A.trackId === 'kyrie') playStepKyrie(A.step, A.nextNoteTime);
    else playStep(A.step, A.nextNoteTime);
    A.nextNoteTime += A.stepDur();
    A.step++;
  }
}

function startAudio() {
  if (A.started) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = A.ctx = new C();
    if (c.state === 'suspended') c.resume();
    nb.snare = makeNoise(c, 0.2);
    nb.hh = makeNoise(c, 0.06);
    const master = A.master = c.createGain();
    master.gain.value = A.muted ? 0 : 0.55;
    master.connect(c.destination);

    const conv = c.createConvolver();
    const rate = c.sampleRate;
    const impLen = Math.floor(rate * 3.5);
    const imp = c.createBuffer(2, impLen, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = imp.getChannelData(ch);
      for (let i = 0; i < impLen; i++) {
        const t = i / impLen;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.0);
      }
    }
    conv.buffer = imp;
    const rvGain = c.createGain(); rvGain.gain.value = 0.42;
    conv.connect(rvGain); rvGain.connect(master);
    A.reverb = conv;

    const dl = c.createDelay(1.2);
    dl.delayTime.value = 0.43;
    const fb = c.createGain(); fb.gain.value = 0.42;
    const dw = c.createGain(); dw.gain.value = 0.35;
    dl.connect(fb); fb.connect(dl); dl.connect(dw); dw.connect(master);
    A.delay = dl;

    A.started = true;
    A.nextNoteTime = c.currentTime + 0.08;
    A.step = 0;
    schedulerTick();
    if (A.timer) clearInterval(A.timer);
    A.timer = setInterval(schedulerTick, A.lookahead);
  } catch (e) { console.error('Audio error', e); }
}

function toggleMute() {
  A.muted = !A.muted;
  if (A.master) A.master.gain.value = A.muted ? 0 : 0.55;
  const b = document.getElementById('muteBtn');
  if (b) b.classList.toggle('muted', A.muted);
}

const TRACKS = {
  default: {
    id: 'default',
    name: 'ТАРАЩИЛКА',
    desc: 'Synthwave · 120 BPM · Am-F-C-G',
    price: 0,
    bpm: 120,
  },
  void: {
    id: 'void',
    name: 'VOID',
    desc: 'Dark Liquid DnB · 172 BPM · Dm-Bb-F-E',
    price: 500,
    bpm: 172,
  },
  kyrie: {
    id: 'kyrie',
    name: 'KYRIE',
    desc: 'Liturgical Lament Stutter · 96 BPM · Dm · 32 бара',
    price: 500,
    bpm: 96,
  },
};

function setTrack(id) {
  if (id === 'void') A.trackId = 'void';
  else if (id === 'kyrie') A.trackId = 'kyrie';
  else A.trackId = 'default';

  if (A.trackId === 'void') A.bpm = 172;
  else if (A.trackId === 'kyrie') A.bpm = 96;
  else A.bpm = 120;

  A.step = 0;
  _voidLastLead = 0;
  _voidLastBar = -1;
  _litNoise.buf = null;
  if (A.ctx) A.nextNoteTime = A.ctx.currentTime + 0.1;
}