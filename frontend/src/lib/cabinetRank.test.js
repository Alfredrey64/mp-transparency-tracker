import { describe, expect, it } from "vitest";
import { rankOf, headOf, bySeniority } from "./cabinetRank";

const m = (name, cabinet_role) => ({ name, cabinet_role });

describe("who leads a department", () => {
  it("is the Chancellor, not the Chief Secretary, at the Treasury, whichever comes first in the list", () => {
    const chief = m("Chief", "Chief Secretary to the Treasury");
    const chancellor = m("Chancellor", "Chancellor of the Exchequer");
    expect(headOf([chief, chancellor])).toBe(chancellor);
    expect(headOf([chancellor, chief])).toBe(chancellor);
  });
  it("is the Home Secretary rather than the Lord Chancellor in Home Office & Justice", () => {
    expect(headOf([m("Lord", "Lord Chancellor and Secretary of State for Justice"), m("Home", "Home Secretary")]).name).toBe("Home");
  });
  it("is a Secretary of State over any minister, and null for nobody", () => {
    expect(headOf([m("Min", "Minister of State"), m("Sec", "Secretary of State for Health")]).name).toBe("Sec");
    expect(headOf([])).toBeNull();
  });
  it("keeps the incoming order for equals", () => {
    expect(bySeniority([m("A", "Secretary of State for X"), m("B", "Secretary of State for Y")]).map((p) => p.name)).toEqual(["A", "B"]);
  });
  it("ranks roles", () => {
    expect([rankOf("Prime Minister and First Lord of the Treasury"), rankOf("Foreign Secretary"), rankOf("Minister of State"), rankOf("Parliamentary Under-Secretary"), rankOf(null)]).toEqual([0, 1, 2, 3, 4]);
  });
});
