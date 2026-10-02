import { describe, it, expect } from "vitest";
import { normaliseConstituencyName, topCandidates, buildResult, indexPetitions } from "./constituencyData.js";

describe("normaliseConstituencyName", () => {
  it("matches the same seat across differently written names", () => {
    expect(normaliseConstituencyName("Bexleyheath & Crayford")).toBe(normaliseConstituencyName("Bexleyheath and Crayford"));
    expect(normaliseConstituencyName("Ynys Môn")).toBe("ynys m n");
    expect(normaliseConstituencyName("  Cities of London  and Westminster ")).toBe("cities of london and westminster");
  });
});

describe("topCandidates", () => {
  const cands = [
    { name: "C", party: { name: "Green", backgroundColour: "6ab023" }, votes: 300, voteShare: 0.1 },
    { name: "A", party: { name: "Labour", backgroundColour: "d50000" }, votes: 900, voteShare: 0.5 },
    { name: "B", party: { name: "Conservative", backgroundColour: "0063ba" }, votes: 600, voteShare: 0.3 },
    { name: "D", party: null, votes: 10, voteShare: 0.01 },
    { name: "E", party: { name: "X" }, votes: null },
  ];
  it("ranks by votes, keeps the top few, and tolerates missing party data", () => {
    expect(topCandidates(cands, 3).map((c) => c.name)).toEqual(["A", "B", "C"]);
    expect(topCandidates(cands, 5).map((c) => c.name)).toEqual(["A", "B", "C", "D"]);
    expect(topCandidates(cands, 5)[3].party).toBe("Unknown");
    expect(topCandidates(undefined)).toEqual([]);
  });
});

describe("buildResult", () => {
  it("turns an API result into majority and turnout percentages", () => {
    const r = buildResult({ electionTitle: "2024 General Election", electionDate: "2024-07-04T00:00:00", isGeneralElection: true, result: "Lab Hold", majority: 2500, turnout: 50000, electorate: 80000, candidates: [] });
    expect(r.majorityPct).toBe(5);
    expect(r.turnoutPct).toBe(62.5);
    expect(r.date).toBe("2024-07-04");
  });
  it("gives nulls rather than NaN when figures are missing", () => {
    const r = buildResult({ result: "Con Hold" });
    expect(r.majorityPct).toBeNull();
    expect(r.turnoutPct).toBeNull();
    expect(buildResult(null)).toBeNull();
  });
});

describe("indexPetitions", () => {
  const petitions = [
    { id: 1, action: "P1", signaturesByConstituency: [{ name: "Alpha", signature_count: 100 }, { name: "Beta & Co", signature_count: 300 }, { name: "Gamma", signature_count: 0 }] },
    { id: 2, action: "P2", signaturesByConstituency: [{ name: "Alpha", signature_count: 900 }, { name: "Beta and Co", signature_count: 50 }] },
  ];
  const idx = indexPetitions(petitions, 2);
  it("lists each seat's most-signed petitions first, with its rank among seats", () => {
    expect(idx.get("alpha").map((p) => [p.id, p.count, p.rank])).toEqual([[2, 900, 1], [1, 100, 2]]);
    expect(idx.get("beta and co").map((p) => [p.id, p.count, p.rank])).toEqual([[1, 300, 1], [2, 50, 2]]);
  });
  it("leaves out seats with no signatures", () => {
    expect(idx.has("gamma")).toBe(false);
  });
  it("caps the list per seat", () => {
    expect(indexPetitions(petitions, 1).get("alpha")).toHaveLength(1);
  });
});

import { summariseConstituencies, toFormerMp, indexFormerMps } from "./constituencyData.js";

const seat = (name, majorityPct, turnoutPct, share, outcome = "Lab Hold", isGeneralElection = true) => ({
  name, mp: { name: `MP ${name}`, party: "Labour", colour: "d50000" },
  result: { majority: Math.round(majorityPct * 100), majorityPct, turnoutPct, outcome, isGeneralElection, candidates: [{ share }] },
});

describe("summariseConstituencies", () => {
  const seats = {
    a: seat("A", 0.5, 60, 0.41, "Con Gain"),
    b: seat("B", 4.9, 70, 0.55),
    c: seat("C", 12, 50, 0.45),
    d: seat("D", 49.9, 40, 0.7),
    e: seat("E", 63, 55, 0.8, "Lab Hold", false),
    f: { name: "F", mp: null, result: null },
  };
  const s = summariseConstituencies(seats);
  it("counts seats with results and bins majorities into five-point steps", () => {
    expect(s.total).toBe(5);
    expect(s.histogram[0].count).toBe(2); // 0.5 and 4.9
    expect(s.histogram[2].count).toBe(1); // 12
    expect(s.histogram[9].count).toBe(1); // 49.9
    expect(s.histogram[10]).toMatchObject({ from: 50, to: null, count: 1 }); // 63 falls in the open-ended 50+ bin
    expect(s.histogram.reduce((a, b) => a + b.count, 0)).toBe(5);
  });
  it("lists the narrowest and biggest majorities", () => {
    expect(s.narrowest.map((x) => x.name).slice(0, 2)).toEqual(["A", "B"]);
    expect(s.biggest[0].name).toBe("E");
  });
  it("summarises turnout and seats won with under half the vote", () => {
    expect(s.turnout.highest).toEqual({ name: "B", pct: 70 });
    expect(s.turnout.lowest).toEqual({ name: "D", pct: 40 });
    expect(s.turnout.median).toBe(55);
    expect(s.wonWithUnderHalf).toBe(2);
    expect(s.ofWhichWithShare).toBe(5);
  });
  it("counts seats that changed hands and by-election results", () => {
    expect(s.changedHandsAtGeneralElection).toBe(1);
    expect(s.decidedAtByElection).toBe(1);
  });
});

describe("former MPs", () => {
  const member = (id, name, seat, end, reason) => ({ id, nameDisplayAs: name, latestParty: { name: "Labour", backgroundColour: "d50000" }, latestHouseMembership: { membershipFrom: seat, membershipStartDate: "1979-05-03T00:00:00", membershipEndDate: end, membershipEndReason: reason } });
  it("keeps the seat, dates and reason", () => {
    expect(toFormerMp(member(1, "A B", "Torfaen", "1987-06-11T00:00:00", "Dissolution"))).toMatchObject({ name: "A B", seat: "Torfaen", start: "1979-05-03", end: "1987-06-11", reason: "Dissolution" });
    expect(toFormerMp({ id: 2, nameDisplayAs: "X" })).toBeNull();
  });
  it("indexes by normalised seat, newest first, and drops seats that no longer exist", () => {
    const idx = indexFormerMps(
      [member(1, "Old", "Bexleyheath & Crayford", "1992-04-09T00:00:00"), member(2, "Newer", "Bexleyheath and Crayford", "2010-05-06T00:00:00"), member(3, "Gone", "Defunct Seat", "1950-01-01T00:00:00")],
      new Set(["bexleyheath and crayford"])
    );
    expect(Object.keys(idx)).toEqual(["bexleyheath and crayford"]);
    expect(idx["bexleyheath and crayford"].map((m) => m.name)).toEqual(["Newer", "Old"]);
    expect(idx["bexleyheath and crayford"][0].seat).toBeUndefined();
  });
});
