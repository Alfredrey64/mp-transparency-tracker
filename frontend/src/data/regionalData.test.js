import { describe, it, expect } from "vitest";
import profile from "./regionalProfile.json";
import deprivation from "./deprivation.json";
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
