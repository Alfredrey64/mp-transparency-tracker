import { describe, it, expect } from "vitest";
import { sectorOf, sectorsIn, SECTORS, NO_SECTOR } from "./sectors";
import { committeeColour } from "./committeeColour";

describe("subject groups", () => {
  it("sorts real titles from the calendar into the group a reader would expect", () => {
    expect(sectorOf({ title: "Health and Social Care (including Topical Questions)" }).key).toBe("health");
    expect(sectorOf({ title: "Armed Forces Bill" }).key).toBe("defence");
    expect(sectorOf({ title: "Finance Bill" }).key).toBe("economy");
    expect(sectorOf({ title: "Railway infrastructure in the South West" }).key).toBe("transport");
    expect(sectorOf({ title: "Government support for upland farming" }).key).toBe("environment");
    expect(sectorOf({ title: "Home Office (including Topical Questions)" }).key).toBe("justice");
    expect(sectorOf({ title: "Northern Ireland" }).key).toBe("nations");
    expect(sectorOf({ title: "Highlighting technical education in secondary schools" }).key).toBe("learning");
  });

  it("reads the inquiry of a committee when its name alone does not say", () => {
    expect(sectorOf({ title: "Liaison Committee", about: "Health and care workforce" }).key).toBe("health");
  });

  it("leaves a title that fits nothing unsorted, and ignores housekeeping words", () => {
    expect(sectorOf({ title: "Prime Minister's Questions" })).toBe(NO_SECTOR);
    expect(sectorOf({ title: "Third Delegated Legislation Committee" })).toBe(NO_SECTOR);
    expect(sectorOf({ title: "Backbench Business Committee", about: "Proposals for backbench debates" })).toBe(NO_SECTOR);
    expect(sectorOf({})).toBe(NO_SECTOR);
    expect(sectorOf({ title: 42 })).toBe(NO_SECTOR);
  });

  it("uses the same colours as the committee reports", () => {
    const colours = new Set(SECTORS.map((s) => s.colour));
    for (const name of ["Treasury Committee", "Health and Social Care Committee", "Transport Committee", "Defence Committee", "Justice Committee", "Education Committee", "Scottish Affairs Committee", "Environmental Audit Committee"]) {
      expect(colours.has(committeeColour(name))).toBe(true);
    }
  });

  it("counts the groups that appear, in a steady order", () => {
    const rows = sectorsIn([{ title: "Health Bill" }, { title: "Finance Bill" }, { title: "Health Committee" }, { title: "Prime Minister's Questions" }]);
    expect(rows.map((r) => `${r.key}:${r.n}`)).toEqual(["health:2", "economy:1", "other:1"]);
  });
});
