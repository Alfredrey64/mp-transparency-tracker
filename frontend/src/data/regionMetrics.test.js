import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { REGIONS, METRICS } from "./regionMetrics";
import { SECTORS, sectorSeries } from "./onsSectors";
import geo from "./regionMap.json";

describe("regions page data", () => {
  it("has a series for every region in every metric, and a UK series to compare with", () => {
    const ids = Object.fromEntries(SECTORS.map((s) => [s.key, new Set(sectorSeries(s).map((x) => x.id))]));
    for (const m of METRICS) {
      for (const r of REGIONS) expect(ids[m.series[r.key].sector]?.has(m.series[r.key].id), `${m.id}/${r.key}`).toBe(true);
      expect(ids[m.uk.sector].has(m.uk.id), `${m.id}/uk`).toBe(true);
    }
  });

  it("has saved figures for those series", () => {
    const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "ons");
    const files = {};
    const file = (k) => (files[k] ??= JSON.parse(fs.readFileSync(path.join(dir, `${k}.json`), "utf8")));
    for (const m of METRICS) {
      for (const r of REGIONS) {
        const ref = m.series[r.key];
        const sector = SECTORS.find((s) => s.key === ref.sector);
        const def = sectorSeries(sector).find((x) => x.id === ref.id);
        // Worked-out series are not saved: their source must be.
        const saved = def.derive ? file(ref.sector).series[def.derive.from] : file(ref.sector).series[ref.id];
        expect(saved?.points?.length, `${m.id}/${r.key}`).toBeGreaterThan(20);
      }
    }
  });

  it("draws every region on the map and lays the tiles out without overlaps", () => {
    expect(geo.regions.map((r) => r.key).sort()).toEqual(REGIONS.map((r) => r.key).sort());
    for (const r of geo.regions) expect(r.d.startsWith("M")).toBe(true);
    const cells = REGIONS.map((r) => r.tile.join(","));
    expect(new Set(cells).size).toBe(REGIONS.length);
  });
});
