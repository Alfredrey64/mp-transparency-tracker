import { describe, it, expect } from "vitest";
import fs from "node:fs";
import headings from "./pageHeadings.json";

// The search finds sections inside pages from this file. It is made by `node scripts/build-heading-index.mjs`; when a page is added and the file is not
// refreshed, the new page cannot be searched by its sections, and this test says so.
const text = fs.readFileSync(new URL("../pageLoaders.js", import.meta.url), "utf8");
const body = text.slice(text.indexOf("export const LOADERS"));
const PAGE_NAMES = [...body.matchAll(/^ {2}([A-Za-z0-9_]+): /gm)].map((m) => m[1]);

describe("page headings for search", () => {
  it("has an entry for every page", () => {
    expect(PAGE_NAMES.filter((n) => !headings[n])).toEqual([]);
  });
  it("holds only short headings that are real text", () => {
    for (const [page, info] of Object.entries(headings)) {
      expect(info.title, page).toBeTruthy();
      for (const h of info.heads) expect(h.length, `${page}: ${h}`).toBeLessThanOrEqual(80);
    }
  });
});
