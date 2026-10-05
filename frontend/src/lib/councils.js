// Helpers for the Your Council page, over councilsIndex.json (every council:
// seats by party, who runs it, when it next votes) and councilDetail.json
// (wards, councillors and party history). Pure and tested.
import { partyColourByName } from "./careerTimeline";

export const normCouncil = (name) => String(name ?? "").toLowerCase().replace(/['’]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

export function partyDisplay(parties, idx) {
  const p = parties[idx] ?? { short: "Unknown", colour: null };
  return { name: p.name ?? p.short, short: p.short, colour: p.colour ?? partyColourByName(p.short) };
}

// A council's seats by party, biggest first, with each party's share.
export function seatsByParty(council, parties) {
  return council.seats.map(([idx, count]) => ({ ...partyDisplay(parties, idx), idx, count, pct: council.total ? (count / council.total) * 100 : 0 }));
}

// Seats needed for a majority of the whole council.
export const majorityOf = (total) => Math.floor(total / 2) + 1;

const LONG_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const longDate = (iso) => LONG_DATE.format(new Date(`${iso}T00:00:00Z`));

// "All 57 seats are up on 2 May 2030", or, where a council elects in parts,
// "19 of 57 seats are up on 6 May 2027, then more in 2028 and 2030".
export function nextElectionText(council) {
  const next = council.next ?? [];
  if (!next.length) return "No election date is recorded.";
  const [firstDate, firstCount] = next[0];
  if (next.length === 1) return `All ${council.total} seats are up on ${longDate(firstDate)}.`;
  const later = next.slice(1).map(([d]) => d.slice(0, 4));
  return `${firstCount} of ${council.total} seats are up on ${longDate(firstDate)}, then more in ${[...new Set(later)].join(" and ").replace(/ and (\d{4}) and /g, ", $1 and ")}.`;
}

// What kind of body runs the council: the party for "X majority", "X minority"
// or "X elected mayor"; "Partnership" for several; "No overall control".
export function controlGroup(label) {
  if (/^No overall control/i.test(label)) return "No overall control";
  if (/partnership/i.test(label)) return "A partnership of parties";
  const m = /^(.+?) (majority|minority|largest party|elected mayor)$/i.exec(label);
  return m ? m[1] : label;
}

export function searchCouncils(index, query, limit = 12) {
  const q = normCouncil(query);
  if (q.length < 2) return [];
  const starts = [];
  const contains = [];
  for (const c of index) {
    const n = normCouncil(c.name);
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}

// A postcode lookup (from postcodes.io) -> the councils that cover it, by ONS code.
export function councilsForCodes(index, codes) {
  const byId = new Map(index.map((c) => [c.id, c]));
  return {
    district: byId.get(codes?.admin_district) ?? null,
    county: byId.get(codes?.admin_county) ?? null,
  };
}

// Everything on the national overview.
export function nationalSummary(index, parties) {
  const seats = new Map();
  const control = new Map();
  const dates = new Map();
  let councillors = 0;
  for (const c of index) {
    councillors += c.total;
    for (const [idx, n] of c.seats) seats.set(idx, (seats.get(idx) ?? 0) + n);
    const g = controlGroup(c.control);
    control.set(g, (control.get(g) ?? 0) + 1);
    if (c.next?.length) dates.set(c.next[0][0], { councils: (dates.get(c.next[0][0])?.councils ?? 0) + 1, seats: (dates.get(c.next[0][0])?.seats ?? 0) + c.next[0][1] });
  }
  const byParty = [...seats.entries()].map(([idx, count]) => ({ ...partyDisplay(parties, idx), idx, count, pct: councillors ? (count / councillors) * 100 : 0 })).sort((a, b) => b.count - a.count);
  const colourOfGroup = (g) => byParty.find((p) => p.short === g)?.colour ?? (g === "No overall control" ? "#8A8FA8" : g === "A partnership of parties" ? "#B0734A" : partyColourByName(g));
  return {
    councils: index.length,
    councillors,
    byParty,
    control: [...control.entries()].map(([group, count]) => ({ group, count, colour: colourOfGroup(group) })).sort((a, b) => b.count - a.count),
    nextDates: [...dates.entries()].map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// The history rows as objects: { year, total, con, lab, ... }.
export function historyRows(detail, columns) {
  return (detail?.history ?? []).map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
}

// Matches a ward name from a postcode lookup to a council's wards, ignoring
// case, punctuation and "&" versus "and".
export function findWard(wards, name) {
  const n = normCouncil(name);
  if (!n) return null;
  return wards.find(([w]) => normCouncil(w) === n) ?? wards.find(([w]) => normCouncil(w).includes(n) || n.includes(normCouncil(w))) ?? null;
}
