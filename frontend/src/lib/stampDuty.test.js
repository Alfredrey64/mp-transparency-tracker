import { describe, it, expect } from "vitest";
import { stampDuty } from "./stampDuty";

describe("stampDuty", () => {
  it("charges nothing up to £125,000", () => {
    expect(stampDuty(125000).total).toBe(0);
  });
  it("charges 2% on the slice from £125,000 to £250,000", () => {
    expect(stampDuty(250000).total).toBe(2500);
  });
  it("charges £5,000 on a £300,000 main home, as GOV.UK's own example does", () => {
    expect(stampDuty(300000).total).toBe(5000);
  });
  it("charges 5% to £925,000, 10% to £1.5m and 12% above", () => {
    expect(stampDuty(925000).total).toBe(2500 + 33750);
    expect(stampDuty(1500000).total).toBe(2500 + 33750 + 57500);
    expect(stampDuty(2000000).total).toBe(2500 + 33750 + 57500 + 60000);
  });
  it("gives first-time buyers nothing to £300,000 and 5% to £500,000", () => {
    expect(stampDuty(300000, { buyer: "first" }).total).toBe(0);
    expect(stampDuty(400000, { buyer: "first" }).total).toBe(5000);
    expect(stampDuty(500000, { buyer: "first" }).total).toBe(10000);
  });
  it("takes the relief away entirely above £500,000", () => {
    const r = stampDuty(500001, { buyer: "first" });
    expect(r.reliefLost).toBe(true);
    expect(r.total).toBeCloseTo(stampDuty(500001).total, 5);
  });
  it("adds 5 points in every band for another home, including the first £125,000", () => {
    expect(stampDuty(300000, { buyer: "additional" }).total).toBe(5000 + 15000);
  });
  it("does not add the extra charge below £40,000", () => {
    expect(stampDuty(39999, { buyer: "additional" }).total).toBe(0);
  });
  it("adds 2 points for a buyer who is not UK resident", () => {
    expect(stampDuty(300000, { nonResident: true }).total).toBe(5000 + 6000);
  });
  it("gives the average rate paid", () => {
    expect(stampDuty(400000).effective).toBeCloseTo((2500 + 7500) / 4000, 5);
  });
  it("copes with nothing", () => {
    expect(stampDuty(0).total).toBe(0);
    expect(stampDuty(0).effective).toBe(0);
  });
});
