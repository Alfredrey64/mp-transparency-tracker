import { describe, it, expect } from "vitest";
import { toLineData, yearTicks } from "./onsChart";
import { changeShort } from "./onsFormat";

describe("chart data", () => {
  it("turns points into x, y and a label", () => {
    expect(toLineData([["2026-08", 3.1]])).toEqual([{ x: 2026 + 7 / 12, y: 3.1, label: "August 2026", period: "2026-08" }]);
  });

  it("spaces year labels to suit the span", () => {
    expect(yearTicks(2023, 2026).map((t) => t.label)).toEqual(["2023", "2024", "2025", "2026"]);
    expect(yearTicks(2000, 2026).map((t) => t.label)).toEqual(["2000", "2005", "2010", "2015", "2020", "2025"]);
    expect(yearTicks(1971, 2026).map((t) => t.label)).toEqual(["1980", "1990", "2000", "2010", "2020"]);
    expect(yearTicks(2025.2, 2025.8).length).toBeGreaterThan(0);
  });

  it("describes a change briefly", () => {
    expect(changeShort({ type: "points", amount: 0.34 })).toBe("up 0.3 pts");
    expect(changeShort({ type: "percent", amount: -12.4 })).toBe("down 12%");
    expect(changeShort({ type: "percent", amount: 0.001 })).toBe("little changed");
  });
});
