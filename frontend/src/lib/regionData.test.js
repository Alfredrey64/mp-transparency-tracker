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

import { niceBands, classOf, classColour } from "./regionData";

describe("whole-number colour classes", () => {
  it("picks round edges that cover the range", () => {
    expect(niceBands(2.3, 7.9).bounds).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(niceBands(48000, 552000).bounds).toEqual([0, 100000, 200000, 300000, 400000, 500000, 600000]);
    expect(niceBands(0, 1).bounds[0]).toBe(0);
    expect(niceBands(5, 5).bounds.length).toBe(2);
  });

  it("puts values in classes and leaves gaps out", () => {
    const { bounds } = niceBands(2, 8);
    expect(classOf(2, bounds)).toBe(0);
    expect(classOf(3, bounds)).toBe(1);
    expect(classOf(8, bounds)).toBe(bounds.length - 2);
    expect(classOf(null, bounds)).toBe(-1);
  });

  it("gives every class its own colour", () => {
    const colours = Array.from({ length: 6 }, (_, i) => classColour("#2F9E6E", i, 6));
    expect(new Set(colours).size).toBe(6);
  });
});

import { valueAtOrBefore } from "./onsStats";
import { periodToT } from "./onsFormat";

describe("valuesOver against the plain search it replaced", () => {
  const pts = (n, start = 1990) => Array.from({ length: n }, (_, i) => [`${start + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`, (i * 7) % 13]);
  const plain = (points, timeline) => timeline.map((t) => valueAtOrBefore(points, t + 1e-6)?.[1] ?? null);

  it("gives the same answer for every date of a long timeline", () => {
    const points = pts(400);
    const timeline = monthlyTimeline([points], 0).length ? monthlyTimeline([points]) : [];
    expect(timeline.length).toBeGreaterThan(300);
    expect(valuesOver(points, timeline)).toEqual(plain(points, timeline));
  });
  it("gives the same answer for dates before the series starts and after it ends", () => {
    const points = pts(24, 2000);
    const timeline = [1999, 2000, 2000 + 5 / 12, 2001.9, 2002.1, 2030];
    expect(valuesOver(points, timeline)).toEqual(plain(points, timeline));
    expect(valuesOver(points, timeline)[0]).toBeNull();
  });
  it("still answers correctly if the timeline is out of order, and for quarterly series", () => {
    const points = [["2020-Q1", 1], ["2020-Q2", 2], ["2020-Q3", 3]];
    const timeline = [2020.6, 2020, 2020.3, 2020.9];
    expect(valuesOver(points, timeline)).toEqual(plain(points, timeline));
  });
  it("reads a gap in the data as no value, not as the one before", () => {
    expect(valuesOver([["2020-01", null], ["2020-02", 4]], [2020, 2020 + 1 / 12])).toEqual([null, 4]);
  });
  it("works out each period once and gives the same numbers as before", () => {
    expect(periodToT("2020-Q3")).toBe(2020.5);
    expect(periodToT("2020-04")).toBeCloseTo(2020 + 3 / 12, 10);
    expect(periodToT("2020")).toBe(2020);
    expect(periodToT("2020-Q3")).toBe(2020.5);
  });
});
