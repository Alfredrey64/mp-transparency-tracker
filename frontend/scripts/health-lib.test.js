import { describe, it, expect } from "vitest";
import { columns, collector, monthOf } from "./health-lib.mjs";
import { parseCells } from "./odsStream.mjs";

const head = ["Location ID", "Location ODS Code", "Location Name", "Care Home?", "Location Type", "Location Primary Inspection Category", "Location Street Address", "Location Post Code", "Service / Population Group", "Domain", "Latest Rating", "Publication Date"];
const col = columns(head);
const row = (id, name, cat, pc, group, domain, rating, date = "20/04/2022") => [id, "X", name, "N", "T", cat, "1 St", pc, group, domain, rating, date];

describe("CQC ratings", () => {
  it("finds the columns by name, and refuses a workbook that lacks one", () => {
    expect(col.rating).toBe(10);
    expect(columns(["a", "b"])).toBeNull();
  });
  it("turns dd/mm/yyyy into a month", () => { expect(monthOf("20/04/2022")).toBe("2022-04"); expect(monthOf("x")).toBe(""); });
  it("collects the overall rating and the five questions for each location", () => {
    const c = collector(col);
    const domains = [["Safe", "Good"], ["Effective", "Outstanding"], ["Caring", "Good"], ["Responsive", "Requires improvement"], ["Well-led", "Inadequate"], ["Overall", "Good"]];
    for (const [d, r] of domains) c.add(row("1-1", "Henley House", "Residential social care", "ip1 6tb", "Overall", d, r));
    expect(c.records()).toEqual([{ i: "1-1", n: "Henley House", t: "CH", pc: "IP1 6TB", o: "G", q: "GOGRI", d: "2022-04" }]);
  });
  it("ignores service-level rows, homecare, dentists and locations with no overall rating", () => {
    const c = collector(col);
    c.add(row("2", "A", "Residential social care", "A1 1AA", "Care Homes", "Overall", "Good"));
    c.add(row("3", "B", "Community based adult social care services", "A1 1AA", "Overall", "Overall", "Good"));
    c.add(row("4", "C", "Dentists", "A1 1AA", "Overall", "Overall", "Not applicable"));
    c.add(row("5", "D", "GP Practices", "A1 1AA", "Overall", "Safe", "Good"));
    c.add(row("6", "E", "GP Practices", "A1 1AA", "Overall", "Overall", "Not Rated"));
    expect(c.records()).toEqual([]);
  });
  it("reads cells with repeats and entities", () => {
    const xml = '<table:table-cell office:value-type="string"><text:p>A &amp; B</text:p></table:table-cell><table:table-cell table:number-columns-repeated="2" office:value-type="string"><text:p>-</text:p></table:table-cell><table:table-cell office:value-type="float" office:value="3"><text:p>3</text:p></table:table-cell><table:table-cell table:number-columns-repeated="500"/>';
    expect(parseCells(xml)).toEqual(["A & B", "-", "-", 3]);
  });
});
