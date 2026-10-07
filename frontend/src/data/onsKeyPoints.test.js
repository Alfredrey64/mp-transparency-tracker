import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { KEY_POINTS } from "./onsKeyPoints";
import { SECTORS } from "./onsSectors";
import { resolveSeries } from "../lib/onsData";
import { fillKeyPoint, keyPointText } from "../lib/onsKeyPoints";

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "ons");

describe("key points", () => {
  it("has some for every sector that draws its own cards", () => {
    for (const sector of SECTORS.filter((s) => !s.custom)) expect(KEY_POINTS[sector.key]?.length, sector.key).toBeGreaterThanOrEqual(2);
  });

  it("fills every template from the saved figures, leaving no gaps", () => {
    for (const [key, list] of Object.entries(KEY_POINTS)) {
      const sector = SECTORS.find((s) => s.key === key);
      expect(sector, key).toBeTruthy();
      const series = resolveSeries(sector, JSON.parse(fs.readFileSync(path.join(dir, `${key}.json`), "utf8")));
      for (const item of list) {
        const found = series[item.series];
        expect(found, `${key}/${item.series}`).toBeTruthy();
        const parts = fillKeyPoint(item.text, found.def, found.points);
        expect(parts, `${key}/${item.series}`).not.toBeNull();
        const text = keyPointText(parts);
        expect(text, `${key}/${item.series}`).not.toMatch(/[{}]|undefined|NaN|null/);
        expect(text.length, `${key}/${item.series}`).toBeLessThan(230);
      }
    }
  });

  it("sets the figures in bold and gives up on a series with no data", () => {
    const def = { format: "pct", kind: "rate" };
    const parts = fillKeyPoint("It is {value} {when}.", def, [["2025-07", 3], ["2026-07", 4]]);
    expect(parts.map((p) => [p.text, p.strong])).toEqual([["It is ", false], ["4.0%", true], [" ", false], ["in July 2026", false], [".", false]]);
    expect(fillKeyPoint("{value}", def, [])).toBeNull();
  });
});
