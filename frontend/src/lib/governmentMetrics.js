// How a handful of national figures moved during each government since 1945. The figures are the Office for National Statistics series
// already used on the Britain in numbers pages (src/data/ons/*.json); this file only decides which ones to show and how to measure a spell
// in office. It describes what happened, not who caused it: most of these numbers depend on events and decisions far beyond any one
// government, and the page says so.

import { GOVERNMENTS } from "../data/governments";

// kind "rate": the figure is already a rate, so a government's spell is summarised by its average and its start and end values.
// kind "level": the figure is an amount that grows or shrinks, so a spell is summarised by its start and end values and the change between.
// `scale: "log"` draws the chart on a log scale, for amounts that grow many-fold.
export const METRICS = [
  { id: "growth", label: "Economic growth", file: "economy", series: "gdp-year", kind: "rate", unit: "%", decimals: 1, page: "economy",
    blurb: "How much the economy (GDP, after inflation) grew compared with the year before, one figure for each calendar year." },
  { id: "unemployment", label: "Unemployment rate", file: "jobs", series: "unemployment", kind: "rate", unit: "%", decimals: 1, page: "jobs",
    blurb: "The share of people aged 16 and over who were looking for work and available to start. The ONS series begins in 1971." },
  { id: "inflation", label: "Inflation (RPI)", file: "prices", series: "rpi", kind: "rate", unit: "%", decimals: 1, page: "prices",
    blurb: "How much prices rose compared with a year earlier, using the Retail Prices Index, which goes back to 1948. The government's main measure today is the CPI, which only goes back to 1989." },
  { id: "bank", label: "Interest rate (Bank Rate)", file: "rates", series: "bank-rate", kind: "rate", unit: "%", decimals: 2, page: "rates",
    blurb: "The Bank of England's main interest rate. It sets the cost of borrowing across the economy. The series begins in 1975, and the Bank has set it independently of ministers since 1997." },
  { id: "employment", label: "Employment rate", file: "jobs", series: "employment", kind: "rate", unit: "%", decimals: 1, page: "jobs",
    blurb: "The share of people aged 16 to 64 who were in work. The ONS series begins in 1971." },
  { id: "size", label: "Size of the economy", file: "economy", series: "gdp-level", kind: "level", unit: "£bn", scale: 1000, decimals: 0, page: "economy",
    blurb: "The total output of the economy after inflation (real GDP, quarterly, in £ billions at today's prices as the ONS measures them)." },
  { id: "income", label: "Household income per person", file: "economy", series: "income-head", kind: "level", unit: "£", decimals: 0, page: "economy",
    blurb: "What households had available to spend each quarter, per person, after tax and after inflation, in 2024 prices." },
  { id: "house", label: "Average house price", file: "housing", series: "hpi-uk", kind: "level", unit: "£", decimals: 0, page: "housing", log: true,
    blurb: "The average price of a home in the UK, in the prices of the day (not adjusted for inflation). Drawn on a scale where each step up is a doubling, so older years are visible." },
  { id: "debt", label: "Public sector net debt", file: "publicFinances", series: "debt", kind: "level", unit: "% of GDP", decimals: 0, page: "publicFinances", change: "points",
    blurb: "What the public sector owes, less what it holds in cash and liquid assets, as a share of a year's national income. The ONS series begins in 1993." },
  { id: "population", label: "Population", file: "population", series: "uk", kind: "level", unit: "million", scale: 1e6, decimals: 1, page: "population",
    blurb: "People living in the UK at mid-year. The ONS series begins in 1971." },
  { id: "homes", label: "New homes completed", file: "housing", series: "homes-completed-q", kind: "level", unit: "a year", annualise: true, decimals: 0, page: "housing",
    blurb: "New homes finished in the UK, shown as the number a year at the quarter's pace. The series begins in 1978." },
  { id: "crime", label: "Crime (survey estimate)", file: "crime", series: "csew-all", kind: "level", unit: "thousand offences", decimals: 0, page: "crime",
    blurb: "Crimes estimated by the Crime Survey for England and Wales, which asks people what happened to them, excluding fraud. It does not depend on what is reported to the police. The series begins in 1981." },
  { id: "emissions", label: "Greenhouse gas emissions", file: "environment", series: "ghg", kind: "level", unit: "million tonnes CO2e", scale: 1000, decimals: 0, page: "environment",
    blurb: "The UK's greenhouse gas emissions each year. The ONS series begins in 1990 and ends in 2023." },
];

const MONTH_MS = 30.4375 * 86400000;
const periodSpan = { years: 12 * MONTH_MS, quarters: 3 * MONTH_MS, months: MONTH_MS };

// "1955-Q2", "1971-02" or "1949" as the moment that period starts.
export function periodStart(period) {
  const s = String(period);
  let m = s.match(/^(\d{4})-Q([1-4])$/);
  if (m) return Date.UTC(+m[1], (+m[2] - 1) * 3, 1);
  m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, 1);
  m = s.match(/^(\d{4})$/);
  if (m) return Date.UTC(+m[1], 0, 1);
  return NaN;
}

// A series ready for measuring: points as [time, value] in order and scaled to the metric's display unit, and how long one period lasts.
export function prepareSeries(metric, series) {
  const f = metric.scale ?? 1;
  const q = metric.annualise ? 4 : 1;
  const points = series.points
    .map(([p, v]) => [periodStart(p), (v * q) / f])
    .filter(([t, v]) => Number.isFinite(t) && Number.isFinite(v))
    .sort((a, b) => a[0] - b[0]);
  return { points, span: periodSpan[series.freq] ?? MONTH_MS };
}

const toTime = (iso) => Date.parse(`${iso}T00:00:00Z`);

// The latest figure published at or before `time`; null if the series has not started.
function valueAt(points, time) {
  let found = null;
  for (const pt of points) {
    if (pt[0] <= time) found = pt;
    else break;
  }
  return found;
}

// How one government fared on one metric: where the figure stood when it began and ended (or the latest figure), and for rates the
// average over the spell. Returns null when the series does not cover enough of the spell to say anything fair.
export function measure(metric, prepared, gov, now = Date.now()) {
  const { points, span } = prepared;
  if (!points.length) return null;
  const from = toTime(gov.from);
  const to = gov.to ? toTime(gov.to) : now;
  const first = points[0][0];
  const covered = (to - Math.max(from, first)) / (to - from);
  if (first > from + span || covered < 0.9) return null;
  const inside = points.filter(([t]) => t + span / 2 >= from && t + span / 2 < to);
  if (!inside.length) return null;
  const start = valueAt(points, from) ?? points[0];
  const end = valueAt(points, to - 1) ?? points[points.length - 1];
  const values = inside.map(([, v]) => v);
  const average = values.reduce((n, v) => n + v, 0) / values.length;
  const startValue = start[1];
  const endValue = end[1];
  let change = endValue - startValue;
  if (metric.kind === "level" && metric.change !== "points") change = startValue ? ((endValue - startValue) / startValue) * 100 : null;
  return {
    start: startValue,
    end: endValue,
    average,
    change,
    peak: Math.max(...values),
    trough: Math.min(...values),
    ongoing: !gov.to,
  };
}

export const measureAll = (metric, prepared, now) => GOVERNMENTS.map((g) => ({ gov: g, m: measure(metric, prepared, g, now) }));

// Format a figure for display: "4.9%", "£272,611", "69.5 million".
export function formatValue(metric, v) {
  if (v == null || !Number.isFinite(v)) return "n/a";
  const n = Math.abs(v).toLocaleString("en-GB", { minimumFractionDigits: metric.decimals, maximumFractionDigits: metric.decimals });
  const sign = v < 0 ? "−" : "";
  switch (metric.unit) {
    case "%": return `${sign}${n}%`;
    case "% of GDP": return `${sign}${n}% of GDP`;
    case "£": return `${sign}£${n}`;
    case "£bn": return `${sign}£${n}bn`;
    case "million": return `${sign}${n} million`;
    case "a year": return `${sign}${n} a year`;
    case "thousand offences": return `${sign}${n} thousand`;
    case "million tonnes CO2e": return `${sign}${n} million tonnes`;
    default: return `${sign}${n} ${metric.unit}`;
  }
}

// "up 37%", "down 4.2 points", "no change".
export function formatChange(metric, change) {
  if (change == null || !Number.isFinite(change)) return "n/a";
  const abs = Math.abs(change);
  const unit = metric.kind === "level" && metric.change !== "points" ? "%" : " points";
  const digits = abs >= 100 ? 0 : abs >= 10 ? 0 : 1;
  const text = abs.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: digits });
  if (Math.round(abs * 10) === 0) return "no change";
  return `${change > 0 ? "up" : "down"} ${text}${unit}`;
}
