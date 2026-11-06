import { describe, expect, it } from "vitest";
import { homeFigures, homeProblems } from "./check-site-lib.mjs";

const pairs = (mps, age) => [["MPs tracked", mps], ["last updated", age], ["source data only", "Official"]];

describe("the home page figures the site check reads", () => {
  it("reads the count and a recent age as they are written on the page", () => {
    expect(homeFigures(pairs("650", "1h ago"))).toEqual({ mps: 650, days: 0, age: "1h ago" });
    expect(homeFigures(pairs("1,000", "Just now")).mps).toBe(1000);
    expect(homeFigures(pairs("650", "Yesterday")).days).toBe(1);
    expect(homeFigures(pairs("650", "3d ago")).days).toBe(3);
  });
  it("treats a date (a week old or more) as stale", () => {
    expect(homeFigures(pairs("650", "28 Oct 2026")).days).toBe(Infinity);
  });
  it("accepts a healthy page", () => {
    expect(homeProblems(homeFigures(pairs("650", "5h ago")))).toEqual([]);
    expect(homeProblems(homeFigures(pairs("650", "3d ago")))).toEqual([]);
  });
  it("flags a count that did not load, one that is too high and old or missing ages", () => {
    expect(homeProblems(homeFigures(pairs("0", "5h ago")))[0]).toMatch(/did not load/);
    expect(homeProblems(homeFigures([]))).toHaveLength(2);
    expect(homeProblems(homeFigures(pairs("651", "5h ago")))[0]).toMatch(/651 MPs for 650 seats/);
    expect(homeProblems(homeFigures(pairs("650", "4d ago")))[0]).toMatch(/4 days ago/);
    expect(homeProblems(homeFigures(pairs("650", "28 Oct 2026")))[0]).toMatch(/a week or more ago/);
  });
});
