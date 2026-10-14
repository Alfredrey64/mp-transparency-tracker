import { describe, expect, it } from "vitest";
import { FORCES, NATO_COUNT, PROMISES, RANKING, SOURCES } from "./defence";
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
});
