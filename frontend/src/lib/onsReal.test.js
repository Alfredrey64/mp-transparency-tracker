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
