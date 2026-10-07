import { describe, it, expect } from "vitest";
import { endMonth, penceSplit, breakdownAt, monthLabel } from "./onsBreakdown";

describe("breakdown", () => {
  it("knows when each kind of period ends", () => {
    expect(endMonth("2025-Q4")).toBe(endMonth("2025-12"));
    expect(endMonth("2025-Q1")).toBe(endMonth("2025-03"));
    expect(endMonth("2025")).toBe(endMonth("2025-12"));
    expect(monthLabel(endMonth("2025-12"))).toBe("December 2025");
  });

  it("splits into whole pence that always add up to 100", () => {
    for (const values of [[1, 1, 1], [33, 33, 34], [0.4, 0.4, 99.2], [5], [2, 3, 5, 7, 11, 13]]) {
      const pence = penceSplit(values);
      expect(pence.reduce((a, b) => a + b, 0)).toBe(100);
      expect(pence.every(Number.isInteger)).toBe(true);
    }
    expect(penceSplit([0, 0])).toEqual([0, 0]);
  });

  it("lines parts up on the latest month all of them have reached", () => {
    const data = {
      total: [["2025-11", 1000], ["2025-12", 1100], ["2026-01", 1200]],
      monthly: [["2025-12", 400], ["2026-01", 420]],
      quarterly: [["2025-Q3", 90], ["2025-Q4", 100]],
    };
    const result = breakdownAt(data, "total", [{ id: "monthly", label: "M" }, { id: "quarterly", label: "Q" }]);
    expect(result.refLabel).toBe("December 2025");
    expect(result.total).toBe(1100);
    expect(result.parts.map((p) => p.value)).toEqual([400, 100]);
    expect(result.other.value).toBe(600);
    expect(result.parts.reduce((a, p) => a + p.pence, result.other.pence)).toBe(100);
  });

  it("leaves out parts it has no figures for, and gives up with no total", () => {
    const data = { total: [["2025-12", 100]], a: [["2025-12", 40]] };
    expect(breakdownAt(data, "total", [{ id: "a", label: "A" }, { id: "missing", label: "X" }]).parts).toHaveLength(1);
    expect(breakdownAt({}, "total", [{ id: "a", label: "A" }])).toBeNull();
    expect(breakdownAt(data, "total", [{ id: "missing", label: "X" }])).toBeNull();
  });

  it("labels yearly figures by year", () => {
    const data = { total: [["2022", 100], ["2023", 90]], a: [["2023", 40]] };
    const r = breakdownAt(data, "total", [{ id: "a", label: "A" }], { annual: true });
    expect(r.refLabel).toBe("2023");
    expect(r.total).toBe(90);
    expect(r.other.value).toBe(50);
  });
});
