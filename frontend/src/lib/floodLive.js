// Flood warnings and alerts in force near a point, and the flood warning areas around it, from the Environment Agency's real-time flood-monitoring service (live, open to any website,
// England only). A "severe flood warning" (level 1) means danger to life, a "flood warning" (2) means flooding is expected, a "flood alert" (3) means it is possible. Level 4 is a
// warning that has just been lifted and is not counted.

const API = "https://environment.data.gov.uk/flood-monitoring/id";

export const SEVERITY = {
  1: { name: "Severe flood warning", tone: "#B0201A", meaning: "Severe flooding, danger to life." },
  2: { name: "Flood warning", tone: "#D9453B", meaning: "Flooding is expected. Act now." },
  3: { name: "Flood alert", tone: "#C98A0B", meaning: "Flooding is possible. Be prepared." },
};

const tidy = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// Active warnings, most severe first (then the one raised most recently).
export function activeWarnings(items) {
  return (Array.isArray(items) ? items : [])
    .filter((w) => SEVERITY[w?.severityLevel])
    .map((w) => ({
      id: w["@id"] ?? w.floodAreaID ?? `${w.description}`,
      level: w.severityLevel,
      name: tidy(w.description) || tidy(w.floodArea?.label) || "Flood risk area",
      river: tidy(w.floodArea?.riverOrSea),
      county: tidy(w.floodArea?.county),
      message: tidy(w.message),
      raised: typeof w.timeRaised === "string" ? w.timeRaised : null,
    }))
    .sort((a, b) => a.level - b.level || String(b.raised ?? "").localeCompare(String(a.raised ?? "")));
}

// The rivers and seas the nearby warning areas are on, most areas first.
export function riversOf(areas, count = 6) {
  const counts = new Map();
  for (const a of areas ?? []) {
    for (const part of String(a.riverOrSea ?? "").split(",")) {
      const name = tidy(part);
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, count).map(([name]) => name);
}

export async function loadFloods({ lat, lon }, { warnKm = 10, areaKm = 5 } = {}, fetcher = fetch) {
  const q = `lat=${lat.toFixed(5)}&long=${lon.toFixed(5)}`;
  const get = async (path) => {
    const res = await fetcher(`${API}/${path}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`Flood service answered ${res.status}`);
    const body = await res.json();
    if (!Array.isArray(body?.items)) throw new Error("The flood service answer had no items");
    return body.items;
  };
  const [warnings, areas] = await Promise.all([get(`floods?${q}&dist=${warnKm}`), get(`floodAreas?${q}&dist=${areaKm}&_limit=200`).catch(() => null)]);
  return { warnKm, areaKm, warnings: activeWarnings(warnings), areaCount: areas ? areas.length : null, rivers: areas ? riversOf(areas) : [] };
}
