import { describe, it, expect } from "vitest";
import { PARLIAMENT_LINKS } from "./onsParliament";
import { SECTOR_KEYS } from "./onsSectors";
import { SECTIONS } from "./sidebarSections";
import { BILL_CATEGORIES } from "../lib/bills";

describe("links from the numbers pages into Parliament", () => {
  const pages = new Set(SECTIONS.flatMap((s) => s.items.map((i) => i.key)));
  const categories = new Set(BILL_CATEGORIES.map((c) => c.label));

  it("covers every sector with real pages and bill categories", () => {
    for (const key of SECTOR_KEYS) {
      const link = PARLIAMENT_LINKS[key];
      expect(link, key).toBeTruthy();
      expect(link.topics.length).toBeGreaterThan(0);
      expect(categories.has(link.billCategory), `${key}: ${link.billCategory}`).toBe(true);
      for (const page of link.pages) expect(pages.has(page.key), `${key}: ${page.key}`).toBe(true);
    }
  });
});
