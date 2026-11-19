import { describe, it, expect } from "vitest";
import { figure, yearLabel, ks4From, ks4National, ks2Row, ks2National, withResults } from "./school-results-lib.mjs";

const T = { breakdown_topic: "Total", breakdown: "Total", sex: "Total", disadvantage_status: "Total", first_language: "Total", prior_attainment: "Total", mobility: "Total" };

describe("school results", () => {
  it("reads figures and treats the DfE's suppression letters as missing", () => {
    expect(figure("46.2")).toBe(46.2);
    expect(figure("-0.03")).toBe(-0.03);
    for (const v of ["z", "x", "c", "u", "low", "", null]) expect(figure(v)).toBeNull();
  });
  it("labels an academic year", () => { expect(yearLabel("202526")).toBe("2025/26"); expect(yearLabel("x")).toBe(""); });
  it("keeps each school's newest published Attainment 8, from the whole cohort only", () => {
    const rows = [
      { ...T, school_urn: "1", time_period: "202425", version: "Final", attainment8_average: "44.0", engmath_95_percent: "40", engmath_94_percent: "60", progress8_average: "z", pupil_count: "100" },
      { ...T, school_urn: "1", time_period: "202526", version: "Provisional", attainment8_average: "45.5", engmath_95_percent: "42", engmath_94_percent: "62", progress8_average: "0.1", pupil_count: "110" },
      { ...T, school_urn: "1", time_period: "202526", version: "Provisional", attainment8_average: "10", sex: "Boys" },
      { ...T, school_urn: "2", time_period: "202526", version: "Provisional", attainment8_average: "z" },
    ];
    const k = ks4From(rows);
    expect(Object.keys(k)).toEqual(["1"]);
    expect(k["1"]).toEqual({ p: "202526", a: 45.5, g5: 42, g4: 62, pr: 0.1, n: 110, v: 1 });
  });
  it("finds England's figures from the all state-funded national row", () => {
    const rows = [
      { geographic_level: "National", breakdown_topic: "Total", breakdown: "Total", establishment_type_group: "All state-funded", time_period: "202425", attainment8_average: "46.1", engmath_95_percent: "45.4", engmath_94_percent: "64.8" },
      { geographic_level: "National", breakdown_topic: "Total", breakdown: "Total", establishment_type_group: "All state-funded", time_period: "202526", attainment8_average: "46.2", engmath_95_percent: "46.3", engmath_94_percent: "64.8" },
      { geographic_level: "Regional", breakdown_topic: "Total", breakdown: "Total", establishment_type_group: "All state-funded", time_period: "202627", attainment8_average: "50" },
    ];
    expect(ks4National(rows)).toEqual({ p: "202526", a: 46.2, g5: 46.3, g4: 64.8 });
  });
  it("reads the primary reading, writing and maths row", () => {
    const row = { breakdown_topic: "All pupils", breakdown: "Total", subject: "Reading, writing and maths", school_urn: "100000", time_period: "202425", expected_standard_pupil_percent: "77", higher_standard_pupil_percent: "10" };
    expect(ks2Row(row)).toEqual(["100000", { p: "202425", e: 77, h: 10 }]);
    expect(ks2Row({ ...row, subject: "Reading" })).toBeNull();
    expect(ks2Row({ ...row, expected_standard_pupil_percent: "c" })).toBeNull();
    const nat = { geographic_level: "National", establishment_type_group: "All state funded", subject: "Reading, writing and maths", sex: "Total", priority_area_flag: "Not a priority", time_period: "202425", expected_standard_pupil_percent: "62", higher_standard_pupil_percent: "8" };
    expect(ks2National([{ ...nat, time_period: "201516", expected_standard_pupil_percent: "54" }, nat, { ...nat, sex: "Boys" }, { ...nat, geographic_level: "Regional" }])).toEqual({ p: "202425", e: 62, h: 8 });
  });
  it("adds results to the right kind of school and drops stale ones", () => {
    const ks4 = { 1: { p: "202526", a: 45.5, g5: 42, g4: 62, pr: null, v: 1 } };
    const ks2 = { 2: { p: "202425", e: 77, h: 10 } };
    expect(withResults({ u: 1, p: "S" }, ks4, ks2).s4).toEqual({ y: "2025/26", a: 45.5, g5: 42, g4: 62, v: 1 });
    expect(withResults({ u: 1, p: "P" }, ks4, ks2).s4).toBeUndefined();
    expect(withResults({ u: 2, p: "P" }, ks4, ks2).s2).toEqual({ y: "2024/25", e: 77, h: 10 });
    expect(withResults({ u: 2, p: "P", s2: { e: 1 } }, ks4, {}).s2).toBeUndefined();
  });
});
