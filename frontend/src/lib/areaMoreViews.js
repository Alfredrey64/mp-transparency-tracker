// What the four newer Your area cards (local health, asylum support, homelessness and children in low-income families) show for one council or seat, worked out from the saved files.
// Each returns null when the file has nothing for that code, so the card can say so instead of showing a blank.

// People in Home Office asylum accommodation, by kind (the order the card lists them in).
export const ASYLUM_KINDS = [
  ["dispersal", "Dispersal housing"],
  ["hotel", "Hotels"],
  ["contingency", "Other emergency accommodation"],
  ["initial", "Initial accommodation"],
  ["other", "Other accommodation"],
];

// The latest quarter for one council: people in accommodation, how many are in hotels, and the last eight quarters. Cash-only support is held apart, because the Home Office has no
// council-level figures for it from December 2023 to December 2024, so it cannot be part of a trend.
export function asylumView(data, code) {
  const a = data?.areas?.[code];
  if (!a) return null;
  const housed = ASYLUM_KINDS.reduce((s, [k]) => s + (a.now[k] ?? 0), 0);
  return { name: a.n, housed, hotels: a.now.hotel ?? 0, subsistence: a.now.subsistence ?? 0, kinds: ASYLUM_KINDS.map(([k, label]) => ({ key: k, label, count: a.now[k] ?? 0 })).filter((k) => k.count > 0), t: a.t, quarters: data.quarters, asAt: data.asAt, ukHoused: data.uk.t.at(-1) };
}

// A council that has no rows in the Home Office table: said as "none recorded", never as a number, because the table lists only councils with people in support.
export const asylumHeld = (data) => Boolean(data?.areas && data?.quarters?.length);

export function homelessView(data, code) {
  const a = data?.areas?.[code];
  if (!a) return null;
  return { ...a, quarter: data.quarter, asAt: data.asAt, england: data.england, reported: a.ta != null || a.owed != null };
}

// One area's latest figure, the year before, and how it compares with the United Kingdom. `kind` is "la" (council area) or "con" (Westminster constituency).
export function povertyView(data, code, kind = "la") {
  const a = data?.[kind]?.[code];
  if (!a || a.p.at(-1) == null) return null;
  const last = a.p.length - 1;
  return { name: a.n, children: a.c[last], percent: a.p[last], before: a.p[last - 1], beforeYear: data.years[last - 1], year: data.years[last], uk: data.uk[last], difference: Math.round((a.p[last] - data.uk[last]) * 10) / 10 };
}

// The area's own life-expectancy and survey figures where it has them; healthy life expectancy exists for counties and unitary authorities only, so a district shows its county's.
export function healthView(data, code, countyCode = null) {
  const own = data?.areas?.[code];
  const county = countyCode ? data?.areas?.[countyCode] : null;
  if (!own && !county) return null;
  const take = (k) => (own?.[k] ? { value: own[k], area: own.n } : county?.[k] ? { value: county[k], area: county.n, fromCounty: true } : null);
  return { name: own?.n ?? county.n, periods: data.periods, england: data.england, life: take("le"), lifeBefore: own?.leBefore ?? county?.leBefore ?? null, healthy: take("hle"), smoke: take("smoke"), over: take("over"), inactive: take("inactive") };
}

// "30 Jun 2026" -> "Jun 26", for the bars of a quarter-by-quarter chart.
export const quarterLabel = (s) => { const m = /^\d{1,2} ([A-Za-z]{3}) (\d{4})$/.exec(String(s)); return m ? `${m[1]} ${m[2].slice(2)}` : String(s); };
