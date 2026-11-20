import { describe, it, expect } from "vitest";
import { csvLine, monthOf, buildHousePrices } from "./housePrices.js";

const HEAD = "Date,RegionName,AreaCode,AveragePrice,Index,IndexSA,1m%Change,12m%Change,AveragePriceSA,SalesVolume,DetachedPrice,DetachedIndex,Detached1m%Change,Detached12m%Change,SemiDetachedPrice,SemiDetachedIndex,SemiDetached1m%Change,SemiDetached12m%Change,TerracedPrice,TerracedIndex,Terraced1m%Change,Terraced12m%Change,FlatPrice,FlatIndex,Flat1m%Change,Flat12m%Change";
const row = (date, name, code, price, c12, sales, d, s, t, f) => `${date},${name},${code},${price},100,,0,${c12},,${sales},${d},0,0,0,${s},0,0,0,${t},0,0,0,${f},0,0,0`;

describe("csvLine", () => {
  it("splits plain lines and keeps quoted commas together", () => {
    expect(csvLine("a,b,,c")).toEqual(["a", "b", "", "c"]);
    expect(csvLine('01/01/2004,"Bournemouth, Christchurch and Poole",E06000058,100')).toEqual(["01/01/2004", "Bournemouth, Christchurch and Poole", "E06000058", "100"]);
    expect(csvLine('x,"say ""hi""",y')).toEqual(["x", 'say "hi"', "y"]);
  });
});
describe("monthOf", () => { it("reads day/month/year", () => { expect(monthOf("01/09/2026")).toBe("2026-09"); expect(monthOf("nonsense")).toBeNull(); }); });

describe("buildHousePrices", () => {
  const text = [
    HEAD,
    row("01/09/2024", "Bristol", "E06000023", 350000, 1, 400, 600000, 400000, 330000, 250000),
    row("01/09/2025", "Bristol", "E06000023", 360000, 2.9, 380, 610000, 410000, 340000, 255000),
    row("01/08/2026", "Bristol", "E06000023", 369000, 2, 350, 620000, 420000, 345000, 258000),
    row("01/09/2026", "Bristol", "E06000023", 372000, 3.3, "", 625000, 424000, 348000, 260000),
    row("01/09/2026", "England", "E92000001", 300000, 1.5, 70000, 500000, 320000, 270000, 230000),
    row("01/09/2026", "Somewhere Region", "E12000009", 330000, 2, 9000, 1, 1, 1, 1),
    row("01/09/2026", "Not an area", "K03000001", 1, 1, 1, 1, 1, 1, 1),
  ].join("\n");
  const r = buildHousePrices(text, { years: 3 });
  it("finds the latest month and the same month in earlier years", () => {
    expect(r.month).toBe("2026-09");
    expect(r.years).toEqual([2024, 2025, 2026]);
    expect(r.areas.E06000023.h).toEqual([350000, 360000, 372000]);
  });
  it("keeps price, change and kinds of home, and takes sales from the latest month that has them", () => {
    expect(r.areas.E06000023).toMatchObject({ n: "Bristol", p: 372000, c: 3.3, s: 350, sm: "2026-08", t: { d: 625000, s: 424000, t: 348000, f: 260000 } });
  });
  it("keeps the nation and region for comparison and drops other kinds of area", () => {
    expect(r.areas.E92000001.p).toBe(300000);
    expect(r.areas.E12000009).toBeTruthy();
    expect(r.areas.K03000001).toBeUndefined();
  });
  it("refuses a file that is not what it expected", () => {
    expect(() => buildHousePrices("a,b\n1,2")).toThrow(/no Date column|no .* column/);
    expect(() => buildHousePrices(HEAD)).toThrow();
  });
});
