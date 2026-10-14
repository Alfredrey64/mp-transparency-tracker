import raw from "../data/inequalityAbroad.json";

// Working things out from the OECD figures on the "Other countries" tab (inequalityAbroad.json, built by scripts/build-international-inequality-data.mjs),
// so the words and the charts cannot drift apart.

export const A = raw;
export const UK = "GBR";
// A country's latest figure counts as recent if it is from this year or later, so the ranking is not made of figures a decade apart.
export const RECENT_FROM = 2018;

export const MEASURES = {
  gini: { label: "After tax and benefits", format: (v) => `${v.toFixed(1)}`, field: "gini", unit: "Gini coefficient, 0 to 100", blurb: "The Gini coefficient of income after tax and benefits. 0 would mean everyone has the same income and 100 that one person has it all." },
  market: { label: "Before tax and benefits", format: (v) => `${v.toFixed(1)}`, field: "market", unit: "Gini coefficient, 0 to 100", blurb: "The Gini coefficient of market income: what people get from work, savings and property, before any tax or benefits. Pensions from the state count as benefits." },
  poverty: { label: "Poverty rate", format: (v) => `${v.toFixed(1)}%`, field: "poverty", unit: "% of people", blurb: "The share of people living in households with income below half of the country's median, after tax and benefits. This is the OECD's line, which is 50%, not the 60% the UK uses." },
  palma: { label: "Richest tenth against poorest 40%", format: (v) => v.toFixed(2), field: "palma", unit: "ratio", blurb: "The Palma ratio: the income of the richest tenth divided by the income of the poorest 40%. A ratio of 1 means the top tenth have as much as the bottom four tenths together." },
  s80s20: { label: "Richest fifth against poorest fifth", format: (v) => v.toFixed(1), field: "s80s20", unit: "ratio", blurb: "The S80/S20 ratio: the income of the richest fifth divided by the income of the poorest fifth." },
};

const recent = (c) => c.latest.gini && c.latest.gini.year >= RECENT_FROM;

// Countries ranked on a measure, highest first. Only countries with a recent figure for it.
export function ranking(measure, { membersOnly = true } = {}) {
  const f = MEASURES[measure].field;
  return Object.entries(A.countries)
    .filter(([, c]) => (!membersOnly || c.member) && c.latest[f] && c.latest[f].year >= RECENT_FROM)
    .map(([code, c]) => ({ code, name: c.name, value: c.latest[f].value, year: c.latest[f].year, member: c.member }))
    .sort((a, b) => b.value - a.value);
}

// How many percentage points of Gini taxes and benefits take off, and the two Ginis.
export function redistribution(code) {
  const c = A.countries[code];
  const a = c?.latest.market;
  const b = c?.latest.gini;
  if (!a || !b || a.year !== b.year) return null;
  return { code, name: c.name, market: a.value, disposable: b.value, cut: Math.round((a.value - b.value) * 10) / 10, year: b.year };
}

export const redistributionRanking = () => Object.keys(A.countries).filter((k) => A.countries[k].member && recent(A.countries[k])).map(redistribution).filter(Boolean).sort((a, b) => b.cut - a.cut);

export const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const pickable = () => Object.entries(A.countries).filter(([, c]) => c.gini.years.length >= 8 && c.member).map(([code, c]) => ({ code, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
