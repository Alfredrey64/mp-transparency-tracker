import { describe, it, expect } from "vitest";
import { crateFills, landPlots, arcLength, ihtRate, IHT, rulerPos } from "./farmArt";

describe("the sums behind the farming pictures", () => {
  it("fills ten crates to a share, with an eleventh for anything over 100%", () => {
    const f = crateFills(60);
    expect(f).toHaveLength(11);
    expect(f.slice(0, 6).every((x) => x === 1)).toBe(true);
    expect(f.slice(6).every((x) => x === 0)).toBe(true);
    expect(crateFills(72)[7]).toBeCloseTo(0.2, 5);
    expect(crateFills(14)[1]).toBeCloseTo(0.4, 5);
    const milk = crateFills(105);
    expect(milk.slice(0, 10).every((x) => x === 1)).toBe(true);
    expect(milk[10]).toBeCloseTo(0.5, 5);
    expect(crateFills(0).every((x) => x === 0)).toBe(true);
  });
  it("marks the right number of a hundred plots as farmed", () => {
    expect(landPlots(69).filter((p) => p.farmed)).toHaveLength(69);
    expect(landPlots(69)).toHaveLength(100);
    expect(landPlots(150).filter((p) => p.farmed)).toHaveLength(100);
    expect(landPlots(-5).filter((p) => p.farmed)).toHaveLength(0);
  });
  it("measures a ring's arc as its share of the circle", () => {
    const { on, all } = arcLength(25, 42);
    expect(on / all).toBeCloseTo(0.25, 6);
    expect(arcLength(150, 10).on).toBeCloseTo(arcLength(100, 10).all, 6);
  });
  it("taxes farm assets at 0% to the limit and 20% above it from April 2026, and 0% before", () => {
    expect(ihtRate(1)).toBe(0);
    expect(ihtRate(IHT.limit)).toBe(0);
    expect(ihtRate(IHT.limit + 0.01)).toBe(20);
    expect(ihtRate(10, false)).toBe(0);
    expect(IHT.rateAbove).toBe(IHT.full / 2);
  });
  it("places a price rise along the ruler", () => {
    expect(rulerPos(10, 20)).toBe(0.5);
    expect(rulerPos(30, 20)).toBe(1);
    expect(rulerPos(-1, 20)).toBe(0);
  });
});
