import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRetry, waitBeforeRetry } from "./httpFetch.js";

const fast = { baseDelayMs: 0 };
const reply = (status, body = "ok", headers = {}) => new Response(body, { status, headers });

afterEach(() => vi.unstubAllGlobals());

describe("fetchRetry", () => {
  it("returns a good response straight away", async () => {
    const f = vi.fn().mockResolvedValue(reply(200, "hello"));
    vi.stubGlobal("fetch", f);
    const res = await fetchRetry("https://example.test/a", {}, fast);
    expect(await res.text()).toBe("hello");
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("tries again after a server error and then succeeds", async () => {
    const f = vi.fn().mockResolvedValueOnce(reply(503)).mockResolvedValueOnce(reply(429)).mockResolvedValue(reply(200, "fine"));
    vi.stubGlobal("fetch", f);
    const res = await fetchRetry("https://example.test/a", {}, fast);
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("tries again after a network error", async () => {
    const f = vi.fn().mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValue(reply(200));
    vi.stubGlobal("fetch", f);
    expect((await fetchRetry("https://example.test/a", {}, fast)).status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("does not retry an error that retrying cannot fix", async () => {
    const f = vi.fn(async () => reply(404));
    vi.stubGlobal("fetch", f);
    expect((await fetchRetry("https://example.test/a", {}, fast)).status).toBe(404);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("hands back the last response when the server keeps saying it is busy", async () => {
    const f = vi.fn(async () => reply(503));
    vi.stubGlobal("fetch", f);
    expect((await fetchRetry("https://example.test/a", {}, { ...fast, retries: 2 })).status).toBe(503);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("throws a clear error when every try fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(fetchRetry("https://example.test/a", {}, { ...fast, retries: 1 })).rejects.toThrow(/fetch failed.*after 2 tries/);
  });

  it("gives up on a request that never answers", async () => {
    vi.stubGlobal("fetch", vi.fn((url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)))));
    await expect(fetchRetry("https://example.test/a", {}, { ...fast, retries: 1, timeoutMs: 20 })).rejects.toThrow(/Timed out/);
  });
});

describe("waitBeforeRetry", () => {
  it("doubles each time", () => {
    expect([0, 1, 2].map((n) => waitBeforeRetry(n, null, 1000))).toEqual([1000, 2000, 4000]);
  });
  it("follows Retry-After and never waits more than a minute", () => {
    expect(waitBeforeRetry(0, "7", 1000)).toBe(7000);
    expect(waitBeforeRetry(0, "600", 1000)).toBe(60_000);
  });
});

import { mapLimit, tooManyFailed } from "./httpFetch.js";

describe("mapLimit", () => {
  it("answers in the order of the items, whatever order they finish in", async () => {
    const out = await mapLimit([30, 5, 20, 1], 3, async (ms, i) => { await new Promise((r) => setTimeout(r, ms)); return `${i}:${ms}`; });
    expect(out).toEqual(["0:30", "1:5", "2:20", "3:1"]);
  });
  it("never has more than the limit running at once, and does use the whole limit", async () => {
    let running = 0;
    let peak = 0;
    await mapLimit(Array.from({ length: 12 }, (_, i) => i), 4, async () => { running += 1; peak = Math.max(peak, running); await new Promise((r) => setTimeout(r, 5)); running -= 1; });
    expect(peak).toBe(4);
  });
  it("copes with nothing to do, and with fewer items than the limit", async () => {
    expect(await mapLimit([], 4, async () => 1)).toEqual([]);
    expect(await mapLimit(["a"], 4, async (x) => x)).toEqual(["a"]);
  });
  it("lets an error through, so a caller that wants to carry on catches it inside its own function", async () => {
    await expect(mapLimit([1, 2], 2, async (n) => { if (n === 2) throw new Error("boom"); return n; })).rejects.toThrow("boom");
    expect(await mapLimit([1, 2], 2, async (n) => { try { if (n === 2) throw new Error("boom"); return n; } catch { return null; } })).toEqual([1, null]);
  });
});

describe("tooManyFailed", () => {
  it("is true when more than one in ten failed", () => {
    expect(tooManyFailed(11, 100)).toBe(true);
    expect(tooManyFailed(10, 100)).toBe(false);
    expect(tooManyFailed(0, 0)).toBe(false);
  });
});
