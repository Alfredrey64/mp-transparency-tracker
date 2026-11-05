import { describe, it, expect } from "vitest";
import { committeeColour } from "./committeeColour";

describe("committeeColour", () => {
  it("gives a committee the colour of its subject", () => {
    expect(committeeColour("Justice and Home Affairs Committee")).toBe("#7B4BA0");
    expect(committeeColour("Environment and Climate Change Committee")).toBe("#3C8D40");
  });
  it("falls back to a neutral colour for a name it does not know, or none", () => {
    expect(committeeColour("Liaison Committee")).toBe("#5B6784");
    expect(committeeColour(undefined)).toBe("#5B6784");
  });
});
