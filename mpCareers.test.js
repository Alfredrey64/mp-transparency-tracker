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

import { careerDetail, peerRecord, peerDetail } from "./mpCareers.js";

describe("careerDetail", () => {
  const bio = {
    houseMemberships: [{ house: 1, startDate: "2010-05-06T00:00:00", endDate: null }, { house: 1, startDate: "1997-05-01T00:00:00", endDate: "2005-04-11T00:00:00" }],
    representations: [
      { house: 1, name: "Seat B", startDate: "2010-05-06T00:00:00", endDate: null, additionalInfo: "Elected 3 times" },
      { house: 1, name: "Seat A", startDate: "1997-05-01T00:00:00", endDate: "2005-04-11T00:00:00", additionalInfo: "Elected 2 times" },
      { house: 2, name: "Not counted", startDate: "2020-01-01T00:00:00" },
    ],
    partyAffiliations: [{ name: "Labour", startDate: "2010-05-06T00:00:00", endDate: null }, { name: "Conservative", startDate: "1997-05-01T00:00:00", endDate: "2010-01-01T00:00:00" }],
    governmentPosts: [{ name: "Minister", additionalInfo: "Treasury", startDate: "2012-01-01T00:00:00", endDate: "2013-01-01T00:00:00" }],
    oppositionPosts: [{ name: "Shadow", additionalInfo: null, startDate: "2015-01-01T00:00:00", endDate: null }],
    otherPosts: [{ name: "Chair of a party group", startDate: "2001-01-01T00:00:00", endDate: "2002-01-01T00:00:00" }],
    committeeMemberships: [{ name: "Treasury Committee", startDate: "2011-01-01T00:00:00", endDate: null, additionalInfo: "Chair" }],
    electionsContested: [{ name: "Seat C", startDate: "1992-04-09T00:00:00" }],
  };
  const d = careerDetail(bio);
  it("keeps Commons spells and seats, oldest first, with elections won", () => {
    expect(d.h).toEqual([["1997-05-01", "2005-04-11"], ["2010-05-06", null]]);
    expect(d.s).toEqual([["Seat A", "1997-05-01", "2005-04-11", 2], ["Seat B", "2010-05-06", null, 3]]);
  });
  it("keeps parties, posts, committees and lost elections as dated rows", () => {
    expect(d.p).toEqual([["Conservative", "1997-05-01", "2010-01-01"], ["Labour", "2010-05-06", null]]);
    expect(d.g).toEqual([["Minister", "Treasury", "2012-01-01", "2013-01-01"]]);
    expect(d.o).toEqual([["Shadow", null, "2015-01-01", null]]);
    expect(d.x).toEqual([["Chair of a party group", "2001-01-01", "2002-01-01"]]);
    expect(d.c).toEqual([["Treasury Committee", "2011-01-01", null, "Chair"]]);
    expect(d.l).toEqual([["Seat C", "1992-04-09"]]);
  });
  it("copes with an empty biography", () => {
    expect(careerDetail({})).toEqual({ h: [], s: [], p: [], g: [], o: [], x: [], c: [], l: [] });
  });
});

describe("peerRecord", () => {
  it("records a former MP who became a peer", () => {
    const bio = {
      houseMemberships: [{ house: 1, startDate: "1997-05-01T00:00:00", endDate: "2010-05-01T00:00:00" }, { house: 2, startDate: "2011-06-01T00:00:00", endDate: null }],
      representations: [{ house: 1, additionalInfo: "Elected 3 times" }],
      governmentPosts: [{ endDate: "2010-05-01T00:00:00" }, { endDate: null }],
      oppositionPosts: [{}],
      committeeMemberships: [{ house: 2, endDate: null }, { house: 2, endDate: "2015-01-01T00:00:00" }, { house: 1, endDate: null }],
      partyAffiliations: [{ name: "Conservative", startDate: "1997-05-01T00:00:00", endDate: "2020-01-01T00:00:00" }, { name: "Crossbench", startDate: "2020-01-01T00:00:00", endDate: null }],
    };
    expect(peerRecord(bio)).toEqual([2011, 1997, 2010, 3, 2, 1, 1, 2, 1, "Conservative", "s"]);
  });
  it("leaves the MP fields empty for a peer who was never an MP", () => {
    const r = peerRecord({ houseMemberships: [{ house: 2, startDate: "2019-01-01T00:00:00", endDate: null }] });
    expect(r.slice(0, 4)).toEqual([2019, null, null, 0]);
  });
});

describe("peerDetail", () => {
  it("adds Lords spells to the career detail and keeps Commons spells apart", () => {
    const d = peerDetail({
      houseMemberships: [{ house: 1, startDate: "1997-05-01T00:00:00", endDate: "2010-05-01T00:00:00" }, { house: 2, startDate: "2011-06-01T00:00:00", endDate: null }],
      committeeMemberships: [{ name: "Lords committee", startDate: "2012-01-01T00:00:00", endDate: null }],
    });
    expect(d.h).toEqual([["1997-05-01", "2010-05-01"]]);
    expect(d.lords).toEqual([["2011-06-01", null]]);
    expect(d.c).toEqual([["Lords committee", "2012-01-01", null, null]]);
  });
});
