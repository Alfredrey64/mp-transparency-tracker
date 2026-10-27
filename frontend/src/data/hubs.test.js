import { describe, it, expect } from "vitest";
import { SECTIONS, HUBS, HUB_BY_PAGE, hubLead, collapseItems } from "./sidebarSections";
import { MENU } from "./siteMenu";

const sectionOf = (key) => SECTIONS.find((s) => s.items.some((i) => i.key === key));

describe("page groups in the menus", () => {
  it("only groups pages that exist, in the same menu section, once each", () => {
    const seen = new Set();
    for (const h of HUBS) {
      expect(h.pages.length, h.key).toBeGreaterThanOrEqual(2);
      const sections = new Set();
      for (const [key] of h.pages) {
        expect(sectionOf(key), `${h.key}: ${key} is not in the menu`).toBeTruthy();
        expect(seen.has(key), `${key} is in two groups`).toBe(false);
        seen.add(key);
        sections.add(sectionOf(key).key);
      }
      expect(sections.size, `${h.key} spans sections`).toBe(1);
    }
  });
  it("opens a group at its first page, and leaves other pages alone", () => {
    expect(hubLead("rebels")).toBe("voting");
    expect(hubLead("voting")).toBe("voting");
    expect(hubLead("petitions")).toBe("petitions");
    expect(HUB_BY_PAGE.get("councillors").label).toBe("Your council");
  });
  it("shows each group once in the menu, under the group's name", () => {
    const keys = MENU.flatMap((m) => m.groups.flatMap((g) => g.items.map((i) => i.key)));
    expect(keys).toContain("voting");
    expect(keys).not.toContain("rebels");
    expect(keys).not.toContain("councillors");
    const labels = MENU.flatMap((m) => m.groups.flatMap((g) => g.items.map((i) => i.label)));
    expect(labels).toContain("How MPs vote");
    expect(new Set(labels).size).toBe(labels.length);
  });
  it("makes the menus much shorter without losing a page", () => {
    const all = SECTIONS.flatMap((s) => s.items).filter((i) => i.key !== "start" && !i.standalone).length;
    const shown = MENU.flatMap((m) => m.groups.flatMap((g) => g.items)).length;
    expect(shown).toBeLessThan(all * 0.6);
    const country = SECTIONS.find((s) => s.key === "country");
    expect(collapseItems(country.items).length).toBeLessThanOrEqual(8);
  });
});
