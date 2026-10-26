// The class mock election: votes are counted by area (like constituencies), each area is won by the party with most votes there (first past the post),
// and the result is set beside what a proportional count would give, so a class can see why the two can differ. Pure, so it can be tested.

export const MIN_PARTIES = 2;
export const MAX_PARTIES = 5;
export const MAX_AREAS = 5;
export const PALETTE = ["#E0367A", "#1E4FB8", "#1FA97C", "#E8741A", "#7A5AF0"];

// votes[area][party] = how many ballots. Returns the totals and each area's winner.
export function count(votes, nParties) {
  const total = Array.from({ length: nParties }, () => 0);
  const areas = votes.map((row, area) => {
    const counts = Array.from({ length: nParties }, (_, p) => Math.max(0, row[p] ?? 0));
    counts.forEach((c, p) => { total[p] += c; });
    const top = Math.max(...counts);
    const leaders = counts.flatMap((c, p) => (c === top && top > 0 ? [p] : []));
    return { area, counts, votes: counts.reduce((a, b) => a + b, 0), winner: leaders.length === 1 ? leaders[0] : null, tied: leaders.length > 1, empty: top === 0 };
  });
  const cast = total.reduce((a, b) => a + b, 0);
  return { total, cast, areas, share: total.map((t) => (cast ? t / cast : 0)) };
}

// Seats by first past the post: one seat per area, to that area's winner. Tied or empty areas give their seat to nobody.
export function seatsFptp(result, nParties) {
  const seats = Array.from({ length: nParties }, () => 0);
  for (const a of result.areas) if (a.winner !== null) seats[a.winner] += 1;
  return seats;
}

// The same number of seats shared out in proportion to votes, by the largest remainder method.
export function seatsProportional(result, nParties) {
  const n = result.areas.length;
  if (!result.cast) return Array.from({ length: nParties }, () => 0);
  const exact = result.share.map((s) => s * n);
  const seats = exact.map(Math.floor);
  let left = n - seats.reduce((a, b) => a + b, 0);
  const order = exact.map((e, p) => [e - Math.floor(e), p]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, p] of order) { if (left <= 0) break; seats[p] += 1; left -= 1; }
  return seats;
}

// One sentence for the class about how votes and seats compare. `names` are the party names.
export function story(result, names) {
  if (!result.cast) return "No votes have been counted yet.";
  const fptp = seatsFptp(result, names.length);
  const topVotes = result.total.indexOf(Math.max(...result.total));
  const topSeats = fptp.indexOf(Math.max(...fptp));
  const pct = (x) => `${Math.round(x * 100)}%`;
  if (result.areas.some((a) => a.tied)) return "At least one area is tied. In a real election a tie is settled by a recount, and in the end by drawing lots. Try a re-vote in the tied area.";
  if (fptp[topSeats] === 0) return "No area has a clear winner yet.";
  if (result.total.filter((t) => t === result.total[topVotes]).length > 1) return "Two parties are level on votes overall.";
  if (topVotes !== topSeats) return `${names[topVotes]} won the most votes (${pct(result.share[topVotes])}) but ${names[topSeats]} won the most areas. That can happen under first past the post, because only the winner in each area counts.`;
  const share = result.share[topSeats];
  const seatShare = fptp[topSeats] / result.areas.length;
  if (seatShare - share >= 0.15) return `${names[topSeats]} won ${pct(share)} of the votes but ${pct(seatShare)} of the areas. First past the post often gives the biggest party more seats than its share of the votes.`;
  return `${names[topSeats]} won the most votes (${pct(share)}) and the most areas.`;
}

// A tidy name: trimmed and capped, with a fallback for a blank one.
export const cleanName = (name, fallback) => String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 28) || fallback;
