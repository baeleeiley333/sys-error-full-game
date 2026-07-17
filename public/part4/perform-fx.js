// perform-fx.js — 右侧合照特效（严格参考风格板 · 随音乐手势切换）
import { CONTROL_THRESH } from "./expression-audio.js";

const PAL = {
  white: "#ffffff",
  black: "#000000",
  warmGrey: "#b5aea6",
  taupe: "#9a928a",
  peach: "#e8a898",
  pink: "#d4788a",
  magenta: "#c86088",
  beige: "#dcc8b8",
  sand: "#c4b0a0",
};

function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class PerformFx {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.w = canvas.width;
    this.h = canvas.height;
    this.src = document.createElement("canvas");
    this.src.width = this.w;
    this.src.height = this.h;
    this.work = document.createElement("canvas");
    this.work.width = 320;
    this.work.height = 240;
    this._running = false;
    this._raf = null;
    this.t = 0;
    this.mode = "idle";
    this.strength = 0;
    this.expr = {};
    this.seed = 0;
    this.bpm = 128;
    this._rngState = 1;
    this._srcSmall = null;
  }

  setSource(img) {
    const sctx = this.src.getContext("2d");
    sctx.clearRect(0, 0, this.w, this.h);
    sctx.drawImage(img, 0, 0, this.w, this.h);
    const wctx = this.work.getContext("2d");
    wctx.clearRect(0, 0, this.work.width, this.work.height);
    wctx.drawImage(this.src, 0, 0, this.work.width, this.work.height);
    this._srcSmall = wctx.getImageData(0, 0, this.work.width, this.work.height);
  }

  setGestureSeed(label = "") {
    this.seed = hashSeed(label) / 4294967296;
    this._rngState = hashSeed(label + "fx") || 1;
  }

  setMusicState({ bpm } = {}) {
    if (bpm) this.bpm = bpm;
  }

  setControl(expr = {}) {
    this.expr = expr;
    this.strength = expr.domStrength ?? 0;
    const dom = expr.dominant;
    let next = "idle";
    if (dom && (expr[dom] ?? 0) > (CONTROL_THRESH[dom] ?? 0.4)) next = dom;
    else if ((expr.smile ?? 0) > CONTROL_THRESH.smile) next = "smile";
    else if ((expr.mouth ?? 0) > CONTROL_THRESH.mouth) next = "mouth";
    if (next !== this.mode) this.mode = next;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.t = 0;
    this._loop();
  }

  stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _loop() {
    if (!this._running) return;
    this.t += 0.016;
    switch (this.mode) {
      case "peace": this._fxReverb(); break;
      case "fist": this._fxMeow(); break;
      case "mouth": this._fxVolume(); break;
      case "openHand": this._fxCowbell(); break;
      case "smile": this._fxSmile(); break;
      default: this._fxIdle(); break;
    }
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _rng() {
    this._rngState ^= this._rngState << 13;
    this._rngState ^= this._rngState >>> 17;
    this._rngState ^= this._rngState << 5;
    return (this._rngState >>> 0) / 4294967296;
  }

  /** ref·8 — 暖灰朦胧 + 竖排文字 + 胶片颗粒 */
  _fxIdle() {
    const ctx = this.ctx;
    const beat = (this.t * this.bpm / 60) * Math.PI * 2;
    const blur = 14 + Math.sin(beat) * 3;

    ctx.fillStyle = PAL.warmGrey;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.filter = `blur(${blur}px) saturate(0.75) brightness(1.08) contrast(0.92)`;
    ctx.drawImage(this.src, 0, 0, this.w, this.h);
    ctx.restore();
    ctx.filter = "none";

    this._filmGrain(0.14, PAL.taupe);
    this._verticalTextColumns(["reverb", "volume", "meow", "speed"], 0.22);
  }

  /** ref·2 — 纯黑底 + 磨砂玻璃网格 + 冷白肤 + 粉腮红 + 黑色眼洞 */
  _fxReverb() {
    const ctx = this.ctx;
    const str = 0.35 + this.strength * 0.65;
    const cols = 10 + Math.floor(str * 4);
    const rows = 12 + Math.floor(str * 3);
    const cw = this.w / cols;
    const rh = this.h / rows;
    const t = this.t * (0.6 + str * 0.8);

    ctx.fillStyle = PAL.black;
    ctx.fillRect(0, 0, this.w, this.h);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wave = Math.sin(t + col * 0.55 + row * 0.35) * (3 + str * 5);
        const sx = col * cw + wave;
        const sy = row * rh + Math.cos(t * 1.1 + row * 0.4) * (2 + str * 3);
        ctx.save();
        ctx.beginPath();
        ctx.rect(col * cw, row * rh, cw + 1, rh + 1);
        ctx.clip();
        ctx.filter = "grayscale(1) brightness(1.55) contrast(1.15)";
        ctx.drawImage(this.src, -sx, -sy, this.w, this.h);
        ctx.restore();
      }
    }

    ctx.filter = "none";
    const blush = ctx.createRadialGradient(this.w * 0.38, this.h * 0.48, 4, this.w * 0.38, this.h * 0.48, this.w * 0.14);
    blush.addColorStop(0, `rgba(200,96,136,${0.28 + str * 0.22})`);
    blush.addColorStop(1, "rgba(200,96,136,0)");
    ctx.fillStyle = blush;
    ctx.fillRect(0, 0, this.w, this.h);
    const blushR = ctx.createRadialGradient(this.w * 0.62, this.h * 0.48, 4, this.w * 0.62, this.h * 0.48, this.w * 0.14);
    blushR.addColorStop(0, `rgba(200,96,136,${0.28 + str * 0.22})`);
    blushR.addColorStop(1, "rgba(200,96,136,0)");
    ctx.fillStyle = blushR;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.fillStyle = PAL.black;
    const er = this.w * 0.045;
    ctx.beginPath();
    ctx.arc(this.w * 0.4, this.h * 0.4, er, 0, Math.PI * 2);
    ctx.arc(this.w * 0.6, this.h * 0.4, er, 0, Math.PI * 2);
    ctx.fill();

    this._filmGrain(0.18, "#888");
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "300 11px Helvetica,Arial,sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`NO- ${140 + Math.floor(this.t * 2) % 60}`, this.w - 14, 22);
    ctx.fillText("20 26", this.w - 14, 38);
  }

  /** ref·1 — 白底高键 + 横向梳状 glitch 拉伸 + 沙粒颗粒 + 底部雾化 */
  _fxMeow() {
    const ctx = this.ctx;
    const str = 0.4 + this.strength * 0.6;
    const strips = 48 + Math.floor(str * 40);
    const sh = this.h / strips;
    const t = this.t * (2.5 + str * 4);

    ctx.fillStyle = PAL.white;
    ctx.fillRect(0, 0, this.w, this.h);

    for (let i = 0; i < strips; i++) {
      const sy = i * sh;
      const comb = Math.sin(t + i * 0.85 + this.seed * 20) * (4 + str * 28);
      const stretch = 1 + Math.abs(Math.sin(t * 0.7 + i * 0.2)) * str * 0.08;
      ctx.save();
      ctx.filter = "brightness(1.35) saturate(0.55) contrast(0.95)";
      ctx.drawImage(this.src, 0, sy, this.w, sh + 1, comb, sy, this.w * stretch, sh + 1);
      ctx.restore();
    }
    ctx.filter = "none";

    this._sandGrain(0.2 + str * 0.15);
    const fog = ctx.createLinearGradient(0, this.h * 0.62, 0, this.h);
    fog.addColorStop(0, "rgba(255,255,255,0)");
    fog.addColorStop(0.45, "rgba(255,255,255,0.55)");
    fog.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  /** ref·7 — 白底证件照 + 面部像素马赛克 + 高对比黑上衣 */
  _fxVolume() {
    const ctx = this.ctx;
    const m = this.expr.mouth ?? this.strength;
    const blocks = Math.max(8, Math.round(16 - m * 6));
    const fx = this.w * 0.34;
    const fy = this.h * 0.22;
    const fw = this.w * 0.32;
    const fh = this.h * 0.38;
    const pulse = 1 + Math.sin(this.t * (5 + m * 10)) * m * 0.025;

    ctx.fillStyle = PAL.white;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.filter = `brightness(${1.05 + m * 0.2}) contrast(${1.08 + m * 0.12})`;
    ctx.drawImage(this.src, 0, 0, this.w, this.h);
    ctx.restore();
    ctx.filter = "none";

    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();
    const bw = fw / blocks;
    const bh = fh / blocks;
    for (let row = 0; row < blocks; row++) {
      for (let col = 0; col < blocks; col++) {
        const px = fx + col * bw;
        const py = fy + row * bh;
        const sx = (fx + col * bw + bw / 2) * pulse;
        const sy = (fy + row * bh + bh / 2) * pulse;
        ctx.drawImage(this.src, sx - bw / 2, sy - bh / 2, bw, bh, px, py, bw + 0.5, bh + 0.5);
      }
    }
    ctx.restore();

    ctx.fillStyle = `rgba(0,0,0,${0.12 + m * 0.18})`;
    ctx.fillRect(0, this.h * 0.58, this.w, this.h * 0.42);
  }

  /** ref·4+5 — 黑白点阵 + 横条位移 glitch + 散落黑方块 + 底部块状损坏 */
  _fxCowbell() {
    const ctx = this.ctx;
    const str = 0.35 + this.strength * 0.65;
    const wd = this.work.width;
    const hd = this.work.height;
    const data = this._srcSmall;
    if (!data) return;

    ctx.fillStyle = PAL.white;
    ctx.fillRect(0, 0, this.w, this.h);

    const offCtx = this.work.getContext("2d");
    const img = offCtx.createImageData(wd, hd);
    const out = img.data;
    const step = 3;
    const t = this.t * (3 + str * 5);
    const rowShift = new Array(hd).fill(0);
    for (let y = 0; y < hd; y++) {
      rowShift[y] = Math.floor(Math.sin(t + y * 0.35) * (2 + str * 8));
    }

    for (let y = 0; y < hd; y++) {
      for (let x = 0; x < wd; x++) {
        const sx = Math.max(0, Math.min(wd - 1, x + rowShift[y]));
        const si = (y * wd + sx) * 4;
        const lum = data.data[si] * 0.299 + data.data[si + 1] * 0.587 + data.data[si + 2] * 0.114;
        const draw = lum < 128 + (this._rng() - 0.5) * 40 * str;
        const oi = (y * wd + x) * 4;
        const v = draw ? 0 : 255;
        out[oi] = out[oi + 1] = out[oi + 2] = v;
        out[oi + 3] = 255;
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.work, 0, 0, this.w, this.h);
    ctx.imageSmoothingEnabled = true;

    const beat = Math.sin((this.t * this.bpm / 60) * Math.PI * 2);
    const nSq = 18 + Math.floor(str * 30);
    ctx.fillStyle = PAL.black;
    for (let i = 0; i < nSq; i++) {
      const sz = 2 + Math.floor(this._rng() * 5);
      const px = this._rng() * this.w;
      const py = this._rng() * this.h * 0.85;
      if (Math.sin(t + i) > 0.2 - beat * 0.3) ctx.fillRect(px, py, sz, sz);
    }

    const bot = this.h * 0.78;
    for (let y = bot; y < this.h; y += 10) {
      for (let x = 0; x < this.w; x += 10) {
        if (((x / 10 | 0) + (y / 10 | 0) + Math.floor(t)) % 3 === 0) {
          ctx.fillStyle = PAL.black;
          ctx.fillRect(x, y, 10, 10);
        } else if (((x / 10 | 0) + (y / 10 | 0)) % 5 === 0) {
          ctx.fillStyle = PAL.white;
          ctx.fillRect(x, y, 10, 10);
        }
      }
    }
  }

  /** ref·6 — 白底 + 暖桃粉橙点彩 + 柔焦 + 边缘羽化 */
  _fxSmile() {
    const ctx = this.ctx;
    const s = this.expr.smile ?? this.strength;
    const wd = this.work.width;
    const hd = this.work.height;
    const data = this._srcSmall;
    if (!data) return;
    const speed = 1 + s * 2.5;
    const t = this.t * speed;

    ctx.fillStyle = PAL.white;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.filter = "blur(3px) saturate(1.35) sepia(0.35) brightness(1.12)";
    ctx.drawImage(this.src, 0, 0, this.w, this.h);
    ctx.restore();

    const offCtx = this.work.getContext("2d");
    const img = offCtx.createImageData(wd, hd);
    const out = img.data;
    const gap = 4 - Math.floor(s * 1.5);
    const shift = Math.sin(t) * 2;

    for (let y = 0; y < hd; y += gap) {
      for (let x = 0; x < wd; x += gap) {
        const sx = Math.max(0, Math.min(wd - 1, x + Math.floor(shift)));
        const si = (y * wd + sx) * 4;
        const r = data.data[si];
        const g = data.data[si + 1];
        const b = data.data[si + 2];
        const lum = 1 - (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        if (lum < 0.08) continue;
        const pr = Math.min(255, r * 1.15 + 60);
        const pg = Math.min(255, g * 0.82 + 20);
        const pb = Math.min(255, b * 0.65 + 10);
        const dotR = 1.2 + lum * 1.8;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx * dx + dy * dy > dotR * dotR) continue;
            const px = x + dx;
            const py = y + dy;
            if (px < 0 || py < 0 || px >= wd || py >= hd) continue;
            const oi = (py * wd + px) * 4;
            out[oi] = pr;
            out[oi + 1] = pg;
            out[oi + 2] = pb;
            out[oi + 3] = 255;
          }
        }
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.drawImage(this.work, 0, 0, this.w, this.h);

    const edge = ctx.createRadialGradient(this.w / 2, this.h / 2, this.w * 0.2, this.w / 2, this.h / 2, this.w * 0.72);
    edge.addColorStop(0, "rgba(255,255,255,0)");
    edge.addColorStop(1, "rgba(255,255,255,0.85)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, this.w, this.h);
    this._sandGrain(0.08 + s * 0.06);
  }

  _filmGrain(amount, tint = "#888") {
    const ctx = this.ctx;
    const n = Math.floor(this.w * this.h * amount * 0.012);
    for (let i = 0; i < n; i++) {
      const a = 0.05 + this._rng() * 0.2;
      ctx.fillStyle = `rgba(${tint === "#888" ? "140,140,140" : "90,85,80"},${a})`;
      ctx.fillRect(this._rng() * this.w, this._rng() * this.h, 1, 1);
    }
  }

  _sandGrain(amount) {
    const ctx = this.ctx;
    const n = Math.floor(this.w * this.h * amount * 0.01);
    for (let i = 0; i < n; i++) {
      const a = 0.04 + this._rng() * 0.18;
      const warm = this._rng() > 0.5;
      ctx.fillStyle = warm ? `rgba(200,170,150,${a})` : `rgba(80,70,65,${a})`;
      ctx.fillRect(this._rng() * this.w, this._rng() * this.h, 1 + this._rng() * 2, 1);
    }
  }

  _verticalTextColumns(words, alpha) {
    const ctx = this.ctx;
    const cols = words.length;
    const colW = this.w / (cols + 1);
    ctx.font = "300 13px Helvetica,Arial,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    words.forEach((word, ci) => {
      const cx = colW * (ci + 1);
      const letters = word.split("");
      const startY = this.h * 0.18;
      letters.forEach((ch, li) => {
        ctx.save();
        ctx.translate(cx, startY + li * 16);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
    });
  }
}
