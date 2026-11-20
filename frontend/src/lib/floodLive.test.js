import { describe, it, expect } from "vitest";
import { activeWarnings, riversOf, loadFloods } from "./floodLive.js";

const w = (level, extra = {}) => ({ "@id": `x${level}${Math.random()}`, severityLevel: level, description: `Area ${level}`, floodArea: { riverOrSea: "River Avon", county: "Somerset" }, message: " Be  ready ", timeRaised: "2026-11-19T10:00:00", ...extra });

describe("activeWarnings", () => {
  it("drops lifted warnings and orders by severity then newest", () => {
    const r = activeWarnings([w(3), w(4), w(2, { timeRaised: "2026-11-18T10:00:00" }), w(2, { timeRaised: "2026-11-19T12:00:00" }), w(1)]);
    expect(r.map((x) => x.level)).toEqual([1, 2, 2, 3]);
    expect(r[1].raised).toBe("2026-11-19T12:00:00");
    expect(r[0].message).toBe("Be ready");
  });
  it("copes with nothing", () => { expect(activeWarnings(undefined)).toEqual([]); expect(activeWarnings([])).toEqual([]); });
});

describe("riversOf", () => {
  it("splits combined names and ranks by how many areas", () => {
    expect(riversOf([{ riverOrSea: "Bristol Frome" }, { riverOrSea: "Bristol Frome, Bristol River Avon" }, { riverOrSea: "River Chew" }, { riverOrSea: "" }])).toEqual(["Bristol Frome", "Bristol River Avon", "River Chew"]);
  });
});

describe("loadFloods", () => {
  const reply = (items) => ({ ok: true, json: async () => ({ items }) });
  it("asks for warnings and areas and combines them", async () => {
    const urls = [];
    const r = await loadFloods({ lat: 51.4545, lon: -2.5879 }, {}, async (u) => { urls.push(u); return reply(u.includes("/floodAreas") ? [{ riverOrSea: "River Avon" }] : [w(3)]); });
    expect(urls.some((u) => u.includes("/floods?lat=51.45450&long=-2.58790&dist=10"))).toBe(true);
    expect(r).toMatchObject({ areaCount: 1, rivers: ["River Avon"] });
    expect(r.warnings).toHaveLength(1);
  });
  it("still answers when only the areas lookup fails, but not when the warnings one does", async () => {
    const r = await loadFloods({ lat: 1, lon: 1 }, {}, async (u) => (u.includes("/floodAreas") ? { ok: false, status: 500 } : reply([])));
    expect(r).toMatchObject({ warnings: [], areaCount: null });
    await expect(loadFloods({ lat: 1, lon: 1 }, {}, async () => ({ ok: false, status: 503 }))).rejects.toThrow();
  });
});
