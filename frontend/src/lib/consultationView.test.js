import { describe, it, expect } from "vitest";
import { closingCounts, daysBetween } from "./consultationView";

describe("consultation view", () => {
  it("counts consultations by how soon they close", () => {
    const items = [{ closes: "2026-11-19" }, { closes: "2026-11-25" }, { closes: "2026-12-10" }, { closes: "2027-03-01" }, { closes: null }];
    expect(closingCounts(items, "2026-11-19")).toEqual({ week: 2, fortnight: 2, month: 3, undated: 1 });
  });
  it("counts days between two days", () => { expect(daysBetween("2026-11-19", "2026-11-26")).toBe(7); });
});
