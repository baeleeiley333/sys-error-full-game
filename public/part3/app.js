import {
  FaceLandmarker,
  FilesetResolver,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

const RELATIONSHIPS = [
  'Artist & Collector',
  'Boss & Employee',
  'Cat & Human',
  'Cousins',
  'Creator & Creation',
  'Customer & Customer Service',
  'Dog & Human',
  'Dog Walker & Dog Owner',
  'Driver & Passenger',
  'Emotional Support Human',
  'Father & Daughter',
  'Father & Son',
  'First Date',
  'Grandparent & Grandchild',
  'Hero & Villain',
  'Human & Emotional Support Animal',
  'Human & Future Ex',
  'Human & Future Therapist',
  'Influencer & Follower',
  'Landlord & Tenant',
  'Last Date',
  'Lost Tourist & Local Guide',
  'Main Character & Side Character',
  'Married Couple',
  'Mother & Daughter',
  'Mother & Son',
  'One Who Leaves / One Who Stays',
  'One Who Talks / One Who Listens',
  'One Who Texts Back / One Who Doesn\'t',
  'Parent & Child',
  'Parent & Future Parent',
  'Pet & Human',
  'Player One & NPC',
  'Roommate Who Never Does The Dishes',
  'Roommates',
  'Siblings',
  'Teacher & Student',
  'Therapist & Patient',
  'Travel Companion',
  'Twins',
  'Wedding Guest & Plus One',
];

const RELATIONSHIP_INDEX_KEY = 'sys_error_relationship_index';

function loadRelationshipIndex() {
  try {
    const n = parseInt(localStorage.getItem(RELATIONSHIP_INDEX_KEY), 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Pick next label from the 40-word pool in rotation (not random). */
function pickNextRelationship() {
  const idx = loadRelationshipIndex();
  const word = RELATIONSHIPS[idx % RELATIONSHIPS.length];
  try {
    localStorage.setItem(RELATIONSHIP_INDEX_KEY, String((idx + 1) % RELATIONSHIPS.length));
  } catch { /* ignore */ }
  return word;
}

const PHASE = {
  SCANNING: 'SCANNING',
  SCANNED: 'SCANNED',
  COUNTDOWN: 'COUNTDOWN',
  LOADING: 'LOADING',
  RESULT: 'RESULT',
  END: 'END',
};

const COUNTDOWN_SECONDS = 5;
const COUNTDOWN_TICK_MS = 1200;
const SCANNED_HOLD_MS = 6000;
const LOADING_DURATION_MS = 5500;
const RESULT_HOLD_MS = 7500;
const TYPEWRITER_MS = 90;
const SOLO_SPAWN_INTERVAL_MS = 1400;
const SOLO_MAX_DIALOGS = 12;

const STYLES = [
  { name: 'GLITCH PORTRAIT', filter: applyGlitch },
  { name: 'TERMINAL SCAN', filter: applyTerminalGreen },
  { name: 'SURVEILLANCE BW', filter: applySurveillanceBW },
  { name: 'DOT MASK', filter: applyDotMask },
  { name: 'PIXEL GRID', filter: applyPixelGrid },
  { name: 'DITHER HALFTONE', filter: applyDither },
  { name: 'SCANLINE FEED', filter: applyScanlines },
  { name: 'FEATURE EXTRACT', filter: applyFeatureTiles },
  { name: 'THERMAL SCAN', filter: applyThermal },
  { name: 'HEAT SIGNATURE', filter: applyHeatSignature },
  { name: 'NIGHT VISION', filter: applyNightVision },
  { name: 'INFRARED TRACK', filter: applyInfraredTrack },
];

const GROUPS = [
  {
    scanCanvas: document.getElementById('scan-canvas-1'),
    styleCanvas: document.getElementById('style-canvas-1'),
    scanLabel: document.getElementById('scan-label-1'),
    styleLabel: document.getElementById('style-label-1'),
    progress: document.getElementById('progress-1'),
    color: '#00ffcc',
    subjectId: 'AR01',
  },
  {
    scanCanvas: document.getElementById('scan-canvas-2'),
    styleCanvas: document.getElementById('style-canvas-2'),
    scanLabel: document.getElementById('scan-label-2'),
    styleLabel: document.getElementById('style-label-2'),
    progress: document.getElementById('progress-2'),
    color: '#00ff88',
    subjectId: 'AR02',
  },
];

const FACE_CONNECTIONS = [
  [10,338],[338,297],[297,332],[332,284],[284,251],[251,389],[389,356],[356,454],
  [454,323],[323,361],[361,288],[288,397],[397,365],[365,379],[379,378],[378,400],
  [400,377],[377,152],[152,148],[148,176],[176,149],[149,150],[150,136],[136,172],
  [172,58],[58,132],[132,93],[93,234],[234,127],[127,162],[162,21],[21,54],
  [54,103],[103,67],[67,109],[109,10],
  [33,7],[7,163],[163,144],[144,145],[145,153],[153,154],[154,155],[155,133],
  [133,173],[173,157],[157,158],[158,159],[159,160],[160,161],[161,246],[246,33],
  [263,249],[249,390],[390,373],[373,374],[374,380],[380,381],[381,382],[382,362],
  [362,398],[398,384],[384,385],[385,386],[386,387],[387,388],[388,466],[466,263],
  [78,95],[95,88],[88,178],[178,87],[87,14],[14,317],[317,402],[402,318],
  [318,324],[324,308],[78,191],[191,80],[80,81],[81,82],[82,13],[13,312],
  [312,311],[311,310],[310,415],[415,308],
  [70,63],[63,105],[105,66],[66,107],[107,55],[55,65],[65,52],[52,53],[53,46],
  [336,296],[296,334],[334,293],[293,300],[300,276],[276,283],[283,282],[282,295],
  [295,285],[300,251],[251,389],[356,454],[454,323],[323,361],[361,288],
];

let faceLandmarker = null;
let frameCount = 0;
let gamePhase = PHASE.SCANNING;
let scannedActive = false;
let scannedAt = 0;
let countdownValue = COUNTDOWN_SECONDS;
let countdownLastTick = 0;
let loadingStart = 0;
let resultShownAt = 0;
let selectedRelationship = '';
let flowStarted = false;
let countdownTriggered = false;

const scannedStamp = document.getElementById('scanned-stamp');
const countdownEl = document.getElementById('scan-countdown');
const countdownNumber = document.getElementById('countdown-number');
const loadingDialog = document.getElementById('loading-dialog');
const loadProgressBlocks = document.getElementById('load-progress-blocks');
const loadStatusText = document.getElementById('load-status-text');
const relationshipPanel = document.getElementById('relationship-panel');
const relationshipWord = document.getElementById('relationship-word');
const relationshipFullscreen = document.getElementById('relationship-fullscreen');
const relationshipFullscreenWord = document.getElementById('relationship-fullscreen-word');
const endScreen = document.getElementById('end-screen');
const notFoundLayer = document.getElementById('not-found-layer');
let lastSoloSpawn = 0;

const groupState = [
  { styleIndex: 0, styleTimer: 0, lastCapture: null },
  { styleIndex: 0, styleTimer: 0, lastCapture: null },
];

const video = document.getElementById('webcam');
const scanCtx = GROUPS.map(g => g.scanCanvas.getContext('2d'));
const styleCtx = GROUPS.map(g => g.styleCanvas.getContext('2d'));

const xpBoot = document.getElementById('xp-boot');
const ieShell = document.getElementById('ie-shell');
const startOverlay = document.getElementById('start-overlay');
const introOverlay = document.getElementById('intro-overlay');
const introVideo = document.getElementById('intro-video');
const introProgressFill = document.getElementById('intro-progress-fill');
const syserrorPopup = document.getElementById('syserror-popup');
const phaseTransition = document.getElementById('phase-transition');
const phaseTransitionText = document.getElementById('phase-transition-text');
const desktop = document.getElementById('desktop');
const statusBar = document.getElementById('status-bar');
const gameIcon = document.getElementById('game-icon');

let titleAnimId = null;
let gameLaunched = false;
let ieOpened = false;

initXpBoot();

function armPressAdvance(fn, opts) {
  window.SYS_ERROR_ADVANCE?.arm(fn, opts);
}

function disarmPressAdvance() {
  window.SYS_ERROR_ADVANCE?.disarm();
}

function initXpBoot() {
  window.SYS_ERROR_IDLE?.arm('step2-press-to-start');
  armPressAdvance(openIEWindow);
  gameIcon.addEventListener('click', openIEWindow);
  document.addEventListener('keydown', (e) => {
    if (!ieOpened && xpBoot && !xpBoot.classList.contains('hidden') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openIEWindow();
    }
  });
}

function openIEWindow() {
  if (ieOpened) return;
  window.SYS_ERROR_IDLE?.disarm();
  disarmPressAdvance();
  ieOpened = true;
  xpBoot.classList.add('hidden');
  ieShell.classList.remove('hidden');
  ieShell.classList.add('visible');
  ieShell.setAttribute('aria-hidden', 'false');
  initTitleScreen();
}

function initTitleScreen() {
  window.SYS_ERROR_IDLE?.arm('step2-press-any-key');
  armPressAdvance(() => beginGameSequence(), { anyKey: true });
  const onStartInput = (e) => {
    if (!ieOpened || gameLaunched) return;
    if (!ieShell.classList.contains('visible')) return;
    if (e.type === 'keydown' && ['Tab'].includes(e.key)) return;
    e.preventDefault();
    beginGameSequence();
  };

  if (!window._titleListenersBound) {
    document.addEventListener('keydown', onStartInput);
    startOverlay.addEventListener('click', onStartInput);
    window._titleListenersBound = true;
  }
}

async function flashPhaseTransition(text, holdMs = 1100) {
  phaseTransitionText.textContent = text;
  phaseTransition.classList.remove('hidden');
  phaseTransition.classList.add('visible');
  phaseTransition.setAttribute('aria-hidden', 'false');
  await sleep(holdMs);
  phaseTransition.classList.remove('visible');
  phaseTransition.classList.add('hidden');
  phaseTransition.setAttribute('aria-hidden', 'true');
  await sleep(550);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function playIntroVideo() {
  return new Promise((resolve) => {
    window.SYS_ERROR_IDLE?.arm('step2-intro-skip');
    introOverlay.classList.remove('hidden');
    introOverlay.classList.add('visible');
    introOverlay.setAttribute('aria-hidden', 'false');

    introVideo.currentTime = 0;
    if (introProgressFill) introProgressFill.style.width = '0%';

    let syserrorTimer = null;

    const onTimeUpdate = () => {
      if (introVideo.duration && introProgressFill) {
        introProgressFill.style.width = `${(introVideo.currentTime / introVideo.duration) * 100}%`;
      }
    };

    const finish = () => {
      window.SYS_ERROR_IDLE?.disarm();
      disarmPressAdvance();
      introVideo.pause();
      introVideo.removeEventListener('timeupdate', onTimeUpdate);
      clearTimeout(syserrorTimer);
      if (syserrorPopup) {
        syserrorPopup.classList.remove('visible');
        syserrorPopup.classList.add('hidden');
        syserrorPopup.setAttribute('aria-hidden', 'true');
      }
      introOverlay.classList.remove('visible');
      introOverlay.classList.add('hidden');
      introOverlay.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', skipHandler);
      resolve();
    };

    const skipHandler = (e) => {
      e.preventDefault();
      finish();
    };

    const showSyserror = () => {
      if (!syserrorPopup) return;
      syserrorPopup.classList.remove('hidden');
      syserrorPopup.classList.add('visible');
      syserrorPopup.setAttribute('aria-hidden', 'false');
    };

    introVideo.onended = finish;
    introVideo.addEventListener('timeupdate', onTimeUpdate);
    document.addEventListener('keydown', skipHandler);
    armPressAdvance(finish, { anyKey: true });

    introVideo.play().then(() => {
      syserrorTimer = setTimeout(showSyserror, 600);
    }).catch(() => {
      console.warn('Intro autoplay blocked, skipping');
      finish();
    });
  });
}

async function beginGameSequence() {
  if (!ieOpened || gameLaunched) return;
  window.SYS_ERROR_IDLE?.disarm();
  disarmPressAdvance();
  gameLaunched = true;

  ieShell.classList.remove('visible');
  ieShell.classList.add('hidden');
  await sleep(500);
  await playIntroVideo();
  await flashPhaseTransition('INITIALIZING SURVEILLANCE', 1400);
  await launchGame();
}

async function launchGame() {
  try {
  if (!window.isSecureContext) {
    throw new Error('Please open via http://localhost:8080 — do not double-click the HTML file.');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera API not supported. Please use Chrome or Edge.');
  }

    desktop.classList.add('game-active');
    statusBar.classList.add('game-active');
    setStatus('Requesting camera access...');

    await startCamera();
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    setStatus('Camera on — loading MediaPipe model...');
    updatePhase('LOADING MODEL');
    loop();

    await loadMediaPipe();
    await flashPhaseTransition('SCAN MODULE ONLINE', 1100);

    setStatus('Scanning active — 2 subject groups ready');
    updatePhase('SCANNING');
  } catch (err) {
    console.error('Start failed:', err);
    gameLaunched = false;
    ieOpened = true;
    ieShell.classList.remove('hidden');
    ieShell.classList.add('visible');
    showStartError(err);
    initTitleScreen();
  }
}
function goToStep3() {
  window.SYS_ERROR_IDLE?.disarm();
  disarmPressAdvance();
  window.location.href = '/part2/index.html';
}

function initEndScreenControls() {
  const okBtn = document.getElementById('end-ok-btn');
  okBtn.addEventListener('click', goToStep3);
  document.getElementById('end-cancel-btn').addEventListener('click', () => {
    okBtn.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (gamePhase !== PHASE.END || !endScreen.classList.contains('visible')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToStep3();
    }
  });
}
initEndScreenControls();
document.getElementById('load-cancel-btn').addEventListener('click', () => {
  if (gamePhase === PHASE.LOADING) resetGame();
});

function initLoadingBlocks() {
  loadProgressBlocks.innerHTML = '';
  for (let i = 0; i < 14; i++) {
    const block = document.createElement('div');
    block.className = 'load-block';
    loadProgressBlocks.appendChild(block);
  }
}
initLoadingBlocks();

function showStartError(err) {
  const errEl = document.getElementById('start-error');
  const name = err?.name || '';
  let msg = err?.message || String(err);

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    msg = 'Camera permission denied. Allow camera access in your browser settings and try again.';
  } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    msg = 'No camera detected. Please connect a webcam and try again.';
  } else if (name === 'NotReadableError' || name === 'TrackStartError') {
    msg = 'Camera is in use by another app. Close Zoom, Teams, etc. and try again.';
  } else if (msg.includes('Failed to fetch') || msg.includes('network')) {
    msg = 'MediaPipe model download failed. Check your network connection and try again.';
  } else if (!window.isSecureContext) {
    msg = 'Please open via http://localhost:8080 — do not double-click the HTML file.';
  }

  errEl.textContent = msg;
  errEl.classList.remove('hidden');
  setStatus('Error: ' + msg.slice(0, 60));
}

async function startCamera() {
  const attempts = [
    { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: 'user' }, audio: false },
    { video: true, audio: false },
  ];

  let lastError;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      return stream;
    } catch (e) {
      lastError = e;
      console.warn('Camera attempt failed:', constraints, e);
    }
  }
  throw lastError;
}

async function loadMediaPipe() {
  const modelOpts = {
    runningMode: 'VIDEO',
    numFaces: 2,
    outputFaceBlendshapes: false,
  };

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  for (const delegate of ['GPU', 'CPU']) {
    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate,
        },
        ...modelOpts,
      });
      return;
    } catch (e) {
      if (delegate === 'CPU') throw e;
      console.warn('GPU delegate failed, trying CPU', e);
    }
  }
}

function resizeCanvases() {
  GROUPS.forEach(g => {
    [g.scanCanvas, g.styleCanvas].forEach(c => {
      const rect = c.parentElement.getBoundingClientRect();
      c.width = Math.round(rect.width);
      c.height = Math.round(rect.height);
    });
  });
}

function loop() {
  if (video.readyState < 2) {
    requestAnimationFrame(loop);
    return;
  }

  frameCount++;

  if (!faceLandmarker) {
    requestAnimationFrame(loop);
    return;
  }

  const timestamp = performance.now();
  const results = faceLandmarker.detectForVideo(video, timestamp);
  const faces = sortFacesLeftToRight(results.faceLandmarks || []);

  document.getElementById('face-count').textContent = `Faces: ${faces.length}`;

  const bothFaces = faces.length >= 2;
  updateGameFlow(bothFaces);
  updateSoloFaceWarning(faces.length);

  for (let gi = 0; gi < 2; gi++) {
    const face = faces[gi] || null;
    const group = GROUPS[gi];
    const state = groupState[gi];

    drawScanCanvas(scanCtx[gi], face, group, gi);

    if (face) {
      state.lastCapture = captureFaceRegion(face);
      group.scanLabel.textContent = `TRACKING ${group.subjectId}`;
      state.styleTimer++;

      if (state.styleTimer % 90 === 0 && state.lastCapture) {
        const style = STYLES[state.styleIndex % STYLES.length];
        applyStyleToCanvas(styleCtx[gi], state.lastCapture, style, state.styleIndex);
        group.styleLabel.textContent = style.name;
        state.styleIndex++;
      }
    } else {
      group.scanLabel.textContent = gi === 0 ? 'SCANNING...' : 'AWAITING FACE...';
    }

    const progress = ((frameCount + gi * 150) % 300) / 300 * 100;
    group.progress.style.width = `${progress}%`;
  }

  requestAnimationFrame(loop);
}

/** Sort faces left-to-right on screen (mirrored camera) */
function sortFacesLeftToRight(faces) {
  return [...faces].sort((a, b) => {
    const ax = a[1] ? a[1].x : a[168]?.x ?? 0.5;
    const bx = b[1] ? b[1].x : b[168]?.x ?? 0.5;
    return bx - ax;
  });
}

/** Map normalized landmark to canvas coords matching the cropped+mirrored video draw */
function landmarkToCanvas(lm, bounds, canvasW) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const vx = lm.x * vw;
  const vy = lm.y * vh;

  const t = (vx - bounds.sx) / bounds.sw;
  const u = (vy - bounds.sy) / bounds.sh;

  const x = canvasW - bounds.dx - t * bounds.dw;
  const y = bounds.dy + u * bounds.dh;
  return { x, y };
}

function getFaceBounds(landmarks) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const lm of landmarks) {
    minX = Math.min(minX, lm.x);
    minY = Math.min(minY, lm.y);
    maxX = Math.max(maxX, lm.x);
    maxY = Math.max(maxY, lm.y);
  }

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const pad = 0.2;
  const fw = maxX - minX;
  const fh = maxY - minY;
  const sx = Math.max(0, (minX - fw * pad) * vw);
  const sy = Math.max(0, (minY - fh * pad) * vh);
  const sw = Math.min(vw - sx, (fw + fw * pad * 2) * vw);
  const sh = Math.min(vh - sy, (fh + fh * pad * 2) * vh);

  return { sx, sy, sw, sh, minX, minY, maxX, maxY };
}

function fitBoundsToCanvas(bounds, canvasW, canvasH) {
  const aspect = canvasW / canvasH;
  let dw, dh;
  if (bounds.sw / bounds.sh > aspect) {
    dw = canvasW;
    dh = canvasW * (bounds.sh / bounds.sw);
  } else {
    dh = canvasH;
    dw = canvasH * (bounds.sw / bounds.sh);
  }
  return {
    ...bounds,
    dx: (canvasW - dw) / 2,
    dy: (canvasH - dh) / 2,
    dw, dh,
  };
}

function drawScanCanvas(ctx, landmarks, group, groupIdx) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const color = group.color;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  if (!landmarks) {
    drawNoFaceUI(ctx, w, h, color, groupIdx);
    return;
  }

  const rawBounds = getFaceBounds(landmarks);
  const bounds = fitBoundsToCanvas(rawBounds, w, h);

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, bounds.sx, bounds.sy, bounds.sw, bounds.sh,
    bounds.dx, bounds.dy, bounds.dw, bounds.dh);
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = 0.75;

  for (const [a, b] of FACE_CONNECTIONS) {
    if (!landmarks[a] || !landmarks[b]) continue;
    const p1 = landmarkToCanvas(landmarks[a], bounds, w);
    const p2 = landmarkToCanvas(landmarks[b], bounds, w);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  for (const lm of landmarks) {
    const p = landmarkToCanvas(lm, bounds, w);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCornerBrackets(ctx, bounds.dx, bounds.dy, bounds.dw, bounds.dh, color);

  const temp = (35 + Math.sin(frameCount * 0.05) * 2).toFixed(1);
  ctx.font = '13px VT323, monospace';
  ctx.fillStyle = color;
  ctx.fillText(`${group.subjectId}: ${temp}°C`, bounds.dx, bounds.dy - 6);

  const id = String(groupIdx * 100000000 + Math.floor(Date.now() % 100000000)).padStart(9, '0');
  ctx.fillText(id, bounds.dx, bounds.dy + bounds.dh + 14);

  ctx.globalAlpha = 0.07;
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = color;
    ctx.fillRect(0, y, w, 1);
  }
  ctx.globalAlpha = 1;
}

function drawNoFaceUI(ctx, w, h, color, groupIdx) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.22;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = '15px VT323, monospace';
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'center';
  ctx.fillText(groupIdx === 0 ? 'SEARCHING SUBJECT A...' : 'SEARCHING SUBJECT B...', cx, cy + r + 18);
  ctx.textAlign = 'left';

  const scanY = ((frameCount + groupIdx * 80) % 200) / 200 * h;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = color;
  ctx.fillRect(0, scanY, w, 2);
  ctx.globalAlpha = 1;
}

function drawCornerBrackets(ctx, x, y, w, h, color) {
  const len = 18;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();
}

function captureFaceRegion(landmarks) {
  const rawBounds = getFaceBounds(landmarks);
  const offscreen = document.createElement('canvas');
  offscreen.width = 256;
  offscreen.height = 256;
  const octx = offscreen.getContext('2d');
  octx.save();
  octx.translate(256, 0);
  octx.scale(-1, 1);
  octx.drawImage(video, rawBounds.sx, rawBounds.sy, rawBounds.sw, rawBounds.sh, 0, 0, 256, 256);
  octx.restore();
  return offscreen;
}

function applyStyleToCanvas(ctx, source, style, index) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const temp = document.createElement('canvas');
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext('2d');

  const size = Math.min(w, h) * 0.92;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  tctx.drawImage(source, ox, oy, size, size);

  if (style.filter === applyFeatureTiles) {
    applyFeatureTiles(tctx, w, h, source);
  } else {
    style.filter(tctx, w, h, index);
  }
  ctx.drawImage(temp, 0, 0);
}

// ── Style filters ──

function applyGlitch(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    d[i] = d[i+1] = d[i+2] = g;
  }
  ctx.putImageData(imgData, 0, 0);
  for (let i = 0; i < 14; i++) {
    const sy = Math.random() * h;
    const sh = 2 + Math.random() * 24;
    const offset = (Math.random() - 0.5) * 50;
    ctx.putImageData(ctx.getImageData(0, sy, w, sh), offset, sy);
  }
}

function applyTerminalGreen(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    const v = g > 128 ? 0 : Math.floor(g * 0.8);
    d[i] = 0; d[i+1] = v + 40; d[i+2] = Math.floor(v * 0.3);
  }
  ctx.putImageData(imgData, 0, 0);
}

function applySurveillanceBW(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    d[i] = d[i+1] = d[i+2] = g;
  }
  ctx.putImageData(imgData, 0, 0);
  ctx.strokeStyle = '#00cccc';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.35;
  for (let y = 0; y < h; y += 14) {
    for (let x = 0; x < w; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 14, y + 14);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function applyDotMask(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    d[i] = d[i+1] = d[i+2] = g > 128 ? 255 : 30;
  }
  ctx.putImageData(imgData, 0, 0);
  const cx = w / 2, cy = h / 2;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.07) {
    const dist = 0.82 + Math.random() * 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * w * 0.35 * dist, cy + Math.sin(angle) * h * 0.4 * dist,
      2 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function applyPixelGrid(ctx, w, h) {
  const cellSize = 12;
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let y = 0; y < h; y += cellSize) {
    for (let x = 0; x < w; x += cellSize) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = 0; dy < cellSize && y + dy < h; dy++) {
        for (let dx = 0; dx < cellSize && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          r += d[i]; g += d[i+1]; b += d[i+2]; n++;
        }
      }
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
      const gray = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
      ctx.font = '7px monospace';
      ctx.fillStyle = gray > 128 ? '#000' : '#fff';
      ctx.fillText(String(gray), x + 1, y + 9);
    }
  }
}

function applyDither(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const gray = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
      const v = gray > (bayer[y % 4][x % 4] / 16) * 255 ? 255 : 0;
      d[i] = d[i+1] = d[i+2] = v;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function applyScanlines(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    d[i] = d[i+1] = d[i+2] = g * 0.8;
  }
  ctx.putImageData(imgData, 0, 0);
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, y, w, 1);
  }
}

function applyFeatureTiles(ctx, w, h, source) {
  const features = [
    { label: 'Gaze: Strong 60%', sx: 0.55, sy: 0.28, sw: 0.3, sh: 0.14 },
    { label: 'Neutral 88%', sx: 0.35, sy: 0.58, sw: 0.22, sh: 0.12 },
    { label: 'Hair: Natural 93%', sx: 0.15, sy: 0.02, sw: 0.7, sh: 0.28 },
    { label: 'Assertive 41%', sx: 0.08, sy: 0.32, sw: 0.35, sh: 0.18 },
    { label: 'Confident 39%', sx: 0.3, sy: 0.68, sw: 0.55, sh: 0.28 },
  ];
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, w, h);
  const srcSize = 256;
  for (const f of features) {
    const fx = f.sx * w, fy = f.sy * h, fw = f.sw * w, fh = f.sh * h;
    ctx.drawImage(source, f.sx * srcSize, f.sy * srcSize, f.sw * srcSize, f.sh * srcSize, fx, fy, fw, fh);
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(fx, fy, fw, 16);
    ctx.font = 'bold 10px Tahoma, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(f.label, fx + 4, fy + 12);
  }
}

/** Thermal camera false-color with temperature scale */
function applyThermal(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    const t = gray / 255;
    let r, g, b;
    if (t < 0.25)       { r = 0; g = 0; b = Math.floor(t * 4 * 200); }
    else if (t < 0.5)   { r = 0; g = Math.floor((t - 0.25) * 4 * 255); b = 200; }
    else if (t < 0.75)  { r = Math.floor((t - 0.5) * 4 * 255); g = 255; b = 255 - Math.floor((t - 0.5) * 4 * 255); }
    else                { r = 255; g = 255 - Math.floor((t - 0.75) * 4 * 200); b = Math.floor((t - 0.75) * 4 * 255); }
    d[i] = r; d[i+1] = g; d[i+2] = b;
  }
  ctx.putImageData(imgData, 0, 0);

  const scaleX = w - 22;
  const scaleH = h - 20;
  const grad = ctx.createLinearGradient(scaleX, 10, scaleX, 10 + scaleH);
  grad.addColorStop(0, '#ff00ff');
  grad.addColorStop(0.3, '#ff0000');
  grad.addColorStop(0.5, '#ffff00');
  grad.addColorStop(0.7, '#00ff00');
  grad.addColorStop(1, '#0000aa');
  ctx.fillStyle = grad;
  ctx.fillRect(scaleX, 10, 14, scaleH);

  ctx.font = '8px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('39.0°C', scaleX - 2, 18);
  ctx.fillText('29.0°C', scaleX - 2, 10 + scaleH);

  const temp = (35 + Math.random() * 3.5).toFixed(1);
  const bx = w * 0.25, by = h * 0.2, bw = w * 0.5, bh = h * 0.45;
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#ff00ff';
  ctx.font = '11px monospace';
  ctx.fillText(`AR01: ${temp} °C`, bx + 2, by - 3);
}

/** Dark silhouette with heat blobs on face */
function applyHeatSignature(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    if (gray < 95) {
      d[i] = 18; d[i+1] = 18; d[i+2] = 22;
    } else {
      d[i] = 235; d[i+1] = 235; d[i+2] = 228;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const heatSpots = [
    { x: 0.5, y: 0.38, rx: 0.24, ry: 0.3 },
    { x: 0.37, y: 0.36, rx: 0.09, ry: 0.07 },
    { x: 0.63, y: 0.36, rx: 0.09, ry: 0.07 },
    { x: 0.5, y: 0.56, rx: 0.11, ry: 0.07 },
  ];
  for (const spot of heatSpots) {
    const cx = spot.x * w, cy = spot.y * h;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, spot.rx * w);
    grad.addColorStop(0, 'rgba(255,255,80,0.95)');
    grad.addColorStop(0.25, 'rgba(255,160,0,0.85)');
    grad.addColorStop(0.55, 'rgba(220,30,60,0.7)');
    grad.addColorStop(1, 'rgba(60,0,100,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, spot.rx * w, spot.ry * h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Night vision IR camera with grain and glowing eyes */
function applyNightVision(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    d[i] = gray * 0.4;
    d[i+1] = gray * 0.55;
    d[i+2] = gray * 0.9;
  }
  ctx.putImageData(imgData, 0, 0);

  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = Math.random() * 80;
    ctx.fillStyle = `rgba(${v},${v + 20},${v + 60},0.4)`;
    ctx.fillRect(x, y, 1, 1);
  }

  const eyeSpots = [{ x: 0.38, y: 0.38 }, { x: 0.58, y: 0.38 }];
  for (const eye of eyeSpots) {
    const ex = eye.x * w, ey = eye.y * h;
    const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 12);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.5, 'rgba(200,220,255,0.5)');
    grad.addColorStop(1, 'rgba(100,150,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex, ey, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const bx = w * 0.15, by = h * 0.1, bw = w * 0.7, bh = h * 0.8;
  ctx.strokeStyle = '#ff3333';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.font = '12px VT323, monospace';
  ctx.fillStyle = '#ff3333';
  ctx.fillText(`look_${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`, bx + 2, by - 3);
}

/** Infrared tracking with red boxes like security cam */
function applyInfraredTrack(ctx, w, h) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11;
    d[i] = gray * 0.25;
    d[i+1] = gray * 0.45;
    d[i+2] = gray * 0.85;
  }
  ctx.putImageData(imgData, 0, 0);

  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = 'rgba(0,20,60,0.15)';
    ctx.fillRect(0, y, w, 1);
  }

  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(100,150,255,${Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }

  const boxes = [
    { x: 0.1, y: 0.08, w: 0.8, h: 0.84, label: 'look_08' },
    { x: 0.3, y: 0.25, w: 0.4, h: 0.5, label: 'look_09' },
  ];
  for (const box of boxes) {
    const bx = box.x * w, by = box.y * h, bw = box.w * w, bh = box.h * h;
    ctx.strokeStyle = '#ff2222';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.font = '11px VT323, monospace';
    ctx.fillStyle = '#ff2222';
    ctx.fillText(box.label, bx + 2, by - 2);
  }
}

function updateSoloFaceWarning(faceCount) {
  const shouldShow = faceCount === 1 && !flowStarted && gamePhase !== PHASE.END;

  if (!shouldShow) {
    clearNotFoundDialogs();
    return;
  }

  const now = performance.now();
  if (now - lastSoloSpawn < SOLO_SPAWN_INTERVAL_MS) return;
  lastSoloSpawn = now;
  spawnNotFoundDialog();
}

function spawnNotFoundDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'not-found-dialog';
  dialog.innerHTML = `
    <div class="nf-titlebar">
      <span>System message</span>
      <button class="nf-close" type="button" tabindex="-1">×</button>
    </div>
    <div class="nf-body">
      <div class="nf-warning-icon">!</div>
      <p class="nf-message">Relationship Not Found.</p>
      <div class="nf-buttons">
        <button class="nf-btn" type="button" tabindex="-1">Ok</button>
        <button class="nf-btn" type="button" tabindex="-1">Cancel</button>
      </div>
    </div>
  `;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dialogW = 300;
  const dialogH = 130;
  const margin = 20;
  const centerMinX = vw * 0.22;
  const centerMaxX = vw * 0.72 - dialogW;
  const centerMinY = vh * 0.12;
  const centerMaxY = vh * 0.62 - dialogH;

  dialog.style.left = `${centerMinX + Math.random() * Math.max(0, centerMaxX - centerMinX)}px`;
  dialog.style.top = `${centerMinY + Math.random() * Math.max(0, centerMaxY - centerMinY)}px`;

  notFoundLayer.appendChild(dialog);

  while (notFoundLayer.children.length > SOLO_MAX_DIALOGS) {
    notFoundLayer.firstChild.remove();
  }
}

function clearNotFoundDialogs() {
  notFoundLayer.innerHTML = '';
  lastSoloSpawn = 0;
}

function updateGameFlow(bothFaces) {
  const now = performance.now();

  if (gamePhase === PHASE.END) return;

  if (!flowStarted) {
    if (bothFaces) {
      if (!scannedActive) {
        scannedActive = true;
        scannedAt = now;
        showScannedStamp();
        gamePhase = PHASE.SCANNED;
        updatePhase('SCANNED');
        setStatus('Both subjects locked — hold position…');
      }
      if (gamePhase === PHASE.SCANNED && now - scannedAt >= SCANNED_HOLD_MS && !countdownTriggered) {
        countdownTriggered = true;
        startCountdown();
      }
    } else if (scannedActive && gamePhase === PHASE.SCANNED) {
      hideScannedStamp();
      scannedActive = false;
      gamePhase = PHASE.SCANNING;
      updatePhase('SCANNING');
    }
    return;
  }

  if (gamePhase === PHASE.COUNTDOWN) {
    if (!bothFaces) return;
    if (now - countdownLastTick >= COUNTDOWN_TICK_MS) {
      countdownLastTick = now;
      countdownValue--;
      countdownNumber.textContent = String(countdownValue);
      countdownNumber.style.animation = 'none';
      void countdownNumber.offsetWidth;
      countdownNumber.style.animation = 'count-pop 0.4s ease-out';

      if (countdownValue <= 0) startLoading();
    }
  }

  if (gamePhase === PHASE.LOADING) {
    const elapsed = now - loadingStart;
    const progress = Math.min(1, elapsed / LOADING_DURATION_MS);
    const filled = Math.floor(progress * 14);
    loadProgressBlocks.querySelectorAll('.load-block').forEach((b, i) => {
      b.classList.toggle('filled', i < filled);
    });
    if (progress >= 1) showResult();
  }

  if (gamePhase === PHASE.RESULT && resultShownAt > 0 && now - resultShownAt >= RESULT_HOLD_MS) {
    showEndScreen();
  }
}

function typewriterText(el, text, msPerChar = TYPEWRITER_MS) {
  const safe = (text && String(text).trim()) ? String(text) : RELATIONSHIPS[0];
  return new Promise((resolve) => {
    el.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += safe[i];
      i += 1;
      if (i >= safe.length) {
        clearInterval(interval);
        resolve();
      }
    }, msPerChar);
  });
}

function hideRelationshipFullscreen() {
  if (!relationshipFullscreen) return;
  relationshipFullscreen.classList.remove('visible');
  relationshipFullscreen.classList.add('hidden');
  relationshipFullscreen.setAttribute('aria-hidden', 'true');
  if (relationshipFullscreenWord) relationshipFullscreenWord.textContent = '';
}

function showScannedStamp() {
  scannedStamp.classList.remove('hidden', 'visible');
  void scannedStamp.offsetWidth;
  scannedStamp.classList.add('visible');
  scannedStamp.setAttribute('aria-hidden', 'false');
}

function hideScannedStamp() {
  scannedStamp.classList.remove('visible');
  scannedStamp.classList.add('hidden');
  scannedStamp.setAttribute('aria-hidden', 'true');
}

async function startCountdown() {
  flowStarted = true;
  gamePhase = PHASE.COUNTDOWN;
  hideScannedStamp();
  await flashPhaseTransition('DEEP SCAN INITIATED', 1100);
  countdownValue = COUNTDOWN_SECONDS;
  countdownNumber.textContent = String(countdownValue);
  countdownLastTick = performance.now();
  countdownEl.classList.remove('hidden');
  countdownEl.classList.add('visible');
  countdownEl.setAttribute('aria-hidden', 'false');
  updatePhase('COUNTDOWN');
  setStatus('Deep scan countdown — keep both faces in frame');
}

async function startLoading() {
  gamePhase = PHASE.LOADING;
  countdownEl.classList.remove('visible');
  countdownEl.classList.add('hidden');
  countdownEl.setAttribute('aria-hidden', 'true');

  await flashPhaseTransition('RELATIONSHIP DETECTED', 1200);

  selectedRelationship = pickNextRelationship();
  loadingStart = performance.now();
  loadStatusText.textContent = 'Loading...';
  loadProgressBlocks.querySelectorAll('.load-block').forEach(b => b.classList.remove('filled'));

  loadingDialog.classList.remove('hidden');
  loadingDialog.classList.add('visible');
  loadingDialog.setAttribute('aria-hidden', 'false');
  updatePhase('LOADING');
  setStatus('Analyzing relationship...');
}

async function showResult() {
  if (gamePhase !== PHASE.LOADING) return;
  gamePhase = PHASE.RESULT;
  resultShownAt = 0;

  loadingDialog.classList.remove('visible');
  loadingDialog.classList.add('hidden');
  loadingDialog.setAttribute('aria-hidden', 'true');

  await flashPhaseTransition('ANALYSIS COMPLETE', 1100);

  if (relationshipFullscreen && relationshipFullscreenWord) {
    relationshipFullscreen.classList.remove('hidden');
    relationshipFullscreen.classList.add('visible');
    relationshipFullscreen.setAttribute('aria-hidden', 'false');
    if (relationshipWord) relationshipWord.textContent = selectedRelationship;
    await typewriterText(relationshipFullscreenWord, selectedRelationship);
  }

  resultShownAt = performance.now();
  updatePhase('RESULT');
  setStatus(`Relationship detected: ${selectedRelationship}`);
}

async function showEndScreen() {
  gamePhase = PHASE.END;
  relationshipPanel.classList.remove('visible');
  relationshipPanel.classList.add('hidden');
  hideRelationshipFullscreen();
  await flashPhaseTransition('VULNERABILITY DETECTED', 1500);
  endScreen.classList.remove('hidden');
  endScreen.classList.add('visible');
  endScreen.setAttribute('aria-hidden', 'false');
  updatePhase('END');
  setStatus('Press OK to continue to Step 3');
  window.SYS_ERROR_IDLE?.arm('step2-press-to-ok');
  armPressAdvance(goToStep3, { anyKey: true });
  const okBtn = document.getElementById('end-ok-btn');
  if (okBtn) okBtn.focus();
}

function resetGame() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  faceLandmarker = null;

  flowStarted = false;
  scannedActive = false;
  gameLaunched = false;
  ieOpened = false;
  countdownTriggered = false;
  gamePhase = PHASE.SCANNING;
  countdownValue = COUNTDOWN_SECONDS;

  hideScannedStamp();
  clearNotFoundDialogs();
  countdownEl.classList.remove('visible');
  countdownEl.classList.add('hidden');
  loadingDialog.classList.remove('visible');
  loadingDialog.classList.add('hidden');
  relationshipPanel.classList.remove('visible');
  relationshipPanel.classList.add('hidden');
  hideRelationshipFullscreen();
  endScreen.classList.remove('visible');
  endScreen.classList.add('hidden');
  introOverlay.classList.remove('visible');
  introOverlay.classList.add('hidden');
  desktop.classList.remove('game-active');
  statusBar.classList.remove('game-active');
  xpBoot.classList.remove('hidden');
  ieShell.classList.remove('visible');
  ieShell.classList.add('hidden');
  document.getElementById('start-error').classList.add('hidden');
  gameIcon.classList.remove('selected');

  groupState.forEach(s => { s.styleIndex = 0; s.styleTimer = 0; });
  loadProgressBlocks.querySelectorAll('.load-block').forEach(b => b.classList.remove('filled'));

  updatePhase('IDLE');
  setStatus('Press to start');
  if (!ieOpened && xpBoot && !xpBoot.classList.contains('hidden')) {
    window.SYS_ERROR_IDLE?.arm('step2-press-to-start');
    armPressAdvance(openIEWindow);
  } else {
    disarmPressAdvance();
  }
}

function setStatus(text) {
  document.getElementById('status-text').textContent = text;
}

function updatePhase(phase) {
  document.getElementById('scan-phase').textContent = `Phase: ${phase}`;
}
