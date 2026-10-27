import { describe, it, expect } from "vitest";
import { firstSentence, shape, LEVELS } from "./level";

describe("teacher levels", () => {
  it("finds the first sentence", () => {
    expect(firstSentence("Parliament makes laws. It meets in London.")).toBe("Parliament makes laws.");
    expect(firstSentence("Is this fair? Let us see.")).toBe("Is this fair?");
    expect(firstSentence("No full stop here")).toBe("No full stop here");
    expect(firstSentence("")).toBe("");
  });
  it("does not stop inside a number or a short form", () => {
    expect(firstSentence("It costs 2.5 billion pounds. Next sentence.")).toBe("It costs 2.5 billion pounds.");
    expect(firstSentence("Dad lives at No. 10 Downing Street. He is in.")).toBe("Dad lives at No. 10 Downing Street.");
  });
  it("shortens for younger classes and leaves out the extra fact", () => {
    const s = shape({ text: "One. Two.", fact: "A fact.", title: "T" }, "younger");
    expect(s).toEqual({ text: "One.", fact: undefined, title: "T" });
  });
  it("adds a line to go further for older classes, and leaves the standard lesson as written", () => {
    expect(shape({ text: "One. Two." }, "older", "More.").further).toBe("More.");
    const std = { text: "One. Two.", fact: "F" };
    expect(shape(std, "standard", "More.")).toBe(std);
    expect(LEVELS.map((l) => l.key)).toEqual(["younger", "standard", "older"]);
  });
});
