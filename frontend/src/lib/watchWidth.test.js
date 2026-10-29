import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { watchSize, watchWidth } from "./watchWidth";

describe("watching an element's size", () => {
  let observed;
  beforeEach(() => {
    vi.useFakeTimers();
    observed = [];
    globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 16);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; observed.push(this); } observe() {} disconnect() { this.gone = true; } };
  });
  afterEach(() => { vi.useRealTimers(); delete globalThis.ResizeObserver; });

  it("reports once at the start, and handles a change on the next frame, not inside the observer", () => {
    const el = {};
    const seen = vi.fn();
    watchSize(el, seen);
    expect(seen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(seen).toHaveBeenCalledTimes(1);
    observed[0].cb();
    observed[0].cb();
    expect(seen).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(20);
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it("stops watching, and drops a change that was waiting", () => {
    const seen = vi.fn();
    const stop = watchSize({}, seen);
    stop();
    vi.advanceTimersByTime(50);
    expect(seen).not.toHaveBeenCalled();
    expect(observed[0].gone).toBe(true);
  });

  it("passes on the width, and ignores an element with no width", () => {
    const seen = vi.fn();
    let width = 0;
    watchWidth({ getBoundingClientRect: () => ({ width }) }, seen);
    vi.advanceTimersByTime(20);
    expect(seen).not.toHaveBeenCalled();
    width = 320;
    observed[0].cb();
    vi.advanceTimersByTime(20);
    expect(seen).toHaveBeenCalledWith(320);
  });

  it("does nothing for no element", () => { expect(() => watchSize(null, vi.fn())()).not.toThrow(); });
});
