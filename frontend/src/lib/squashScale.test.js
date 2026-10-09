import { describe, it, expect } from "vitest";
import { makeSquash, hasExtremes, squashTicks } from "./squashScale";

describe("squashed scale", () => {
  const values = [2, -3, 5, 4, -2, 6, 1, 3, 4, 500];
  it("round-trips and keeps zero and order", () => {
    const s = makeSquash(values);
    expect(s.to(0)).toBe(0);
    for (const v of [-50, -3, 0, 4, 500]) expect(s.from(s.to(v))).toBeCloseTo(v, 6);
    expect(s.to(-5)).toBeCloseTo(-s.to(5), 9);
    expect(s.to(500)).toBeGreaterThan(s.to(50));
  });
  it("gives the usual values far more room than a straight scale does", () => {
    const s = makeSquash(values);
    const squeezed = s.to(5) / s.to(500);
    expect(squeezed).toBeGreaterThan(0.1); // a straight scale would give 0.01
  });
  it("spots extremes only when one value dwarfs the rest", () => {
    expect(hasExtremes(values)).toBe(true);
    expect(hasExtremes([2, 3, 4, 5, 6, 5, 4, 3, 2, 8])).toBe(false);
    expect(hasExtremes([1, 2])).toBe(false);
  });
  it("still labels a very wide range, within the limit", () => {
    const t = squashTicks(-3000, 8000, 7);
    expect(t).toContain(0);
    expect(t.length).toBeLessThanOrEqual(7);
    expect(t.length).toBeGreaterThan(3);
  });
  it("picks round labels, with zero, on both sides", () => {
    const t = squashTicks(-60, 600, 8);
    expect(t).toContain(0);
    expect(t).toContain(100);
    expect(t).toContain(-10);
    expect(t.length).toBeLessThanOrEqual(9);
  });
});
