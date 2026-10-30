import { describe, it, expect } from "vitest";
import { interestGroups, mpMoney, yearLabel, independence, dotAt, spread } from "./areaMp";

const rows = [
  { category: "Employment and earnings", donor_name: "Acme Ltd", value_amount: 12000, date_registered: "2020-01-01" },
  { category: "Employment and earnings - Ad hoc payments", donor_name: "BBC", value_amount: 300, date_registered: "2020-02-01" },
  { category: "Gifts, benefits and hospitality from UK sources", donor_name: "Club", value_amount: 90, date_registered: "2020-03-01" },
  { category: "Visits outside the UK", donor_name: null, value_amount: null, date_registered: "2020-04-01" },
  { category: "Miscellaneous", donor_name: null, value_amount: null, date_registered: "2020-05-01" },
  { category: "Something new", donor_name: null, value_amount: 5, date_registered: "2020-06-01" },
];

describe("interestGroups", () => {
  it("groups register categories into plain headings, in a fixed order, with counts and values", () => {
    const g = interestGroups(rows);
    expect(g.map((x) => x.key)).toEqual(["jobs", "gifts", "visits", "misc", "other"]);
    expect(g[0]).toMatchObject({ count: 2, value: 12300 });
    expect(g[2]).toMatchObject({ count: 1, value: 0 });
  });
  it("copes with no rows", () => { expect(interestGroups(null)).toEqual([]); });
});

describe("mpMoney", () => {
  it("totals what has a value, finds the largest, and counts ongoing jobs", () => {
    const m = mpMoney({ interests: rows });
    expect(m).toMatchObject({ entries: 6, total: 12395, valuedCount: 4, ongoing: 1 });
    expect(m.largest).toEqual({ value: 12000, from: "Acme Ltd", category: "Employment and earnings" });
    expect(m.expenses).toBeNull();
  });
  it("says where the totals sit among all MPs when it has the lists", () => {
    const m = mpMoney({ interests: rows, expenses: { total: 90000, year: "26_27", byCategory: [{ category: "Staffing", amount: 70000 }], previousYear: { year: "25_26", total: 120000 } }, expensesSorted: [10, 20, 90000], declared: 12395, declaredSorted: [0, 0, 12395] });
    expect(m.expenses).toMatchObject({ total: 90000, previous: 120000, topCategory: { category: "Staffing", amount: 70000 } });
    expect(m.expenses.place.band.tone).toBe("high");
    expect(m.declaredPlace.pct).toBeGreaterThan(50);
  });
  it("has nothing to say for an MP with no entries", () => {
    const m = mpMoney({ interests: [] });
    expect(m).toMatchObject({ entries: 0, total: 0, largest: null, groups: [] });
  });
});

describe("yearLabel", () => {
  it("writes IPSA's year code the way IPSA does", () => { expect(yearLabel("26_27")).toBe("2026 to 27"); expect(yearLabel("x")).toBeNull(); });
});

describe("independence", () => {
  const sorted = [0, 0, 0, 0.5, 1, 2, 4, 8, 16];
  it("explains why an independent or the Speaker has no party line", () => {
    expect(independence({ rate: undefined, sorted, party: "Independent" }).kind).toBe("none");
    expect(independence({ rate: undefined, sorted, party: "Speaker" }).reason).toMatch(/Speaker/);
  });
  it("says there are too few votes when the benchmarks left the MP out", () => {
    expect(independence({ rate: undefined, sorted, party: "Labour" }).kind).toBe("few");
  });
  it("places the rate among every MP's", () => {
    const r = independence({ rate: 8, sorted, party: "Labour" });
    expect(r).toMatchObject({ kind: "ok", median: 1, max: 16, of: 9, everRebelled: 6, never: false });
    expect(r.band.tone).toBe("high");
    expect(independence({ rate: 0, sorted, party: "Labour" }).never).toBe(true);
  });
  it("gives nothing before the benchmarks arrive", () => { expect(independence({ rate: 1, sorted: null, party: "Labour" })).toBeNull(); });
});

describe("dotAt", () => {
  it("keeps the dot on the line and spreads small values out", () => {
    expect(dotAt(0, 16)).toBe(0);
    expect(dotAt(16, 16)).toBe(100);
    expect(dotAt(4, 16)).toBe(50);
    expect(dotAt(99, 16)).toBe(100);
    expect(dotAt(3, 0)).toBe(0);
  });
});

describe("spread", () => {
  const sorted = [0, 0, 0, 0.4, 0.9, 1.5, 3, 7, 12];
  it("puts every MP in one band and marks the band this MP is in", () => {
    const b = spread(sorted, 7);
    expect(b.reduce((n, x) => n + x.count, 0)).toBe(sorted.length);
    expect(b.map((x) => x.count)).toEqual([3, 3, 1, 1, 1]);
    expect(b.filter((x) => x.mine).map((x) => x.label)).toEqual(["4 to 8%"]);
    expect(spread(sorted, 0).find((x) => x.mine).label).toBe("Never");
  });
  it("is empty with no list", () => { expect(spread(null, 1)).toEqual([]); });
});
