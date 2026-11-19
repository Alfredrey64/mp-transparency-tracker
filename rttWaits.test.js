import { describe, it, expect } from "vitest";
import { totalsFrom, nationalFrom, periodOf, headerIndex } from "./rttWaits.js";

const head = [null, "Region Code", "Provider Code", "Provider Name", "Treatment Function Code", "Treatment Function", ">0-1", "Total number of incomplete pathways", "Total within 18 weeks", "% within 18 weeks", "Average (median) waiting time (in weeks)", "92nd percentile waiting time (in weeks)", "Total 52 plus weeks", "Total 78 plus weeks", "Total 65 plus weeks"];
const row = (code, tf, total, w18, med, p92, w52, w65 = 0) => [null, "Y56", code, `${code} NHS TRUST`, "C_999", tf, 10, total, w18, w18 / total, med, p92, w52, 0, w65];
const rows = [[null, "Period:", "September 2026"], [], head, row("R1H", "General Surgery Service", 100, 50, 10, 30, 1), row("R1H", "Total", 123493, 79731, 12.6164, 37.6957, 1097, 149), row("RA7", "Total", 50000, 40000, 9.04, 30.2, 10, 0), row("", "Total", 5, 5, 1, 1, 0)];

describe("RTT waits", () => {
  it("finds the header row and the columns by name", () => {
    expect(headerIndex(rows).at).toBe(2);
    expect(headerIndex([[1, 2]])).toBeNull();
  });
  it("keeps only each trust's Total row, with the share under 18 weeks worked out", () => {
    const t = totalsFrom(rows);
    expect(Object.keys(t)).toEqual(["R1H", "RA7"]);
    expect(t.R1H).toEqual({ total: 123493, within18: 79731, pct18: 64.6, median: 12.6, p92: 37.7, w52: 1097, w65: 149 });
  });
  it("sums the trusts that reported for England", () => {
    const n = nationalFrom(totalsFrom(rows));
    expect(n).toMatchObject({ trusts: 2, total: 173493, within18: 119731, pct18: 69, w52: 1107 });
  });
  it("reads the period", () => { expect(periodOf(rows)).toBe("September 2026"); });
  it("returns nothing for a workbook it does not recognise", () => { expect(totalsFrom([[1], [2]])).toEqual({}); });
});
