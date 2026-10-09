import { describe, it, expect } from "vitest";
import { explainOffice } from "./officeExplainers";

describe("office explainers", () => {
  it("explains the main posts", () => {
    expect(explainOffice("Chancellor of the Exchequer", "gov").what).toMatch(/taxes and spending/);
    expect(explainOffice("Assistant Whip (HM Treasury)", "gov").what).toMatch(/whip/i);
    expect(explainOffice("Opposition Whip (Commons)", "opp").what).toMatch(/opposition whip/i);
    expect(explainOffice("Baroness in Waiting (HM Household) (Whip)", "gov").what).toMatch(/Lords/);
    expect(explainOffice("Parliamentary Under-Secretary of State (Department of Health)", "gov").what).toMatch(/junior minister/);
  });
  it("explains a shadow post by its counterpart", () => {
    const e = explainOffice("Shadow Secretary of State for Defence", "opp");
    expect(e.what).toMatch(/opposition's counterpart/);
    expect(e.what).toMatch(/armed forces/);
    expect(explainOffice("Liberal Democrat Shadow Attorney General", "opp").what).toMatch(/^For the Liberal Democrat/);
  });
  it("handles a spokesperson and an unknown post", () => {
    expect(explainOffice("Shadow SNP Spokesperson", "opp").what).toMatch(/SNP/);
    for (const kind of ["gov", "opp"]) {
      const e = explainOffice("Zebra Commissioner", kind);
      expect(e.what.length).toBeGreaterThan(20);
      expect(e.why.length).toBeGreaterThan(20);
    }
  });
});
