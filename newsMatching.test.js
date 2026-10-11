import { describe, it, expect } from "vitest";
import { isLikelyMatch, searchName } from "./newsMatching.js";

describe("isLikelyMatch", () => {
  it("matches a genuine headline about the MP", () => {
    expect(isLikelyMatch("Keir Starmer defends welfare reforms in Commons clash", "Keir Starmer")).toBe(true);
  });

  // The real false positive this project shipped and fixed: a UAE cricketer
  // named Afzal Khan slipped into the MP Afzal Khan's news feed. A bare
  // substring/surname check can't tell the two apart; checking the words
  // immediately either side of the match can, in most cases — though not
  // always (a headline using an already-whitelisted verb like "hits" right
  // next to the name, e.g. a cricketer "hits a century", can still slip
  // through; that's a known, disclosed limitation, not tested here as a
  // guarantee).
  it("rejects a same-named person in an unrelated, non-political context", () => {
    expect(
      isLikelyMatch("UAE cricket board confirms Afzal Khan century helped seal victory", "Afzal Khan")
    ).toBe(false);
  });

  it("rejects the name embedded inside someone else's longer name", () => {
    expect(isLikelyMatch("Sher Afzal Khan Marwat says no to plea deal", "Afzal Khan")).toBe(false);
    expect(isLikelyMatch("Aayan Afzal Khan wins regional chess title", "Afzal Khan")).toBe(false);
  });

  it("rejects unrelated football transfer news for a same-named MP", () => {
    expect(
      isLikelyMatch("Alberto Costa set for Arsenal medical after transfer agreed", "Alberto Costa")
    ).toBe(false);
  });

  it("does not require an explicit political keyword to accept a real story", () => {
    expect(isLikelyMatch("Rachel Reeves to meet business leaders next week", "Rachel Reeves")).toBe(true);
  });

  it("rejects a headline that is nothing but the bare name", () => {
    expect(isLikelyMatch("Keir Starmer", "Keir Starmer")).toBe(false);
  });

  it("rejects a headline that does not contain the name at all", () => {
    expect(isLikelyMatch("Chancellor unveils new budget measures", "Keir Starmer")).toBe(false);
  });
});

describe("names with titles, accents and apostrophes", () => {
  it("finds a headline that leaves out the MP's title", () => {
    expect(isLikelyMatch("Iain Duncan Smith criticises welfare plans in Commons", "Sir Iain Duncan Smith")).toBe(true);
    expect(searchName("Dr Rupa Huq")).toBe("Rupa Huq");
  });
  it("treats accented and plain spellings, and curly and straight apostrophes, alike", () => {
    expect(isLikelyMatch("Sian Berry calls for rent controls", "Siân Berry")).toBe(true);
    expect(isLikelyMatch("Siân Berry calls for rent controls", "Sian Berry")).toBe(true);
    expect(isLikelyMatch("Stephen O'Brien backs the bill", "Stephen O’Brien")).toBe(true);
  });
  it("keeps a two-word name that happens to start with a title word", () => {
    expect(searchName("Hon Smith")).toBe("Hon Smith");
  });
  it("still rejects a longer name containing the plain one", () => {
    expect(isLikelyMatch("Sher Afzal Khan Marwat says no", "Sir Afzal Khan")).toBe(false);
  });
});
