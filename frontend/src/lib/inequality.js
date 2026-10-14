import raw from "../data/inequalityData.json";

// Working things out from the Inequality page's data: latest values, changes, and the words that go with them, so the text and the charts cannot
// drift apart.

export const D = raw;

export const last = (arr) => arr[arr.length - 1];
export const lastNonNull = (arr) => { for (let i = arr.length - 1; i >= 0; i -= 1) if (arr[i] !== null && arr[i] !== undefined) return arr[i]; return null; };
export const at = (years, values, year) => values[years.indexOf(year)] ?? null;

// The highest value in a series and the year it came in.
export function peak(years, values) {
  let best = null;
  values.forEach((v, i) => { if (v !== null && (best === null || v > best.value)) best = { year: years[i], value: v }; });
  return best;
}

export const financial = (y) => `${y}/${String(y + 1).slice(2)}`;

// The sentences under the headline figures.
export function incomeFacts() {
  const g = D.income.gini;
  const m = D.income.measures;
  const y0 = g.years[0];
  const latest = last(g.years);
  const disposable = g.disposable;
  const peakDisposable = peak(g.years, disposable);
  return {
    first: { year: y0, gini: disposable[0] },
    latest: { year: latest, gini: last(disposable), original: last(g.original), gross: last(g.gross) },
    peak: peakDisposable,
    s80s20: last(m.s80s20),
    s80s20First: m.s80s20[0],
    top1: last(m.top1),
    top1Peak: peak(m.years, m.top1),
    p90p10: last(m.p90p10),
    poorerByTaxAndBenefits: last(g.original) - last(disposable),
  };
}

export function povertyFacts() {
  const p = D.poverty;
  const years = p.years;
  const latest = last(years);
  const row = (k) => ({ ahc: last(p[k].ahc), bhc: last(p[k].bhc), ahcFirst: p[k].ahc[0], bhcFirst: p[k].bhc[0], millions: p.counts[k] });
  return { latest, all: row("all"), children: row("children"), workingAge: row("workingAge"), pensioners: row("pensioners") };
}

export function wealthFacts() {
  const w = D.wealth;
  const i = w.periods.length - 1;
  return {
    period: w.periods[i],
    top10: w.shares.top10[i], bottom50: w.shares.bottom50[i], top20: w.shares.top20[i],
    previous: { period: w.periods[i - 1], top10: w.shares.top10[i - 1], bottom50: w.shares.bottom50[i - 1] },
    median: w.median[i],
    gini: w.ginis["Total Wealth"][i],
    components: Object.fromEntries(Object.entries(w.components.sharePct).map(([k, v]) => [k, v[i]])),
  };
}

// Income per head in each region and nation, latest year, highest first, with how far each is from the UK figure.
export function regionTable() {
  const r = D.regions;
  const uk = r.perHead.find((x) => x.name === "United Kingdom");
  const ukNow = last(uk.values);
  return r.perHead
    .filter((x) => x.name !== "United Kingdom" && x.name !== "England")
    .map((x) => ({ name: x.name, value: last(x.values), index: Math.round((last(x.values) / ukNow) * 1000) / 10 }))
    .sort((a, b) => b.value - a.value);
}

export function regionIndex(name) {
  const row = D.regions.index.find((x) => x.name === name);
  return row ? { years: D.regions.years, values: row.values } : null;
}
