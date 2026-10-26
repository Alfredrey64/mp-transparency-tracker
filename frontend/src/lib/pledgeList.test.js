import { describe, it, expect } from "vitest";
import { STATUS_KEY, prepare, countsByStatus, areasOf, filterPledges, pledgeUrl } from "./pledgeList";
import { STATUS } from "../data/promises";
import file from "../data/fullFactPledges.json";

const rows = prepare({ pledges: [
  { slug: "a", area: "Health", pledge: "Cut waiting lists", status: "achieved", updated: "2026-01-02" },
  { slug: "b", area: "Housing", pledge: "Build 1.5 million homes", status: "appears-off-track", updated: "2026-03-01" },
  { slug: "c", area: "Health", pledge: "More dentists", status: "not-kept", updated: "2026-02-01" },
] });

describe("pledge list", () => {
  it("has a site status for every Full Fact verdict", () => {
    for (const key of Object.values(STATUS_KEY)) expect(STATUS[key], key).toBeTruthy();
    for (const p of file.pledges) expect(STATUS_KEY[p.status], `${p.slug}: ${p.status}`).toBeTruthy();
  });
  it("holds every pledge Full Fact tracks, with a link to its page", () => {
    expect(file.pledges.length).toBeGreaterThanOrEqual(60);
    expect(new Set(file.pledges.map((p) => p.slug)).size).toBe(file.pledges.length);
    expect(pledgeUrl("a")).toBe("https://fullfact.org/government-tracker/a/");
  });
  it("counts, lists areas and filters", () => {
    expect(countsByStatus(rows)).toEqual({ achieved: 1, off_track: 1, not_kept: 1 });
    expect(areasOf(rows)).toEqual(["Health", "Housing"]);
    expect(filterPledges(rows, { query: "homes" }).map((r) => r.slug)).toEqual(["b"]);
    expect(filterPledges(rows, { area: "Health", status: "not_kept" }).map((r) => r.slug)).toEqual(["c"]);
  });
  it("sorts worst first and most recent first", () => {
    expect(filterPledges(rows, { sort: "status" }).map((r) => r.slug)).toEqual(["c", "b", "a"]);
    expect(filterPledges(rows, { sort: "recent" }).map((r) => r.slug)).toEqual(["b", "c", "a"]);
  });
});
