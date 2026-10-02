// Career facts for the Parliament in Numbers page, from the compact rows
// fetch-mp-careers.js writes (see mpCareers.js at the repo root for the
// field order) joined to the current MP list. Pure and tested.

// General-election years, oldest first. An MP belongs to the cohort of the
// most recent election at or before the year they first entered the Commons,
// so a by-election winner of 2021 is in the "2019 intake".
export const ELECTION_YEARS = [1997, 2001, 2005, 2010, 2015, 2017, 2019, 2024];

const F = { first: 0, elected: 1, gov: 2, govNow: 3, opp: 4, commNow: 5, commEver: 6, lost: 7, from: 8, kind: 9 };

export function cohortKey(firstYear) {
  if (!firstYear) return null;
  const ge = [...ELECTION_YEARS].reverse().find((y) => firstYear >= y);
  return ge ?? "before";
}

const cohortLabel = (key) => (key === "before" ? "Before 1997" : key === 2024 ? "2024 and since" : `${key} intake`);

const family = (name) => String(name ?? "").replace(/\s*\(Co-op\)\s*$/i, "").trim();

export const ELECTED_BANDS = [
  { key: "1", label: "First term", test: (n) => n <= 1 },
  { key: "2-3", label: "2 or 3 terms", test: (n) => n >= 2 && n <= 3 },
  { key: "4-6", label: "4 to 6 terms", test: (n) => n >= 4 && n <= 6 },
  { key: "7+", label: "7 or more", test: (n) => n >= 7 },
];

function topN(list, n, by) {
  return [...list].sort((a, b) => by(b) - by(a) || a.name.localeCompare(b.name)).slice(0, n);
}

// careers: { [parliamentMemberId]: [...fields] }; politicians: rows with
// parliament_member_id, name, party, party_colour.
export function computeCareerStats(careers, politicians) {
  const mps = politicians
    .map((p) => ({ p, c: careers[p.parliament_member_id] }))
    .filter((x) => Array.isArray(x.c));
  const total = mps.length;

  // Intake by year, each split by the party the MP sits for today.
  const cohortMap = new Map();
  for (const { p, c } of mps) {
    const key = cohortKey(c[F.first]);
    if (key == null) continue;
    if (!cohortMap.has(key)) cohortMap.set(key, { key, label: cohortLabel(key), count: 0, parties: new Map() });
    const cohort = cohortMap.get(key);
    cohort.count += 1;
    const party = family(p.party) || "Unknown";
    if (!cohort.parties.has(party)) cohort.parties.set(party, { party, colour: p.party_colour ?? null, count: 0 });
    cohort.parties.get(party).count += 1;
  }
  const order = ["before", ...ELECTION_YEARS];
  const cohorts = order
    .filter((k) => cohortMap.has(k))
    .map((k) => {
      const c = cohortMap.get(k);
      return { ...c, parties: [...c.parties.values()].sort((a, b) => b.count - a.count) };
    });

  const electedBands = ELECTED_BANDS.map((b) => ({ key: b.key, label: b.label, count: mps.filter(({ c }) => b.test(c[F.elected])).length }));

  // Ministerial experience, overall and for the bigger parties.
  const everMinister = mps.filter(({ c }) => c[F.gov] > 0);
  const byPartyMap = new Map();
  for (const { p, c } of mps) {
    const party = family(p.party) || "Unknown";
    if (!byPartyMap.has(party)) byPartyMap.set(party, { party, colour: p.party_colour ?? null, count: 0, everMinister: 0 });
    const row = byPartyMap.get(party);
    row.count += 1;
    if (c[F.gov] > 0) row.everMinister += 1;
  }
  const ministerByParty = [...byPartyMap.values()]
    .filter((r) => r.count >= 10)
    .map((r) => ({ ...r, pct: (r.everMinister / r.count) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  // Who has left a party, and where to.
  const moves = new Map();
  let switched = 0;
  let nowIndependent = 0;
  for (const { p, c } of mps) {
    if (!c[F.from]) continue;
    const isSwitch = c[F.kind] === "s";
    if (isSwitch) switched += 1;
    else nowIndependent += 1;
    const to = isSwitch ? family(p.party) : "Independent";
    const key = `${c[F.from]}→${to}`;
    if (!moves.has(key)) moves.set(key, { from: c[F.from], to, kind: isSwitch ? "switch" : "independent", count: 0, names: [] });
    const m = moves.get(key);
    m.count += 1;
    m.names.push(p.name);
  }
  const transitions = [...moves.values()].sort((a, b) => b.count - a.count || a.from.localeCompare(b.from)).slice(0, 8);

  // Persistence: contests lost before getting in.
  const lostBefore = mps.filter(({ c }) => c[F.lost] > 0);
  const mostLost = topN(lostBefore.map(({ p, c }) => ({ name: p.name, party: p.party, colour: p.party_colour ?? null, times: c[F.lost] })), 3, (x) => x.times);
  const mostElected = topN(mps.map(({ p, c }) => ({ name: p.name, party: p.party, colour: p.party_colour ?? null, times: c[F.elected] })), 3, (x) => x.times);

  return {
    total,
    cohorts,
    electedBands,
    averageElected: total ? mps.reduce((n, { c }) => n + c[F.elected], 0) / total : 0,
    government: {
      everMinister: everMinister.length,
      everMinisterPct: total ? (everMinister.length / total) * 100 : 0,
      inGovernmentNow: mps.filter(({ c }) => c[F.govNow] === 1).length,
      shadowEver: mps.filter(({ c }) => c[F.opp] > 0).length,
      byParty: ministerByParty,
    },
    committees: { onOneNow: mps.filter(({ c }) => c[F.commNow] > 0).length },
    switchers: { switched, nowIndependent, transitions },
    persistence: { lostBefore: lostBefore.length, lostBeforePct: total ? (lostBefore.length / total) * 100 : 0, mostLost },
    mostElected,
  };
}
