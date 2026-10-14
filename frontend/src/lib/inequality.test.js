import { describe, expect, it } from "vitest";
import { D, incomeFacts, povertyFacts, regionTable, wealthFacts, peak } from "./inequality";
import { DISABILITY_PAY_GAP, GENDER_PAY_GAP, LOCAL_AREAS, PERSISTENT_LOW_INCOME_BY_ETHNICITY, SOURCES, WEALTH_HEADLINES } from "../data/inequality";

// The figures the official releases headline, checked against the data read from their tables.
describe("inequality data", () => {
  it("matches the ONS headline figures for 2024/25", () => {
    const f = incomeFacts();
    expect(f.latest.gini).toBe(32.7);
    expect(f.s80s20).toBe(5.6);
    expect(f.top1).toBe(6.2);
    expect(f.latest.year).toBe(2024);
    expect(f.first).toEqual({ year: 1977, gini: 25.5 });
    expect(f.peak.value).toBeGreaterThan(f.latest.gini);
    expect(Math.round(D.income.medianSeries.median.at(-1) / 100) * 100).toBe(39200);
  });
  it("matches the DWP headline figures for 2024/25", () => {
    const p = povertyFacts();
    expect(p.all.ahc).toBeCloseTo(19.6, 0);
    expect(Math.round(p.all.ahc)).toBe(20);
    expect(Math.round(p.children.ahc)).toBe(27);
    expect(Math.round(p.pensioners.ahc)).toBe(14);
    expect(Math.round(p.workingAge.ahc)).toBe(19);
    expect(p.all.millions).toMatchObject({ ahc: 13.4, bhc: 10.86 });
    expect(p.children.millions.ahc).toBe(4.03);
    expect(D.poverty.deepMaterialChildren).toMatchObject({ percent: 12.9, millions: 1.9 });
    expect(D.poverty.years[0]).toBe(1994);
    expect(D.poverty.years.at(-1)).toBe(2024);
  });
  it("matches the ONS wealth figures for April 2020 to March 2022", () => {
    const w = wealthFacts();
    expect(Math.round(w.top10)).toBe(41);
    expect(Math.round(w.bottom50)).toBe(10);
    expect(w.median).toBe(WEALTH_HEADLINES.median);
    expect(w.gini).toBe(0.59);
    expect(w.components["Property Wealth (net)"]).toBe(40);
    expect(w.components["Private Pension Wealth"]).toBe(35);
    expect(D.wealth.regions.find((r) => r.name === "North East").median).toBe(179900);
    expect(D.wealth.regions.find((r) => r.name === "South East").median).toBe(489800);
    expect(Math.round(D.wealth.latestDeciles.reduce((a, b) => a + b, 0))).toBe(100);
  });
  it("matches the ONS regional income figures for 2024", () => {
    const t = regionTable();
    expect(t[0]).toMatchObject({ name: "London", value: 36487 });
    expect(t.at(-1)).toMatchObject({ name: "North East", value: 20562 });
    expect(D.regions.perHead.find((r) => r.name === "United Kingdom").values.at(-1)).toBe(25965);
    expect(LOCAL_AREAS.highest.value / LOCAL_AREAS.lowest.value).toBeGreaterThan(4.9);
  });
  it("has complete, numeric, equal-length series", () => {
    const same = (years, ...series) => series.forEach((s) => expect(s.length).toBe(years.length));
    same(D.income.gini.years, D.income.gini.original, D.income.gini.gross, D.income.gini.disposable);
    same(D.income.measures.years, D.income.measures.s80s20, D.income.measures.gini, D.income.measures.top1);
    same(D.poverty.years, D.poverty.all.ahc, D.poverty.children.bhc, D.poverty.pensioners.ahc, D.poverty.workingAge.ahc, D.poverty.gini.ahc, ...D.poverty.quintileMedians.ahc);
    same(D.regions.years, ...D.regions.perHead.map((r) => r.values), ...D.regions.index.map((r) => r.values));
    for (const r of D.regions.perHead) for (const v of r.values) expect(typeof v).toBe("number");
    for (const v of D.income.gini.disposable) expect(v).toBeGreaterThan(15);
    for (const band of D.income.age.median) expect(band.length).toBe(D.income.age.years.length);
    expect(D.income.deciles.disposable).toHaveLength(10);
    expect(D.income.quintiles.original).toHaveLength(5);
  });
  it("shows the tax and benefit system narrowing the gap", () => {
    const g = D.income.gini;
    g.years.forEach((_, i) => { expect(g.original[i]).toBeGreaterThan(g.gross[i]); expect(g.gross[i]).toBeGreaterThan(g.disposable[i]); });
    const q = D.income.quintiles;
    for (let i = 0; i < 5; i += 1) expect(Math.abs(q.original[i] + q.cashBenefits[i] - q.gross[i])).toBeLessThanOrEqual(1);
    for (let i = 0; i < 5; i += 1) expect(Math.abs(q.gross[i] - q.directTaxes[i] - q.disposable[i])).toBeLessThanOrEqual(1);
  });
  it("finds the peak of a series", () => {
    expect(peak([1, 2, 3], [4, 9, 5])).toEqual({ year: 2, value: 9 });
    expect(peak([1, 2], [null, 3])).toEqual({ year: 2, value: 3 });
  });
  it("has the pay gaps and low-income figures with their sources", () => {
    expect(GENDER_PAY_GAP.fullTime.gap).toBe(6.9);
    expect(GENDER_PAY_GAP.byAge).toHaveLength(5);
    expect(DISABILITY_PAY_GAP.gap).toBe(12.7);
    expect(PERSISTENT_LOW_INCOME_BY_ETHNICITY.rows.find((r) => r.group === "Black").value).toBe(22);
    for (const s of Object.values(SOURCES)) { expect(s.url).toMatch(/^https:\/\//); expect(s.label.length).toBeGreaterThan(10); }
    for (const s of Object.values(D.sources)) expect(s.url).toMatch(/^https:\/\//);
  });
});
