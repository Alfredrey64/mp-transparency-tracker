import { describe, it, expect } from "vitest";
import { priceView, monthLabel, monthOnly, pounds } from "./housePriceView.js";

const data = {
  month: "2026-09", years: [2024, 2025, 2026],
  areas: {
    E1: { n: "Bristol", p: 360000, c: 2.5, s: 400, sm: "2026-07", t: { d: 600000, s: 400000, t: 350000, f: null }, h: [300000, null, 360000] },
    E92000001: { n: "England", p: 300000, c: 1 },
    K02000001: { n: "United Kingdom", p: 290000, c: 0.8 },
  },
};

describe("priceView", () => {
  const v = priceView(data, "E1", "England");
  it("reads the price, change and sales", () => { expect(v).toMatchObject({ price: 360000, change: 2.5, sales: 400, salesMonth: "2026-07" }); });
  it("keeps kinds of home that have a price", () => { expect(v.kinds.map((k) => k.key)).toEqual(["d", "s", "t"]); });
  it("drops years with no price and works out growth since the first", () => {
    expect(v.history).toEqual([{ year: 2024, price: 300000 }, { year: 2026, price: 360000 }]);
    expect(v.sinceFirst).toBeCloseTo(20);
    expect(v.sinceYear).toBe(2024);
  });
  it("compares with the nation and the UK", () => { expect(v.nation).toEqual({ name: "England", price: 300000, change: 1 }); expect(v.uk.price).toBe(290000); });
  it("is null for an area it does not hold", () => { expect(priceView(data, "X", "England")).toBeNull(); expect(priceView(null, "E1", "England")).toBeNull(); });
});
describe("labels", () => { it("formats", () => { expect(monthLabel("2026-09")).toBe("September 2026"); expect(monthOnly("2026-09")).toBe("September"); expect(pounds(350229)).toBe("£350,229"); }); });
