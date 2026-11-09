import { describe, it, expect } from "vitest";
import { UPDATES } from "./siteUpdates";

// What's new links each entry to a page with the entry's `cta` as the link text; an entry without one rendered an empty link, which a screen reader cannot name.
describe("site updates", () => {
  it("gives every entry a day, a kind, a title, text, a page and the words for its link", () => {
    for (const u of UPDATES) {
      expect(u.date, u.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["New", "Improved", "Fixed"], u.title).toContain(u.kind);
      for (const key of ["title", "text", "page", "cta"]) expect(String(u[key] ?? "").trim(), `${u.title}: ${key}`).not.toBe("");
    }
  });
  it("is newest first", () => {
    const days = UPDATES.map((u) => u.date);
    expect(days).toEqual([...days].sort().reverse());
  });
});
