import { describe, it, expect } from "vitest";
import { findAnswers, normalise } from "./answerSearch";
import { ANSWERS } from "../data/answers";

const top = (q) => findAnswers(q, ANSWERS)[0]?.id;

describe("answer search", () => {
  it("drops filler words and treats similar words as one", () => {
    expect(normalise("Why are houses so expensive?")).toEqual(["housing", "cost"]);
    expect(normalise("What's the Bank of England's rate")).toContain("bank");
  });

  it("finds the right answer for questions as people put them", () => {
    const cases = {
      "why is housing so expensive": "why-housing-expensive",
      "why are house prices so high": "why-housing-expensive",
      "can't afford a home": "why-housing-expensive",
      "why are rents going up": "why-rents-rising",
      "why are mortgage rates so high": "why-mortgage-rates-high",
      "why is the nhs waiting list so long": "why-nhs-waiting-list",
      "why do ambulances take so long": "why-ambulances-slow",
      "where does my tax go": "where-does-tax-go",
      "is the national debt too high": "is-debt-too-high",
      "what is the difference between debt and deficit": "debt-or-deficit",
      "how many migrants come to britain": "what-is-immigration-level",
      "why are people crossing the channel in small boats": "why-small-boats",
      "why are asylum seekers in hotels": "why-asylum-hotels",
      "why isn't the economy growing": "why-economy-slow",
      "what is a recession": "what-is-recession",
      "why haven't wages gone up": "why-wages-stagnant",
      "why are so many people on long term sick": "why-not-working",
      "is crime going up": "is-crime-rising",
      "why is the north poorer than the south": "north-south-divide",
      "is the uk on track for net zero": "is-uk-on-track-net-zero",
      "what does the bank of england do": "what-does-boe-do",
      "why are energy bills so high": "why-energy-bills-high",
      "what is gdp": "what-is-gdp",
      "what is productivity": "what-is-productivity",
    };
    for (const [q, id] of Object.entries(cases)) expect(top(q), q).toBe(id);
  });

  it("offers nothing for a question it has no answer to", () => {
    expect(findAnswers("why is the sky blue", ANSWERS)).toEqual([]);
    expect(findAnswers("", ANSWERS)).toEqual([]);
    expect(findAnswers("the of is", ANSWERS)).toEqual([]);
  });

  it("returns several when a question fits several, best first, up to the limit", () => {
    const found = findAnswers("why is everything so expensive", ANSWERS, 3);
    expect(found.length).toBeGreaterThan(1);
    expect(found.length).toBeLessThanOrEqual(3);
  });

  it("gives every answer a short answer, reasons and a unique id", () => {
    const ids = ANSWERS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ANSWERS) {
      expect(a.short.length, a.id).toBeGreaterThan(80);
      expect(a.reasons.length, a.id).toBeGreaterThanOrEqual(3);
      expect(a.facts.length, a.id).toBeGreaterThanOrEqual(1);
      expect(a.next.length, a.id).toBeGreaterThanOrEqual(1);
    }
  });
});
