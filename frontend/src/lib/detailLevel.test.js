import { describe, it, expect, beforeEach } from "vitest";
import { shortBlocks, getDetail, setDetail } from "./detailLevel";

describe("shortBlocks", () => {
  it("drops running text, notes and fold-outs and keeps the rest in order", () => {
    const blocks = [{ text: ["a"] }, { bars: {} }, { note: "n" }, { more: {} }, { facts: [] }];
    expect(shortBlocks(blocks)).toEqual([{ bars: {} }, { facts: [] }]);
  });
  it("keeps only the titles of steps and the first few timeline entries", () => {
    const out = shortBlocks([{ steps: [{ title: "a", text: "long" }] }, { timeline: Array.from({ length: 8 }, (_, i) => ({ when: String(i), text: "x" })) }]);
    expect(out[0].steps[0].text).toBeUndefined();
    expect(out[0].steps[0].title).toBe("a");
    expect(out[1].timeline).toHaveLength(5);
  });
  it("keeps the first paragraph block when nothing else would be left", () => {
    expect(shortBlocks([{ text: ["a"] }, { note: "n" }])).toEqual([{ text: ["a"] }]);
  });
  it("never returns an empty chapter", () => {
    expect(shortBlocks([{ note: "n" }, { more: {} }])).toHaveLength(1);
  });
});

describe("the remembered level", () => {
  beforeEach(() => setDetail("full"));
  it("starts full and can be switched", () => {
    expect(getDetail()).toBe("full");
    setDetail("short");
    expect(getDetail()).toBe("short");
    setDetail("anything else");
    expect(getDetail()).toBe("full");
  });
});
