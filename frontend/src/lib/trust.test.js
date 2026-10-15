import { describe, expect, it } from "vitest";
import { AVG, COUNTRIES_2023, ELECTIONS, GE2024, INSTITUTION_KEYS, PARTY_ROWS, T, UK, mainRows, ranking, spreadOf, trustOf, turnoutNow, ukRank } from "./trust";

describe("trust data", () => {
  it("has the UK and the OECD average for both waves and every institution", () => {
    for (const year of ["2021", "2023"]) for (const k of INSTITUTION_KEYS) { expect(trustOf(UK, year, k), `${k} ${year}`).toBeGreaterThan(0); expect(trustOf(AVG, year, k), `${k} ${year}`).toBeGreaterThan(0); }
    for (const k of ["voice", "ownSay"]) expect(trustOf(UK, "2023", k)).toBeGreaterThan(0);
  });
  it("has the trust spread adding to about 100", () => {
    for (const code of Object.keys(T.countries)) for (const year of ["2021", "2023"]) {
      const s = spreadOf(code, year);
      if (s) expect(s.HMH + s.NEU + s.L + s.DK, `${code} ${year}`).toBeGreaterThan(98.5);
      if (s) expect(s.HMH + s.NEU + s.L + s.DK, `${code} ${year}`).toBeLessThan(101.5);
    }
  });
  it("ranks countries highest first and finds the UK", () => {
    for (const k of INSTITUTION_KEYS) { const r = ranking(k); expect(r.some((x) => x.uk), k).toBe(true); expect(r.some((x) => x.avg), k).toBe(true); for (let i = 1; i < r.length; i += 1) expect(r[i - 1].value).toBeGreaterThanOrEqual(r[i].value); }
    const g = ukRank("government");
    expect(g.rank).toBeGreaterThan(0);
    expect(g.of).toBe(COUNTRIES_2023);
  });
  it("names every country and not a currency", () => {
    const names = Object.values(T.countries).map((c) => c.name);
    for (const bad of ["franc", "peseta", "euro", "Establishments"]) expect(names.join("|")).not.toContain(bad);
  });
  it("has elections in order with turnout and a two-party share, ending in 2024", () => {
    expect(ELECTIONS[0].id).toBe("1945");
    expect(ELECTIONS.at(-1).id).toBe("2024");
    for (let i = 1; i < ELECTIONS.length; i += 1) expect(ELECTIONS[i].t).toBeGreaterThan(ELECTIONS[i - 1].t);
    for (const e of ELECTIONS) { expect(e.turnout).toBeGreaterThan(50); expect(e.turnout).toBeLessThan(90); expect(e.twoParty).toBeGreaterThan(40); }
    expect(turnoutNow().turnout).toBeCloseTo((GE2024.validVotes / GE2024.electorate) * 100, 0);
  });
  it("has the 2024 seats adding to 650 with the independents, and sensible shares", () => {
    expect(GE2024.parties.reduce((a, p) => a + p[2], 0) + GE2024.independentSeats).toBe(650);
    const rows = mainRows();
    expect(rows.map((r) => r.name)).toEqual(["Labour", "Conservative", "Reform UK", "Liberal Democrat", "Green Party"]);
    for (const r of PARTY_ROWS) { expect(r.voteShare).toBeGreaterThan(0); expect(r.voteShare).toBeLessThan(100); }
    expect(rows[0].perSeat).toBeLessThan(rows[2].perSeat);
  });
});
