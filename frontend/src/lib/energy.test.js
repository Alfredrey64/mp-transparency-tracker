import { describe, expect, it } from "vitest";
import { BILL_AREAS, BILL_LAST, BILL_YEARS, BL, BUDGETS, CAP, COMPARE_MEASURES, E, EM, EU, FP, INF, LATEST, MAP_METRICS, PW, RG, areaBill, cb4, compareRanking, dual, euLatest, groupShare, hasGas, inTodaysMoney, lowCarbonShare, pace } from "./energy";
import { REGIONS } from "../data/regionMetrics";

describe("energy data", () => {
  it("has matching lengths for the emissions series", () => {
    expect(EM.years[0]).toBe(1990);
    expect(EM.total).toHaveLength(EM.years.length);
    for (const s of Object.values(EM.sectors)) expect(s.values).toHaveLength(EM.years.length);
    for (const g of Object.values(EM.gases)) expect(g).toHaveLength(EM.years.length);
    expect(LATEST.cut).toBeGreaterThan(40);
    expect(LATEST.cut).toBeLessThan(70);
  });
  it("has sector totals that add up to the total", () => {
    const i = EM.years.length - 1;
    const sum = Object.values(EM.sectors).reduce((a, s) => a + s.values[i], 0);
    expect(sum).toBeCloseTo(EM.total[i], 0);
  });
  it("has the first four carbon budgets with results below target, and later budgets in order", () => {
    const settled = BUDGETS.filter((b) => b.settled);
    expect(settled.map((b) => b.id)).toEqual(["CB1", "CB2", "CB3"]);
    for (const b of settled) expect(b.result).toBeLessThan(b.target);
    expect(BUDGETS.map((b) => b.target)).toEqual([...BUDGETS.map((b) => b.target)].sort((a, b) => b - a));
    expect(BUDGETS.at(-1).id).toBe("CB7");
    expect(cb4().target).toBe(1950);
  });
  it("works out the pace needed", () => {
    const p = pace("ndc2030");
    expect(p.target).toBeCloseTo(EM.total[0] * 0.32, 0);
    expect(p.needed).toBeGreaterThan(0);
    expect(p.recent).toBeGreaterThan(0);
  });
  it("has electricity by fuel adding to the total and shares adding to 100", () => {
    for (let i = 0; i < PW.years.length; i += 1) {
      const sum = Object.values(PW.fuels).reduce((a, v) => a + v[i], 0);
      expect(sum).toBeCloseTo(PW.total[i], 1);
      const g = groupShare(PW.years[i]);
      expect(g.fossil + g.renewables + g.nuclear + g.other).toBeCloseTo(100, 0);
    }
    expect(lowCarbonShare(PW.years.at(-1))).toBeGreaterThan(lowCarbonShare(PW.years[0]));
  });
  it("has bills for every year, regions with a bill and unit cost, and gas where it exists", () => {
    expect(BL.electricity).toHaveLength(BILL_YEARS.length);
    expect(dual.at(-1)).toBe(BL.electricity.at(-1) + BL.gas.at(-1));
    expect(inTodaysMoney(1000, BILL_LAST)).toBe(1000);
    expect(inTodaysMoney(1000, 2015)).toBeGreaterThan(1000);
    expect(BILL_AREAS.length).toBeGreaterThanOrEqual(14);
    for (const a of BILL_AREAS) {
      const e = areaBill("electricity", a);
      expect(e.bill, a).toBeGreaterThan(500);
      expect(e.unit, a).toBeGreaterThan(10);
      if (hasGas(a)) { const g = areaBill("gas", a); expect(g.bill, a).toBeGreaterThan(400); expect(g.unit, a).toBeGreaterThan(3); }
    }
  });
  it("has the price cap parts adding to the total before VAT", () => {
    expect(CAP.length).toBeGreaterThan(20);
    for (const p of CAP) {
      expect(p.wholesale + p.network + p.policy + p.operating + p.margin, p.label).toBeGreaterThan(p.exVat - 4);
      expect(p.wholesale + p.network + p.policy + p.operating + p.margin, p.label).toBeLessThan(p.exVat + 4);
      expect(p.incVat).toBeGreaterThanOrEqual(p.exVat);
    }
  });
  it("has EU prices with the UK, and a ranking that puts them in order", () => {
    expect(EU.byCountry.UK).toHaveLength(EU.years.length);
    const rows = euLatest();
    expect(rows.some((r) => r.uk)).toBe(true);
    expect(rows[0].value).toBeGreaterThanOrEqual(rows.at(-1).value);
  });
  it("has twelve regions with the sectors per head, for every map measure", () => {
    expect(Object.keys(RG.regions).sort()).toEqual(REGIONS.map((r) => r.key).sort());
    for (const m of MAP_METRICS) {
      const v = m.values();
      for (const r of REGIONS) expect(typeof v[r.key], `${m.id} ${r.key}`).toBe("number");
      expect(m.uk()).toBeGreaterThan(0);
    }
  });
  it("has fuel poverty, the inflation series and comparisons that hold together", () => {
    expect(FP.households).toHaveLength(FP.years.length);
    expect(INF.rate).toHaveLength(INF.months.length);
    for (const k of Object.keys(COMPARE_MEASURES)) { const r = compareRanking(k); expect(r.some((x) => x.code === "GBR"), k).toBe(true); expect(r.some((x) => x.code === "WLD")).toBe(false); }
    expect(E.compare.WLD.ghgTotal.value).toBeGreaterThan(E.compare.GBR.ghgTotal.value);
  });
});
