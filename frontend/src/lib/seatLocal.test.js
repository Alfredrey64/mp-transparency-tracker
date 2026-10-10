import { describe, it, expect } from "vitest";
import { REGION_KEY_BY_CODE, regionSnapshot, yearsOfPay, againstUk, seatDeprivation } from "./seatLocal";
import { METRICS } from "../data/regionMetrics";

const price = METRICS.find((m) => m.id === "price");
const pay = METRICS.find((m) => m.id === "pay");

// A fake store: every region's series holds a single point, so rank and value are easy to predict.
function store(priceByRegion, payByRegion, ukPrice, ukPay) {
  const table = new Map();
  for (const [k, v] of Object.entries(priceByRegion)) table.set(`${price.series[k].sector}.${price.series[k].id}`, v);
  for (const [k, v] of Object.entries(payByRegion)) table.set(`${pay.series[k].sector}.${pay.series[k].id}`, v);
  table.set(`${price.uk.sector}.${price.uk.id}`, ukPrice);
  table.set(`${pay.uk.sector}.${pay.uk.id}`, ukPay);
  return (ref) => (table.has(`${ref.sector}.${ref.id}`) ? { points: [["2025-01", table.get(`${ref.sector}.${ref.id}`)]] } : null);
}

describe("region codes", () => {
  it("map every seat-map region to a regional key", () => {
    expect(Object.keys(REGION_KEY_BY_CODE)).toHaveLength(12);
    expect(new Set(Object.values(REGION_KEY_BY_CODE)).size).toBe(12);
  });
});

describe("regionSnapshot", () => {
  const lookup = store({ london: 600000, ne: 160000, nw: 220000 }, { london: 45000, ne: 30000, nw: 32000 }, 290000, 37000);
  const snap = regionSnapshot("london", lookup);
  it("gives this region's figure, the UK's and its rank", () => {
    const p = snap.find((s) => s.metric.id === "price");
    expect(p.value).toBe(600000);
    expect(p.uk).toBe(290000);
    expect(p.rank).toBe(1);
    expect(p.of).toBe(3);
  });
  it("leaves out a measure the region has no figure for", () => {
    expect(regionSnapshot("london", () => null)).toEqual([]);
  });
  it("works out years of pay to buy the average home", () => {
    const y = yearsOfPay(snap);
    expect(y.years).toBeCloseTo(13.33, 1);
    expect(y.ukYears).toBeCloseTo(7.84, 1);
  });
});

describe("againstUk", () => {
  it("says about the same when within 3%", () => expect(againstUk(101, 100)).toBe("about the same as the UK"));
  it("says above or below", () => {
    expect(againstUk(120, 100)).toBe("above the UK average");
    expect(againstUk(4.5, 4, { rate: true })).toBe("above the UK figure");
    expect(againstUk(40, 100)).toBe("60% below the UK average");
  });
  it("is empty without a value", () => expect(againstUk(null, 4)).toBe(""));
});

describe("seatDeprivation", () => {
  const sources = {
    england: [{ name: "Alpha", worst10: 5, score: 1 }, { name: "Beta", worst10: 30, score: 3 }, { name: "Gamma", worst10: 12, score: 2 }],
    wales: [{ name: "Cymru Seat", worst10: 8, score: 1 }],
  };
  it("ranks a seat within its own nation by the share in the worst tenth", () => {
    expect(seatDeprivation("Gamma", sources)).toMatchObject({ worst10: 12, rank: 2, of: 3, nation: "England" });
    expect(seatDeprivation("cymru seat", sources)).toMatchObject({ rank: 1, of: 1, nation: "Wales" });
  });
  it("returns null for a seat with no figures", () => expect(seatDeprivation("Nowhere", sources)).toBeNull());
});
