import { describe, it, expect, beforeEach } from "vitest";
import { clean, initialLang, fill, translate, KEY, LANGS } from "./i18n";

const store = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

describe("language choice", () => {
  it("only ever allows English or Welsh", () => {
    expect(LANGS).toEqual(["en", "cy"]);
    expect(clean("cy")).toBe("cy");
    expect(clean("fr")).toBe("en");
    expect(clean(undefined)).toBe("en");
    expect(clean({})).toBe("en");
  });
  describe("initialLang", () => {
    let s;
    beforeEach(() => { s = store(); });
    it("starts in English with nothing saved", () => {
      expect(initialLang("", s)).toBe("en");
    });
    it("uses the saved choice", () => {
      s.setItem(KEY, "cy");
      expect(initialLang("", s)).toBe("cy");
    });
    it("lets the address override what is saved, in either direction", () => {
      s.setItem(KEY, "cy");
      expect(initialLang("?lang=en", s)).toBe("en");
      expect(initialLang("?lang=cy", store())).toBe("cy");
    });
    it("ignores anything else in the address", () => {
      expect(initialLang("?lang=klingon", s)).toBe("en");
      expect(initialLang("?lang=%E0%A4%A", s)).toBe("en");
    });
    it("copes with storage that throws", () => {
      const bad = { getItem() { throw new Error("blocked"); } };
      expect(initialLang("", bad)).toBe("en");
    });
  });
});

describe("translate", () => {
  const words = { "Your postcode": "Eich cod post", "{n} days to go": "{n} diwrnod i fynd", Empty: "" };
  it("gives the Welsh when there is some", () => {
    expect(translate(words, "Your postcode")).toBe("Eich cod post");
  });
  it("gives the English when there is no dictionary, no entry or an empty entry", () => {
    expect(translate(null, "Your postcode")).toBe("Your postcode");
    expect(translate(words, "Something new")).toBe("Something new");
    expect(translate(words, "Empty")).toBe("Empty");
  });
  it("fills in values, in either language", () => {
    expect(translate(words, "{n} days to go", { n: 5 })).toBe("5 diwrnod i fynd");
    expect(translate(null, "{n} days to go", { n: 5 })).toBe("5 days to go");
  });
  it("does not trip over words that look like object keys", () => {
    expect(translate(words, "constructor")).toBe("constructor");
    expect(translate(words, "toString")).toBe("toString");
  });
  it("leaves a marker alone when no value is given for it", () => {
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});
