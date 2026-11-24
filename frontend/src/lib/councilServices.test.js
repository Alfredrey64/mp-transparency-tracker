import { describe, it, expect } from "vitest";
import { roadRows, flyTippingRow, roadYear, repairRows } from "./councilServices";

const data = {
  roads: { years: [2022, 2023, 2024, 2025, 2026], england: { a: [3, 4, 4, 4, 4], bc: [6, 6, 6, 7, 6], u: [16, 16, 17, 17, 16] }, councils: { X: { a: [4, 3, 3, 3, 3], bc: [null, null, null, null, null], u: [null, 23, 17, 11, 8] } } },
  flyTipping: { year: "2024/25", before: "2023/24", councils: { Y: { t: 1100, p: 1000 }, Z: { t: 5, p: null } } },
};

describe("council services", () => {
  it("gives each road kind with a figure, with England's and the change since the first year held", () => {
    const rows = roadRows(data, "X");
    expect(rows.map((r) => r.key)).toEqual(["a", "u"]);
    expect(rows[0]).toMatchObject({ value: 3, nat: 4, year: 2026, since: { value: 4, year: 2022 } });
    expect(rows[1]).toMatchObject({ value: 8, nat: 16, since: { value: 23, year: 2023 } });
  });
  it("gives nothing for an authority with no figures", () => { expect(roadRows(data, "none")).toEqual([]); });
  it("works out the change in fly-tipping incidents", () => {
    expect(flyTippingRow(data, "Y")).toMatchObject({ total: 1100, previous: 1000, change: 10, year: "2024/25" });
    expect(flyTippingRow(data, "Z").change).toBeNull();
    expect(flyTippingRow(data, "none")).toBeNull();
  });
  it("labels a financial year ending", () => { expect(roadYear(2026)).toBe("2025/26"); });
  it("gives the repair work for an authority, with England's average, and leaves out a kind it has no figure for", () => {
    const d = { repairs: { year: 2026, england: { a: 6.9, o: 3 }, councils: { X: { a: [957, 0, 6.5, 4.7, 11.2], o: null } } } };
    const r = repairRows(d, "X");
    expect(r.year).toBe(2026);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ key: "a", total: 11.2, resurfacing: 6.5, preservation: 4.7, nat: 6.9 });
    expect(repairRows(d, "none")).toBeNull();
    expect(repairRows({}, "X")).toBeNull();
  });
});
