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

// ---- Control, changes of hands and defections --------------------------------

// Who can control a council, as the pipeline names them, and how each is shown.
export const CONTROL = {
  lab: { label: "Labour", colour: "#d50000" },
  con: { label: "Conservative", colour: "#0063ba" },
  ld: { label: "Liberal Democrat", colour: "#fc7d0b" },
  ref: { label: "Reform UK", colour: "#12b6cf" },
  green: { label: "Green", colour: "#78b82a" },
  snp: { label: "SNP", colour: "#d9b900" },
  pc: { label: "Plaid Cymru", colour: "#348837" },
  ukip: { label: "UKIP", colour: "#70147a" },
  other: { label: "Independents and others", colour: "#909090" },
  noc: { label: "No overall control", colour: "#5b6075" },
};
export const CONTROL_ORDER = ["lab", "con", "ld", "ref", "green", "snp", "pc", "ukip", "other", "noc"];
export const controlLabelOf = (key) => CONTROL[key]?.label ?? key;
export const controlColourOf = (key) => CONTROL[key]?.colour ?? "#909090";

// The trend as rows of { year, counts: {key: n} } with every key present.
export function controlTrend(trend) {
  return (trend ?? []).map(({ year, ...counts }) => ({ year, counts: Object.fromEntries(CONTROL_ORDER.map((k) => [k, counts[k] ?? 0])), total: Object.values(counts).reduce((n, v) => n + v, 0) }));
}

// Councils that changed control in the latest year: how many, where each party
// gained and lost, and the most common moves.
export function changesSummary(changes) {
  const gained = {};
  const lost = {};
  const flows = new Map();
  for (const c of changes ?? []) {
    gained[c.to] = (gained[c.to] ?? 0) + 1;
    lost[c.from] = (lost[c.from] ?? 0) + 1;
    const k = `${c.from}>${c.to}`;
    flows.set(k, (flows.get(k) ?? 0) + 1);
  }
  const net = CONTROL_ORDER.filter((k) => k !== "noc" || gained.noc || lost.noc).map((key) => ({ key, gained: gained[key] ?? 0, lost: lost[key] ?? 0, net: (gained[key] ?? 0) - (lost[key] ?? 0) })).filter((r) => r.gained || r.lost);
  return {
    total: (changes ?? []).length,
    net: net.sort((a, b) => b.net - a.net),
    flows: [...flows.entries()].map(([k, count]) => ({ from: k.split(">")[0], to: k.split(">")[1], count })).sort((a, b) => b.count - a.count),
  };
}

// Councillors who changed party: the biggest moves with names, and how many
// each party gained and lost overall.
export function defectionSummary(defections, parties) {
  if (!defections) return null;
  const gained = new Map();
  const lost = new Map();
  for (const f of defections.flows) {
    gained.set(f.to, (gained.get(f.to) ?? 0) + f.count);
    lost.set(f.from, (lost.get(f.from) ?? 0) + f.count);
  }
  const ids = new Set([...gained.keys(), ...lost.keys()]);
  const net = [...ids].map((idx) => ({ ...partyDisplay(parties, idx), idx, gained: gained.get(idx) ?? 0, lost: lost.get(idx) ?? 0, net: (gained.get(idx) ?? 0) - (lost.get(idx) ?? 0) })).sort((a, b) => b.net - a.net);
  return {
    since: defections.since,
    total: defections.total,
    flows: defections.flows.map((f) => ({ ...f, fromParty: partyDisplay(parties, f.from), toParty: partyDisplay(parties, f.to) })),
    net,
    byCouncil: defections.byCouncil,
  };
}

// Each party's councillors now against the previous list: [{ ...party, count, before, change }].
export function seatChanges(byParty, previousSeats) {
  const before = new Map(previousSeats ?? []);
  return byParty.map((p) => ({ ...p, before: before.get(p.idx) ?? 0, change: p.count - (before.get(p.idx) ?? 0) }));
}
