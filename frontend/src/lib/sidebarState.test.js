import { describe, it, expect } from "vitest";
import { readSectionChoices, writeSectionChoices, isSectionOpen } from "./sidebarState";

const fake = (initial = {}) => {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};

describe("section choices", () => {
  it("round-trips explicit open/closed choices", () => {
    const s = fake();
    writeSectionChoices({ learn: true, money: false }, s);
    expect(readSectionChoices(s)).toEqual({ learn: true, money: false });
  });
  it("ignores corrupt or oddly shaped storage, and non-boolean values", () => {
    expect(readSectionChoices(fake({ "mpTracker.sidebarSections.v1": "{nope" }))).toEqual({});
    expect(readSectionChoices(fake({ "mpTracker.sidebarSections.v1": "[1,2]" }))).toEqual({});
    expect(readSectionChoices(fake({ "mpTracker.sidebarSections.v1": JSON.stringify({ a: true, b: "yes", c: 1 }) }))).toEqual({ a: true });
    expect(readSectionChoices(null)).toEqual({});
  });
  it("doesn't throw when storage refuses writes", () => {
    expect(() => writeSectionChoices({ a: true }, { setItem: () => { throw new Error("full"); } })).not.toThrow();
  });
  it("follows the active page unless the visitor has chosen", () => {
    expect(isSectionOpen({}, "learn", true)).toBe(true);
    expect(isSectionOpen({}, "learn", false)).toBe(false);
    expect(isSectionOpen({ learn: false }, "learn", true)).toBe(false);
    expect(isSectionOpen({ learn: true }, "learn", false)).toBe(true);
  });
});

import { readSidebarMode, writeSidebarMode, sectionsForMode, sectionStartsOpen } from "./sidebarState";

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
};

describe("sidebar mode", () => {
  it("starts simple and remembers a choice", () => {
    const store = memory();
    expect(readSidebarMode(store)).toBe("simple");
    writeSidebarMode("all", store);
    expect(readSidebarMode(store)).toBe("all");
    writeSidebarMode("simple", store);
    expect(readSidebarMode(store)).toBe("simple");
  });
  it("survives storage that throws", () => {
    const broken = { getItem: () => { throw new Error("no"); }, setItem: () => { throw new Error("no"); } };
    expect(readSidebarMode(broken)).toBe("simple");
    expect(() => writeSidebarMode("all", broken)).not.toThrow();
  });
});

describe("sectionsForMode", () => {
  const sections = [
    { key: "a", items: [{ key: "start" }, { key: "x", essential: true }, { key: "y" }] },
    { key: "b", items: [{ key: "z" }] },
  ];
  it("shows only the essential pages in the simple view, and drops empty sections", () => {
    const s = sectionsForMode(sections, "simple", "home");
    expect(s.map((x) => x.key)).toEqual(["a"]);
    expect(s[0].items.map((i) => i.key)).toEqual(["x"]);
  });
  it("keeps the page you are on in view even if it isn't essential", () => {
    const s = sectionsForMode(sections, "simple", "z");
    expect(s.map((x) => x.key)).toEqual(["a", "b"]);
    expect(s[1].items.map((i) => i.key)).toEqual(["z"]);
  });
  it("shows everything, except the tour (which has its own place), in the full view", () => {
    const s = sectionsForMode(sections, "all", "home");
    expect(s[0].items.map((i) => i.key)).toEqual(["x", "y"]);
    expect(s).toHaveLength(2);
  });
});

describe("sectionStartsOpen", () => {
  it("lets a choice win, then opens everything in the simple view and the active section in the full view", () => {
    expect(sectionStartsOpen({ a: false }, "a", "simple", true)).toBe(false);
    expect(sectionStartsOpen({}, "a", "simple", false)).toBe(true);
    expect(sectionStartsOpen({}, "a", "all", false)).toBe(false);
    expect(sectionStartsOpen({}, "a", "all", true)).toBe(true);
  });
});
