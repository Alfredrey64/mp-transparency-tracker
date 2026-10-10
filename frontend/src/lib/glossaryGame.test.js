import { describe, it, expect } from "vitest";
import { wordOfTheDay, hideTerm, makeQuestion } from "./glossaryGame";

const terms = Array.from({ length: 10 }, (_, i) => ({ term: `Term ${i}`, def: `This is the definition number ${i}, long enough to use as a clue for the game today.` }));

describe("wordOfTheDay", () => {
  it("is the same all day and varies across days", () => {
    const a = wordOfTheDay(terms, new Date(2026, 5, 1, 8));
    const b = wordOfTheDay(terms, new Date(2026, 5, 1, 22));
    expect(a).toBe(b);
    const seen = new Set(Array.from({ length: 20 }, (_, d) => wordOfTheDay(terms, new Date(2026, 5, d + 1)).term));
    expect(seen.size).toBeGreaterThan(3);
  });
  it("copes with no terms", () => expect(wordOfTheDay([])).toBeNull());
});

describe("hideTerm", () => {
  it("blanks the term, its plural and its acronym", () => {
    const e = { term: "Percentage Point (pp)", def: "A percentage point is the gap between two percentages, so 2 percentage points means pp 2." };
    const out = hideTerm(e.def, e);
    expect(out).not.toMatch(/percentage point/i);
    expect(out).toContain("_____");
  });
  it("leaves a definition alone if the term is not in it", () => {
    expect(hideTerm("Something else entirely.", { term: "Whip" })).toBe("Something else entirely.");
  });
});

describe("makeQuestion", () => {
  it("gives four different options including the answer", () => {
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion(terms);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    }
  });
  it("blanks the answer out of the clue", () => {
    const q = makeQuestion([{ term: "Whip", def: "A whip is an MP who makes sure colleagues vote the way the party wants them to on the day." }, ...terms]);
    expect(q.clue).not.toMatch(/\bwhip\b/i);
  });
  it("needs at least four terms", () => expect(makeQuestion(terms.slice(0, 3))).toBeNull());
  it("can ask for a different number of options", () => expect(makeQuestion(terms, Math.random, 3).options).toHaveLength(3));
  it("is repeatable with a fixed random source", () => {
    const fixed = () => 0.3;
    expect(makeQuestion(terms, fixed)).toEqual(makeQuestion(terms, fixed));
  });
});
