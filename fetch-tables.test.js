import { describe, it, expect } from "vitest";
import { headerPeriod, pointsFromRow, pointsFromColumn, pointsFromFlow, monthlySums, serialToPeriod, parseCsv, FEEDS } from "./fetch-tables.js";
import { sectorSeries, SECTORS } from "./frontend/src/data/onsSectors.js";

describe("reading period headings", () => {
  it("understands every way the sources write a period", () => {
    expect(headerPeriod("2025")).toBe("2025-12");
    expect(headerPeriod("2024 [p]")).toBe("2024-12");
    expect(headerPeriod("Dec 2010")).toBe("2010-12");
    expect(headerPeriod("June 2026")).toBe("2026-06");
    expect(headerPeriod("Year ending June 2025")).toBe("2025-06");
    expect(headerPeriod("year ending June 2026 [p]")).toBe("2026-06");
    expect(headerPeriod("YE Mar 25 P R")).toBe("2025-03");
    expect(headerPeriod("2024-25 [p]")).toBe("2025-03");
    expect(headerPeriod("2006-07 [note 1]")).toBe("2007-03");
    expect(headerPeriod("2026 Q2")).toBe("2026-Q2");
    expect(headerPeriod("2024-12")).toBeNull();
    expect(headerPeriod("Change in the latest year")).toBeNull();
    expect(headerPeriod("Percentage change in the latest year (%)")).toBeNull();
  });
});

describe("tables", () => {
  const across = [
    ["Title"],
    ["Date / As at the end of...", "2024", "2025", "Year ending June 2026", "Change in the latest year"],
    ["People claiming asylum", 100, 120, 90, -10],
    ["Of which in hotels", "z", 30, ":", 5],
  ];
  it("reads a row across the periods and skips gaps and change columns", () => {
    expect(pointsFromRow(across, /^Date \/ As at/, "People claiming asylum")).toEqual([["2024-12", 100], ["2025-12", 120], ["2026-06", 90]]);
    expect(pointsFromRow(across, /^Date \/ As at/, "Of which in hotels")).toEqual([["2025-12", 30]]);
    expect(pointsFromRow(across, /^Date \/ As at/, "People claiming asylum", 0.5)[0]).toEqual(["2024-12", 50]);
    expect(() => pointsFromRow(across, /^Date/, "Nope")).toThrow();
  });

  it("reads a column down the periods", () => {
    const down = [["Data of return", "Enforced returns, total"], [2023, 6362], ["2024 [p]", 8171], ["year ending June 2026 [p]", 9669], ["Change in the latest year", 592]];
    expect(pointsFromColumn(down, /^Data of return/, "Enforced returns, total")).toEqual([["2023-12", 6362], ["2024-12", 8171], ["2026-06", 9669]]);
  });

  it("reads a migration flow", () => {
    const rows = [["Flow", "Period", "All"], ["Net migration", "YE Dec 25 P", 171000], ["Net migration", "YE Sep 25 P", 202000], ["Immigration", "YE Dec 25 P", 813000]];
    expect(pointsFromFlow(rows, "Net migration", 2)).toEqual([["2025-09", 202000], ["2025-12", 171000]]);
  });

  it("adds daily counts into months", () => {
    expect(monthlySums([["Date", "n"], ["2025-01-01", 5], ["2025-01-02", "-"], ["2025-01-31", 7], ["2025-02-01", 1]])).toEqual([["2025-01", 12]]);
    expect(monthlySums([["2025-02-01", 1], ["2025-02-28", 2]])).toEqual([["2025-02", 3]]);
  });

  it("turns spreadsheet dates and quoted CSV into usable values", () => {
    expect(serialToPeriod(46204)).toBe("2026-07");
    expect(serialToPeriod(5)).toBeNull();
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n1,2\n')).toEqual([["a", "b"], ["x, y", 'say "hi"'], ["1", "2"]]);
  });
});

describe("feeds", () => {
  it("has a reader for every feed a series asks for", () => {
    for (const sector of SECTORS) {
      for (const def of sectorSeries(sector).filter((d) => d.feed)) expect(FEEDS[def.feed], `${sector.key}/${def.id}`).toBeTypeOf("function");
    }
  });
});
