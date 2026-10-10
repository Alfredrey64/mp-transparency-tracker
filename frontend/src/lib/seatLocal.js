// What can honestly be said about a single seat's local area. The ONS publishes house prices, pay and jobs for the 12 regions and
// nations, not for individual seats, so these figures describe the region a seat sits in and say so. Deprivation is the exception:
// it is measured for neighbourhoods and rolled up to each seat.

import { METRICS, REGIONS as REGION_LIST } from "../data/regionMetrics";
import { seatKey } from "./constituency";

// The region codes the seat map uses, mapped to the keys used by the regional figures.
export const REGION_KEY_BY_CODE = {
  E12000001: "ne",
  E12000002: "nw",
  E12000003: "yh",
  E12000004: "em",
  E12000005: "wm",
  E12000006: "east",
  E12000007: "london",
  E12000008: "se",
  E12000009: "sw",
  W92000004: "wales",
  S92000003: "scotland",
  N92000002: "ni",
};

const lastPoint = (item) => {
  const p = item?.points?.at(-1);
  return p ? { period: p[0], value: p[1] } : null;
};

// Where one region ranks among all of them, 1 being the highest.
function rankOf(values, key) {
  const mine = values[key];
  if (mine == null) return null;
  const all = Object.values(values).filter((v) => v != null);
  return { rank: all.filter((v) => v > mine).length + 1, of: all.length };
}

// For each regional measure: this region's latest figure, the UK's, and where the region ranks.
// `lookup(ref)` returns a saved series ({ points }) for a { sector, id } reference.
export function regionSnapshot(regionKey, lookup) {
  return METRICS.map((m) => {
    const ref = m.series[regionKey];
    const mine = ref ? lastPoint(lookup(ref)) : null;
    if (!mine) return null;
    const uk = lastPoint(lookup(m.uk));
    const values = {};
    for (const r of REGION_LIST) {
      const p = m.series[r.key] ? lastPoint(lookup(m.series[r.key])) : null;
      values[r.key] = p?.value ?? null;
    }
    return { metric: m, value: mine.value, period: mine.period, uk: uk?.value ?? null, ukPeriod: uk?.period ?? null, ...(rankOf(values, regionKey) ?? { rank: null, of: null }) };
  }).filter(Boolean);
}

// Years of typical pay needed to buy the average home, from the region's house price and pay.
export function yearsOfPay(snapshot) {
  const price = snapshot.find((s) => s.metric.id === "price");
  const pay = snapshot.find((s) => s.metric.id === "pay");
  if (!price || !pay || !(pay.value > 0)) return null;
  const years = price.value / pay.value;
  const ukYears = price.uk != null && pay.uk > 0 ? price.uk / pay.uk : null;
  return { years, ukYears };
}

// "a little above the UK figure" style wording for a regional figure against the UK's.
export function againstUk(value, uk, { rate = false } = {}) {
  if (value == null || uk == null) return "";
  const diff = value - uk;
  const rel = uk !== 0 ? Math.abs(diff) / Math.abs(uk) : 0;
  if (rel < 0.03) return "about the same as the UK";
  const more = diff > 0;
  if (rate) return `${more ? "above" : "below"} the UK figure`;
  if (rel >= 0.5) return `${Math.round(rel * 100)}% ${more ? "above" : "below"} the UK average`;
  return `${more ? "above" : "below"} the UK average`;
}

// One seat's deprivation, from the index of its own nation. The rank is by the share of the area in the most deprived tenth,
// the figure shown, so the rank and the number agree.
export function seatDeprivation(seatName, sources) {
  const key = seatKey(seatName);
  const groups = [
    { seats: sources.england, nation: "England", unit: "residents" },
    { seats: sources.wales, nation: "Wales", unit: "neighbourhoods" },
    { seats: sources.scotland, nation: "Scotland", unit: "neighbourhoods" },
    { seats: sources.northernireland, nation: "Northern Ireland", unit: "wards" },
  ];
  for (const g of groups) {
    const seats = g.seats ?? [];
    if (!seats.some((s) => seatKey(s.name) === key)) continue;
    const sorted = [...seats].sort((a, b) => b.worst10 - a.worst10 || b.score - a.score);
    const i = sorted.findIndex((s) => seatKey(s.name) === key);
    return { worst10: sorted[i].worst10, rank: i + 1, of: sorted.length, nation: g.nation, unit: g.unit };
  }
  return null;
}
