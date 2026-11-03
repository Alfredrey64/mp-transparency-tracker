import { describe, it, expect } from "vitest";
import { thirdPerson, whatHappened, outcome, standardsDetail } from "./standardsDetails.js";

const report = (summary, body) => [
  "Contents", "Introduction 1", "Summary 3", "\f",
  "Introduction", ...body, "\f",
  "Appendix: Memorandum from the Parliamentary Commissioner for Standards",
  "Summary", ...summary, "Daniel Greenberg CB", "Parliamentary Commissioner for Standards", "1 January 2026", "\f", "Report", "1. Background",
];

const SUMMARY = [
  "This memorandum reports on the inquiry that I commenced on 15 September 2025.",
  "My inquiry focused on whether Mr Smith failed to register a gift.",
  "Having considered the evidence, I am of the view that Mr Smith breached Rule 5 of the Code of Conduct.",
  "I am therefore referring this matter to the Committee on Standards.",
];

describe("standardsDetails", () => {
  it("turns the Commissioner's first person into the third", () => {
    expect(thirdPerson("Having considered the evidence, I am of the view that Mr Smith breached Rule 5.")).toBe("The Commissioner found that Mr Smith breached Rule 5.");
    expect(thirdPerson("My inquiry focused on a letter to me.")).toBe("The inquiry focused on a letter to the Commissioner.");
  });

  it("takes what the Commissioner looked at and found, in the report's own words", () => {
    expect(whatHappened(report(SUMMARY, ["x."]))).toBe("The inquiry focused on whether Mr Smith failed to register a gift. The Commissioner found that Mr Smith breached Rule 5 of the Code of Conduct.");
  });

  it("takes the Committee's own recommendation, without the side heading or a what-if", () => {
    const body = ["Had he remained a Member, we should have been minded to recommend a suspension.", "recommendation We recommend that Mr Smith apologise to the House."];
    expect(outcome(report(SUMMARY, body))).toBe("We recommend that Mr Smith apologise to the House.");
  });

  it("gives nothing when the report has no finding or no recommendation", () => {
    expect(whatHappened(report(["This memorandum reports on an inquiry."], ["x."]))).toBe("");
    expect(standardsDetail(report(SUMMARY, ["The Committee met."]))).toBeNull();
    expect(standardsDetail(report(SUMMARY, ["We recommend no further action in this case."]))).toEqual({ offence: expect.stringContaining("breached Rule 5"), sanction: "We recommend no further action in this case." });
  });
});
