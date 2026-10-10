// Helpers for the Britain-in-numbers pages. They turn the ONS time series the
// pipeline saves (points like ["2026-08", 3.1]) into numbers and plain-English
// sentences. Pure functions, shared by the pipeline and the pages.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_CODES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ONS dates come as "2026 AUG", "2026 Q2" or "2025". Saved as "2026-08", "2026-Q2", "2025".
export function normalisePeriod(freq, raw) {
  const s = String(raw).trim().toUpperCase();
  if (freq === "months") {
    const m = /^(\d{4})\s+([A-Z]{3})/.exec(s);
    const i = m ? MONTH_CODES.indexOf(m[2]) : -1;
    return i < 0 ? null : `${m[1]}-${String(i + 1).padStart(2, "0")}`;
  }
  if (freq === "quarters") {
    const m = /^(\d{4})\s+Q([1-4])$/.exec(s);
    return m ? `${m[1]}-Q${m[2]}` : null;
  }
  return /^\d{4}$/.test(s) ? s : null;
}

// A number you can sort and compare: the year, plus how far through it.
export function periodToT(p) {
  const q = /^(\d{4})-Q([1-4])$/.exec(p);
  if (q) return Number(q[1]) + (Number(q[2]) - 1) / 4;
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if (m) return Number(m[1]) + (Number(m[2]) - 1) / 12;
  return Number(p);
}

export function periodLabel(p) {
  const q = /^(\d{4})-Q([1-4])$/.exec(p);
  if (q) return `${["January to March", "April to June", "July to September", "October to December"][Number(q[2]) - 1]} ${q[1]}`;
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if (m) return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return p;
}

// How a period reads after "in": "August 2026", "the April to June 2026 quarter", "2025".
export function periodInSentence(p) {
  return /^\d{4}-Q[1-4]$/.test(p) ? `the ${periodLabel(p)} quarter` : periodLabel(p);
}

const group = (n) => Math.round(n).toLocaleString("en-GB");
const money = (v, text) => (v < 0 ? `-${text.replace(/^-/, "")}` : text);

// How each kind of number is written. `v` is the raw ONS value.
export function formatValue(format, v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "n/a";
  switch (format) {
    case "pct": return `${v.toFixed(1)}%`;
    case "pct2": return `${v.toFixed(2)}%`;
    case "gbp2": return money(v, `£${Math.abs(v).toFixed(2)}`);
    case "per1000": return v.toFixed(1);
    case "multiple": return `${v.toFixed(1)} years`;
    case "gbp": return money(v, `£${group(Math.abs(v))}`);
    case "gbpbn": return money(v, `£${(Math.abs(v) / 1000).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}bn`); // value in £ million
    case "gbpbn0": return `£${group(v / 1000)}bn`;
    case "thousands": return v >= 1000 ? `${(v / 1000).toFixed(2)} million` : `${group(v)},000`.replace(/^0,000$/, "0");
    case "people": return v >= 1e6 ? `${(v / 1e6).toFixed(1)} million` : group(v);
    case "count": return Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(2)} million` : group(v);
    case "index": return v.toFixed(1);
    case "gbpbnx": return Math.abs(v) >= 100 ? `£${group(v)}bn` : money(v, `£${Math.abs(v).toFixed(1)}bn`); // value already in £ billion
    case "ktonnes": return `${group(v / 1000)} million tonnes`; // value in thousand tonnes
    case "mtoe": return `${v.toFixed(0)} million tonnes of oil equivalent`;
    case "hours": return `${v.toFixed(1)} hours`;
    case "weeks": return `${v.toFixed(1)} weeks`;
    case "minutes": return `${v.toFixed(1)} minutes`;
    case "usd": return `$${v.toFixed(2)}`;
    case "eur": return `€${v.toFixed(2)}`;
    default: return String(v);
  }
}

// Short form for chart axes.
export function formatAxis(format, v) {
  switch (format) {
    case "pct": return `${Number(v.toFixed(1))}%`;
    case "pct2": return `${Number(v.toFixed(2))}%`;
    case "gbp2": return `£${Number(v.toFixed(1))}`;
    case "per1000": return String(Number(v.toFixed(1)));
    case "multiple": return String(Number(v.toFixed(1)));
    case "gbp": return `£${group(v)}`;
    case "gbpbn": return `£${Math.round(v / 1000)}bn`;
    case "gbpbn0": return `£${group(v / 1000)}bn`;
    case "thousands": return v >= 1000 ? `${Number((v / 1000).toFixed(1))}m` : `${group(v)}k`;
    case "people": return v >= 1e6 ? `${Number((v / 1e6).toFixed(0))}m` : group(v);
    case "count": return Math.abs(v) >= 1e6 ? `${Number((v / 1e6).toFixed(1))}m` : Math.abs(v) >= 10000 ? `${Math.round(v / 1000)}k` : group(v);
    case "gbpbnx": return `£${group(v)}bn`;
    case "ktonnes": return `${group(v / 1000)}m`;
    case "mtoe": return `${v.toFixed(0)}`;
    case "hours": return `${Number(v.toFixed(1))}`;
    case "usd": return `$${v.toFixed(2)}`;
    case "eur": return `€${v.toFixed(2)}`;
    default: return String(Number(v.toFixed(1)));
  }
}

// The shortest honest way to write a figure, for places with no room: a label on a small map, a tick on a key.
export function formatCompact(format, v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "n/a";
  const trim = (x, d = 1) => String(Number(x.toFixed(d)));
  switch (format) {
    case "gbp": return Math.abs(v) >= 1e6 ? `£${trim(v / 1e6)}m` : Math.abs(v) >= 1e3 ? `£${trim(v / 1e3, v >= 1e4 ? 0 : 1)}k` : `£${Math.round(v)}`;
    case "gbp2": return `£${trim(v)}`;
    case "multiple": return trim(v);
    case "count": return Math.abs(v) >= 1e6 ? `${trim(v / 1e6)}m` : Math.abs(v) >= 1e4 ? `${trim(v / 1e3, 0)}k` : formatValue("count", v);
    case "people": return Math.abs(v) >= 1e6 ? `${trim(v / 1e6)}m` : Math.abs(v) >= 1e3 ? `${trim(v / 1e3, 0)}k` : String(Math.round(v));
    default: return formatValue(format, v);
  }
}

// How much `to` differs from `from`: percentage points for rates and per cent for
// levels. A level that is zero or negative at either end has no sensible per cent
// change, so it is given as an amount instead.
export function changeBetween(def, from, to) {
  if (def.kind === "rate") return { type: "points", amount: to - from, digits: def.format === "pct2" ? 2 : 1 };
  if (from > 0 && to > 0) return { type: "percent", amount: ((to - from) / from) * 100 };
  if (from === to) return { type: "amount", amount: 0, text: formatValue(def.format, 0) };
  return { type: "amount", amount: to - from, text: formatValue(def.format, Math.abs(to - from)) };
}

// A period as a person would say it. Figures for "the year to March 2026"
// (crime, mainly) are labelled as such rather than as plain "March 2026".
export function labelFor(def, p) {
  if (def?.yearEnding && (/^\d{4}-\d{2}$/.test(p) || /^\d{4}-Q[1-4]$/.test(p))) return `Year to ${yearEndLabel(p)}`;
  return periodLabel(p);
}

// The month a 12-month (or four-quarter) total ends in: "2026-Q2" is "June 2026".
export function yearEndLabel(p) {
  const q = /^(\d{4})-Q([1-4])$/.exec(p);
  return q ? `${MONTHS[Number(q[2]) * 3 - 1]} ${q[1]}` : periodLabel(p);
}

// The latest figure and how it compares with a year earlier.
export function latestInfo(def, points) {
  if (!points?.length) return null;
  const [period, value] = points[points.length - 1];
  const t = periodToT(period);
  const before = points.find(([p]) => Math.abs(periodToT(p) - (t - 1)) < 0.02);
  const info = { period, value, label: labelFor(def, period), before: before ? { period: before[0], value: before[1], label: labelFor(def, before[0]) } : null };
  if (info.before) info.change = changeBetween(def, info.before.value, value);
  return info;
}

export function changeWords(change) {
  if (!change) return "";
  const a = Math.abs(change.amount);
  if (change.type === "amount") return a === 0 ? "little changed on a year earlier" : `${change.amount > 0 ? "up" : "down"} ${change.text} on a year earlier`;
  const unit = change.type === "points" ? (a === 1 ? "percentage point" : "percentage points") : "%";
  const n = a < 10 ? a.toFixed(change.type === "points" ? change.digits ?? 1 : 1) : Math.round(a).toString();
  if (Number(n) === 0) return "little changed on a year earlier";
  const dir = change.type === "points" ? (change.amount > 0 ? "up" : "down") : change.amount > 0 ? "up" : "down";
  return change.type === "points" ? `${dir} ${n} ${unit} on a year earlier` : `${dir} ${n}% on a year earlier`;
}

// When a figure is for, as it follows a value in a sentence: "in August 2026", "in the year to
// March 2026", "as at June 2026".
export function whenPhrase(def, period) {
  const when = def.yearEnding ? `the year to ${yearEndLabel(period)}` : `${def.labelPrefix ?? ""}${periodInSentence(period)}`;
  return `${def.timeWord ?? "in"} ${when}`;
}

// One plain sentence, e.g. "Inflation (CPI) was 3.1% in August 2026, up 0.3 percentage points on a year earlier."
export function sentenceFor(def, points) {
  const info = latestInfo(def, points);
  if (!info) return "";
  const words = changeWords(info.change);
  const verb = def.verb ?? "was";
  const head = `${def.sentenceName ?? def.label} ${verb} ${formatValue(def.format, info.value)} ${whenPhrase(def, info.period)}`;
  return words ? `${head}, ${words}.` : `${head}.`;
}

// Keep the points from `years` years back (0 = everything).
export function sliceRange(points, years) {
  if (!years || !points.length) return points;
  const end = periodToT(points[points.length - 1][0]);
  return points.filter(([p]) => periodToT(p) >= end - years - 0.001);
}

// Round-number tick values for a chart's vertical axis.
export function niceTicks(min, max, count = 4) {
  if (min === max) return [min];
  const span = max - min;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

// A short form of a change, for small print: "up 0.3 pts", "down 4.2%".
export function changeShort(change) {
  if (!change) return "";
  if (change.type === "amount") return change.amount === 0 ? "little changed" : `${change.amount > 0 ? "up" : "down"} ${change.text}`;
  const a = Math.abs(change.amount);
  const n = a < 10 ? a.toFixed(change.type === "points" ? change.digits ?? 1 : 1) : Math.round(a).toString();
  if (Number(n) === 0) return "little changed";
  const dir = change.amount > 0 ? "up" : "down";
  return change.type === "points" ? `${dir} ${n} pts` : `${dir} ${n}%`;
}
