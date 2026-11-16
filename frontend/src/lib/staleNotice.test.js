import { describe, expect, it } from "vitest";
import { daysOld, staleNotice } from "./staleNotice";

const NOW = Date.parse("2026-11-16T12:00:00Z");

describe("staleNotice", () => {
  it("counts whole days and reads a plain date or a timestamp", () => {
    expect(daysOld("2026-11-09", NOW)).toBe(7);
    expect(daysOld("2026-11-16T03:00:00Z", NOW)).toBe(0);
    expect(daysOld("not a date", NOW)).toBeNull();
  });
  it("says nothing while the data is recent", () => {
    expect(staleNotice("2026-11-14", NOW, { source: "Parliament" })).toBeNull();
    expect(staleNotice("2026-11-13", NOW, { source: "Parliament" })).toBeNull();
  });
  it("names the date, the days and the publisher once it is old", () => {
    const text = staleNotice("2026-11-09", NOW, { source: "Parliament's Statutory Instruments service" });
    expect(text).toContain("9 November 2026");
    expect(text).toContain("7 days");
    expect(text).toContain("Parliament's Statutory Instruments service");
  });
  it("says nothing when the date cannot be read, rather than a wrong claim", () => {
    expect(staleNotice(undefined, NOW, {})).toBeNull();
  });
});
