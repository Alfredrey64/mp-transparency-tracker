import { describe, it, expect } from "vitest";
import { takeHome, scottishIncomeTax } from "./takeHome";

describe("takeHome", () => {
  it("pays nothing on pay up to the personal allowance", () => {
    const t = takeHome(12570);
    expect(t.incomeTax).toBe(0);
    expect(t.ni).toBe(0);
    expect(t.takeHome).toBe(12570);
  });
  it("works out £30,000 in England: 20% income tax above £12,570 and 8% National Insurance above £242 a week", () => {
    const t = takeHome(30000);
    expect(t.incomeTax).toBeCloseTo(3486, 0);
    expect(t.ni).toBeCloseTo((30000 / 52 - 242) * 0.08 * 52, 2);
    expect(t.takeHome).toBeCloseTo(30000 - 3486 - 1393.28, 0);
  });
  it("charges the higher rate above £50,270", () => {
    const t = takeHome(60000);
    expect(t.incomeTax).toBeCloseTo(7540 + (60000 - 50270) * 0.4, 0);
    expect(t.ni).toBeCloseTo(((967 - 242) * 0.08 + (60000 / 52 - 967) * 0.02) * 52, 2);
  });
  it("takes a pension off before income tax but not before National Insurance", () => {
    const none = takeHome(40000);
    const withPension = takeHome(40000, { pensionPct: 5 });
    expect(withPension.pension).toBe(2000);
    expect(withPension.ni).toBeCloseTo(none.ni, 5);
    expect(withPension.incomeTax).toBeCloseTo(none.incomeTax - 2000 * 0.2, 0);
  });
  it("withdraws the personal allowance above £100,000", () => {
    expect(takeHome(110000).allowance).toBe(7570);
    expect(takeHome(125140).allowance).toBe(0);
  });
});

describe("Scotland", () => {
  it("uses its own bands: £30,000 pays 19% on the first £3,967, 20% to £16,956 and 21% after", () => {
    const { tax } = scottishIncomeTax(30000);
    const taxable = 30000 - 12570;
    expect(tax).toBeCloseTo(3967 * 0.19 + (16956 - 3967) * 0.2 + (taxable - 16956) * 0.21, 2);
  });
  it("charges more than England at £60,000 and the same National Insurance", () => {
    const s = takeHome(60000, { region: "scotland" });
    const e = takeHome(60000);
    expect(s.incomeTax).toBeGreaterThan(e.incomeTax);
    expect(s.ni).toBeCloseTo(e.ni, 5);
  });
  it("charges the top rate of 48% above £125,140", () => {
    const { tax: a } = scottishIncomeTax(200000);
    const { tax: b } = scottishIncomeTax(210000);
    expect(b - a).toBeCloseTo(10000 * 0.48, 2);
  });
});
