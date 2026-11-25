import { describe, expect, it } from "vitest";
import { groupOf, summariseAmendments, stagesToAsk, isAmendmentStage, stageKey, isSettled } from "./billAmendments.js";

const am = (decision, party, id = Math.random()) => ({ amendmentId: id, decision, sponsors: [{ isLead: false, party: "Other" }, { isLead: true, party }] });

describe("groupOf", () => {
  it("groups the API's decisions and never drops a new one", () => {
    expect(groupOf("AgreedOnDivision")).toBe("agreed");
    expect(groupOf("NegativedOnDivision")).toBe("rejected");
    expect(groupOf("WithdrawnBeforeDebate")).toBe("withdrawn");
    expect(groupOf("NotMoved")).toBe("notDecided");
    expect(groupOf("QuestionProposed")).toBe("pending");
    expect(groupOf("StoodPart")).toBe("other");
    expect(groupOf("SomethingNew")).toBe("other");
  });
});

describe("summariseAmendments", () => {
  const items = [am("Agreed", "Labour"), am("Agreed", "Labour"), am("Withdrawn", "Conservative"), am("NotMoved", "Liberal Democrat"), am("Disagreed", "Conservative"), am("NoDecision", "Green Party")];
  it("counts decisions and goes by the lead sponsor's party", () => {
    const s = summariseAmendments(items);
    expect(s).toMatchObject({ total: 6, agreed: 2, rejected: 1, withdrawn: 1, notDecided: 1, pending: 1, other: 0 });
    expect(s.parties[0]).toEqual({ party: "Conservative", tabled: 2, agreed: 0 });
    expect(s.parties.find((p) => p.party === "Labour")).toEqual({ party: "Labour", tabled: 2, agreed: 2 });
  });
  it("the groups add up to the total", () => {
    const s = summariseAmendments(items);
    expect(s.agreed + s.rejected + s.withdrawn + s.notDecided + s.pending + s.other).toBe(s.total);
  });
  it("folds the smallest parties into one row and copes with no sponsor", () => {
    const many = Array.from({ length: 8 }, (_, i) => am("Agreed", `Party ${i}`));
    many.push({ amendmentId: 99, decision: "Agreed", sponsors: [] });
    const s = summariseAmendments(many);
    expect(s.parties).toHaveLength(7);
    expect(s.parties.at(-1).party).toBe("Other parties");
    expect(s.parties.reduce((n, p) => n + p.tabled, 0)).toBe(9);
    expect(summariseAmendments([]).total).toBe(0);
    expect(summariseAmendments(undefined).parties).toEqual([]);
  });
});

describe("stagesToAsk", () => {
  const stages = [
    { id: 1, description: "2nd reading", house: "Commons", stageSittings: [{ date: "2026-03-10T00:00:00" }] },
    { id: 2, description: "Committee stage", house: "Commons", stageSittings: [{ date: "2026-03-25T00:00:00" }, { date: "2026-04-14T00:00:00" }] },
    { id: 3, description: "Report stage", house: "Lords", stageSittings: [{ date: "2026-12-01T00:00:00" }] },
    { id: 4, description: "Report stage", house: "Commons", stageSittings: [] },
  ];
  it("asks only about committee and report stages that have already sat", () => {
    expect(stagesToAsk(stages, "2026-11-25")).toEqual([{ id: 2, house: "Commons", stage: "Committee stage", first: "2026-03-25", last: "2026-04-14" }]);
  });
  it("knows which stages take amendments", () => {
    expect(isAmendmentStage("Report stage")).toBe(true);
    expect(isAmendmentStage("Consideration of Lords amendments")).toBe(false);
  });
  it("keys a stage the same way the card does", () => expect(stageKey("Commons", "Report stage", "2026-10-13")).toBe("Commons|Report stage|2026-10-13"));
});

describe("isSettled", () => {
  it("a stage that sat more than 60 days ago is settled", () => {
    expect(isSettled("2026-04-14", "2026-11-25")).toBe(true);
    expect(isSettled("2026-11-10", "2026-11-25")).toBe(false);
    expect(isSettled(undefined, "2026-11-25")).toBe(false);
  });
});
