import { describe, expect, it } from "vitest";
import { LIFE_STAGES, PENSION_RATES, POPULATION, SOURCES, STATE_PENSION } from "./ageing";
import { A, countSetBy, indexed, last, rises, shareOfEarnings, whatIf } from "../lib/ageing";

describe("ageing data", () => {
  it("has the pension rates in order and today's rate", () => {
    expect(PENSION_RATES[0]).toMatchObject({ year: 2016, weekly: 155.65 });
    expect(last(PENSION_RATES).weekly).toBe(STATE_PENSION.fullNewWeekly);
    for (let i = 1; i < PENSION_RATES.length; i += 1) expect(PENSION_RATES[i].weekly).toBeGreaterThan(PENSION_RATES[i - 1].weekly);
  });
  it("has each rise at least the minimum, and equal to it where the minimum set it", () => {
    for (const r of rises()) {
      expect(r.rise).toBeGreaterThanOrEqual(2.4);
      if (r.setBy === "minimum") expect(r.rise).toBeCloseTo(2.5, 0);
    }
    expect(rises().find((r) => r.year === 2023).rise).toBe(10.1);
    expect(rises().find((r) => r.year === 2026).rise).toBe(4.8);
    expect(countSetBy()).toEqual({ minimum: 2, prices: 3, earnings: 5 });
  });
  it("lines the ONS series up with the pension years", () => {
    expect(A.years).toEqual(PENSION_RATES.map((r) => r.year));
    expect(A.pension).toEqual(PENSION_RATES.map((r) => r.weekly));
    expect(A.pricesIndex).toHaveLength(A.years.length);
    expect(A.earningsWeekly).toHaveLength(A.years.length);
  });
  it("starts every comparison at 100", () => {
    const i = indexed();
    expect([i.pension[0], i.prices[0], i.earnings[0]]).toEqual([100, 100, 100]);
    expect(last(i.pension)).toBeGreaterThan(last(i.prices));
  });
  it("works out what the pension would be under other rules", () => {
    const w = whatIf();
    expect(w.actual).toBe(241.3);
    expect(w.prices).toBeLessThan(w.earnings);
    expect(w.earnings).toBeLessThan(w.actual);
    expect(w.minimum).toBeCloseTo(155.65 * 1.025 ** 10, 1);
  });
  it("keeps the pension near a third of average earnings", () => {
    for (const v of shareOfEarnings()) { expect(v).toBeGreaterThan(28); expect(v).toBeLessThan(36); }
  });
  it("has life stages that add up to the ONS totals", () => {
    const total = (y) => Object.values(LIFE_STAGES[y]).reduce((a, b) => a + b, 0);
    expect(total(2022)).toBeCloseTo(67.6, 1);
    expect(total(2047)).toBeCloseTo(POPULATION.total2047, 1);
    expect(LIFE_STAGES[2032].pensionable).toBeGreaterThan(LIFE_STAGES[2022].pensionable);
    expect(POPULATION.dependency.y2047).toBeGreaterThan(POPULATION.dependency.y2022);
  });
  it("keeps the sources as secure addresses", () => {
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\//);
  });
});
