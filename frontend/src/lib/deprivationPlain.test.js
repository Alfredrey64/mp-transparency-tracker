import { describe, it, expect } from "vitest";
import { oneIn, oneInShort, againstFair, sentenceFor } from "./deprivationPlain";

describe("plain percentages", () => {
  it("turns shares into 'in' phrases", () => {
    expect(oneIn(10)).toBe("about 1 in 10");
    expect(oneIn(21)).toBe("about 1 in 5");
    expect(oneIn(33)).toBe("about 1 in 3");
    expect(oneIn(50)).toBe("about half");
    expect(oneIn(64.8)).toBe("about 2 in 3");
    expect(oneIn(3)).toBe("about 1 in 35");
    expect(oneIn(0)).toBe("almost none");
    expect(oneInShort(25)).toBe("1 in 4");
  });
  it("compares with a fair share", () => {
    expect(againstFair(21).text).toBe("twice");
    expect(againstFair(34).text).toBe("3.4 times");
    expect(againstFair(10).text).toBe("about the same as");
    expect(againstFair(3.3).text).toBe("well under half of");
  });
  it("makes a sentence", () => {
    expect(sentenceFor(21)).toBe("about 1 in 5 people (21%) live in the most deprived tenth, twice the fair share");
  });
});
