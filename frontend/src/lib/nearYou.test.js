import { describe, expect, it } from "vitest";
import { tileOf, miles, tilesAround, schoolsWithin, inspectionLines, monthYear, nearestTrusts } from "./nearYou";

describe("tiles", () => {
  it("names the tile a point is in, including west of Greenwich", () => {
    expect(tileOf(51.5, -0.14)).toBe("257_-1");
    expect(tileOf(52.04, 1.26)).toBe("260_6");
  });
  it("loads every tile a three-mile circle can reach, and none that it cannot", () => {
    const near = { lat: 51.5, lon: -0.14 };
    const tiles = tilesAround(near, 3);
    expect(tiles).toContain(tileOf(51.5, -0.14));
    expect(tiles.length).toBeLessThanOrEqual(4);
    // A point on a tile's edge has to bring the neighbour in.
    const edge = { lat: 51.4, lon: -0.2 };
    expect(tilesAround(edge, 3).length).toBeGreaterThan(1);
  });
});

describe("miles", () => {
  it("measures a known distance: Westminster to St Paul's is about 2.2 miles", () => {
    expect(miles({ lat: 51.4995, lon: -0.1248 }, { lat: 51.5138, lon: -0.0984 })).toBeGreaterThan(1.5);
    expect(miles({ lat: 51.4995, lon: -0.1248 }, { lat: 51.5138, lon: -0.0984 })).toBeLessThan(2.5);
  });
});

const school = (over) => ({ u: 1, n: "A", p: "P", la: 51.5, lo: -0.14, k: 100, ...over });

describe("schoolsWithin", () => {
  it("keeps the schools in range, nearest first, and can narrow by phase", () => {
    const list = [school({ u: 1, n: "Far", la: 51.7 }), school({ u: 2, n: "Near", la: 51.501 }), school({ u: 3, n: "Mid", p: "S", la: 51.52 })];
    expect(schoolsWithin(list, { lat: 51.5, lon: -0.14 }, 3).map((s) => s.n)).toEqual(["Near", "Mid"]);
    expect(schoolsWithin(list, { lat: 51.5, lon: -0.14 }, 3, "S").map((s) => s.n)).toEqual(["Mid"]);
  });
});

describe("inspectionLines", () => {
  it("describes a report card and an old grade in plain words", () => {
    const lines = inspectionLines(school({ c: "SXXNEX", cs: 1, cd: "2026-04", g: 2, gd: "2022-11" }));
    expect(lines[0].text).toBe("Report card, April 2026: 2 of 6 areas strong or better, 1 needs attention or urgent improvement, safeguarding met.");
    expect(lines[1].text).toBe("Last overall grade, November 2022: Good.");
  });
  it("says so when there is nothing listed", () => {
    expect(inspectionLines(school({}))[0].kind).toBe("none");
  });
});

describe("monthYear", () => {
  it("reads a year and month, and says so when there is none", () => { expect(monthYear("2026-04")).toBe("April 2026"); expect(monthYear("")).toBe("date not listed"); });
});

describe("nearestTrusts", () => {
  it("returns the closest few", () => {
    const t = [{ n: "A", la: 51.5, lo: -0.1 }, { n: "B", la: 53, lo: -2 }, { n: "C", la: 51.6, lo: -0.2 }];
    expect(nearestTrusts(t, { lat: 51.5, lon: -0.12 }, 2).map((x) => x.n)).toEqual(["A", "C"]);
  });
});
