import { describe, expect, it } from "vitest";
import { gridToLatLon } from "./osgb.mjs";

// Points whose latitude and longitude were read from postcodes.io, which gives the grid reference and the GPS position of the same postcode.
const KNOWN = [
  { name: "SW1A 1AA", e: 529090, n: 179645, lat: 51.50101, lon: -0.141563 },
];

describe("gridToLatLon", () => {
  for (const k of KNOWN) {
    it(`places ${k.name} to within about 10 metres`, () => {
      const p = gridToLatLon(k.e, k.n);
      expect(Math.abs(p.lat - k.lat)).toBeLessThan(0.0001);
      expect(Math.abs(p.lon - k.lon)).toBeLessThan(0.0001);
    });
  }
  it("puts the grid's true origin where the Ordnance Survey says it is", () => {
    const p = gridToLatLon(400000, -100000);
    expect(p.lat).toBeCloseTo(49, 1);
    expect(p.lon).toBeCloseTo(-2, 1);
  });
});
