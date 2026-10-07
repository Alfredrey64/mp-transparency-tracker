import { describe, it, expect } from "vitest";
import { makeDeflator, toReal } from "./onsReal";

const defl = makeDeflator([["2000-01", 50], ["2000-02", 50], ["2000-03", 60], ["2020-01", 100], ["2020-02", 100]]);

describe("today's money", () => {
  it("scales a month by how much prices have risen since", () => {
    expect(toReal([["2000-01", 10]], defl)).toEqual([["2000-01", 20]]);
    expect(toReal([["2020-02", 10]], defl)).toEqual([["2020-02", 10]]);
  });

  it("uses the average index across a quarter", () => {
    const [[, v]] = toReal([["2000-Q1", 10]], defl);
    expect(v).toBeCloseTo((10 * 100) / ((50 + 50 + 60) / 3), 6);
  });

  it("leaves out periods before the index starts, and keeps order", () => {
    const out = toReal([["1980-05", 5], ["2000-01", 10], ["2020-01", 10]], defl);
    expect(out.map(([p]) => p)).toEqual(["2000-01", "2020-01"]);
  });

  it("reports the month it adjusts to", () => {
    expect(defl.label).toBe("February 2020");
  });

  it("returns the points unchanged without an index", () => {
    const pts = [["2000-01", 1]];
    expect(toReal(pts, null)).toBe(pts);
  });
});

describe("taking inflation out of rates and price rises", () => {
  // Prices rise 10% over the year to 2001-01 and 5% over the year to 2001-02.
  const index = [["2000-01", 100], ["2000-02", 100], ["2001-01", 110], ["2001-02", 105]];
  const d = makeDeflator(index);

  it("works out the yearly inflation rate for a month, a quarter and a year", () => {
    expect(d.inflationAt("2001-01")).toBeCloseTo(10, 6);
    expect(d.inflationAt("2001-02")).toBeCloseTo(5, 6);
    expect(d.inflationAt("2000-01")).toBeNull();
    expect(d.inflationAt("2001")).toBeCloseTo(7.5, 6);
  });

  it("turns an interest rate into a real rate", () => {
    const out = toReal([["2001-01", 4], ["2001-02", 4]], d, { realMode: "rate" });
    expect(out.map(([p]) => p)).toEqual(["2001-01", "2001-02"]);
    expect(out[0][1]).toBeCloseTo(-6, 6);
    expect(out[1][1]).toBeCloseTo(-1, 6);
  });

  it("shows a price rise relative to prices in general, and drops months it cannot", () => {
    const out = toReal([["2000-01", 3], ["2001-01", 12]], d, { realMode: "relative" });
    expect(out).toHaveLength(1);
    expect(out[0][1]).toBeCloseTo(2, 6);
  });

  it("knows which series can be adjusted", async () => {
    const { canAdjust } = await import("./onsReal");
    expect(canAdjust({ nominal: true })).toBe(true);
    expect(canAdjust({ realMode: "rate" })).toBe(true);
    expect(canAdjust({ format: "pct" })).toBe(false);
  });
});
