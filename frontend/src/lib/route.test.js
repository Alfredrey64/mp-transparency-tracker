import { describe, expect, it } from "vitest";
import { hashToPath, pathOf } from "./route";

describe("page addresses", () => {
  it("turns old hash addresses into paths and leaves everything else alone", () => {
    expect(hashToPath("#/taxRates/vat")).toBe("/taxRates/vat");
    expect(hashToPath("#/constituency/Holborn%20and%20St%20Pancras")).toBe("/constituency/Holborn%20and%20St%20Pancras");
    expect(hashToPath("#/")).toBe("/");
    expect(hashToPath("/taxRates")).toBe("/taxRates");
    expect(hashToPath("#s-chart")).toBe("#s-chart");
    expect(hashToPath(undefined)).toBeUndefined();
    expect(pathOf("#/mp/12")).toBe("/mp/12");
    expect(pathOf("")).toBe("/");
  });
});
