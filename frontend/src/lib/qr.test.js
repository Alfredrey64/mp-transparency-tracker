import { describe, it, expect } from "vitest";
import { qrSvg, chapterLink } from "./qr";

describe("QR codes", () => {
  it("draws a square code out of rectangles only", () => {
    const svg = qrSvg("https://simple-politics.vercel.app/teacher/why");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("<path");
    expect(svg).not.toMatch(/<script|<image|href=/);
    const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
    expect(w).toBe(h);
  });
  it("makes a bigger code for longer text", () => {
    const a = /viewBox="0 0 (\d+)/.exec(qrSvg("a"))[1];
    const b = /viewBox="0 0 (\d+)/.exec(qrSvg("a".repeat(120)))[1];
    expect(Number(b)).toBeGreaterThan(Number(a));
  });
  it("keeps markup characters out of the description", () => {
    expect(qrSvg('x"><script>')).not.toContain("<script>");
  });
  it("builds a chapter link", () => {
    expect(chapterLink("https://x.test/", "why")).toBe("https://x.test/teacher/why");
    expect(chapterLink("https://x.test")).toBe("https://x.test/teacher");
  });
});
