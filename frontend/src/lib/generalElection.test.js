import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { summarise2024, resultRows, seats2019, seatChanges, REPLACED_SEAT_WINNERS } from "./generalElection";
import { GE2024 } from "../data/generalElection2024";

const seat = (name, cands, extra = {}) => ({
  name,
  result: { isGeneralElection: true, turnout: cands.reduce((n, c) => n + c[1], 0), electorate: 200, majority: cands[0][1] - cands[1][1], candidates: cands.map(([party, votes, share]) => ({ party, votes, share, colour: "ff0000" })), ...extra },
});

const data = {
  a: seat("A", [["Labour", 60, 0.6], ["Conservative", 30, 0.3], ["Green Party", 10, 0.1]]),
  b: seat("B", [["Conservative", 45, 0.45], ["Labour", 44, 0.44], ["Reform UK", 11, 0.11]]),
  c: seat("C", [["Reform UK", 50, 0.5], ["Labour", 30, 0.3], ["Conservative", 20, 0.2]]),
};

describe("summarise2024", () => {
  it("counts seats by party, the seats won with under half the local vote, and the share of votes that did not go to the winner", () => {
    const s = summarise2024(data, {});
    expect(s.seats).toEqual({ Labour: 1, Conservative: 1, "Reform UK": 1 });
    expect(s.underHalf).toBe(1);
    expect(Math.round(s.shareNotForWinner)).toBe(Math.round((1 - (60 + 45 + 50) / 300) * 100));
    expect(s.closest[0].name).toBe("B");
  });

  it("counts a seat that has since had a by-election for its 2024 winner, but leaves its votes out", () => {
    const withBy = { ...data, d: { name: "D", result: { isGeneralElection: false, candidates: [{ party: "Independent", votes: 5, share: 1 }] } } };
    const s = summarise2024(withBy, { d: "Labour" });
    expect(s.seats.Labour).toBe(2);
    expect(s.totalSeats).toBe(4);
    expect(s.replaced).toBe(1);
  });

  it("reports a seat it has no 2024 winner for instead of silently skipping it", () => {
    const withBy = { ...data, d: { name: "D", result: { isGeneralElection: false, candidates: [] } } };
    expect(summarise2024(withBy, {}).notCounted).toBe(1);
  });
});

describe("resultRows", () => {
  const official = { validVotes: 1000, independentSeats: 1, parties: [["Labour", 500, 2], ["Conservative", 300, 1]] };
  it("works out shares and votes per seat won, and leaves the rest as one row", () => {
    const rows = resultRows({ Labour: 2, Conservative: 1, Independent: 1 }, official);
    expect(rows[0]).toMatchObject({ party: "Labour", seatShare: 50, voteShare: 50, votesPerSeat: 250 });
    const other = rows.at(-1);
    expect(other).toMatchObject({ other: true, seats: 1, votes: 200 });
  });
});

describe("against the published 2024 result", () => {
  it("counts the same seats for every party as Parliament's published table", () => {
    const constituencies = JSON.parse(fs.readFileSync(new URL("../data/constituencies.json", import.meta.url), "utf8")).constituencies;
    const counted = summarise2024(constituencies);
    expect(counted.notCounted).toBe(0);
    expect(counted.totalSeats).toBe(650);
    for (const [party, , seats] of GE2024.parties) expect(counted.seats[party] ?? 0, party).toBe(seats);
    expect(counted.seats.Independent ?? 0).toBe(GE2024.independentSeats);
  });
});

describe("2019 and the seven by-election seats", () => {
  it("finds who won each seat in 2019 and the change since", () => {
    const history = { x: [{ y: 2017, c: [["Labour", 50, 1]] }, { y: 2019, c: [["Conservative", 50, 1]] }], z: [{ y: 2019, c: [["Labour", 50, 1]] }] };
    const before = seats2019(history);
    expect(before).toEqual({ Conservative: 1, Labour: 1 });
    expect(seatChanges(before, { Labour: 3 }).find((r) => r.party === "Conservative").change).toBe(-1);
  });

  it("lists the seven seats by name", () => {
    expect(Object.keys(REPLACED_SEAT_WINNERS)).toHaveLength(7);
  });
});
