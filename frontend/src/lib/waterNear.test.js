import { describe, it, expect } from "vitest";
import { overflowFrom, summariseOverflows, loadOverflows, nearestBathing } from "./waterNear";

const point = { lat: 51.4545, lon: -2.5879 };
const feat = (id, name, spills, hours, over = {}) => ({
  attributes: { unique_id: id, site_name_ea_condat: name, water_company_name: "Wessex Water", counted_spills_12_24hr_calculated: spills, total_spill_duration_hrs_calculated: hours, edm_operation_percent_calculated: 99.9, receiving_water_environment_common_name_ea_condat: "TRIB OF HORFIELD BROOK VIA SWS", bathing_water: "Not Applicable", has_data: 1, ...over },
  geometry: { x: -2.57, y: 51.49 },
});

describe("sewage overflows", () => {
  it("reads one overflow, tidying its names and rounding its figures", () => {
    const o = overflowFrom(feat("A", "LANDSEER AVENUE CSO", 9, 15.56), point);
    expect(o).toMatchObject({ id: "A", name: "Landseer Avenue CSO", spills: 9, hours: 16, running: 99.9, bathing: "", water: "Tributary of Horfield Brook via SWS" });
    expect(o.miles).toBeGreaterThan(1);
  });
  it("leaves figures empty where the company gave no usable data", () => {
    const o = overflowFrom(feat("B", "X", 0, 0, { has_data: 0 }), point);
    expect(o.spills).toBeNull();
    expect(o.hours).toBeNull();
  });
  it("totals what has data and ranks the busiest", () => {
    const list = [feat("A", "A", 9, 15), feat("B", "B", 0, 0), feat("C", "C", 31, 143), feat("D", "D", 0, 0, { has_data: 0 }), feat("E", "E", 5, 9, { edm_operation_percent_calculated: 60 })].map((f) => overflowFrom(f, point));
    const s = summariseOverflows(list);
    expect(s).toMatchObject({ count: 5, withData: 4, spilled: 3, spills: 45, hours: 167, poorlyMonitored: 1 });
    expect(s.busiest.map((o) => o.id)).toEqual(["C", "A", "E", "B"]);
  });
  it("asks for the latest year, then for the overflows round the point", async () => {
    const urls = [];
    const fetcher = async (url) => {
      urls.push(url);
      if (url.includes("returnDistinctValues")) return { ok: true, json: async () => ({ features: [{ attributes: { annual_return_year: "2024" } }, { attributes: { annual_return_year: "2025" } }] }) };
      return { ok: true, json: async () => ({ features: [feat("A", "A", 2, 4)] }) };
    };
    const r = await loadOverflows(point, 3, fetcher);
    expect(r.year).toBe("2025");
    expect(r.list).toHaveLength(1);
    expect(decodeURIComponent(urls[1])).toContain("annual_return_year='2025'");
  });
  it("throws when the service reports an error", async () => {
    const fetcher = async (url) => (url.includes("returnDistinctValues") ? { ok: true, json: async () => ({ features: [{ attributes: { annual_return_year: "2025" } }] }) } : { ok: true, json: async () => ({ error: { code: 400 } }) });
    await expect(loadOverflows({ lat: 52, lon: -1 }, 3, fetcher)).rejects.toThrow();
  });
});

describe("bathing waters", () => {
  const sites = [{ id: "a", name: "Near", lat: 51.5, lon: -2.6 }, { id: "b", name: "Far", lat: 55, lon: -1 }, { id: "c", name: "Nearer", lat: 51.46, lon: -2.59 }];
  it("returns the nearest within the limit, nearest first", () => {
    expect(nearestBathing(sites, point, 3, 30).map((s) => s.id)).toEqual(["c", "a"]);
  });
});
