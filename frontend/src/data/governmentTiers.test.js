import { describe, it, expect } from "vitest";
import { NATIONS, TIERS, CONNECTORS, VOTE_FOR, WHO_TO_CONTACT, contactAnswer, SCENARIOS, scenarioSteps } from "./governmentTiers";

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

describe("scenarios", () => {
  const nationKeys = NATIONS.map((n) => n.key);
  it("always run top to bottom and end with you, then the vote", () => {
    const order = [...TIERS.map((t) => t.key), "you", "vote"];
    for (const sc of SCENARIOS) {
      for (const n of nationKeys) {
        const steps = scenarioSteps(sc, n);
        const idx = steps.map((s) => order.indexOf(s.tier));
        expect(idx.every((i) => i >= 0)).toBe(true);
        expect([...idx].sort((a, b) => a - b)).toEqual(idx);
        expect(steps.at(-1).tier).toBe("vote");
        expect(steps.at(-2).tier).toBe("you");
        expect(steps.length).toBeGreaterThan(3);
      }
    }
  });

  it("skips tiers that don't exist where you live", () => {
    const law = SCENARIOS.find((s) => s.key === "law");
    expect(scenarioSteps(law, "england").some((s) => s.tier === "devolved")).toBe(false);
    expect(scenarioSteps(law, "scotland").some((s) => s.tier === "combined")).toBe(false);
    expect(scenarioSteps(law, "ni").some((s) => s.tier === "parish")).toBe(false);
  });

  it("applies planning law only in England", () => {
    const estate = SCENARIOS.find((s) => s.key === "estate");
    expect(scenarioSteps(estate, "england")[0].tier).toBe("parliament");
    expect(scenarioSteps(estate, "wales")[0].tier).toBe("devolved");
  });

  it("has a token label on every tier step", () => {
    for (const sc of SCENARIOS) for (const s of sc.steps) if (s.tier !== "vote") expect(s.token).toBeTruthy();
  });
});
