import { describe, expect, it } from "vitest";
import { poundsShort, dayText, charityLine } from "./charityView";

describe("poundsShort", () => {
  it("writes millions to one place and smaller sums in full", () => {
    expect(poundsShort(6512345)).toBe("£6.5 million");
    expect(poundsShort(6000000)).toBe("£6 million");
    expect(poundsShort(812000)).toBe("£812,000");
    expect(poundsShort(null)).toBeNull();
  });
});

describe("charityLine", () => {
  it("says what the register holds and nothing more", () => {
    expect(charityLine({ income: 6500000, expenditure: 6100000, yearEnd: "2025-12-31" })).toBe("In the year to 31 December 2025 it reported income of £6.5 million and spending of £6.1 million.");
  });
  it("copes with a missing year or figure", () => {
    expect(charityLine({ income: 900000, expenditure: null, yearEnd: null })).toBe("In the year it last reported it reported income of £900,000.");
    expect(charityLine({ income: null, expenditure: null })).toBe("Its latest income and spending are not on the register.");
    expect(charityLine(undefined)).toBeNull();
    expect(dayText("nonsense")).toBeNull();
  });
});
