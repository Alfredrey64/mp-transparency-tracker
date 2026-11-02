import { describe, it, expect } from "vitest";
import { glanceGroups } from "./careerGlance";

const NOW = Date.parse("2026-11-02");
const base = { firstElected: null, lordsFrom: null, yearsInCommons: 0, yearsInLords: 0, electionsWon: 0, electionsLost: 0, governmentPosts: 0, governmentYears: 0, shadowPosts: 0, shadowYears: 0, committees: 0, committeesNow: 0, partyChanges: 0 };

describe("glanceGroups", () => {
  it("shows the Lords and Commons tiles for a peer who was an MP, with the share of the career", () => {
    const g = glanceGroups({ ...base, firstElected: "1983-06-09", lordsFrom: "1996-10-01", yearsInCommons: 13, yearsInLords: 30, governmentPosts: 5, governmentYears: 7, committees: 15, committeesNow: 2 }, NOW);
    const seats = g[0].tiles;
    expect(seats.map((t) => t.key)).toEqual(["lords", "commons", "elections"]);
    expect(seats[0]).toMatchObject({ value: "30", unit: "yrs", note: "since 1996" });
    expect(seats[0].share).toBeGreaterThan(0.5);
    expect(seats[1].label).toBe("as an MP");
  });
  it("shows only the Lords tile for a peer with no Commons career", () => {
    const g = glanceGroups({ ...base, lordsFrom: "2010-01-01", yearsInLords: 16 }, NOW);
    expect(g[0].tiles.map((t) => t.key)).toEqual(["lords"]);
  });
  it("keeps empty tiles but marks them empty", () => {
    const g = glanceGroups({ ...base, firstElected: "2015-05-07", yearsInCommons: 11 }, NOW);
    const posts = g.find((x) => x.title === "Posts held").tiles;
    expect(posts.every((t) => t.empty && t.share === null)).toBe(true);
    expect(posts[0].note).toBe("never held one");
  });
  it("uses singular words for a count of one and never lets a share pass 100%", () => {
    const g = glanceGroups({ ...base, firstElected: "2024-07-04", yearsInCommons: 5, governmentPosts: 1, governmentYears: 5 }, NOW);
    expect(g[1].tiles[0].label).toBe("government post");
    expect(g[1].tiles[0].share).toBeLessThanOrEqual(1);
  });
});
