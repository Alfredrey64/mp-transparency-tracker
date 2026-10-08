import { describe, it, expect } from "vitest";
import { electionList, changesOfParty } from "./seatElections";

const history = [
  { y: 2010, p: 10, m: 5000, c: [["Conservative", 45, 20000], ["Labour", 35, 15000]] },
  { y: 2015, p: 12, m: 6000, c: [["Conservative", 46, 21000], ["Labour", 34, 15000]] },
  { y: 2019, p: 2, m: 800, c: [["Labour", 44, 19000], ["Conservative", 42, 18200]] },
];
const record = { result: { date: "2024-07-04", isGeneralElection: true, majorityPct: 20, majority: 9000, candidates: [{ party: "Labour", share: 0.5, votes: 20000, colour: "d50000" }, { party: "Conservative", share: 0.3, votes: 11000 }] } };

describe("election list", () => {
  it("puts the old results first and today's seat last", () => {
    const list = electionList(history, record);
    expect(list.map((e) => e.year)).toEqual([2010, 2015, 2019, 2024]);
    expect(list.at(-1).old).toBe(false);
    expect(list.at(-1).parties[0].share).toBe(50);
  });
  it("leaves out a by-election as the latest result", () => {
    const r = { result: { ...record.result, isGeneralElection: false } };
    expect(electionList(history, r)).toHaveLength(3);
  });
  it("copes with no history", () => {
    expect(electionList(undefined, record)).toHaveLength(1);
  });
});

describe("changes of party", () => {
  it("finds where the winner changed", () => {
    expect(changesOfParty(electionList(history, record))).toEqual([{ year: 2019, from: "Conservative", to: "Labour" }]);
  });
});
