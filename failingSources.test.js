import { describe, expect, it } from "vitest";
import { failingInBoth } from "./failingSources.js";

const status = (failed, all = ["Bills", "Petitions", "Votes"]) => ({ sources: all.map((label) => ({ label, succeeded: !failed.includes(label) })) });

describe("failingInBoth", () => {
  it("names only the sources that failed on both runs", () => {
    expect(failingInBoth(status(["Bills", "Votes"]), status(["Bills"]))).toEqual(["Bills"]);
  });
  it("names nothing when the failures were different, or there were none", () => {
    expect(failingInBoth(status(["Bills"]), status(["Votes"]))).toEqual([]);
    expect(failingInBoth(status([]), status(["Bills"]))).toEqual([]);
  });
  it("copes with a missing earlier status", () => {
    expect(failingInBoth(status(["Bills"]), undefined)).toEqual([]);
  });
});
