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
