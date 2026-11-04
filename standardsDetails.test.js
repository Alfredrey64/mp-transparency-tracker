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

  describe("the older layout, with no Introduction heading", () => {
    const older = (body) => ["Contents", "Report 3", "Appendix: Memorandum 6", "Summary 6", "Report", ...body, "Appendix: Memorandum", "Summary", "This memorandum reports on an inquiry."];
    const BODY = [
      "1. This report arises from an investigation by the Parliamentary Commissioner for Standards (PCS) into whether the Rt Hon.",
      "Jo Smith MP had breached paragraph 13 of the 2023 Code of Conduct, relating to confidentiality.",
      "2. The Commissioner opened his investigation on 1 August 2023.",
      "The Commissioner has given his opinion that, based on the evidence, Mr Smith gave a statement and therefore breached Rule 13 of the Code.",
      "Recommendation",
      "We recommend that Mr Smith apologise to the House.",
    ];
    it("reads what the Commissioner looked at from the report's opening and what he found from his opinion, without splitting at an abbreviation", () => {
      expect(whatHappened(older(BODY))).toBe("The Parliamentary Commissioner for Standards investigated whether the Rt Hon. Jo Smith MP had breached paragraph 13 of the 2023 Code of Conduct, relating to confidentiality. The Commissioner has given his opinion that, based on the evidence, Mr Smith gave a statement and therefore breached Rule 13 of the Code.");
      expect(standardsDetail(older(BODY))?.sanction).toBe("We recommend that Mr Smith apologise to the House.");
    });
    it("gives nothing when the opinion sentence is missing or leans on another sentence", () => {
      expect(whatHappened(older(BODY.filter((l) => !l.startsWith("The Commissioner has given")) ))).toBe("");
      expect(outcome(older(["1. x.", "However, we recommend that he apologise."]))).toBe("");
    });
  });
});
