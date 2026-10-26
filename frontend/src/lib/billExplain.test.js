import { describe, it, expect } from "vitest";
import { explainStage, whoItAffects } from "./billExplain";
import { BILL_CATEGORIES } from "./bills";

describe("bill explainer", () => {
  it("explains each stage Parliament uses, and what comes next", () => {
    for (const stage of ["1st reading", "2nd reading", "Committee stage", "Report stage", "3rd reading", "Consideration of Lords amendments", "Royal Assent"]) {
      const e = explainStage(stage);
      expect(e, stage).toBeTruthy();
      expect(e.means.length).toBeGreaterThan(20);
      expect(e.next.length).toBeGreaterThan(10);
    }
    expect(explainStage("Committee stage").next).toMatch(/Report stage/);
  });
  it("treats a bill that has become law or been defeated as such, whatever its last stage says", () => {
    expect(explainStage("3rd reading", { isAct: true }).means).toMatch(/law/);
    expect(explainStage("Report stage", { isDefeated: true }).means).toMatch(/voted down/);
  });
  it("says nothing rather than guess at an unknown stage", () => {
    expect(explainStage("Order of Council")).toBeNull();
    expect(explainStage(null)).toBeNull();
  });
  it("says who a bill from each department's area affects", () => {
    for (const c of BILL_CATEGORIES) expect(whoItAffects(c.label), c.label).not.toMatch(/depends on the detail/);
    expect(whoItAffects("General")).toMatch(/depends/);
  });
});
