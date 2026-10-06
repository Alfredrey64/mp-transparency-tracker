import { describe, it, expect } from "vitest";
import { periodsPerYear, yearOnYear, rollingSum, percentOf, derive } from "./onsDerive";
import { bandsBetween, governmentAt, GOVERNMENTS } from "./governments";

describe("derived series", () => {
  const monthly = Array.from({ length: 14 }, (_, i) => [`${2025 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`, 100 + i]);

  it("works out how often a series is published", () => {
    expect(periodsPerYear(monthly)).toBe(12);
    expect(periodsPerYear([["2025-Q1", 1], ["2025-Q2", 1]])).toBe(4);
    expect(periodsPerYear([["2024", 1], ["2025", 1]])).toBe(1);
  });

  it("gives per cent change on a year earlier", () => {
    const yoy = yearOnYear(monthly);
    expect(yoy).toHaveLength(2);
    expect(yoy[0][0]).toBe("2026-01");
    expect(yoy[0][1]).toBeCloseTo(12);
  });

  it("gives a running total", () => {
    expect(rollingSum([["a", 1], ["b", 2], ["c", 3], ["d", 4]], 2)).toEqual([["b", 3], ["c", 5], ["d", 7]]);
  });

  it("works out one series as a share of another", () => {
    expect(percentOf([["2020", 25], ["2021", 30]], [["2020", 100], ["2021", 0]])).toEqual([["2020", 25]]);
  });

  it("derives from a spec, and returns nothing if the base is missing", () => {
    expect(derive({ op: "sum", n: 2, from: "x" }, { x: [["a", 1], ["b", 2]] })).toEqual([["b", 3]]);
    expect(derive({ op: "yoy", from: "missing" }, {})).toEqual([]);
    expect(derive({ op: "percentOf", from: "x", of: "y" }, { x: [["2020", 5]], y: [["2020", 50]] })).toEqual([["2020", 10]]);
  });
});

describe("governments", () => {
  it("is in date order", () => {
    for (let i = 1; i < GOVERNMENTS.length; i++) expect(GOVERNMENTS[i].from).toBeGreaterThan(GOVERNMENTS[i - 1].from);
  });

  it("finds who was in office", () => {
    expect(governmentAt(2000).pm).toBe("Blair");
    expect(governmentAt(2012.5).pm).toBe("Cameron");
    expect(governmentAt(2026).pm).toBe("Starmer");
    expect(governmentAt(1900)).toBeNull();
  });

  it("clips governments to a window", () => {
    const b = bandsBetween(2009, 2011, 2030);
    expect(b.map((x) => x.pm)).toEqual(["Brown", "Cameron"]);
    expect(b[0].start).toBe(2009);
    expect(b.at(-1).end).toBe(2011);
  });
});
