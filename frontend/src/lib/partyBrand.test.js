import { describe, it, expect } from "vitest";
import { bannerColours, contrast } from "./partyBrand";

const BRANDS = { Labour: "#C8102E", Conservative: "#0087DC", "Lib Dem": "#FAA61A", SNP: "#F9D71C", Green: "#6AB023", Reform: "#12B6CF", Plaid: "#005B54", DUP: "#D46A4C", "Sinn Féin": "#326760", SDLP: "#2AA82C", Alliance: "#F6CB2F", UUP: "#48A5EE" };

describe("bannerColours", () => {
  it("always gives text that meets 4.5 to 1 against the corner where the words sit", () => {
    for (const [name, hex] of Object.entries(BRANDS)) {
      const b = bannerColours(hex);
      expect(contrast(b.from, b.on), name).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("keeps a bright colour as it is and puts dark text on it, instead of darkening it to brown", () => {
    for (const hex of [BRANDS["Lib Dem"], BRANDS.SNP, BRANDS.Alliance]) {
      const b = bannerColours(hex);
      expect(b.dark, hex).toBe(true);
      expect(b.from.toLowerCase(), hex).toBe(hex.toLowerCase());
    }
  });
  it("puts white text on a deep colour, darkening it only if it must", () => {
    expect(bannerColours("#005B54")).toMatchObject({ from: "#005b54", dark: false });
    const red = bannerColours("#C8102E");
    expect(red.dark).toBe(false);
    expect(contrast(red.from, "#FFFFFF")).toBeGreaterThanOrEqual(4.6);
  });
});
