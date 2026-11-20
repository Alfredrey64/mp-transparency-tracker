import { describe, it, expect } from "vitest";
import { byCategory, busiestStreets, monthName, monthsBack, crimeName, loadStreetCrime, loadCrimeTrend } from "./streetCrime";

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
  const stamp = { ok: true, json: async () => ({ date: "2025-09-01" }) };
  it("loads the newest month's kinds and streets", async () => {
    const fetcher = async (url) => (url.includes("last-updated") ? stamp : { ok: true, json: async () => crimes });
    const r = await loadStreetCrime({ lat: 51, lon: -2 }, fetcher);
    expect(r).toMatchObject({ published: "2025-09", latest: "2025-09", behind: false, total: 6 });
    expect(r.categories[0].name).toBe("Violence and sexual offences");
  });
  it("uses the month before when the newest is refused, and says so", async () => {
    const fetcher = async (url) => (url.includes("last-updated") ? stamp : url.includes("date=2025-09") ? { ok: false } : { ok: true, json: async () => crimes });
    const r = await loadStreetCrime({ lat: 51, lon: -2 }, fetcher);
    expect(r).toMatchObject({ latest: "2025-08", behind: true, total: 6 });
  });
  it("does not wait for ever on a slow newest month", async () => {
    const fetcher = async (url, opts) => {
      if (url.includes("last-updated")) return stamp;
      if (url.includes("date=2025-09")) return new Promise((_, reject) => opts?.signal?.addEventListener("abort", () => reject(new Error("timeout"))));
      return { ok: true, json: async () => crimes };
    };
    const r = await loadStreetCrime({ lat: 51, lon: -2 }, fetcher, { slowAfter: 10, patience: 60 });
    expect(r).toMatchObject({ latest: "2025-08", behind: true });
  });
  it("throws when no recent month can be had, or the API cannot say what is latest", async () => {
    const dead = async (url) => (url.includes("last-updated") ? stamp : { ok: false });
    await expect(loadStreetCrime({ lat: 51, lon: -2 }, dead, { slowAfter: 5 })).rejects.toThrow();
    await expect(loadStreetCrime({ lat: 51, lon: -2 }, async () => ({ ok: false }))).rejects.toThrow();
  });
  it("totals the earlier months, leaving a failed one out and not asking again for the one already loaded", async () => {
    const asked = [];
    const fetcher = async (url) => { asked.push(url); return url.includes("date=2025-07") ? { ok: false } : { ok: true, json: async () => crimes.slice(0, 4) }; };
    const t = await loadCrimeTrend({ lat: 51, lon: -2 }, "2025-09", 4, fetcher, { ym: "2025-09", total: 6 });
    expect(t).toEqual([{ ym: "2025-06", total: 4 }, { ym: "2025-08", total: 4 }, { ym: "2025-09", total: 6 }]);
    expect(asked.some((u) => u.includes("date=2025-09"))).toBe(false);
  });
});
