// Everything on the Lords half of Parliament in Numbers, from the current
// peers (the Supabase `peers` table) and the short career rows
// fetch-lords-careers.js writes (see peerRecord() in mpCareers.js at the
// repo root for the field order). Pure and tested.

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const P = { lords: 0, mpFrom: 1, mpTo: 2, mpElected: 3, gov: 4, govNow: 5, opp: 6, commEver: 7, commNow: 8, from: 9, kind: 10 };
const GENERAL_ELECTION_2024 = "2024-07-04";

const partyName = (p) => p.party ?? "Unknown";
const yearOfDate = (d) => (d ? Number(String(d).slice(0, 4)) : null);

function median(sorted) {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// How many arrival years to show one by one; everything earlier is one bar.
const ARRIVAL_YEARS = 14;

export function computeLordsStats(peers, careers = null, now = new Date()) {
  const list = peers.filter((p) => p.name);
  const total = list.length;
  const women = list.filter((p) => p.gender === "F").length;

  const byParty = new Map();
  for (const p of list) {
    const party = partyName(p);
    if (!byParty.has(party)) byParty.set(party, { party, colour: p.party_colour ?? null, count: 0, women: 0 });
    const row = byParty.get(party);
    row.count += 1;
    if (p.gender === "F") row.women += 1;
  }
  const seatsByParty = [...byParty.values()]
    .map((r) => ({ ...r, pct: total ? (r.count / total) * 100 : 0, womenPct: r.count ? (r.women / r.count) * 100 : 0 }))
    .sort((a, b) => b.count - a.count || a.party.localeCompare(b.party));
  const womenByParty = seatsByParty.filter((r) => r.count >= 10).sort((a, b) => b.womenPct - a.womenPct);

  const types = new Map();
  for (const p of list) types.set(p.peerage_type ?? "Other", (types.get(p.peerage_type ?? "Other") ?? 0) + 1);

  // Arrivals by year, the latest ARRIVAL_YEARS years singly, split by party.
  const years = list.map((p) => yearOfDate(p.membership_start_date)).filter(Boolean);
  const latest = years.length ? Math.max(...years) : now.getUTCFullYear();
  const firstShown = latest - ARRIVAL_YEARS + 1;
  const cohortMap = new Map();
  for (const p of list) {
    const y = yearOfDate(p.membership_start_date);
    if (!y) continue;
    const key = y < firstShown ? "before" : y;
    if (!cohortMap.has(key)) cohortMap.set(key, { key, label: key === "before" ? `Before ${firstShown}` : String(key), count: 0, parties: new Map() });
    const c = cohortMap.get(key);
    c.count += 1;
    const party = partyName(p);
    if (!c.parties.has(party)) c.parties.set(party, { party, colour: p.party_colour ?? null, count: 0 });
    c.parties.get(party).count += 1;
  }
  const order = ["before", ...Array.from({ length: ARRIVAL_YEARS }, (_, i) => firstShown + i)];
  const arrivals = order.filter((k) => cohortMap.has(k)).map((k) => {
    const c = cohortMap.get(k);
    return { ...c, parties: [...c.parties.values()].sort((a, b) => b.count - a.count) };
  });

  const tenures = list
    .filter((p) => p.membership_start_date)
    .map((p) => ({ name: p.name, years: Math.max(0, (now.getTime() - new Date(p.membership_start_date).getTime()) / YEAR_MS) }));
  const sorted = tenures.map((t) => t.years).sort((a, b) => a - b);
  const maxYears = tenures.reduce((m, t) => Math.max(m, t.years), 0);

  const out = {
    total,
    majorityLine: Math.floor(total / 2) + 1,
    women,
    womenPct: total ? (women / total) * 100 : 0,
    seatsByParty,
    womenByParty,
    largest: seatsByParty[0] ?? null,
    types: [...types.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    arrivals,
    newSinceElection: list.filter((p) => p.membership_start_date && p.membership_start_date >= GENERAL_ELECTION_2024).length,
    medianTenure: median(sorted),
    averageTenure: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0,
    longest: tenures.length ? { names: tenures.filter((t) => maxYears - t.years < 1 / 365.25).map((t) => t.name), years: maxYears } : null,
    inGovernment: list.filter((p) => p.government_role).length,
    career: null,
  };
  if (!careers) return out;

  const rows = list.map((p) => ({ p, c: careers[p.id] })).filter((x) => Array.isArray(x.c));
  const formerMps = rows.filter(({ c }) => c[P.mpFrom] != null);
  const mpByParty = new Map();
  for (const { p } of formerMps) {
    const party = partyName(p);
    if (!mpByParty.has(party)) mpByParty.set(party, { party, colour: p.party_colour ?? null, count: 0, total: byParty.get(party)?.count ?? 0 });
    mpByParty.get(party).count += 1;
  }
  const formerMinisters = rows.filter(({ c }) => c[P.gov] > 0);
  const moves = new Map();
  let switched = 0;
  let nowIndependent = 0;
  for (const { p, c } of rows) {
    // "Non-affiliated" is also where new peers sit until they take a party's
    // whip or become crossbenchers, so a move out of it isn't a change of sides.
    if (!c[P.from] || c[P.from] === "Non-affiliated") continue;
    const isSwitch = c[P.kind] === "s";
    if (isSwitch) switched += 1;
    else nowIndependent += 1;
    const to = isSwitch ? partyName(p) : "Independent";
    const key = `${c[P.from]}→${to}`;
    if (!moves.has(key)) moves.set(key, { from: c[P.from], to, kind: isSwitch ? "switch" : "independent", count: 0, names: [], memberIds: [] });
    const m = moves.get(key);
    m.count += 1;
    m.names.push(p.name);
    m.memberIds.push(p.id);
  }

  out.career = {
    total: rows.length,
    formerMps: {
      count: formerMps.length,
      pct: rows.length ? (formerMps.length / rows.length) * 100 : 0,
      byParty: [...mpByParty.values()].filter((r) => r.total >= 10).map((r) => ({ ...r, pct: (r.count / r.total) * 100 })).sort((a, b) => b.pct - a.pct),
      commonsYears: formerMps.length ? formerMps.reduce((n, { c }) => n + Math.max(0, (c[P.mpTo] ?? now.getUTCFullYear()) - c[P.mpFrom]), 0) / formerMps.length : 0,
    },
    formerMinisters: { count: formerMinisters.length, pct: rows.length ? (formerMinisters.length / rows.length) * 100 : 0 },
    inGovernmentNow: rows.filter(({ c }) => c[P.govNow] === 1).length,
    shadowEver: rows.filter(({ c }) => c[P.opp] > 0).length,
    onCommitteeNow: rows.filter(({ c }) => c[P.commNow] > 0).length,
    switchers: { switched, nowIndependent, transitions: [...moves.values()].sort((a, b) => b.count - a.count || a.from.localeCompare(b.from)).slice(0, 8) },
  };
  return out;
}

export const PEER_FIELDS = P;
