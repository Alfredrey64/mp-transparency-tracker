import { describe, it, expect } from "vitest";
import { COMPARE_STORIES } from "./compareStories";
import { ALL_SERIES, refOf } from "./onsSectors";
import { taxRateChoices } from "../lib/taxRateSeries";

// The Compare page lists the tax rates in place of the Taxes and spending series.
const ALL = [...ALL_SERIES.filter((s) => s.sector !== "tax"), ...taxRateChoices()];
const valid = new Set(ALL.map(refOf));
const byRef = new Map(ALL.map((s) => [refOf(s), s]));

describe("compare stories", () => {
  it("have unique ids and plain text", () => {
    expect(new Set(COMPARE_STORIES.map((s) => s.id)).size).toBe(COMPARE_STORIES.length);
    for (const s of COMPARE_STORIES) {
      expect(s.title.length).toBeGreaterThan(5);
      expect(s.blurb.length).toBeGreaterThan(10);
      expect(`${s.title} ${s.blurb}`).not.toMatch(/—|–|→/);
    }
  });
  it("only use measures that exist, and no more than four", () => {
    for (const s of COMPARE_STORIES) {
      expect(s.refs.length).toBeGreaterThanOrEqual(2);
      expect(s.refs.length).toBeLessThanOrEqual(4);
      for (const r of s.refs) expect(valid.has(r), `${s.id}: ${r}`).toBe(true);
    }
  });
  it("only ask for one chart where the measures share a unit", () => {
    for (const s of COMPARE_STORIES.filter((x) => x.mode === "overlay")) {
      const formats = new Set(s.refs.map((r) => byRef.get(r).format));
      const levels = s.refs.every((r) => byRef.get(r).kind === "level");
      expect(formats.size === 1 || levels, s.id).toBe(true);
    }
  });
});
