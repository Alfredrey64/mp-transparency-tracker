import { describe, expect, it } from "vitest";
import { B, D, DE, MAP_METRICS, NC, R, RC, TR, V, deathRate, deathsPeakSince, faresVsRpi, fuelShares, lastFullYear, trafficPeak } from "./transport";
import { REGIONS } from "../data/regionMetrics";

describe("transport data", () => {
  it("has traffic by vehicle type adding up and a record for the latest year", () => {
    expect(TR.years[0]).toBe(1949);
    for (const k of ["cars", "vans", "hgv", "motorcycles", "buses", "total"]) expect(TR[k], k).toHaveLength(TR.years.length);
    const i = TR.years.length - 1;
    expect(TR.cars[i] + TR.vans[i] + TR.hgv[i] + TR.motorcycles[i] + TR.buses[i]).toBeCloseTo(TR.total[i], 0);
    expect(trafficPeak().year).toBe(TR.years[i]);
  });
  it("has new car fuel shares adding to 100 and plug-in cars rising", () => {
    const s = fuelShares();
    expect(Object.values(s).reduce((a, v) => a + v, 0)).toBeGreaterThan(99);
    expect(Object.values(s).reduce((a, v) => a + v, 0)).toBeLessThan(101);
    expect(NC.battery.at(-1) / NC.total.at(-1)).toBeGreaterThan(NC.battery[0] / NC.total[0]);
  });
  it("has road conditions as percentages for England and its regions", () => {
    for (const set of [RC.a, RC.bc]) { expect(Object.keys(set)).toContain("england"); for (const [k, v] of Object.entries(set)) if (k !== "years") { expect(v).toHaveLength(set.years.length); for (const x of v) if (x !== null) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(40); } } }
  });
  it("has road deaths from 1926 and a falling rate", () => {
    expect(DE.years[0]).toBe(1926);
    expect(deathsPeakSince().year).toBeGreaterThan(1949);
    const r = deathRate();
    expect(r.values.at(-1)).toBeLessThan(r.values[0] / 10);
  });
  it("has bus journeys for every place with a column, and the series the page draws", () => {
    for (const k of ["england", "london", "outsideLondon", "scotland", "wales", "gb", "east", "ne"]) { expect(B.journeys[k], k).toHaveLength(B.journeys.years.length); expect(B.journeys[k].at(-1), k).toBeGreaterThan(0); }
    expect(B.fares.times).toHaveLength(B.fares.labels.length);
    expect(B.support.england).toHaveLength(B.support.years.length);
  });
  it("has rail series that line up", () => {
    expect(R.journeys.years).toHaveLength(R.journeys.millions.length);
    expect(R.support.years).toHaveLength(R.support.total.length);
    expect(R.fares.years).toHaveLength(R.fares.allTickets.length);
    expect(R.fares.years).toHaveLength(R.fares.rpi.length);
    expect(faresVsRpi().at(0)).toBe(100);
    expect(R.performance.timeTo3.every((v) => v > 70 && v < 100)).toBe(true);
    expect(R.performance.periods[R.performance.years.indexOf(lastFullYear())]).toBe(13);
  });
  it("has a figure for most of the twelve places on every map measure", () => {
    for (const m of MAP_METRICS) {
      const v = m.values();
      const have = REGIONS.filter((r) => typeof v[r.key] === "number").length;
      expect(have, m.id).toBeGreaterThanOrEqual(9);
      expect(m.uk(), m.id).not.toBeNull();
    }
    expect(Object.keys(V.byPlace.plugin)).toHaveLength(12);
    expect(D.population.london).toBeGreaterThan(8e6);
  });
});
