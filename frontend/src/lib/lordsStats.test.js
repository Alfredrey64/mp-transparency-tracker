import { describe, it, expect } from "vitest";
import { computeLordsStats } from "./lordsStats";

const NOW = new Date("2026-10-01");
const peer = (id, party, gender, start, extra = {}) => ({ id, name: `Peer ${id}`, party, party_colour: null, gender, membership_start_date: start, peerage_type: "Life peer", government_role: null, ...extra });
const peers = [
  peer(1, "Conservative", "M", "1996-01-01"),
  peer(2, "Conservative", "F", "2020-05-01"),
  peer(3, "Labour", "F", "2024-09-01", { government_role: "Minister" }),
  peer(4, "Labour", "M", "2025-01-01"),
  peer(5, "Crossbench", "M", "2012-01-01", { peerage_type: "Life Peer (judicial)" }),
  peer(6, "Bishops", "M", "2018-03-01", { peerage_type: "Bishop" }),
];
// lords, mpFrom, mpTo, mpElected, gov, govNow, opp, commEver, commNow, from, kind
const careers = {
  1: [1996, 1970, 1995, 5, 2, 0, 0, 1, 0, null, null],
  2: [2020, null, null, 0, 0, 0, 0, 0, 0, null, null],
  3: [2024, 1997, 2010, 4, 3, 1, 1, 0, 0, "Conservative", "s"],
  4: [2025, null, null, 0, 0, 0, 0, 2, 1, "Labour", "i"],
  5: [2012, null, null, 0, 0, 0, 0, 0, 0, null, null],
  6: [2018, null, null, 0, 0, 0, 0, 0, 0, null, null],
};

describe("computeLordsStats", () => {
  const s = computeLordsStats(peers, careers, NOW);
  it("counts the House and what a majority would be", () => {
    expect(s.total).toBe(6);
    expect(s.majorityLine).toBe(4);
    expect(s.largest.party).toBe("Conservative");
    expect(s.seatsByParty.map((r) => r.count)).toEqual([2, 2, 1, 1]);
  });
  it("counts women overall and by the larger parties", () => {
    expect(s.women).toBe(2);
    expect(s.womenPct).toBeCloseTo(33.3, 1);
    expect(s.womenByParty).toEqual([]);
  });
  it("groups peers by how they got their seat", () => {
    expect(s.types).toEqual([{ type: "Life peer", count: 4 }, { type: "Life Peer (judicial)", count: 1 }, { type: "Bishop", count: 1 }]);
  });
  it("shows arrivals by year with earlier ones in one bar, split by party", () => {
    expect(s.arrivals[0]).toMatchObject({ key: "before", count: 1 });
    expect(s.arrivals.at(-1)).toMatchObject({ key: 2025, count: 1 });
    expect(s.arrivals.reduce((n, c) => n + c.count, 0)).toBe(6);
    expect(s.arrivals.find((c) => c.key === 2020).parties[0]).toMatchObject({ party: "Conservative", count: 1 });
  });
  it("counts new arrivals since the 2024 election and who is in government", () => {
    expect(s.newSinceElection).toBe(2);
    expect(s.inGovernment).toBe(1);
  });
  it("works out time served", () => {
    expect(s.longest.names).toEqual(["Peer 1"]);
    expect(Math.round(s.longest.years)).toBe(31);
    expect(s.medianTenure).toBeGreaterThan(5);
  });
  it("finds former MPs, ministers and party moves", () => {
    expect(s.career.total).toBe(6);
    expect(s.career.formerMps.count).toBe(2);
    expect(s.career.formerMinisters.count).toBe(2);
    expect(s.career.inGovernmentNow).toBe(1);
    expect(s.career.shadowEver).toBe(1);
    expect(s.career.onCommitteeNow).toBe(1);
    expect(s.career.switchers.switched).toBe(1);
    expect(s.career.switchers.nowIndependent).toBe(1);
    expect(s.career.switchers.transitions).toEqual(expect.arrayContaining([{ from: "Conservative", to: "Labour", kind: "switch", count: 1, names: ["Peer 3"], memberIds: [3] }]));
  });
  it("doesn't count a move out of the non-affiliated holding group as changing sides", () => {
    const withHolding = { ...careers, 2: [2020, null, null, 0, 0, 0, 0, 0, 0, "Non-affiliated", "s"] };
    const r = computeLordsStats(peers, withHolding, NOW);
    expect(r.career.switchers.switched).toBe(1);
  });
  it("works without career rows", () => {
    expect(computeLordsStats(peers, null, NOW).career).toBeNull();
    expect(computeLordsStats([], null, NOW).total).toBe(0);
  });
});
