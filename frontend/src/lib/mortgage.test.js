import { describe, it, expect } from "vitest";
import { monthlyPayment } from "./mortgage";

describe("mortgage payments", () => {
  it("matches a worked example", () => {
    // £200,000 over 25 years at 5% is about £1,169 a month.
    expect(Math.round(monthlyPayment(200000, 5, 25))).toBe(1169);
  });

  it("costs more at a higher rate and over a shorter term", () => {
    expect(monthlyPayment(200000, 6, 25)).toBeGreaterThan(monthlyPayment(200000, 5, 25));
    expect(monthlyPayment(200000, 5, 20)).toBeGreaterThan(monthlyPayment(200000, 5, 25));
  });

  it("is just the loan spread out at a zero rate, and zero for no loan", () => {
    expect(monthlyPayment(120000, 0, 10)).toBe(1000);
    expect(monthlyPayment(0, 5, 25)).toBe(0);
  });
});
