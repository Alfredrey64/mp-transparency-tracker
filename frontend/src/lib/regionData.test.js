import { describe, it, expect } from "vitest";
import { tLabel, monthlyTimeline, valuesOver, ranked, ordinal, domainOf, fraction } from "./regionData";

describe("region data", () => {
  it("labels a point in time as a month and year", () => {
    expect(tLabel(2026 + 8 / 12)).toBe("September 2026");
    expect(tLabel(2000)).toBe("January 2000");
  });

  it("runs the timeline from the latest start to the earliest end, month by month", () => {
    const a = [["2000-01", 1], ["2000-06", 2]];
    const b = [["2000-03", 5], ["2001-01", 6]];
    const t = monthlyTimeline([a, b]);
    expect(t[0]).toBeCloseTo(2000 + 2 / 12, 6);
    expect(t.at(-1)).toBeCloseTo(2000 + 5 / 12, 6);
    expect(t).toHaveLength(4);
    expect(monthlyTimeline([a, [["2005-01", 1]]])).toEqual([]);
    expect(monthlyTimeline([])).toEqual([]);
  });

  it("gives each region its latest reading on or before each month", () => {
    const pts = [["2000-01", 10], ["2000-04", 20]];
    const timeline = [2000, 2000 + 1 / 12, 2000 + 3 / 12, 2000 + 4 / 12];
    expect(valuesOver(pts, timeline)).toEqual([10, 10, 20, 20]);
    expect(valuesOver(pts, [1999])).toEqual([null]);
  });

  it("ranks highest first and leaves out regions with no value", () => {
    expect(ranked({ a: 3, b: 9, c: null, d: 5 })).toEqual([{ key: "b", rank: 1 }, { key: "d", rank: 2 }, { key: "a", rank: 3 }]);
  });

  it("writes ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
  });

  it("finds a fixed scale and places values on it", () => {
    const d = domainOf({ a: [1, 5, null], b: [3, 9] });
    expect(d).toEqual([1, 9]);
    expect(fraction(5, d)).toBe(0.5);
    expect(fraction(100, d)).toBe(1);
    expect(fraction(null, d)).toBe(0);
    expect(domainOf({})).toEqual([0, 1]);
  });
});

import { rampColour, bandsOf, valueAtPosition } from "./regionData";

describe("map colours and key", () => {
  it("blends from pale to vivid and stays within the ends", () => {
    expect(rampColour("#2F9E6E", 0)).toContain("0%");
    expect(rampColour("#2F9E6E", 1)).toContain("100%");
    expect(rampColour("#2F9E6E", -3)).toBe(rampColour("#2F9E6E", 0));
    expect(rampColour("#2F9E6E", 9)).toBe(rampColour("#2F9E6E", 1));
    expect(rampColour("#2F9E6E", 0.5)).toContain("#2F9E6E");
  });

  it("counts places in each band of the scale", () => {
    const bands = bandsOf({ a: 0, b: 1, c: 5, d: 10, e: null }, [0, 10], 5);
    expect(bands.map((b) => b.count)).toEqual([2, 0, 1, 0, 1]);
    expect(bands[4].keys).toEqual(["d"]);
    expect(bands[0].from).toBe(0);
    expect(bands.at(-1).to).toBe(10);
  });

  it("finds the value between two months", () => {
    expect(valueAtPosition([10, 20, 40], 0)).toBe(10);
    expect(valueAtPosition([10, 20, 40], 1.5)).toBe(30);
    expect(valueAtPosition([10, 20, 40], 99)).toBe(40);
    expect(valueAtPosition([null, 20], 0.5)).toBe(20);
    expect(valueAtPosition([], 1)).toBeNull();
  });
});
