// magic-sounds.js — 魔法感音效(纯 Web Audio 合成,无音频文件)
let _ctx = null;

export function initMagicAudio() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

export function isMuted() {
  try { return localStorage.getItem("gesto_sound_mute") === "1"; } catch { return false; }
}

export function setMuted(m) {
  try { localStorage.setItem("gesto_sound_mute", m ? "1" : "0"); } catch (e) {}
}

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];

function playTone(ctx, t0, freq, dur, vol, type = "sine", detune = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  pan.pan.value = (Math.random() - 0.5) * 0.55;
  osc.connect(gain).connect(pan).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function playSparkles(ctx, t0, base, rand, n = 7) {
  for (let i = 0; i < n; i++) {
    const f = base * (1.5 + rand() * 1.2);
    const t = t0 + 0.04 + i * (0.035 + rand() * 0.03);
    playTone(ctx, t, f, 0.12 + rand() * 0.18, 0.045 + rand() * 0.03, "sine", (rand() - 0.5) * 30);
  }
}

function playWhoosh(ctx, t0, rand) {
  const len = Math.floor(ctx.sampleRate * 0.35);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (rand() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(280, t0);
  bp.frequency.exponentialRampToValueAtTime(4200, t0 + 0.28);
  bp.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + 0.36);
}

function playBell(ctx, t0, freq, vol = 0.22) {
  [1, 2.4, 3.8, 5.2].forEach((h, i) => {
    playTone(ctx, t0, freq * h, 0.55 + i * 0.12, vol / (i + 1), "sine", (i - 1) * 4);
  });
}

function playArpeggio(ctx, t0, notes, rand) {
  notes.forEach((f, i) => {
    playTone(ctx, t0 + i * 0.065, f, 0.35, 0.1, "triangle", (rand() - 0.5) * 12);
  });
}

/** 手势识别成功时播放魔法音效 */
export function playMagicReveal(label = "") {
  if (isMuted()) return;
  try {
    const ctx = initMagicAudio();
    const rand = rng(seedFrom(label || "spell"));
    const t0 = ctx.currentTime + 0.01;
    const root = PENTA[Math.floor(rand() * PENTA.length)];
    const variant = seedFrom(label) % 4;

    playWhoosh(ctx, t0, rand);

    if (variant === 0) {
      playBell(ctx, t0 + 0.06, root, 0.2);
      playArpeggio(ctx, t0 + 0.1, [root, root * 1.25, root * 1.5, root * 2], rand);
      playSparkles(ctx, t0 + 0.22, root, rand, 8);
    } else if (variant === 1) {
      playTone(ctx, t0 + 0.05, root * 0.5, 0.4, 0.08, "sine");
      playArpeggio(ctx, t0 + 0.08, [root, root * 1.33, root * 1.66, root * 2, root * 2.5], rand);
      playSparkles(ctx, t0 + 0.35, root * 1.5, rand, 6);
    } else if (variant === 2) {
      playBell(ctx, t0 + 0.04, root * 1.5, 0.16);
      playTone(ctx, t0 + 0.12, root * 2, 0.5, 0.07, "sine", 8);
      playTone(ctx, t0 + 0.18, root * 2.5, 0.45, 0.06, "sine", -6);
      playSparkles(ctx, t0 + 0.15, root * 2, rand, 10);
    } else {
      playArpeggio(ctx, t0 + 0.06, [root * 2, root * 1.5, root * 2.5, root * 3], rand);
      playBell(ctx, t0 + 0.28, root * 2, 0.14);
      playSparkles(ctx, t0 + 0.1, root, rand, 9);
    }
  } catch (e) { /* audio unavailable */ }
}

/** 解锁音频(需用户点击后调用一次) */
export function unlockMagicAudio() {
  try { initMagicAudio(); } catch (e) {}
}

let _alarmNodes = null;
let _alarmTimer = null;

export function stopSystemAlarm() {
  if (_alarmTimer) clearTimeout(_alarmTimer);
  _alarmTimer = null;
  if (_alarmNodes) {
    for (const n of _alarmNodes) {
      try { n.stop?.(); n.disconnect?.(); } catch (e) {}
    }
    _alarmNodes = null;
  }
}

/** 系统警报 — PERFORM 结束触发 */
export function playSystemAlarm(ms = 3200) {
  if (isMuted()) return;
  stopSystemAlarm();
  try {
    const ctx = initMagicAudio();
    const t0 = ctx.currentTime + 0.02;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 820;
    lfo.type = "sine";
    lfo.frequency.value = 2.8;
    lfoG.gain.value = 280;
    lfo.connect(lfoG).connect(osc.frequency);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.04);
    g.gain.setValueAtTime(0.22, t0 + ms / 1000 - 0.2);
    g.gain.linearRampToValueAtTime(0.001, t0 + ms / 1000);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + ms / 1000 + 0.1);
    lfo.stop(t0 + ms / 1000 + 0.1);
    _alarmNodes = [osc, lfo, g, lfoG];

    const beep = ctx.createOscillator();
    const bG = ctx.createGain();
    beep.type = "sine";
    beep.frequency.value = 1200;
    bG.gain.setValueAtTime(0.15, t0);
    bG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    beep.connect(bG).connect(ctx.destination);
    beep.start(t0);
    beep.stop(t0 + 0.15);

    _alarmTimer = setTimeout(stopSystemAlarm, ms + 100);
  } catch (e) { /* audio unavailable */ }
}
