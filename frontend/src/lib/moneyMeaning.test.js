import { describe, it, expect } from "vitest";
import { concentrationMeaning, partyConcentrationMeaning } from "./moneyMeaning";

describe("concentrationMeaning", () => {
  it("measures how much the biggest givers account for", () => {
    const r = concentrationMeaning({ top: [400, 300], total: 1000, count: 2 });
    expect(r.marker).toBe("Heavily concentrated");
    expect(r.text).toBe("The 2 biggest donors account for 70% of the £1,000 declared, so a few givers make up most of it.");
    expect(concentrationMeaning({ top: [100], total: 1000, count: 1 }).marker).toBe("Widely spread");
    expect(concentrationMeaning({ top: [300], total: 1000, count: 1 }).marker).toBe("Fairly concentrated");
  });
  it("says nothing without data", () => {
    expect(concentrationMeaning({ top: [], total: 100, count: 3 })).toBeNull();
    expect(concentrationMeaning({ top: [1], total: 0, count: 1 })).toBeNull();
  });
});

describe("partyConcentrationMeaning", () => {
  it("measures the biggest party's share", () => {
    const r = partyConcentrationMeaning({ parties: [{ name: "A", total: 600 }, { name: "B", total: 300 }, { name: "C", total: 100 }] });
    expect(r.marker).toBe("Heavily concentrated");
    expect(r.text).toBe("A received 60% of the £1,000 given to parties, and the top two together 90%.");
    expect(partyConcentrationMeaning({ parties: [] })).toBeNull();
  });
});
