import { describe, it, expect } from "vitest";
import { describeMeasure } from "./onsPledge";

const pct = { format: "pct", kind: "rate" };
const count = { format: "count", kind: "level" };

describe("measuring a pledge", () => {
  it("shows how far short of a target the latest figure is", () => {
    const r = describeMeasure(pct, [["2026-06", 65.8], ["2026-07", 65.4]], { mode: "atLeast", target: 92, targetText: "the 92% standard" });
    expect(r.met).toBe(false);
    expect(r.text).toBe("65.4% in July 2026, 26.6 percentage points short of the 92% standard.");
    expect(r.progress).toBeCloseTo(65.4 / 92, 6);
  });

  it("says when a target is met", () => {
    const r = describeMeasure(count, [["2025-03", 310000]], { mode: "atLeast", target: 300000, targetText: "the yearly need" });
    expect(r.met).toBe(true);
    expect(r.progress).toBe(1);
    expect(r.text).toContain("meets the yearly need");
  });

  it("measures a figure that should fall to or below a ceiling", () => {
    const r = describeMeasure(count, [["2026-06", 16021]], { mode: "atMost", target: 0, targetText: "its goal of zero" });
    expect(r.met).toBe(false);
    expect(r.text).toBe("16,021 in June 2026, 16,021 above its goal of zero.");
  });

  it("shows a fall from the peak, and the peak itself", () => {
    const def = { ...count, yearEnding: true };
    const down = describeMeasure(def, [["2023-06", 900000], ["2025-12", 171000]], { mode: "peak" });
    expect(down.text).toContain("81% below its peak of 900,000");
    expect(down.text).toContain("the year to June 2023");
    expect(describeMeasure(def, [["2023-06", 900000]], { mode: "peak" }).text).toContain("the highest on record");
  });

  it("gives nothing for a series with no data", () => {
    expect(describeMeasure(pct, [], { mode: "peak" })).toBeNull();
  });
});
