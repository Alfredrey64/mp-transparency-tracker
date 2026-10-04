import { describe, it, expect } from "vitest";
import { computeRebels, MIN_VOTES } from "./rebels";

const pol = (id, party, name = `MP ${id}`) => ({ id, party, name, party_colour: null });
const politicians = [pol(1, "Labour"), pol(2, "Labour"), pol(3, "Conservative"), pol(4, "Independent"), pol(5, "Speaker")];
const vote = (politician_id, division_id, withParty, extra = {}) => ({ politician_id, division_id, title: `Division ${division_id}`, date: `2026-01-0${division_id}`, voted_aye: true, aye_count: 100, no_count: 50, voted_with_party_majority: withParty, ...extra });

describe("computeRebels", () => {
  const votes = [
    vote(1, 1, false), vote(2, 1, true), vote(3, 1, true), vote(4, 1, false), vote(5, 1, false),
    vote(1, 2, false), vote(2, 2, false), vote(3, 2, true),
    vote(1, 3, true), vote(3, 3, null),
  ];
  const r = computeRebels(votes, politicians);

  it("counts only MPs who sit under a whip, and only votes with a flag", () => {
    expect(r.countedVotes).toBe(7);
    expect(r.rebelVotes).toBe(3);
    expect(r.rebelPct).toBeCloseTo((3 / 7) * 100, 5);
    expect(r.mpsCounted).toBe(3);
    expect(r.mpsWhoRebelled).toBe(2);
  });
  it("ranks divisions by how many rebelled, with the parties they came from", () => {
    expect(r.divisionsWithRebels).toBe(2);
    expect(r.rebelDivisions[0]).toMatchObject({ id: 2 });
    expect(r.rebelDivisions[0].rebels).toHaveLength(2);
    expect(r.rebelDivisions[0].parties).toEqual([{ party: "Labour", count: 2 }]);
    expect(r.rebelDivisions[1].rebels[0].politician.id).toBe(1);
  });
  it("holds back MPs with too few votes from the ranking of rebels", () => {
    expect(r.byMp).toEqual([]);
    const many = Array.from({ length: MIN_VOTES }, (_, i) => vote(1, 100 + i, i < 4 ? false : true));
    const r2 = computeRebels(many, politicians);
    expect(r2.byMp).toHaveLength(1);
    expect(r2.byMp[0].pct).toBeCloseTo(40, 5);
  });
  it("leaves out parties with fewer than five MPs", () => {
    expect(r.byParty).toEqual([]);
    const many = Array.from({ length: 5 }, (_, i) => pol(10 + i, "Green Party"));
    const r3 = computeRebels(many.map((m) => vote(m.id, 1, m.id === 10 ? false : true)), many);
    expect(r3.byParty).toEqual([{ party: "Green Party", colour: null, votes: 5, against: 1, mps: 5, rebels: 1, pct: 20 }]);
  });
  it("counts Labour (Co-op) MPs as Labour", () => {
    const ps = Array.from({ length: 5 }, (_, i) => pol(20 + i, i < 2 ? "Labour (Co-op)" : "Labour"));
    const r4 = computeRebels(ps.map((m) => vote(m.id, 1, m.id !== 20)), ps);
    expect(r4.byParty).toHaveLength(1);
    expect(r4.byParty[0]).toMatchObject({ party: "Labour", mps: 5, against: 1 });
    expect(r4.rebelDivisions[0].parties).toEqual([{ party: "Labour", count: 1 }]);
  });
  it("copes with nothing", () => {
    expect(computeRebels([], politicians)).toMatchObject({ countedVotes: 0, rebelPct: 0, byMp: [], rebelDivisions: [] });
  });
});
