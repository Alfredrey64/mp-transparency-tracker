import raw from "../data/educationData.json";
import cpiRaw from "../data/ons/deflator.json";
import { FEE_HISTORY, UNIVERSITY } from "../data/education";

// Working things out from the Education page's data (educationData.json, built by scripts/build-education-data.mjs from the Department for
// Education's open statistics), so the words and the charts cannot drift apart.

export const E = raw;
export const last = (a) => a[a.length - 1];
export const lastNonNull = (a) => { for (let i = a.length - 1; i >= 0; i -= 1) if (a[i] !== null && a[i] !== undefined) return a[i]; return null; };
export const at = (years, values, year) => values[years.indexOf(year)] ?? null;

// 2024 -> "2024/25": the academic year that starts in 2024.
export const academicYear = (y) => `${y}/${String(y + 1).slice(2)}`;
// Academic years start in September, so a point for 2024/25 sits two thirds of the way into 2024 on a chart.
export const AUTUMN = 0.67;

export const millions = (v) => `${(v / 1e6).toFixed(2)} million`;
export const thousands = (v) => Math.round(v).toLocaleString("en-GB");

// The gap between two groups, year by year.
export const gap = (a, b) => a.map((v, i) => (v === null || b[i] === null ? null : Math.round((v - b[i]) * 10) / 10));

// Tuition fees in the prices of August 2026 (or the latest month): each year's cap times the change in consumer prices since that August.
const cpi = new Map(cpiRaw.points);
const latestCpi = cpiRaw.points[cpiRaw.points.length - 1];
export function feeHistory() {
  const target = latestCpi[1];
  return FEE_HISTORY.map(({ year, fee }) => ({ year, fee, real: Math.round(fee * (target / (cpi.get(`${year}-08`) ?? target))) }));
}
export const cpiMonth = latestCpi[0];

// What a person with a given pay repays in a year on each kind of loan: a share of pay above a threshold, the rule GOV.UK gives.
export function repayments(pay) {
  return [
    ...UNIVERSITY.thresholds.map((t) => ({ plan: t.plan, threshold: t.value, rate: t.rate ?? UNIVERSITY.rate, yearly: Math.round(Math.max(0, pay - t.value) * ((t.rate ?? UNIVERSITY.rate) / 100)) })),
  ];
}
