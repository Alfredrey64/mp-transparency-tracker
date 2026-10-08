import { describe, it, expect } from "vitest";
import { seatRows, seatsByParty, uniformSwing, swingCurve, challengers } from "./swing";

const seat = (name, a, b, shareA, shareB, majority) => ({
  name,
  mp: { name: "X" },
  result: {
    majority,
    majorityPct: (shareA - shareB) * 100,
    candidates: [{ party: a, share: shareA, colour: "aa0000" }, { party: b, share: shareB, colour: "0000aa" }, { party: "Other", share: 0.1, colour: "888888" }],
  },
});
const seats = {
  one: seat("One", "Labour", "Conservative", 0.42, 0.4, 900),
  two: seat("Two", "Labour", "Conservative", 0.5, 0.3, 9000),
  three: seat("Three", "Labour", "Reform UK", 0.4, 0.3, 4000),
  four: { name: "Four", mp: {}, result: null },
};

describe("seat rows", () => {
  it("sorts by closeness and skips seats without a result", () => {
    const rows = seatRows(seats);
    expect(rows.map((r) => r.name)).toEqual(["One", "Three", "Two"]);
    expect(rows[0].swing).toBeCloseTo(1, 5);
  });
  it("counts seats by party", () => {
    expect(seatsByParty(seatRows(seats))[0]).toMatchObject({ party: "Labour", count: 3 });
  });
});

describe("uniform swing", () => {
  const rows = seatRows(seats);
  it("flips only seats the other party came second in, within the swing", () => {
    expect(uniformSwing(rows, "Labour", "Conservative", 1).map((r) => r.name)).toEqual(["One"]);
    expect(uniformSwing(rows, "Labour", "Conservative", 10).map((r) => r.name)).toEqual(["One", "Two"]);
    expect(uniformSwing(rows, "Labour", "Reform UK", 5).map((r) => r.name)).toEqual(["Three"]);
  });
  it("returns nothing for the same party or a bad swing", () => {
    expect(uniformSwing(rows, "Labour", "Labour", 5)).toEqual([]);
    expect(uniformSwing(rows, "Labour", "Conservative", -1)).toEqual([]);
  });
  it("builds a curve that never goes down", () => {
    const curve = swingCurve(rows, "Labour", "Conservative", 12);
    expect(curve).toHaveLength(13);
    for (let i = 1; i < curve.length; i++) expect(curve[i].seats).toBeGreaterThanOrEqual(curve[i - 1].seats);
  });
  it("lists who comes second", () => {
    expect(challengers(rows, "Labour")).toEqual([{ name: "Conservative", seats: 2 }, { name: "Reform UK", seats: 1 }]);
  });
});
