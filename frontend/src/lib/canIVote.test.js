import { describe, it, expect } from "vitest";
import { canIVote } from "./canIVote";

const by = (rows, key) => rows.find((r) => r.key === key);

describe("canIVote", () => {
  it("lets a British adult vote in everything", () => {
    for (const nation of ["england", "scotland", "wales", "ni"]) {
      const rows = canIVote({ age: "adult", nation, citizenship: "british-irish" });
      expect(rows.every((r) => r.result === "yes"), nation).toBe(true);
    }
  });
  it("only shows a devolved parliament where there is one", () => {
    expect(by(canIVote({ age: "adult", nation: "england", citizenship: "british-irish" }), "devolved")).toBeUndefined();
    expect(by(canIVote({ age: "adult", nation: "wales", citizenship: "british-irish" }), "devolved").label).toMatch(/Senedd/);
  });
  it("lets 16 and 17 year olds vote in Scotland and Wales, but not for the general election", () => {
    const s = canIVote({ age: "teen", nation: "scotland", citizenship: "british-irish" });
    expect(by(s, "general").result).toBe("no");
    expect(by(s, "devolved").result).toBe("yes");
    expect(by(s, "local").result).toBe("yes");
    const e = canIVote({ age: "teen", nation: "england", citizenship: "british-irish" });
    expect(by(e, "local").result).toBe("no");
  });
  it("lets legal residents of any nationality vote in Scottish and Welsh elections, but not the general election", () => {
    const rows = canIVote({ age: "adult", nation: "scotland", citizenship: "other" });
    expect(by(rows, "general").result).toBe("no");
    expect(by(rows, "devolved").result).toBe("yes");
    expect(by(rows, "local").result).toBe("yes");
  });
  it("is cautious about EU citizens in English council elections", () => {
    expect(by(canIVote({ age: "adult", nation: "england", citizenship: "eu" }), "local").result).toBe("check");
  });
  it("explains the rule for Commonwealth citizens and for under 16s", () => {
    expect(by(canIVote({ age: "adult", nation: "england", citizenship: "commonwealth" }), "general").note).toMatch(/permission/);
    for (const r of canIVote({ age: "child", nation: "england", citizenship: "british-irish" })) expect(r.result).toBe("no");
  });
  it("never uses dashes or arrows in its wording", () => {
    for (const age of ["adult", "teen", "child"]) for (const nation of ["england", "scotland", "wales", "ni"]) for (const citizenship of ["british-irish", "commonwealth", "eu", "other"]) {
      for (const r of canIVote({ age, nation, citizenship })) expect(`${r.label} ${r.note}`, `${age} ${nation} ${citizenship}`).not.toMatch(/—|–|→/);
    }
  });
});
