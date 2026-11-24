import { describe, it, expect } from "vitest";
import { asylumView, asylumHeld, homelessView, housingView, povertyView, healthView, quarterLabel, rentView, wasteView } from "./areaMoreViews";

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

describe("private rents view", () => {
  const mk = (n, g, r, a, s) => ({ n, g, r, a, b: [r - 200, r - 100, r, r + 200], t: [r + 300, r + 100, r, r - 100], s });
  const data = {
    month: "2026-10", years: [2024, 2025, 2026],
    areas: { E1: mk("Cheap", "South West", 700, 1.5, [600, 650, 700]), E2: mk("Dear", "South West", 1500, 6, [1000, 1200, 1500]), E3: mk("Middle", "North West", 900, 3, [800, null, 900]), W06000001: mk("Welsh", "Wales", 640, 3, [500, 600, 640]) },
    regions: { "South West": { n: "South West", g: "[z]", r: 1254, a: 3.3, b: [], t: [], s: [] } },
    england: { n: "England", r: 1472, a: 4, b: [1205, 1347, 1504, 2180], t: [1655, 1464, 1448, 1456], s: [900, 1000, 1100] },
    wales: { n: "Wales", r: 849, a: 3.9, b: [637, 782, 893, 1252], t: [1088, 880, 836, 708], s: [500, 600, 700] },
  };
  it("compares a council with its region and England, and ranks it from dearest", () => {
    const v = rentView(data, "E1");
    expect(v).toMatchObject({ name: "Cheap", rent: 700, annual: 1.5, rank: 3, of: 4, riseRank: 4 });
    expect(v.region).toMatchObject({ name: "South West", rent: 1254 });
    expect(v.nation).toMatchObject({ name: "England", rent: 1472 });
    expect(rentView(data, "E2").rank).toBe(1);
  });
  it("works out the change since the first year, against the nation's over the same years", () => {
    expect(rentView(data, "E1").since).toEqual({ year: 2024, change: 16.7, nation: 63.6 });
  });
  it("skips a year with no figure and gives the size and kind-of-home rents", () => {
    const v = rentView(data, "E3");
    expect(v.series.map((p) => p.year)).toEqual([2024, 2026]);
    expect(v.beds).toHaveLength(4);
    expect(v.types[3]).toMatchObject({ label: "Flat or maisonette", rent: 800, nation: 1456 });
  });
  it("compares a Welsh council with Wales and has no English region", () => {
    const v = rentView(data, "W06000001");
    expect(v.nation.name).toBe("Wales");
    expect(v.region).toBeNull();
  });
  it("gives nothing for a council it does not hold", () => expect(rentView(data, "nope")).toBeNull());
});

describe("waste view", () => {
  const data = {
    years: ["2023-24", "2024-25"],
    areas: { E1: { n: "A", t: "Collection", p: [50, 52], k: [400, 380], c: [350, 340] }, E2: { n: "B", t: "Unitary", p: [30, 31], k: [600, 590], c: [420, 410] }, E3: { n: "C", t: "Collection", p: [55, 60], k: [300, null], c: [320, 310] } },
    england: { p: [42.3, 42], k: [511, 513], c: [391, 387] },
  };
  it("gives the latest rate, the year before, England's figures and the rank from the best recycler", () => {
    const v = wasteView(data, "E1");
    expect(v).toMatchObject({ rate: 52, before: 50, year: "2024-25", beforeYear: "2023-24", residual: 380, perPerson: 340, rank: 2, of: 3 });
    expect(v.england).toMatchObject({ rate: 42, residual: 513, perPerson: 387 });
    expect(wasteView(data, "E3").rank).toBe(1);
  });
  it("ranks the waste left over from the least, and leaves a missing figure out of that ranking", () => {
    expect(wasteView(data, "E1").residualRank).toBe(1);
    expect(wasteView(data, "E1").residualOf).toBe(2);
    expect(wasteView(data, "E3").residualRank).toBeNull();
  });
  it("gives nothing for a council it does not hold", () => expect(wasteView(data, "nope")).toBeNull());
});
