import { describe, it, expect } from "vitest";
import { staleRows, staleWarning } from "./mpRoster.js";

const rows = [
  { id: 1, parliament_member_id: 4514, name: "Sir Keir Starmer", constituency: "Holborn and St Pancras" },
  { id: 2, parliament_member_id: 9001, name: "Sagal Abdi-Wali", constituency: "Holborn and St Pancras" },
  { id: 3, parliament_member_id: 3, name: "Someone Else", constituency: "Elsewhere" },
];

describe("MPs who are still in the table after leaving", () => {
  it("finds rows that are not on the current list, whatever type the ids are written in", () => {
    expect(staleRows(rows, [9001, "3"]).map((r) => r.name)).toEqual(["Sir Keir Starmer"]);
  });
  it("finds nothing when every row is current", () => {
    expect(staleRows(rows, [4514, 9001, 3])).toEqual([]);
    expect(staleRows(null, [1])).toEqual([]);
  });
  it("words a warning that names each person and their seat", () => {
    const w = staleWarning(staleRows(rows, [9001, 3]));
    expect(w).toMatch(/^::warning title=/);
    expect(w).toContain("Sir Keir Starmer (Holborn and St Pancras)");
    expect(w).toContain("1 row ");
  });
  it("says nothing when there is nothing to say", () => { expect(staleWarning([])).toBe(""); });
});
