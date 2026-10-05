import { describe, it, expect } from "vitest";
import { computeBenchmarks, MIN_VOTES } from "./benchmarks.js";

const now = new Date("2026-10-01");
const politicians = [
  { id: 1, party: "Labour", parliament_member_id: 11, ipsa_expenses: { year: "26_27", total: 1000.4 } },
  { id: 2, party: "Conservative", parliament_member_id: 12, ipsa_expenses: { year: "26_27", total: 3000 } },
  { id: 3, party: "Independent", parliament_member_id: 13 },
];
const interests = [
  { politician_id: 1, category: "Employment and earnings - Ad hoc payments", value_amount: 500 },
  { politician_id: 1, category: "Gifts, benefits and hospitality", value_amount: 250.4 },
  { politician_id: 2, category: "Employment and earnings", value_amount: 10000 },
  { politician_id: 2, category: "Employment and earnings", value_amount: null },
];
const votes = [];
for (let i = 0; i < MIN_VOTES; i++) {
  votes.push({ politician_id: 1, division_id: i, voted_with_party_majority: i < 2 ? false : true });
  votes.push({ politician_id: 3, division_id: i, voted_with_party_majority: false });
}
votes.push({ politician_id: 2, division_id: 0, voted_with_party_majority: false });
const careers = { 11: [2019], 12: [1997] };

describe("computeBenchmarks", () => {
  const b = computeBenchmarks({ politicians, interests, votes, careers, now });
  it("totals declared value and outside earnings per MP, counting every MP", () => {
    expect(b.byMp[1]).toMatchObject({ declared: 750, earnings: 500 });
    expect(b.byMp[2]).toMatchObject({ declared: 10000, earnings: 10000 });
    expect(b.byMp[3]).toMatchObject({ declared: 0, earnings: 0 });
    expect(b.distributions.declared).toEqual([0, 750, 10000]);
  });
  it("finds the rebellion rate only for MPs under a whip with enough votes", () => {
    expect(b.byMp[1].rebelPct).toBe(20);
    expect(b.byMp[2].rebelPct).toBeUndefined();
    expect(b.byMp[3].rebelPct).toBeUndefined();
    expect(b.distributions.rebelPct).toEqual([20]);
  });
  it("works out attendance against every division held", () => {
    expect(b.divisions).toBe(MIN_VOTES);
    expect(b.byMp[1].attendance).toBe(100);
    expect(b.byMp[2].attendance).toBe(10);
  });
  it("takes expenses and years served where they exist", () => {
    expect(b.byMp[1].expenses).toBe(1000);
    expect(b.byMp[3].expenses).toBeUndefined();
    expect(b.byMp[1].years).toBe(7.5);
    expect(b.byMp[2].years).toBe(29.5);
    expect(b.distributions.years).toEqual([7.5, 29.5]);
    expect(b.expensesYear).toBe("26_27");
  });
});
