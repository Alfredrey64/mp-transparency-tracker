import { describe, expect, it, vi } from "vitest";
import { loadDataFile } from "./useDataFile";

describe("loadDataFile", () => {
  it("fetches a file once and hands the same copy to everyone who asks", async () => {
    const load = vi.fn(() => Promise.resolve({ default: { rows: [1, 2] } }));
    const [a, b] = await Promise.all([loadDataFile(load), loadDataFile(load)]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(await loadDataFile(load)).toBe(a);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not keep a failure, so the next visit tries again", async () => {
    let fail = true;
    const load = vi.fn(() => (fail ? Promise.reject(new Error("offline")) : Promise.resolve({ default: "ok" })));
    await expect(loadDataFile(load)).rejects.toThrow("offline");
    fail = false;
    expect(await loadDataFile(load)).toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });
});
