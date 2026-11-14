import { describe, it, expect } from "vitest";
import { latestAnnouncement, budgetApplied } from "./tax-budget-lib.mjs";

const series = { a: [["2026-04-01", 1, { ann: "2025-11-26" }], ["2027-04-01", 2, { ann: "2026-10-28" }]], b: [["2020-01-01", 3]] };

describe("tax budget check", () => {
  it("finds the newest announcement date", () => { expect(latestAnnouncement(series)).toBe("2026-10-28"); expect(latestAnnouncement({ b: [["2020-01-01", 3]] })).toBeNull(); });
  it("says a Budget is applied when a step credits its day, give or take a day", () => {
    expect(budgetApplied(series, "2026-10-28")).toBe(true);
    expect(budgetApplied(series, "2026-10-29")).toBe(true);
    expect(budgetApplied(series, "2027-03-03")).toBe(false);
  });
});
