import { describe, expect, it, vi } from "vitest";
import { installChunkReload } from "./chunkReload";

function setup(stored = null) {
  const listeners = {};
  const win = { addEventListener: (n, f) => { listeners[n] = f; }, removeEventListener: vi.fn(), location: { reload: vi.fn() } };
  const data = new Map(stored ? [["sp-reloaded-for-update", stored]] : []);
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
  const stop = installChunkReload(win, storage);
  return { win, storage, fire: () => { const e = { preventDefault: vi.fn() }; listeners["vite:preloadError"](e); return e; }, stop };
}

describe("installChunkReload", () => {
  it("reloads once when a page file has gone missing", () => {
    const { win, fire, stop } = setup();
    const e = fire();
    expect(e.preventDefault).toHaveBeenCalled();
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    stop();
  });

  it("does not reload again straight after, so a real outage cannot loop", () => {
    const { win, fire, stop } = setup();
    fire();
    fire();
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    stop();
  });

  it("does not reload if storage already says it just did", () => {
    const { win, fire, stop } = setup("1");
    fire();
    expect(win.location.reload).not.toHaveBeenCalled();
    stop();
  });
});
