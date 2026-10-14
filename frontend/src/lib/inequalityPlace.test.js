import { describe, expect, it } from "vitest";
import { D } from "./inequality";
import { MAP_METRICS, P, gbp, incomeBy, latestPeriod, localAreas, periodText, rankOf, regionSpan, wealthBy, wealthSpread } from "./inequalityPlace";
import { REGIONS } from "../data/regionMetrics";

describe("place data", () => {
  it("has a figure series for every region in each table, as long as the periods", () => {
    expect(P.periods).toHaveLength(29);
    for (const g of ["all", "children", "workingAge", "pensioners"]) {
      for (const basis of ["bhc", "ahc"]) {
        for (const r of REGIONS) expect(P.poverty[g][basis][r.key]).toHaveLength(P.periods.length);
        expect(P.poverty[g][basis].uk).toHaveLength(P.periods.length);
      }
    }
    for (const basis of ["bhc", "ahc"]) for (const r of REGIONS) expect(P.median[basis][r.key]).toHaveLength(P.periods.length);
  });
  it("leaves Northern Ireland blank before its figures start, and has all the others", () => {
    expect(P.poverty.all.ahc.ni.slice(0, 8).every((v) => v === null)).toBe(true);
    expect(P.poverty.all.ahc.ni.at(-1)).not.toBeNull();
    // One three-year average, the one around the pandemic, has no figure for anyone.
    for (const r of REGIONS.filter((x) => x.key !== "ni")) expect(P.poverty.all.ahc[r.key].filter((v) => v === null)).toHaveLength(1);
  });
  it("has poverty rates and incomes in a believable range", () => {
    for (const r of REGIONS) { const v = P.poverty.all.ahc[r.key].at(-1); expect(v).toBeGreaterThan(8); expect(v).toBeLessThan(35); }
    expect(P.poverty.children.ahc.london.at(-1)).toBeGreaterThan(P.poverty.all.ahc.london.at(-1));
    expect(P.poverty.all.ahc.london.at(-1)).toBeGreaterThan(P.poverty.all.ahc.uk.at(-1));
  });
  it("agrees with the income per head the page already holds", () => {
    for (const r of REGIONS) {
      const existing = D.regions.perHead.find((x) => x.name.toLowerCase() === r.name.toLowerCase());
      expect(incomeBy[r.key].perHead).toBe(existing.values.at(-1));
    }
    expect(P.income.uk.perHead).toBe(D.regions.perHead.find((x) => x.name === "United Kingdom").values.at(-1));
    expect(P.income.year).toBe(D.regions.years.at(-1));
  });
  it("has income before tax above income after tax in every region", () => {
    for (const r of P.income.regions) { expect(r.primary).toBeGreaterThan(r.perHead); expect(Math.abs(r.primary + r.net - r.perHead)).toBeLessThanOrEqual(1); }
    expect(Math.abs(P.income.uk.primary + P.income.uk.net - P.income.uk.perHead)).toBeLessThanOrEqual(1);
  });
  it("has the local areas, in the right regions, with the known highest and lowest", () => {
    expect(P.income.local).toHaveLength(182);
    expect(localAreas()[0].name).toBe("Westminster and City of London");
    expect(localAreas().at(-1).name).toBe("Leicester");
    expect(regionSpan("london").high.value).toBe(localAreas()[0].value);
    for (const r of REGIONS) expect(regionSpan(r.key).count).toBeGreaterThan(0);
    expect(localAreas("wales").every((a) => a.region === "wales")).toBe(true);
  });
  it("has wealth for the eleven regions and nations of Great Britain, matching the existing medians", () => {
    expect(P.wealth.regions).toHaveLength(11);
    for (const r of P.wealth.regions) { expect(r.p25).toBeLessThan(r.median); expect(r.median).toBeLessThan(r.p75); expect(r.mean).toBeGreaterThan(r.median); }
    expect(P.wealth.gb.median).toBe(D.wealth.median.at(-1));
    for (const r of D.wealth.regions.filter((x) => REGIONS.some((y) => y.name.toLowerCase() === x.name.toLowerCase()))) expect(wealthBy[REGIONS.find((y) => y.name.toLowerCase() === r.name.toLowerCase()).key].median).toBe(r.median);
    expect(wealthSpread("london").ratio).toBeGreaterThan(wealthSpread("ne").ratio);
  });
  it("has eight kinds of neighbourhood and urban and rural", () => {
    expect(P.areas.types).toHaveLength(8);
    expect(P.areas.urbanRural.map((x) => x.name)).toEqual(["Urban", "Rural"]);
    expect(P.areas.types.every((t) => t.disposable < t.gross)).toBe(true);
  });
  it("gives every map measure a figure for each region it covers", () => {
    for (const m of MAP_METRICS) {
      const values = m.values();
      expect(Object.keys(values)).toHaveLength(12);
      expect(Object.values(values).filter((v) => v !== null).length).toBeGreaterThanOrEqual(11);
      expect(m.uk()).toBeGreaterThan(0);
    }
  });
  it("ranks regions highest first and writes periods", () => {
    expect(rankOf({ a: 3, b: 9, c: null }, "b")).toEqual({ rank: 1, of: 2 });
    expect(rankOf({ a: 3, b: 9 }, "c")).toBeNull();
    expect(periodText(2022)).toBe("2022/23 to 2024/25");
    expect(latestPeriod).toBe("2022/23 to 2024/25");
    expect(gbp(84292)).toBe("£84,292");
  });
});
