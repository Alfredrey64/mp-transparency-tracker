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
