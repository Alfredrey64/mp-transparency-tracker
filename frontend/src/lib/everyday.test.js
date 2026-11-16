import { describe, it, expect } from "vitest";
import { everyday, everydayShort } from "./everyday";
import { MEDIAN_SALARY } from "../data/referenceFigures";

// The typical salary is replaced each year (the ONS publishes a new one every October), so the sums here are written as multiples of it, not as fixed pounds.
const SALARY = MEDIAN_SALARY.value;

describe("everyday", () => {
  it("scales small sums in days and weeks of a typical salary", () => {
    expect(everyday(20)).toBe("less than half a day's pay for a typical full-time worker");
    expect(everyday(150)).toBe("about a day's pay for a typical full-time worker");
    expect(everyday(592)).toBe("about 4 days' pay for a typical full-time worker");
    expect(everyday(2500)).toBe("about 3 weeks' pay for a typical full-time worker");
  });
  it("moves on to months and years", () => {
    expect(everyday(10000)).toBe("about 3 months' pay for a typical full-time worker");
    expect(everyday(SALARY)).toBe("about a year's pay for a typical full-time worker");
    expect(everyday(60000)).toBe("about 1.5 years' pay for a typical full-time worker, or about 7 months of an MP's salary");
  });
  it("sets big sums against an MP's salary as well", () => {
    expect(everyday(SALARY * 4)).toMatch(/^about 4 years' pay for a typical full-time worker, or [\d.]+ years of an MP's salary$/);
    expect(everyday(SALARY * 12)).toMatch(/^about 12 years' pay for a typical full-time worker, or [\d.]+ years of an MP's salary$/);
    expect(everyday(SALARY * 26)).toBe("the yearly pay of about 26 typical full-time workers");
    expect(everydayShort(SALARY * 1500)).toBe("≈ 1,500 typical salaries");
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
