// expression-audio.js — 手势/表情 → 音乐控制量（平滑 + 几何融合）
import { dedosEstado } from "./engine.js";

const _smooth = { mouth: 0, peace: 0, fist: 0, openHand: 0, smile: 0 };
const SMOOTH = 0.32;
const SMOOTH_FAST = 0.48;

function bsMap(blendshapes) {
  const m = {};
  if (!blendshapes || !blendshapes.length) return m;
  const cats = blendshapes[0].categories || blendshapes[0];
  (cats || []).forEach(c => { m[c.categoryName || c.displayName] = c.score; });
  return m;
}

function avg(...vals) {
  const v = vals.filter(x => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function palmScale(lm) {
  return Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) + 1e-6;
}

/** 唇距 + 脸宽归一化 → 张嘴量 */
function mouthFromLandmarks(lms) {
  if (!lms?.[13] || !lms?.[14] || !lms?.[234] || !lms?.[454]) return null;
  const faceW = Math.hypot(lms[234].x - lms[454].x, lms[234].y - lms[454].y) + 1e-6;
  const lipOpen = Math.hypot(lms[13].x - lms[14].x, lms[13].y - lms[14].y) / faceW;
  const mouthWide = Math.hypot(lms[61].x - lms[291].x, lms[61].y - lms[291].y) / faceW;
  const openScore = clamp01((lipOpen - 0.045) / 0.2);
  const wideScore = clamp01((mouthWide - 0.32) / 0.18);
  return clamp01(openScore * 0.72 + wideScore * 0.28);
}

function mouthFromBlendshapes(m) {
  return clamp01(
    avg(m.jawOpen, m.mouthOpen, m.mouthLowerDownLeft, m.mouthLowerDownRight) * 1.15
    - avg(m.mouthClose, m.mouthPressLeft, m.mouthPressRight) * 0.35
  );
}

function peaceFromDed(ded, lm) {
  const [thumb, index, middle, ring, pinky] = ded;
  if (!(index && middle && !ring && !pinky)) return 0;
  const spread = Math.abs(lm[8].x - lm[12].x) / palmScale(lm);
  const vertical = (lm[8].y + lm[12].y) / 2 < lm[9].y ? 0.12 : 0;
  return clamp01(0.5 + spread * 1.05 + vertical + (thumb ? 0.08 : 0));
}

function fistFromDed(ded) {
  const curled = ded.slice(0, 5).filter(x => !x).length;
  return curled >= 4 ? 1 : curled / 4;
}

function openFromDed(ded) {
  const ext = ded.filter(Boolean).length;
  if (ext >= 5) return 1;
  if (ext === 4 && !ded[0]) return 0.78;
  return ext / 5;
}

function scanHands(hands, fn) {
  if (!hands?.length) return 0;
  let best = 0;
  for (const h of hands) {
    const ded = h.ded || dedosEstado(h.lm, h.izq);
    best = Math.max(best, fn(ded, h.lm, h));
  }
  return best;
}

function scanHandsMeta(hands) {
  const out = [];
  if (!hands?.length) return out;
  for (const h of hands) {
    const ded = h.ded || dedosEstado(h.lm, h.izq);
    const peace = peaceFromDed(ded, h.lm);
    const fist = fistFromDed(ded);
    const openHand = openFromDed(ded);
    let mode = null;
    let strength = 0;
    if (peace >= 0.4 && peace >= fist && peace >= openHand) { mode = "peace"; strength = peace; }
    else if (fist >= 0.45 && fist >= openHand) { mode = "fist"; strength = fist; }
    else if (openHand >= 0.55) { mode = "openHand"; strength = openHand; }
    if (mode) out.push({ mode, strength, lm: h.lm, izq: h.izq });
  }
  return out;
}

function smoothKey(key, raw, alpha) {
  _smooth[key] = (_smooth[key] ?? raw) * (1 - alpha) + raw * alpha;
  return _smooth[key];
}

export function resetExpressionSmoothing() {
  _smooth.mouth = _smooth.peace = _smooth.fist = _smooth.openHand = _smooth.smile = 0;
}

/** 读取当前帧控制量 (0~1)，带时序平滑 */
export function readExpression({ pose, hands, faceBlendshapes, faceLandmarks, fast = false }) {
  const m = bsMap(faceBlendshapes);
  const bsMouth = mouthFromBlendshapes(m);
  const geoMouth = mouthFromLandmarks(faceLandmarks);
  const mouthRaw = geoMouth != null ? bsMouth * 0.45 + geoMouth * 0.55 : bsMouth;

  const peaceRaw = scanHands(hands, (ded, lm) => peaceFromDed(ded, lm));
  const fistRaw = scanHands(hands, (ded) => fistFromDed(ded));
  const openRaw = scanHands(hands, (ded) => openFromDed(ded));
  const handTags = scanHandsMeta(hands);
  const smileRaw = clamp01(
    avg(m.mouthSmileLeft, m.mouthSmileRight, m.cheekSquintLeft, m.cheekSquintRight) * 1.1
  );

  const alpha = fast ? SMOOTH_FAST : SMOOTH;
  const mouth = smoothKey("mouth", mouthRaw, alpha);
  const peace = smoothKey("peace", peaceRaw, alpha);
  const fist = smoothKey("fist", fistRaw, alpha);
  const openHand = smoothKey("openHand", openRaw, alpha);
  const smile = smoothKey("smile", smileRaw, alpha);

  let dominant = null;
  let domStrength = 0;
  for (const t of handTags) {
    if (t.strength > domStrength) { dominant = t.mode; domStrength = t.strength; }
  }
  if (!dominant && smile > 0.38) { dominant = "smile"; domStrength = smile; }
  else if (!dominant && mouth > 0.25) { dominant = "mouth"; domStrength = mouth; }

  return {
    mouth,
    peace,
    fist,
    openHand,
    smile,
    handTags,
    dominant,
    domStrength,
    faceDetected: !!faceLandmarks,
  };
}

export const CONTROL_LEGEND = [
  { key: "peace", icon: "✌", label: "SCISSORS", effect: "REVERB" },
  { key: "fist", icon: "✊", label: "FIST", effect: "MEOW" },
  { key: "mouth", icon: "👄", label: "MOUTH", effect: "VOLUME" },
  { key: "openHand", icon: "🖐", label: "OPEN HAND", effect: "COWBELL" },
  { key: "smile", icon: "😊", label: "SMILE", effect: "SPEED" },
];

export const CONTROL_THRESH = {
  peace: 0.4,
  fist: 0.45,
  openHand: 0.55,
  mouth: 0.22,
  smile: 0.35,
};

export function isControlActive(key, expr) {
  const v = expr?.[key] ?? 0;
  return v > (CONTROL_THRESH[key] ?? 0.4);
}
