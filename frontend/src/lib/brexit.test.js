import { describe, expect, it } from "vitest";
import { B, EVENTS, MAP_METRICS, NATIONS, bn, euShare, monthLabel, nationYear, quarterLabel, tradeBn, yearAverage } from "./brexit";
import { REFERENDUM, VOTE_BY_REGION } from "../data/brexit";
import { REGIONS } from "../data/regionMetrics";

describe("Brexit chart data", () => {
  it("has regional votes that add up to the UK result and to England's", () => {
    const sum = (f) => Object.values(VOTE_BY_REGION).reduce((a, v) => a + f(v), 0);
    expect(sum((v) => v.leave)).toBe(REFERENDUM.leave);
    expect(sum((v) => v.remain)).toBe(REFERENDUM.remain);
    const english = ["ne", "nw", "yh", "em", "wm", "east", "london", "se", "sw"];
    const l = english.reduce((a, k) => a + VOTE_BY_REGION[k].leave, 0);
    const r = english.reduce((a, k) => a + VOTE_BY_REGION[k].remain, 0);
    expect(Math.round((l / (l + r)) * 1000) / 10).toBe(REFERENDUM.byNation.find((n) => n.name === "England").leave);
    for (const n of ["wales", "scotland", "ni"]) {
      const v = VOTE_BY_REGION[n];
      expect(Math.round((v.leave / (v.leave + v.remain)) * 1000) / 10).toBe(REFERENDUM.byNation.find((x) => x.name === { wales: "Wales", scotland: "Scotland", ni: "Northern Ireland" }[n]).leave);
    }
  });
  it("sets GDP per head to 100 in the quarter of the referendum, for every economy, over the same quarters", () => {
    const g = B.gdp;
    const i = g.quarters.indexOf("2016-Q2");
    expect(i).toBeGreaterThan(0);
    for (const k of Object.keys(g.names)) { expect(g.series[k]).toHaveLength(g.quarters.length); expect(g.series[k][i]).toBe(100); }
    expect(g.times).toHaveLength(g.quarters.length);
    expect(g.series.GBR.at(-1)).toBeLessThan(g.series.G7.at(-1));
    expect(g.series.GBR.at(-1)).toBeGreaterThan(g.series.DEU.at(-1));
  });
  it("keeps the ONS trade series on the same quarters, and the EU share between 0 and 100", () => {
    const t = B.trade;
    for (const k of ["euExports", "nonEuExports", "euImports", "nonEuImports", "times"]) expect(t[k]).toHaveLength(t.quarters.length);
    for (const v of [...euShare("exports"), ...euShare("imports")]) { expect(v).toBeGreaterThan(20); expect(v).toBeLessThan(80); }
    expect(tradeBn().euExports.at(-1)).toBeCloseTo(t.euExports.at(-1) / 1000, 0);
    expect(yearAverage(t.times, euShare("exports"), 2015)).toBeGreaterThan(40);
  });
  it("has migration series of the same length", () => {
    const m = B.migration;
    for (const k of ["net", "arrivals", "departures", "nonEuArrivals", "times"]) expect(m[k]).toHaveLength(m.months.length);
    expect(m.net.at(-1)).toBe(m.arrivals.at(-1) - m.departures.at(-1));
  });
  it("has the four nations' quarterly trade, adding to a believable year", () => {
    const nt = B.nationTrade;
    expect(nt.quarters[0]).toBe("2021 Q1");
    for (const n of NATIONS) { const t = nt.nations[n.key]; for (const k of Object.keys(t)) expect(t[k]).toHaveLength(nt.quarters.length); }
    expect(nationYear("england").euExports).toBeCloseTo(123, 0);
    expect(nationYear("wales").euExports).toBeCloseTo(10.7, 0);
    expect(nationYear("scotland").euExports).toBeCloseTo(16.0, 0);
    expect(nationYear("ni").euExports).toBeCloseTo(7.1, 0);
    expect(nationYear("ni").euShareExports).toBeGreaterThan(60);
  });
  it("has migration for every region and nation, summing near the UK's", () => {
    const m = B.migrationByRegion;
    for (const r of REGIONS) { expect(m.regions[r.key].population).toBeGreaterThan(1e6); expect(m.regions[r.key].net).toBe(m.regions[r.key].arrivals - m.regions[r.key].departures); }
    const net = Object.values(m.regions).reduce((a, r) => a + r.net, 0);
    expect(Math.abs(net - m.uk.net)).toBeLessThan(m.uk.net * 0.02);
  });
  it("gives every map measure a figure for each of the twelve places", () => {
    for (const x of MAP_METRICS) { const v = x.values(); expect(Object.keys(v)).toHaveLength(12); expect(Object.values(v).every((y) => typeof y === "number")).toBe(true); expect(typeof x.uk()).toBe("number"); }
    const leave = MAP_METRICS.find((x) => x.id === "leave").values();
    expect(leave.wm).toBeGreaterThan(59);
    expect(leave.scotland).toBe(38);
    const arrivals = MAP_METRICS.find((x) => x.id === "arrivals").values();
    expect(Object.entries(arrivals).sort((a, b) => b[1] - a[1])[0][0]).toBe("london");
    const net = MAP_METRICS.find((x) => x.id === "net").values();
    expect(Object.entries(net).sort((a, b) => b[1] - a[1]).slice(0, 2).map((e) => e[0])).toEqual(["london", "wm"]);
  });
  it("writes quarters, months and money plainly", () => {
    expect(quarterLabel(2016.25)).toBe("2016 Q2");
    expect(quarterLabel(2021)).toBe("2021 Q1");
    expect(monthLabel(2020 + 5 / 12)).toBe("12 months to June 2020");
    expect(monthLabel(2021)).toBe("12 months to January 2021");
    expect(bn(12.345)).toBe("£12.3bn");
    expect(EVENTS.map((e) => e.t)).toEqual([2016.47, 2020.08, 2021]);
  });
});
