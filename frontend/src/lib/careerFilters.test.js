import { describe, it, expect } from "vitest";
import { CAREER_FILTERS, applyCareerFilters, sortMps, careerLine, filtersForPhrase } from "./careerFilters";

// first, elected, gov, govNow, opp, commNow, commEver, lost, from
const careers = {
  1: [1987, 10, 0, 0, 4, 1, 4, 0, null],
  2: [2024, 1, 0, 0, 0, 0, 0, 2, null],
  3: [2005, 4, 6, 1, 0, 0, 2, 0, "Labour"],
};
const mps = [
  { id: 1, parliament_member_id: 1, name: "Bee", constituency: "Z" },
  { id: 2, parliament_member_id: 2, name: "Ann", constituency: "Y" },
  { id: 3, parliament_member_id: 3, name: "Cat", constituency: "X" },
  { id: 4, parliament_member_id: 4, name: "Dan", constituency: "W" },
];
const names = (l) => l.map((p) => p.name);

describe("career filters", () => {
  it("has a filter for every key it advertises", () => {
    expect(CAREER_FILTERS.map((f) => f.key)).toEqual(["firstTerm", "veteran", "minister", "govNow", "shadow", "committee", "switched", "lostFirst"]);
  });
  it("applies one filter", () => {
    expect(names(applyCareerFilters(mps, careers, ["firstTerm"]))).toEqual(["Ann"]);
    expect(names(applyCareerFilters(mps, careers, ["veteran"]))).toEqual(["Bee", "Cat"]);
    expect(names(applyCareerFilters(mps, careers, ["lostFirst"]))).toEqual(["Ann"]);
  });
  it("requires every chosen filter, and leaves out an MP with no career row", () => {
    expect(names(applyCareerFilters(mps, careers, ["minister", "govNow"]))).toEqual(["Cat"]);
    expect(names(applyCareerFilters(mps, careers, ["veteran", "minister"]))).toEqual(["Cat"]);
    expect(applyCareerFilters(mps, careers, [])).toBe(mps);
  });
});

describe("sorting and the career line", () => {
  it("sorts by length of service, newest and posts, with unknowns last", () => {
    expect(names(sortMps(mps, careers, "longest"))).toEqual(["Bee", "Cat", "Ann", "Dan"]);
    expect(names(sortMps(mps, careers, "newest"))).toEqual(["Ann", "Cat", "Bee", "Dan"]);
    expect(names(sortMps(mps, careers, "posts"))).toEqual(["Cat", "Ann", "Bee", "Dan"]);
    expect(names(sortMps(mps, careers, "constituency"))).toEqual(["Dan", "Cat", "Ann", "Bee"]);
  });
  it("describes a career in a line", () => {
    expect(careerLine(careers[1])).toBe("MP since 1987 · 10 elections won");
    expect(careerLine([2024, 1])).toBe("MP since 2024 · 1 election won");
    expect(careerLine(undefined)).toBeNull();
  });
});

describe("filtersForPhrase", () => {
  it("points a search phrase at the career filters it describes", () => {
    expect(filtersForPhrase("shadow").map((f) => f.key)).toEqual(["shadow"]);
    expect(filtersForPhrase("first term").map((f) => f.key)).toContain("firstTerm");
    expect(filtersForPhrase("minist").map((f) => f.key)).toContain("minister");
    expect(filtersForPhrase("zz")).toEqual([]);
    expect(filtersForPhrase("qqqqq")).toEqual([]);
  });
});
