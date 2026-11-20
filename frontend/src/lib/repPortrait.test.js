import { describe, it, expect } from "vitest";
import { repKey, repPhoto } from "./repPortrait";

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
