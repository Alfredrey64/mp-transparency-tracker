import { describe, it, expect } from "vitest";
import { fitLabel, wrapWords } from "./labelFit";

// A stand-in for measuring text: every character is 0.55 of the size wide.
const measure = (text, px) => String(text).length * px * 0.55;

describe("wrapWords", () => {
  it("wraps at spaces and never splits a word", () => {
    expect(wrapWords("Housing and Local Government", 12, 90, measure)).toEqual(["Housing and", "Local", "Government"]);
  });
  it("is null when one word is wider than the space", () => { expect(wrapWords("Technology", 12, 40, measure)).toBeNull(); });
});

describe("fitLabel", () => {
  it("gives a big box the name and the figure at a large size", () => {
    const r = fitLabel({ name: "Health", value: "£216bn", w: 290, h: 350, measure });
    expect(r.mode).toBe("full");
    expect(r.size).toBe(14);
  });
  it("shrinks the text, then drops the figure, then the words, as the box gets smaller", () => {
    const sizes = [[120, 70], [100, 40], [70, 30], [30, 30]].map(([w, h]) => fitLabel({ name: "Work and Pensions", value: "£10.9bn", w, h, measure }));
    expect(sizes[0].mode).toBe("full");
    expect(sizes[2].mode === "name" || sizes[2].mode === "none").toBe(true);
    expect(sizes[3].mode).toBe("none");
  });
  it("never lets text need more room than the box has", () => {
    for (const w of [50, 70, 90, 120, 160]) for (const h of [24, 40, 60, 90]) {
      const r = fitLabel({ name: "Science and Technology", value: "£16.5bn", w, h, measure });
      if (r.mode === "none") continue;
      const availW = (w - 4 - 2 * r.pad) * 0.97;
      const lines = wrapWords("Science and Technology", r.size, availW, measure);
      expect(lines).not.toBeNull();
      expect(lines.length * r.size * 1.2 + (r.mode === "full" ? 3 + r.valueSize * 1.2 : 0)).toBeLessThanOrEqual(h - 4 - 2 * r.pad + 0.001);
    }
  });
  it("shows no label when there is no room", () => { expect(fitLabel({ name: "Justice", value: "£1bn", w: 20, h: 20, measure }).mode).toBe("none"); });
});
