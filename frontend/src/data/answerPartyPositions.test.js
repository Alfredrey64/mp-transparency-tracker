import { describe, it, expect } from "vitest";
import { ANSWER_POSITIONS, POSITION_PARTY_ORDER, positionsFor } from "./answerPartyPositions";
import { ANSWERS } from "./answers";
import { PARTY_MANIFESTOS } from "./partyManifestos";

const answerIds = new Set(ANSWERS.map((a) => a.id));
const manifestoKeys = new Set(PARTY_MANIFESTOS.map((p) => p.key));

describe("party positions on each question", () => {
  it("belong to real questions and real parties with a manifesto to link to", () => {
    for (const [id, entry] of Object.entries(ANSWER_POSITIONS)) {
      expect(answerIds.has(id), id).toBe(true);
      for (const key of Object.keys(entry.parties)) {
        expect(manifestoKeys.has(key), `${id}: ${key}`).toBe(true);
        expect(POSITION_PARTY_ORDER).toContain(key);
      }
    }
  });
  it("are short, plain sentences with no dashes or arrows", () => {
    for (const [id, entry] of Object.entries(ANSWER_POSITIONS)) {
      expect(entry.about.length, id).toBeGreaterThan(5);
      for (const [key, text] of Object.entries(entry.parties)) {
        expect(text.length, `${id} ${key}`).toBeGreaterThan(30);
        expect(text.length, `${id} ${key}`).toBeLessThan(330);
        expect(text, `${id} ${key}`).not.toMatch(/—|–|→/);
        expect(text.endsWith("."), `${id} ${key}`).toBe(true);
      }
    }
  });
  it("shows at least one party for each question it covers, in a fixed order", () => {
    for (const id of Object.keys(ANSWER_POSITIONS)) {
      const p = positionsFor(id);
      expect(p.parties.length, id).toBeGreaterThanOrEqual(1);
      const order = p.parties.map((x) => POSITION_PARTY_ORDER.indexOf(x.key));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
  });
  it("returns null for a question with no positions", () => {
    expect(positionsFor("what-is-gdp")).toBeNull();
    expect(positionsFor("nope")).toBeNull();
  });
});
