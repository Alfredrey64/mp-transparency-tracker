import { describe, it, expect, afterEach, vi } from "vitest";
import { lowData } from "./lowData";

const set = (connection) => vi.stubGlobal("navigator", { connection });
afterEach(() => vi.unstubAllGlobals());

describe("lowData", () => {
  it("is false when the browser does not say", () => { set(undefined); expect(lowData()).toBe(false); });
  it("is true when data saving is on", () => { set({ saveData: true, effectiveType: "4g" }); expect(lowData()).toBe(true); });
  it("is true on 2G and slow 2G", () => { set({ effectiveType: "2g" }); expect(lowData()).toBe(true); set({ effectiveType: "slow-2g" }); expect(lowData()).toBe(true); });
  it("is false on 3G and 4G", () => { set({ effectiveType: "3g" }); expect(lowData()).toBe(false); set({ effectiveType: "4g" }); expect(lowData()).toBe(false); });
});
