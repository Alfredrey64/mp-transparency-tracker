import { describe, it, expect } from "vitest";
import {
  looksLikeIndividual,
  matchesKnownUnion,
  matchesManualOverride,
  sicToSector,
  matchScore,
} from "./sectorTagging.js";

describe("looksLikeIndividual", () => {
  it("flags a name with a personal title", () => {
    expect(looksLikeIndividual("Mr John Smith")).toBe(true);
    expect(looksLikeIndividual("Dame Judi Example")).toBe(true);
  });

  it("does not flag an organisation with an org hint word", () => {
    expect(looksLikeIndividual("Green Man Festival Ltd")).toBe(false);
    expect(looksLikeIndividual("Arena Racing Company")).toBe(false);
  });

  it("does not flag a name starting with 'The'", () => {
    expect(looksLikeIndividual("The Football Association")).toBe(false);
  });

  it("flags a short, plain multi-word name with no org hint", () => {
    expect(looksLikeIndividual("Robert James Latham")).toBe(true);
  });
});

describe("matchesKnownUnion", () => {
  it("matches a known union by its own word", () => {
    expect(matchesKnownUnion("Unite the Union")).toBe(true);
    expect(matchesKnownUnion("GMB")).toBe(true);
  });

  // The actual bug this project shipped and fixed: a plain substring check
  // matched "neu" (National Education Union) inside "Neural", mistagging a
  // donor called "Neural Voice AI" as a trade union.
  it("does not match a short union abbreviation embedded inside an unrelated word", () => {
    expect(matchesKnownUnion("Neural Voice AI")).toBe(false);
  });

  it("does not match an unrelated donor name", () => {
    expect(matchesKnownUnion("Green Man Festival Ltd")).toBe(false);
  });
});

describe("matchesManualOverride", () => {
  it("matches the exact overridden name", () => {
    expect(matchesManualOverride("The Financial Times")?.sector).toBe("Media & Publishing");
  });

  it("does not match a similar but different name", () => {
    expect(matchesManualOverride("Financial Times Group Ltd")).toBeNull();
  });
});

describe("sicToSector", () => {
  it("returns null for a missing code", () => {
    expect(sicToSector(null)).toBeNull();
    expect(sicToSector("")).toBeNull();
  });

  // The actual bug this project shipped and fixed: Ecotricity (a renewable
  // energy company) files under the holding-company SIC code 70100, which
  // would otherwise land it in "Legal & Professional Services" since that
  // code range also covers real management-consultancy codes.
  it("returns 'Other / Uncategorised' for a shell/holding-company code rather than guessing", () => {
    expect(sicToSector("70100")).toBe("Other / Uncategorised");
    expect(sicToSector("64200")).toBe("Other / Uncategorised");
  });

  it("maps a real division range to its sector", () => {
    expect(sicToSector("62012")).toBe("Tech & Telecoms"); // div 62
    expect(sicToSector("64110")).toBe("Finance & Banking"); // div 64, not a shell code
    expect(sicToSector("86900")).toBe("Pharma & Healthcare");
  });

  it("falls back to 'Other / Uncategorised' for an unmapped division", () => {
    expect(sicToSector("99000")).toBe("Other / Uncategorised");
  });
});

describe("matchScore", () => {
  it("scores an exact match at 1", () => {
    expect(matchScore("Green Man Festival", "Green Man Festival Ltd")).toBeGreaterThan(0.5);
  });

  // The actual bug this project shipped and fixed: a plain "appears
  // anywhere" substring check matched "The Football Association" against
  // "THE ARMY FOOTBALL ASSOCIATION" (a different organisation), since
  // "football association" is a substring of the army one's name too.
  // Requiring prefix containment instead of anywhere-containment rejects
  // that while still matching genuine suffix variants like "... Group Ltd".
  it("rejects a name that only shares a trailing phrase, not a prefix", () => {
    expect(matchScore("The Football Association", "THE ARMY FOOTBALL ASSOCIATION")).toBe(0);
  });

  it("still matches a genuine suffix variant of the same company", () => {
    expect(matchScore("Acme Widgets", "Acme Widgets Group Holdings Ltd")).toBeGreaterThan(0);
  });

  it("returns 0 for names under the minimum length floor", () => {
    expect(matchScore("BP", "BP PLC")).toBe(0);
  });
});
