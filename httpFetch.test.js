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
