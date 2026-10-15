import { describe, expect, it } from "vitest";
import { D, F, G, MAP_METRICS, NAMES, S, fiscalPerHead, functionRows, surplusPlaces } from "./devolution";
import { REGIONS } from "../data/regionMetrics";

const PLACES = ["ne", "nw", "yh", "em", "wm", "east", "london", "se", "sw", "wales", "scotland", "ni"];

describe("devolution data", () => {
  it("has spending per head for the UK, England, three nations and nine regions, with matching lengths", () => {
    for (const k of [...PLACES, "uk", "england"]) { expect(S.perHead[k], k).toHaveLength(S.years.length); expect(S.real[k], k).toHaveLength(S.years.length); expect(S.index[k], k).toHaveLength(S.years.length); expect(S.perHead[k].every((v) => v > 5000), k).toBe(true); }
    expect(S.index.uk.at(-1)).toBe(100);
  });
  it("has spending by function for every place", () => {
    expect(Object.keys(S.functions).length).toBeGreaterThanOrEqual(9);
    for (const f of Object.keys(S.functions)) for (const k of [...PLACES, "england", "uk"]) expect(k in S.functions[f], `${f} ${k}`).toBe(true);
    expect(functionRows("scotland").length).toBeGreaterThan(5);
  });
  it("has the net fiscal balance for every place, with the UK about the sum of the nations", () => {
    for (const k of [...PLACES, "uk", "england"]) expect(F.places[k].balance, k).toHaveLength(F.years.length);
    const sum = ["england", "scotland", "wales", "ni"].reduce((a, k) => a + F.places[k].balance.at(-1), 0);
    expect(Math.abs(sum - F.places.uk.balance.at(-1))).toBeLessThan(F.places.uk.balance.at(-1) * 0.02);
    expect(surplusPlaces()).toContain("london");
    expect(fiscalPerHead("london")).toBeLessThan(0);
  });
  it("has GDP per head, population and growth for every place", () => {
    for (const k of [...PLACES, "uk", "england"]) for (const s of [G.perHead, G.population, G.realPerHead]) expect(s[k], k).toHaveLength(G.years.length);
    expect(G.perHead.london.at(-1)).toBeGreaterThan(G.perHead.ne.at(-1) * 2);
  });
  it("has a value for every place on every map measure", () => {
    for (const m of MAP_METRICS) { const v = m.values(); for (const r of REGIONS) expect(typeof v[r.key], `${m.id} ${r.key}`).toBe("number"); expect(Number.isFinite(m.uk()), m.id).toBe(true); }
    expect(Object.keys(NAMES)).toContain("ni");
    expect(D.built).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
