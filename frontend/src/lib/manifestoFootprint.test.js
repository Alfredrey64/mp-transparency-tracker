import { describe, it, expect } from "vitest";
import { manifestoFootprint } from "./manifestoFootprint";
import { ANSWER_POSITIONS, POSITION_PARTY_ORDER } from "../data/answerPartyPositions";

describe("manifestoFootprint", () => {
  const f = manifestoFootprint();
  it("counts every distinct set of promises once, under its topic, however many questions share it", () => {
    expect(f.questions).toBeGreaterThanOrEqual(new Set(Object.values(ANSWER_POSITIONS)).size);
    expect(f.questions).toBeLessThan(Object.keys(ANSWER_POSITIONS).length);
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
  it("never shows the same promise twice for a party in one topic", () => {
    for (const t of f.topics) for (const c of t.cells) {
      const texts = c.items.map((i) => i.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
  it("names every question that shares a set of promises on one row", () => {
    const tax = f.topics.flatMap((t) => t.cells.flatMap((c) => c.items)).find((i) => i.ids.includes("where-does-tax-go"));
    expect(tax.ids).toContain("what-is-national-insurance");
    expect(tax.question).toMatch(/National Insurance/);
  });
});
