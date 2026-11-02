import { describe, it, expect } from "vitest";
import { ROUTES, ROUTE_QUESTIONS, budgetQuestions } from "./publicGames";

describe("Who handles it?", () => {
  it("has a right answer among four distinct, known options for every question", () => {
    for (const q of ROUTE_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.right);
      for (const o of q.options) expect(ROUTES[o]).toBeTruthy();
      expect(q.why.length).toBeGreaterThan(20);
    }
  });
  it("does not always put the right answer in the same place", () => {
    expect(new Set(ROUTE_QUESTIONS.map((q) => q.options.indexOf(q.right))).size).toBeGreaterThan(1);
  });
});

describe("Which budget is bigger?", () => {
  const qs = budgetQuestions();
  it("builds a pair of different departments with a clear winner", () => {
    expect(qs.length).toBe(8);
    for (const q of qs) {
      expect(q.left.name).not.toBe(q.right.name);
      expect(q.gap).toBeGreaterThan(0);
      expect([q.left.name, q.right.name]).toContain(q.bigger);
    }
  });
  it("names the bigger budget correctly", () => {
    const health = qs[0];
    expect(health.bigger).toBe("Health and Social Care");
  });
  it("mixes which side the winner is on", () => {
    expect(new Set(qs.map((q) => q.bigger === q.left.name)).size).toBe(2);
  });
});
