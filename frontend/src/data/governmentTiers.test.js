import { describe, it, expect } from "vitest";
import { NATIONS, TIERS, CONNECTORS, VOTE_FOR, WHO_TO_CONTACT, contactAnswer } from "./governmentTiers";

describe("government tiers", () => {
  it("has a unique key and full content for every tier", () => {
    expect(new Set(TIERS.map((t) => t.key)).size).toBe(TIERS.length);
    for (const t of TIERS) {
      expect(t.does.length).toBeGreaterThan(0);
      expect(t.figure.value && t.figure.label).toBeTruthy();
      expect(Object.keys(t.here).length).toBeGreaterThan(0);
      for (const k of Object.keys(t.figureHere ?? {})) expect(t.here[k]).toBeTruthy();
    }
  });

  it("only refers to nations that exist, and explains every tier that is missing somewhere", () => {
    const keys = NATIONS.map((n) => n.key);
    for (const t of TIERS) {
      for (const k of Object.keys(t.here)) expect(keys).toContain(k);
      if (Object.keys(t.here).length < keys.length) expect(t.absentNote).toBeTruthy();
    }
  });

  it("every nation is governed by Parliament, the government and councils", () => {
    for (const n of NATIONS) {
      for (const k of ["parliament", "government", "council"]) {
        expect(TIERS.find((t) => t.key === k).here[n.key]).toBeTruthy();
      }
      expect(VOTE_FOR[n.key]).toBeTruthy();
    }
  });

  it("has a connector between each pair of tiers", () => {
    expect(CONNECTORS.length).toBe(TIERS.length - 1);
  });

  it("points every contact row at a real tier", () => {
    const keys = TIERS.map((t) => t.key);
    for (const r of WHO_TO_CONTACT) expect(keys).toContain(r.tier);
  });
});

describe("contactAnswer", () => {
  it("uses a nation's own answer, then the shared 'elsewhere' one, then England's", () => {
    const row = { england: "E", elsewhere: "X", wales: "W" };
    expect(contactAnswer(row, "england")).toBe("E");
    expect(contactAnswer(row, "wales")).toBe("W");
    expect(contactAnswer(row, "scotland")).toBe("X");
    expect(contactAnswer({ england: "E" }, "ni")).toBe("E");
  });
});
