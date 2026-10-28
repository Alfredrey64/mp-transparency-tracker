import { describe, it, expect } from "vitest";
import { EXPLAINER_KEYS } from "./explainerKeys";
import { LOADERS } from "../pageLoaders";
import { SECTIONS } from "./sidebarSections";
import { PAGE_GUIDES } from "./pageGuides";

// Every page drawn from data has to be wired in everywhere a page needs to be: a loader, a menu entry, and a reading guide.
describe("the pages drawn from data", () => {
  const listed = new Set(SECTIONS.flatMap((s) => s.items.map((i) => i.key)));
  it("each has a loader, a menu entry and a reading guide", () => {
    for (const key of EXPLAINER_KEYS) {
      expect(typeof LOADERS[key], `${key} loader`).toBe("function");
      expect(listed.has(key), `${key} menu entry`).toBe(true);
      const g = PAGE_GUIDES[key];
      expect(g?.what && g?.why && g?.notShown, `${key} guide`).toBeTruthy();
    }
  });
  it("lists no key twice", () => {
    expect(new Set(EXPLAINER_KEYS).size).toBe(EXPLAINER_KEYS.length);
  });
});
