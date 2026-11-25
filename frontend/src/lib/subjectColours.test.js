import { describe, it, expect } from "vitest";
import { SUBJECT_COLOUR } from "./subjectColours";
import { SECTORS, NO_SECTOR } from "./sectors";
import { committeeColour } from "./committeeColour";

// One colour for one subject wherever the site shades something by what it is about (Today, What changed, Coming up, committee reports, Ask a question), so a reader who learns
// "red means health" on one page finds the same on the next.
describe("subject colours", () => {
  it("every sector uses the shared colour for its subject", () => {
    const shared = new Set(Object.values(SUBJECT_COLOUR));
    for (const s of [...SECTORS, NO_SECTOR]) expect(shared.has(s.colour), s.label).toBe(true);
  });
  it("committee reports on a subject take the same colour as that subject's sector", () => {
    expect(committeeColour("Health and Social Care Committee")).toBe(SUBJECT_COLOUR.health);
    expect(committeeColour("Defence Committee")).toBe(SUBJECT_COLOUR.defence);
    expect(committeeColour("Transport Committee")).toBe(SUBJECT_COLOUR.transport);
    expect(committeeColour("Environment, Food and Rural Affairs Committee")).toBe(SUBJECT_COLOUR.environment);
  });
  it("no two subjects share a colour", () => {
    const values = Object.values(SUBJECT_COLOUR);
    expect(new Set(values).size).toBe(values.length);
  });
});
