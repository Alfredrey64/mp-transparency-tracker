import { describe, expect, it } from "vitest";
import { FORCES, MOMENTS, NATO_COUNT, PROMISES, RANKING, SOURCES, TARGETS } from "./defence";
import { D, at, last, stayedUnder } from "../lib/defence";

describe("defence data", () => {
  it("has SIPRI series that line up and are in range", () => {
    const s = D.shareOfGdp;
    expect(s.years[0]).toBe(1950);
    expect(last(s.years)).toBe(2025);
    for (const k of ["uk", "france", "germany", "usa"]) { expect(s[k]).toHaveLength(s.years.length); }
    for (const v of s.uk) { expect(v).toBeGreaterThan(1); expect(v).toBeLessThan(12); }
    expect(D.ukRealBillions.years.at(-1)).toBe(2025);
    expect(D.ukPerHeadUsd.values.at(-1)).toBeGreaterThan(1000);
    expect(D.ukShareOfGovernmentSpending.values.at(-1)).toBeLessThan(10);
  });
  it("matches what SIPRI published for the UK", () => {
    expect(at({ years: D.shareOfGdp.years, values: D.shareOfGdp.uk }, 2024)).toBeCloseTo(2.44, 1);
    expect(at({ years: D.shareOfGdp.years, values: D.shareOfGdp.uk }, 1990)).toBeCloseTo(3.98, 1);
    expect(last(D.ukRealBillions.values)).toBeCloseTo(88, 0);
  });
  it("finds the year spending stayed below a level", () => {
    expect(stayedUnder([1, 2, 3, 4], [5, 2, 3, 2], 4)).toBe(2);
    expect(stayedUnder([1, 2], [5, 6], 4)).toBeNull();
    expect(stayedUnder(D.shareOfGdp.years, D.shareOfGdp.uk, 3)).toBeLessThan(2000);
  });
  it("keeps the armed forces numbers consistent", () => {
    expect(FORCES.navy + FORCES.army + FORCES.airForce).toBe(FORCES.trained);
    expect(FORCES.total).toBeGreaterThan(FORCES.trained);
    expect(FORCES.intake).toBeGreaterThan(FORCES.outflow);
  });
  it("gives each promise a time, plain wording and a source", () => {
    expect(PROMISES).toHaveLength(4);
    expect(JSON.stringify(PROMISES)).not.toMatch(/—|–|→/);
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\//);
    expect(NATO_COUNT.map((r) => r.year)).toEqual([2023, 2024, 2025, 2026]);
    expect(RANKING.natoBySpending).toBe("Third");
  });
  it("has the other countries' series lined up with the UK's", () => {
    const keys = Object.keys(D.countries);
    expect(keys).toHaveLength(14);
    for (const k of keys) {
      expect(D.shareOfGdp[k]).toHaveLength(D.shareOfGdp.years.length);
      expect(D.realBillions[k]).toHaveLength(D.shareOfGdp.years.length);
      expect(last(D.shareOfGdp[k])).toBeGreaterThan(0.5);
    }
    expect(last(D.shareOfGdp.poland)).toBeGreaterThan(last(D.shareOfGdp.uk));
    expect(last(D.realBillions.uk)).toBeCloseTo(last(D.ukRealBillions.values), 0);
  });
  it("has the armed forces' quarterly series, matching the headline numbers", () => {
    const f = D.forces;
    for (const k of ["all", "navy", "army", "airForce"]) expect(f[k]).toHaveLength(f.times.length);
    expect(f.times[0]).toBe(2012.25);
    expect(last(f.times)).toBe(2026.5);
    expect(last(f.all)).toBe(FORCES.trained);
    expect(last(f.navy)).toBe(FORCES.navy);
    expect(last(f.army)).toBe(FORCES.army);
    expect(last(f.airForce)).toBe(FORCES.airForce);
    for (let i = 0; i < f.times.length; i += 1) expect(Math.abs(f.navy[i] + f.army[i] + f.airForce[i] - f.all[i])).toBeLessThanOrEqual(30);
    expect(f.all[0]).toBe(170010);
  });
  it("has the size of the economy for the cost tool", () => {
    expect(D.economy.gdpBillions).toBeGreaterThan(2500);
    expect(D.economy.gdpBillions).toBeLessThan(5000);
    expect(D.economy.populationMillions).toBeGreaterThan(60);
    expect(TARGETS.map((t) => t.share)).toEqual([2.3, 2.5, 3, 3.5, 5]);
  });
  it("gives each moment a year the series covers and plain wording", () => {
    for (const m of MOMENTS) expect(D.shareOfGdp.years).toContain(m.year);
    expect(JSON.stringify(MOMENTS)).not.toMatch(/—|–|→/);
    expect(at({ years: D.shareOfGdp.years, values: D.shareOfGdp.uk }, 1982)).toBeGreaterThan(5);
    expect(D.shareOfGdp.uk.filter((v, i) => D.shareOfGdp.years[i] > 1986 && v > 5)).toHaveLength(0);
  });
});
