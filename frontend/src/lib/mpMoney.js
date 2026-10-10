// A quick money picture for one MP, worked out from their declared interests: who the money came from, how concentrated it is, and
// which industries it sits in. Only entries with both a named source and a value count.

import { getDonorSector, normalizeDonorKey } from "./donorSectors";

export function topSources(interests, limit = 5) {
  const groups = new Map();
  for (const item of interests ?? []) {
    const name = item.donor_name?.trim();
    const value = Number(item.value_amount);
    if (!name || !(value > 0)) continue;
    const key = normalizeDonorKey(name) || name.toLowerCase();
    const g = groups.get(key) ?? { key, name, total: 0, count: 0, best: 0 };
    g.total += value;
    g.count += 1;
    // Show the spelling of the biggest single entry.
    if (value > g.best) { g.best = value; g.name = name; }
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ key: g.key, name: g.name, total: g.total, count: g.count, sector: getDonorSector(g.name)?.sector ?? null }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function moneyProfile(interests) {
  const all = topSources(interests, Infinity);
  const total = all.reduce((n, s) => n + s.total, 0);
  if (!all.length) return null;
  const top = all.slice(0, 5);
  const topThree = all.slice(0, 3).reduce((n, s) => n + s.total, 0);
  const sectorTotals = new Map();
  for (const s of all) if (s.sector && s.sector !== "Other / Uncategorised") sectorTotals.set(s.sector, (sectorTotals.get(s.sector) ?? 0) + s.total);
  const topSector = [...sectorTotals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  return {
    total,
    sources: all.length,
    entries: all.reduce((n, s) => n + s.count, 0),
    top: top.map((s) => ({ ...s, share: s.total / total })),
    topThreeShare: topThree / total,
    topSector: topSector ? { sector: topSector[0], total: topSector[1], share: topSector[1] / total } : null,
  };
}

// "Most of it came from one source", "spread across many sources", in a sentence a reader can use.
export function concentrationPhrase(profile) {
  if (!profile) return "";
  if (profile.sources === 1) return "All of it came from a single source.";
  const lead = profile.top[0];
  if (lead.share >= 0.6) return `Most of it (${Math.round(lead.share * 100)}%) came from one source, ${lead.name}.`;
  if (profile.topThreeShare >= 0.8 && profile.sources > 3) return `Its three biggest sources account for ${Math.round(profile.topThreeShare * 100)}% of it.`;
  if (profile.sources >= 8) return `It is spread across ${profile.sources} different sources.`;
  return `It came from ${profile.sources} sources.`;
}
