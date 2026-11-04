import { describe, it, expect } from "vitest";
import { shapeStages } from "./billStages";

describe("shapeStages", () => {
  it("lists the stages in order with their sitting days, oldest first within a stage", () => {
    const items = [
      { description: "2nd reading", house: "Lords", sortOrder: 2, stageSittings: [{ date: "2026-06-01T00:00:00" }] },
      { description: "1st reading", house: "Lords", sortOrder: 1, stageSittings: [{ date: "2026-05-14T00:00:00" }] },
      { description: "Committee stage", house: "Lords", sortOrder: 3, stageSittings: [{ date: "2026-06-17T00:00:00" }, { date: "2026-06-15T00:00:00" }, { date: "2026-06-15T00:00:00" }] },
    ];
    expect(shapeStages(items)).toEqual([
      { house: "Lords", stage: "1st reading", dates: ["2026-05-14"] },
      { house: "Lords", stage: "2nd reading", dates: ["2026-06-01"] },
      { house: "Lords", stage: "Committee stage", dates: ["2026-06-15", "2026-06-17"] },
    ]);
  });
  it("keeps a stage that has no day yet, drops a repeat, and ignores rows without a name or House", () => {
    const items = [
      { description: "3rd reading", house: "Commons", sortOrder: 1, stageSittings: [] },
      { description: "3rd reading", house: "Commons", sortOrder: 2, stageSittings: [] },
      { description: "", house: "Commons", sortOrder: 3 },
      { description: "Report stage", sortOrder: 4 },
    ];
    expect(shapeStages(items)).toEqual([{ house: "Commons", stage: "3rd reading", dates: [] }]);
    expect(shapeStages(null)).toEqual([]);
  });
});
