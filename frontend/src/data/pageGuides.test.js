import { describe, it, expect } from "vitest";
import { PAGE_GUIDES, GUIDE_ALIASES } from "./pageGuides";
import { SECTIONS } from "./sidebarSections";
import { guideKeyFor } from "../lib/viewContext";

// Pages with their own opening that explains itself, or that are settings.
const WITHOUT_GUIDE = new Set(["start"]);

describe("page guides", () => {
  it("gives every guide three short, non-empty lines", () => {
    for (const [key, g] of Object.entries(PAGE_GUIDES)) {
      for (const line of ["what", "why", "notShown"]) {
        expect(typeof g[line], `${key}.${line}`).toBe("string");
        expect(g[line].length, `${key}.${line} is empty`).toBeGreaterThan(20);
        expect(g[line].length, `${key}.${line} is too long to read at a glance`).toBeLessThanOrEqual(230);
      }
    }
  });
  it("covers every page in the sidebar", () => {
    const missing = SECTIONS.flatMap((s) => s.items)
      .map((i) => i.key)
      .filter((k) => !WITHOUT_GUIDE.has(k) && !PAGE_GUIDES[k] && !PAGE_GUIDES[GUIDE_ALIASES[k]]);
    expect(missing).toEqual([]);
  });
  it("picks the right guide for a page and its address parameter", () => {
    expect(guideKeyFor("numbers", "lords")).toBe("numbersLords");
    expect(guideKeyFor("numbers", null)).toBe("numbers");
    expect(guideKeyFor("lords", "4148")).toBe("peer");
    expect(guideKeyFor("lords", null)).toBe("lords");
    expect(guideKeyFor("list", "career=minister")).toBe("list");
    expect(guideKeyFor("constituency", "Chorley")).toBe("constituency");
    expect(PAGE_GUIDES[guideKeyFor("numbers", "lords")]).toBeTruthy();
    expect(PAGE_GUIDES[guideKeyFor("lords", "1")]).toBeTruthy();
  });
});
