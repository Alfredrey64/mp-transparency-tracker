import { describe, it, expect } from "vitest";
import { everyday, everydayShort } from "./everyday";

describe("everyday", () => {
  it("scales small sums in days and weeks of a typical salary", () => {
    expect(everyday(20)).toBe("less than half a day's pay for a typical full-time worker");
    expect(everyday(150)).toBe("about a day's pay for a typical full-time worker");
    expect(everyday(592)).toBe("about 4 days' pay for a typical full-time worker");
    expect(everyday(2500)).toBe("about 3 weeks' pay for a typical full-time worker");
  });
  it("moves on to months and years", () => {
    expect(everyday(10000)).toBe("about 3 months' pay for a typical full-time worker");
    expect(everyday(39039)).toBe("about a year's pay for a typical full-time worker");
    expect(everyday(60000)).toBe("about 1.5 years' pay for a typical full-time worker, or about 7 months of an MP's salary");
  });
  it("sets big sums against an MP's salary as well", () => {
    expect(everyday(164347)).toBe("about 4.2 years' pay for a typical full-time worker, or 1.7 years of an MP's salary");
    expect(everyday(500_000)).toBe("about 13 years' pay for a typical full-time worker, or 5.1 years of an MP's salary");
    expect(everyday(1_000_000)).toBe("the yearly pay of about 26 typical full-time workers");
    expect(everydayShort(61_000_000)).toBe("≈ 1,563 typical salaries");
  });
  it("says nothing for nothing", () => {
    expect(everyday(0)).toBeNull();
    expect(everyday(-5)).toBeNull();
    expect(everyday("abc")).toBeNull();
    expect(everydayShort(null)).toBeNull();
  });
  it("has a short form", () => {
    expect(everydayShort(2500)).toBe("≈ 3 weeks' pay");
    expect(everydayShort(20)).toBe("< half a day's pay");
  });
});
