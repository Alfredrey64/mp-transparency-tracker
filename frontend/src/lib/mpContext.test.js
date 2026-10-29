import { describe, it, expect } from "vitest";
import { debateKind, contributionWords, departmentInfo, questionStatus, connections } from "./mpContext";

describe("debate kinds", () => {
  it("explains the places a debate can be held, and says so plainly for an unknown one", () => {
    expect(debateKind("Westminster Hall").plain).toMatch(/Nothing is voted on/);
    expect(debateKind("Commons Chamber").label).toBe("Commons chamber");
    expect(debateKind("Grand Committee").plain).toMatch(/No votes/);
    expect(debateKind("Something New").label).toBe("Something New");
    expect(debateKind(null).label).toMatch(/sitting/);
  });
  it("words what the MP did from the counts Parliament keeps", () => {
    expect(contributionWords({ speeches: 2, questions: 0, interventions: 0 })).toBe("They made 2 speeches.");
    expect(contributionWords({ speeches: 1, questions: 1, interventions: 3 })).toMatch(/made a speech, asked a question, made 3 interventions/);
    expect(contributionWords({})).toBe("They took part in this debate.");
  });
});

describe("departments and questions", () => {
  it("says what a department does, or nothing for one it does not know", () => {
    expect(departmentInfo("Department for Education")).toMatch(/Schools/);
    expect(departmentInfo("Department of Health and Social Care")).toMatch(/NHS/);
    expect(departmentInfo("Ministry of Fun")).toBeNull();
  });
  it("counts the days an answer took, or has been outstanding", () => {
    expect(questionStatus({ tabled: "2026-10-01", answered: "2026-10-10" }).plain).toBe("Answered after 9 days.");
    expect(questionStatus({ tabled: "2026-10-01", answered: "2026-10-01" }).plain).toBe("Answered the same day.");
    const w = questionStatus({ tabled: "2026-10-01", answered: null }, new Date("2026-10-15T12:00:00Z"));
    expect(w.answered).toBe(false);
    expect(w.plain).toMatch(/after 14 days/);
  });
});

describe("links the records show", () => {
  const base = { seatName: "Torridge and Tavistock", committees: ["Transport Committee"], petitions: ["Hold a UK-wide briefing on climate and nature risks"], sponsored: ["Rural Bus Services Bill"] };
  it("finds a subject that names the constituency", () => {
    expect(connections({ ...base, text: "Planning in Tavistock and Torridge" })[0]).toMatch(/names their constituency/);
  });
  it("finds a tie to a committee, a sponsored bill and a local petition, each only on real shared words", () => {
    expect(connections({ ...base, text: "Rural bus services and transport funding" }).join(" ")).toMatch(/Transport Committee/);
    expect(connections({ ...base, text: "Rural bus services funding" }).join(" ")).toMatch(/Rural Bus Services Bill/);
    expect(connections({ ...base, text: "Climate and nature risks briefing" }).join(" ")).toMatch(/petition/);
  });
  it("finds nothing for an unrelated subject", () => {
    expect(connections({ ...base, text: "Dentistry in Devon" })).toEqual([]);
    expect(connections({ text: "" })).toEqual([]);
  });
});
