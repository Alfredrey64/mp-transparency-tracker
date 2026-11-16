import { describe, it, expect } from "vitest";
import { HEADLINES, getTax, headlineLine, todayIso } from "./taxRates";
import { stepShape, lastMove, W, H } from "./taxToday";

const ISO = todayIso(Date.UTC(2026, 10, 16));
const lines = HEADLINES.map(([taxId, key]) => [key, headlineLine(taxId, key)]);

describe("the main-rates tile pictures", () => {
  it("draw a step line inside the tile for every headline rate", () => {
    for (const [key, line] of lines) {
      const shape = stepShape(line, ISO);
      expect(shape, key).not.toBeNull();
      expect(shape.line.startsWith("M0 "), key).toBe(true);
      expect(shape.endY, key).toBeGreaterThanOrEqual(0);
      expect(shape.endY, key).toBeLessThanOrEqual(H);
      for (const n of shape.line.match(/-?\d+(\.\d+)?/g)) expect(Number(n), `${key} ${n}`).toBeLessThanOrEqual(Math.max(W, H));
    }
  });
  it("say when each rate last moved, and which way", () => {
    for (const [key, line] of lines) expect(lastMove(line, ISO), key).toMatch(/^(Up from|Down from|Changed|Same since) /);
    const basic = headlineLine("income-tax", "incomeTax.basic");
    expect(getTax("income-tax")).toBeTruthy();
    expect(lastMove(basic, "2010-01-01")).toBeTruthy();
  });
  it("draw nothing before a rate begins", () => {
    expect(stepShape(headlineLine("income-tax", "incomeTax.basic"), "1800-01-01")).toBeNull();
  });
});
