import { describe, expect, it } from "vitest";
import { A, MEASURES, RECENT_FROM, UK, mean, pickable, ranking, redistribution, redistributionRanking } from "./inequalityAbroad";
import { D } from "./inequality";

describe("international inequality data", () => {
  it("has the OECD's countries with a series and latest figures", () => {
    expect(Object.keys(A.countries).length).toBeGreaterThanOrEqual(40);
    for (const c of Object.values(A.countries)) { expect(c.gini.years).toHaveLength(c.gini.values.length); expect(c.latest.gini.value).toBeGreaterThan(15); expect(c.latest.gini.value).toBeLessThan(70); }
  });
  it("has the UK as the OECD publishes it, which is not the ONS's own figure", () => {
    const g = A.countries[UK].latest.gini;
    expect(g.value).toBe(36.7);
    expect(g.year).toBe(2023);
    expect(g.value).toBeGreaterThan(D.income.gini.disposable.at(-1) + 2);
  });
  it("ranks countries highest first, from recent figures only", () => {
    for (const k of Object.keys(MEASURES)) {
      const r = ranking(k, { membersOnly: false });
      for (let i = 1; i < r.length; i += 1) expect(r[i - 1].value).toBeGreaterThanOrEqual(r[i].value);
      expect(r.every((x) => x.year >= RECENT_FROM)).toBe(true);
      expect(r.some((x) => x.code === UK)).toBe(true);
    }
    expect(ranking("gini", { membersOnly: true }).every((x) => x.member)).toBe(true);
    expect(ranking("gini", { membersOnly: true }).length).toBeLessThan(ranking("gini", { membersOnly: false }).length);
  });
  it("works out what tax and benefits take off", () => {
    const uk = redistribution(UK);
    expect(uk.cut).toBeCloseTo(uk.market - uk.disposable, 1);
    const all = redistributionRanking();
    for (let i = 1; i < all.length; i += 1) expect(all[i - 1].cut).toBeGreaterThanOrEqual(all[i].cut);
    expect(all.some((r) => r.code === UK)).toBe(true);
    expect(all.every((r) => r.market > r.disposable)).toBe(true);
    expect(mean([1, 2, 3])).toBe(2);
  });
  it("offers the countries with a long series to compare over time, including the UK", () => {
    const p = pickable();
    expect(p.some((x) => x.code === UK)).toBe(true);
    expect(p.length).toBeGreaterThanOrEqual(15);
    for (const x of p) expect(A.countries[x.code].gini.years.length).toBeGreaterThanOrEqual(8);
  });
});
