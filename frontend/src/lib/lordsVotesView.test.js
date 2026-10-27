import { describe, it, expect } from "vitest";
import { peerRows, partyUnity, mostDivided, governmentDefeats, filterPeers, hexOf, perMonth, regulars } from "./lordsVotesView";

const data = {
  divisions: 10,
  parties: [
    { name: "Labour", colour: "d50000", peers: 5, votes: 40, whipped: 40, against: 2 },
    { name: "Crossbench", colour: "C0C0C0", peers: 9, votes: 30, whipped: 0, against: 0 },
  ],
  peers: { 1: ["Lord A", "Labour", "d50000", "Life peer", 9, 9, 2], 2: ["Baroness B", "Crossbench", "C0C0C0", "Life peer", 4, 0, 0] },
  list: [
    { id: 1, date: "2026-01-01", rebels: 2, govWin: false }, { id: 2, date: "2026-01-02", rebels: 0, govWin: true }, { id: 3, date: "2026-01-03", rebels: 2, govWin: null },
  ],
};

describe("Lords votes view", () => {
  it("adds the # to colours and copes with none", () => { expect(hexOf("d50000")).toBe("#d50000"); expect(hexOf("")).toMatch(/^#/); });
  it("turns the compact peer rows into objects with a share of votes", () => {
    const rows = peerRows(data);
    expect(rows[0]).toMatchObject({ id: "1", name: "Lord A", voted: 9, against: 2, share: 0.9 });
  });
  it("works out unity for whipped parties only", () => {
    const u = partyUnity(data);
    expect(u).toHaveLength(1);
    expect(u[0].unity).toBeCloseTo(0.95);
  });
  it("lists the most divided and the defeats", () => {
    expect(mostDivided(data).map((d) => d.id)).toEqual([3, 1]);
    expect(governmentDefeats(data).map((d) => d.id)).toEqual([1]);
  });
  it("searches, filters and sorts peers", () => {
    const rows = peerRows(data);
    expect(filterPeers(rows, { query: "baro" }).map((p) => p.id)).toEqual(["2"]);
    expect(filterPeers(rows, { party: "Labour" }).map((p) => p.id)).toEqual(["1"]);
    expect(filterPeers(rows, { sort: "fewest" })[0].id).toBe("2");
    expect(filterPeers(rows, { sort: "against" })[0].id).toBe("1");
  });
  it("counts votes in each of the last twelve months", () => {
    const d = { generatedAt: "2026-10-26", list: [{ date: "2026-10-20" }, { date: "2026-10-02" }, { date: "2026-09-15" }, { date: "2025-11-03" }, { date: "2024-01-01" }] };
    const m = perMonth(d);
    expect(m).toHaveLength(12);
    expect(m[11]).toMatchObject({ key: "2026-10", n: 2 });
    expect(m[10].n).toBe(1);
    expect(m[0]).toMatchObject({ key: "2025-11", n: 1 });
  });
  it("counts the peers who vote regularly", () => {
    expect(regulars(peerRows(data), 10)).toBe(2); // 9 of 10 and 4 of 10
    expect(regulars(peerRows(data), 10, 0.5)).toBe(1);
    expect(regulars(peerRows(data), 10, 0.45)).toBe(1);
  });
});
