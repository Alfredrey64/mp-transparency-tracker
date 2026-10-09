import { describe, it, expect } from "vitest";
import { derive } from "./onsDerive";

describe("mortgage derivations", () => {
  const base = { price: [["2026-01", 200000], ["2026-02", 200000]], rate: [["2026-01", 5], ["2026-02", 0]], weekly: [["2026-01", 600]] };
  it("works out the monthly repayment for each month with a rate", () => {
    const out = derive({ op: "mortgage", from: "price", rate: "rate", ltv: 0.75, years: 25 }, base);
    // £150,000 over 25 years at 5% is about £877 a month; at 0% it is £500.
    expect(out[0][1]).toBeGreaterThan(870);
    expect(out[0][1]).toBeLessThan(885);
    expect(out[1][1]).toBeCloseTo(500, 5);
  });
  it("scales weekly pay to monthly", () => {
    expect(derive({ op: "scale", from: "weekly", factor: 52 / 12 }, base)[0][1]).toBeCloseTo(2600, 5);
  });
});
