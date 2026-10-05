import { describe, it, expect } from "vitest";
import { normSeat, hexPosition, hexPoints, lerpColour, buildCells, boundsOf, MODES, partyKey, regionName, summariseRegion, neighbours, seatRanks } from "./seatMap";

describe("names and positions", () => {
  it("treats punctuation and case as the same seat", () => {
    expect(normSeat("Ashton-under-Lyne")).toBe(normSeat("ashton under lyne"));
    expect(normSeat("Argyll, Bute and South Lochaber")).toBe("argyll bute and south lochaber");
  });
  it("shifts odd rows right and puts higher row numbers further up", () => {
    const even = hexPosition(0, 0, 1);
    const odd = hexPosition(0, 1, 1);
    const negOdd = hexPosition(0, -1, 1);
    expect(odd.x).toBeCloseTo(even.x + Math.sqrt(3) / 2, 5);
    expect(negOdd.x).toBeCloseTo(odd.x, 5);
    expect(odd.y).toBeLessThan(even.y);
    expect(negOdd.y).toBeGreaterThan(even.y);
  });
  it("draws six corners", () => {
    expect(hexPoints(0, 0, 1).split(" ")).toHaveLength(6);
  });
});

describe("colour mixing", () => {
  it("runs from one colour to the other and clamps", () => {
    expect(lerpColour("#000000", "#ffffff", 0)).toBe("#000000");
    expect(lerpColour("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(lerpColour("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(lerpColour("#000000", "#ffffff", 5)).toBe("#ffffff");
  });
});

describe("cells", () => {
  const hexes = [["E1", "Seat-One", 0, 0, "E12"], ["E2", "Seat Two", 1, 0, "E12"], ["E3", "Lonely", 2, 0, null]];
  const seats = {
    "Seat One": { name: "Seat One", result: { majorityPct: 30, majority: 9000, turnoutPct: 60, isGeneralElection: true, outcome: "Lab Gain", candidates: [{ party: "Labour", colour: "d50000" }] } },
    "Seat Two": { name: "Seat Two", result: { majorityPct: 5, turnoutPct: 80, isGeneralElection: true, outcome: "Con Hold", candidates: [{ party: "Conservative", colour: "0063ba" }] } },
  };
  const mps = [
    { id: 1, name: "A", party: "Labour", party_colour: "d50000", constituency: "Seat One", gender: "F" },
    { id: 2, name: "B", party: "Conservative", party_colour: "0063ba", constituency: "Seat Two", gender: "M" },
  ];
  const cells = buildCells(hexes, seats, mps);

  it("joins MPs and results to hexagons by name, however it is punctuated", () => {
    expect(cells[0].mp.name).toBe("A");
    expect(cells[0].result.gain).toBe(true);
    expect(cells[1].result.gain).toBe(false);
    expect(cells[2].mp).toBeNull();
    expect(cells[2].result).toBeNull();
  });
  it("paints each view, with a neutral colour where data is missing", () => {
    const by = Object.fromEntries(MODES.map((m) => [m.key, m]));
    expect(by.party.colour(cells[0])).toBe("#d50000");
    expect(by.party.colour(cells[2])).toBe("#5b6075");
    expect(by.safety.colour(cells[0])).not.toBe(by.safety.colour(cells[1]));
    expect(by.safety.colour(cells[2])).toBe("#5b6075");
    expect(by.gains.colour(cells[0])).toBe("#d50000");
    expect(by.gains.colour(cells[1])).not.toBe("#0063ba");
    expect(by.women.colour(cells[0])).toBe("#E0367A");
    expect(by.turnout.colour(cells[1])).toBe("#0c6b4c");
  });
  it("sizes the picture to fit every hexagon and lists parties by seats", () => {
    const b = boundsOf(cells);
    expect(b.width).toBeGreaterThan(0);
    expect(b.minX).toBeLessThan(cells[0].x);
    expect(partyKey(cells).map((p) => p.party)).toEqual(["Labour", "Conservative", "Unknown"]);
    expect(boundsOf([])).toEqual({ minX: 0, minY: 0, width: 1, height: 1 });
  });
});

describe("regions, neighbours and ranks", () => {
  const hexes = [["A", "A", 0, 0, "E12000007"], ["B", "B", 1, 0, "E12000007"], ["C", "C", 0, 1, "S92000003"], ["D", "D", 5, 5, "S92000003"]];
  const seats = {
    A: { name: "A", petitions: [{ count: 400 }, { count: 100 }], result: { majorityPct: 2, turnoutPct: 70, isGeneralElection: true, outcome: "Lab Gain", candidates: [{ party: "Labour", colour: "d50000" }] } },
    B: { name: "B", result: { majorityPct: 20, turnoutPct: 50, candidates: [{ party: "Conservative", colour: "0063ba" }] } },
    C: { name: "C", result: { majorityPct: 10, turnoutPct: 60, candidates: [{ party: "SNP", colour: "fff685" }] } },
    D: { name: "D", result: { majorityPct: 30, turnoutPct: 40, candidates: [{ party: "SNP", colour: "fff685" }] } },
  };
  const mps = [
    { id: 1, name: "A1", party: "Labour", party_colour: "d50000", constituency: "A", gender: "F", parliament_member_id: 11 },
    { id: 2, name: "B1", party: "Conservative", party_colour: "0063ba", constituency: "B", gender: "M", parliament_member_id: 12 },
  ];
  const cells = buildCells(hexes, seats, mps, 1, { careers: { 11: [2024, 1, 0], 12: [1990, 8, 3] } });
  it("names regions", () => {
    expect(regionName("E12000007")).toBe("London");
    expect(regionName("nope")).toBe("Unknown");
  });
  it("carries career years and petition signatures onto the cells", () => {
    expect(cells[0].mp.first).toBe(2024);
    expect(cells[1].mp.elected).toBe(8);
    expect(cells[0].petitions).toBe(500);
  });
  it("summarises a region, or the whole country", () => {
    const london = summariseRegion(cells, "E12000007");
    expect(london).toMatchObject({ seats: 2, women: 1, marginal: 1, gains: 1 });
    expect(london.avgTurnout).toBe(60);
    expect(london.parties.map((p) => p.party)).toEqual(["Labour", "Conservative"]);
    expect(summariseRegion(cells, null).seats).toBe(4);
  });
  it("finds the seats next door", () => {
    expect(neighbours(cells, cells[0]).map((c) => c.name).sort()).toEqual(["B", "C"]);
    expect(neighbours(cells, cells[3])).toEqual([]);
  });
  it("ranks a seat among all of them", () => {
    expect(seatRanks(cells, cells[0]).closest).toEqual({ rank: 1, of: 4 });
    expect(seatRanks(cells, cells[0]).turnout).toEqual({ rank: 1, of: 4 });
    expect(seatRanks(cells, cells[1]).serving).toEqual({ rank: 1, of: 2 });
  });
  it("paints the new views", () => {
    const by = Object.fromEntries(MODES.map((m) => [m.key, m]));
    expect(by.newmps.colour(cells[0])).toBe("#1FA97C");
    expect(by.newmps.colour(cells[1])).not.toBe("#1FA97C");
    expect(by.time.colour(cells[2])).toBe("#5b6075");
    expect(by.petitions.colour(cells[0])).not.toBe("#5b6075");
    expect(by.rebels.colour(cells[0])).toBe("#5b6075");
    expect(by.rebels.needsVotes).toBe(true);
  });
});
