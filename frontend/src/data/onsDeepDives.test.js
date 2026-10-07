import { describe, it, expect } from "vitest";
import { ALL_SERIES } from "./onsSectors";
import { DEEP_DIVES } from "./onsDeepDives";

describe("deep dives", () => {
  it("covers every series, and only series that exist", () => {
    const ids = new Set(ALL_SERIES.map((s) => s.id));
    expect(ALL_SERIES.filter((s) => !DEEP_DIVES[s.id]).map((s) => s.id)).toEqual([]);
    expect(Object.keys(DEEP_DIVES).filter((k) => !ids.has(k))).toEqual([]);
  });

  it("has all three explanations, written as sentences", () => {
    for (const [id, d] of Object.entries(DEEP_DIVES)) {
      for (const key of ["how", "causes", "levers"]) {
        expect(d[key], `${id}.${key}`).toMatch(/^[A-Z].{30,}[.)]$/);
      }
    }
  });
});
