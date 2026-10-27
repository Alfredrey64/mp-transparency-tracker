import { describe, it, expect } from "vitest";
import { realBudget, totalOf, leftToSpend, potFor, perHousehold, setAmount, shift, changes, describeChange, LOCKED, BASE_BN } from "./budgetGame";
import { CATEGORIES } from "../data/publicSpending";

describe("budget game", () => {
  it("starts as the real budget with nothing left over", () => {
    const real = realBudget();
    expect(totalOf(real)).toBe(BASE_BN);
    expect(BASE_BN).toBeGreaterThan(1300);
    expect(leftToSpend(real, 0)).toBe(0);
    expect(Object.keys(real)).toHaveLength(CATEGORIES.length);
  });
  it("does not let the class spend more than the pot", () => {
    const real = realBudget();
    const up = setAmount(real, "health", 500, 0);
    expect(up.health).toBe(real.health); // nothing left to move
    const cut = setAmount(real, "defence", 10, 0);
    expect(cut.defence).toBe(10);
    expect(leftToSpend(cut, 0)).toBe(29);
    const spent = setAmount(cut, "health", 1000, 0);
    expect(leftToSpend(spent, 0)).toBeGreaterThanOrEqual(0);
    expect(spent.health).toBe(204 + 29);
  });
  it("lets tax raise the pot", () => {
    expect(potFor(20)).toBe(BASE_BN + 20);
    const more = setAmount(realBudget(), "education", 115, 20);
    expect(more.education).toBe(115);
    expect(leftToSpend(more, 20)).toBe(0);
  });
  it("keeps debt interest fixed", () => {
    expect(LOCKED.has("debt")).toBe(true);
    const real = realBudget();
    expect(setAmount(real, "debt", 0, 0)).toBe(real);
  });
  it("turns a tax change into pounds per household", () => {
    expect(perHousehold(0)).toBe(0);
    expect(perHousehold(BASE_BN)).toBe(48000);
    expect(perHousehold(-20)).toBeLessThan(0);
  });
  it("lists what changed, biggest first, in plain words", () => {
    const a = setAmount(setAmount(realBudget(), "defence", 19, 0), "welfare", 300, 0);
    const c = changes(a);
    expect(c[0].key).toBe("welfare");
    expect(describeChange(c[0])).toMatch(/Welfare & Pensions: down £34bn \(-10%\)/);
    expect(changes(realBudget())).toEqual([]);
  });
  it("shifts money from the other categories so a slider can always move, keeping the total fixed", () => {
    const real = realBudget();
    const { alloc, took } = shift(real, "health", real.health + 30, 0);
    expect(alloc.health).toBe(real.health + 30);
    expect(totalOf(alloc)).toBe(BASE_BN);
    expect(took.reduce((t, [, n]) => t + n, 0)).toBe(30);
    expect(alloc.debt).toBe(real.debt);
    expect(took.every(([k]) => k !== "debt" && k !== "health")).toBe(true);
  });
  it("uses money already free before taking any, and frees money when a category is lowered", () => {
    const real = realBudget();
    const lowered = shift(real, "defence", real.defence - 20, 0).alloc;
    expect(leftToSpend(lowered, 0)).toBe(20);
    const raised = shift(lowered, "education", lowered.education + 20, 0);
    expect(raised.took).toEqual([]);
    expect(totalOf(raised.alloc)).toBe(BASE_BN);
  });
  it("cannot take more than the other categories have, and leaves fixed ones alone", () => {
    const real = realBudget();
    const { alloc } = shift(real, "health", 100000, 0);
    expect(alloc.debt).toBe(real.debt);
    expect(totalOf(alloc)).toBe(BASE_BN);
    expect(shift(real, "debt", 0, 0).alloc).toBe(real);
  });
});
