import { describe, it, expect } from "vitest";
import { SECTOR_PROMISES } from "./onsPromises";
import { pledgeByPromise } from "./promises";
import { SECTORS, sectorSeries } from "./onsSectors";

describe("pledges on the Britain in numbers pages", () => {
  it("only names pledges, pages and series that exist", () => {
    for (const [key, list] of Object.entries(SECTOR_PROMISES)) {
      const sector = SECTORS.find((s) => s.key === key);
      expect(sector, key).toBeTruthy();
      const ids = new Set(sectorSeries(sector).map((x) => x.id));
      for (const item of list) {
        expect(pledgeByPromise(item.promise), `${key}: ${item.promise}`).toBeTruthy();
        if (item.measure) {
          expect(ids.has(item.measure.series), `${key}/${item.measure.series}`).toBe(true);
          expect(["atLeast", "atMost", "peak"]).toContain(item.measure.mode);
          if (item.measure.mode !== "peak") expect(item.measure.target).toBeTypeOf("number");
        }
      }
    }
  });

  it("lists each pledge only once per page", () => {
    for (const [key, list] of Object.entries(SECTOR_PROMISES)) {
      const names = list.map((i) => i.promise);
      expect(new Set(names).size, key).toBe(names.length);
    }
  });
});
