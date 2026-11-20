import { describe, it, expect } from "vitest";
import { buildRoadCasualties, userGroup, CODE_NOW } from "./roadCasualties.js";

const CH = "collision_index,collision_year,local_authority_ons_district";
const YH = "collision_index,casualty_severity,casualty_type,casualty_adjusted_severity_serious";
const YH_OLD = "collision_index,casualty_severity,casualty_type";

describe("userGroup", () => {
  it("groups casualty types", () => {
    expect(userGroup("0")).toBe("walking");
    expect(userGroup("1")).toBe("cycling");
    expect(userGroup("3")).toBe("motorbike");
    expect(userGroup("9")).toBe("vehicle");
    expect(userGroup("22")).toBe("other");
  });
});

describe("buildRoadCasualties", () => {
  const collisions = [CH, "a,2024,E06000023", "b,2025,E06000023", "c,2025,E07000028", "d,2025,EHEATHROW", "e,2025,S12000033"].join("\n");
  const casualties = [YH, "a,3,9,0", "b,1,0,-1", "b,2,1,1", "b,3,9,0", "c,2,2,1", "d,2,9,1", "e,2,9,1", "zzz,1,0,-1"].join("\n");
  const r = buildRoadCasualties(collisions, casualties);
  it("counts by year and severity under the council's current code", () => {
    expect(r.years).toEqual([2024, 2025]);
    expect(r.latest).toBe(2025);
    expect(r.areas.E06000023.by).toEqual({ 2024: [0, 0, 1], 2025: [1, 1, 1] });
    expect(r.areas.E06000063.by[2025]).toEqual([0, 1, 0]); // Carlisle -> Cumberland
    expect(CODE_NOW.E07000028).toBe("E06000063");
  });
  it("splits the latest year's killed or seriously injured by road user", () => {
    expect(r.areas.E06000023.now).toEqual({ walking: 1, cycling: 1, motorbike: 0, vehicle: 0, other: 0 });
    expect(r.areas.E06000063.now.motorbike).toBe(1);
  });
  it("counts serious injuries by the Department's adjusted chance, so the years can be compared", () => {
    const col = [CH, "a,2024,E06000023", "b,2025,E06000023"].join("\n");
    const cas = [YH, "a,2,9,0.25", "a,3,9,0.5", "b,2,9,1", "b,3,9,0"].join("\n");
    const x = buildRoadCasualties(col, cas);
    expect(x.areas.E06000023.by[2024]).toEqual([0, 0.8, 1.3]); // 0.25 + 0.5 serious (rounded to a tenth), the rest slight
    expect(x.areas.E06000023.by[2025]).toEqual([0, 1, 1]);
    expect(x.areas.E06000023.now.vehicle).toBe(1);
  });
  it("falls back on the police's own severity when the file has no adjusted column", () => {
    const x = buildRoadCasualties([CH, "a,2025,E06000023"].join("\n"), [YH_OLD, "a,2,9", "a,3,9"].join("\n"));
    expect(x.areas.E06000023.by[2025]).toEqual([0, 1, 1]);
  });
  it("ignores collisions with no council or casualties with no collision, and totals Great Britain", () => {
    expect(Object.keys(r.areas).sort()).toEqual(["E06000023", "E06000063", "S12000033"]);
    expect(r.gb.by[2025]).toEqual([1, 3, 1]);
  });
  it("refuses files that do not line up", () => {
    expect(() => buildRoadCasualties("a,b\n1,2", casualties)).toThrow();
    expect(() => buildRoadCasualties(collisions, [YH, "q,1,0,-1", "r,1,0,-1", "s,1,0,-1"].join("\n"))).toThrow(/line up/);
  });
});
