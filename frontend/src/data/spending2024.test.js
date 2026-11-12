import { describe, it, expect } from "vitest";
import { LARGE_PARTIES, LARGE_CAMPAIGNERS, SMALL_PARTIES, SMALL_CAMPAIGNERS, CANDIDATES, REPORTED_TOTAL, LARGE_TOTAL, largePartiesTotal, largeCampaignersTotal, campaignersTotal, partiesTotal, LIMIT_USED, PARTY_CATEGORIES } from "./spending2024";
import { candidateLimit, partyLimit, minimumReach, LIMITS } from "./spendLimits";

describe("2024 election spending figures", () => {
  it("add up to the totals the Electoral Commission gave", () => {
    // Larger parties and campaigners: "£69.3m".
    expect(Math.round((largePartiesTotal + largeCampaignersTotal) / 1e5) / 10).toBe(LARGE_TOTAL / 1e6);
    // Everything together: "£94.5m".
    const all = partiesTotal + campaignersTotal + CANDIDATES.spent;
    expect(Math.round(all / 1e5) / 10).toBe(REPORTED_TOTAL / 1e6);
  });
  it("lists parties biggest first", () => {
    const s = LARGE_PARTIES.map((p) => p.spent);
    expect([...s].sort((a, b) => b - a)).toEqual(s);
    expect(LARGE_CAMPAIGNERS.map((c) => c.spent)).toEqual([...LARGE_CAMPAIGNERS.map((c) => c.spent)].sort((a, b) => b - a));
  });
  it("keeps the small-spender figures the Commission gave", () => {
    expect(SMALL_PARTIES.spent + SMALL_CAMPAIGNERS.spent).toBe(1875205);
    expect(SMALL_PARTIES.count - SMALL_PARTIES.nil).toBe(53);
  });
  it("only has the two parties over 70% of their limit", () => {
    expect(LIMIT_USED.filter((p) => p.pct >= 70)).toHaveLength(2);
    expect(PARTY_CATEGORIES.unsolicited).toBeLessThan(PARTY_CATEGORIES.advertisingAndUnsolicited);
  });
});

describe("the spending limit calculators", () => {
  it("reproduce the limits in the Acts", () => {
    expect(partyLimit(LIMITS.gbSeats)).toBe(34134320); // "just over £34 million" for all 632 seats in Great Britain
    expect(candidateLimit("county", 72000)).toBeCloseTo(11390 + 0.12 * 72000, 6);
    expect(candidateLimit("borough", 72000)).toBeCloseTo(11390 + 0.08 * 72000, 6);
    expect(candidateLimit("county", 0)).toBe(11390);
  });
  it("say how many seats each nation's minimum covers", () => {
    expect(minimumReach("England")).toBe(27);
    expect(minimumReach("Scotland")).toBe(4);
    expect(minimumReach("Wales")).toBe(2);
    // One seat over the reach, the per-seat amount is the bigger one.
    expect(partyLimit(28)).toBeGreaterThan(LIMITS.party.minimum.England);
    expect(partyLimit(27)).toBeLessThan(LIMITS.party.minimum.England);
  });
});
