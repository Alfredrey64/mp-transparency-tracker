// Plain-English reading of a constituency's election result.

// "Marginal" and "safe" have no official definition — these are the bands
// this site uses, as a share of votes cast, and the page says so.
export const SAFETY_BANDS = [
  { max: 5, key: "marginal", label: "Marginal seat", blurb: "A small swing could change who wins it." },
  { max: 20, key: "fairly-safe", label: "Fairly safe seat", blurb: "It would take a sizeable swing to change hands." },
  { max: Infinity, key: "safe", label: "Safe seat", blurb: "The winner has a large lead; it would take a very big swing to lose it." },
];

export function seatSafety(majorityPct) {
  if (majorityPct == null || Number.isNaN(majorityPct)) return null;
  return SAFETY_BANDS.find((b) => majorityPct < b.max);
}

// The winning party's lead over the runner-up, in votes and in points of
// the vote — the plain way to say how close it was.
export function leadOverSecond(candidates) {
  if (!candidates || candidates.length < 2) return null;
  const [first, second] = candidates;
  return { winner: first, runnerUp: second, votes: first.votes - second.votes, points: first.share != null && second.share != null ? (first.share - second.share) * 100 : null };
}

const normalise = (s) => String(s ?? "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

// Finds seats by constituency name or by their MP's name. Names that start
// with the search come first, then those that merely contain it.
export function searchSeats(seats, query, limit = 8) {
  const q = normalise(query);
  if (q.length < 2) return [];
  const scored = [];
  for (const [key, seat] of Object.entries(seats)) {
    const seatName = normalise(seat.name);
    const mpName = normalise(seat.mp?.name);
    let score = -1;
    if (seatName.startsWith(q)) score = 0;
    else if (mpName.startsWith(q) || mpName.split(" ").some((w) => w.startsWith(q))) score = 1;
    else if (seatName.includes(q)) score = 2;
    else if (mpName.includes(q)) score = 3;
    if (score >= 0) scored.push({ key, seat, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.seat.name.localeCompare(b.seat.name)).slice(0, limit).map((s) => ({ key: s.key, ...s.seat }));
}

export const seatKey = normalise;

// 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th ... 21st, 22nd.
export function ordinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
}
