// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { installDetailsMotion } from "./detailsMotion";

describe("installDetailsMotion", () => {
  it("takes over a summary click and animates the box rather than flipping it at once", () => {
    document.body.innerHTML = "<details><summary>More</summary><p>Inside</p></details>";
    const d = document.querySelector("details");
    const calls = [];
    d.animate = vi.fn((frames) => { calls.push(frames); return { finished: new Promise(() => {}), cancel() {} }; });
    d.querySelector("p").animate = vi.fn(() => ({}));
    window.matchMedia = () => ({ matches: false });
    installDetailsMotion(document);
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    d.querySelector("summary").dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(d.open).toBe(true);
  });
});
