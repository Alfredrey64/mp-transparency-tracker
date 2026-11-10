import { describe, it, expect } from "vitest";
import { stageTerm, paceOf } from "./billStagesView";
import { findGlossaryEntry } from "../data/glossaryTerms";

describe("stageTerm", () => {
  it("spells out the numbered readings and leaves other stages as they are", () => {
    expect(stageTerm("1st reading")).toBe("First Reading");
    expect(stageTerm("2nd reading")).toBe("Second Reading");
    expect(stageTerm("3rd reading")).toBe("Third Reading");
    expect(stageTerm("Report stage")).toBe("Report stage");
    expect(stageTerm("Committee stage")).toBe("Committee stage");
  });
  it("gives a glossary entry for the stages a bill goes through most", () => {
    for (const s of ["1st reading", "2nd reading", "Committee stage", "Report stage", "3rd reading", "Royal Assent", "Programme motion", "Carry-over motion"]) {
      expect(findGlossaryEntry(stageTerm(s)), s).not.toBeNull();
    }
  });
});

describe("paceOf", () => {
  const stages = [
    { house: "Unassigned", stage: "Petition", dates: [] },
    { house: "Commons", stage: "1st reading", dates: ["2026-01-10"] },
    { house: "Commons", stage: "2nd reading", dates: ["2026-02-01"] },
    { house: "Commons", stage: "Committee stage", dates: ["2026-03-01", "2026-03-02"] },
    { house: "Commons", stage: "Report stage", dates: [] },
  ];
  it("counts the days from the first recorded day to today for a live bill", () => {
    const p = paceOf(stages, { is_act: false }, "2026-04-11");
    expect(p.start).toBe("2026-01-10");
    expect(p.days).toBe(91);
    expect(p.last).toMatchObject({ stage: "Committee stage", date: "2026-03-02" });
    expect(p.sinceLast).toBe(40);
    expect(p.finished).toBe(false);
  });
  it("counts a finished bill to its last recorded day, not to today", () => {
    const p = paceOf(stages, { is_act: true }, "2027-01-01");
    expect(p.days).toBe(51);
    expect(p.finished).toBe(true);
  });
  it("says nothing when no day is recorded", () => {
    expect(paceOf([{ house: "Commons", stage: "1st reading", dates: [] }], {}, "2026-01-01")).toBeNull();
    expect(paceOf(null, {}, "2026-01-01")).toBeNull();
  });
});
