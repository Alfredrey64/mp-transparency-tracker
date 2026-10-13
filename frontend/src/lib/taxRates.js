import SERIES from "../data/taxSeries.json";
import { GROUPS, TAXES } from "../data/taxCatalogue";
import { GOVERNMENTS } from "../data/governments";
import { chancellorOn } from "../data/chancellors";

// Turns the saved tax rate steps into what the Tax rates through time page shows: values on any date, every change with who decided it, and
// the headline rates for each government.
//
// A rate holds from its date until the next step. A value of null means the tax or band was not charged from that date.
// Who decided a change: the government and Chancellor in office on the `ann` date when one is given (the Budget at which it was set), and
// otherwise on the day it began. A Chancellor is only named when we can be sure which one it was: when a series gives no decision date and the
// Chancellor had been in the job for under a year, the Budget that set the rate may have been the previous Chancellor's, so only the
// government is named.

export const UNITS = {
  pct: { text: (v) => `${trim(v)}%`, axis: (v) => `${trim(v)}%` },
  gbp0: { text: (v) => `£${Math.round(v).toLocaleString("en-GB")}`, axis: (v) => (v >= 1000 ? `£${trim(v / 1000)}k` : `£${trim(v)}`) },
  gbp2: { text: (v) => `£${v.toFixed(2)}`, axis: (v) => `£${trim(v)}` },
  // Pounds, but shown in pence when under a pound (a pint of beer).
  gbpp: { text: (v) => (v < 1 ? `${(v * 100).toFixed(1)}p` : `£${v.toFixed(2)}`), axis: (v) => (v < 1 ? `${Math.round(v * 100)}p` : `£${trim(v)}`) },
  pence: { text: (v) => `${trim(v)}p`, axis: (v) => `${trim(v)}p` },
  pence1: { text: (v) => `${v.toFixed(1)}p`, axis: (v) => `${trim(v)}p` },
  pence3: { text: (v) => `${trim(Math.round(v * 1000) / 1000)}p`, axis: (v) => `${trim(v)}p` },
};

function trim(v) {
  return String(Math.round(v * 100) / 100);
}

export const fmt = (unit, v) => (v === null || v === undefined ? "none" : (UNITS[unit] ?? UNITS.pct).text(v));

const DAY = 86400000;
export const toT = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const y = d.getUTCFullYear();
  return y + (d - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
};
export const todayIso = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

const COLOURS = ["#0E9AA7", "#E07A1F", "#7B5BD6", "#D4577A", "#3E8E41", "#B58A1A"];

const longDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
export const whenText = (point) => (point.p === "m" ? monthDate(point.date) : longDate(point.date));

// ----- who was in charge -----

export function governmentOn(iso) {
  return GOVERNMENTS.find((g) => g.from <= iso && (g.to === null || iso < g.to)) ?? null;
}

// The party word used on the page.
export const PARTY_NAMES = { l: "Labour", c: "Conservative", lc: "Conservative and Liberal Democrat" };

// ----- lines and changes -----

function buildLine(taxId, spec, index, panelUnit) {
  const raw = SERIES[spec.key];
  if (!raw) throw new Error(`No series for ${spec.key}`);
  const budgetDay = spec.key.startsWith("tobacco.");
  const points = raw.map(([date, value, opts = {}]) => ({ date, t: toT(date), value, ann: opts.ann ?? null, note: opts.note ?? null, p: opts.p ?? null, budgetDay }));
  return { key: spec.key, taxId, label: spec.label, unit: panelUnit, kind: spec.kind ?? "rate", intro: Boolean(spec.intro), colour: COLOURS[index % COLOURS.length], points };
}

const taxCache = new Map();
export function getTax(id) {
  if (taxCache.has(id)) return taxCache.get(id);
  const t = TAXES.find((x) => x.id === id);
  if (!t) return null;
  const panels = t.panels.map((panel) => ({ ...panel, lines: panel.lines.map((l, i) => buildLine(t.id, l, i, panel.unit)) }));
  const lines = panels.flatMap((p) => p.lines);
  const headline = lines.find((l) => l.key === t.headline) ?? lines[0];
  const out = { ...t, panels, lines, headline, group: GROUPS.find((g) => g.key === t.group) };
  taxCache.set(id, out);
  return out;
}

export const allTaxes = () => TAXES.map((t) => getTax(t.id));

// The value in force on a date, or undefined before the line begins.
export function valueOn(line, iso) {
  let found;
  for (const p of line.points) {
    if (p.date <= iso) found = p;
    else break;
  }
  return found ? found.value : undefined;
}

export function pointOn(line, iso) {
  let found = null;
  for (const p of line.points) {
    if (p.date <= iso) found = p;
    else break;
  }
  return found;
}

// Who set a change. `chancellor` is null when it cannot be named with confidence.
export function decidedBy(point) {
  const when = point.ann ?? point.date;
  const gov = governmentOn(when);
  const c = chancellorOn(when);
  const sure = point.ann || point.budgetDay ? true : c && c.days >= 330;
  return { gov, chancellor: sure ? c : null, decidedEarlier: Boolean(point.ann && point.ann !== point.date) };
}

// Every change on a line, oldest first: what it went from and to, and who decided it.
export function changesOf(line) {
  return line.points.map((p, i) => {
    const prev = i === 0 ? null : line.points[i - 1];
    const from = prev ? prev.value : null;
    const to = p.value;
    // The first step of a line is a real start (the tax or band was brought in) when `intro` is set, and otherwise only where our record begins.
    const first = i === 0 && !line.intro;
    let move;
    if (i === 0) move = first ? "record" : "start";
    else if (to === null) move = "end";
    else if (from === null) move = "start";
    else move = to > from ? "up" : "down";
    // Does the change mean people pay more or less? Allowances work the other way round.
    let effect = null;
    if (move === "up") effect = line.kind === "allowance" ? "less" : "more";
    else if (move === "down") effect = line.kind === "allowance" ? "more" : "less";
    else if (move === "start") effect = line.kind === "allowance" ? "less" : "more";
    else if (move === "end") effect = line.kind === "allowance" ? "more" : "less";
    return { line, point: p, date: p.date, from, to, move, effect, first, ...decidedBy(p) };
  });
}

export function allChanges(tax) {
  return tax.lines.flatMap((l) => changesOf(l)).filter((c) => !c.first).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// One sentence describing a change for a screen reader or a list.
export function changeText(c) {
  const u = c.line.unit;
  if (c.move === "record") return `${c.line.label}: ${fmt(u, c.to)} where our record begins`;
  if (c.move === "start") return `${c.line.label}: brought in at ${fmt(u, c.to)}`;
  if (c.move === "end") return `${c.line.label}: no longer charged`;
  return `${c.line.label}: ${c.move === "up" ? "up" : "down"} from ${fmt(u, c.from)} to ${fmt(u, c.to)}`;
}

// ----- by government -----

// The tax changes whose decision fell in a government's time, across every tax. Steps that begin a line's record (the first entry) are
// left out, because they are where our data starts, not a change.
export function changesByGovernment(govId, now = Date.now()) {
  const gov = GOVERNMENTS.find((g) => g.id === govId);
  if (!gov) return [];
  const today = todayIso(now);
  const out = [];
  for (const tax of allTaxes()) {
    for (const line of tax.lines) {
      for (const c of changesOf(line)) {
        if (c.first) continue;
        if (c.date > today) continue;
        const g = c.gov;
        if (g && g.id === govId) out.push({ ...c, tax });
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Headline rates to compare across governments: [tax id, line key, short label].
export const HEADLINES = [
  ["income-tax", "incomeTax.basic", "Basic rate of income tax"],
  ["income-tax", "incomeTax.top", "Top rate of income tax"],
  ["national-insurance", "ni.employee", "Employee National Insurance"],
  ["national-insurance", "ni.employer", "Employer National Insurance"],
  ["vat", "vat.standard", "VAT"],
  ["corporation-tax", "corp.main", "Corporation tax"],
  ["fuel", "fuel.petrol", "Fuel duty on petrol"],
  ["cgt", "cgt.higher", "Capital gains tax, higher rate"],
  ["inheritance-tax", "iht.nrb", "Inheritance tax free band"],
  ["council-tax", "councilTax.bandD", "Average Band D council tax"],
];

export function headlineLine(taxId, key) {
  return getTax(taxId).lines.find((l) => l.key === key);
}

// The headline rates at the start and end of a government.
export function headlinesFor(govId, now = Date.now()) {
  const gov = GOVERNMENTS.find((g) => g.id === govId);
  if (!gov) return [];
  const today = todayIso(now);
  const startIso = gov.from;
  const lastDay = gov.to ? new Date(Date.parse(gov.to) - DAY).toISOString().slice(0, 10) : today;
  return HEADLINES.map(([taxId, key, label]) => {
    const line = headlineLine(taxId, key);
    const start = valueOn(line, startIso);
    const end = valueOn(line, lastDay);
    return { taxId, key, label, unit: line.unit, kind: line.kind, start: start === undefined ? undefined : start, end: end === undefined ? undefined : end, firstDate: line.points[0].date };
  });
}

// What a tax looks like today and when it last changed.
export function nowSummary(tax, now = Date.now()) {
  const today = todayIso(now);
  const line = tax.headline;
  const value = valueOn(line, today);
  const point = pointOn(line, today);
  return { value, since: point ? point.date : null, line };
}

// Steps that have not begun yet.
export function comingUp(tax, now = Date.now()) {
  const today = todayIso(now);
  return allChanges(tax).filter((c) => c.date > today);
}

// Changes already in force.
export function pastChanges(tax, now = Date.now()) {
  const today = todayIso(now);
  return allChanges(tax).filter((c) => c.date <= today);
}
