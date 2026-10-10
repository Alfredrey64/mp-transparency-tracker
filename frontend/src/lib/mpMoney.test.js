import { describe, it, expect } from "vitest";
import { topSources, moneyProfile, concentrationPhrase } from "./mpMoney";

const rows = [
  { donor_name: "Acme Ltd", value_amount: 1000 },
  { donor_name: "ACME Limited", value_amount: 3000 },
  { donor_name: "Bright Co", value_amount: 500 },
  { donor_name: null, value_amount: 900 },
  { donor_name: "No Value", value_amount: null },
  { donor_name: "Zero", value_amount: 0 },
];

describe("topSources", () => {
  it("merges name variants and ranks by total", () => {
    const s = topSources(rows);
    expect(s.map((x) => x.total)).toEqual([4000, 500]);
    expect(s[0].count).toBe(2);
    expect(s[0].name).toBe("ACME Limited");
  });
  it("ignores entries with no source or no value", () => {
    expect(topSources([{ donor_name: "", value_amount: 5 }, { donor_name: "X" }])).toEqual([]);
    expect(topSources(null)).toEqual([]);
  });
  it("respects the limit", () => expect(topSources(rows, 1)).toHaveLength(1));
});

describe("moneyProfile", () => {
  it("returns null with nothing to show", () => expect(moneyProfile([])).toBeNull());
  it("totals, counts and gives shares", () => {
    const p = moneyProfile(rows);
    expect(p.total).toBe(4500);
    expect(p.sources).toBe(2);
    expect(p.entries).toBe(3);
    expect(p.top[0].share).toBeCloseTo(0.889, 2);
    expect(p.topThreeShare).toBe(1);
  });
});

describe("concentrationPhrase", () => {
  it("says so when one source dominates", () => {
    expect(concentrationPhrase(moneyProfile(rows))).toMatch(/^Most of it \(89%\) came from one source, ACME Limited/);
  });
  it("handles a single source and many sources", () => {
    expect(concentrationPhrase(moneyProfile([{ donor_name: "A", value_amount: 5 }]))).toBe("All of it came from a single source.");
    const many = Array.from({ length: 9 }, (_, i) => ({ donor_name: `Donor ${i}x`, value_amount: 100 }));
    expect(concentrationPhrase(moneyProfile(many))).toBe("It is spread across 9 different sources.");
  });
});
