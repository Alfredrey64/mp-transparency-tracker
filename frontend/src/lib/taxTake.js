// What the government actually collects from each main tax, as a share of the size of the economy, to set beside the rates.
//
// Everything here is worked out from Office for National Statistics series already on the site: the public sector's monthly and quarterly tax receipts
// (src/data/ons/tax.json) and GDP at current prices (src/data/ons/economy.json). Each figure is the total for the latest 12 months (or four
// quarters) as a share of GDP over the same period, so seasonal swings drop out. The ONS tax series start in 1997 for most taxes, 1987 for VAT and
// 1966 for corporation tax.

export const TAKE = [
  { id: "take_total", label: "Tax take: everything the government collects, % of GDP", short: "All government receipts", format: "pct", taxId: null, from: ["receipts-m"] },
  { id: "take_income", label: "Tax take: income tax, % of GDP", short: "Income tax", format: "pct", taxId: "income-tax", from: ["paye-m", "sa-m"] },
  { id: "take_ni", label: "Tax take: National Insurance, % of GDP", short: "National Insurance", format: "pct", taxId: "national-insurance", from: ["nics-m"] },
  { id: "take_vat", label: "Tax take: VAT, % of GDP", short: "VAT", format: "pct", taxId: "vat", from: ["vat-q"] },
  { id: "take_corp", label: "Tax take: corporation tax, % of GDP", short: "Corporation tax", format: "pct", taxId: "corporation-tax", from: ["corp-q"] },
  { id: "take_fuel", label: "Tax take: fuel duty, % of GDP", short: "Fuel duty", format: "pct2", taxId: "fuel", from: ["fuel-m"] },
];

const quarterOf = (period) => {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  return m ? `${m[1]}-Q${Math.floor((Number(m[2]) - 1) / 3) + 1}` : period;
};
const prevQuarter = (q) => {
  const [y, n] = [Number(q.slice(0, 4)), Number(q.slice(6))];
  return n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`;
};

// Sum of several series that share periods.
function addSeries(list) {
  const total = new Map();
  for (const pts of list) for (const [p, v] of pts) total.set(p, (total.get(p) ?? 0) + v);
  return [...total.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

// Pure: given the receipts and GDP points, work out each share. `receipts` maps a tax.json series id to its points.
export function computeTake(receipts, gdpPoints) {
  const gdpQ = new Map(gdpPoints);
  const gdp4 = (q) => {
    let sum = 0;
    let at = q;
    for (let i = 0; i < 4; i += 1) {
      const v = gdpQ.get(at);
      if (v === undefined) return null;
      sum += v;
      at = prevQuarter(at);
    }
    return sum;
  };
  const out = {};
  for (const spec of TAKE) {
    const series = addSeries(spec.from.map((id) => receipts[id] ?? []));
    const points = [];
    const quarterly = spec.from[0].endsWith("-q");
    for (let i = 0; i < series.length; i += 1) {
      if (quarterly) {
        if (i < 3) continue;
        const sum = series.slice(i - 3, i + 1).reduce((n, [, v]) => n + v, 0);
        const g = gdp4(series[i][0]);
        if (g) points.push([series[i][0], (sum / g) * 100]);
      } else {
        if (i < 11) continue;
        const sum = series.slice(i - 11, i + 1).reduce((n, [, v]) => n + v, 0);
        const g = gdp4(quarterOf(series[i][0]));
        if (g) points.push([series[i][0], (sum / g) * 100]);
      }
    }
    if (points.length) out[spec.id] = { def: { id: spec.id, label: spec.label, sentenceName: spec.short, format: spec.format, kind: "rate", explain: "Tax receipts over the latest 12 months as a share of GDP over the same period." }, points, freq: quarterly ? "quarters" : "months" };
  }
  return out;
}

let cache = null;
// Loads the ONS files on demand and works out the shares. Resolves to { id: { def, points, freq } }.
export function loadTaxTake() {
  if (!cache) {
    cache = Promise.all([import("../data/ons/tax.json"), import("../data/ons/economy.json")]).then(([tax, econ]) => {
      const receipts = {};
      for (const [id, s] of Object.entries(tax.default.series)) receipts[id] = s.points;
      return computeTake(receipts, econ.default.series["gdp-cp"].points);
    });
  }
  return cache;
}

export const takeChoices = () => TAKE.map((t) => ({ id: t.id, label: t.label, sentenceName: t.short, format: t.format, kind: "rate", sector: "tax", sectorLabel: "Tax rates" }));
