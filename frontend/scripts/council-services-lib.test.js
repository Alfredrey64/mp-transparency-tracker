import { describe, it, expect } from "vitest";
import { roadSheet, roadsFrom, flyTippingFrom } from "./council-services-lib.mjs";

const road = [
  ["title"], [],
  ["ONS Area Code", "Region", "Local Authority", "FYE 2022", "FYE 2023", "FYE 2024", "FYE 2025", "FYE 2026", "Notes"],
  ["E06000047", "North East", "County Durham UA", 4, "[x]", 5, 6, 7, "[z]"],
  ["E06000005", "North East", "Darlington UA", "[y]", "[y]", "[y]", "[y]", "[y]"],
  ["E92000001", "England", "[z]", 4, 4, 4, 4, 5],
];

describe("council road condition", () => {
  it("reads the year columns, each authority's recent values and England's row", () => {
    const s = roadSheet(road, 3);
    expect(s.years).toEqual([2024, 2025, 2026]);
    expect(s.councils).toEqual({ E06000047: [5, 6, 7] });
    expect(s.england).toEqual([4, 4, 5]);
  });
  it("leaves note markers as gaps, and drops an authority with no numbers at all", () => {
    const s = roadSheet(road, 5);
    expect(s.councils.E06000047).toEqual([4, null, 5, 6, 7]);
    expect(s.councils.E06000005).toBeUndefined();
  });
  it("returns null for a sheet it does not recognise", () => { expect(roadSheet([["x"]])).toBeNull(); });
  it("combines the three sheets by authority", () => {
    const a = roadSheet(road, 2);
    const r = roadsFrom(a, a, a);
    expect(r.years).toEqual([2025, 2026]);
    expect(r.councils.E06000047).toEqual({ a: [6, 7], bc: [6, 7], u: [6, 7] });
    expect(roadsFrom(a, null, a)).toBeNull();
  });
});

describe("fly-tipping", () => {
  const rows = [
    ["note"], [], [null, null, null, null, "TOTAL"],
    ["Year", "ONS Code", "LA Name", "Region", "Total Incidents"],
    ["2023-24", "E06000001", "Hartlepool", "North East", 1000],
    ["2024/25", "E06000001", "Hartlepool", "North East", 1100],
    ["2024/25", "E06000002", "Middlesbrough", "North East", 2000],
    ["2024/25", "E06000003", "Redcar", "North East", ":"],
  ];
  it("keeps the newest year and the year before for each authority", () => {
    const f = flyTippingFrom(rows);
    expect(f.year).toBe("2024/25");
    expect(f.before).toBe("2023/24");
    expect(f.councils).toEqual({ E06000001: { t: 1100, p: 1000 }, E06000002: { t: 2000, p: null } });
    expect(f.englandTotal).toBe(3100);
  });
  it("returns null for a sheet it does not recognise", () => { expect(flyTippingFrom([["x"]])).toBeNull(); });
});
