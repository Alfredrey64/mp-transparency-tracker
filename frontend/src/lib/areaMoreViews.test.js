import { describe, it, expect } from "vitest";
import { asylumView, asylumHeld, homelessView, housingView, povertyView, healthView, quarterLabel } from "./areaMoreViews";

describe("asylum view", () => {
  const data = { asAt: "30 Jun 2026", quarters: ["31 Mar 2026", "30 Jun 2026"], uk: { t: [100, 90] }, areas: { E1: { n: "Bristol", t: [10, 6], now: { hotel: 4, dispersal: 2, subsistence: 3 } } } };
  it("counts people in accommodation without cash-only support, and lists the kinds present", () => {
    const v = asylumView(data, "E1");
    expect(v).toMatchObject({ housed: 6, hotels: 4, subsistence: 3, ukHoused: 90 });
    expect(v.kinds.map((k) => k.key)).toEqual(["dispersal", "hotel"]);
  });
  it("returns null for a council that is not in the table, and says whether the table is held", () => {
    expect(asylumView(data, "E9")).toBeNull();
    expect(asylumHeld(data)).toBe(true);
    expect(asylumHeld({})).toBe(false);
  });
  it("shortens a quarter's date", () => expect(quarterLabel("30 Jun 2026")).toBe("Jun 26"));
});

describe("homelessness view", () => {
  const data = { quarter: "January to March 2026", asAt: "31 March 2026", england: { ta: 1 }, areas: { E1: { n: "A", ta: 5, owed: 9 }, E2: { n: "B", ta: null, owed: null } } };
  it("says whether the council sent its return", () => {
    expect(homelessView(data, "E1").reported).toBe(true);
    expect(homelessView(data, "E2").reported).toBe(false);
    expect(homelessView(data, "E3")).toBeNull();
  });
});

describe("child poverty view", () => {
  const data = { years: [2024, 2025], uk: [26.3, 26], la: { E1: { n: "Bristol", c: [100, 90], p: [26.4, 25.6] }, E2: { n: "Gone", c: [1, null], p: [20, null] } }, con: {} };
  it("gives the latest share, the year before and the difference from the UK", () => {
    expect(povertyView(data, "E1")).toMatchObject({ percent: 25.6, before: 26.4, beforeYear: 2024, year: 2025, uk: 26, difference: -0.4 });
  });
  it("returns null where the latest year is missing", () => expect(povertyView(data, "E2")).toBeNull());
});

describe("health view", () => {
  const data = { periods: { le: "2023 - 25" }, england: { le: [79.7, 83.5] }, areas: { D1: { n: "Torridge", le: [81, 84], smoke: [12, 5, 20] }, C1: { n: "Devon", hle: [63.7, 64], le: [80, 84] } } };
  it("takes healthy life expectancy from the county when the district has none", () => {
    const v = healthView(data, "D1", "C1");
    expect(v.life.value).toEqual([81, 84]);
    expect(v.healthy).toMatchObject({ area: "Devon", fromCounty: true });
    expect(v.smoke.value[0]).toBe(12);
  });
  it("returns null when neither area is held", () => expect(healthView(data, "X", "Y")).toBeNull());
});

describe("housing view", () => {
  const years = ["2020-21", "2021-22", "2022-23", "2023-24", "2024-25"];
  const data = { years, stockYear: 2025, england: { y: [100, 100, 100, 100, 100], d: 10000, rate: 10 }, areas: {
    A: { n: "A", y: [10, 20, 30, 40, 50], d: 1000 }, B: { n: "B", y: [5, null, 5, 5, 5], d: 1000 }, C: { n: "C", y: [1, 1, 1, 1, -10], d: 500 }, D: { n: "D", y: [1, 1, 1, 1, null], d: 500 } } };
  it("works out per-1,000 rates and ranks councils by them, with the most first", () => {
    const v = housingView(data, "A");
    expect(v).toMatchObject({ latest: 50, rate: 50, rank: 1, of: 3, five: 150, fiveRate: 150, englandRate: 10, englandFiveRate: 50 });
    expect(housingView(data, "B").rank).toBe(2);
  });
  it("keeps a net loss as a negative and says a gap year leaves no five-year total", () => {
    expect(housingView(data, "C")).toMatchObject({ rate: -20, rank: 3, five: -6 });
    expect(housingView(data, "B").five).toBeNull();
  });
  it("has no rate or rank where the latest year was not sent, and nothing for an unknown council", () => {
    expect(housingView(data, "D")).toMatchObject({ rate: null, rank: null });
    expect(housingView(data, "Z")).toBeNull();
  });
  it("names the five years and the peak", () => {
    expect(housingView(data, "A").fiveYears).toBe("2020-21 to 2024-25");
    expect(housingView(data, "A").peak).toEqual({ year: "2024-25", n: 50, latest: true });
  });
});
