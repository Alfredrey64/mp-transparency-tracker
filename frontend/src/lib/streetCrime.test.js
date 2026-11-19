import { describe, it, expect } from "vitest";
import { byCategory, busiestStreets, monthName, monthsBack, crimeName, loadStreetCrime } from "./streetCrime";

const crimes = [
  { category: "burglary", location: { street: { name: "On or near High Street" } } },
  { category: "burglary", location: { street: { name: "On or near High Street" } } },
  { category: "shoplifting", location: { street: { name: "On or near Mill Lane" } } },
  { category: "violent-crime", location: { street: { name: "On or near Mill Lane" } } },
  { category: "violent-crime", location: { street: { name: "On or near High Street" } } },
  { category: "violent-crime", location: { street: { name: "On or near Park Road" } } },
];

describe("street crime", () => {
  it("counts by kind in plain words, most first", () => {
    const rows = byCategory(crimes);
    expect(rows.map((r) => [r.name, r.count])).toEqual([["Violence and sexual offences", 3], ["Burglary", 2], ["Shoplifting", 1]]);
  });
  it("names the busiest streets without the 'On or near' prefix", () => {
    expect(busiestStreets(crimes, 2)).toEqual([{ name: "High Street", count: 3 }, { name: "Mill Lane", count: 2 }]);
  });
  it("names an unknown kind sensibly", () => { expect(crimeName("new-thing")).toBe("New thing"); });
  it("names months and steps back across a year end", () => {
    expect(monthName("2025-09")).toBe("September 2025");
    expect(monthsBack("2026-01-01", 2)).toBe("2025-11");
    expect(monthsBack("2025-09", 0)).toBe("2025-09");
  });
  it("loads the latest month and the ones before it, leaving a failed month out of the totals", async () => {
    const fetcher = async (url) => {
      if (url.includes("last-updated")) return { ok: true, json: async () => ({ date: "2025-09-01" }) };
      if (url.includes("date=2025-07")) return { ok: false };
      return { ok: true, json: async () => crimes };
    };
    const r = await loadStreetCrime({ lat: 51, lon: -2 }, 4, fetcher);
    expect(r.latest).toBe("2025-09");
    expect(r.total).toBe(6);
    expect(r.months.map((m) => m.ym)).toEqual(["2025-06", "2025-08", "2025-09"]);
  });
  it("throws when the latest month cannot be had", async () => {
    const fetcher = async (url) => (url.includes("last-updated") ? { ok: true, json: async () => ({ date: "2025-09-01" }) } : { ok: false });
    await expect(loadStreetCrime({ lat: 51, lon: -2 }, 2, fetcher)).rejects.toThrow();
  });
});
