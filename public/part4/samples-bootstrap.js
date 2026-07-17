import { LS_KEY, parseSamples } from "./engine.js";

function hasStoredSamples() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return Object.values(raw).some(d => d?.samples?.length > 0);
  } catch {
    return false;
  }
}

/** Load bundled samples.json when browser has no trained gestures yet. */
export async function bootstrapSamplesFromFile({ force = false } = {}) {
  const forceReload = force || new URLSearchParams(location.search).has("reloadSamples");
  if (!forceReload && hasStoredSamples()) return { loaded: false, reason: "localStorage" };

  try {
    const res = await fetch("./samples.json", { cache: "no-store" });
    if (!res.ok) return { loaded: false, reason: "missing-file" };
    const data = parseSamples(await res.json());
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    const count = Object.keys(data).filter(k => data[k]?.samples?.length).length;
    return { loaded: true, count };
  } catch (e) {
    console.warn("samples bootstrap failed", e);
    return { loaded: false, reason: "error", error: e };
  }
}
