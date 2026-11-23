import { describe, it, expect } from "vitest";
import { allocate, dotBands, strip, pointsChange, monthLabel, shortBoard } from "./gpWaits";

describe("allocate", () => {
  it("always hands out exactly the number of dots", () => {
    for (const p of [[47, 7.5, 16.4, 11.6, 7.1, 5, 5.4], [33.3, 33.3, 33.4], [100], [0.4, 99.6]]) {
      expect(allocate(p).reduce((a, b) => a + b, 0)).toBe(100);
    }
    expect(allocate([47, 7.5, 16.4, 11.6, 7.1, 5, 5.4])).toEqual([47, 8, 16, 12, 7, 5, 5]);
  });
  it("gives nothing when there is nothing to share", () => {
    expect(allocate([null, 0])).toEqual([0, 0]);
  });
  it("lists each dot's band in order", () => {
    expect(dotBands([2, 0, 1])).toEqual([0, 0, 2]);
  });
});

describe("strip", () => {
  it("puts the lowest value at the left and stacks close neighbours", () => {
    const s = strip([75, 90, 75.5, 75.8], 70, 95);
    expect(s[0].x).toBeCloseTo(0.2, 5);
    expect(s[1].x).toBeCloseTo(0.8, 5);
    // no two boards closer than the gap share a row
    for (let a = 0; a < s.length; a += 1) for (let b = a + 1; b < s.length; b += 1) if (Math.abs(s[a].x - s[b].x) < 0.028) expect(s[a].row).not.toBe(s[b].row);
    expect(s[1].row).toBe(0);
  });
});

describe("words", () => {
  it("describes a change in points", () => {
    expect(pointsChange(82.4, 83.4)).toBe("down 1.0 point on a year ago");
    expect(pointsChange(84, 83.2)).toBe("up 0.8 points on a year ago");
    expect(pointsChange(83, 83)).toBe("no change on a year ago");
    expect(pointsChange(null, 1)).toBeNull();
  });
  it("names months and boards", () => {
    expect(monthLabel("2026-09")).toBe("September 2026");
    expect(shortBoard("Bath and North East Somerset, Swindon and Wiltshire")).toBe("Bath");
    expect(shortBoard("Devon")).toBe("Devon");
  });
});
