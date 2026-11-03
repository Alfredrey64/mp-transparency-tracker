import { describe, it, expect } from "vitest";
import { manifestoFootprint } from "./manifestoFootprint";
import { ANSWER_POSITIONS, POSITION_PARTY_ORDER } from "../data/answerPartyPositions";

describe("manifestoFootprint", () => {
  const f = manifestoFootprint();
  it("counts every question once, under its topic", () => {
    expect(f.questions).toBe(Object.keys(ANSWER_POSITIONS).length);
    expect(f.topics.every((t) => t.total > 0)).toBe(true);
  });
  it("gives each party a cell in each topic that never exceeds the topic's questions", () => {
    for (const t of f.topics) {
      expect(t.cells.map((c) => c.key)).toEqual(POSITION_PARTY_ORDER);
      for (const c of t.cells) expect(c.n).toBeLessThanOrEqual(t.total);
    }
  });
  it("totals each party's cells", () => {
    for (const p of f.totals) {
      expect(p.n).toBe(f.topics.reduce((s, t) => s + t.cells.find((c) => c.key === p.key).n, 0));
      expect(p.n).toBeLessThanOrEqual(f.questions);
    }
  });
  it("lists what each party promised and what is missing, so the two add up to the topic", () => {
    for (const t of f.topics) for (const c of t.cells) {
      expect(c.items).toHaveLength(c.n);
      expect(c.items.length + c.missing.length).toBe(t.total);
      for (const i of c.items) { expect(i.question).toBeTruthy(); expect(i.text).toBeTruthy(); }
    }
  });
});
