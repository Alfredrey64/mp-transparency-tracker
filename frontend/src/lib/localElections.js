// When each council next votes, from councilsIndex.json (each council has `next`: [[date, seats up], ...]). Pure and tested.
import { majorityOf, seatsByParty, longDate } from "./councils";

const NATIONS = { E: "England", S: "Scotland", W: "Wales", N: "Northern Ireland" };
export const nationOf = (id) => NATIONS[String(id ?? "")[0]] ?? "UK";

const isoOf = (d) => d.toISOString().slice(0, 10);

// Whole days from today until an ISO date (0 for today, negative if it has passed).
export function daysUntil(iso, today = new Date()) {
  const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - a) / 86400000);
}

// A council's next election that has not happened yet: { date, seatsUp, days, total, all } or null.
export function nextVote(council, today = new Date()) {
  const entry = (council.next ?? []).find(([date]) => date >= isoOf(today));
  if (!entry) return null;
  return { date: entry[0], seatsUp: entry[1], days: daysUntil(entry[0], today), total: council.total, all: entry[1] >= council.total };
}

// Every upcoming election date, soonest first, with the councils voting on it.
export function upcomingDates(index, today = new Date()) {
  const byDate = new Map();
  for (const c of index) {
    const v = nextVote(c, today);
    if (!v) continue;
    const g = byDate.get(v.date) ?? { date: v.date, days: v.days, councils: [], seats: 0, nations: {} };
    g.councils.push({ id: c.id, name: c.name, seatsUp: v.seatsUp, total: c.total, control: c.control, controlKey: c.control_by_seats });
    g.seats += v.seatsUp;
    const n = nationOf(c.id);
    g.nations[n] = (g.nations[n] ?? 0) + 1;
    byDate.set(v.date, g);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map((g) => ({ ...g, councils: g.councils.sort((a, b) => a.name.localeCompare(b.name)) }));
}

// The date with the most councils voting: the big election day.
export function biggestDate(dates) {
  return dates.reduce((best, d) => (!best || d.councils.length > best.councils.length ? d : best), null);
}

// What is up for grabs at a council, in plain words.
export function atStake(council, parties, today = new Date()) {
  const v = nextVote(council, today);
  if (!v) return null;
  const need = majorityOf(council.total);
  const bySeat = seatsByParty(council, parties);
  const lead = bySeat[0];
  const holds = lead && lead.count >= need;
  const control = holds
    ? `${lead.short} holds ${lead.count} of ${council.total} seats, and ${need} is a majority.`
    : `No party holds a majority. ${need} of ${council.total} seats is a majority${lead ? `, and ${lead.short} is the biggest party with ${lead.count}` : ""}.`;
  const scope = v.all
    ? `All ${council.total} seats are up, so the whole council could change hands.`
    : `${v.seatsUp} of ${council.total} seats are up, so the make-up changes but the whole council does not.`;
  return { ...v, need, control, scope, dateText: longDate(v.date) };
}
