// techno-presets.js — 标准 Techno 基础曲 + 随机选轨

export const TECHNO_PRESETS = [
  {
    id: "berlin",
    name: "BERLIN",
    bpm: 128,
    hatDensity: 1.25,
    bassEvery: 2,
    groove: true,
    leadSteps: [0, 2, 5, 8, 10, 13],
    bedCutoff: 1100,
    bedLfo: 0.07,
    subGain: 0.15,
    padGain: 0.05,
    prog: [[0, 2, 4, 6], [4, 6, 1, 3], [2, 4, 6, 1], [6, 1, 3, 5]],
  },
  {
    id: "detroit",
    name: "DETROIT",
    bpm: 125,
    hatDensity: 1.1,
    bassEvery: 2,
    groove: true,
    leadSteps: [0, 4, 8, 12],
    bedCutoff: 1600,
    bedLfo: 0.05,
    subGain: 0.12,
    padGain: 0.07,
    prog: [[0, 3, 5, 7], [5, 7, 2, 4], [3, 5, 7, 2], [7, 2, 4, 6]],
  },
  {
    id: "acid",
    name: "ACID",
    bpm: 132,
    hatDensity: 1.45,
    bassEvery: 1,
    groove: true,
    leadSteps: [0, 1, 2, 4, 6, 8, 10, 12, 14],
    bedCutoff: 900,
    bedLfo: 0.14,
    subGain: 0.1,
    padGain: 0.04,
    acidBass: true,
    prog: [[0, 2, 5, 7], [2, 5, 7, 3], [5, 7, 3, 0], [7, 3, 0, 2]],
  },
  {
    id: "minimal",
    name: "MINIMAL",
    bpm: 124,
    hatDensity: 0.85,
    bassEvery: 2,
    groove: true,
    leadSteps: [0, 8],
    bedCutoff: 800,
    bedLfo: 0.04,
    subGain: 0.11,
    padGain: 0.035,
    prog: [[0, 4, 6], [4, 6, 1], [6, 1, 3], [1, 3, 5]],
  },
  {
    id: "peak",
    name: "PEAK",
    bpm: 135,
    hatDensity: 1.55,
    bassEvery: 1,
    groove: true,
    leadSteps: [0, 1, 2, 3, 5, 8, 10, 11, 13, 14],
    bedCutoff: 1400,
    bedLfo: 0.1,
    subGain: 0.16,
    padGain: 0.06,
    prog: [[0, 2, 4, 7], [4, 7, 1, 3], [2, 4, 7, 1], [7, 1, 3, 5]],
  },
];

function clonePreset(base, seed) {
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const rootShift = Math.floor(rng() * 5) - 2;
  return {
    ...base,
    seed,
    name: `${base.name}-${Math.floor(rng() * 90 + 10)}`,
    bpm: base.bpm + Math.floor(rng() * 5) - 2,
    rootShift,
    bedCutoff: base.bedCutoff + Math.floor(rng() * 200 - 100),
  };
}

/** 随机生成 4~5 条变体，再抽一条作为本次基础轨 */
export function pickRandomTechnoTrack(palette) {
  const n = 4 + Math.floor(Math.random() * 2);
  const pool = [];
  for (let i = 0; i < n; i++) {
    const base = TECHNO_PRESETS[Math.floor(Math.random() * TECHNO_PRESETS.length)];
    pool.push(clonePreset(base, (Date.now() + i * 9973) | 0));
  }
  const h = palette?.[0]?.hsl?.h ?? 200;
  const pick = pool[Math.floor((h + Math.random() * 360) % pool.length)];
  return pick;
}

export function pickTechnoPreset(palette) {
  return pickRandomTechnoTrack(palette);
}
