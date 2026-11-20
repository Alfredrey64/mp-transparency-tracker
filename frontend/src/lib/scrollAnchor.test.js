import { describe, it, expect } from "vitest";
import { lacksScrollAnchoring, layoutTop } from "./scrollAnchor";

describe("lacksScrollAnchoring", () => {
  it("is true for Safari and for every browser on an iPhone", () => {
    expect(lacksScrollAnchoring("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15")).toBe(true);
    expect(lacksScrollAnchoring("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(lacksScrollAnchoring("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(lacksScrollAnchoring("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15")).toBe(true);
  });
  it("is false for Chrome, Edge and Firefox on their own engines", () => {
    expect(lacksScrollAnchoring("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")).toBe(false);
    expect(lacksScrollAnchoring("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36")).toBe(false);
    expect(lacksScrollAnchoring("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0")).toBe(false);
    expect(lacksScrollAnchoring("")).toBe(false);
  });
});

describe("layoutTop", () => {
  it("adds up the offsets down the chain, whatever it is drawn as", () => {
    const inner = { offsetTop: 20, offsetParent: { offsetTop: 100, offsetParent: { offsetTop: 5, offsetParent: null } } };
    expect(layoutTop(inner)).toBe(125);
    expect(layoutTop(null)).toBe(0);
  });
});
