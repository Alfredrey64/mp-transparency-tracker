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
