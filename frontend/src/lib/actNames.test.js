import { describe, it, expect } from "vitest";
import { splitActNames } from "./actNames";
import { LANDMARK_VOTES } from "./politicalHistoryData";

const bolds = (t) => splitActNames(t).filter((p) => p.bold).map((p) => p.text);
const rejoin = (t) => splitActNames(t).map((p) => p.text).join("");

describe("act names", () => {
  it("finds names with years and brackets", () => {
    expect(bolds("The Parliament Act 1911 reduced the Lords.")).toEqual(["Parliament Act 1911"]);
    expect(bolds("Passed the Representation of the People (Equal Franchise) Act 1928 in July.")).toEqual(["Representation of the People (Equal Franchise) Act 1928"]);
    expect(bolds("Repealed the Stamp Act a year later.")).toEqual(["Stamp Act"]);
    expect(bolds("His third ministry passed the Second Reform Act 1867.")).toEqual(["Second Reform Act 1867"]);
  });
  it("ignores a bare Act", () => {
    expect(bolds("Passed the Act without a division.")).toEqual([]);
  });
  it("never changes the words", () => {
    for (const v of LANDMARK_VOTES) {
      expect(rejoin(v.detail)).toBe(v.detail);
      expect(rejoin(v.title)).toBe(v.title);
    }
  });
});
