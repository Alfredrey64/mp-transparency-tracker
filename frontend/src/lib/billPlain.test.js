import { describe, it, expect } from "vitest";
import { plainPoints, plainSentence } from "./billPlain";

describe("plainPoints", () => {
  it("turns each clause of the official title into a plain point and drops the boilerplate", () => {
    expect(plainPoints("A Bill to make provision about railways and railway services; and for connected purposes.")).toEqual(["Sets rules on railways and railway services"]);
    expect(plainPoints("A Bill to require utility companies to provide social tariffs; to prohibit the sale of glue traps; and for connected purposes")).toEqual([
      "Requires utility companies to provide social tariffs",
      "Bans the sale of glue traps",
    ]);
  });
  it("swaps stock phrases for everyday ones", () => {
    expect(plainPoints("A Bill to confer powers on local authorities to require information from persons who let property")).toEqual([
      "Gives councils the power to require information from people who let property",
    ]);
    expect(plainPoints("A Bill to amend that Act and other enactments")).toEqual(["Changes that Act and other laws"]);
  });
  it("lets a bare 'about' or 'for' clause carry on from the one before", () => {
    expect(plainPoints("A Bill to make provision for licences; about enforcement; for a special regime")).toEqual([
      "Sets rules on licences", "Sets rules on enforcement", "Sets rules for a special regime",
    ]);
  });
  it("keeps a clause it does not recognise, honestly marked", () => {
    expect(plainPoints("A Bill to do a thing")).toEqual(["Aims to do a thing"]);
  });
  it("shortens a very long clause at a natural break", () => {
    const [p] = plainPoints(`A Bill to require the Secretary of State to report on ${"the effect of many different matters, ".repeat(8)}and more`);
    expect(p.length).toBeLessThanOrEqual(180);
    expect(p.endsWith("…")).toBe(true);
  });
  it("returns nothing for nothing", () => {
    expect(plainPoints("")).toEqual([]);
    expect(plainPoints(null)).toEqual([]);
  });
});

describe("plainSentence", () => {
  it("joins the first two points and says there is more", () => {
    expect(plainSentence("A Bill to ban glue traps; to require licences; to amend the Act")).toBe("Bans glue traps. Requires licences and more.");
  });
  it("gives up when the first clause is not understood, so the caller can fall back", () => {
    expect(plainSentence("A Bill to do a thing")).toBeNull();
  });
});

describe("plainSentence merging", () => {
  it("folds two points that open the same way into one", () => {
    expect(plainSentence("A Bill to make provision about payment terms; to make provision about late interest")).toBe("Sets rules on payment terms and late interest.");
    expect(plainSentence("A Bill to make provision about payment terms; to make provision about late interest; to ban retention")).toBe("Sets rules on payment terms and late interest and more.");
  });
});
