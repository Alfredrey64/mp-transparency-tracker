import { describe, it, expect } from "vitest";
import { officeSite, cleanUrl, placeOf } from "./repLinks.js";

describe("officeSite", () => {
  const held = [
    { label: "member of the 58th Parliament of the United Kingdom", url: null },
    { label: "Assistant Whip", url: "https://www.gov.uk/government/ministers/assistant-government-whip" },
    { label: "Devon and Cornwall Police and Crime Commissioner", url: "http://www.devonandcornwall-pcc.gov.uk/" },
  ];
  it("finds the office for the same place despite different wording", () => {
    expect(officeSite(held, { kind: "pcc", place: "Devon, Cornwall and The Isles of Scilly" })).toBe("http://www.devonandcornwall-pcc.gov.uk/");
    expect(officeSite([{ label: "Mayor of the Tees Valley", url: "https://a.example/" }], { kind: "mayor", place: "Mayor of the Tees Valley" })).toBe("https://a.example/");
  });
  it("never gives a different post's website, or another place's office", () => {
    expect(officeSite(held, { kind: "mayor", place: "Mayor of Greater Manchester" })).toBeNull();
    expect(officeSite(held, { kind: "pcc", place: "Dorset" })).toBeNull();
    expect(officeSite([{ label: "Northumbria Police and Crime Commissioner", url: "https://old.example/" }], { kind: "mayor", place: "Mayor of the North East" })).toBeNull();
    expect(officeSite([{ label: "West Midlands Mayor", url: "https://a.example/" }], { kind: "mayor", place: "Mayor of the East Midlands" })).toBeNull();
  });
  it("gives nothing when the office has no website recorded", () => {
    expect(officeSite([{ label: "Durham Police and Crime Commissioner", url: null }], { kind: "pcc", place: "Durham" })).toBeNull();
  });
});

describe("placeOf and cleanUrl", () => {
  it("strips the wording around a place", () => {
    expect(placeOf("Mayor of the East Midlands")).toBe("east midlands");
    expect(placeOf("Cambridgeshire and Peterborough Combined Authority")).toBe("cambridgeshire and peterborough");
  });
  it("keeps only plain web addresses", () => {
    expect(cleanUrl("https://x.example/a?b=1#c")).toBe("https://x.example/a");
    expect(cleanUrl("javascript:alert(1)")).toBeNull();
    expect(cleanUrl("https://user:pw@x.example/")).toBeNull();
  });
});
