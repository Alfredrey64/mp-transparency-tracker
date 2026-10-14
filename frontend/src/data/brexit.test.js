import { describe, expect, it } from "vitest";
import { EU_SHARES, FOOD_PRICES, GDP_ESTIMATES, MIGRATION, NBER_EFFECTS, OBR, OPINION, OPTIONS, REFERENDUM, SOURCES, TIMELINE, TRADE_DEALS, TRADE_Q4_2025 } from "./brexit";

describe("Brexit page data", () => {
  it("names a real source for every estimate and deal", () => {
    for (const s of Object.values(SOURCES)) { expect(s.url).toMatch(/^https:\/\//); expect(s.label.length).toBeGreaterThan(15); }
    for (const e of GDP_ESTIMATES) { expect(SOURCES[e.source], e.id).toBeTruthy(); expect(e.who.length).toBeGreaterThan(5); expect(e.kind.length).toBeGreaterThan(5); }
    for (const d of TRADE_DEALS) expect(SOURCES[d.source], d.name).toBeTruthy();
  });
  it("has the referendum result adding up", () => {
    expect(REFERENDUM.leave + REFERENDUM.remain).toBe(33551983);
    expect(REFERENDUM.leavePct + REFERENDUM.remainPct).toBeCloseTo(100, 0);
    expect(Math.round((REFERENDUM.leave / (REFERENDUM.leave + REFERENDUM.remain)) * 1000) / 10).toBe(REFERENDUM.leavePct);
    const [england, wales, scotland, ni] = REFERENDUM.byNation;
    expect([england.leave > 50, wales.leave > 50, scotland.leave < 50, ni.leave < 50]).toEqual([true, true, true, true]);
  });
  it("keeps estimates in order, in the right direction, and the kinds apart", () => {
    for (const e of GDP_ESTIMATES) expect(e.low).toBeLessThan(e.high);
    const measured = GDP_ESTIMATES.filter((e) => e.high < 0);
    expect(measured.length).toBeGreaterThanOrEqual(2);
    expect(GDP_ESTIMATES.find((e) => e.id === "minford").kind).toMatch(/model/i);
    expect(OBR).toMatchObject({ productivity: 4, trade: 15 });
    for (const e of NBER_EFFECTS) expect(e.low).toBeLessThanOrEqual(e.high);
  });
  it("has trade figures that agree with the ONS shares", () => {
    const t = TRADE_Q4_2025;
    expect(Math.round((t.exportsEu / (t.exportsEu + t.exportsNonEu)) * 100)).toBe(48);
    expect(Math.round((t.importsEu / (t.importsEu + t.importsNonEu)) * 100)).toBe(53);
    expect(t.exportsEu + t.exportsNonEu).toBeCloseTo(91.5, 0);
    expect(EU_SHARES.uk.exports.to).toBeLessThan(EU_SHARES.uk.exports.from);
    expect(EU_SHARES.uk.imports.to).toBeLessThan(EU_SHARES.uk.imports.from);
  });
  it("has migration figures that add up to the net total, within rounding", () => {
    expect(Math.abs(MIGRATION.euNet + MIGRATION.nonEuNet + MIGRATION.britishNet - MIGRATION.net)).toBeLessThanOrEqual(1000);
    expect(MIGRATION.net).toBeLessThan(MIGRATION.netPeak);
  });
  it("has opinion figures that can be shown as shares of 100", () => {
    expect(OPINION.wrong + OPINION.right).toBeLessThan(100);
    expect(OPINION.leaveVotersStandBy + OPINION.leaveVotersNowWrong).toBeLessThanOrEqual(100);
    expect(FOOD_PRICES.riseWithBrexit).toBeGreaterThan(FOOD_PRICES.withoutBrexit);
  });
  it("lists the dates in order with plain wording, and does not state a current position without a date", () => {
    expect(TIMELINE.length).toBeGreaterThanOrEqual(8);
    expect(TIMELINE[0].date).toBe("23 June 2016");
    expect(OPTIONS).toHaveLength(5);
    const all = JSON.stringify({ TIMELINE, OPTIONS, GDP_ESTIMATES });
    expect(all).not.toMatch(/—|–|→/);
    expect(TIMELINE.at(-1).text).toMatch(/In January 2026 the government said/);
    expect(OPTIONS.at(-1).text).toMatch(/In January 2026/);
  });
});
