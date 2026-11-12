import { describe, it, expect } from "vitest";
import REG from "./firsRegister.json";

// The snapshot of the public register is typed in by hand from the register's own filter lists, so its three totals must agree.
describe("the foreign influence register snapshot", () => {
  it("adds up the same by country and by month as the total", () => {
    expect(REG.countries.reduce((s, c) => s + c.n, 0)).toBe(REG.total);
    expect(REG.months.reduce((s, m) => s + m.n, 0)).toBe(REG.total);
  });
  it("lists each country and month once, biggest country first", () => {
    expect(new Set(REG.countries.map((c) => c.name)).size).toBe(REG.countries.length);
    expect(new Set(REG.months.map((m) => m.ym)).size).toBe(REG.months.length);
    const counts = REG.countries.map((c) => c.n);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    expect(REG.months.map((m) => m.ym)).toEqual([...REG.months.map((m) => m.ym)].sort());
  });
  it("says when it was checked", () => {
    expect(REG.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(REG.nameNotDisplayed).toBeLessThanOrEqual(REG.total);
  });
});
