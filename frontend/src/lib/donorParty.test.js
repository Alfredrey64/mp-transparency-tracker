import { describe, it, expect } from "vitest";
import { canonicalParty } from "./donorParty";

describe("canonicalParty", () => {
  it("matches the Electoral Commission's names to the site's party names", () => {
    expect(canonicalParty("Conservative and Unionist Party")).toBe("Conservative Party");
    expect(canonicalParty("Labour Party")).toBe("Labour Party");
    expect(canonicalParty("Scottish National Party (SNP)")).toBe("Scottish National Party");
    expect(canonicalParty("Plaid Cymru - The Party of Wales")).toBe("Plaid Cymru");
    expect(canonicalParty("Reform UK")).toBe("Reform UK");
    expect(canonicalParty("Green Party")).toBe("Green Party");
    expect(canonicalParty("Alliance - Alliance Party of Northern Ireland")).toBe("Alliance");
  });
  it("does not mistake the SDLP for Labour, or a Scottish Green Party for the Greens", () => {
    expect(canonicalParty("Social Democratic & Labour Party")).toBe("Social Democratic & Labour Party");
    expect(canonicalParty("Social Democratic and Labour Party (SDLP)")).toBe("Social Democratic & Labour Party");
    expect(canonicalParty("Scottish Green Party")).toBeNull();
  });
  it("leaves parties it does not know unmatched", () => {
    expect(canonicalParty("Your Party")).toBeNull();
    expect(canonicalParty(undefined)).toBeNull();
  });
});
