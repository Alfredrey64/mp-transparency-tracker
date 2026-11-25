import { describe, it, expect } from "vitest";
import { plainName } from "./memberLookup";

describe("plainName", () => {
  it("drops a trailing MP and a title so register names meet table names", () => {
    expect(plainName("Rosena Allin-Khan MP")).toBe("rosena allin-khan");
    expect(plainName("Dr Rosena Allin-Khan")).toBe("rosena allin-khan");
    expect(plainName("Rt Hon Sir Ed Davey MP")).toBe("ed davey");
    expect(plainName("Dame Meg Hillier")).toBe("meg hillier");
  });
  it("keeps a name that merely starts like a title", () => {
    expect(plainName("Drew Hendry")).toBe("drew hendry");
  });
  it("copes with nothing", () => {
    expect(plainName(undefined)).toBe("");
  });
});
