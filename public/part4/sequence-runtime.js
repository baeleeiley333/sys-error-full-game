// sequence-runtime.js — 摄像头 + 手势 + 表情检测
import { FilesetResolver, PoseLandmarker, HandLandmarker, FaceLandmarker }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
import { LS_KEY, features, clasificar, dedosEstado } from "./engine.js";
import { readExpression } from "./expression-audio.js";

async function loadModels(vision, delegate) {
  const pose = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", delegate },
    runningMode: "VIDEO", numPoses: 1,
    minPoseDetectionConfidence: 0.55,
    minPosePresenceConfidence: 0.55,
    minTrackingConfidence: 0.65,
  });
  const hand = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate },
    runningMode: "VIDEO", numHands: 2,
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.55,
    minTrackingConfidence: 0.65,
  });
  const face = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate },
    runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true,
    minFaceDetectionConfidence: 0.45,
    minFacePresenceConfidence: 0.45,
    minTrackingConfidence: 0.68,
  });
  return { pose, hand, face };
}

export async function createSequenceRuntime(canvas, {
  onGesture, onExpression, onStatus, onFrame, onFace, recognize = true,
  showSkeleton = true, faceTrack = false, trainerMode = false,
} = {}) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const MINVOTOS = 12, BUFMAX = 16;
  let minVotos = MINVOTOS, bufMax = BUFMAX;
  const POSE_CONN = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [0, 11], [0, 12]];
  const HAND_CONN = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]];

  let custom = {};
  try { custom = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) {}

  onStatus && onStatus("LOADING VISION MODELS…");
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  let models;
  try { models = await loadModels(vision, "GPU"); }
  catch (e) { models = await loadModels(vision, "CPU"); }
  const { pose, hand, face } = models;

  const video = document.createElement("video");
  video.autoplay = true; video.playsInline = true;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API unavailable — use http://localhost not file://");
  }
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    });
  } catch (e) {
    throw new Error("Camera blocked — allow webcam permission and reload");
  }
  await video.play();
  onStatus && onStatus("RED ZONE — POSE & GESTURE TRACKING");

  let _pl = null, _manos = [], _blend = null, _faceLm = null, ultimo = 0;
  let buf = [], imgActual = null;
  let seqLocked = false;
  let _biometricMode = false;
  let _faceTrack = faceTrack;
  let _trainerMode = trainerMode;
  let _showSkeleton = showSkeleton;
  let _performMode = false;

  function todasMuestras() {
    return Object.entries(custom).flatMap(([lab, d]) => d.samples.map(v => [lab, v]));
  }

  function gesturePayload(label) {
    if (!label || !custom[label]) return null;
    const d = custom[label];
    return { label, name: d.name, img: d.img };
  }

  function detectar(ts) {
    const pr = pose.detectForVideo(video, ts);
    const hr = hand.detectForVideo(video, ts);
    const fr = face.detectForVideo(video, ts);
    _pl = (pr.landmarks && pr.landmarks[0]) || null;
    _manos = [];
    if (hr.landmarks) {
      for (let i = 0; i < hr.landmarks.length; i++) {
        const lm = hr.landmarks[i];
        const izq = hr.handednesses[i][0].categoryName === "Left";
        const ded = dedosEstado(lm, izq);
        const palma = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) + 1e-6;
        const pinch = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / palma;
        _manos.push({ ded, izq, pinch, lm });
      }
    }
    _blend = fr.faceBlendshapes || null;
    _faceLm = (fr.faceLandmarks && fr.faceLandmarks[0]) || null;
  }

  const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  const RIGHT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 466, 388, 387, 386, 385, 384, 398];
  const LEFT_BROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
  const RIGHT_BROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
  const NOSE = [168, 6, 197, 195, 5, 4, 19, 94, 2];
  const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
  const BIO = "#48b8ff";

  function lx(p) { return p.x * W; }
  function ly(p) { return p.y * H; }

  function strokeLoop(indices, lms, close = true) {
    ctx.beginPath();
    indices.forEach((idx, i) => {
      const p = lms[idx];
      if (!p) return;
      const x = lx(p), y = ly(p);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    if (close) ctx.closePath();
    ctx.stroke();
  }

  const MESH_CONN = [
    [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389], [389, 356], [356, 454],
    [454, 323], [323, 361], [361, 288], [288, 397], [397, 365], [365, 379], [379, 378], [378, 400],
    [400, 377], [377, 152], [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172],
    [172, 58], [58, 132], [132, 93], [93, 234], [234, 127], [127, 162], [162, 21], [21, 54], [54, 103],
    [103, 67], [67, 109], [109, 10], [33, 133], [133, 173], [173, 157], [157, 158], [158, 159], [159, 160],
    [160, 161], [161, 246], [246, 33], [263, 362], [362, 466], [466, 388], [388, 387], [387, 386], [386, 385],
    [385, 384], [384, 398], [398, 263], [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314],
    [314, 405], [405, 321], [321, 375], [375, 291], [291, 308], [308, 324], [324, 318], [318, 402],
    [402, 317], [317, 14], [14, 87], [87, 178], [178, 88], [88, 95], [95, 61], [1, 4], [4, 5], [5, 6],
    [6, 168], [168, 8], [8, 9], [9, 10], [151, 337], [337, 299], [299, 333], [333, 298], [298, 301],
    [70, 63], [63, 105], [105, 66], [66, 107], [107, 55], [55, 65], [65, 52], [52, 53], [53, 46],
    [234, 93], [93, 132], [132, 58], [58, 172], [356, 389], [389, 251], [251, 284], [284, 332],
    [127, 234], [162, 127], [21, 162], [54, 21], [103, 54], [67, 103], [109, 67], [10, 109],
    [151, 9], [9, 8], [8, 168], [168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1],
    [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133],
    [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381], [381, 382], [382, 362],
  ];

  function drawFaceMeshBlue(lms) {
    ctx.strokeStyle = BIO;
    ctx.lineWidth = 1.2;
    ctx.fillStyle = "rgba(72,184,255,0.07)";
    strokeLoop(FACE_OVAL, lms);
    ctx.fill();
    strokeLoop(LEFT_BROW, lms, false);
    strokeLoop(RIGHT_BROW, lms, false);
    strokeLoop(LEFT_EYE, lms);
    strokeLoop(RIGHT_EYE, lms);
    strokeLoop(NOSE, lms, false);
    strokeLoop(LIPS, lms, false);

    ctx.beginPath();
    for (const [a, b] of MESH_CONN) {
      if (!lms[a] || !lms[b]) continue;
      ctx.moveTo(lx(lms[a]), ly(lms[a]));
      ctx.lineTo(lx(lms[b]), ly(lms[b]));
    }
    ctx.stroke();

    ctx.fillStyle = BIO;
    ctx.shadowColor = BIO;
    ctx.shadowBlur = 8;
    for (let i = 0; i < lms.length; i += 3) {
      const p = lms[i];
      if (!p) continue;
      drawStar(lx(p), ly(p), 3, BIO);
    }
    ctx.shadowBlur = 0;
  }

  function drawHandMeshBlue(lm, accent = BIO) {
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = accent;
    ctx.shadowBlur = accent === BIO ? 8 : 14;
    for (const [a, b] of HAND_CONN) {
      if (!lm[a] || !lm[b]) continue;
      ctx.beginPath();
      ctx.moveTo(lx(lm[a]), ly(lm[a]));
      ctx.lineTo(lx(lm[b]), ly(lm[b]));
      ctx.stroke();
    }
    for (let i = 0; i < lm.length; i += 2) {
      const p = lm[i];
      if (!p) continue;
      drawStar(lx(p), ly(p), 3.5, accent);
    }
    ctx.shadowBlur = 0;
  }
  function drawFaceTracking(lms) {
    drawFaceMeshBlue(lms);
  }

  function drawStar(cx, cy, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const fn = i ? ctx.lineTo.bind(ctx) : ctx.moveTo.bind(ctx);
      fn(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  function dibujar(conns, lms, col, useStars = false, pointStep = 1) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.fillStyle = col;
    for (const [a, b] of conns) {
      if (lms[a] && lms[b]) {
        ctx.beginPath();
        ctx.moveTo(lms[a].x * W, lms[a].y * H);
        ctx.lineTo(lms[b].x * W, lms[b].y * H);
        ctx.stroke();
      }
    }
    for (let i = 0; i < lms.length; i += pointStep) {
      const p = lms[i];
      if (!p) continue;
      const x = p.x * W, y = p.y * H;
      if (useStars) drawStar(x, y, 3, col);
      else { ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); }
    }
  }

  function loop() {
    const ts = performance.now();
    const detectInterval = _biometricMode ? 16 : 30;
    if (ts - ultimo > detectInterval) { ultimo = ts; detectar(ts); }

    ctx.save();
    if (_biometricMode) ctx.filter = "grayscale(100%) contrast(1.08)";
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();
    ctx.filter = "none";

    const expr = readExpression({
      pose: _pl,
      hands: _manos,
      faceBlendshapes: _blend,
      faceLandmarks: _faceLm,
      fast: _biometricMode,
    });

    if (_biometricMode) {
      if (_faceLm) drawFaceMeshBlue(_faceLm);
      _manos.forEach(m => {
        const tag = (expr.handTags || []).find(t => t.lm === m.lm);
        const accent = tag?.mode === "peace" ? "#6ef0ff"
          : tag?.mode === "fist" ? "#ffb347"
          : tag?.mode === "openHand" ? "#ffe566" : BIO;
        drawHandMeshBlue(m.lm, accent);
      });
      if (_pl) dibujar(POSE_CONN, _pl, "rgba(72,184,255,0.35)", true, 3);
    } else if (_trainerMode) {
      ctx.fillStyle = "rgba(140,0,0,0.18)";
      ctx.fillRect(0, 0, W, H);
    } else if (_faceTrack) {
      ctx.fillStyle = "rgba(160,0,0,0.22)";
      ctx.fillRect(0, 0, W, H);
      if (_faceLm) drawFaceTracking(_faceLm);
    }

    if (_showSkeleton && !_biometricMode && !_performMode && (_trainerMode || !_faceTrack)) {
      const poseCol = _trainerMode ? "#89CFF0" : "#35c3ff";
      const handCol = _trainerMode ? "#7EC8E3" : "#ff5fd1";
      const stars = _trainerMode;
      if (_pl) dibujar(POSE_CONN, _pl, poseCol, stars);
      _manos.forEach(m => dibujar(HAND_CONN, m.lm, handCol, stars));
    }

    onExpression && onExpression(expr);
    onFace && onFace(!!_faceLm);
    onFrame && onFrame({ pose: _pl, hands: _manos, expr, face: _faceLm });

    if (recognize && !seqLocked) {
      const key = clasificar(features(_pl, _manos), todasMuestras());
      buf.push(key);
      if (buf.length > bufMax) buf.shift();
      const c = {};
      buf.forEach(x => c[x] = (c[x] || 0) + 1);
      const neutralVotos = (c.neutral || 0) + (c.null || 0);
      const acc = Object.entries(c).filter(([k]) => k !== "neutral" && k !== "null").sort((a, b) => b[1] - a[1])[0];
      let next = imgActual;
      if (acc && acc[1] >= minVotos && acc[1] >= neutralVotos * 2) next = acc[0];
      else if (neutralVotos >= Math.max(3, Math.floor(bufMax / 3))) next = null;
      if (next !== imgActual) {
        imgActual = next;
        onGesture && onGesture(gesturePayload(imgActual));
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    lockRecognition(v) { seqLocked = v; },
    setBiometricMode(on) {
      _biometricMode = !!on;
      if (on) onStatus && onStatus("BIOMETRIC_SYS — multimodal tracking (HD)");
    },
    setPerformMode(on) {
      _performMode = !!on;
    },
    setResponsive(fast) {
      minVotos = fast ? 5 : MINVOTOS;
      bufMax = fast ? 10 : BUFMAX;
      buf = [];
      imgActual = null;
    },
    captureFrame() {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const cx = c.getContext("2d");
      cx.save();
      cx.scale(-1, 1);
      cx.drawImage(video, -W, 0, W, H);
      cx.restore();
      return c.toDataURL("image/jpeg", 0.92);
    },
    getVideo() { return video; },
  };
}

export async function mergePhotoWithMeme(photoDataUrl, gesture, w = 640, h = 480) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");

  const load = src => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

  const photo = await load(photoDataUrl);
  ctx.drawImage(photo, 0, 0, w, h);
  ctx.fillStyle = "rgba(20,40,120,0.12)";
  ctx.fillRect(0, 0, w, h);

  if (gesture?.img) {
    if (gesture.img.startsWith("data:")) {
      const meme = await load(gesture.img);
      const s = 0.52;
      const mw = w * s, mh = h * s;
      ctx.globalAlpha = 0.88;
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(meme, (w - mw) / 2, (h - mh) / 2 - 20, mw, mh);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    } else {
      ctx.font = `bold ${Math.floor(w * 0.22)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(100,180,255,0.8)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#fff";
      ctx.fillText(gesture.img, w / 2, h / 2 - 10);
      ctx.shadowBlur = 0;
    }
  }
  return canvas;
}
