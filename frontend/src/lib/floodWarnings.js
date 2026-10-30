// Live flood warnings near a point, from the Environment Agency's open flood-monitoring service (England only). The service answers a list of areas that have
// a warning or alert in force, each with a level: 1 severe flood warning, 2 flood warning, 3 flood alert, 4 no longer in force. Pure parsing, tested; the
// fetch is in floodNear.

export const LEVELS = {
  1: { label: "Severe flood warning", plain: "Severe flooding, danger to life", colour: "#B3261E" },
  2: { label: "Flood warning", plain: "Flooding is expected: act now", colour: "#D9453B" },
  3: { label: "Flood alert", plain: "Flooding is possible: be prepared", colour: "#C9962A" },
  4: { label: "No longer in force", plain: "A warning that has been lifted", colour: "#5B6784" },
};

// items: the service's `items`. Returns the ones in force, most serious first, in plain fields.
export function parseWarnings(items) {
  return (Array.isArray(items) ? items : [])
    .filter((i) => i && LEVELS[i.severityLevel] && i.severityLevel <= 3)
    .map((i) => ({
      id: String(i.floodAreaID ?? i.floodArea?.notation ?? i["@id"] ?? i.description),
      level: i.severityLevel,
      area: String(i.description ?? "").trim() || "A flood area",
      county: i.floodArea?.county ?? null,
      raised: i.timeMessageChanged ?? i.timeRaised ?? null,
      message: String(i.message ?? "").trim() || null,
    }))
    .sort((a, b) => a.level - b.level || a.area.localeCompare(b.area));
}

export async function floodNear(latitude, longitude, { dist = 10, fetcher = fetch } = {}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  try {
    const res = await fetcher(`https://environment.data.gov.uk/flood-monitoring/id/floods?lat=${latitude}&long=${longitude}&dist=${dist}`);
    if (!res.ok) return null;
    const json = await res.json();
    return parseWarnings(json.items);
  } catch { return null; }
}
