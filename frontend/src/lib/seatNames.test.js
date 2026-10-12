import { describe, it, expect } from "vitest";
import book from "../data/electionSeatNames.json";
import margins from "../data/electionMargins.json";
import hexes from "../data/seatHexes2019.json";
import history from "../data/electionsHistory.json";
import { buildIndex, findSeat, searchSeats, seatTimeline, summarise, result2024 } from "./seatNames";
import { compare } from "./electionCompare";
import { NATIONS, electionSeats } from "../data/devolvedElections";
import { dhondt } from "./dhondt";

const index = buildIndex(book);

describe("seat names", () => {
  it("finds a seat whatever the punctuation or word order", () => {
    expect(findSeat(index, "Aberavon")).toBeGreaterThanOrEqual(0);
    expect(findSeat(index, "ST ALBANS")).toBe(findSeat(index, "St. Albans"));
    expect(findSeat(index, "central newcastle upon tyne")).toBe(findSeat(index, "Newcastle upon Tyne Central"));
    expect(findSeat(index, "No such place")).toBe(-1);
  });

  it("has one winner letter per election for every name", () => {
    book.w.forEach((s) => expect(s).toHaveLength(book.elections.length));
    expect(book.b).toHaveLength(book.w.length);
  });

  it("agrees with the map data for a seat on both", () => {
    const k = history.maps["1997"].w;
    const hex = hexes.hexes.findIndex((h) => h[1] === "Aberavon");
    const i = findSeat(index, "Aberavon");
    expect(book.w[i][book.elections.indexOf("1997")]).toBe(k[hex]);
  });

  it("searches by the start of a name first", () => {
    const hits = searchSeats(book, "hudders");
    expect(hits[0].name).toMatch(/Huddersfield/);
    expect(searchSeats(book, "h")).toEqual([]);
  });

  it("builds a timeline and summarises it", () => {
    const i = findSeat(index, "Aberavon");
    const t = seatTimeline(book, i, { group: "l", band: 5 });
    expect(t.at(-1).id).toBe("2024");
    const s = summarise(t);
    expect(s.changes).toBe(0);
    expect(s.longest.group).toBe("l");
    expect(s.longest.length).toBe(t.length);
  });

  it("reads a 2024 result by name", () => {
    const seats = { x: { name: "Test Seat", result: { isGeneralElection: true, majorityPct: 12, candidates: [{ party: "Labour", share: 0.5 }, { party: "Conservative", share: 0.3 }] } } };
    expect(result2024(seats, "test seat")).toMatchObject({ group: "l", band: 2, runnerUp: "Conservative" });
    expect(result2024(seats, "elsewhere")).toBeNull();
  });
});

describe("comparing elections", () => {
  it("counts seats that changed hands and where they went", () => {
    const a = { w: "llc.", d: [10, 20, -30, null] };
    const b = { w: "clc.", d: [-10, 25, -20, null] };
    const r = compare(a, b);
    expect(r.both).toBe(3);
    expect(r.changed).toHaveLength(1);
    expect(r.flows[0]).toEqual({ from: "l", to: "c", n: 1 });
    expect(r.swingBySeat.get(0)).toBe(-10);
    expect(r.toLabour[0].i).toBe(2);
    expect(r.toConservative[0].i).toBe(0);
  });

  it("finds the huge swings of 1997", () => {
    const a = { w: history.maps["1992"].w, d: margins["1992"] };
    const b = { w: history.maps["1997"].w, d: margins["1997"] };
    const r = compare(a, b);
    expect(r.meanSwing).toBeGreaterThan(8);
    expect(r.changed.length).toBeGreaterThan(100);
  });
});

describe("devolved elections", () => {
  it("add up to the size of each chamber", () => {
    for (const n of NATIONS) for (const e of n.elections) expect(electionSeats(e), `${n.key} ${e.id}`).toBe(e.total ?? n.seats);
  });

  it("only use parties that are in the nation's list", () => {
    for (const n of NATIONS) for (const e of n.elections) for (const k of Object.keys(e.seats)) expect(n.parties, `${n.key} ${e.id} ${k}`).toContain(k);
  });
});

describe("D'Hondt", () => {
  it("shares seats by the highest average", () => {
    expect(dhondt([37, 35.2, 27.8], 5)).toEqual([2, 2, 1]);
    expect(dhondt([100], 3)).toEqual([3]);
    expect(dhondt([60, 40], 10)).toEqual([6, 4]);
  });
});
