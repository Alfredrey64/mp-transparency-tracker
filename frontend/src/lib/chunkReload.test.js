import { describe, expect, it, vi } from "vitest";
import { installChunkReload, isStaleFileError, clearSavedFiles, reloadForUpdate } from "./chunkReload";

const tick = () => new Promise((r) => setTimeout(r, 0));

function setup(stored = null) {
  const listeners = {};
  const win = { addEventListener: (n, f) => { listeners[n] = f; }, removeEventListener: vi.fn(), location: { reload: vi.fn() } };
  const data = new Map(stored ? [["sp-reloaded-for-update", stored]] : []);
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
  const stop = installChunkReload(win, storage);
  return { win, storage, reject: (reason) => listeners.unhandledrejection({ reason }), fire: () => { const e = { preventDefault: vi.fn() }; listeners["vite:preloadError"](e); return e; }, stop };
}

describe("installChunkReload", () => {
  it("reloads once when a page file has gone missing", async () => {
    const { win, fire, stop } = setup();
    const e = fire();
    await tick();
    expect(e.preventDefault).toHaveBeenCalled();
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    stop();
  });

  it("does not reload again straight after, so a real outage cannot loop", async () => {
    const { win, fire, stop } = setup();
    fire();
    fire();
    await tick();
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

describe("a background script that has gone", () => {
  it("reloads once for a stale-file rejection nobody caught, and ignores other rejections", async () => {
    const { win, reject, stop } = setup();
    reject(new Error("something else"));
    await tick();
    expect(win.location.reload).not.toHaveBeenCalled();
    reject(new TypeError("'text/html' is not a valid JavaScript MIME type."));
    await tick();
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    stop();
  });
});

describe("isStaleFileError", () => {
  it("recognises how each browser words a script that has been replaced", () => {
    for (const m of [
      "Failed to fetch dynamically imported module: https://x.test/assets/a-1.js",
      "'text/html' is not a valid JavaScript MIME type.",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Unable to preload CSS for /assets/a.css",
    ]) expect(isStaleFileError(new TypeError(m))).toBe(true);
  });
  it("leaves real bugs alone", () => {
    expect(isStaleFileError(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(false);
    expect(isStaleFileError(null)).toBe(false);
  });
});

describe("clearSavedFiles and reloadForUpdate", () => {
  it("forgets the service worker and every saved copy before reloading", async () => {
    const unregister = vi.fn();
    const del = vi.fn();
    const win = {
      navigator: { serviceWorker: { getRegistrations: async () => [{ unregister }] } },
      caches: { keys: async () => ["a", "b"], delete: del },
      location: { reload: vi.fn() },
    };
    const data = new Map();
    const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
    expect(reloadForUpdate(win, storage)).toBe(true);
    await tick(); await tick(); await tick();
    expect(unregister).toHaveBeenCalled();
    expect(del).toHaveBeenCalledTimes(2);
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    expect(reloadForUpdate(win, storage)).toBe(false);
  });
  it("copes with a browser that has neither", async () => {
    await expect(clearSavedFiles({})).resolves.toBeUndefined();
  });
});
