// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { glide } from "./scrollBehavior";

afterEach(() => { vi.unstubAllGlobals(); document.documentElement.removeAttribute("data-calm"); });

describe("glide", () => {
  it("scrolls smoothly by default", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    expect(glide()).toBe("smooth");
  });
  it("jumps for someone who chose calmer motion on the site", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    document.documentElement.setAttribute("data-calm", "");
    expect(glide()).toBe("auto");
  });
  it("jumps for someone whose device asks for reduced motion", () => {
    vi.stubGlobal("matchMedia", (q) => ({ matches: /reduce/.test(q) }));
    expect(glide()).toBe("auto");
  });
});
