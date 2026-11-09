import { describe, it, expect } from "vitest";
import { partyAge, initials } from "./partyHistory";

describe("partyAge", () => {
  it("counts years from the founding year to the year on the clock", () => {
    expect(partyAge(1900, new Date("2026-11-09"))).toBe(126);
    expect(partyAge(1834, new Date("2026-11-09"))).toBe(192);
  });
  it("goes up by one on 1 January, with nothing changed", () => {
    expect(partyAge(1900, new Date("2026-12-31T23:59:00"))).toBe(126);
    expect(partyAge(1900, new Date("2027-01-01T00:00:00"))).toBe(127);
  });
  it("is never negative and never NaN", () => {
    expect(partyAge(2100, new Date("2026-11-09"))).toBe(0);
    expect(partyAge(undefined, new Date("2026-11-09"))).toBe(0);
    expect(partyAge("1900", new Date("2026-11-09"))).toBe(126);
  });
});

describe("initials", () => {
  it("gives two capitals, skipping small words", () => {
    expect(initials("Kemi Badenoch")).toBe("KB");
    expect(initials("Rhun ap Iorwerth")).toBe("RI");
    expect(initials("Mary Lou McDonald")).toBe("ML");
  });
  it("copes with nothing", () => {
    expect(initials("")).toBe("");
    expect(initials(undefined)).toBe("");
  });
});
