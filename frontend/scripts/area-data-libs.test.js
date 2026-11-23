import { describe, it, expect } from "vitest";
import { buildAsylum, dateOf } from "./asylum-support-lib.mjs";
import { readTA1, readA1, buildHomelessness } from "./homelessness-lib.mjs";
import { readChildPoverty, buildChildPoverty } from "./child-poverty-lib.mjs";
import { csvRows, pick, buildLocalHealth, SPECS } from "./local-health-lib.mjs";
import { endOf } from "./build-homelessness.mjs";
import { readSupply, readStock, buildSupply, yearOf } from "./housing-supply-lib.mjs";

describe("asylum support table", () => {
  const head = ["Date (as at…)", "Support Type", "UK Region / Nation", "Local Authority", "LAD Code", "Accommodation Type", "People"];
  const rows = [
    ["Asy_D11: title"], head,
    ["31 Mar 2026", "Section 95", "South West", "Bristol", "E06000023", "Contingency Accommodation - Hotel", 300],
    ["31 Mar 2026", "Section 95", "South West", "Bristol", "E06000023", "Subsistence Only", 50],
    ["30 Jun 2026", "Section 95", "South West", "Bristol", "E06000023", "Contingency Accommodation - Hotel", 280],
    ["30 Jun 2026", "Section 4", "South West", "Bristol", "E06000023", "Dispersal Accommodation", 20],
    ["30 Jun 2026", "Section 95", "South West", "Bristol", "E06000023", "Subsistence only", 40],
    ["30 Jun 2026", "Section 4", "N/A", "N/A - Section 4 (pre-2018)", "N/A - Section 4 (pre-2018)", "Dispersal Accommodation", 999],
  ];
  it("sorts quarters by date, not by text", () => {
    expect(dateOf("31 Dec 2025")).toBeLessThan(dateOf("31 Mar 2026"));
    expect(Number.isNaN(dateOf("soon"))).toBe(true);
  });
  it("counts people in accommodation per quarter, keeps cash-only support apart, and ignores rows without a council code", () => {
    const d = buildAsylum(rows);
    expect(d.quarters).toEqual(["31 Mar 2026", "30 Jun 2026"]);
    expect(d.areas.E06000023.t).toEqual([300, 300]);
    expect(d.areas.E06000023.now).toEqual({ hotel: 280, dispersal: 20, subsistence: 40 });
    expect(d.uk.t).toEqual([300, 300]);
  });
  it("returns null for a sheet that is not the expected one", () => {
    expect(buildAsylum([["nothing"]])).toBeNull();
  });
});

describe("homelessness tables", () => {
  const taHead = ["Organisation Identification Code", "Area Name", "Households in TA \nTotal\n[note 34]", "Households in area \n(thousands)\n[note 5]", "Households in TA \nTotal\n(per thousand)\nTotal", "Households in TA with children\nTotal", "Children in TA\nTotal", "Households in B&Bs including shared annexes\nTotal"];
  const a1Head = ["Organisation Identification Code", "Area Name", "Initial assessments  Total", "Assessed as owed a duty  Owed a prevention or relief duty Total", "x", "y", "z", "a", "b", "c", "Households in area  (thousands)", "Households assessed as threatened with homelessness (per thousand)", "Households assessed as homeless (per thousand)"];
  const ta = [["Table TA1 - as at 31 March 2026"], taHead, ["E92000001", "ENGLAND", 1000, 24000, 4.1, 600, 1200, 90], ["E12000007", "London", 500, 3600, 9, 300, 600, 30], ...Array.from({ length: 260 }, (_, i) => [`E06${String(i).padStart(6, "0")}`, `Council ${i}`, i === 3 ? "[x]" : 10, 100, 0.1, 4, 8, 1])];
  const a1 = [["Table A1"], a1Head, ["E92000001", "ENGLAND", 0, 840, 0, 0, 0, 0, 0, 0, 24000, 1.5, 2], ...Array.from({ length: 260 }, (_, i) => [`E06${String(i).padStart(6, "0")}`, `Council ${i}`, 0, i === 3 ? "[x]" : 20, 0, 0, 0, 0, 0, 0, 100, 0, 0])];
  it("reads codes as missing and joins the two tables by code, leaving out regions", () => {
    const d = buildHomelessness(readTA1(ta), readA1(a1), { quarter: "January to March 2026", asAt: "31 March 2026" });
    expect(d.areas.E06000000).toMatchObject({ ta: 10, owed: 20, owedK: 0.2 });
    expect(d.areas.E06000003).toMatchObject({ ta: null, owed: null, owedK: null });
    expect(d.areas.E12000007).toBeUndefined();
    expect(d.england).toMatchObject({ ta: 1000, owed: 840 });
    expect(d.reported).toBe(259);
  });
  it("refuses a table that is too small or has no England row", () => {
    expect(buildHomelessness(readTA1(ta.slice(0, 10)), readA1(a1), { quarter: "q", asAt: "a" })).toBeNull();
    expect(readTA1([["nothing"]])).toBeNull();
  });
  it("finds the end of a quarter from a title", () => {
    expect(endOf("Detailed local authority level tables: January to March 2026")).toBeGreaterThan(endOf("Detailed local authority level tables: October to December 2025 (revised)"));
    expect(endOf("Something else")).toBeNull();
  });
});

describe("children in low-income families", () => {
  const head = ["Local Authority [note 2]", "Area Code", "Number of children \nFYE 2024", "Number of children \nFYE 2025", "Percentage of children \nFYE 2024\n(%)", "Percentage of children \nFYE 2025\n(%)"];
  const sheet = (n, prefix) => [["Table"], head, ["United Kingdom", "K02000001", 100, 90, 0.263, 0.26], ...Array.from({ length: n }, (_, i) => [`Area ${i}`, `${prefix}${String(i).padStart(6, "0")}`, 10, 9, 0.2, "[x]"])];
  it("reads both years as percentages to one decimal and drops codes", () => {
    const la = readChildPoverty(sheet(5, "E06"));
    expect(la.years).toEqual([2024, 2025]);
    expect(la.rows.get("K02000001").p).toEqual([26.3, 26]);
    expect(la.rows.get("E06000000").p).toEqual([20, null]);
  });
  it("needs enough areas and matching years in both sheets", () => {
    expect(buildChildPoverty(readChildPoverty(sheet(10, "E06")), readChildPoverty(sheet(10, "E14")))).toBeNull();
    const big = buildChildPoverty(readChildPoverty(sheet(320, "E06")), readChildPoverty(sheet(620, "E14")));
    expect(big.uk).toEqual([26.3, 26]);
    expect(Object.keys(big.la)).toHaveLength(321);
  });
});

describe("Fingertips health data", () => {
  const cols = "Indicator ID,Indicator Name,Parent Code,Parent Name,Area Code,Area Name,Area Type,Sex,Age,Category Type,Category,Time period,Value,Lower CI 95.0 limit,Upper CI 95.0 limit,Lower CI 99.8 limit,Upper CI 99.8 limit,Count,Denominator,Value note,Recent Trend,Compared to England value or percentiles,Compared to percentiles,Time period Sortable,New data,Compared to goal,Time period range";
  const line = (code, name, sex, age, cat, period, value, sortable, range) => `1,x,,,${code},${name},t,${sex},${age},${cat ? "Deprivation" : ""},${cat},${period},${value},${value - 1},${value + 1},,,,,,,,,${sortable},,,${range}`;
  const le = [cols,
    line("E92000001", "England", "Male", "All ages", "", "2023 - 25", 79.7, 20230000, "3y"),
    line("E92000001", "England", "Male", "All ages", "", "2013 - 15", 79.4, 20130000, "3y"),
    line("E06000023", "Bristol", "Male", "All ages", "", "2023 - 25", 79, 20230000, "3y"),
    line("E06000023", "Bristol", "Male", "All ages", "", "2013 - 15", 78.5, 20130000, "3y"),
    line("E06000023", "Bristol", "Male", "All ages", "", "2025", 80.1, 20250000, "1y"),
    line("E06000023", "Bristol", "Male", "All ages", "Most deprived decile", "2023 - 25", 70, 20230000, "3y"),
    line("E06000023", "Bristol", "Female", "All ages", "", "2023 - 25", 83.2, 20230000, "3y")].join("\n");
  it("keeps only the newest three-year figure with no breakdown, and the one ten years earlier", () => {
    const rows = csvRows(le);
    const spec = SPECS.find((s) => s.key === "le");
    expect(pick(rows, spec, "Male").byArea.get("E06000023").v).toBe(79);
    expect(pick(rows, spec, "Male", 10).byArea.get("E06000023").v).toBe(78.5);
    expect(pick(rows, spec, "Male", 10).period).toBe("2013 - 15");
  });
  it("stores two-sex measures as [men, women] and England apart from the areas", () => {
    const d = buildLocalHealth({ le: [le] });
    expect(d.areas.E06000023.le).toEqual([79, 83.2]);
    expect(d.areas.E06000023.leBefore[0]).toBe(78.5);
    expect(d.england.le[0]).toBe(79.7);
    expect(d.areas.E92000001).toBeUndefined();
    expect(d.periods.le).toBe("2023 - 25");
  });
});

describe("housing supply and dwelling stock tables", () => {
  const years = Array.from({ length: 16 }, (_, i) => `${2009 + i}-${String(10 + i).padStart(2, "0")}`);
  const head = ["DCLG code", "Former ONS code", "Current ONS code", "Authority data", ...years.map((y, i) => (i === 15 ? `${y} [p]` : i === 14 ? `${y} [r] [note 17]` : y))];
  const supply = [["Table"], head, [null, null, "E92000001", "England", ...years.map((_, i) => 1000 + i)], [null, null, null, "Unitary Authorities", ...years.map(() => 5)],
    ...Array.from({ length: 260 }, (_, i) => ["x", "y", `E06${String(i).padStart(6, "0")}`, `Council ${i}`, ...years.map((_, k) => (i === 3 && k < 5 ? "[x]" : i === 4 && k === 15 ? "[x]" : 10 + k)) ])];
  const stockRows = [["Table 100"], ["Old ONS code", "New ONS code", "Area", "Local authority", "x", "y", "z", "Total"], [null, "E92000001", "England", 1, 1, 1, 1, 100000],
    ...Array.from({ length: 259 }, (_, i) => [null, `E06${String(i).padStart(6, "0")}`, `Council ${i}`, 0, 0, 0, 0, 1000 + i])];
  it("strips the notes from year headings", () => {
    expect(yearOf("2023-24 [r] [note 17]")).toBe("2023-24");
    expect(yearOf("Authority data")).toBeNull();
  });
  it("keeps the last fifteen years, leaves unavailable years as null and skips unlabelled group rows", () => {
    const s = readSupply(supply);
    expect(s.years).toHaveLength(15);
    expect(s.years.at(-1)).toBe("2024-25");
    expect(s.rows.get("E06000003").y.slice(0, 5)).toEqual([null, null, null, null, 15]); // [x] stays null, never zero
    expect(s.rows.get("E06000004").y.at(-1)).toBeNull();
    expect(s.rows.size).toBe(261);
  });
  it("reads dwelling stock by the new ONS code, not the old one", () => {
    const k = readStock(stockRows);
    expect(k.get("E92000001")).toBe(100000);
    expect(k.get("E06000010")).toBe(1010);
  });
  it("joins them, drops councils with no stock (abolished) and works out England's rate", () => {
    const d = buildSupply(readSupply(supply), readStock(stockRows), { stockYear: 2025 });
    expect(Object.keys(d.areas)).toHaveLength(259);
    expect(d.areas.E06000000).toMatchObject({ n: "Council 0", d: 1000 });
    expect(d.england.rate).toBeCloseTo(10.1, 1); // 1015 / 100000 * 1000, to one place
    expect(d.withLatest).toBe(258);
  });
  it("refuses tables that are too small or have no England row", () => {
    expect(buildSupply(readSupply(supply.slice(0, 20)), readStock(stockRows), { stockYear: 2025 })).toBeNull();
    expect(readSupply([["nothing"]])).toBeNull();
    expect(readStock([["nothing"]])).toBeNull();
  });
});
