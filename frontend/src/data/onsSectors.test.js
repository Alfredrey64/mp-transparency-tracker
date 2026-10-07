import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SECTORS, SECTOR_KEYS, sectorSeries } from "./onsSectors";
import { SECTIONS } from "./sidebarSections";
import { PAGE_GUIDES } from "./pageGuides";

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "ons");

describe("Britain in numbers sectors", () => {
  it("has one sidebar page and one page guide per sector", () => {
    const items = SECTIONS.flatMap((s) => s.items.map((i) => i.key));
    for (const key of SECTOR_KEYS) {
      expect(items).toContain(key);
      expect(PAGE_GUIDES[key]).toBeTruthy();
    }
  });

  it("gives every series what the page needs", () => {
    for (const sector of SECTORS) {
      const ids = sector.series.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(sector.series.some((x) => x.headline)).toBe(true);
      for (const def of sectorSeries(sector)) {
        if (def.derive) {
          expect(sector.series.map((x) => x.id)).toContain(def.derive.from);
        } else if (def.hpi) {
          expect(def.hpi.region && def.hpi.field).toBeTruthy();
        } else if (def.table) {
          expect(def.table.match).toBeInstanceOf(RegExp);
        } else {
          expect(def.cdid).toMatch(/^[A-Z0-9]{4,6}$/);
          expect(def.path.startsWith("/")).toBe(true);
        }
        expect(["rate", "level"]).toContain(def.kind);
        expect(def.explain.length).toBeGreaterThan(15);
        expect(def.why.length).toBeGreaterThan(15);
        expect(def.label.length).toBeGreaterThan(2);
      }
    }
  });

  it("only compares places using series that exist", () => {
    for (const sector of SECTORS) {
      const ids = new Set(sectorSeries(sector).map((x) => x.id));
      for (const group of sector.places) {
        for (const id of [...group.members, ...group.defaultOn]) expect(ids.has(id), `${sector.key}/${group.id}/${id}`).toBe(true);
        expect(group.defaultOn.length).toBeLessThanOrEqual(6);
        expect(group.defaultOn.every((id) => group.members.includes(id))).toBe(true);
      }
    }
  });

  it("has saved data for every series the pages show", () => {
    for (const sector of SECTORS) {
      const file = JSON.parse(fs.readFileSync(path.join(dir, `${sector.key}.json`), "utf8"));
      for (const def of sectorSeries(sector).filter((x) => !x.derive)) {
        const s = file.series[def.id];
        expect(s, `${sector.key}/${def.id}`).toBeTruthy();
        expect(s.points.length).toBeGreaterThan(2);
        expect(s.points.every(([p, v]) => typeof p === "string" && Number.isFinite(v))).toBe(true);
      }
    }
  });
});
