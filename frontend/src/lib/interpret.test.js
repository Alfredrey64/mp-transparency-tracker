import { describe, it, expect } from "vitest";
import { percentileOf, bandFor, describeAmongMps, describeAgainst, describeSpread } from "./interpret";

const gbp = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const pct = (n) => `${Math.round(n)}%`;
const hundred = Array.from({ length: 100 }, (_, i) => i + 1);

describe("percentileOf", () => {
  it("places a value among the others", () => {
    expect(percentileOf(hundred, 91)).toBeCloseTo(90.5, 5);
    expect(percentileOf(hundred, 1)).toBeCloseTo(0.5, 5);
    expect(percentileOf([], 5)).toBeNull();
    expect(percentileOf(hundred, NaN)).toBeNull();
  });
  it("puts a run of identical values in the middle of the run", () => {
    expect(percentileOf([0, 0, 0, 0, 10], 0)).toBe(40);
  });
});

describe("bands", () => {
  it("names the five places a figure can sit", () => {
    expect([95, 80, 50, 15, 3].map((p) => bandFor(p).label)).toEqual(["Unusually high", "Higher than most", "About typical", "Lower than most", "Unusually low"]);
  });
});

describe("describeAmongMps", () => {
  const lead = (v) => `This MP has declared ${v}`;
  it("says what share of MPs a high figure is above, in a sentence about this MP", () => {
    const r = describeAmongMps({ value: 95, sorted: hundred, format: pct, lead });
    expect(r.marker).toBe("Unusually high");
    expect(r.tone).toBe("high");
    expect(r.text).toContain("This MP has declared 95%, which is higher than 94% of MPs.");
    expect(r.text).toContain("The typical MP is at 51%.");
  });
  it("says what share are higher for a low figure, and 'typical' for a middling one", () => {
    expect(describeAmongMps({ value: 5, sorted: hundred, format: pct, lead }).text).toContain("This MP has declared 5%, which is lower than 95% of MPs.");
    expect(describeAmongMps({ value: 50, sorted: hundred, format: pct, lead }).text).toContain("which is typical: about as many MPs are above this as below it.");
  });
  it("uses its own typical-MP wording", () => {
    const r = describeAmongMps({ value: 50, sorted: hundred, format: pct, typical: (v) => `The typical MP has declared ${v}` });
    expect(r.text).toContain("The typical MP has declared 51%.");
  });
  it("handles a distribution where most MPs are at zero", () => {
    const sorted = [...Array(80).fill(0), ...Array.from({ length: 20 }, (_, i) => (i + 1) * 1000)];
    const none = describeAmongMps({ value: 0, sorted, format: gbp, zero: "have declared nothing", zeroSelf: "This MP has declared nothing" });
    expect(none.marker).toBe("About typical");
    expect(none.text).toBe("This MP has declared nothing, like about half of MPs.");
    const high = describeAmongMps({ value: 19000, sorted, format: gbp, zero: "have declared nothing", lead });
    expect(high.marker).toBe("Unusually high");
    expect(high.text).toContain("Half of MPs have declared nothing.");
  });
  it("returns null with nothing to compare", () => {
    expect(describeAmongMps({ value: 1, sorted: [], format: pct })).toBeNull();
  });
});

describe("describeAgainst", () => {
  const pct = (n) => `${n}%`;
  it("compares with a yardstick in plain words", () => {
    const high = describeAgainst({ value: 60.6, reference: 16.3, format: pct, what: "The lead", yardstick: "the UK average" });
    expect(high.marker).toBe("Well above average");
    expect(high.text).toBe("The lead of 60.6% is well above the UK average (16.3%).");
    expect(describeAgainst({ value: 16, reference: 16.3, format: pct, what: "The lead", yardstick: "the UK average" }).marker).toBe("About average");
    expect(describeAgainst({ value: 15, reference: 16.3, format: pct, what: "The lead", yardstick: "the UK average" }).marker).toBe("Slightly below average");
    expect(describeAgainst({ value: 19, reference: 16.3, format: pct, what: "The lead", yardstick: "the UK average" }).marker).toBe("Above average");
    expect(describeAgainst({ value: 5, reference: 16.3, format: pct, what: "The lead", yardstick: "the UK average" }).text).toContain("well below");
    expect(describeAgainst({ value: 5, reference: 0, format: pct, what: "x", yardstick: "y" })).toBeNull();
  });
});

describe("describeSpread", () => {
  it("sums up a whole distribution in one line", () => {
    expect(describeSpread({ sorted: hundred, format: pct })).toBe("The middle MP is at 51%; one in ten is above 91%.");
    expect(describeSpread({ sorted: [0, 0, 0, 10], format: gbp })).toBe("More than half of MPs have none; one in ten is above £10.");
  });
});
