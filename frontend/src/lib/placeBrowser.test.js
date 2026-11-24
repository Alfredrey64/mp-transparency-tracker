import { describe, it, expect } from "vitest";
import { normalise, matches, byMiles, byName, browse, countLine } from "./placeBrowser";

describe("searching places", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalise("St. Anthony's Café")).toBe("st anthony s cafe");
  });
  it("needs every word typed, in any order, and matches everything when empty", () => {
    expect(matches("goan cafe", ["St Anthony Goan Cafe"])).toBe(true);
    expect(matches("cafe goan", ["St Anthony Goan Cafe"])).toBe(true);
    expect(matches("goan pub", ["St Anthony Goan Cafe"])).toBe(false);
    expect(matches("", ["anything"])).toBe(true);
    expect(matches("  ", [])).toBe(true);
    expect(matches("ub2", ["Kings Express", "UB2 5AR"])).toBe(true);
  });
});

describe("ordering places", () => {
  const places = [{ name: "B", miles: 0.8 }, { name: "A", miles: 1.0 }, { name: "D", miles: 0.5 }, { name: "C", miles: 0.8 }];
  it("puts the nearest first and breaks ties by name", () => {
    expect([...places].sort(byMiles).map((p) => p.name)).toEqual(["D", "B", "C", "A"]);
  });
  it("orders by name and falls back to distance", () => {
    expect([...places].sort(byName).map((p) => p.name)).toEqual(["A", "B", "C", "D"]);
  });
  it("browses: filters by the fields given, then sorts", () => {
    expect(browse(places, { query: "c", compare: byMiles }).map((p) => p.name)).toEqual(["C"]);
    expect(browse(places, { compare: byMiles })).toHaveLength(4);
    expect(browse(null)).toEqual([]);
  });
});

describe("the count line", () => {
  const noun = { one: "business", many: "businesses" };
  it("says how many are showing, and what the search was", () => {
    expect(countLine({ shown: 5, total: 23, noun, query: "", order: "nearest first" })).toBe("5 of 23 businesses, nearest first");
    expect(countLine({ shown: 1, total: 1, noun, query: "goan", order: "nearest first" })).toBe("1 business matching “goan”, nearest first");
  });
});
