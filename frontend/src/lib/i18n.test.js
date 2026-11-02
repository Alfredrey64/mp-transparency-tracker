import { describe, it, expect } from "vitest";
import { fill, t, dateLocale } from "./i18n";

describe("the site's words", () => {
  it("fills {name} markers and leaves unknown ones", () => {
    expect(fill("{n} days left", { n: 5 })).toBe("5 days left");
    expect(fill("Hello {who}", { n: 1 })).toBe("Hello {who}");
    expect(fill("plain")).toBe("plain");
  });
  it("gives the English back, in English dates", () => {
    expect(t("Your postcode")).toBe("Your postcode");
    expect(t("{n} MPs", { n: 3 })).toBe("3 MPs");
    expect(dateLocale()).toBe("en-GB");
  });
});
