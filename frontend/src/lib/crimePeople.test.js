import { describe, it, expect } from "vitest";
import data from "../data/crimePeople.json";
import { GROUPS, timesPhrase, populationShares, prisonFigures, offenceMatrix, unknownShare } from "./crimePeople";

describe("crime people figures", () => {
  it("phrases a ratio", () => {
    expect(timesPhrase(20.4, 9.4)).toBe("about 2.2 times the rate");
    expect(timesPhrase(20, 10)).toBe("about twice the rate");
    expect(timesPhrase(34, 9)).toBe("about 3.8 times the rate");
    expect(timesPhrase(9.5, 9.4)).toBe("about the same rate");
    expect(timesPhrase(5, 0)).toBeNull();
  });
  it("has the population of each group, adding to about 60 million", () => {
    const shares = populationShares(data.arrests.population);
    expect(Math.round(Object.values(shares).reduce((a, b) => a + b, 0))).toBe(100);
    expect(shares.white).toBeGreaterThan(75);
  });
  it("works out prison figures for every group", () => {
    const f = prisonFigures(data.prison, data.arrests.population);
    expect(f).toHaveLength(GROUPS.length);
    expect(Math.round(f.reduce((n, g) => n + g.shareOfPrisoners, 0))).toBe(100);
    for (const g of f) expect(g.rate).toBeGreaterThan(0);
  });
  it("makes an offence matrix whose columns are close to 100%", () => {
    const rows = offenceMatrix(data.offences);
    for (const g of GROUPS) expect(Math.round(rows.reduce((n, r) => n + r.cells[g.id], 0))).toBeGreaterThan(95);
    expect(rows.at(-1).name).toBe("Other");
    expect(unknownShare(data.offences)).toBeGreaterThan(0);
  });
  it("has arrests, stop and search and reoffending for every broad group", () => {
    for (const g of GROUPS) {
      expect(data.arrests.groups.find((x) => x.broad === g.id && !x.parent)?.rate, g.id).toBeGreaterThan(0);
      expect(data.stopSearch.groups.find((x) => x.broad === g.id && !x.parent)?.rate, g.id).toBeGreaterThan(0);
    }
    expect(data.reoffending.groups.length).toBeGreaterThan(2);
    expect(data.victims.ethnic.length).toBe(5);
  });
});
