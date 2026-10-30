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

import { removalPlan, PROFILE_TABLES, RECORD_TABLES, readableReason, formerMpRow } from "./mpRoster.js";

describe("removalPlan", () => {
  const rows = [{ id: 1, name: "A", parliament_member_id: 1 }, { id: 2, name: "B", parliament_member_id: 2 }, { id: 3, name: "C", parliament_member_id: 3 }];
  const current = (n) => Array.from({ length: n }, (_, i) => i + 2);

  it("removes the rows that are not on a full list of current MPs", () => {
    const plan = removalPlan(rows, current(650));
    expect(plan.remove.map((r) => r.id)).toEqual([1]);
    expect(plan.reason).toBe("");
  });
  it("removes nobody if the list of current MPs is far too short, which would mean the lookup failed", () => {
    const plan = removalPlan(rows, current(40));
    expect(plan.remove).toEqual([]);
    expect(plan.reason).toMatch(/too few to trust/);
  });
  it("removes nobody if an implausible number appear to have left at once", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: 100 + i, name: `X${i}`, parliament_member_id: 5000 + i }));
    const plan = removalPlan(many, current(650));
    expect(plan.remove).toEqual([]);
    expect(plan.reason).toMatch(/more than 15 at once/);
  });
  it("keeps profile data and records apart, so a record is never deleted with a profile", () => {
    expect(PROFILE_TABLES).toContain("financial_interests");
    expect(RECORD_TABLES).toEqual(expect.arrayContaining(["standards_reports", "ministerial_gifts"]));
    expect(PROFILE_TABLES.filter((t) => RECORD_TABLES.includes(t))).toEqual([]);
  });
});

describe("formerMpRow", () => {
  it("turns a Members API record of someone who has left into a Former MPs row, with a plain reason", () => {
    const row = formerMpRow({ id: 4514, nameDisplayAs: "Sir Keir Starmer", latestParty: { name: "Labour", backgroundColour: "d50000" }, latestHouseMembership: { membershipFrom: "Holborn and St Pancras", membershipEndDate: "2026-09-01T00:00:00", membershipEndReason: "Resignation (Chiltern)" }, thumbnailUrl: "t.jpg" });
    expect(row).toEqual({ parliament_member_id: 4514, name: "Sir Keir Starmer", party: "Labour", party_colour: "d50000", constituency: "Holborn and St Pancras", membership_end_date: "2026-09-01", membership_end_reason: "Resigned", thumbnail_url: "t.jpg" });
  });
  it("is null for someone still sitting, or for no record at all", () => {
    expect(formerMpRow({ id: 1, latestHouseMembership: { membershipEndDate: null } })).toBeNull();
    expect(formerMpRow(null)).toBeNull();
  });
  it("words the reasons plainly", () => {
    expect(readableReason("Resignation (Northstead)")).toBe("Resigned");
    expect(readableReason("Dissolution")).toBe("Did not return at the next election");
    expect(readableReason("Died")).toBe("Died");
    expect(readableReason(null)).toBeNull();
  });
});
