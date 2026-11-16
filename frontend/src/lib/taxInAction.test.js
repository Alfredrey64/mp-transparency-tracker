import { describe, expect, it } from "vitest";
import { buildCards } from "../lib/taxInAction";

describe("What the rates mean in pounds", () => {
  const cards = buildCards("2026-11-16");
  const by = Object.fromEntries(cards.map((c) => [c.id, c]));
  it("has a card for each of the six main rates, with the rate the page shows", () => {
    expect(cards.map((c) => c.id)).toEqual(["income-tax", "national-insurance", "vat", "corporation-tax", "fuel", "council-tax"]);
    expect(by["income-tax"].rate).toBe("20%");
    expect(by.fuel.rate).toMatch(/^\d+(\.\d+)?p$/);
  });
  it("shades as many squares as the rate says", () => {
    expect(by["income-tax"]).toMatchObject({ cells: 100, tax: 20 });
    expect(by["national-insurance"].tax).toBeLessThan(by["income-tax"].tax);
    expect(by["corporation-tax"].cells).toBe(100);
    // VAT is added on top, so 20 squares of VAT sit beside 100 of price.
    expect(by.vat.cells).toBe(100 + by.vat.tax);
  });
  it("works the pound amounts out from the rates", () => {
    expect(by.fuel.take).toMatch(/^£\d+\.\d\d duty$/);
    expect(by["council-tax"].take).toMatch(/^£\d+\.\d\d a week$/);
  });
  it("never shades more squares than there are", () => {
    for (const c of cards) expect(c.tax).toBeLessThanOrEqual(c.cells);
  });
});
