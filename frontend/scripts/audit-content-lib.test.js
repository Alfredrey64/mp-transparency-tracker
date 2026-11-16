import { describe, it, expect } from "vitest";
import { parseLongDate, staleExplainers, staleData, staleCheckedConstants, dueDates, capBehind, tradeHeadlineBehind, brokenLinks, report } from "./audit-content-lib.mjs";

const now = new Date("2026-10-30T12:00:00Z");

describe("parseLongDate", () => {
  it("reads a date written the way the pages write it", () => {
    expect(parseLongDate("30 October 2026").toISOString().slice(0, 10)).toBe("2026-10-30");
    expect(parseLongDate("1 january 2026").toISOString().slice(0, 10)).toBe("2026-01-01");
  });
  it("is null for anything else", () => { expect(parseLongDate("soon")).toBeNull(); expect(parseLongDate(undefined)).toBeNull(); expect(parseLongDate("5 Smarch 2026")).toBeNull(); });
});

describe("staleExplainers", () => {
  it("flags pages checked more than the limit ago, and pages with no date", () => {
    const out = staleExplainers([{ name: "a", checked: "30 October 2026" }, { name: "b", checked: "1 August 2026" }, { name: "c", checked: "1 October 2026" }, { name: "d" }], now);
    expect(out.map((x) => x.name)).toEqual(["b", "d"]);
    expect(out[0].problem).toContain("90 days");
  });
});

describe("staleData", () => {
  it("flags a daily file that is more than two days old, and ignores files with no schedule (the weekly statistics files are checked by their own workflow)", () => {
    const out = staleData([
      { name: "ons/prices.json", stamp: "2026-10-25T16:00:00Z" },
      { name: "ons/jobs.json", stamp: "2026-10-29T16:00:00Z" },
      { name: "educationData.json", stamp: "2026-10-20T00:00:00Z" },
      { name: "careData.json", stamp: "2026-10-01T00:00:00Z" },
      { name: "seatHexes.json", stamp: "2020-01-01T00:00:00Z" },
      { name: "benchmarks.json", stamp: null },
    ], now);
    expect(out.map((x) => x.name)).toEqual(["ons/prices.json"]);
  });
});

describe("brokenLinks", () => {
  it("flags missing pages, server errors and unreachable sites, but not sites that refuse automatic visitors", () => {
    const out = brokenLinks([{ url: "a", status: 200 }, { url: "b", status: 404 }, { url: "c", status: 403 }, { url: "d", status: 429 }, { url: "e", status: 503 }, { url: "f", status: 0, error: "ENOTFOUND" }, { url: "g", status: 301 }]);
    expect(out.map((x) => x.name)).toEqual(["b", "e", "f"]);
    expect(out[2].problem).toContain("ENOTFOUND");
  });
});

describe("report", () => {
  it("counts what needs a look and says so plainly", () => {
    expect(report([["x", []], ["y", []]])).toMatchObject({ total: 0 });
    expect(report([["x", []]]).text).toContain("All clear");
    const r = report([["x", [{ name: "a", problem: "p" }]], ["y", [{ name: "b", problem: "q" }]]]);
    expect(r.total).toBe(2);
    expect(r.text).toContain("- a: p");
    expect(r.text).toContain("2 things to look at");
  });
});

describe("staleCheckedConstants", () => {
  it("flags a data file whose hand-checked date is older than the limit, or unreadable", () => {
    const out = staleCheckedConstants([{ name: "a", checked: "30 October 2026" }, { name: "b", checked: "1 August 2026" }, { name: "c", checked: "soon" }], now);
    expect(out.map((x) => x.name)).toEqual(["b", "c"]);
    expect(out[0].problem).toContain("90 days");
  });
});

describe("dueDates", () => {
  const rows = [
    { date: "2026-11-05", lead: 14, what: "soon", where: "x" },
    { date: "2026-10-20", lead: 14, what: "just passed", where: "y" },
    { date: "2026-09-01", lead: 14, what: "long gone", where: "z" },
    { date: "2027-06-30", lead: 30, what: "far off", where: "w" },
  ];
  it("lists a row from `lead` days before its date until three weeks after, and no other time", () => {
    const out = dueDates(rows, now);
    expect(out.map((x) => x.name)).toEqual(["soon", "just passed"]);
    expect(out[0].problem).toContain("falls due in 6 days");
    expect(out[1].problem).toContain("fell due 10 days ago");
  });
  it("reports a date it cannot read", () => { expect(dueDates([{ date: "nope", what: "bad", where: "x" }], now)[0].problem).toContain("unreadable"); });
});

describe("capBehind", () => {
  it("is null while the page states the newest cap period and names the newer period once Ofgem's model has one", () => {
    expect(capBehind(["Jul 2026 - Sep 2026", "Oct 2026 - Dec 2026"], "1 October 2026")).toBeNull();
    expect(capBehind(["Oct 2026 - Dec 2026", "Jan 2027 - Mar 2027"], "1 October 2026")).toBe("Jan 2027 - Mar 2027");
    expect(capBehind([], "1 October 2026")).toBeNull();
  });
});

describe("tradeHeadlineBehind", () => {
  it("counts the quarters between the typed headline and the series the site holds", () => {
    expect(tradeHeadlineBehind("October to December 2025", "2026-Q2")).toBe(2);
    expect(tradeHeadlineBehind("October to December 2025", "2026-Q1")).toBe(1);
    expect(tradeHeadlineBehind("October to December 2025", "2025-Q4")).toBe(0);
  });
  it("says nothing when it cannot read either side", () => {
    expect(tradeHeadlineBehind("last quarter", "2026-Q2")).toBe(0);
    expect(tradeHeadlineBehind("April to June 2026", undefined)).toBe(0);
  });
});
