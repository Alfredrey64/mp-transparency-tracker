import { valueOn } from "./taxRates";

// A price index long enough to show tax allowances and duties in today's money back to the 1940s. The Consumer Prices Index (CPI) only starts in
// 1988, so before that we use the Retail Prices Index (RPI), which the ONS publishes as a yearly rate back to 1948. Working backwards from 1988, each
// month's index is the same month a year later divided by one plus that month's RPI rate. From 1988 the CPI itself is used. Both are ONS series.

const monthKey = (iso) => iso.slice(0, 7);
const addMonths = (key, n) => {
  const total = Number(key.slice(0, 4)) * 12 + (Number(key.slice(5, 7)) - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
};

// cpi: [["1988-01", 48.4], ...] (index, 2015 = 100); rpiRates: [["1948-06", 9.7], ...] (percentage change on a year earlier).
export function buildPriceIndex(cpi, rpiRates) {
  const idx = new Map(cpi);
  const rate = new Map(rpiRates);
  const firstCpi = cpi[0][0];
  let key = addMonths(firstCpi, -1);
  for (;;) {
    const r = rate.get(addMonths(key, 12));
    const next = idx.get(addMonths(key, 12));
    if (r === undefined || next === undefined) break;
    idx.set(key, next / (1 + r / 100));
    key = addMonths(key, -1);
  }
  const months = [...idx.keys()].sort();
  const latestKey = cpi[cpi.length - 1][0];
  const latest = idx.get(latestKey);
  return {
    first: months[0],
    latestKey,
    // How many pounds today equal one pound in the month of this date. Undefined outside the index.
    factor(iso) {
      const v = idx.get(monthKey(iso));
      return v ? latest / v : undefined;
    },
  };
}

let cache = null;
export function loadPriceIndex() {
  if (!cache) {
    cache = Promise.all([import("../data/ons/deflator.json"), import("../data/ons/prices.json")]).then(([d, p]) => buildPriceIndex(d.default.points, p.default.series.rpi.points));
  }
  return cache;
}

export const priceLabel = (index) =>
  new Date(`${index.latestKey}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

// The same line with each month's value converted to today's money. It becomes a smooth line, because in real terms a rate that stays the
// same on paper is losing value every month. `nowIso` is the last day to show.
export function realLine(line, index, nowIso) {
  const points = [];
  const startKey = line.points[0].date.slice(0, 7) > index.first ? line.points[0].date.slice(0, 7) : index.first;
  for (let key = startKey; key <= nowIso.slice(0, 7); key = addMonths(key, 1)) {
    const v = valueOn(line, `${key}-15`);
    const f = index.factor(`${key}-15`);
    if (v === undefined || v === null || !f) continue;
    const date = `${key}-15`;
    const y = Number(key.slice(0, 4));
    const t = y + (Number(key.slice(5, 7)) - 1 + 0.5) / 12;
    points.push({ date, t, value: v * f });
  }
  return {
    ...line,
    points,
    sampled: true,
    valueAt: (iso) => {
      const v = valueOn(line, iso);
      const f = index.factor(iso);
      return v === undefined ? undefined : v === null || !f ? null : v * f;
    },
  };
}
