import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { insertChange, addEvent } from "./add-tax-change.mjs";
import { changedRows, hintFor, readTables } from "./read-budget-rates.mjs";

const series = JSON.parse(readFileSync(fileURLToPath(new URL("../src/data/taxSeries.json", import.meta.url)), "utf8"));
const events = readFileSync(fileURLToPath(new URL("../src/data/taxEvents.js", import.meta.url)), "utf8");

describe("add-tax-change", () => {
  it("adds a change in date order with its announcement date, without touching the input", () => {
    const before = JSON.stringify(series["vat.standard"]);
    const out = insertChange(series, { key: "vat.standard", date: "2027-04-01", value: 21, ann: "2026-10-28" });
    expect(out.problems).toEqual([]);
    expect(out.series["vat.standard"].at(-1)).toEqual(["2027-04-01", 21, { ann: "2026-10-28" }]);
    expect(JSON.stringify(series["vat.standard"])).toBe(before);
  });
  it("sorts a change that lands before later steps", () => {
    const out = insertChange(series, { key: "fuel.petrol", date: "2026-11-01", value: 54.5, ann: "2026-10-28" });
    const dates = out.series["fuel.petrol"].map((r) => r[0]);
    expect(dates).toEqual([...dates].sort());
    expect(dates.indexOf("2026-11-01")).toBeGreaterThan(dates.indexOf("2026-09-01"));
  });
  it("refuses unknown series, bad dates, announcements after the change and duplicate dates", () => {
    expect(insertChange(series, { key: "nope.x", date: "2027-04-01", value: 1 }).problems[0]).toMatch(/no series/);
    expect(insertChange(series, { key: "vat.standard", date: "2027-02-30", value: 1 }).problems[0]).toMatch(/real/);
    expect(insertChange(series, { key: "vat.standard", date: "2027-04-01", value: 21, ann: "2027-05-01" }).problems[0]).toMatch(/announced/);
    expect(insertChange(series, { key: "vat.standard", date: "2011-01-04", value: 25 }).problems[0]).toMatch(/already has/);
    expect(insertChange(series, { key: "vat.standard", date: "2011-01-04", value: 25, replace: true }).problems).toEqual([]);
    expect(insertChange(series, { key: "vat.standard", date: "2027-04-01", value: Number.NaN }).problems[0]).toMatch(/number/);
  });
  it("accepts none for a tax that stops, and warns when the value does not change", () => {
    expect(insertChange(series, { key: "vat.electricity", date: "2027-04-01", value: "none", ann: "2026-10-28" }).series["vat.electricity"].at(-1)[1]).toBeNull();
    expect(insertChange(series, { key: "vat.standard", date: "2027-04-01", value: 20, ann: "2026-10-28" }).notes.join(" ")).toMatch(/not a change/);
  });
  it("adds an event name in date order and replaces an existing one", () => {
    const next = addEvent(events, "2026-10-28", "Autumn Budget 2026");
    expect(next).toMatch(/"2026-07-21": [^\n]+\n {2}"2026-10-28": "Autumn Budget 2026",\n\};/);
    expect(addEvent(next, "2026-10-28", "Autumn Budget 2026, revised")).toMatch(/"2026-10-28": "Autumn Budget 2026, revised",/);
    const mid = addEvent(events, "2018-01-01", "Test");
    expect(mid.indexOf('"2018-01-01"')).toBeGreaterThan(mid.indexOf('"2017-03-08"'));
    expect(mid.indexOf('"2018-01-01"')).toBeLessThan(mid.indexOf('"2018-10-29"'));
  });
});

describe("read-budget-rates", () => {
  const html = `<h3>Income Tax rates</h3><table><thead><tr><th>Main rates</th><th>Tax year 2026 to 2027</th><th>Tax year 2027 to 2028</th></tr></thead><tbody>
    <tr><th>Basic rate</th><td>20%</td><td>21%</td></tr><tr><th>Higher rate</th><td>40%</td><td>40%</td></tr></tbody></table>
    <h3>Other</h3><table><tr><th>Band</th><th>Detail</th><th>Value</th></tr><tr><td>A</td><td>x</td><td>y</td></tr></table>`;
  it("finds the rows that change between the first and last year and ignores tables without years", () => {
    const rows = changedRows(readTables(html));
    expect(rows.map((r) => [r.row, r.changed])).toEqual([["Basic rate", true], ["Higher rate", false]]);
    expect(rows[0]).toMatchObject({ from: "20%", to: "21%", heading: "Income Tax rates" });
  });
  it("suggests the series for known headings", () => {
    expect(hintFor("Income Tax rates", "Basic rate")).toBe("incomeTax.basic");
    expect(hintFor("Corporation Tax rates", "Main rate (companies)")).toBe("corp.main");
    expect(hintFor("Something unrelated", "Row")).toBeNull();
  });
});
