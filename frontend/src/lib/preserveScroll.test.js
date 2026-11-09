import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-dom", () => ({ flushSync: (fn) => fn() }));
import { withScrollPreserved, holdPlace } from "./preserveScroll";

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

describe("holdPlace", () => {
  // A control whose top edge is read from `box.top`, which the test moves the way a closing panel above it would.
  function control(box) {
    return { isConnected: true, getBoundingClientRect: () => ({ top: box.top }) };
  }
  function win() {
    const w = { scrollY: 500, scrollBy: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal("window", w);
    vi.stubGlobal("performance", { now: () => 0 });
    vi.stubGlobal("requestAnimationFrame", () => 0);
    return w;
  }

  it("scrolls by however far the pressed control moved, so it stays where the finger was", () => {
    const w = win();
    const box = { top: 300 };
    holdPlace(control(box), () => { box.top = 180; });
    expect(w.scrollBy).toHaveBeenCalledWith(0, -120);
  });

  it("does nothing when the control did not move", () => {
    const w = win();
    holdPlace(control({ top: 300 }), () => {});
    expect(w.scrollBy).not.toHaveBeenCalled();
  });

  it("just applies the change when there is no control to hold", () => {
    win();
    const change = vi.fn();
    holdPlace(null, change);
    expect(change).toHaveBeenCalledOnce();
  });

  it("stops holding as soon as the reader scrolls or touches the screen", () => {
    const w = win();
    holdPlace(control({ top: 100 }), () => {});
    const events = w.addEventListener.mock.calls.map((c) => c[0]);
    expect(events).toEqual(expect.arrayContaining(["wheel", "touchstart", "keydown"]));
  });
});
