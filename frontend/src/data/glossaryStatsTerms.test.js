import { describe, it, expect } from "vitest";
import { findMentions } from "../components/glossEngine";
import { STATISTICS_TERMS, PROCEDURE_TERMS, POLITICS_TERMS, keysFor, normaliseKey } from "./glossaryTerms";

describe("statistics glossary", () => {
  it("has a short definition for every term", () => {
    expect(STATISTICS_TERMS.length).toBeGreaterThan(40);
    for (const t of STATISTICS_TERMS) {
      expect(t.def.length, t.term).toBeGreaterThan(40);
      expect(t.def.length, t.term).toBeLessThan(420);
    }
  });

  it("does not share a name with a political or parliamentary term", () => {
    const taken = new Set([...PROCEDURE_TERMS, ...POLITICS_TERMS].flatMap(keysFor).map(normaliseKey));
    const clashes = STATISTICS_TERMS.flatMap((t) => keysFor(t).filter((k) => taken.has(normaliseKey(k))).map((k) => `${t.term}: ${k}`));
    expect(clashes).toEqual([]);
  });

  it("does not repeat a name inside the group", () => {
    const seen = new Map();
    const dupes = [];
    for (const t of STATISTICS_TERMS) for (const k of keysFor(t).map(normaliseKey)) {
      if (seen.has(k) && seen.get(k) !== t.term) dupes.push(`${k}: ${seen.get(k)} / ${t.term}`);
      seen.set(k, t.term);
    }
    expect(dupes).toEqual([]);
  });

  it("underlines the statistical terms the numbers pages use, but not everyday words", () => {
    const found = findMentions("GDP grew, CPI inflation eased and the ONS revised the Labour Force Survey. Rents and debt are up.");
    expect(found).toEqual(expect.arrayContaining(["GDP (Gross Domestic Product)", "CPI (Consumer Prices Index)", "Labour Force Survey (LFS)", "Official Statistics"]));
    expect(found).not.toContain("Inflation");
    expect(found).not.toContain("Revision");
  });
});
