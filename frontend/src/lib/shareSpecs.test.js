import { describe, it, expect } from "vitest";
import { mpShareSpec, seatShareSpec, chamberShareSpec, rebelsShareSpec, mapShareSpec, wrapLines } from "./shareSpecs";

describe("mpShareSpec", () => {
  it("shows career facts and declared interests", () => {
    const s = mpShareSpec({ politician: { name: "Ann Smith", party: "Labour", constituency: "Seat", party_colour: "d50000" }, career: [1997, 5, 2, 0, 0, 0, 0, 0, null], interestCount: 3, totalDeclared: 12500, link: "https://x/#/mp/1" });
    expect(s.title).toBe("Ann Smith");
    expect(s.subtitle).toBe("Labour · Seat");
    expect(s.accent).toBe("#d50000");
    expect(s.stats.map((x) => x.label)).toEqual(["first elected", "elections won", "government posts", "declared interests"]);
    expect(s.note).toContain("£12,500");
  });
  it("copes with no career row and singular wording", () => {
    const s = mpShareSpec({ politician: { name: "B", party: null, constituency: null }, career: undefined, interestCount: 1, totalDeclared: 0 });
    expect(s.stats).toEqual([{ value: "1", label: "declared interest" }]);
    expect(s.subtitle).toBe("");
    expect(s.note).toBeNull();
    expect(s.accent).toBe("#8A8FA8");
  });
});

describe("seatShareSpec", () => {
  const result = { majorityPct: 12.34, turnoutPct: 60, majority: 5000, candidates: [{ name: "A", party: "Labour", colour: "d50000", share: 0.5 }, { name: "B", party: "Conservative", colour: "0063ba", share: 0.25 }] };
  it("lists the lead, turnout and candidates' shares", () => {
    const s = seatShareSpec({ name: "Seat", mp: { name: "A", party: "Labour", colour: "d50000" }, result });
    expect(s.stats.map((x) => x.value)).toEqual(["12.3%", "60.0%", "5,000"]);
    expect(s.bars.map((b) => b.valueText)).toEqual(["50.0%", "25.0%"]);
    expect(s.subtitle).toBe("A · Labour");
  });
  it("copes with a seat with no result", () => {
    expect(seatShareSpec({ name: "S", mp: null, result: null }).stats).toEqual([]);
  });
});

describe("chamber, rebels and map cards", () => {
  it("summarises a chamber", () => {
    const stats = { total: 650, womenPct: 40.9, majorityLine: 326, seatsByParty: [{ party: "Labour", colour: "d50000", count: 404, pct: 62.2 }, { party: "Conservative", colour: "0063ba", count: 118, pct: 18.2 }] };
    const s = chamberShareSpec({ house: "commons", stats });
    expect(s.title).toBe("650 MPs, seat by seat");
    expect(s.bars[0]).toMatchObject({ label: "Labour", fraction: 1 });
    expect(s.bars[1].fraction).toBeCloseTo(118 / 404, 5);
    expect(chamberShareSpec({ house: "lords", stats: { ...stats, total: 816 } }).kicker).toBe("House of Lords");
  });
  it("summarises the rebels", () => {
    const r = { rebelVotes: 395, countedVotes: 15007, rebelPct: 2.63, mpsWhoRebelled: 211, divisionsWithRebels: 9, byMp: [{ pct: 25, politician: { name: "A", party_colour: "d50000" } }, { pct: 10, politician: { name: "B" } }] };
    const s = rebelsShareSpec({ r });
    expect(s.subtitle).toContain("395 of 15,007");
    expect(s.bars.map((b) => b.fraction)).toEqual([1, 0.4]);
  });
  it("carries the map's hexagons in the colours of the view", () => {
    const mode = { label: "Party now", colour: () => "#fff", legend: { type: "note", text: "x" } };
    const s = mapShareSpec({ cells: [{ x: 1, y: 2 }], mode, key: [{ party: "Labour", colour: "#d50000", count: 5 }] });
    expect(s.hexes).toEqual([{ x: 1, y: 2, colour: "#fff" }]);
    expect(s.legend).toEqual([{ label: "Labour 5", colour: "#d50000" }]);
  });
});

describe("wrapLines", () => {
  const measure = (t) => t.length * 10;
  it("wraps on word boundaries", () => {
    expect(wrapLines("one two three four", measure, 80, 3)).toEqual(["one two", "three", "four"]);
  });
  it("ends with an ellipsis when there is too much", () => {
    const lines = wrapLines("alpha beta gamma delta epsilon zeta", measure, 100, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });
  it("copes with empty text and one very long word", () => {
    expect(wrapLines("", measure, 100, 2)).toEqual([]);
    expect(wrapLines("supercalifragilistic", measure, 50, 2)).toEqual(["supercalifragilistic"]);
  });
});
