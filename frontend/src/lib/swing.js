// Marginal seats and swing, worked out from each seat's 2024 result (constituencies.json).
//
// "Swing" here is the two-party swing: the share of the vote one party loses to another, counted in points. If the winner
// leads the runner-up by 6 points, a swing of 3 points from the winner to the runner-up (the winner down 3, the runner-up
// up 3) closes the gap. So the swing a seat needs is half the lead. This is the standard way to describe it; it ignores
// every other party and treats every seat alike, so it is a guide, not a forecast.

// One row per seat with a usable result, with who is first and second and how close it was.
export function seatRows(seats) {
  const rows = [];
  for (const [key, s] of Object.entries(seats ?? {})) {
    const r = s.result;
    const [first, second] = r?.candidates ?? [];
    if (!r || !first || !second || r.majorityPct == null) continue;
    const lead = first.share != null && second.share != null ? (first.share - second.share) * 100 : r.majorityPct;
    rows.push({
      key,
      name: s.name,
      mp: s.mp,
      winner: first.party,
      winnerColour: first.colour,
      second: second.party,
      secondColour: second.colour,
      third: r.candidates[2]?.party ?? null,
      majority: r.majority,
      lead,
      swing: lead / 2,
      turnoutPct: r.turnoutPct ?? null,
      electorate: r.electorate ?? null,
      date: r.date ?? null,
      byElection: r.isGeneralElection === false,
    });
  }
  return rows.sort((a, b) => a.lead - b.lead);
}

// The parties that hold a seat, with how many each, most first.
export function seatsByParty(rows) {
  const counts = new Map();
  for (const r of rows) {
    const c = counts.get(r.winner) ?? { party: r.winner, colour: r.winnerColour, count: 0 };
    c.count++;
    counts.set(r.winner, c);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

// If `points` of the vote moved from `from` to `to` everywhere (a two-party swing), which of `from`'s seats would `to`
// win? Only seats where `to` came second are counted: with a swing this size no third-placed party could overtake.
export function uniformSwing(rows, from, to, points) {
  if (!from || !to || from === to || !(points >= 0)) return [];
  return rows.filter((r) => r.winner === from && r.second === to && r.swing <= points + 1e-9).sort((a, b) => a.swing - b.swing);
}

// How many seats `to` could win from `from` at each whole swing from 0 up to `max` points, for a small chart.
export function swingCurve(rows, from, to, max = 15) {
  const out = [];
  for (let p = 0; p <= max; p++) out.push({ points: p, seats: uniformSwing(rows, from, to, p).length });
  return out;
}

// The parties that come second in at least one seat the other holds: who could plausibly gain from whom.
export function challengers(rows, party) {
  const counts = new Map();
  for (const r of rows) if (r.winner === party) counts.set(r.second, (counts.get(r.second) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, seats]) => ({ name, seats }));
}

// A party's lead in the vote, in points, as a plain phrase.
export function leadPhrase(points) {
  if (points == null) return "";
  if (points < 0.1) return "under 0.1 points";
  return `${points.toFixed(1)} points`;
}
