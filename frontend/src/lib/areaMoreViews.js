// What the newer Your area cards (local health, asylum support, homelessness, new homes and children in low-income families) show for one council or seat, worked out from the saved files.
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

// New homes: one council's net additional dwellings year by year, set against England and against every other council. `rate` is net additions for every 1,000 homes there are now.
// Rank 1 is the council that added the most homes for its size; a net loss of homes (more demolished than built) is a negative figure and is kept as one.
const per1000 = (n, d) => (n == null || !d ? null : Math.round((n / d) * 10000) / 10);
export function housingView(data, code) {
  const a = data?.areas?.[code];
  if (!a || !data.years?.length) return null;
  const latest = a.y.at(-1);
  const last5 = a.y.slice(-5);
  const five = last5.length === 5 && last5.every((v) => v != null) ? last5.reduce((s, v) => s + v, 0) : null;
  const eng5 = data.england.y.slice(-5);
  const rates = Object.values(data.areas).map((x) => per1000(x.y.at(-1), x.d)).filter((v) => v != null);
  const rate = per1000(latest, a.d);
  const rank = rate == null ? null : 1 + rates.filter((v) => v > rate).length;
  const peak = a.y.reduce((b, v, k) => (v != null && (b < 0 || v > a.y[b]) ? k : b), -1);
  return {
    name: a.n, years: data.years, y: a.y, latest, latestYear: data.years.at(-1), dwellings: a.d, stockYear: data.stockYear,
    rate, rank, of: rates.length, rates,
    five, fiveRate: per1000(five, a.d), fiveYears: `${data.years.at(-5)} to ${data.years.at(-1)}`,
    englandRate: data.england.rate, englandFiveRate: per1000(eng5.reduce((s, v) => s + (v ?? 0), 0), data.england.d),
    peak: peak < 0 ? null : { year: data.years[peak], n: a.y[peak], latest: peak === a.y.length - 1 },
  };
}
