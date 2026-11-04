import { describe, it, expect, vi } from "vitest";
import { finishEntrances } from "./finishEntrances";

const anim = (iterations) => ({ effect: { getComputedTiming: () => ({ iterations }) }, finish: vi.fn() });

describe("finishEntrances", () => {
  it("finishes one-off animations and leaves repeating ones running", () => {
    const once = anim(1); const twice = anim(2); const forever = anim(Infinity);
    const scope = { getAnimations: vi.fn(() => [once, twice, forever]) };
    expect(finishEntrances(scope)).toBe(2);
    expect(once.finish).toHaveBeenCalled();
    expect(twice.finish).toHaveBeenCalled();
    expect(forever.finish).not.toHaveBeenCalled();
    expect(scope.getAnimations).toHaveBeenCalledWith({ subtree: true });
  });
  it("carries on past one that cannot be finished", () => {
    const bad = anim(1); bad.finish.mockImplementation(() => { throw new Error("no"); });
    const good = anim(1);
    expect(finishEntrances({ getAnimations: () => [bad, good] })).toBe(1);
    expect(good.finish).toHaveBeenCalled();
  });
  it("does nothing without a page or without the animations API", () => {
    expect(finishEntrances(null)).toBe(0);
    expect(finishEntrances({})).toBe(0);
  });
});
