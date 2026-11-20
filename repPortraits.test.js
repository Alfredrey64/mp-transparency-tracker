import { describe, it, expect } from "vitest";
import { wikiTitleFor, freeLicence, creditFrom } from "./repPortraits.js";

describe("wikiTitleFor", () => {
  const text = "|[[Clare Moody (politician)|Clare Moody]]\n|[[Dan Price]]\n|{{sortname|Andy|Burnham}}\n|{{sortname|Tim|Passmore|Tim Passmore (politician)}}";
  it("follows the link the list uses, and falls back to the name", () => {
    expect(wikiTitleFor(text, "Clare Moody")).toBe("Clare Moody (politician)");
    expect(wikiTitleFor(text, "Dan Price")).toBe("Dan Price");
    expect(wikiTitleFor(text, "Andy Burnham")).toBe("Andy Burnham");
    expect(wikiTitleFor(text, "Tim Passmore")).toBe("Tim Passmore (politician)");
    expect(wikiTitleFor(text, "Someone Else")).toBe("Someone Else");
  });
});

describe("freeLicence", () => {
  it("accepts free licences and refuses everything else", () => {
    expect(freeLicence({ LicenseShortName: { value: "CC BY-SA 4.0" } })).toBe("CC BY-SA 4.0");
    expect(freeLicence({ LicenseShortName: { value: "CC BY 3.0" } })).toBe("CC BY 3.0");
    expect(freeLicence({ LicenseShortName: { value: "Public domain" } })).toBe("Public domain");
    expect(freeLicence({ LicenseShortName: { value: "OGL v3.0" } })).toBe("OGL v3.0");
    expect(freeLicence({ LicenseShortName: { value: "Fair use" } })).toBeNull();
    expect(freeLicence({ LicenseShortName: { value: "CC BY 3.0" }, NonFree: { value: "true" } })).toBeNull();
    expect(freeLicence(undefined)).toBeNull();
  });
});

describe("creditFrom", () => {
  it("makes plain text of the photographer, and shortens a long one", () => {
    expect(creditFrom({ Artist: { value: '<a href="x">Jane &amp; Co</a>' } })).toBe("Jane & Co");
    expect(creditFrom({})).toBe("Wikimedia Commons contributor");
    expect(creditFrom({ Artist: { value: "x".repeat(100) } }).length).toBeLessThanOrEqual(70);
  });
});
