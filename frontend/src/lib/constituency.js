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

// --- History ---------------------------------------------------------------

// The Members API's own wording for why someone's time as an MP ended, in
// plain English. Unknown wording is shown as given rather than guessed at.
export function plainEndReason(reason) {
  const r = String(reason ?? "").toLowerCase();
  if (!r) return null;
  if (r.startsWith("dissolution")) return "Left at a general election";
  if (r.startsWith("death")) return "Died in office";
  if (r.startsWith("resignation")) return "Resigned";
  if (r.startsWith("recall")) return "Removed through a recall petition";
  if (r.includes("election court") || r.includes("undue")) return "Election declared void by an election court";
  if (r.startsWith("disqualif")) return "Disqualified from sitting";
  return reason;
}

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const yearOf = (d) => (d ? new Date(d).getFullYear() : null);

// Everyone known to have held a seat, newest first: the sitting MP, then the
// former MPs whose last seat this was. `years` is time served as an MP (for
// the sitting MP, so far), which sizes each stripe in the party-history bar.
// `current`: { name, party, colour, start }. `former`: from constituencyHistory.json.
export function buildSeatTimeline(current, former = [], now = new Date()) {
  const entries = [];
  if (current) {
    const start = current.start ?? null;
    entries.push({
      key: "current", name: current.name, party: current.party ?? null, colour: current.colour ?? null,
      start, end: null, current: true, reason: null,
      years: start ? Math.max(0.05, (now.getTime() - new Date(start).getTime()) / YEAR_MS) : 0.05,
    });
  }
  for (const m of former) {
    entries.push({
      key: `former-${m.id}`, name: m.name, party: m.party ?? null, colour: m.colour ?? null,
      start: m.start ?? null, end: m.end ?? null, current: false, reason: plainEndReason(m.reason),
      years: m.start && m.end ? Math.max(0.05, (new Date(m.end).getTime() - new Date(m.start).getTime()) / YEAR_MS) : 0.05,
    });
  }
  return entries;
}

export function spanLabel(entry) {
  const a = yearOf(entry.start);
  if (entry.current) return a ? `${a} to now` : "Current MP";
  const b = yearOf(entry.end);
  if (a && b) return a === b ? `${a}` : `${a} to ${b}`;
  return b ? `to ${b}` : "";
}

// Where this seat's majority sits among all seats: "more marginal than X%".
export function majorityStanding(seats, key) {
  const all = Object.values(seats).map((s) => s.result?.majorityPct).filter((v) => typeof v === "number");
  const mine = seats[key]?.result?.majorityPct;
  if (typeof mine !== "number" || all.length === 0) return null;
  const smaller = all.filter((v) => v < mine).length;
  return { rankNarrowest: smaller + 1, of: all.length, moreMarginalThanPct: Math.round((all.filter((v) => v > mine).length / all.length) * 100) };
}

// Five-point bins of majority share, as the Numbers page draws them, plus
// the bin a given seat falls in.
export function majorityBins(seats, mine, step = 5, bins = 11) {
  const counts = Array.from({ length: bins }, () => 0);
  for (const s of Object.values(seats)) {
    const v = s.result?.majorityPct;
    if (typeof v === "number") counts[Math.min(bins - 1, Math.floor(v / step))] += 1;
  }
  return { counts, mineBin: typeof mine === "number" ? Math.min(bins - 1, Math.floor(mine / step)) : null, step };
}
