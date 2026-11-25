import { describe, expect, it } from "vitest";
import { shapeSpeaking, median, buildSpeaking, windowTo } from "./mpSpeaking.js";

describe("shapeSpeaking", () => {
  it("reads the count and the newest sitting day", () => {
    expect(shapeSpeaking({ SpokenResultCount: 95, TotalResultCount: 95, Results: [{ SittingDate: "2026-11-12T00:00:00" }] })).toEqual({ count: 95, last: "2026-11-12" });
  });
  it("accepts a member who has not spoken, and refuses a response that is not Hansard's", () => {
    expect(shapeSpeaking({ SpokenResultCount: 0, Results: [] })).toEqual({ count: 0, last: null });
    expect(shapeSpeaking({})).toBeNull();
    expect(shapeSpeaking(null)).toBeNull();
    expect(shapeSpeaking({ SpokenResultCount: "12" })).toBeNull();
  });
});

describe("median and the file", () => {
  it("takes the middle MP", () => {
    expect(median([1, 5, 100])).toBe(5);
    expect(median([2, 4])).toBe(3);
    expect(median([])).toBeNull();
  });
  it("builds the file with the window and the middle count", () => {
    const f = buildSpeaking({ 1: { count: 10, last: null }, 2: { count: 30, last: null }, 3: { count: 20, last: null } }, { from: "2025-11-25", to: "2026-11-25" });
    expect(f).toMatchObject({ from: "2025-11-25", to: "2026-11-25", median: 20 });
  });
  it("the window is the 12 months to today", () => expect(windowTo("2026-11-25")).toEqual({ from: "2025-11-25", to: "2026-11-25" }));
});
