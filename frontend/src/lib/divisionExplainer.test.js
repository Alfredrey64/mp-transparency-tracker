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
