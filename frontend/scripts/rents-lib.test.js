import { describe, it, expect } from "vitest";
import { readRents, newestWorkbook, monthOf } from "./rents-lib.mjs";

const head = ["Time period", "Area code", "Area name", "Region or country name", "Index", "Monthly change", "Annual change", "Rental price", "Index one bed", "Monthly change one bed", "Annual change one bed", "Rental price one bed", "Index two bed", "Monthly change two bed", "Annual change two bed", "Rental price two bed", "Index three bed", "Monthly change three bed", "Annual change three bed", "Rental price three bed", "Index four or more bed", "Monthly change four or more bed", "Annual change four or more bed", "Rental price four or more bed", "Index detached", "Monthly change detached", "Annual change detached", "Rental price detached", "Index semidetached", "Monthly change semidetached", "Annual change semidetached", "Rental price semidetached", "Index terraced", "Monthly change terraced", "Annual change terraced", "Rental price terraced", "Index flat maisonette", "Monthly change flat maisonette", "Annual change flat maisonette", "Rental price flat maisonette"];
// Excel serial dates: 2015-10-01 = 42278, 2025-10-01 = 45931, 2026-10-01 = 46296.
const row = (t, code, name, region, rent, annual, bed = [500, 600, 700, 900], type = [1000, 800, 700, 600]) => {
  const r = Array(head.length).fill("[x]");
  r[0] = t; r[1] = code; r[2] = name; r[3] = region; r[6] = annual; r[7] = rent;
  [11, 15, 19, 23].forEach((c, k) => { r[c] = bed[k]; });
  [27, 31, 35, 39].forEach((c, k) => { r[c] = type[k]; });
  return r;
};
const sheet = [["Price Index of Private Rents"], ["one table"], head,
  row(42278, "E07000046", "Torridge", "South West", 551, "[x]"),
  row(45931, "E07000046", "Torridge", "South West", 784, 4.1),
  row(46296, "E07000046", "Torridge", "South West", 795.4, 1.49),
  row(46296, "E06000099", "Missing", "South West", "[x]", "[x]"),
  row(46296, "W06000001", "Isle of Anglesey", "Wales", 640, 3),
  row(46296, "E92000001", "England", "[z]", 1472, 4.01),
  row(46296, "W92000004", "Wales", "[z]", 849, 3.9),
  row(46296, "E12000009", "South West", "[z]", 1254, 3.34),
  row(46296, "S33000001", "Scottish broad area", "Scotland", 700, 2),
];

describe("private rents workbook", () => {
  const d = readRents(sheet);
  it("turns a spreadsheet date into a month", () => { expect(monthOf(46296)).toBe("2026-10"); expect(monthOf(42278)).toBe("2015-10"); });
  it("takes the newest month and the same month of each earlier year, leaving a year with no row as null", () => {
    expect(d.month).toBe("2026-10");
    expect(d.years).toHaveLength(12);
    expect(d.areas.E07000046).toMatchObject({ n: "Torridge", g: "South West", r: 795, a: 1.5, b: [500, 600, 700, 900], t: [1000, 800, 700, 600] });
    expect(d.areas.E07000046.s[0]).toBe(551);
    expect(d.areas.E07000046.s[10]).toBe(784);
    expect(d.areas.E07000046.s[11]).toBe(795);
    expect(d.areas.E07000046.s[5]).toBeNull();
  });
  it("keeps councils of England and Wales, the regions, England and Wales, and nothing else", () => {
    expect(Object.keys(d.areas).sort()).toEqual(["E07000046", "W06000001"]);
    expect(Object.keys(d.regions)).toEqual(["South West"]);
    expect(d.england.r).toBe(1472);
    expect(d.wales.r).toBe(849);
  });
  it("leaves out a council with no rent in the newest month", () => { expect(d.areas.E06000099).toBeUndefined(); });
  it("gives nothing for a table without the expected header", () => { expect(readRents([["x"], ["y"]])).toBeNull(); });
  it("finds the newest workbook on the ONS page by the date in its folder", () => {
    const html = `<a href="/file?uri=/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics/21october2026/priceindexofprivaterentsukmonthlypricestatistics.xlsx">old</a>
      <a href="/file?uri=/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics/18november2026/priceindexofprivaterentsukmonthlypricestatistics10.xlsx">new</a>
      <a href="/file?uri=/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics/16september2026/x.xlsx">older</a>`;
    expect(newestWorkbook(html)).toEqual({ url: "https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics/18november2026/priceindexofprivaterentsukmonthlypricestatistics10.xlsx", released: "2026-11-18" });
    expect(newestWorkbook("<p>nothing</p>")).toBeNull();
  });
});
