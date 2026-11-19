import { describe, it, expect } from "vitest";
import { parseCsvText, claimantsFrom, payFrom, economyFile } from "./localEconomy.js";

const claim = [
  '"GEOGRAPHY_CODE","GEOGRAPHY_NAME","DATE_NAME","MEASURE","OBS_VALUE"',
  '"E14001101","Bishop Auckland","October 2026","1",1885',
  '"E14001101","Bishop Auckland","October 2026","2",3.4',
  '"E14001101","Bishop Auckland","October 2025","2",3.1',
  '"E92000001","England","October 2026","2",4.1',
  '"E92000001","England","October 2025","2",3.9',
  "",
].join("\n");
const pay = [
  '"GEOGRAPHY_CODE","GEOGRAPHY_NAME","DATE_NAME","OBS_VALUE","OBS_STATUS_NAME"',
  '"E14001101","Bishop Auckland","2025",34740,"Normal Value"',
  '"E14001101","Bishop Auckland","2024",33000,"Normal Value"',
  '"E14001106","Blaydon and Consett","2025",,"Normal Value"',
  '"E14001107","Other","2025",30000,"Estimate not available"',
  '"E92000001","England","2025",39298,"Normal Value"',
  "",
].join("\n");

describe("local economy", () => {
  it("reads Nomis csv", () => {
    expect(parseCsvText(claim)).toHaveLength(5);
    expect(parseCsvText(claim)[0].GEOGRAPHY_NAME).toBe("Bishop Auckland");
  });
  it("reads claimants for the latest month and a year before", () => {
    const c = claimantsFrom(parseCsvText(claim));
    expect(c.now).toBe("October 2026");
    expect(c.before).toBe("October 2025");
    expect(c.places.E14001101).toEqual({ name: "Bishop Auckland", now: { count: 1885, rate: 3.4 }, before: { rate: 3.1 } });
  });
  it("reads pay for the latest year and the one before, skipping unreliable or missing values", () => {
    const p = payFrom(parseCsvText(pay));
    expect(p.year).toBe("2025");
    expect(p.places.E14001101).toEqual({ name: "Bishop Auckland", now: 34740, before: 33000 });
    expect(p.places.E14001106).toBeUndefined();
    expect(p.places.E14001107).toBeUndefined();
  });
  it("builds one record for each constituency and England's figures", () => {
    const c = claimantsFrom(parseCsvText(claim));
    const p = payFrom(parseCsvText(pay));
    const f = economyFile(c, p, c.places.E92000001, p.places.E92000001);
    expect(Object.keys(f.seats)).toEqual(["E14001101"]);
    expect(f.seats.E14001101).toEqual({ n: "Bishop Auckland", c: 1885, r: 3.4, rb: 3.1, p: 34740, pb: 33000 });
    expect(f.england).toEqual({ r: 4.1, rb: 3.9, p: 39298, pb: null });
  });
});
