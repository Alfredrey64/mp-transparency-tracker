import { describe, it, expect } from "vitest";
import { explainMatch } from "./quizInsights";
import { QUESTIONS, QUESTION_ANSWER } from "../data/partyMatchQuiz";
import { ANSWERS } from "../data/answers";

const qs = [
  { id: "a", issue: "x", statement: "A", positions: { p: 2 } },
  { id: "b", issue: "x", statement: "B", positions: { p: -2 } },
  { id: "c", issue: "x", statement: "C", positions: { p: 0 } },
  { id: "d", issue: "x", statement: "D", positions: { p: 1 } },
  { id: "e", issue: "x", statement: "E", positions: { p: 1 } },
];

describe("explainMatch", () => {
  const answers = { a: 2, b: 2, c: 0, d: 1 };
  const r = explainMatch(answers, "p", qs);
  it("finds agreement where you took a view, strongest first", () => {
    expect(r.agree.map((x) => x.id)).toEqual(["a", "d"]);
  });
  it("does not count a shared 'not sure' as agreement", () => {
    expect(r.agree.find((x) => x.id === "c")).toBeUndefined();
  });
  it("finds the biggest differences", () => {
    expect(r.differ.map((x) => x.id)).toEqual(["b"]);
    expect(r.differ[0].distance).toBe(4);
  });
  it("ignores questions you did not answer", () => {
    expect(r.answered).toBe(4);
    expect([...r.agree, ...r.differ].find((x) => x.id === "e")).toBeUndefined();
  });
  it("does not count 'not sure' as a disagreement", () => {
    const r2 = explainMatch({ a: 0 }, "p", qs);
    expect(r2.differ).toEqual([]);
  });
  it("respects the limit", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ id: `q${i}`, issue: "x", statement: "S", positions: { p: 2 } }));
    const all = Object.fromEntries(many.map((q) => [q.id, 2]));
    expect(explainMatch(all, "p", many, 3).agree).toHaveLength(3);
  });
});

describe("quiz questions linked to answers", () => {
  it("only link to questions and answers that exist", () => {
    const qIds = new Set(QUESTIONS.map((q) => q.id));
    const aIds = new Set(ANSWERS.map((a) => a.id));
    for (const [q, a] of Object.entries(QUESTION_ANSWER)) {
      expect(qIds.has(q), q).toBe(true);
      expect(aIds.has(a), a).toBe(true);
    }
  });
});
