import { describe, it, expect } from "vitest";
import { treeFor, buildLayout, routeBetween, metrics } from "./tierTree";
import { visibleTierKeys } from "../data/governmentTiers";

describe("tier tree", () => {
  it("lists the same tiers, in the same order, as the nation's visible tiers", () => {
    for (const n of ["england", "scotland", "wales", "ni"]) {
      expect(treeFor(n).map((t) => t.key)).toEqual(visibleTierKeys(n));
    }
  });

  it("hangs each tier under the one it answers to", () => {
    const england = Object.fromEntries(treeFor("england").map((t) => [t.key, t]));
    expect(england.government.parent).toBe("parliament");
    expect(england.combined.parent).toBe("government");
    expect(england.council.parent).toBe("government");
    expect(england.parish.depth).toBe(3);
    const scotland = Object.fromEntries(treeFor("scotland").map((t) => [t.key, t]));
    expect(scotland.devolved.parent).toBe("parliament");
    expect(scotland.council.parent).toBe("devolved");
  });

  it("lays boxes out inside the width, one per row, indented by depth", () => {
    for (const w of [300, 420, 560, 900]) {
      const l = buildLayout("england", w);
      l.nodes.forEach((n, i) => {
        expect(n.right).toBeLessThanOrEqual(w - metrics(w).trunk + 0.001);
        expect(n.left).toBe(n.depth * metrics(w).indent);
        if (i > 0) expect(n.top).toBeGreaterThan(l.nodes[i - 1].bottom);
      });
      expect(l.height).toBe(l.nodes.at(-1).bottom);
    }
  });

  it("draws a branch to every tier below the top, plus one to you, and a vote stub to each tier below the top", () => {
    const l = buildLayout("scotland", 600);
    expect(l.edges.map((e) => e.key)).toEqual(["government", "devolved", "council", "parish", "you"]);
    expect(l.stubs.map((s) => s.key)).toEqual(["government", "devolved", "council", "parish"]);
    expect(l.trunk.startsWith("M ")).toBe(true);
  });

  it("finds a route for a child, a sibling and the voter, and none for a stranger", () => {
    const l = buildLayout("england", 600);
    expect(routeBetween(l, "parliament", "government")).toContain("M ");
    expect(routeBetween(l, "government", "combined")).toBeTruthy();
    expect(routeBetween(l, "combined", "council")).toBeTruthy();
    expect(routeBetween(l, "parish", "you")).toBeTruthy();
    expect(routeBetween(l, "parish", "parliament")).toBeNull();
    expect(routeBetween(l, "council", "council")).toBeNull();
  });
});
