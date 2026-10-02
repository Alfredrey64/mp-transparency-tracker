import { describe, it, expect } from "vitest";
import { partyFamily, partyChange, careerRecord } from "./mpCareers.js";

const aff = (name, start, end = null) => ({ name, startDate: `${start}T00:00:00`, endDate: end ? `${end}T00:00:00` : null });

describe("partyFamily", () => {
  it("treats Labour (Co-op) as Labour", () => {
    expect(partyFamily("Labour (Co-op)")).toBe("Labour");
    expect(partyFamily("Conservative")).toBe("Conservative");
    expect(partyFamily(null)).toBe("");
  });
});

describe("partyChange", () => {
  it("spots a switch, ignoring a spell as an independent in between", () => {
    expect(partyChange([aff("Conservative", "2019-12-12", "2024-02-24"), aff("Independent", "2024-02-24", "2024-03-11"), aff("Reform UK", "2024-03-11")])).toEqual({ from: "Conservative", kind: "switch" });
  });
  it("spots an MP who now sits as an independent after leaving a party", () => {
    expect(partyChange([aff("Labour", "2024-07-04", "2026-08-17"), aff("Independent", "2026-08-17")])).toEqual({ from: "Labour", kind: "independent" });
  });
  it("doesn't count a suspension that ended back in the same party, or Co-op, as a change", () => {
    expect(partyChange([aff("Labour", "1987-06-11", "2023-04-23"), aff("Independent", "2023-04-23", "2024-05-28"), aff("Labour", "2024-05-28")])).toBeNull();
    expect(partyChange([aff("Labour", "2015-05-01", "2019-01-01"), aff("Labour (Co-op)", "2019-01-01")])).toBeNull();
    expect(partyChange([aff("Labour", "2024-07-04")])).toBeNull();
    expect(partyChange(undefined)).toBeNull();
  });
  it("reports the most recent party left when there were several", () => {
    expect(partyChange([aff("Labour", "1990-01-01", "2000-01-01"), aff("Liberal Democrat", "2000-01-01", "2010-01-01"), aff("Conservative", "2010-01-01")])).toEqual({ from: "Liberal Democrat", kind: "switch" });
  });
});

describe("careerRecord", () => {
  const bio = {
    houseMemberships: [{ house: 1, name: "Commons", startDate: "2024-07-04T00:00:00" }, { house: 1, name: "Commons", startDate: "1997-05-01T00:00:00" }],
    representations: [{ house: 1, additionalInfo: "Elected 1 time" }, { house: 1, additionalInfo: "Elected 2 times" }, { house: 1, additionalInfo: "Elected 2 times" }],
    governmentPosts: [{ name: "A", endDate: "2010-05-11T00:00:00" }, { name: "B", endDate: null }],
    oppositionPosts: [{}, {}, {}],
    committeeMemberships: [{ endDate: null }, { endDate: "2015-01-01T00:00:00" }],
    electionsContested: [{ house: 1 }, { house: 1 }, { house: 1 }],
    partyAffiliations: [aff("Labour", "1997-05-01")],
  };
  it("pulls out the headline career facts", () => {
    expect(careerRecord(bio)).toEqual([1997, 5, 2, 1, 3, 1, 2, 3, null, null]);
  });
  it("copes with an almost empty biography", () => {
    expect(careerRecord({})).toEqual([null, 0, 0, 0, 0, 0, 0, 0, null, null]);
  });
  it("records a party change with its kind", () => {
    const r = careerRecord({ partyAffiliations: [aff("Labour", "2024-07-04", "2026-08-17"), aff("Independent", "2026-08-17")] });
    expect(r.slice(8)).toEqual(["Labour", "i"]);
  });
});
