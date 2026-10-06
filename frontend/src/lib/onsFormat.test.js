import { describe, it, expect } from "vitest";
import { normalisePeriod, periodToT, periodLabel, formatValue, formatAxis, latestInfo, sentenceFor, sliceRange, niceTicks, changeWords } from "./onsFormat";

describe("ONS periods", () => {
  it("normalises months, quarters and years", () => {
    expect(normalisePeriod("months", "2026 AUG")).toBe("2026-08");
    expect(normalisePeriod("months", "1989 jan")).toBe("1989-01");
    expect(normalisePeriod("quarters", "2026 Q2")).toBe("2026-Q2");
    expect(normalisePeriod("years", "2025")).toBe("2025");
    expect(normalisePeriod("months", "nonsense")).toBeNull();
  });

  it("orders periods and labels them for people", () => {
    expect(periodToT("2026-Q3")).toBeGreaterThan(periodToT("2026-Q2"));
    expect(periodToT("2026-08")).toBeCloseTo(2026 + 7 / 12);
    expect(periodLabel("2026-08")).toBe("August 2026");
    expect(periodLabel("2026-Q2")).toBe("April to June 2026");
    expect(periodLabel("2025")).toBe("2025");
  });
});

describe("ONS values", () => {
  it("writes each kind of number plainly", () => {
    expect(formatValue("pct", 3.14)).toBe("3.1%");
    expect(formatValue("gbp", 756)).toBe("£756");
    expect(formatValue("gbpbn", 18268)).toBe("£18.3bn");
    expect(formatValue("gbpbn0", 744453)).toBe("£744bn");
    expect(formatValue("thousands", 1839)).toBe("1.84 million");
    expect(formatValue("thousands", 702)).toBe("702,000");
    expect(formatValue("people", 69483900)).toBe("69.5 million");
    expect(formatValue("pct", null)).toBe("n/a");
  });

  it("writes short axis labels", () => {
    expect(formatAxis("pct", 2)).toBe("2%");
    expect(formatAxis("gbpbn", 18000)).toBe("£18bn");
    expect(formatAxis("people", 60000000)).toBe("60m");
  });
});

describe("comparing with a year earlier", () => {
  const monthly = [["2025-08", 2.8], ["2026-07", 2.9], ["2026-08", 3.1]];
  it("gives point changes for rates and percentage changes for levels", () => {
    const rate = latestInfo({ kind: "rate" }, monthly);
    expect(rate.change.type).toBe("points");
    expect(rate.change.amount).toBeCloseTo(0.3);
    const level = latestInfo({ kind: "level" }, [["2025-07", 700], ["2026-07", 756]]);
    expect(level.change.type).toBe("percent");
    expect(level.change.amount).toBeCloseTo(8);
  });

  it("copes with no earlier figure", () => {
    expect(latestInfo({ kind: "rate" }, [["2026-08", 3.1]]).change).toBeUndefined();
    expect(latestInfo({ kind: "rate" }, [])).toBeNull();
  });

  it("describes a change in words", () => {
    expect(changeWords({ type: "points", amount: 0.3 })).toBe("up 0.3 percentage points on a year earlier");
    expect(changeWords({ type: "percent", amount: -4.2 })).toBe("down 4.2% on a year earlier");
    expect(changeWords({ type: "percent", amount: 0.01 })).toBe("little changed on a year earlier");
  });

  it("words quarters and mid-year figures naturally", () => {
    const q = { label: "Output", format: "pct", kind: "rate" };
    expect(sentenceFor(q, [["2025-Q2", 1], ["2026-Q2", 1.5]])).toBe("Output was 1.5% in the April to June 2026 quarter, up 0.5 percentage points on a year earlier.");
    const pop = { sentenceName: "The UK population", format: "people", kind: "level", labelPrefix: "mid-" };
    expect(sentenceFor(pop, [["2024", 69000000], ["2025", 69500000]])).toBe("The UK population was 69.5 million in mid-2025, up 0.7% on a year earlier.");
  });

  it("writes a whole sentence", () => {
    const def = { label: "Inflation", sentenceName: "Inflation (CPI)", format: "pct", kind: "rate" };
    expect(sentenceFor(def, monthly)).toBe("Inflation (CPI) was 3.1% in August 2026, up 0.3 percentage points on a year earlier.");
  });
});

describe("chart helpers", () => {
  it("keeps only the recent years", () => {
    const pts = [["2015", 1], ["2020", 2], ["2024", 3], ["2025", 4]];
    expect(sliceRange(pts, 2).map((p) => p[0])).toEqual(["2024", "2025"]);
    expect(sliceRange(pts, 0)).toHaveLength(4);
  });

  it("picks round tick values", () => {
    expect(niceTicks(0, 10)).toEqual([0, 2.5, 5, 7.5, 10]);
    const t = niceTicks(-1.3, 6.2);
    expect(t[0]).toBeGreaterThanOrEqual(-1.3);
    expect(t.at(-1)).toBeLessThanOrEqual(6.2 + 1e-6);
  });
});
