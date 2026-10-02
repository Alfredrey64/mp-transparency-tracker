// Everything on the "Parliament in Numbers" page, computed from the current
// MPs and the by-elections table. Pure — no network, no React — so every
// figure can be checked against the input that produced it.

// The 2024 general election. An MP whose current run in the Commons began
// on or after this date is new to the House since then (a by-election
// winner counts: they're new to the Commons all the same).
export const GENERAL_ELECTION_2024 = "2024-07-04";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export const TENURE_BANDS = [
  { key: "lt2", label: "Under 2 years", max: 2 },
  { key: "2to5", label: "2 to 5 years", max: 5 },
  { key: "5to10", label: "5 to 10 years", max: 10 },
  { key: "10to20", label: "10 to 20 years", max: 20 },
  { key: "20plus", label: "20 years or more", max: Infinity },
];

function median(sorted) {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeParliamentStats(politicians, byElections = [], now = new Date()) {
  const mps = politicians.filter((p) => p.name);
  const total = mps.length;
  const women = mps.filter((p) => p.gender === "F").length;
  const newMps = mps.filter((p) => p.membership_start_date && p.membership_start_date >= GENERAL_ELECTION_2024).length;

  // Labour (Co-op) MPs sit as Labour MPs — the Co-operative Party is
  // allied to Labour, not a rival — so splitting them out would understate
  // Labour's seats, and with it any comparison against the majority line.
  const byParty = new Map();
  for (const p of mps) {
    const isCoop = p.party === "Labour (Co-op)";
    const party = isCoop ? "Labour" : p.party ?? "Unknown";
    if (!byParty.has(party)) byParty.set(party, { party, colour: p.party_colour ?? null, count: 0, women: 0, coop: 0 });
    const row = byParty.get(party);
    row.count += 1;
    if (isCoop) row.coop += 1;
    if (p.gender === "F") row.women += 1;
  }
  const seatsByParty = [...byParty.values()]
    .map((r) => ({ ...r, pct: total ? (r.count / total) * 100 : 0, womenPct: r.count ? (r.women / r.count) * 100 : 0 }))
    .sort((a, b) => b.count - a.count || a.party.localeCompare(b.party));

  // A share of a party of one or two MPs says nothing, so only parties big
  // enough for a percentage to mean something are ranked on it.
  const womenByParty = seatsByParty.filter((r) => r.count >= 5).sort((a, b) => b.womenPct - a.womenPct);

  const tenures = mps
    .filter((p) => p.membership_start_date)
    .map((p) => ({ name: p.name, years: Math.max(0, (now.getTime() - new Date(p.membership_start_date).getTime()) / YEAR_MS) }));
  const sortedYears = tenures.map((t) => t.years).sort((a, b) => a - b);
  const tenureBands = TENURE_BANDS.map((band, i) => {
    const min = i === 0 ? -Infinity : TENURE_BANDS[i - 1].max;
    return { ...band, count: tenures.filter((t) => t.years >= min && t.years < band.max).length };
  });
  // Several MPs can share a first election day, so "longest-serving" is a
  // list, not a name.
  const maxYears = tenures.reduce((m, t) => Math.max(m, t.years), 0);
  const longest = tenures.filter((t) => maxYears - t.years < 1 / 365.25);

  const completed = byElections.filter((e) => e.status === "completed");
  const gains = completed.filter((e) => /gain/i.test(e.result ?? "")).length;

  return {
    total,
    women,
    womenPct: total ? (women / total) * 100 : 0,
    newMps,
    seatsByParty,
    womenByParty,
    averageTenure: sortedYears.length ? sortedYears.reduce((a, b) => a + b, 0) / sortedYears.length : 0,
    medianTenure: median(sortedYears),
    tenureBands,
    longest: longest.length ? { names: longest.map((t) => t.name), years: maxYears } : null,
    byElections: { total: completed.length, gains, holds: completed.length - gains },
    majorityLine: Math.floor(total / 2) + 1,
  };
}
