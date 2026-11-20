import { describe, it, expect } from "vitest";
import { repKey, repPhoto, repSite } from "./repPortrait";

describe("repKey", () => {
  it("is the kind and a plain lower-case name", () => {
    expect(repKey("pcc", "Clare Moody")).toBe("pcc:clare-moody");
    expect(repKey("msp", "Màiri McAllan")).toBe("msp:mairi-mcallan");
    expect(repKey("mla", "  Trevor  Clarke ")).toBe("mla:trevor-clarke");
  });
});

describe("repPhoto", () => {
  const list = { "pcc:clare-moody": { file: "pcc-clare-moody.webp", source: "Wikimedia Commons", credit: "A. Person", licence: "CC BY 3.0", page: "https://en.wikipedia.org/wiki/Clare_Moody" }, "msp:jenni-minto": { file: "msp-jenni-minto.webp", source: "Scottish Parliament", credit: "Scottish Parliament" } };
  it("returns the path and the credit details, or null when there is no photo", () => {
    expect(repPhoto(list, "pcc", "Clare Moody")).toEqual({ src: "/portraits/reps/pcc-clare-moody.webp", credit: "A. Person", licence: "CC BY 3.0", source: "Wikimedia Commons", page: "https://en.wikipedia.org/wiki/Clare_Moody" });
    expect(repPhoto(list, "msp", "Jenni Minto")).toMatchObject({ credit: "Scottish Parliament", licence: null, page: null });
    expect(repPhoto(list, "pcc", "Nobody Here")).toBeNull();
    expect(repPhoto(null, "pcc", "Clare Moody")).toBeNull();
  });
});

describe("repSite", () => {
  const links = { "msp:mairi-mcallan": { url: "https://www.parliament.scot/msps/current-and-previous-msps/mairi-mcallan", office: "Scottish Parliament" }, "pcc:bad": { url: "http://insecure.example/" } };
  it("returns the saved https address for the same kind and name", () => {
    expect(repSite(links, "msp", "Màiri McAllan")).toEqual({ url: "https://www.parliament.scot/msps/current-and-previous-msps/mairi-mcallan", office: "Scottish Parliament" });
  });
  it("returns null for another kind, an unknown name, no list, or a non-https address", () => {
    expect(repSite(links, "mla", "Màiri McAllan")).toBeNull();
    expect(repSite(links, "msp", "Someone Else")).toBeNull();
    expect(repSite(null, "msp", "Màiri McAllan")).toBeNull();
    expect(repSite(links, "pcc", "Bad")).toBeNull();
  });
});
