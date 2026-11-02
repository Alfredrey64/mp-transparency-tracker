import { describe, it, expect } from "vitest";
import { outcomeOf, movesBetweenParties, strip, byYear } from "./byElectionView";

const e = (id, date, result, winner, seat) => ({ election_id: id, election_date: date, result, winning_party: winner, winning_party_colour: "111111", constituency_name: seat });

describe("outcomeOf", () => {
  it("reads gain and hold from the result text", () => {
    expect(outcomeOf("Reform UK Gain")).toBe("gain");
    expect(outcomeOf("Lab Hold")).toBe("hold");
    expect(outcomeOf("Something else")).toBeNull();
    expect(outcomeOf(null)).toBeNull();
  });
});

describe("movesBetweenParties", () => {
  const before = { A: { party: "Conservative" }, B: { party: "Conservative" }, C: { party: "Labour" }, D: null };
  const pred = (seat) => before[seat];
  it("counts each pair of parties and lists the seats", () => {
    const list = [e(1, "2025-01-01", "Reform UK Gain", "Reform UK", "A"), e(2, "2025-02-01", "Reform UK Gain", "Reform UK", "B"), e(3, "2025-03-01", "Lib Dem Gain", "Liberal Democrat", "C")];
    const moves = movesBetweenParties(list, pred);
    expect(moves[0]).toMatchObject({ from: "Conservative", to: "Reform UK", count: 2, seats: ["A", "B"] });
    expect(moves[1]).toMatchObject({ from: "Labour", to: "Liberal Democrat", count: 1 });
  });
  it("ignores holds and gains with no recorded previous party", () => {
    const list = [e(1, "2025-01-01", "Lab Hold", "Labour", "C"), e(2, "2025-02-01", "Reform UK Gain", "Reform UK", "D")];
    expect(movesBetweenParties(list, pred)).toEqual([]);
  });
});

describe("strip and byYear", () => {
  const list = [e(1, "2024-05-01", "Lab Hold", "Labour", "A"), e(2, "2025-02-01", "Reform UK Gain", "Reform UK", "B"), e(3, "2025-06-01", "Lab Hold", "Labour", "C")];
  it("puts the strip oldest first", () => {
    expect(strip(list).map((s) => s.id)).toEqual([1, 2, 3]);
    expect(strip(list)[1].outcome).toBe("gain");
  });
  it("groups by year newest first and filters", () => {
    expect(byYear(list).map((g) => [g.year, g.items.length])).toEqual([["2025", 2], ["2024", 1]]);
    expect(byYear(list, "gain").map((g) => g.year)).toEqual(["2025"]);
    expect(byYear(list, "hold")[0].items.map((x) => x.election_id)).toEqual([3]);
  });
});
