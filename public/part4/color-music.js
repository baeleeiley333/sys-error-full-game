// color-music.js — 基础 Techno 持续播放 + 手势叠加层
import { pickRandomTechnoTrack } from "./techno-presets.js";
import { ensureCatMeows, playCatMeow } from "./cat-audio.js";

function midiToHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export class ColorMusic {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bed = null;
    this.core = null;
    this.gesture = null;
    this.filter = null;
    this.bedFilter = null;
    this.dry = null;
    this.wet = null;
    this.delayL = null;
    this.delayR = null;
    this.feedback = null;
    this._noise = null;
    this._running = false;
    this._schedTimer = null;
    this._bedTimer = null;
    this._next16 = 0;
    this._step = 0;
    this._bedBar = 0;
    this.bpm = 128;
    this._expr = {};
    this._scale = [36, 38, 39, 41, 43, 44, 46];
    this._arp = [0, 2, 4, 7, 4, 2, 1, 0];
    this._openPrev = 0;
    this._peacePrev = 0;
    this._fistPrev = 0;
    this._meowTimer = null;
    this._padVoices = [];
    this._bedLfo = null;
    this._bedLfoGain = null;
    this._preset = null;
    this.presetName = "";
  }

  _ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }

  async unlock() {
    const ctx = this._ensure();
    if (ctx.state === "suspended") await ctx.resume();
    ensureCatMeows(ctx).catch(() => {});
    return ctx;
  }

  _buildScale(palette) {
    const h = palette?.[0]?.hsl?.h ?? 220;
    const root = 36 + Math.floor(h / 28) % 18 + (this._preset?.rootShift ?? 0);
    const minor = [0, 2, 3, 5, 7, 8, 10];
    this._scale = minor.map(i => root + i);
    if (palette?.length > 1) {
      this._arp = palette.slice(0, 8).map((c, i) =>
        Math.floor(((c.hsl?.h ?? h) - h) / 30 + i) % 7
      );
    }
  }

  async start(palette) {
    this.stop();
    const ctx = await this.unlock();
    this._running = true;
    this._preset = pickRandomTechnoTrack(palette);
    this.presetName = this._preset.name;
    this.bpm = this._preset.bpm;
    this._buildScale(palette);

    this.master = ctx.createGain();
    this.master.gain.value = 0.54;

    this.bed = ctx.createGain();
    this.bed.gain.value = 0.26;

    this.core = ctx.createGain();
    this.core.gain.value = 0.58;

    this.gesture = ctx.createGain();
    this.gesture.gain.value = 0.08;

    this.bedFilter = ctx.createBiquadFilter();
    this.bedFilter.type = "lowpass";
    this.bedFilter.frequency.value = this._preset.bedCutoff;
    this.bedFilter.Q.value = 0.6;
    this.bed.connect(this.bedFilter).connect(this.master);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 9200;
    this.filter.Q.value = 0.9;

    this.dry = ctx.createGain();
    this.dry.gain.value = 0.78;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.06;

    this.delayL = ctx.createDelay(1.2);
    this.delayR = ctx.createDelay(0.9);
    this.delayL.delayTime.value = 0.333;
    this.delayR.delayTime.value = 0.5;
    this.feedback = ctx.createGain();
    this.feedback.gain.value = 0.22;

    this.filter.connect(this.dry).connect(this.core);
    this.filter.connect(this.wet);
    this.wet.connect(this.delayL).connect(this.delayR).connect(this.feedback);
    this.feedback.connect(this.delayL);
    this.delayR.connect(this.core);
    this.core.connect(this.master);
    this.gesture.connect(this.master);
    this.master.connect(ctx.destination);

    const len = ctx.sampleRate * 2;
    this._noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this._noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this._startBed(ctx);
    this._next16 = ctx.currentTime + 0.06;
    this._step = 0;
    this._bedBar = 0;
    this._openPrev = 0;
    this._peacePrev = 0;
    this._fistPrev = 0;
    this._expr = {};
    this._schedule();
    this._scheduleBed();
    ensureCatMeows(ctx).catch(() => {});
  }

  _startBed(ctx) {
    const t = ctx.currentTime;
    const chord = [0, 2, 4, 6].map(i => this._scale[i % this._scale.length]);
    const detune = [-7, 0, 7, -4];

    for (let i = 0; i < chord.length; i++) {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "sawtooth";
      o.frequency.value = midiToHz(chord[i] + (i === 0 ? -12 : 0));
      o.detune.value = detune[i];
      const g = ctx.createGain();
      g.gain.value = i === 0 ? this._preset.subGain : this._preset.padGain;
      o.connect(g).connect(this.bedFilter);
      o.start(t);
      this._padVoices.push({ o, g, note: chord[i], role: i === 0 ? "sub" : "pad" });
    }

    const shimmer = ctx.createOscillator();
    shimmer.type = "triangle";
    shimmer.frequency.value = midiToHz(this._scale[4] + 12);
    const shG = ctx.createGain();
    shG.gain.value = 0.018;
    shimmer.connect(shG).connect(this.bedFilter);
    shimmer.start(t);
    this._padVoices.push({ o: shimmer, g: shG, note: this._scale[4], role: "shimmer" });

    this._bedLfo = ctx.createOscillator();
    this._bedLfo.frequency.value = this._preset.bedLfo;
    this._bedLfoGain = ctx.createGain();
    this._bedLfoGain.gain.value = 420;
    this._bedLfo.connect(this._bedLfoGain).connect(this.bedFilter.frequency);
    this._bedLfo.start(t);
  }

  _setBedChord(barIdx) {
    if (!this.ctx || !this._padVoices.length) return;
    const deg = this._preset.prog[barIdx % this._preset.prog.length];
    const t = this.ctx.currentTime;
    let pi = 0;
    for (const v of this._padVoices) {
      if (v.role === "shimmer") {
        v.o.frequency.setTargetAtTime(midiToHz(this._scale[deg[2] % this._scale.length] + 12), t, 0.8);
        continue;
      }
      const note = this._scale[deg[pi % deg.length] % this._scale.length];
      v.o.frequency.setTargetAtTime(midiToHz(note + (v.role === "sub" ? -12 : 0)), t, 0.9);
      pi++;
    }
  }

  _scheduleBed() {
    if (!this._running || !this.ctx) return;
    const barDur = (60 / this._effectiveBpm()) * 4;
    this._setBedChord(this._bedBar);
    this._bedBar++;
    this._bedTimer = setTimeout(() => this._scheduleBed(), barDur * 1000);
  }

  _effectiveBpm() {
    return this.bpm + (this._expr.smile ?? 0) * 52;
  }

  getEffectiveBpm() {
    return Math.round(this._effectiveBpm());
  }

  _schedule() {
    if (!this._running || !this.ctx) return;
    const ctx = this.ctx;
    const t16 = (60 / this._effectiveBpm()) / 4;
    const end = ctx.currentTime + 0.28;
    const open = this._expr.openHand ?? 0;
    const smile = this._expr.smile ?? 0;
    const p = this._preset;
    const hatD = p.hatDensity ?? 1;
    const groove = p.groove !== false;

    while (this._next16 < end) {
      const s = this._step % 16;
      const t = this._next16;

      if (s % 4 === 0) this._kick(t);
      if (s === 4 || s === 12) this._snare(t);
      if (groove && (s === 2 || s === 6 || s === 10 || s === 14)) this._rim(t);

      if (hatD >= 1.3) {
        if (s % 2 === 1 || (s % 4 === 2)) this._hat(t, false);
      } else if (hatD >= 1) {
        if (s % 2 === 1) this._hat(t, false);
        if (s % 4 === 2) this._hat(t, false);
      } else if (s % 2 === 1 && (hatD >= 0.7 || s % 4 === 1)) {
        this._hat(t, false);
      }
      if ((s === 7 || s === 15) && hatD >= 0.55) this._hat(t, true);

      const bassHit = s % p.bassEvery === 0 || (groove && (s === 3 || s === 11));
      if (bassHit) this._bass(t, this._scale[s === 8 || s === 11 ? 3 : 0]);

      const arpIdx = this._arp[Math.floor(s / 2) % this._arp.length] ?? 0;
      const leadSteps = smile > 0.45
        ? [...p.leadSteps, 14].filter((v, i, a) => a.indexOf(v) === i)
        : p.leadSteps;
      if (leadSteps.includes(s)) this._lead(t, this._scale[arpIdx % this._scale.length], 0.085);

      if (open > 0.55 && (s === 2 || s === 6 || s === 10 || s === 14)) {
        this.triggerCowbell(0.14 + open * 0.12);
      }
      if (s === 0 || s === 8) this._bedPulse(t);

      this._next16 += t16;
      this._step++;
    }
    this._schedTimer = setTimeout(() => this._schedule(), 20);
  }

  _bedPulse(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = midiToHz(this._scale[0] - 12);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    o.connect(g).connect(this.bedFilter);
    o.start(t);
    o.stop(t + 1.7);
  }

  _sidechainPump(t) {
    if (!this.bed?.gain) return;
    const g = this.bed.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.setTargetAtTime(0.06, t, 0.01);
    g.setTargetAtTime(0.26, t + 0.09, 0.14);
  }

  _kick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(168, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.1);
    g.gain.setValueAtTime(0.88, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g).connect(this.core);
    o.start(t);
    o.stop(t + 0.4);

    const click = ctx.createOscillator();
    const cG = ctx.createGain();
    click.type = "triangle";
    click.frequency.setValueAtTime(3200, t);
    click.frequency.exponentialRampToValueAtTime(800, t + 0.018);
    cG.gain.setValueAtTime(0.12, t);
    cG.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    click.connect(cG).connect(this.core);
    click.start(t);
    click.stop(t + 0.03);

    this._sidechainPump(t);
  }

  _snare(t) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(hp).connect(bp).connect(g).connect(this.core);
    src.start(t);
    src.stop(t + 0.16);

    const body = ctx.createOscillator();
    const bG = ctx.createGain();
    body.type = "triangle";
    body.frequency.setValueAtTime(210, t);
    body.frequency.exponentialRampToValueAtTime(95, t + 0.07);
    bG.gain.setValueAtTime(0.38, t);
    bG.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    body.connect(bG).connect(this.core);
    body.start(t);
    body.stop(t + 0.13);
  }

  _rim(t, amp = 0.09) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 5200;
    bp.Q.value = 2.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    src.connect(bp).connect(g).connect(this.core);
    src.start(t);
    src.stop(t + 0.05);
  }

  _hat(t, open) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = open ? 6800 : 7600;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(open ? 0.16 : 0.11, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.14 : 0.038));
    src.connect(bp).connect(g).connect(this.core);
    src.start(t);
    src.stop(t + 0.16);
  }

  _bass(t, note) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.value = midiToHz(note);
    if (this._preset?.acidBass) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 400 + (this._step % 8) * 180;
      f.Q.value = 8;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.24, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      o.connect(f).connect(g).connect(this.filter);
    } else {
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.28, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(g).connect(this.filter);
    }
    o.start(t);
    o.stop(t + 0.36);
  }

  _lead(t, note, dur = 0.09) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = midiToHz(note + 12);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.065, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.filter);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  _leadGesture(t, note, dur = 0.12) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = midiToHz(note + 12);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.gesture);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  triggerCowbell(amp = 0.2) {
    if (!this.ctx || !this._running) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(820, t);
    o.frequency.exponentialRampToValueAtTime(540, t + 0.04);
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g).connect(this.gesture);
    o.start(t);
    o.stop(t + 0.16);
  }

  triggerMeow(intensity = 1) {
    if (!this.ctx || !this._running) return;
    if (playCatMeow(this.ctx, this.gesture, intensity)) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const amp = 0.2 + intensity * 0.16;
    const mew = ctx.createOscillator();
    const mG = ctx.createGain();
    mew.type = "triangle";
    mew.frequency.setValueAtTime(620, t);
    mew.frequency.exponentialRampToValueAtTime(1100, t + 0.22);
    mew.frequency.exponentialRampToValueAtTime(480, t + 0.5);
    mG.gain.setValueAtTime(0.001, t);
    mG.gain.linearRampToValueAtTime(amp * 0.9, t + 0.06);
    mG.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
    mew.connect(mG).connect(this.gesture);
    mew.start(t);
    mew.stop(t + 0.55);
  }

  _triggerPeaceStab() {
    if (!this.ctx || !this._running) return;
    const t = this.ctx.currentTime;
    this._leadGesture(t, this._scale[4], 0.35);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "triangle";
    o.frequency.value = midiToHz(this._scale[4] + 24);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(this.wet);
    o.start(t);
    o.stop(t + 0.38);
  }

  applyExpression(expr = {}) {
    if (!this.ctx || !this._running) return;
    this._expr = expr;
    const t = this.ctx.currentTime;
    const mouth = expr.mouth ?? 0;
    const peace = expr.peace ?? 0;
    const fist = expr.fist ?? 0;
    const openHand = expr.openHand ?? 0;

    this.master.gain.setTargetAtTime(0.46 + mouth * 0.32, t, 0.05);
    this.core.gain.setTargetAtTime(0.42, t, 0.1);
    this.bed.gain.setTargetAtTime(0.3, t, 0.1);
    this.gesture.gain.setTargetAtTime(0.06 + Math.max(peace, fist, openHand) * 0.28, t, 0.07);

    this.wet.gain.setTargetAtTime(0.04 + peace * 0.55, t, 0.08);
    this.dry.gain.setTargetAtTime(1 - peace * 0.2, t, 0.08);
    this.feedback.gain.setTargetAtTime(0.18 + peace * 0.38, t, 0.09);
    this.delayL.delayTime.setTargetAtTime(0.25 + peace * 0.35, t, 0.1);
    this.delayR.delayTime.setTargetAtTime(0.38 + peace * 0.5, t, 0.1);
    this.filter.frequency.setTargetAtTime(8200 + peace * 2800 + (expr.smile ?? 0) * 1800, t, 0.08);

    if (peace > 0.5 && this._peacePrev <= 0.5) this._triggerPeaceStab();
    if (openHand > 0.6 && this._openPrev <= 0.6) this.triggerCowbell(0.26);
    if (fist > 0.5 && this._fistPrev <= 0.5) this.triggerMeow(fist);
    if (fist > 0.55 && !this._meowTimer) {
      this._meowTimer = setTimeout(() => {
        this._meowTimer = null;
        if ((this._expr.fist ?? 0) > 0.5) this.triggerMeow(this._expr.fist);
      }, 900 + Math.random() * 600);
    }
    if (fist <= 0.4 && this._meowTimer) {
      clearTimeout(this._meowTimer);
      this._meowTimer = null;
    }
    this._peacePrev = peace;
    this._openPrev = openHand;
    this._fistPrev = fist;
  }

  getVolumePct() {
    return Math.round(40 + (this._expr.mouth ?? 0) * 60);
  }

  getTempoActive() {
    return (this._expr.smile ?? 0) > 0.38;
  }

  stop() {
    this._running = false;
    if (this._schedTimer) clearTimeout(this._schedTimer);
    if (this._bedTimer) clearTimeout(this._bedTimer);
    if (this._meowTimer) clearTimeout(this._meowTimer);
    this._schedTimer = null;
    this._bedTimer = null;
    this._meowTimer = null;
    for (const v of this._padVoices) {
      try { v.o.stop(); v.o.disconnect(); } catch (e) {}
    }
    this._padVoices = [];
    if (this._bedLfo) {
      try { this._bedLfo.stop(); this._bedLfo.disconnect(); } catch (e) {}
      this._bedLfo = null;
    }
    if (this.master) {
      try {
        this.master.gain.setValueAtTime(0, this.ctx?.currentTime ?? 0);
        this.master.disconnect();
      } catch (e) {}
      this.master = null;
    }
  }
}
