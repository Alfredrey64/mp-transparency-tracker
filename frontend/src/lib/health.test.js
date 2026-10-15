import { describe, expect, it } from "vitest";
import { COMPARE_MEASURES, H, MAP_METRICS, NATIONAL, NHS_KEYS, NOW, SNAPSHOTS, YEAR_AGO, compareRanking, latest, low, nationalNow, nhsOf, periodText, regionStats, timeText } from "./health";
import { REGIONS } from "../data/regionMetrics";
import { STANDARDS } from "../data/health";

describe("NHS data", () => {
  it("has every national series with matching lengths", () => {
    for (const [k, s] of Object.entries(NATIONAL)) { expect(s.values, k).toHaveLength(s.times.length); expect(s.labels, k).toHaveLength(s.times.length); expect(s.times.every((t) => typeof t === "number"), k).toBe(true); }
    expect(NATIONAL.waitingList.labels[0]).toBe("2007-08");
    expect(latest("within18").value).toBeGreaterThan(40);
    expect(latest("within18").value).toBeLessThan(100);
  });
  it("has four August snapshots, oldest first, each with the seven NHS regions", () => {
    expect(SNAPSHOTS.map((s) => s.year)).toEqual([2023, 2024, 2025, 2026]);
    expect(NOW.year).toBe(2026);
    expect(YEAR_AGO.year).toBe(2025);
    for (const s of SNAPSHOTS) { expect(Object.keys(s.regions).sort()).toEqual([...NHS_KEYS].sort()); }
  });
  it("has regions that add up to England, and sensible shares", () => {
    for (const s of SNAPSHOTS) {
      const sum = (f) => Object.values(s.regions).reduce((a, r) => a + f(r), 0);
      expect(sum((r) => r.pathways)).toBeLessThanOrEqual(s.national.pathways + 5);
      expect(sum((r) => r.pathways)).toBeGreaterThan(s.national.pathways * 0.95);
      expect(sum((r) => r.over52)).toBeGreaterThan(s.national.over52 * 0.95);
      for (const r of Object.values(s.regions)) { expect(r.within18).toBeLessThan(r.pathways); expect(r.median).toBeGreaterThan(5); }
    }
    expect(nationalNow().pct18).toBeCloseTo((NOW.national.within18 / NOW.national.pathways) * 100, 1);
  });
  it("has the regional population, summing to about England's", () => {
    const total = Object.values(H.population).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(57e6);
    expect(total).toBeLessThan(60e6);
    expect(regionStats(NOW, "london").per1000).toBeGreaterThan(80);
  });
  it("maps ITL regions to NHS regions for England only", () => {
    expect(nhsOf("london")).toBe("london");
    expect(nhsOf("ne")).toBe("neyh");
    expect(nhsOf("yh")).toBe("neyh");
    expect(nhsOf("em")).toBe("midlands");
    expect(nhsOf("wales")).toBeNull();
    expect(nhsOf("scotland")).toBeNull();
  });
  it("gives every map measure a figure for England's regions and blanks elsewhere", () => {
    for (const m of MAP_METRICS) {
      const v = m.values();
      expect(Object.keys(v)).toHaveLength(12);
      for (const r of REGIONS) { if (["wales", "scotland", "ni"].includes(r.key)) expect(v[r.key], `${m.id} ${r.key}`).toBeNull(); else expect(typeof v[r.key], `${m.id} ${r.key}`).toBe("number"); }
      expect(typeof m.uk()).toBe("number");
    }
  });
  it("has international figures with the UK in them", () => {
    for (const k of Object.keys(COMPARE_MEASURES)) { const r = compareRanking(k); expect(r.some((x) => x.code === "GBR"), k).toBe(true); for (let i = 1; i < r.length; i += 1) expect(r[i - 1].value).toBeGreaterThanOrEqual(r[i].value); }
    expect(H.compare.USA.spendGdp.value).toBeGreaterThan(H.compare.GBR.spendGdp.value);
  });
  it("writes periods plainly and has standards in order", () => {
    expect(periodText("2026-07")).toBe("July 2026");
    expect(periodText("2026-Q2")).toBe("April to June 2026");
    expect(timeText("waitingList")(NATIONAL.waitingList.times.at(-1))).toBe(periodText(NATIONAL.waitingList.labels.at(-1)));
    expect(low("waitingList").value).toBeLessThan(latest("waitingList").value);
    expect(STANDARDS.rtt18.value).toBe(92);
    expect(STANDARDS.ae4.value).toBe(95);
  });
});
