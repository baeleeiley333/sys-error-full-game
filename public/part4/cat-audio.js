// cat-audio.js — 真实猫叫采样（运行时加载，无本地文件依赖）
const MEOW_URLS = [
  "https://upload.wikimedia.org/wikipedia/commons/d/d6/Cat_meow.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/7/72/Meow.ogg",
  "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749bf37.mp3?filename=cat-meow-6226.mp3",
];

let _buffers = [];
let _loadPromise = null;

export async function ensureCatMeows(ctx) {
  if (_buffers.length) return _buffers;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    const out = [];
    for (const url of MEOW_URLS) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const ab = await res.arrayBuffer();
        out.push(await ctx.decodeAudioData(ab.slice(0)));
      } catch (e) { /* skip failed URL */ }
    }
    _buffers = out;
    return out;
  })();

  return _loadPromise;
}

export function playCatMeow(ctx, dest, intensity = 1) {
  if (!ctx || !dest || !_buffers.length) return false;

  const buf = _buffers[Math.floor(Math.random() * _buffers.length)];
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 0.88 + Math.random() * 0.22;

  const g = ctx.createGain();
  const t = ctx.currentTime;
  const amp = 0.5 + intensity * 0.4;
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(amp, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t + Math.min(buf.duration / src.playbackRate.value, 1.4));

  src.connect(g).connect(dest);
  src.start(t);
  src.stop(t + 1.5);
  return true;
}

export function hasCatMeows() {
  return _buffers.length > 0;
}
