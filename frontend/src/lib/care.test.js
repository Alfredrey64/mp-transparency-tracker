import { describe, expect, it } from "vitest";
import { A, C, CHILD_MAP_METRICS, F, K, MAP_METRICS, W, cl, shares } from "./care";
import { REGIONS } from "../data/regionMetrics";

describe("care data", () => {
  it("has spending series from 2005 with matching lengths and a net figure below gross", () => {
    expect(F.gross.years[0]).toBe(2005);
    expect(F.gross.cash).toHaveLength(F.gross.years.length);
    expect(F.gross.real).toHaveLength(F.gross.years.length);
    expect(F.net.cash.at(-1)).toBeLessThan(F.gross.cash.at(-1));
    expect(F.gross.cash.at(-1) - F.net.cash.at(-1)).toBeCloseTo(F.flows.clients, -2);
    const s = shares();
    expect(s.long + s.short + s.other).toBeGreaterThan(98);
    expect(s.long + s.short + s.other).toBeLessThan(102);
  });
  it("has England and nine regions for every table that is by region", () => {
    for (const obj of [F.regions, F.unitCosts, C.activity.regions]) expect(Object.keys(obj).sort()).toEqual(["east", "em", "england", "london", "ne", "nw", "se", "sw", "wm", "yh"].sort());
    // The department rounds each figure, and a person can be counted in both age bands in the year, so the parts need not add exactly.
    expect(Math.abs(A.during18 + A.during65 - A.duringTotal)).toBeLessThan(500);
  });
  it("has a value for England's nine regions and none for the rest, on every map measure", () => {
    for (const m of [...MAP_METRICS, ...CHILD_MAP_METRICS]) {
      const v = m.values();
      const have = REGIONS.filter((r) => typeof v[r.key] === "number").map((r) => r.key);
      expect(have.length, m.id).toBe(9);
      expect(m.uk(), m.id).not.toBeNull();
      expect(m.ukLabel).toBe("England");
    }
  });
  it("has carers survey series of the same length", () => {
    for (const k of ["noSupport", "satisfied", "dissatisfied", "littleSocial", "neglecting"]) expect(cl[k], k).toHaveLength(cl.years.length);
    expect(cl.satisfied.at(-1)).toBeLessThan(cl.satisfied[0]);
  });
  it("has workforce rates as percentages and projections that rise", () => {
    for (const s of [W.vacancy.all, W.turnover.all]) { expect(s.values).toHaveLength(s.years.length); for (const v of s.values) { expect(v).toBeGreaterThan(1); expect(v).toBeLessThan(60); } }
    expect(W.pay.independentCare.at(-1)).toBeGreaterThan(W.pay.minimum.at(-1));
    expect(W.over65.values.at(-1)).toBeGreaterThan(W.over65.values[0]);
    expect(W.projection.y2040).toBeGreaterThan(W.projection.posts);
    expect(W.filled.all).toBeGreaterThan(1e6);
  });
  it("has childcare series with take-up as percentages", () => {
    expect(K.years.at(-1)).toBeGreaterThanOrEqual(2026);
    for (const s of [K.universal.takeUp, K.twoYearOlds.takeUp]) for (const v of s) if (v !== null) { expect(v).toBeGreaterThan(40); expect(v).toBeLessThan(100); }
    expect(K.working.registered.at(-1)).toBeGreaterThan(K.working.registered.at(-3));
  });
});
