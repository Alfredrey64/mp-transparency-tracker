import { describe, it, expect } from "vitest";
import { squarify } from "./treemap";

describe("squarify", () => {
  const items = [{ key: "a", value: 60 }, { key: "b", value: 25 }, { key: "c", value: 10 }, { key: "d", value: 5 }];
  it("gives each item an area in proportion to its value and fills the space", () => {
    const r = squarify(items, 200, 100);
    let area = 0;
    for (const it of items) {
      const a = r[it.key].w * r[it.key].h;
      area += a;
      expect(a / (200 * 100)).toBeCloseTo(it.value / 100, 6);
    }
    expect(area).toBeCloseTo(200 * 100, 6);
  });
  it("keeps every rectangle inside the space", () => {
    const r = squarify(items, 200, 100);
    for (const k of Object.keys(r)) {
      expect(r[k].x).toBeGreaterThanOrEqual(-1e-9);
      expect(r[k].y).toBeGreaterThanOrEqual(-1e-9);
      expect(r[k].x + r[k].w).toBeLessThanOrEqual(200 + 1e-9);
      expect(r[k].y + r[k].h).toBeLessThanOrEqual(100 + 1e-9);
    }
  });
  it("keeps the same place order when the values change", () => {
    const a = squarify(items, 200, 100);
    const b = squarify(items.map((d) => ({ ...d, value: d.value + 1 })), 200, 100);
    expect(Math.abs(a.a.x - b.a.x)).toBeLessThan(10);
  });
  it("copes with no items", () => {
    expect(squarify([], 100, 100)).toEqual({});
  });
});
