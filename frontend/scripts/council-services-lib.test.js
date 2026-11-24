import { describe, it, expect } from "vitest";
import { roadSheet, roadsFrom, flyTippingFrom, repairSheet, repairsFrom } from "./council-services-lib.mjs";

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

describe("road repair sheets", () => {
  const rows = (title) => [[title], ["This worksheet contains one table."], [], [], ["ONS Area Code", "Region", "Local Authority", "Network Length (km) [note 1]", "Strengthening [note 4, 5]", "Resurfacing [note 4, 5]", "Preservation [note 4, 5]", "Total [note 6]"],
    ["E06000047", "North East", "County Durham UA", 100, 1, 3, 6, 10], ["E06000005", "North East", "Darlington UA", 300, 0, 1, 3, 4], ["E06000099", "North East", "No data", 50, "[x]", "[x]", "[x]", "[x]"], ["W06000001", "Wales", "Not England", 10, 1, 1, 1, 3]];
  it("reads each authority's treated share and weights England by network length", () => {
    const a = repairSheet(rows("Percentage of local A road length receiving maintenance treatment in Financial Year Ending 2026 [note 1]"));
    expect(a.year).toBe(2026);
    expect(a.councils.E06000047).toEqual([100, 1, 3, 6, 10]);
    expect(a.councils.E06000099).toBeUndefined();
    expect(a.councils.W06000001).toBeUndefined();
    expect(a.england).toBe(5.5); // (100 * 10 + 300 * 4) / 400
  });
  it("joins the A road and other road sheets", () => {
    const a = repairSheet(rows("A roads Financial Year Ending 2026"));
    const o = repairSheet(rows("Other roads Financial Year Ending 2026"));
    const j = repairsFrom(a, o);
    expect(j.year).toBe(2026);
    expect(j.councils.E06000005).toEqual({ a: [300, 0, 1, 3, 4], o: [300, 0, 1, 3, 4] });
    expect(repairsFrom(null, o)).toBeNull();
  });
  it("gives nothing for a sheet without the header", () => { expect(repairSheet([["nothing"]])).toBeNull(); });
});
