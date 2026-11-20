import { describe, it, expect } from "vitest";
import { normTaxName, releaseYear, readTable9, applyYear } from "./council-tax-lib.mjs";

const table = [
  ["Table 9: Area council tax"], ["This worksheet"],
  ["E Code", "ONS Code", "Authority", "Region", "Class", "Area", "Band A", "Band B", "Band C", "Band D"],
  ["E1", "E07000223", "Adur", "SE", "SD", "x", 1, 1, 1, 2548.4],
  ["E2", "E06000015", "Derby", "EM", "UA", "x", 1, 1, 1, 2287.6],
  ["E3", "bad", "Nowhere", "SE", "SD", "x", 1, 1, 1, 100],
  ["E4", "E07000224", "Arun", "SE", "SD", "x", 1, 1, 1, null],
];

describe("council tax release", () => {
  it("matches names that differ only in the kind of council", () => {
    expect(normTaxName("Barking & Dagenham")).toBe(normTaxName("Barking and Dagenham"));
    expect(normTaxName("Derby City")).toBe(normTaxName("Derby"));
    expect(normTaxName("Dorset Council")).toBe(normTaxName("Dorset"));
  });
  it("reads the year from the cover sheet and refuses a year that does not add up", () => {
    expect(releaseYear([["Council Tax levels: Tables 1 - 9 for 2026-27"]])).toBe(2026);
    expect(releaseYear([["Tables for 2026-29"]])).toBeNull();
    expect(releaseYear([["nothing here"]])).toBeNull();
  });
  it("reads only rows with an ONS code and a Band D figure, rounded to the pound", () => {
    expect(readTable9(table)).toEqual([{ code: "E07000223", name: "Adur", cls: "SD", bandD: 2548 }, { code: "E06000015", name: "Derby", cls: "UA", bandD: 2288 }]);
    expect(readTable9([["nothing"]])).toEqual([]);
  });
});

describe("adding a year", () => {
  // Enough authorities for the safety check (at least 250 in the release and nine in ten matched).
  const fillers = Array.from({ length: 260 }, (_, i) => `Filler ${i}`);
  const make = () => ({ from: 2024, rows: [["Adur", "SD", [2000, 2100, 2200]], ["Derby City", "UA", [1900, 2000, 2100]], ["Gone Council", "SD", [1500, 1600, 1700]], ...fillers.map((n) => [n, "SD", [1000, 1100, 1200]])] });
  const entries = () => [{ code: "E07000223", name: "Adur", cls: "SD", bandD: 2300 }, { code: "E06000015", name: "Derby", cls: "UA", bandD: 2200 }, ...fillers.map((n, i) => ({ code: `E1${String(i).padStart(7, "0")}`, name: n, cls: "SD", bandD: 1300 })), { code: "E09999999", name: "Brand New", cls: "UA", bandD: 1500 }];
  it("adds the next year to every row, adds the ONS code, and blanks an authority that has gone", () => {
    const { data, matched, added, ended } = applyYear(make(), entries(), 2027);
    expect(data.rows.find((r) => r[0] === "Adur")).toEqual(["Adur", "SD", [2000, 2100, 2200, 2300], "E07000223"]);
    expect(data.rows.find((r) => r[0] === "Derby City")[2]).toEqual([1900, 2000, 2100, 2200]);
    expect(data.rows.find((r) => r[0] === "Gone Council")[2]).toEqual([1500, 1600, 1700, null]);
    expect([matched, added, ended]).toEqual([262, 1, 1]);
    // a new authority has blanks before its first bill
    expect(data.rows.find((r) => r[0] === "Brand New")[2]).toEqual([null, null, null, 1500]);
  });
  it("overwrites the last year when the Ministry revises it, matching by code once the code is there", () => {
    const once = applyYear(make(), entries(), 2027).data;
    const revised = entries().map((e) => (e.code === "E07000223" ? { ...e, name: "Adur District Council", bandD: 2310 } : e));
    const again = applyYear(once, revised, 2027).data;
    expect(again.rows.find((r) => r[0] === "Adur")[2]).toEqual([2000, 2100, 2200, 2310]);
  });
  it("refuses a year that leaves a gap, and a release in which too little matches", () => {
    expect(() => applyYear(make(), entries(), 2029)).toThrow(/left as it is/);
    expect(() => applyYear(make(), entries().slice(0, 5), 2027)).toThrow(/Only/);
  });
});
