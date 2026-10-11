import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-dom", () => ({ flushSync: (fn) => fn() }));
import { withScrollPreserved } from "./preserveScroll";

afterEach(() => vi.unstubAllGlobals());

function fakeWindow(startY) {
  const win = { scrollY: startY, scrollTo: vi.fn((x, y) => { win.scrollY = y; }) };
  vi.stubGlobal("window", win);
  vi.stubGlobal("requestAnimationFrame", (cb) => cb());
  return win;
}

describe("withScrollPreserved", () => {
  it("applies the change and puts the page back before painting when the change moved it", () => {
    const win = fakeWindow(900);
    const change = vi.fn(() => { win.scrollY = 300; });
    withScrollPreserved(change);
    expect(change).toHaveBeenCalledOnce();
    expect(win.scrollTo).toHaveBeenCalledWith(0, 900);
    expect(win.scrollY).toBe(900);
  });

  it("does not touch the scroll position when nothing moved it", () => {
    const win = fakeWindow(400);
    withScrollPreserved(() => {});
    expect(win.scrollTo).not.toHaveBeenCalled();
  });
});
