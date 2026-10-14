import { describe, expect, it } from "vitest";
import { ageText, formatDate, statePensionAge } from "./pensionAge";

const d = (year, month, day) => ({ year, month, day });
const on = (dob) => formatDate(statePensionAge(dob).date);

describe("State Pension age", () => {
  it("matches the worked examples in GOV.UK's timetable", () => {
    expect(on(d(1960, 7, 31))).toBe("30 November 2026");
    expect(on(d(1960, 12, 31))).toBe("30 September 2027");
    expect(on(d(1961, 1, 31))).toBe("30 November 2027");
  });
  it("gives 66 years and the right months in the 1960 to 1961 band", () => {
    expect(statePensionAge(d(1960, 4, 6))).toMatchObject({ years: 66, months: 1 });
    expect(statePensionAge(d(1960, 4, 5))).toMatchObject({ years: 66, months: 0 });
    expect(statePensionAge(d(1960, 8, 10))).toMatchObject({ years: 66, months: 5 });
    expect(statePensionAge(d(1961, 3, 5))).toMatchObject({ years: 66, months: 11 });
    expect(statePensionAge(d(1961, 3, 6))).toMatchObject({ years: 67, months: 0 });
  });
  it("is 67 for those born from March 1961 to April 1977", () => {
    expect(on(d(1970, 5, 12))).toBe("12 May 2037");
    expect(statePensionAge(d(1977, 4, 5)).years).toBe(67);
  });
  it("follows the timetable's dates for the rise to 68", () => {
    expect(on(d(1977, 4, 6))).toBe("6 May 2044");
    expect(on(d(1977, 5, 5))).toBe("6 May 2044");
    expect(on(d(1977, 5, 6))).toBe("6 July 2044");
    expect(on(d(1977, 6, 5))).toBe("6 July 2044");
    expect(on(d(1977, 7, 20))).toBe("6 November 2044");
    expect(on(d(1978, 2, 6))).toBe("6 January 2046");
    expect(on(d(1978, 3, 6))).toBe("6 March 2046");
    expect(on(d(1978, 4, 5))).toBe("6 March 2046");
  });
  it("is 68 for those born from 6 April 1978", () => {
    expect(on(d(1978, 4, 6))).toBe("6 April 2046");
    expect(on(d(1990, 2, 1))).toBe("1 February 2058");
  });
  it("is 66 for those born from October 1954 to April 1960, and earlier for older people", () => {
    expect(on(d(1955, 2, 3))).toBe("3 February 2021");
    expect(statePensionAge(d(1950, 1, 1)).kind).toBe("earlier");
  });
  it("writes the age in words", () => {
    expect(ageText({ years: 66, months: 4 })).toBe("66 years and 4 months");
    expect(ageText({ years: 66, months: 1 })).toBe("66 years and 1 month");
    expect(ageText({ years: 67, months: 0 })).toBe("67");
  });
});
