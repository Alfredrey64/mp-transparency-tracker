import { describe, it, expect } from "vitest";
import { DECIDERS, DECISIONS, shuffled, isRight, BILL_PLACES, nextCorrect, SEATS, majorityOf, SCENARIOS, seatsOf, smallestCoalitions, verdict, hemicycle, ROLES, options, pointsFor } from "./teacherGames";
import { BILL_STEPS, LAYERS } from "../data/teacherMode";

describe("who decides", () => {
  it("has a fair spread across the three layers, each with a reason", () => {
    for (const d of DECIDERS) expect(DECISIONS.filter((x) => x.answer === d.key).length).toBeGreaterThanOrEqual(4);
    for (const x of DECISIONS) { expect(x.why.length).toBeGreaterThan(20); expect(DECIDERS.some((d) => d.key === x.answer)).toBe(true); }
    expect(new Set(DECISIONS.map((x) => x.id)).size).toBe(DECISIONS.length);
  });
  it("uses the same layers as the lesson", () => { expect(DECIDERS.map((d) => d.key)).toEqual(LAYERS.map((l) => l.key)); });
  it("shuffles the same way every time and loses nothing", () => {
    expect(shuffled(DECISIONS).map((x) => x.id)).toEqual(shuffled(DECISIONS).map((x) => x.id));
    expect([...shuffled(DECISIONS)].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...DECISIONS].sort((a, b) => a.id.localeCompare(b.id)));
    expect(isRight(DECISIONS[0], "council")).toBe(true);
  });
});

describe("make a law", () => {
  it("places every step of the bill, and takes them in order", () => {
    expect(BILL_PLACES).toHaveLength(BILL_STEPS.length);
    expect(nextCorrect([], 0)).toBe(true);
    expect(nextCorrect([0, 1], 2)).toBe(true);
    expect(nextCorrect([0], 3)).toBe(false);
  });
});

describe("build a majority", () => {
  it("needs 326 of 650", () => { expect(SEATS).toBe(650); expect(majorityOf()).toBe(326); expect(majorityOf(100)).toBe(51); });
  it("has scenarios that add up to 650 seats", () => { for (const s of SCENARIOS) expect(s.parties.reduce((t, p) => t + p[2], 0), s.key).toBe(650); });
  it("finds the fewest parties that can govern", () => {
    expect(smallestCoalitions(SCENARIOS[0])).toEqual([["Red"]]);
    expect(smallestCoalitions(SCENARIOS[1]).every((g) => g.length === 2)).toBe(true);
    expect(smallestCoalitions(SCENARIOS[1])).toContainEqual(["Red", "Blue"]);
    expect(smallestCoalitions(SCENARIOS[2]).length).toBeGreaterThan(0);
  });
  it("says how far short a group is, and whether it could do with fewer parties", () => {
    const hung = SCENARIOS[1];
    expect(verdict(hung, []).state).toBe("empty");
    expect(verdict(hung, ["Red"])).toMatchObject({ state: "short", gap: 326 - 291 });
    expect(verdict(hung, ["Red", "Green"]).state).toBe("best");
    expect(verdict(hung, ["Red", "Blue", "Green"]).state).toBe("spare");
    expect(seatsOf(hung, ["Red", "Gold"])).toBe(330);
  });
  it("lays 650 seats out in a half circle, left to right", () => {
    const pts = hemicycle();
    expect(pts).toHaveLength(650);
    expect(pts[0].angle).toBeLessThanOrEqual(pts[649].angle);
    expect(Math.max(...pts.map((p) => p.y))).toBeLessThanOrEqual(150.01);
  });
});

describe("role detective", () => {
  it("gives three clues for every role, and four choices that include the right answer", () => {
    for (const r of ROLES) {
      expect(r.clues).toHaveLength(3);
      const o = options(r.key);
      expect(o).toHaveLength(4);
      expect(o.filter((x) => x.key === r.key)).toHaveLength(1);
      expect(new Set(o.map((x) => x.key)).size).toBe(4);
    }
  });
  it("scores more for fewer clues", () => { expect([1, 2, 3].map(pointsFor)).toEqual([3, 2, 1]); });
});
