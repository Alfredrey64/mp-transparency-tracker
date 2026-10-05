import { describe, it, expect } from "vitest";
import { councilMeaning, councilChangeMeaning } from "./councilMeaning";

const seat = (short, count, total) => ({ short, count, pct: (count / total) * 100 });

describe("councilMeaning", () => {
  it("says when one party holds a majority, and when it dominates", () => {
    const r = councilMeaning({ seats: [seat("Labour", 40, 57), seat("Green", 17, 57)], total: 57, control: "Labour majority" });
    expect(r.marker).toBe("One party dominates");
    expect(r.text).toContain("Labour holds 40 of 57 seats (70%), more than the 29 needed");
    expect(councilMeaning({ seats: [seat("Labour", 30, 57), seat("Green", 27, 57)], total: 57, control: "Labour majority" }).marker).toBe("One party in control");
  });
  it("says when no party has a majority", () => {
    const r = councilMeaning({ seats: [seat("Conservative", 30, 81), seat("Labour", 28, 81)], total: 81, control: "No overall control" });
    expect(r.marker).toBe("No party in control");
    expect(r.text).toContain("No party has the 41 seats");
    expect(r.text).toContain("deals between parties");
    expect(councilMeaning({ seats: [seat("A", 5, 10), seat("B", 5, 10)], total: 10, control: "A, B (partnership)" }).text).toContain("a partnership of parties");
    expect(councilMeaning({ seats: [], total: 0, control: "" })).toBeNull();
  });
});

describe("councilChangeMeaning", () => {
  const row = (year, total, con, lab, ld = 0, green = 0, ref = 0, other = 0) => ({ year, total, con, lab, ld, green, ukip: 0, ref, pc: 0, snp: 0, other });
  it("names the biggest gain and loss since the first year on record", () => {
    const r = councilChangeMeaning({ rows: [row(2016, 57, 3, 44, 0, 3, 0, 7), row(2026, 57, 6, 9, 0, 42, 0, 0)] });
    expect(r.marker).toBe("A big change");
    expect(r.text).toContain("Green has gone from 3 seats in 2016 to 42 in 2026");
    expect(r.text).toContain("Labour has fallen from 44 seats to 9");
  });
  it("says so when little has moved, and copes with no history", () => {
    const r = councilChangeMeaning({ rows: [row(2016, 50, 25, 25), row(2026, 50, 26, 24)] });
    expect(r.marker).toBe("Little change");
    expect(r.text).toContain("No party's share of seats has moved much since 2016");
    expect(councilChangeMeaning({ rows: [row(2026, 5, 5, 0)] })).toBeNull();
  });
});

import { changesMeaning, defectionMeaning, controlTrendMeaning } from "./councilMeaning";

describe("national sentences", () => {
  const summary = { total: 72, flows: [{ from: "lab", to: "noc", count: 31 }], net: [{ key: "ref", net: 24 }, { key: "noc", net: 5 }, { key: "lab", net: -43 }] };
  it("compares the latest year's changes of control with earlier years", () => {
    const r = changesMeaning({ changesByYear: [{ year: 2024, count: 26 }, { year: 2025, count: 32 }, { year: 2026, count: 72 }], summary });
    expect(r.marker).toBe("The most on record");
    expect(r.text).toContain("72 councils changed hands in 2026, more than in any other year since records here begin in 2024");
    expect(r.text).toContain("Labour to No overall control (31 councils)");
    expect(r.text).toContain("Reform UK made the biggest net gain (+24) and Labour the biggest net loss (−43)");
    expect(r.text).toContain("5 more councils now have no overall control.");
    const typical = changesMeaning({ changesByYear: [{ year: 2023, count: 86 }, { year: 2024, count: 20 }, { year: 2025, count: 30 }, { year: 2026, count: 25 }], summary: { ...summary, total: 25 } });
    expect(typical.marker).toBe("A typical year");
    expect(changesMeaning({ changesByYear: [], summary })).toBeNull();
  });
  it("sizes up the defections", () => {
    const s = { total: 629, since: 2025, flows: [{ count: 98, fromParty: { short: "Labour" }, toParty: { short: "Independent or other" } }] };
    const r = defectionMeaning({ summary: s, councillors: 19273 });
    expect(r.marker).toBe("Some movement");
    expect(r.text).toContain("629 councillors (3.3%)");
    expect(r.text).toContain("Labour to Independent or other (98)");
    expect(defectionMeaning({ summary: null, councillors: 1 })).toBeNull();
  });
  it("describes the shift in control since the first year", () => {
    const row = (year, counts) => ({ year, counts });
    const r = controlTrendMeaning({ trend: [row(2016, { con: 157, lab: 106, noc: 80 }), row(2026, { con: 24, lab: 64, noc: 196 })] });
    expect(r.marker).toBe("A big shift");
    expect(r.text).toBe("Since 2016, No overall control has gone from controlling 80 councils to 196, while Conservative has gone from 157 to 24.");
    expect(controlTrendMeaning({ trend: [] })).toBeNull();
  });
});
