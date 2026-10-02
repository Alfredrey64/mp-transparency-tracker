import { describe, it, expect } from "vitest";
import { explainDivision, describeVote } from "./divisionExplainer";

const kind = (t) => explainDivision(t)?.kind;

describe("explainDivision — real Commons division titles", () => {
  it("recognises the bill stages", () => {
    expect(kind("Terminally Ill Adults (End of Life) Bill: Second Reading")).toBe("second-reading");
    expect(kind("Representation of the People Bill: Third Reading")).toBe("third-reading");
    expect(kind("Immigration and Asylum Bill: Reasoned Amendment to Second Reading")).toBe("reasoned-amendment");
    expect(kind("Social Housing Bill [Lords]: Reasoned Amendment to Second Reading")).toBe("reasoned-amendment");
  });

  it("recognises clauses and amendments, and the stage they happened at", () => {
    const nc = explainDivision("Health Bill: Report Stage: New Clause 142");
    expect(nc.kind).toBe("new-clause");
    expect(nc.plain).toContain("New Clause 142");
    expect(nc.plain).toContain("Report Stage");
    expect(nc.billName).toBe("Health Bill");
    const am = explainDivision("Public Office (Accountability) Bill Report Stage: Amendment 19");
    expect(am.kind).toBe("amendment");
    expect(am.plain).toContain("Amendment 19");
    expect(am.plain).toContain("Report Stage");
    const committee = explainDivision("Taxation (Energy and Vehicles) Bill Committee: New Clause 4");
    expect(committee.plain).toContain("Committee Stage");
  });

  it("treats a Lords amendment as the Commons accepting or rejecting a change", () => {
    const e = explainDivision("National Security (State Threats) Bill: motion to agree to Lords Amendment 1");
    expect(e.kind).toBe("lords-amendment");
    expect(e.plain).toContain("Lords Amendment 1");
    expect(e.ayeMeans).toMatch(/Accepted/);
  });

  it("recognises statutory instruments and codes of practice", () => {
    expect(kind("Draft Carbon Budget Order 2026")).toBe("statutory-instrument");
    expect(kind("Draft Climate Change Act 2008 (Credit Limit) Order 2026")).toBe("statutory-instrument");
    expect(kind(" Draft Employment Tribunal (Extension of Time Limits) (Miscellaneous Amendments and Transitional Provisions) Regulations 2026")).toBe("statutory-instrument");
    expect(kind("Draft Code of Practice on Electronic and Workplace Ballots for Statutory Trade Union Ballots")).toBe("draft-code");
    const si = explainDivision("Draft Carbon Budget Order 2026");
    expect(si.plain).toContain("the Carbon Budget Order");
    expect(si.plain).not.toContain("2026");
  });

  it("recognises Opposition Days and closure motions", () => {
    const opp = explainDivision("Opposition Day: Early release of prisoners");
    expect(opp.kind).toBe("opposition-day");
    expect(opp.topic).toBe("Early release of prisoners");
    expect(kind("Closure motion")).toBe("closure");
  });

  it("recognises procedural motions", () => {
    expect(kind("Motion to sit in private")).toBe("private-sitting");
    expect(kind("Adjournment")).toBe("adjournment");
  });

  it("says what Aye and No meant for each kind", () => {
    const e = explainDivision("Immigration and Asylum Bill: Second Reading");
    expect(describeVote(e, true)).toMatch(/moving on/);
    expect(describeVote(e, false)).toMatch(/stop/i);
    expect(describeVote(e, null)).toBeNull();
  });

  it("is honest about what it can't tell from a title", () => {
    expect(explainDivision("Health Bill: Report Stage: New Clause 6").plain).toMatch(/doesn't say what the clause does/);
    expect(kind("Something completely unrecognised")).toBe("other");
    expect(explainDivision("Something completely unrecognised").plain).toMatch(/doesn't say what sort of motion/);
  });

  it("copes with empty and oddly spaced titles", () => {
    expect(explainDivision("")).toBeNull();
    expect(explainDivision(null)).toBeNull();
    expect(kind("  Health   Bill:   Third   Reading ")).toBe("third-reading");
  });
});

describe("friendly names", () => {
  const h = (title) => explainDivision(title).headline;
  it("replaces procedural labels with what the vote was", () => {
    expect(h("Health Bill: Report Stage: New Clause 142")).toBe("Health Bill: Proposed new section (clause 142) · Report Stage");
    expect(h("Public Office (Accountability) Bill Report Stage: Amendment 19")).toBe("Public Office (Accountability) Bill: Proposed change (amendment 19) · Report Stage");
    expect(h("Terminally Ill Adults (End of Life) Bill: Second Reading")).toBe("Terminally Ill Adults (End of Life) Bill: Second Reading: should the bill go ahead?");
    expect(h("Representation of the People Bill: Third Reading")).toBe("Representation of the People Bill: Final Commons vote on the bill");
    expect(h("National Security (State Threats) Bill: motion to agree to Lords Amendment 1")).toBe("National Security (State Threats) Bill: Lords' change to the bill (amendment 1)");
    expect(h("Taxation (Energy and Vehicles) Bill Committee: New Clause 4")).toContain("Proposed new section (clause 4) · Committee Stage");
  });
  it("names non-bill votes plainly", () => {
    expect(h("Closure motion")).toBe("Vote to end a debate");
    expect(h("Opposition Day: Early release of prisoners")).toBe("Opposition Day debate: Early release of prisoners");
    expect(h("Draft Carbon Budget Order 2026")).toBe("New rules: Carbon Budget Order");
  });
  it("keeps the official title available and falls back to it when unrecognised", () => {
    expect(explainDivision("Health Bill: Third Reading").title).toBe("Health Bill: Third Reading");
    expect(h("Something completely unrecognised")).toBe("Something completely unrecognised");
  });
});
