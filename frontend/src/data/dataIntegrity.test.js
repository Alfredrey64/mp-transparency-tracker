import { describe, it, expect } from "vitest";
import seatsFile from "./constituencies.json";
import summary from "./constituencySummary.json";
import hexFile from "./seatHexes.json";
import councilsFile from "./councilsIndex.json";
import tax from "./councilTaxByCouncil.json";
import census from "./regionalProfile.json";
import depSeats from "./deprivationConstituencies.json";
import depNations from "./deprivationNations.json";
import depAreas from "./deprivation.json";
import { seatKey } from "../lib/constituency";

// Rules every refresh of the saved data has to keep. Each was checked against Parliament's published results, the Members list, the official tax tables and the
// census when it was written; a refresh that breaks one is a mistake in the data, not a change in the world.

const seats = Object.entries(seatsFile.constituencies);

describe("2024 results and by-elections", () => {
  it("has 650 seats, each with a result and an MP, and no MP sitting for two seats", () => {
    expect(seats).toHaveLength(650);
    expect(seats.every(([, s]) => s.result?.candidates?.length >= 2 && s.mp?.name)).toBe(true);
    const mps = seats.map(([, s]) => s.mp.name);
    expect(new Set(mps).size).toBe(mps.length);
  });

  it("states each majority as the winner's votes less the runner-up's, and its share of the votes cast", () => {
    for (const [k, s] of seats) {
      const [a, b] = [...s.result.candidates].sort((x, y) => y.votes - x.votes);
      expect(s.result.majority, k).toBe(a.votes - b.votes);
      expect(Math.abs((s.result.majority / s.result.turnout) * 100 - s.result.majorityPct), k).toBeLessThan(0.05);
      expect(Math.abs((s.result.turnout / s.result.electorate) * 100 - s.result.turnoutPct), k).toBeLessThan(0.05);
    }
  });

  it("lists leading candidates whose votes never add up to more than were cast", () => {
    for (const [k, s] of seats) {
      const sum = s.result.candidates.reduce((n, c) => n + c.votes, 0);
      expect(sum, k).toBeLessThanOrEqual(s.result.turnout);
      expect(s.result.candidates.reduce((n, c) => n + c.share, 0), k).toBeLessThanOrEqual(1.0005);
    }
  });

  it("marks the seats that have voted again since the general election, and only those, as by-elections", () => {
    const again = seats.filter(([, s]) => s.result.isGeneralElection === false);
    expect(again.length).toBeGreaterThanOrEqual(7);
    for (const [k, s] of again) expect(s.result.date > "2024-07-05" && /by-election/i.test(s.result.title), k).toBe(true);
    for (const [k, s] of seats.filter(([, x]) => x.result.isGeneralElection !== false)) expect(s.result.date, k).toBe("2024-07-04");
  });

  it("gives a summary that agrees with the seats", () => {
    const turnouts = seats.map(([, s]) => s.result.turnoutPct);
    expect(Math.abs(turnouts.reduce((a, b) => a + b, 0) / turnouts.length - summary.turnout.average)).toBeLessThan(0.01);
    expect(seats.filter(([, s]) => s.result.candidates[0].share < 0.5)).toHaveLength(summary.wonWithUnderHalf);
  });
});

describe("the hexagon map", () => {
  it("has one hexagon for each seat, none repeated", () => {
    expect(hexFile.hexes).toHaveLength(650);
    expect(new Set(hexFile.hexes.map((h) => h[0])).size).toBe(650);
    const names = new Set(hexFile.hexes.map((h) => seatKey(h[1])));
    expect(seats.every(([k]) => names.has(k))).toBe(true);
  });
});

describe("councils", () => {
  const list = councilsFile.index;
  it("adds each council's seats up to its total, and has no election date more than a fortnight in the past (the data should have been refreshed since)", () => {
    const today = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    for (const c of list) {
      expect(c.seats.reduce((n, [, k]) => n + k, 0), c.name).toBe(c.total);
      for (const [d, n] of c.next) { expect(d >= today, `${c.name} ${d}`).toBe(true); expect(n, c.name).toBeLessThanOrEqual(c.total); }
    }
  });
  it("has one record for each council", () => {
    expect(new Set(list.map((c) => c.id)).size).toBe(list.length);
    expect(new Set(list.map((c) => c.name)).size).toBe(list.length);
  });
});

describe("council tax", () => {
  it("has a bill for each of the 296 authorities in the latest year, within a believable range", () => {
    expect(tax.rows).toHaveLength(296);
    for (const [name, , series] of tax.rows) {
      expect(series, name).toHaveLength(17);
      expect(Number.isFinite(series.at(-1)), name).toBe(true);
      expect(series.at(-1), name).toBeGreaterThan(900);
      expect(series.at(-1), name).toBeLessThan(3500);
    }
  });
  it("never jumps by more than a quarter, or falls by more than a tenth, between years", () => {
    for (const [name, , series] of tax.rows) {
      const known = series.filter(Number.isFinite);
      known.slice(1).forEach((v, i) => { expect(v, `${name} year ${i}`).toBeGreaterThan(known[i] * 0.9); expect(v, `${name} year ${i}`).toBeLessThan(known[i] * 1.25); });
    }
  });
  it("leaves the years before a new council existed empty rather than at zero", () => {
    for (const [name, , series] of tax.rows) for (const v of series) expect(v === null || v > 0, name).toBe(true);
  });
});

describe("census figures by region", () => {
  it("keeps every share between 0 and 100, and the age groups adding to 100", () => {
    for (const cat of census.categories) for (const g of cat.groups) for (const [r, v] of Object.entries(g.values)) if (v !== null) { expect(v, `${g.id} ${r}`).toBeGreaterThanOrEqual(0); expect(v, `${g.id} ${r}`).toBeLessThanOrEqual(100); }
    const age = census.categories.find((c) => c.id === "age");
    const parts = ["under-15", "15-24", "25-44", "45-64", "65-plus"].map((id) => age.groups.find((g) => g.id === id));
    for (const r of Object.keys(parts[0].values)) expect(Math.abs(parts.reduce((n, g) => n + g.values[r], 0) - 100), r).toBeLessThan(0.3);
  });
});

describe("deprivation", () => {
  it("covers every seat in the four nations, 650 in all", () => {
    expect(depSeats.seats.length + depNations.wales.seats.length + depNations.scotland.seats.length + depNations.northernireland.seats.length).toBe(650);
    expect(depSeats.seats).toHaveLength(543);
  });
  it("ranks the 296 council areas of England without a tie", () => {
    expect(depAreas.areas).toHaveLength(296);
    expect(new Set(depAreas.areas.map((a) => a.rank)).size).toBe(296);
  });
});
