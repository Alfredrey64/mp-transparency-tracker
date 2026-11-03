import { describe, expect, it } from "vitest";
import { explainEntry } from "./entryExplain";

const CALENDAR = [
  { kind: "debate", h: "C", title: "Powers of the Charity Commission" },
  { kind: "debate", h: "C", where: "Westminster Hall", title: "Access to dental care in the East of England" },
  { kind: "debate", h: "L", where: "Grand Committee", title: "Some order" },
  { kind: "debate", h: "C", title: "Opposition Day (Fifth Allotted Day). Debate on a Motion in the name of the Official Opposition. Subject to be announced" },
  { kind: "debate", h: "C", title: "That leave be given to bring in a Bill under SO No. 23 [details to be provided]." },
  { kind: "debate", h: "C", title: "General Debate on the Nolan principles" },
  { kind: "debate", h: "C", title: "Conclusion of the Budget Debate" },
  { kind: "statement", h: "C", title: "Statement" },
  { kind: "questions", h: "C", title: "HM Treasury (including Topical Questions)" },
  { kind: "questions", h: "C", title: "Prime Minister's Questions" },
  { kind: "questions", h: "C", title: "Business Questions to the Leader of the House" },
  { kind: "questions", h: "L", title: "Autism strategy" },
  { kind: "hearing", h: "C", title: "Science and Technology Committee (Commons)", about: "Neuroscience and digital childhoods" },
  { kind: "billcommittee", h: "C", title: "Highways (Financing) Bill" },
  { kind: "regs", h: "C", where: "General Committee", title: "Second Delegated Legislation Committee" },
  { kind: "regs", h: "L", title: "Some Regulations 2026" },
  { kind: "bill", h: "L", stage: "committee stage (day 2)", title: "Health Bill" },
];
const FEED = ["bill", "vote", "money", "petition", "standards", "election"].map((kind) => ({ past: true, kind, title: kind === "vote" ? "Health Bill: Report Stage: New Clause 142" : "x", detail: "Now at Report stage in the Commons." }));

describe("explainEntry", () => {
  it("gives every kind of entry a label, a what and a does, with no gaps in the wording", () => {
    for (const e of [...CALENDAR, ...FEED]) {
      const x = explainEntry(e);
      expect(x.label, e.title).toBeTruthy();
      expect(x.what.length, e.title).toBeGreaterThan(40);
      expect(x.does.length, e.title).toBeGreaterThan(20);
      expect(`${x.label} ${x.what} ${x.does}`).not.toMatch(/undefined|null|\[object/);
    }
  });
  it("tells a Westminster Hall debate apart: no vote", () => {
    expect(explainEntry(CALENDAR[1]).does).toMatch(/no vote/);
  });
  it("uses the bill's own stage for what happens next", () => {
    const x = explainEntry(CALENDAR[16]);
    expect(x.what).toMatch(/line by line/);
    expect(x.does).toMatch(/Report stage/);
  });
  it("names the department answering questions", () => {
    expect(explainEntry(CALENDAR[8]).what).toMatch(/HM Treasury/);
  });
  it("explains a division from its title", () => {
    expect(explainEntry(FEED[1]).what.length).toBeGreaterThan(40);
  });
  it("falls back to a true general line for a kind it does not know", () => {
    expect(explainEntry({ kind: "mystery", title: "x" }).what).toMatch(/calendar/);
  });
});
