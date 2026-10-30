import { describe, it, expect } from "vitest";
import { parseLongDate, staleExplainers, staleData, brokenLinks, report } from "./audit-content-lib.mjs";

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
  it("flags a daily file that is more than two days old and a weekly one more than fifteen, and ignores files with no schedule", () => {
    const out = staleData([
      { name: "ons/prices.json", stamp: "2026-10-25T16:00:00Z" },
      { name: "ons/jobs.json", stamp: "2026-10-29T16:00:00Z" },
      { name: "educationData.json", stamp: "2026-10-20T00:00:00Z" },
      { name: "careData.json", stamp: "2026-10-01T00:00:00Z" },
      { name: "seatHexes.json", stamp: "2020-01-01T00:00:00Z" },
      { name: "benchmarks.json", stamp: null },
    ], now);
    expect(out.map((x) => x.name)).toEqual(["ons/prices.json", "careData.json"]);
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
