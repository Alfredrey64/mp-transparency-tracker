import { describe, it, expect } from "vitest";
import { computeCareerStats, cohortKey } from "./careerStats";

// [first, elected, gov, govNow, opp, commNow, commEver, lost, from, kind]
const careers = {
  1: [2024, 1, 0, 0, 0, 1, 1, 0, null, null],
  2: [2024, 1, 0, 0, 0, 0, 0, 2, null, null],
  3: [2021, 2, 1, 1, 0, 0, 1, 0, null, null], // by-election winner: 2019 intake
  4: [1983, 9, 3, 0, 4, 0, 3, 1, null, null],
  5: [2019, 2, 0, 0, 0, 0, 0, 0, "Conservative", "s"],
  6: [2024, 1, 0, 0, 0, 0, 0, 0, "Labour", "i"],
};
const mp = (id, name, party, colour = "ff0000") => ({ parliament_member_id: id, name, party, party_colour: colour });
const politicians = [mp(1, "A", "Labour"), mp(2, "B", "Labour (Co-op)"), mp(3, "C", "Labour"), mp(4, "D", "Conservative", "0063ba"), mp(5, "E", "Reform UK", "12b6cf"), mp(6, "F", "Independent"), mp(99, "No record", "Labour")];
const s = computeCareerStats(careers, politicians);

describe("cohortKey", () => {
  it("files an MP under the latest general election at or before they arrived", () => {
    expect(cohortKey(2024)).toBe(2024);
    expect(cohortKey(2021)).toBe(2019);
    expect(cohortKey(1983)).toBe("before");
    expect(cohortKey(2010)).toBe(2010);
    expect(cohortKey(null)).toBeNull();
  });
});

describe("computeCareerStats", () => {
  it("ignores MPs with no career record", () => {
    expect(s.total).toBe(6);
  });
  it("builds intakes oldest first, split by today's party with Co-op folded into Labour", () => {
    expect(s.cohorts.map((c) => [c.label, c.count])).toEqual([["Before 1997", 1], ["2019 intake", 2], ["2024 and since", 3]]);
    expect(s.cohorts[2].parties[0]).toMatchObject({ party: "Labour", count: 2 });
  });
  it("counts terms served", () => {
    expect(s.electedBands.map((b) => b.count)).toEqual([3, 2, 0, 1]);
  });
  it("counts ministerial and shadow experience", () => {
    expect(s.government.everMinister).toBe(2);
    expect(s.government.inGovernmentNow).toBe(1);
    expect(s.government.shadowEver).toBe(1);
  });
  it("lists party moves, with where they went", () => {
    expect(s.switchers.switched).toBe(1);
    expect(s.switchers.nowIndependent).toBe(1);
    expect(s.switchers.transitions).toEqual(
      expect.arrayContaining([
        { from: "Conservative", to: "Reform UK", kind: "switch", count: 1, names: ["E"], memberIds: [5] },
        { from: "Labour", to: "Independent", kind: "independent", count: 1, names: ["F"], memberIds: [6] },
      ])
    );
  });
  it("finds who lost before winning, and who has won most often", () => {
    expect(s.persistence.lostBefore).toBe(2);
    expect(s.persistence.mostLost[0]).toMatchObject({ name: "B", times: 2 });
    expect(s.mostElected[0]).toMatchObject({ name: "D", times: 9 });
  });
  it("only ranks parties of ten or more on ministerial experience", () => {
    expect(s.government.byParty).toEqual([]);
  });
  it("copes with nobody", () => {
    expect(computeCareerStats({}, [])).toMatchObject({ total: 0, averageElected: 0, cohorts: [] });
  });
});
