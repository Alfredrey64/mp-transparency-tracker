import { describe, it, expect } from "vitest";
import { parseWarnings, floodNear, LEVELS } from "./floodWarnings";

const items = [
  { floodAreaID: "a", severityLevel: 3, description: "River Avon at Bath", message: "Be prepared.", floodArea: { county: "Somerset" }, timeRaised: "2026-10-30T09:00:00" },
  { floodAreaID: "b", severityLevel: 2, description: "Lower Frome", message: "Act now.", floodArea: { county: "Gloucestershire" } },
  { floodAreaID: "c", severityLevel: 4, description: "Lifted one" },
  { floodAreaID: "d", severityLevel: 9, description: "Nonsense" },
  null,
];

describe("parseWarnings", () => {
  it("keeps the warnings and alerts in force, most serious first, and drops lifted or unknown levels", () => {
    const w = parseWarnings(items);
    expect(w.map((x) => x.area)).toEqual(["Lower Frome", "River Avon at Bath"]);
    expect(w[0]).toMatchObject({ level: 2, county: "Gloucestershire", message: "Act now." });
  });
  it("copes with no list", () => { expect(parseWarnings(undefined)).toEqual([]); expect(parseWarnings([])).toEqual([]); });
  it("describes every level a warning can have", () => { for (const n of [1, 2, 3, 4]) expect(LEVELS[n].label && LEVELS[n].plain).toBeTruthy(); });
});

describe("floodNear", () => {
  it("asks for the point and distance and reads the answer", async () => {
    let asked;
    const out = await floodNear(51.45, -2.58, { dist: 5, fetcher: async (url) => { asked = url; return { ok: true, json: async () => ({ items }) }; } });
    expect(asked).toContain("lat=51.45&long=-2.58&dist=5");
    expect(out).toHaveLength(2);
  });
  it("answers null if the service fails or the point is missing, so the page can say it could not check", async () => {
    expect(await floodNear(51, -2, { fetcher: async () => ({ ok: false }) })).toBeNull();
    expect(await floodNear(51, -2, { fetcher: async () => { throw new Error("offline"); } })).toBeNull();
    expect(await floodNear(NaN, -2)).toBeNull();
  });
});
