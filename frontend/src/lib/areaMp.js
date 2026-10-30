// What the Your area page says about an MP's money and independence, built only from records the site already holds: the Register of Members'
// Financial Interests, IPSA's published business costs, and the daily benchmarks that put each MP among all the others. Descriptive only: it
// says what was declared and where it sits, never whether that is good or bad. Pure and tested.

import { ONGOING_ROLE_CATEGORIES } from "./format";
import { percentileOf, bandFor } from "./interpret";

const GROUPS = [
  { key: "jobs", label: "Outside jobs and payments", test: (c) => /^Employment and earnings/i.test(c) },
  { key: "donations", label: "Donations and support", test: (c) => /^Donations and other support/i.test(c) },
  { key: "gifts", label: "Gifts and hospitality", test: (c) => /^Gifts/i.test(c) },
  { key: "visits", label: "Visits abroad", test: (c) => /^Visits outside/i.test(c) },
  { key: "property", label: "Property and shares", test: (c) => /^(Land and property|Shareholdings)/i.test(c) },
  { key: "family", label: "Family members", test: (c) => /^Family members/i.test(c) },
  { key: "misc", label: "Other interests", test: (c) => /^Miscellaneous/i.test(c) },
];

const groupOf = (category) => GROUPS.find((g) => g.test(category ?? "")) ?? { key: "other", label: "Other entries" };

// interests: rows from financial_interests { category, donor_name, value_amount, date_registered }
export function interestGroups(interests) {
  const rows = interests ?? [];
  const map = new Map();
  for (const i of rows) {
    const g = groupOf(i.category);
    const e = map.get(g.key) ?? { key: g.key, label: g.label, count: 0, value: 0 };
    e.count += 1;
    e.value += Number(i.value_amount) > 0 ? Number(i.value_amount) : 0;
    map.set(g.key, e);
  }
  const order = [...GROUPS.map((g) => g.key), "other"];
  return [...map.values()].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

// The money picture for one MP. `expenses` is the ipsa_expenses summary on the politician row (or null).
export function mpMoney({ interests, expenses, declaredSorted, declared, expensesSorted }) {
  const rows = interests ?? [];
  const valued = rows.filter((i) => Number(i.value_amount) > 0);
  const total = valued.reduce((n, i) => n + Number(i.value_amount), 0);
  const largest = valued.reduce((a, b) => (!a || Number(b.value_amount) > Number(a.value_amount) ? b : a), null);
  const ongoing = rows.filter((i) => ONGOING_ROLE_CATEGORIES.includes(i.category)).length;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const recent = rows.filter((i) => i.date_registered && new Date(i.date_registered) >= cutoff).length;
  const claimed = expenses?.total != null ? Number(expenses.total) : null;
  const top = expenses?.byCategory?.[0] ?? null;
  const share = (list, v) => (list?.length && v != null ? { pct: percentileOf(list, v), band: bandFor(percentileOf(list, v)) } : null);
  return {
    entries: rows.length,
    groups: interestGroups(rows),
    total,
    valuedCount: valued.length,
    largest: largest ? { value: Number(largest.value_amount), from: largest.donor_name ?? null, category: largest.category } : null,
    ongoing,
    recent,
    declaredPlace: share(declaredSorted, declared),
    expenses: claimed == null ? null : {
      total: claimed,
      year: expenses.year ?? null,
      previous: expenses.previousYear?.total ?? null,
      previousYear: expenses.previousYear?.year ?? null,
      topCategory: top ? { category: top.category, amount: Number(top.amount) } : null,
      place: share(expensesSorted, claimed),
    },
  };
}

// "26_27" becomes "2026 to 27", the way IPSA labels a financial year.
export function yearLabel(code) {
  const m = /^(\d{2})_(\d{2})$/.exec(code ?? "");
  return m ? `20${m[1]} to ${m[2]}` : null;
}

// The MPs' own rate of voting against their party's majority, set against every other MP's. `rate` and `sorted` are percentages.
// The daily benchmarks leave an MP out until they have at least ten votes with a clear party line, so a missing rate means "too few votes to say".
export function independence({ rate, sorted, party }) {
  const noWhip = /^(independent|speaker)/i.test(party ?? "");
  if (noWhip) return { kind: "none", reason: /^speaker/i.test(party) ? "The Speaker does not vote with a party." : "Independent MPs do not sit under a party whip, so there is no party line to vote against." };
  if (!sorted?.length) return null;
  if (rate == null) return { kind: "few" };
  const nonzero = sorted.filter((v) => v > 0).length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const max = sorted[sorted.length - 1];
  const place = percentileOf(sorted, rate);
  return {
    kind: "ok",
    rate,
    median,
    max,
    place,
    band: bandFor(place),
    everRebelled: nonzero,
    of: sorted.length,
    never: rate === 0,
  };
}

// Where a dot sits on a line from the lowest value to the highest, as 0 to 100. A square-root scale stops the few big rebels from squashing the rest.
export function dotAt(value, max) {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, (Math.sqrt(value) / Math.sqrt(max)) * 100));
}

// Every MP's rate sorted into a few bands, so the page can show how the MPs spread and which band this one is in. The bands widen because most MPs sit at the bottom.
const EDGES = [2, 4, 8];
export function spread(sorted, rate) {
  if (!sorted?.length) return [];
  const bands = [
    { label: "Never", test: (v) => v === 0 },
    { label: `Up to ${EDGES[0]}%`, test: (v) => v > 0 && v <= EDGES[0] },
    ...EDGES.slice(0, -1).map((lo, n) => ({ label: `${lo} to ${EDGES[n + 1]}%`, test: (v) => v > lo && v <= EDGES[n + 1] })),
    { label: `Over ${EDGES.at(-1)}%`, test: (v) => v > EDGES.at(-1) },
  ];
  return bands.map((b) => ({ label: b.label, count: sorted.filter(b.test).length, mine: Number.isFinite(rate) && b.test(rate) }));
}
