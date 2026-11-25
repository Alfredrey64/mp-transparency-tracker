import { describe, it, expect } from "vitest";
import { RELATED_PAIRS, RELATED } from "./relatedPages";
import { SECTIONS, HUB_BY_PAGE } from "./sidebarSections";

const KEYS = new Set(SECTIONS.flatMap((s) => s.items.map((i) => i.key)));

describe("related pages", () => {
  it("name only real menu pages", () => {
    expect(RELATED_PAIRS.flat().filter((k) => !KEYS.has(k))).toEqual([]);
  });
  it("never pair a page with itself or with a page in its own menu group (those are already tabs)", () => {
    for (const [a, b] of RELATED_PAIRS) {
      expect(a, `${a}/${b}`).not.toBe(b);
      const ha = HUB_BY_PAGE.get(a)?.key;
      expect(ha && ha === HUB_BY_PAGE.get(b)?.key, `${a} and ${b} share a group`).toBeFalsy();
    }
  });
  it("lists a pair once", () => {
    const seen = new Set(RELATED_PAIRS.map(([a, b]) => [a, b].sort().join("|")));
    expect(seen.size).toBe(RELATED_PAIRS.length);
  });
  it("gives a page at most five related pages", () => {
    for (const [k, list] of RELATED) expect(list.length, k).toBeLessThanOrEqual(5);
  });
});
