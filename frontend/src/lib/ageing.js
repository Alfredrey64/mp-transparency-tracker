import raw from "../data/ageingData.json";
import { PENSION_RATES } from "../data/ageing";

// Working things out from the Ageing and pensions page's figures (ageingData.json, built by scripts/build-ageing-data.mjs) so the words and the
// charts cannot drift apart.

export const A = raw;
export const last = (a) => a[a.length - 1];
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

// Each April's rise in the full new State Pension, in percent, and what set it.
export function rises() {
  return PENSION_RATES.slice(1).map((r, i) => ({ year: r.year, rise: round((r.weekly / PENSION_RATES[i].weekly - 1) * 100), setBy: r.setBy, weekly: r.weekly }));
}

// Pension, prices and earnings with April 2016 as 100.
export function indexed() {
  const base = (a) => a.map((v) => round((v / a[0]) * 100));
  return { years: A.years, pension: base(A.pension), prices: base(A.pricesIndex), earnings: base(A.earningsWeekly) };
}

// The pension as a share of average weekly earnings each April.
export const shareOfEarnings = () => A.pension.map((p, i) => round((p / A.earningsWeekly[i]) * 100));

// What the full pension would be now if it had risen with prices, with earnings, or by 2.5% a year since 2016.
export function whatIf() {
  const p0 = A.pension[0];
  const n = A.years.length - 1;
  return {
    actual: last(A.pension),
    earnings: round(p0 * (last(A.earningsWeekly) / A.earningsWeekly[0]), 2),
    prices: round(p0 * (last(A.pricesIndex) / A.pricesIndex[0]), 2),
    minimum: round(p0 * 1.025 ** n, 2),
  };
}

// How many rises each measure set.
export function countSetBy() {
  return rises().reduce((acc, r) => ({ ...acc, [r.setBy]: (acc[r.setBy] ?? 0) + 1 }), {});
}
