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
  it("gives each kind of whip its own text, and says what separates them", () => {
    const names = [
      "Assistant Whip (HM Treasury)", "Opposition Whip (Lords)", "Opposition Whip (Commons)", "Opposition Chief Whip (Commons)", "Shadow Chief Whip (Lords)", "Opposition Pairing Whip (Commons)",
      "Opposition Deputy Chief Whip (Lords)", "Opposition Assistant Whip (Commons)", "Parliamentary Secretary to the Treasury and Chief Whip", "Treasurer of HM Household (Deputy Chief Whip, House of Commons)",
      "Comptroller (HM Household) (Whip, House of Commons)", "Vice Chamberlain (HM Household) (Whip, House of Commons)", "Lord Commissioner (HM Treasury) (Whip)", "Lord in Waiting (HM Household) (Whip)",
      "Lords Spokesperson (HM Treasury) (Whip)", "Chief Whip (House of Lords)", "Captain of the King's Bodyguard of the Yeomen of the Guard (HM Household) (Deputy Chief Whip, House of Lords)",
      "Liberal Democrat Chief Whip", "SNP Chief Whip", "Parliamentary Under Secretary of State (Ministry of Justice) (and Assistant Government Whip)",
    ];
    const texts = names.map((n) => explainOffice(n, /opposition|shadow|liberal|snp/i.test(n) ? "opp" : "gov"));
    // no two of them read the same
    expect(new Set(texts.map((t) => t.what)).size).toBe(names.length);
    expect(new Set(texts.map((t) => t.why)).size).toBeGreaterThanOrEqual(names.length - 4);
    const gov = explainOffice("Assistant Whip (HM Treasury)", "gov");
    const oppLords = explainOffice("Opposition Whip (Lords)", "opp");
    expect(gov.what).toMatch(/junior rank of government whip in the Commons/);
    expect(gov.why).toMatch(/7 Assistant Whips/);
    expect(oppLords.what).toMatch(/not a minister/);
    expect(oppLords.why).toMatch(/Chief Opposition Whip/);
    // a smaller party's chief whip is not described as the government's
    expect(explainOffice("Liberal Democrat Chief Whip", "opp").what).toMatch(/^The Liberal Democrat's chief whip in the House of Commons/);
    expect(explainOffice("Chief Whip (House of Lords)", "gov").what).toMatch(/House of Lords/);
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
