import { describe, it, expect } from "vitest";
import history from "../data/electionsHistory.json";
import hexes from "../data/seatHexes2019.json";
import { allElections, election2024, outcome, seatTimeline, flatHexPosition } from "./electionHistory";
import { hemicycleDots } from "./hemicycle";

const elections = allElections(history);
const byId = Object.fromEntries(elections.map((e) => [e.id, e]));

describe("election history data", () => {
  it("covers every general election from 1945 to 2024, in order", () => {
    expect(elections.map((e) => e.id)).toEqual(["1945", "1950", "1951", "1955", "1959", "1964", "1966", "1970", "1974a", "1974b", "1979", "1983", "1987", "1992", "1997", "2001", "2005", "2010", "2015", "2017", "2019", "2024"]);
    const dates = elections.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("has seats that add up to the size of the House of Commons", () => {
    for (const e of elections) {
      const sum = Object.values(e.seatsWon).reduce((n, v) => n + v, 0);
      expect(sum, e.id).toBe(e.seats);
    }
  });

  it("matches the published seat totals for the biggest parties", () => {
    // House of Commons Library, with the Speaker counted separately.
    const published = {
      1979: { c: 339, l: 268, d: 11 },
      1983: { c: 397, l: 209, d: 23 },
      1992: { c: 336, l: 271, d: 20 },
      1997: { c: 165, l: 418, d: 46 },
      2005: { c: 198, l: 355, d: 62 },
      2010: { c: 306, l: 258, d: 57 },
      2015: { c: 330, l: 232, d: 8, s: 56 },
      2017: { c: 317, l: 262, d: 12, s: 35 },
      2019: { c: 365, l: 202, d: 11, s: 48 },
      2024: { c: 121, l: 411, d: 72, s: 9, g: 4, u: 5 },
    };
    for (const [id, seats] of Object.entries(published)) {
      for (const [k, n] of Object.entries(seats)) expect(byId[id].seatsWon[k], `${id} ${k}`).toBe(n);
    }
  });

  it("matches the published turnout", () => {
    expect(byId["1945"].turnout).toBe(72.8);
    expect(byId["1997"].turnout).toBe(71.4);
    expect(byId["2001"].turnout).toBe(59.4);
    expect(byId["2024"].turnout).toBe(59.9);
  });

  it("keeps vote shares within 100%", () => {
    for (const e of elections) {
      const total = Object.values(e.voteShare).reduce((n, v) => n + v, 0);
      expect(total, e.id).toBeGreaterThan(98);
      expect(total, e.id).toBeLessThan(102);
    }
  });

  it("describes who won and whether it was a majority", () => {
    expect(byId["1945"]).toMatchObject({ leader: "l", majority: true });
    expect(byId["1974a"]).toMatchObject({ leader: "l", majority: false });
    expect(byId["2010"]).toMatchObject({ leader: "c", majority: false });
    expect(byId["2017"]).toMatchObject({ leader: "c", majority: false });
    expect(byId["2024"]).toMatchObject({ leader: "l", majority: true });
  });

  it("notices when the party with more votes got fewer seats", () => {
    expect(byId["1951"].moreVotesFewerSeats).toBe("l");
    expect(byId["1974a"].moreVotesFewerSeats).toBe("c");
    expect(byId["1997"].moreVotesFewerSeats).toBeNull();
  });

  it("builds the 2024 row from the published table", () => {
    const e = election2024();
    expect(e.seats).toBe(650);
    expect(e.voteShare.l).toBeCloseTo(33.7, 1);
    expect(e.voteShare.u).toBeCloseTo(14.3, 1);
  });
});

describe("seat maps", () => {
  it("has one letter for each of the 650 hexagons", () => {
    expect(hexes.hexes).toHaveLength(650);
    for (const [id, m] of Object.entries(history.maps)) {
      expect(m.w, id).toHaveLength(650);
      expect(m.b, id).toHaveLength(650);
    }
  });

  it("covers every seat from 2010 to 2019", () => {
    for (const id of ["2010", "2015", "2017", "2019"]) expect(history.maps[id].w.includes("."), id).toBe(false);
  });

  it("follows one seat through the elections", () => {
    const i = hexes.hexes.findIndex((h) => h[1] === "Aberavon");
    const line = seatTimeline(i, elections, history.maps);
    expect(line.at(-1)).toMatchObject({ id: "2019", group: "l" });
    expect(line.find((t) => t.id === "1997")).toMatchObject({ group: "l" });
  });

  it("places hexagons without overlap", () => {
    const seen = new Set();
    for (const [, , q, r] of hexes.hexes) {
      const { x, y } = flatHexPosition(q, r, 1);
      const key = `${x.toFixed(2)},${y.toFixed(2)}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });
});

describe("outcome", () => {
  it("handles a hung result", () => {
    const o = outcome({ seats: 650, seatsWon: { c: 300, l: 250, d: 50, x: 50 }, voteShare: { c: 40, l: 35 } });
    expect(o).toMatchObject({ leader: "c", majority: false, needed: 326, shortBy: 26 });
  });
});

describe("half-circle layout", () => {
  it("makes exactly one dot for each seat", () => {
    for (const n of [650, 640, 100, 12]) expect(hemicycleDots(n, n > 400 ? 12 : n > 50 ? 9 : 7)).toHaveLength(n);
  });
});
