import { describe, it, expect } from "vitest";
import profile from "./regionalProfile.json";
import breakdowns from "./regionalBreakdowns.json";
import deprivation from "./deprivation.json";
import seats from "./deprivationConstituencies.json";
import { REGIONS } from "./regionMetrics";

const censusPlaces = REGIONS.filter((r) => !["scotland", "ni"].includes(r.key)).map((r) => r.key);

describe("census profile", () => {
  it("has every group for every region of England and for Wales, as shares", () => {
    expect(profile.categories.length).toBeGreaterThanOrEqual(8);
    for (const cat of profile.categories) {
      expect(cat.groups.length, cat.id).toBeGreaterThan(1);
      for (const g of cat.groups) {
        for (const key of censusPlaces) {
          expect(g.values[key], `${cat.id}/${g.id}/${key}`).toBeGreaterThanOrEqual(0);
          expect(g.values[key], `${cat.id}/${g.id}/${key}`).toBeLessThanOrEqual(100);
        }
        expect(g.all, `${cat.id}/${g.id}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("splits the population into groups that add up to 100 where they should", () => {
    const religion = profile.categories.find((c) => c.id === "religion");
    const sum = religion.groups.reduce((t, g) => t + g.all, 0);
    expect(sum).toBeGreaterThan(90);
    expect(sum).toBeLessThanOrEqual(100.5);
    const eth = profile.categories.find((c) => c.id === "ethnicity");
    const whiteBritish = eth.groups.find((g) => g.id === "white-british");
    const other = eth.groups.find((g) => g.id === "not-white-british");
    expect(whiteBritish.all + other.all).toBeCloseTo(100, 0);
  });
});

describe("Scotland and Northern Ireland", () => {
  it("are filled in for the groups that can be compared, and plausible", () => {
    const find = (cat, id) => profile.categories.find((c) => c.id === cat).groups.find((g) => g.id === id);
    for (const [cat, id] of [["ethnicity", "asian"], ["religion", "christian"], ["age", "65-plus"], ["homes", "own-outright"], ["education", "degree"], ["health", "bad-health"], ["birth", "born-abroad"]]) {
      const g = find(cat, id);
      expect(g.values.scotland, `${cat}/${id}`).toBeGreaterThan(0);
      expect(g.values.ni, `${cat}/${id}`).toBeGreaterThan(0);
      expect(g.uk, `${cat}/${id}`).toBeGreaterThan(0);
    }
    // Known headlines: most people in Northern Ireland are Christian, about half in Scotland have no religion.
    expect(find("religion", "christian").values.ni).toBeGreaterThan(75);
    expect(find("religion", "no-religion").values.scotland).toBeGreaterThan(45);
  });
});

describe("deprivation", () => {
  it("covers England's nine regions and nearly every council", () => {
    expect(Object.keys(deprivation.regions)).toHaveLength(9);
    expect(deprivation.areas.length).toBeGreaterThan(280);
    expect(deprivation.areas[0].rank).toBe(1);
  });

  it("spreads each region's people across ten steps that add up to about 100%", () => {
    for (const region of Object.values(deprivation.regions)) {
      for (const list of Object.values(region.deciles)) {
        expect(list).toHaveLength(10);
        expect(list.reduce((a, b) => a + b, 0)).toBeGreaterThan(99);
        expect(list.reduce((a, b) => a + b, 0)).toBeLessThan(101);
      }
    }
  });

  it("is roughly even across England as a whole, by construction", () => {
    for (const v of deprivation.england.deciles.imd) expect(v).toBeGreaterThan(9);
  });
});

describe("regional breakdowns", () => {
  it("has Jobs, Housing and Crime, each with groups that have a figure for most places", () => {
    for (const sector of ["jobs", "housing", "crime"]) {
      const cats = breakdowns.sectors[sector]?.categories ?? [];
      expect(cats.length, sector).toBeGreaterThanOrEqual(2);
      for (const cat of cats) {
        expect(["gbp", "gbp2", "pct", "per1000", "multiple"], `${sector}/${cat.id}`).toContain(cat.format);
        expect(cat.groups.length, `${sector}/${cat.id}`).toBeGreaterThan(0);
        for (const g of cat.groups) expect(Object.values(g.values).filter((v) => v !== null).length, `${sector}/${cat.id}/${g.id}`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("gives believable figures", () => {
    const find = (sector, cat, group) => breakdowns.sectors[sector].categories.find((c) => c.id === cat).groups.find((g) => g.id === group);
    // London is the most expensive and takes the most years of pay; the North East the cheapest.
    const years = find("housing", "affordability", "years-averagePrice").values;
    expect(years.london).toBeGreaterThan(years.ne * 2);
    // Women are paid less per hour than men in the UK as a whole.
    expect(breakdowns.sectors.jobs.categories.find((c) => c.id === "paygap").groups[0].all).toBeGreaterThan(0);
    // Crime is recorded for England and Wales only.
    expect(find("crime", "rate", "total-recorded-crime-excluding-fraud-").values.scotland).toBeNull();
  });
});

describe("deprivation by constituency", () => {
  it("covers England's 543 constituencies, ranked from most to least deprived", () => {
    expect(seats.seats.length).toBeGreaterThanOrEqual(540);
    expect(seats.seats[0].rank).toBe(1);
    expect(seats.seats[0].score).toBeGreaterThan(seats.seats.at(-1).score);
    for (const seat of seats.seats) {
      expect(seat.worst10, seat.name).toBeGreaterThanOrEqual(0);
      expect(seat.worst10, seat.name).toBeLessThanOrEqual(100);
      expect(seat.code).toMatch(/^E14/);
    }
  });

  it("adds up to about a tenth of England's people in the most deprived tenth", () => {
    const people = seats.seats.reduce((n, s) => n + s.people, 0);
    const worst = seats.seats.reduce((n, s) => n + (s.worst10 / 100) * s.people, 0);
    expect(people).toBeGreaterThan(55e6);
    expect(worst / people).toBeGreaterThan(0.095);
    expect(worst / people).toBeLessThan(0.105);
  });
});
