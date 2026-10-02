import { describe, it, expect } from "vitest";
import { computeParliamentStats } from "./parliamentStats";

const NOW = new Date("2026-10-02T00:00:00Z");
const mp = (party, gender, start, name = `${party}-${gender}-${start}`) => ({ name, party, gender, party_colour: "ff0000", membership_start_date: start });

const MPS = [
  mp("Labour", "F", "2024-07-05"), mp("Labour", "M", "2024-07-05"), mp("Labour", "F", "2015-05-08"),
  mp("Labour", "M", "2019-12-13"), mp("Labour", "F", "2024-07-05"),
  mp("Conservative", "M", "1983-06-09", "Sir Edward Leigh"), mp("Conservative", "M", "2010-05-07"),
  mp("Conservative", "F", "2024-07-05"), mp("Conservative", "M", "2005-05-06"), mp("Conservative", "M", "2001-06-07"),
  mp("Green", "F", "2024-07-05"),
];

describe("computeParliamentStats", () => {
  const s = computeParliamentStats(MPS, [], NOW);

  it("counts MPs, women and new MPs", () => {
    expect(s.total).toBe(11);
    expect(s.women).toBe(5);
    expect(s.womenPct).toBeCloseTo(45.45, 1);
    expect(s.newMps).toBe(5);
    expect(s.majorityLine).toBe(6);
  });

  it("ranks seats by party, largest first", () => {
    expect(s.seatsByParty.map((r) => [r.party, r.count])).toEqual([["Conservative", 5], ["Labour", 5], ["Green", 1]]);
    expect(s.seatsByParty[0].pct).toBeCloseTo(45.45, 1);
  });

  it("only ranks parties of five or more on their share of women", () => {
    expect(s.womenByParty.map((r) => r.party)).toEqual(["Labour", "Conservative"]);
    expect(s.womenByParty[0].womenPct).toBe(60);
    expect(s.womenByParty.find((r) => r.party === "Green")).toBeUndefined();
  });

  it("buckets how long MPs have served and finds the longest", () => {
    expect(s.tenureBands.map((b) => b.count)).toEqual([0, 5, 1, 2, 3]);
    expect(s.tenureBands.reduce((a, b) => a + b.count, 0)).toBe(11);
    expect(s.longest.names).toEqual(["Sir Edward Leigh"]);
    expect(s.longest.years).toBeGreaterThan(43);
    expect(s.medianTenure).toBeGreaterThan(0);
  });

  it("folds Labour (Co-op) into Labour and reports ties for longest-serving", () => {
    const mps = [mp("Labour", "F", "1983-06-09", "A"), mp("Labour (Co-op)", "M", "1983-06-09", "B"), mp("Labour (Co-op)", "F", "2024-07-05", "C")];
    const r = computeParliamentStats(mps, [], NOW);
    expect(r.seatsByParty).toHaveLength(1);
    expect(r.seatsByParty[0]).toMatchObject({ party: "Labour", count: 3, coop: 2, women: 2 });
    expect(r.longest.names).toEqual(["A", "B"]);
  });

  it("counts by-elections and how many changed hands", () => {
    const be = [{ status: "completed", result: "Lab Gain" }, { status: "completed", result: "RUK Hold" }, { status: "vacant", result: null }];
    expect(computeParliamentStats(MPS, be, NOW).byElections).toEqual({ total: 2, gains: 1, holds: 1 });
  });

  it("copes with no MPs", () => {
    const empty = computeParliamentStats([], [], NOW);
    expect(empty.total).toBe(0);
    expect(empty.womenPct).toBe(0);
    expect(empty.longest).toBeNull();
  });
});
