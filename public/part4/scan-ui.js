// scan-ui.js — WMP overlay preview + on-image scan layout (4s)
import { extractColors } from "./chromatic.js";
import { mergePhotoWithMeme } from "./sequence-runtime.js";

const SCAN_LOGS = [
  "SCANNING_BIOLOGICAL_SIGNATURES",
  "SCANNING_BIOLOGICAL_SIGNATURES",
  "SCANNING_BIOLOGICAL_SIGNATURES",
  "SCANNING_BIOLOGICAL_SIGNATURES",
  "MAPPING_TEXTURE_TO_OSC_1",
];

const BOXES = [
  { l: "CREATURE_LOCK", s: "0.29", x: 8, y: 12, w: 28, h: 22 },
  { l: "CREATURE_LOCK", s: "0.19", x: 55, y: 35, w: 22, h: 18 },
  { l: "CREATURE_LOCK", s: "0.02", x: 72, y: 8, w: 18, h: 14 },
  { l: "SHAPE_DETECT", s: "0.92", x: 30, y: 58, w: 35, h: 28 },
];

export function bindScanEls(desktopEl) {
  const canvas = document.getElementById("scanPreviewCanvas");
  return {
    desktop: desktopEl,
    previewCanvas: canvas,
    previewCtx: canvas?.getContext("2d"),
    boxes: document.getElementById("scanBoxes"),
    chromatic: document.getElementById("scanChromatic"),
    logs: document.getElementById("scanLogs"),
    scanLine: document.getElementById("scanLine"),
    diag: document.getElementById("scanDiag"),
    btnInitiate: document.getElementById("btnInitiate"),
  };
}

export async function showPhotoPreview(els, photoDataUrl, gesture) {
  els.desktop.classList.add("scan-active", "scan-preview");
  els.desktop.classList.remove("scan-running");
  els.logs.innerHTML = "";
  els.chromatic.innerHTML = "";
  els.boxes.innerHTML = "";
  els.diag.textContent = "";
  els.diag.classList.remove("active");
  els.btnInitiate?.classList.add("auto-pending");
  if (els.scanLine) els.scanLine.style.top = "0%";

  if (els.previewCanvas && els.previewCtx) {
    await drawOverlayPreview(els.previewCanvas, els.previewCtx, photoDataUrl, gesture);
    cachePreviewBase(els);
  }
  els._photo = photoDataUrl;
  els._gesture = gesture;
}

async function drawOverlayPreview(canvas, ctx, photoDataUrl, gesture) {
  const w = 640, h = 480;
  const merged = await mergePhotoWithMeme(photoDataUrl, gesture, w, h);
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(merged, 0, 0);
}

function cachePreviewBase(els) {
  if (!els.previewCanvas) return;
  const c = document.createElement("canvas");
  c.width = els.previewCanvas.width;
  c.height = els.previewCanvas.height;
  c.getContext("2d").drawImage(els.previewCanvas, 0, 0);
  els._baseCanvas = c;
}

function applyScanVisual(els, t) {
  if (!els.previewCtx || !els._baseCanvas) return;
  const ctx = els.previewCtx;
  const w = els.previewCanvas.width, h = els.previewCanvas.height;
  const scanY = t * h;

  ctx.drawImage(els._baseCanvas, 0, 0);

  // grid on canvas during scan
  ctx.strokeStyle = "rgba(53,195,255,0.1)";
  ctx.lineWidth = 1;
  const step = 28;
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }

  // darken unscanned region
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, scanY, w, h - scanY);

  // rescanned area stays bright
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, scanY);
  ctx.clip();
  ctx.drawImage(els._baseCanvas, 0, 0);
  ctx.restore();

  // scan band glow
  const band = 20;
  const g = ctx.createLinearGradient(0, scanY - band, 0, scanY + band);
  g.addColorStop(0, "rgba(53,195,255,0)");
  g.addColorStop(0.45, "rgba(53,195,255,0.5)");
  g.addColorStop(0.5, "rgba(255,255,255,0.92)");
  g.addColorStop(0.55, "rgba(53,195,255,0.5)");
  g.addColorStop(1, "rgba(53,195,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, scanY - band, w, band * 2);

  ctx.strokeStyle = "#35c3ff";
  ctx.shadowColor = "#35c3ff";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, scanY);
  ctx.lineTo(w, scanY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function enterScanLayout(els) {
  els.desktop.classList.remove("scan-preview");
  els.desktop.classList.add("scan-running");
  els.btnInitiate?.classList.remove("auto-pending");
  els.diag.textContent = "RUNNING DIAGNOSTICS…";
  els.diag.classList.add("active");
  els.logs.innerHTML = "";
  els.chromatic.innerHTML = "";
  applyScanVisual(els, 0);
  els.boxes.innerHTML = BOXES.map(b =>
    `<div class="sbox" style="left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%">
      <span class="sl">${b.l} [${b.s}]</span></div>`
  ).join("");
}

export function autoAdvancePreview(els, ms = 1400) {
  return new Promise(resolve => {
    const done = () => {
      clearTimeout(timer);
      els.btnInitiate?.removeEventListener("click", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    els.btnInitiate?.addEventListener("click", done);
  });
}

export async function runScanAnalysis(photoDataUrl, els, {
  duration = 4000,
  onProgress,
  onSwatch,
  onLog,
} = {}) {
  const img = await loadImg(photoDataUrl);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || 640;
  c.height = img.naturalHeight || 480;
  c.getContext("2d").drawImage(img, 0, 0);
  const colors = extractColors(c, { max: 6 });

  const start = performance.now();
  let lastLog = -1, lastSw = -1;

  return new Promise(resolve => {
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const li = Math.min(SCAN_LOGS.length - 1, Math.floor(t * SCAN_LOGS.length));
      if (li !== lastLog) {
        lastLog = li;
        const line = `> ${SCAN_LOGS[li]}`;
        onLog && onLog(line);
        if (els.logs) {
          const d = document.createElement("div");
          d.className = "logline";
          d.textContent = line;
          els.logs.appendChild(d);
          while (els.logs.children.length > 5) els.logs.removeChild(els.logs.firstChild);
        }
      }
      const swN = Math.floor(t * colors.length);
      if (swN > lastSw) {
        for (let i = lastSw + 1; i <= swN && i < colors.length; i++) {
          onSwatch && onSwatch(colors[i], i);
          if (els.chromatic) {
            const row = document.createElement("div");
            row.className = "crow";
            row.innerHTML = `<i style="background:${colors[i].hex}"></i><code>${colors[i].hex}</code>`;
            els.chromatic.appendChild(row);
          }
        }
        lastSw = swN;
      }
      if (els.scanLine) els.scanLine.style.top = (t * 100) + "%";
      applyScanVisual(els, t);
      onProgress && onProgress(t);
      if (t < 1) requestAnimationFrame(tick);
      else {
        applyScanVisual(els, 1);
        colors.forEach((c, i) => onSwatch && onSwatch(c, i));
        resolve(colors);
      }
    }
    requestAnimationFrame(tick);
  });
}

export function hideScanStage(els) {
  els.desktop.classList.remove("scan-active", "scan-preview", "scan-running");
  els.btnInitiate?.classList.remove("auto-pending");
  els.diag.classList.remove("active");
  els.diag.textContent = "";
  if (els.previewCtx && els.previewCanvas) {
    els.previewCtx.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
  }
  els._baseCanvas = null;
  els._photo = null;
  els._gesture = null;
}

function loadImg(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
