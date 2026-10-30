import { describe, it, expect } from "vitest";
import { parseFigure } from "./figureText";

describe("parseFigure", () => {
  it("keeps the sign, decimals, commas and words around the first number", () => {
    expect(parseFigure("£241.30")).toEqual({ prefix: "£", suffix: "", value: 241.3, decimals: 2, grouped: false });
    expect(parseFigure("up to 1,100")).toEqual({ prefix: "up to ", suffix: "", value: 1100, decimals: 0, grouped: true });
    expect(parseFigure("40 of 43")).toMatchObject({ prefix: "", value: 40, suffix: " of 43" });
    expect(parseFigure("8.0 µg/m³")).toMatchObject({ value: 8, decimals: 1, suffix: " µg/m³" });
    expect(parseFigure("-1.4%")).toMatchObject({ prefix: "-", value: 1.4, suffix: "%" });
  });
  it("leaves years and text with no number alone", () => {
    expect(parseFigure("Spring 2027")).toBeNull();
    expect(parseFigure("2026")).toBeNull();
    expect(parseFigure("None yet")).toBeNull();
  });
});
