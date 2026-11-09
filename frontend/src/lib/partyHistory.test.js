import { describe, it, expect } from "vitest";
import { partyAge, initials, chartScale } from "./partyHistory";

describe("partyAge", () => {
  it("counts years from the founding year to the year on the clock", () => {
    expect(partyAge(1900, new Date("2026-11-09"))).toBe(126);
    expect(partyAge(1834, new Date("2026-11-09"))).toBe(192);
  });
  it("goes up by one on 1 January, with nothing changed", () => {
    expect(partyAge(1900, new Date("2026-12-31T23:59:00"))).toBe(126);
    expect(partyAge(1900, new Date("2027-01-01T00:00:00"))).toBe(127);
  });
  it("is never negative and never NaN", () => {
    expect(partyAge(2100, new Date("2026-11-09"))).toBe(0);
    expect(partyAge(undefined, new Date("2026-11-09"))).toBe(0);
    expect(partyAge("1900", new Date("2026-11-09"))).toBe(126);
  });
});

describe("initials", () => {
  it("gives two capitals, skipping small words", () => {
    expect(initials("Kemi Badenoch")).toBe("KB");
    expect(initials("Rhun ap Iorwerth")).toBe("RI");
    expect(initials("Mary Lou McDonald")).toBe("ML");
  });
  it("copes with nothing", () => {
    expect(initials("")).toBe("");
    expect(initials(undefined)).toBe("");
  });
});

describe("chartScale", () => {
  it("ends at the next round decade and marks every fifty years up to today", () => {
    const c = chartScale(new Date("2026-11-09"));
    expect([c.from, c.to, c.today]).toEqual([1750, 2030, 2026]);
    expect(c.ticks).toEqual([1750, 1800, 1850, 1900, 1950, 2000]);
  });
  it("moves on by itself: a new gridline in 2050, a longer axis after 2029", () => {
    expect(chartScale(new Date("2029-06-01")).to).toBe(2030);
    expect(chartScale(new Date("2030-01-01")).to).toBe(2040);
    expect(chartScale(new Date("2050-01-01")).ticks.at(-1)).toBe(2050);
  });
  it("places years as a share of the width, and holds anything outside the chart at its edges", () => {
    const c = chartScale(new Date("2026-11-09"));
    expect(c.pct(1750)).toBe(0);
    expect(c.pct(2030)).toBe(100);
    expect(c.pct(1700)).toBe(0);
    expect(c.pct(2100)).toBe(100);
    expect(c.pct(1890)).toBe(50);
  });
});
