import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import data from "./partyLeaders.json";

// The Party History page shows each party's current leader and portrait from this file, kept up to date by fetch-party-leaders.js in the daily refresh (the rules are in
// partyLeaders.js at the top of the repo).
const entries = Object.entries(data.leaders);

// The parties the page lists, read from where PoliticalHistory.jsx defines them, so adding a party there without a leader here fails this test.
const source = readFileSync(new URL("../components/PoliticalHistory.jsx", import.meta.url), "utf8");
const listed = [...source.slice(source.indexOf("const PARTY_HISTORY"), source.indexOf("];", source.indexOf("const PARTY_HISTORY"))).matchAll(/^\s{4}party: "([^"]+)"/gm)].map((m) => m[1]);

describe("partyLeaders.json", () => {
  it("has a leader for every party the page lists", () => {
    expect(listed.length).toBeGreaterThanOrEqual(12);
    for (const party of listed) expect(data.leaders[party]?.name, party).toBeTruthy();
  });

  it("has a named leader with a role and a date it was confirmed for each", () => {
    for (const [party, l] of entries) {
      expect(l.name, party).toMatch(/^\S+\s+\S/);
      expect(["Leader", "President"], party).toContain(l.role);
      expect(l.confirmed, party).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("only points portraits at the host the site's Content-Security-Policy allows", () => {
    for (const [party, l] of entries) {
      if (l.photo) expect(l.photo, party).toMatch(/^https:\/\/thumb\.wikimedia\.org\//);
    }
  });

  it("says when every party was last read", () => {
    expect(data.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
