// Looking a seat up by name across every general election since 1950, using data/electionSeatNames.json. A seat is matched by its name alone, so
// a seat redrawn under the same name counts as the same seat. Names that changed, and seats created in 2024, only appear from when they got
// their present name.

import { groupOf2024 } from "./electionHistory";

// The same name-matching the data was built with (scripts/build-election-history.mjs).
export const norm = (s) => String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/\bst\.? /g, "st ").replace(/[^a-z0-9]+/g, " ").trim();
const bag = (s) => norm(s).split(" ").sort().join(" ");

export function buildIndex(book) {
  const byNorm = new Map();
  const byBag = new Map();
  book.names.forEach((n, i) => { byNorm.set(norm(n), i); byBag.set(bag(n), i); });
  return { byNorm, byBag };
}

export function findSeat(index, name) {
  return index.byNorm.get(norm(name)) ?? index.byBag.get(bag(name)) ?? -1;
}

export function searchSeats(book, query, limit = 8) {
  const q = norm(query);
  if (q.length < 2) return [];
  const starts = [];
  const contains = [];
  book.names.forEach((n, i) => {
    const m = norm(n);
    if (m.startsWith(q)) starts.push({ i, name: n });
    else if (m.includes(q)) contains.push({ i, name: n });
  });
  return [...starts, ...contains].slice(0, limit);
}

// The seat's winners, oldest first. `now` is its 2024 result ({ group, band } or null) if a seat of that name was fought in 2024.
export function seatTimeline(book, i, now) {
  const items = book.elections
    .map((id, k) => ({ id, group: book.w[i][k] === "." ? null : book.w[i][k], band: book.b[i][k] === "." ? null : Number(book.b[i][k]) }))
    .filter((t) => t.group);
  if (now) items.push({ id: "2024", group: now.group, band: now.band });
  return items;
}

// The 2024 result of a seat by name, from constituencies.json (keyed by seat name).
export function result2024(constituencies, name) {
  const key = norm(name);
  const seat = Object.values(constituencies).find((s) => norm(s.name) === key) ?? Object.values(constituencies).find((s) => bag(s.name) === bag(name));
  const r = seat?.result;
  if (!r?.candidates?.length || r.isGeneralElection === false) return seat ? { name: seat.name, group: null, byElection: true } : null;
  const lead = r.majorityPct ?? 0;
  return { name: seat.name, group: groupOf2024(r.candidates[0].party), band: Math.min(9, Math.floor(lead / 5)), lead, party: r.candidates[0].party, runnerUp: r.candidates[1]?.party ?? null };
}

// A few plain facts about a run of winners: how often the seat changed hands and the longest unbroken run.
export function summarise(timeline) {
  let changes = 0;
  let best = { group: null, length: 0 };
  let run = { group: null, length: 0 };
  const held = {};
  timeline.forEach((t, k) => {
    held[t.group] = (held[t.group] ?? 0) + 1;
    if (k > 0 && timeline[k - 1].group !== t.group) changes += 1;
    run = run.group === t.group ? { group: t.group, length: run.length + 1 } : { group: t.group, length: 1 };
    if (run.length > best.length) best = { ...run };
  });
  return { changes, longest: best, current: run, held, elections: timeline.length };
}
