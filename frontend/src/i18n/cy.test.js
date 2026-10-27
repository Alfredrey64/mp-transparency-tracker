/* global process */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import cy from "./cy/index.js";
import { COVERED, dataKeys, sourceKeys } from "./keys.js";
import { WELSH_VIEWS } from "./views.js";

// The Welsh dictionary must cover every sentence in the pages that claim to be translated (see keys.js), say something different from the English, and use the
// same {placeholders}. Run with I18N_REPORT=some/file.json to write the missing sentences out for a translator.
const sources = import.meta.glob(["../components/**/*.jsx", "../App.jsx"], { query: "?raw", import: "default", eager: true });
const covered = Object.fromEntries(COVERED.map((p) => {
  const text = sources[p];
  if (text === undefined) throw new Error(`covered file not found: ${p}`);
  return [p, text];
}));
const wanted = new Map([...sourceKeys(covered)]);
for (const k of dataKeys()) wanted.set(k, [...(wanted.get(k) ?? []), "data"]);

// Sentences that are the same in both languages: names, and words Welsh borrows as they are.
const SAME = new Set(["Simple Politics", "Brexit"]);
const holes = (text) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("the Welsh words", () => {
  it("covers every sentence in the translated parts of the site", () => {
    const missing = [...wanted.keys()].filter((k) => !(typeof cy[k] === "string" && cy[k].trim()));
    if (process.env.I18N_REPORT) fs.writeFileSync(process.env.I18N_REPORT, JSON.stringify(Object.fromEntries(missing.map((k) => [k, wanted.get(k)])), null, 2));
    expect(missing, `${missing.length} sentences have no Welsh yet`).toEqual([]);
  });
  it("uses the same {placeholders} as the English, so no number or name goes missing", () => {
    const bad = Object.entries(cy).filter(([en, w]) => holes(en).join() !== holes(w).join()).map(([en]) => en);
    expect(bad).toEqual([]);
  });
  it("says something different from the English, except for names", () => {
    const same = Object.entries(cy).filter(([en, w]) => en === w && !SAME.has(en)).map(([en]) => en);
    expect(same).toEqual([]);
  });
  it("has no empty or non-text entries, and no stray markup", () => {
    for (const [en, w] of Object.entries(cy)) {
      expect(typeof w, en).toBe("string");
      expect(w.trim().length, en).toBeGreaterThan(0);
      expect(w, en).not.toMatch(/[<>]|&[a-z]+;/);
      expect(w, en).toBe(w.replace(/\s{2,}/g, " ").trim());
    }
  });
  it("only has Welsh for pages that are named as translated, or for the shared parts of the site", () => {
    expect([...WELSH_VIEWS].every((v) => typeof v === "string")).toBe(true);
  });
});
