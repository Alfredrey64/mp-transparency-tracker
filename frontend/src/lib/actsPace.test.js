import { describe, it, expect } from "vitest";
import { yearFraction, countBy, stepPoints, pathOf, niceTop, ELECTION_YEARS } from "./actsPace";

describe("acts pace", () => {
  it("puts 1 January at 0 and the middle of the year near a half", () => {
    expect(yearFraction("2026-01-01")).toBe(0);
    expect(yearFraction("2026-07-02")).toBeCloseTo(0.4986, 3);
    expect(yearFraction("2024-12-31")).toBeLessThan(1);
  });
  it("counts the Acts made by the same day of the year in another year", () => {
    const acts = [{ date: "2025-01-10" }, { date: "2025-11-02" }, { date: "2025-11-03" }, { date: "2025-12-18" }];
    expect(countBy(acts, "2026-11-02")).toBe(2);
    expect(countBy(acts, "2026-01-01")).toBe(0);
  });
  it("draws a step for each Act and runs flat to the stated point", () => {
    const pts = stepPoints([{ date: "2026-01-01" }, { date: "2026-07-02" }], 0.8);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts.at(-1)).toEqual({ x: 0.8, y: 2 });
    expect(pts.filter((p) => p.x > 0.49 && p.x < 0.505).map((p) => p.y)).toEqual([1, 2]);
  });
  it("scales into a hundred-unit box with the top edge as the count", () => {
    expect(pathOf([{ x: 0, y: 0 }, { x: 1, y: 20 }], 40)).toBe("M0.00 100.00L100.00 50.00");
    expect(niceTop(28)).toBe(30);
    expect(niceTop(39)).toBe(40);
    expect(niceTop(0)).toBe(10);
  });
  it("knows the election years", () => {
    expect(ELECTION_YEARS.has(2024)).toBe(true);
    expect(ELECTION_YEARS.has(2023)).toBe(false);
  });
});
