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

  it("clears the fade on the words when a box settles, so reopening a closed box shows them", async () => {
    document.body.innerHTML = "<details open><summary>More</summary><p>Inside</p></details>";
    const d = document.querySelector("details");
    const p = d.querySelector("p");
    const fades = [];
    d.getBoundingClientRect = () => ({ height: d.open ? 120 : 36 });
    d.animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }));
    p.animate = vi.fn(() => { const a = { cancel: vi.fn() }; fades.push(a); return a; });
    window.matchMedia = () => ({ matches: false });
    installDetailsMotion(document);
    d.querySelector("summary").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await Promise.resolve(); await Promise.resolve();
    expect(d.open).toBe(false);
    expect(fades[0].cancel).toHaveBeenCalled();
  });
});
