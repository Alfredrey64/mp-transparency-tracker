// Pure helpers for fetch-constituencies.js — kept apart from the script so
// the parts that decide what the Constituency page says can be tested
// without any network access.

// Petition signatures arrive keyed by constituency *name* (and an ONS code
// the Members API doesn't give us), so names have to match across two
// sources. Lower-cased, "&" read as "and", punctuation and spacing ignored.
export function normaliseConstituencyName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// The Members API's candidate list, ranked, reduced to what the page shows.
export function topCandidates(candidates, limit = 4) {
  return [...(candidates ?? [])]
    .filter((c) => typeof c.votes === "number")
    .sort((a, b) => b.votes - a.votes)
    .slice(0, limit)
    .map((c) => ({
      name: c.name,
      party: c.party?.name ?? "Unknown",
      colour: c.party?.backgroundColour ?? null,
      votes: c.votes,
      share: c.voteShare ?? null,
    }));
}

// result: the Members API's LatestElectionResult for one MP.
export function buildResult(result) {
  if (!result) return null;
  const majority = result.majority ?? null;
  const turnout = result.turnout ?? null;
  return {
    title: result.electionTitle ?? null,
    date: result.electionDate ? result.electionDate.slice(0, 10) : null,
    isGeneralElection: result.isGeneralElection ?? null,
    outcome: result.result ?? null,
    majority,
    // Majority as a share of votes cast — the figure "marginal" and "safe"
    // are judged on.
    majorityPct: majority != null && turnout ? (majority / turnout) * 100 : null,
    turnout,
    electorate: result.electorate ?? null,
    turnoutPct: turnout != null && result.electorate ? (turnout / result.electorate) * 100 : null,
    candidates: topCandidates(result.candidates),
  };
}

// petitions: [{ id, action, signaturesByConstituency: [{ name, signature_count }] }]
// Returns Map(normalisedName -> [{ id, action, count, rank }]) holding each
// constituency's top petitions by local signatures, where `rank` is where
// that constituency stands among all of them for that petition.
export function indexPetitions(petitions, perSeat = 3) {
  const bySeat = new Map();
  for (const petition of petitions) {
    const rows = (petition.signaturesByConstituency ?? [])
      .filter((r) => r.signature_count > 0)
      .sort((a, b) => b.signature_count - a.signature_count);
    rows.forEach((row, i) => {
      const key = normaliseConstituencyName(row.name);
      if (!bySeat.has(key)) bySeat.set(key, []);
      bySeat.get(key).push({ id: petition.id, action: petition.action, count: row.signature_count, rank: i + 1, of: rows.length });
    });
  }
  for (const [key, list] of bySeat) bySeat.set(key, list.sort((a, b) => b.count - a.count).slice(0, perSeat));
  return bySeat;
}

// --- National summary, for the Parliament in Numbers page -----------------
// Small enough to ship on its own, so that page doesn't have to load all
// 650 seats just to draw a chart. `seats` is the constituencies map the
// fetch script builds (key -> { name, mp, result }).

const HISTOGRAM_STEP = 5; // points of the vote
const HISTOGRAM_BINS = 11; // 0-5, 5-10 ... 45-50, then 50+

const brief = (seat) => ({
  name: seat.name,
  mp: seat.mp?.name ?? null,
  party: seat.mp?.party ?? null,
  colour: seat.mp?.colour ?? null,
  majority: seat.result.majority,
  majorityPct: seat.result.majorityPct,
});

const median = (sorted) => {
  if (!sorted.length) return 0;
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};

export function summariseConstituencies(seats) {
  const all = Object.values(seats).filter((s) => s.result && s.result.majorityPct != null);
  const histogram = Array.from({ length: HISTOGRAM_BINS }, (_, i) => ({ from: i * HISTOGRAM_STEP, to: i === HISTOGRAM_BINS - 1 ? null : (i + 1) * HISTOGRAM_STEP, count: 0 }));
  for (const s of all) {
    const bin = Math.min(HISTOGRAM_BINS - 1, Math.floor(s.result.majorityPct / HISTOGRAM_STEP));
    histogram[bin].count += 1;
  }
  const byMajority = [...all].sort((a, b) => a.result.majorityPct - b.result.majorityPct);
  const turnouts = all.filter((s) => s.result.turnoutPct != null).sort((a, b) => a.result.turnoutPct - b.result.turnoutPct);
  const share = (s) => s.result.candidates?.[0]?.share;
  const withShare = all.filter((s) => typeof share(s) === "number");
  const pickTurnout = (s) => ({ name: s.name, pct: s.result.turnoutPct });

  return {
    total: all.length,
    histogram,
    narrowest: byMajority.slice(0, 8).map(brief),
    biggest: byMajority.slice(-8).reverse().map(brief),
    turnout: {
      average: turnouts.length ? turnouts.reduce((a, s) => a + s.result.turnoutPct, 0) / turnouts.length : null,
      median: median(turnouts.map((s) => s.result.turnoutPct)),
      highest: turnouts.length ? pickTurnout(turnouts[turnouts.length - 1]) : null,
      lowest: turnouts.length ? pickTurnout(turnouts[0]) : null,
    },
    wonWithUnderHalf: withShare.filter((s) => share(s) < 0.5).length,
    ofWhichWithShare: withShare.length,
    changedHandsAtGeneralElection: all.filter((s) => s.result.isGeneralElection && /gain/i.test(s.result.outcome ?? "")).length,
    decidedAtByElection: all.filter((s) => s.result.isGeneralElection === false).length,
  };
}

// --- Former MPs, for the constituency History tab -------------------------
// member: an item from the Members API search. Each carries only the *last*
// seat they held, which is how the page labels them.
export function toFormerMp(member) {
  const m = member.latestHouseMembership ?? {};
  if (!m.membershipFrom) return null;
  return {
    id: member.id,
    name: member.nameDisplayAs,
    party: member.latestParty?.name ?? null,
    colour: member.latestParty?.backgroundColour ?? null,
    start: m.membershipStartDate ? m.membershipStartDate.slice(0, 10) : null,
    end: m.membershipEndDate ? m.membershipEndDate.slice(0, 10) : null,
    reason: m.membershipEndReason ?? null,
    seat: m.membershipFrom,
  };
}

export function indexFormerMps(members, validSeatKeys) {
  const bySeat = {};
  for (const member of members) {
    const mp = toFormerMp(member);
    if (!mp) continue;
    const key = normaliseConstituencyName(mp.seat);
    if (validSeatKeys && !validSeatKeys.has(key)) continue;
    const { seat, ...rest } = mp; // eslint-disable-line no-unused-vars
    (bySeat[key] ||= []).push(rest);
  }
  for (const list of Object.values(bySeat)) list.sort((a, b) => String(b.end ?? "").localeCompare(String(a.end ?? "")));
  return bySeat;
}
