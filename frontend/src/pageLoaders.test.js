import { describe, expect, it } from "vitest";
import { LOADERS } from "./pageLoaders";

describe("page loaders", () => {
  it("gives every sector page the same loader, so fetching one ahead of time fetches the entry that is rendered", () => {
    // lazyPage and preloadPage look a page up by its loader function; one function per sector key left the first sector page opened showing an empty screen while it caught up.
    const sectors = Object.entries(LOADERS).filter(([, load]) => String(load).includes("SectorPage"));
    expect(sectors.length).toBeGreaterThanOrEqual(14);
    for (const [key, load] of sectors) expect(load, key).toBe(LOADERS.economy);
  });
});
