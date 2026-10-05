// Who votes against their own party, and on what. Built from the voting
// records the site already holds (one row per MP per division, with a flag
// for whether they voted with the majority of their own party). "Rebel" here
// means exactly that flag being false. Whip instructions are never
// published, so this is a proxy and the page says so. Pure and tested.

// Independents and the Speaker sit under no party whip, so "against the
// party majority" means nothing for them.
export const NO_PARTY_MAJORITY_CONCEPT = ["independent", "speaker"];

// A floor so one vote can't make a 100% rebel, as on the Rankings page.
export const MIN_VOTES = 10;

// Labour (Co-op) MPs sit and vote as Labour, so they count as one party.
const family = (name) => String(name ?? "").replace(/\s*\(Co-op\)\s*$/i, "").trim() || "Unknown";

const hasWhip = (p) => p && !NO_PARTY_MAJORITY_CONCEPT.includes((p.party ?? "").toLowerCase());

// votes: [{ politician_id, division_id, title, date, voted_aye, aye_count, no_count, voted_with_party_majority }]
// politicians: [{ id, party, ... }]
export function computeRebels(votes, politicians) {
  const byId = new Map(politicians.map((p) => [p.id, p]));
  const mpTally = new Map();
  const partyTally = new Map();
  const divisions = new Map();
  let rebelVotes = 0;
  let countedVotes = 0;

  for (const v of votes) {
    const p = byId.get(v.politician_id);
    if (!hasWhip(p) || v.voted_with_party_majority == null) continue;
    countedVotes += 1;
    const rebel = v.voted_with_party_majority === false;
    if (rebel) rebelVotes += 1;

    const mp = mpTally.get(p.id) ?? { politician: p, total: 0, against: 0 };
    mp.total += 1;
    if (rebel) mp.against += 1;
    mpTally.set(p.id, mp);

    const party = family(p.party);
    const pt = partyTally.get(party) ?? { party, colour: p.party_colour ?? null, votes: 0, against: 0, mps: new Set(), rebels: new Set() };
    pt.votes += 1;
    pt.mps.add(p.id);
    if (rebel) {
      pt.against += 1;
      pt.rebels.add(p.id);
    }
    partyTally.set(party, pt);

    const d = divisions.get(v.division_id) ?? { id: v.division_id, title: v.title, date: v.date, ayes: v.aye_count, noes: v.no_count, tracked: 0, rebels: [] };
    d.tracked += 1;
    if (rebel) d.rebels.push({ politician: p, votedAye: v.voted_aye === true });
    divisions.set(v.division_id, d);
  }

  const mps = [...mpTally.values()];
  const byMp = mps
    .filter((m) => m.total >= MIN_VOTES && m.against > 0)
    .map((m) => ({ ...m, pct: (m.against / m.total) * 100 }))
    .sort((a, b) => b.pct - a.pct || b.against - a.against || (a.politician.name ?? "").localeCompare(b.politician.name ?? ""));
  const byParty = [...partyTally.values()]
    .map((t) => ({ party: t.party, colour: t.colour, votes: t.votes, against: t.against, mps: t.mps.size, rebels: t.rebels.size, pct: t.votes ? (t.against / t.votes) * 100 : 0 }))
    .filter((t) => t.mps >= 5)
    .sort((a, b) => b.pct - a.pct);
  const rebelDivisions = [...divisions.values()]
    .filter((d) => d.rebels.length > 0)
    .map((d) => {
      const parties = new Map();
      for (const r of d.rebels) parties.set(family(r.politician.party), (parties.get(family(r.politician.party)) ?? 0) + 1);
      return { ...d, parties: [...parties.entries()].map(([party, count]) => ({ party, count })).sort((a, b) => b.count - a.count) };
    })
    .sort((a, b) => b.rebels.length - a.rebels.length || String(b.date).localeCompare(String(a.date)));

  return {
    countedVotes,
    rebelVotes,
    rebelPct: countedVotes ? (rebelVotes / countedVotes) * 100 : 0,
    divisionsCounted: divisions.size,
    divisionsWithRebels: rebelDivisions.length,
    mpsWhoRebelled: mps.filter((m) => m.against > 0).length,
    mpsCounted: mps.length,
    byMp,
    byParty,
    rebelDivisions,
  };
}

// Each MP's share of their votes cast against their party: Map(id -> { pct, total, against }).
// Only MPs under a whip with MIN_VOTES or more recorded votes are included.
export function rebelRates(votes, politicians) {
  const byId = new Map(politicians.map((p) => [p.id, p]));
  const tally = new Map();
  for (const v of votes) {
    if (!hasWhip(byId.get(v.politician_id)) || v.voted_with_party_majority == null) continue;
    const t = tally.get(v.politician_id) ?? { total: 0, against: 0 };
    t.total += 1;
    if (v.voted_with_party_majority === false) t.against += 1;
    tally.set(v.politician_id, t);
  }
  const out = new Map();
  for (const [id, t] of tally) if (t.total >= MIN_VOTES) out.set(id, { ...t, pct: (t.against / t.total) * 100 });
  return out;
}
