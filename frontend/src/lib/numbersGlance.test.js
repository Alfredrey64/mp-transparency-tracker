import { describe, it, expect } from "vitest";
import { verdict, tenthVerdict, glanceTiles, FORMATS } from "./numbersGlance";

describe("numbers at a glance", () => {
  it("says how a figure compares, and whether that is good news", () => {
    expect(verdict(2.4, 4.1, { lowerIsBetter: true })).toMatchObject({ dir: "below", text: "Lower than England", tone: "good", arrow: "down" });
    expect(verdict(44180, 39298)).toMatchObject({ dir: "above", text: "Higher than England", tone: "good", arrow: "up" });
    expect(verdict(5, 4, { lowerIsBetter: true })).toMatchObject({ tone: "warn" });
    expect(verdict(2714, 2411, { neutral: true, name: "the England average" })).toMatchObject({ text: "Higher than the England average", tone: "flat" });
    expect(verdict(100, 101)).toMatchObject({ dir: "close", text: "Close to England", tone: "flat", arrow: "same" });
    expect(verdict(null, 4)).toBeNull();
    expect(verdict(4, 0)).toBeNull();
  });
  it("describes the deprivation tenth", () => {
    expect(tenthVerdict(1).tone).toBe("warn");
    expect(tenthVerdict(6).text).toBe("Around the middle");
    expect(tenthVerdict(9).tone).toBe("good");
    expect(tenthVerdict(0)).toBeNull();
  });
  it("builds a box only for the figures that exist, each pointing at its section", () => {
    const tiles = glanceTiles({
      nb: { decile: 6, nation: "England" }, tax: { last: 2714, average: 2411 }, regionName: "South West",
      snapshot: [{ metric: { id: "price" }, value: 301616, uk: 272642 }, { metric: { id: "pay" }, value: 722, uk: 700 }],
      claim: { rate: 2.4, nat: 4.1, month: "October 2026" }, pay: { pay: 44180, nat: 39298, year: "2025" },
      roads: [{ key: "a", value: 3, nat: 4 }, { key: "u", value: 20, nat: 17 }],
    });
    expect(tiles.map((t) => t.id)).toEqual(["hood", "jobs", "pay", "tax", "homes", "roads"]);
    expect(tiles[0]).toMatchObject({ kind: "tenth", valueText: "6th tenth", section: "ma-n-hood" });
    expect(tiles[5]).toMatchObject({ value: 20, ref: 17, section: "ma-n-council" });
    expect(glanceTiles({})).toEqual([]);
    expect(glanceTiles({ tax: { last: 2000, average: 2411 } }).map((t) => t.id)).toEqual(["tax"]);
  });
  it("formats figures", () => {
    expect(FORMATS.money(44180)).toBe("£44,180");
    expect(FORMATS.pct1(2.44)).toBe("2.4%");
    expect(FORMATS.pct0(19.6)).toBe("20%");
  });
});
