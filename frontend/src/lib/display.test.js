import { describe, it, expect } from "vitest";
import { compactHeader, clean, DEFAULTS, isDefault, load, save, zoomFor, apply, KEY } from "./display";

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m }; };
const fakeRoot = () => { const attrs = new Map(); const style = { zoom: "", removeProperty(k) { this[k] = ""; } }; return { attrs, style, setAttribute: (k, v) => attrs.set(k, v), removeAttribute: (k) => attrs.delete(k) }; };

describe("display preferences", () => {
  it("starts with everything off", () => { expect(isDefault(DEFAULTS)).toBe(true); });
  it("drops anything it does not understand", () => {
    expect(clean({ size: 9, readable: "yes", spacing: true, nope: 1 })).toEqual({ ...DEFAULTS, spacing: true });
    expect(clean(null)).toEqual(DEFAULTS);
    expect(clean("big")).toEqual(DEFAULTS);
  });
  it("saves a choice, and forgets it when everything goes back to standard", () => {
    const s = memory();
    save({ ...DEFAULTS, size: 1, contrast: true }, s);
    expect(load(s)).toEqual({ ...DEFAULTS, size: 1, contrast: true });
    save(DEFAULTS, s);
    expect(s.m.has(KEY)).toBe(false);
  });
  it("survives damaged storage", () => {
    const s = memory(); s.setItem(KEY, "{not json");
    expect(load(s)).toEqual(DEFAULTS);
  });
  it("holds the zoom back on narrow screens so the page keeps at least 340 pixels", () => {
    expect(zoomFor(2, 1280)).toBe(1.3);
    expect(zoomFor(2, 390)).toBeCloseTo(390 / 340, 5);
    expect(zoomFor(1, 320)).toBe(1);
    expect(zoomFor(0, 1280)).toBe(1);
  });
  it("folds the header into its phone layout early when the text is bigger or wider", () => {
    expect(compactHeader(DEFAULTS, 1280)).toBe(false);
    expect(compactHeader({ ...DEFAULTS, size: 2 }, 1280)).toBe(true);
    expect(compactHeader({ ...DEFAULTS, size: 1 }, 1500)).toBe(false);
    expect(compactHeader({ ...DEFAULTS, readable: true }, 1280)).toBe(true);
    expect(compactHeader({ ...DEFAULTS, readable: true }, 1920)).toBe(false);
  });
  it("puts the choices on the page as attributes", () => {
    const root = fakeRoot();
    apply({ ...DEFAULTS, readable: true, size: 1 }, root, 1280);
    expect(root.attrs.get("data-readable")).toBe("on");
    expect(root.attrs.has("data-spacing")).toBe(false);
    expect(root.style.zoom).toBe("1.15");
    apply(DEFAULTS, root, 1280);
    expect(root.attrs.has("data-readable")).toBe(false);
    expect(root.style.zoom).toBe("");
  });
});
