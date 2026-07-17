// shared.js — 跨页面共享工具 / shared utilities across pages
export const LS_LANG = "gesto_lang";

export function getLang() {
  const saved = localStorage.getItem(LS_LANG);
  if (saved) return saved;
  return (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function setLang(lang) {
  try { localStorage.setItem(LS_LANG, lang); } catch (e) {}
}

export const COMMON = {
  zh: {
    desktop: "桌面",
    play: "开始玩",
    trainer: "训练手势",
    importBtn: "📂 导入样本 json",
    importOk: (n) => `✓ 已导入 ${n} 个手势`,
    importFail: "⚠ 导入失败,请检查 json 格式",
    importMerge: "合并到现有数据?(取消=覆盖)",
    noGestures: "还没有训练手势",
    goTrain: "去训练 →",
    backDesktop: "← 桌面",
    backTrainer: "← 训练",
    publish: "📦 导出发布包",
    gestureCount: (n) => `${n} 个手势`,
    samplesCount: (n) => `${n} 段样本`,
    playHint: "对着摄像头做手势,表情包会弹出来",
    playEmpty: "先训练至少一个手势再来玩",
    recent: "最近触发",
    loading: "载入中…",
    ready: "准备好了,做手势吧 👋",
    needCam: "⚠ 需要摄像头权限",
    neutral: "中性",
    comingSoon: "即将推出",
    minesweeper: "扫雷",
    myMemes: "我的表情包",
    camera: "摄像头",
    sequence: "生物序列",
    help: "怎么玩",
    about: "关于",
  },
  en: {
    desktop: "Desktop",
    play: "Play",
    trainer: "Train gestures",
    importBtn: "📂 Import samples (json)",
    importOk: (n) => `✓ Imported ${n} gesture(s)`,
    importFail: "⚠ Import failed — check json format",
    importMerge: "Merge with existing data? (Cancel = replace)",
    noGestures: "No gestures trained yet",
    goTrain: "Go train →",
    backDesktop: "← Desktop",
    backTrainer: "← Train",
    publish: "📦 Export publish bundle",
    gestureCount: (n) => `${n} gesture(s)`,
    samplesCount: (n) => `${n} sample(s)`,
    playHint: "Make a gesture — your meme pops up",
    playEmpty: "Train at least one gesture first",
    recent: "Recent",
    loading: "Loading…",
    ready: "Ready — make a gesture 👋",
    needCam: "⚠ Camera permission required",
    neutral: "neutral",
    comingSoon: "Coming soon",
    minesweeper: "Minesweeper",
    myMemes: "My memes",
    camera: "摄像头",
    sequence: "Biometric Seq",
    help: "How to play",
    about: "About",
  },
};

export function t(key, ...args) {
  const lang = getLang();
  const val = COMMON[lang][key];
  return typeof val === "function" ? val(...args) : val;
}

export function thumbHTML(img) {
  if (img && img.startsWith("data:")) return `<img src="${img}" alt="">`;
  return `<div class="emoji">${img || "❓"}</div>`;
}

export function renderMeme(el, g) {
  if (!g) {
    el.innerHTML = `<div class="hint">${t("playHint")}</div>`;
    el.classList.remove("pop");
    return;
  }
  el.innerHTML = g.img && g.img.startsWith("data:")
    ? `<img src="${g.img}" alt="${g.name}">`
    : `<div class="emoji">${g.img || "❓"}</div>`;
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}
