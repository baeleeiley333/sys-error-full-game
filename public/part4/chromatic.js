// chromatic.js — 从图像提取颜色 / extract colors from image data

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function toHex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, "0")).join("");
}

function distRgb(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function loadSource(source) {
  if (source instanceof HTMLCanvasElement) return source;
  const c = document.createElement("canvas");
  const w = source.naturalWidth || source.videoWidth || source.width;
  const h = source.naturalHeight || source.videoHeight || source.height;
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(source, 0, 0, w, h);
  return c;
}

/** 提取图像中的主要颜色(可返回全部不重复主色) */
export function extractColors(source, { max = 12, sampleStep = 3, minWeight = 0.01 } = {}) {
  const canvas = loadSource(source);
  const { width, height } = canvas;
  const { data } = canvas.getContext("2d").getImageData(0, 0, width, height);
  const buckets = new Map();

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 40) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r + g + b < 24) continue;
      const key = `${(r >> 4) * 4096 + (g >> 4) * 256 + (b >> 4)}`;
      const prev = buckets.get(key);
      if (prev) { prev[0] += r; prev[1] += g; prev[2] += b; prev[3]++; }
      else buckets.set(key, [r, g, b, 1]);
    }
  }

  let colors = [...buckets.values()].map(([r, g, b, n]) => {
    const rgb = [r / n | 0, g / n | 0, b / n | 0];
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    return { rgb, hsl, hex: toHex(rgb[0], rgb[1], rgb[2]), weight: n };
  }).sort((a, b) => b.weight - a.weight);

  const total = colors.reduce((s, c) => s + c.weight, 0) || 1;
  colors = colors.map(c => ({ ...c, weight: c.weight / total }));

  const merged = [];
  for (const c of colors) {
    const hit = merged.find(m => distRgb(m.rgb, c.rgb) < 42);
    if (hit) {
      const w = hit.weight + c.weight;
      hit.rgb = hit.rgb.map((v, i) => (v * hit.weight + c.rgb[i] * c.weight) / w | 0);
      hit.weight = w;
      hit.hex = toHex(hit.rgb[0], hit.rgb[1], hit.rgb[2]);
      hit.hsl = rgbToHsl(hit.rgb[0], hit.rgb[1], hit.rgb[2]);
    } else merged.push({ ...c });
  }

  merged.sort((a, b) => b.weight - a.weight);
  const minW = Math.max(minWeight, 1 / (max * 4));
  return merged.filter(c => c.weight >= minW).slice(0, max);
}

export function hueToFreq(h, base = 130) {
  return base * Math.pow(2, ((h % 360) / 360) * 1.6);
}
