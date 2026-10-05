import { describe, it, expect } from "vitest";
import { seatsMeaning, womenMeaning, tenureMeaning, safetyMeaning, lordsMeaning, rebelsMeaning } from "./numbersMeaning";

describe("seatsMeaning", () => {
  it("describes a large working majority", () => {
    const r = seatsMeaning({ top: { party: "Labour", count: 404, pct: 62.2 }, total: 650, majorityLine: 326 });
    expect(r.marker).toBe("A large majority");
    expect(r.text).toContain("404 of 650 seats (62%)");
    expect(r.text).toContain("158 more than every other party combined");
  });
  it("distinguishes a narrow majority and no majority", () => {
    expect(seatsMeaning({ top: { party: "A", count: 340, pct: 52 }, total: 650, majorityLine: 326 }).marker).toBe("A narrow majority");
    const none = seatsMeaning({ top: { party: "A", count: 300, pct: 46 }, total: 650, majorityLine: 326 });
    expect(none.marker).toBe("No majority");
    expect(none.text).toContain("326 are needed");
    expect(seatsMeaning({ top: null, total: 0, majorityLine: 0 })).toBeNull();
  });
});

describe("womenMeaning", () => {
  it("sets the share against the population", () => {
    const r = womenMeaning({ womenPct: 40.9 });
    expect(r.marker).toBe("Below the population share");
    expect(r.text).toContain("40.9% of MPs are women, against about 51% of the UK population");
    expect(womenMeaning({ womenPct: 50 }).marker).toBe("Close to the population share");
    expect(womenMeaning({ womenPct: 60 }).marker).toBe("Above the population share");
    expect(womenMeaning({ womenPct: 35.4, noun: "peers" }).text).toContain("35.4% of peers are women");
  });
});

describe("tenure, safety, Lords and rebels", () => {
  it("describes how new the House is", () => {
    const r = tenureMeaning({ newMps: 353, total: 650, medianYears: 2.2 });
    expect(r.marker).toBe("Many newcomers");
    expect(r.text).toContain("54% of MPs (353)");
    expect(tenureMeaning({ newMps: 50, total: 650, medianYears: 9 }).marker).toBe("Mostly experienced");
  });
  it("describes marginal seats", () => {
    const r = safetyMeaning({ marginal: 115, safe: 213, total: 649 });
    expect(r.marker).toBe("Some marginal seats");
    expect(r.text).toContain("115 seats (18%)");
  });
  it("describes the Lords having no group in control", () => {
    const r = lordsMeaning({ top: { party: "Conservative", count: 253, pct: 31 }, total: 816, majorityLine: 409, crossbench: 161 });
    expect(r.marker).toBe("No group has a majority");
    expect(r.text).toContain("161 crossbench peers");
  });
  it("describes how unusual rebelling is", () => {
    const r = rebelsMeaning({ mpsWhoRebelled: 211, mpsCounted: 628, rebelPct: 2.6 });
    expect(r.marker).toBe("Rebelling is unusual");
    expect(r.text).toContain("66% of MPs (417)");
  });
});
