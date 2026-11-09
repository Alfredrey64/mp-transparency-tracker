import { describe, expect, it } from "vitest";
import data from "./partyLeaders.json";

// The Party History page shows each party's current leader and portrait from this file (built by scripts/build-party-leaders.mjs from Wikipedia).
describe("partyLeaders.json", () => {
  const entries = Object.entries(data.leaders);

  it("has a named leader for each of the twelve parties on the page", () => {
    expect(entries).toHaveLength(12);
    for (const [party, l] of entries) {
      expect(l.name, party).toMatch(/\S{2,}/);
      expect(["Leader", "President"], party).toContain(l.role);
    }
  });

  it("only points portraits at the host the site's Content-Security-Policy allows", () => {
    for (const [party, l] of entries) {
      if (l.photo) expect(l.photo, party).toMatch(/^https:\/\/thumb\.wikimedia\.org\//);
    }
  });

  it("says when it was checked", () => {
    expect(data.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
