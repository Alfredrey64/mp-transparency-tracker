import { describe, it, expect } from "vitest";
import { neighbourhoodRank, tenthWords, seatProfile, councilTaxProfile, taxYear, censusFacts, placeFacts, whoDoesWhat, responsibilities, nextContests, seatMapProfile, councilYears, electionWhen } from "./areaProfile";
import tax from "../data/councilTaxByCouncil.json";
import census from "../data/regionalProfile.json";
import seats from "../data/constituencies.json";
import summary from "../data/constituencySummary.json";
import history from "../data/constituencyHistory.json";
import elections from "../data/electionHistory.json";
import hexData from "../data/seatHexes.json";

describe("neighbourhood rank", () => {
  it("turns a rank in the nation's index into a tenth, 1 being the most deprived", () => {
    expect(neighbourhoodRank({ country: "England", index_of_multiple_deprivation: 100 }).decile).toBe(1);
    expect(neighbourhoodRank({ country: "England", index_of_multiple_deprivation: 32844 }).decile).toBe(10);
    expect(neighbourhoodRank({ country: "Wales", index_of_multiple_deprivation: 833 }).decile).toBe(5);
  });
  it("gives nothing where the lookup has no rank or a rank outside the nation's index", () => {
    expect(neighbourhoodRank({ country: "England" })).toBeNull();
    expect(neighbourhoodRank({ country: "England", index_of_multiple_deprivation: 99999 })).toBeNull();
    expect(neighbourhoodRank({ country: "Narnia", index_of_multiple_deprivation: 5 })).toBeNull();
  });
  it("words each tenth", () => {
    expect(tenthWords(1)).toBe("the most deprived tenth");
    expect(tenthWords(3)).toBe("the third most deprived tenth");
    expect(tenthWords(10)).toBe("the least deprived tenth");
  });
});

describe("seat profile", () => {
  const p = seatProfile({ key: "cities of london and westminster", seats: seats.constituencies, summary, history: history.bySeat, elections });
  it("orders candidates by votes and says how safe the seat is", () => {
    expect(p.candidates[0].votes).toBeGreaterThanOrEqual(p.candidates[1].votes);
    expect(p.safety.label).toMatch(/seat/);
    expect(p.standing.of).toBe(650);
  });
  it("ranks turnout among the 650 seats and compares it with the average", () => {
    expect(p.turnout.of).toBeGreaterThan(600);
    expect(p.turnout.rank).toBeGreaterThanOrEqual(1);
    expect(p.turnout.average).toBeGreaterThan(50);
  });
  it("lists who won each election, oldest first, and how often the seat changed party", () => {
    expect(p.runs.length).toBeGreaterThan(2);
    expect(p.runs.at(-1).year).toBe(2024);
    expect(Array.isArray(p.changes)).toBe(true);
  });
  it("is null for a seat it does not have", () => {
    expect(seatProfile({ key: "nowhere", seats: seats.constituencies, summary, history: history.bySeat, elections })).toBeNull();
  });
});

describe("council tax profile", () => {
  it("finds a council by name and works out the change since the series starts", () => {
    const t = councilTaxProfile(tax, "Adur");
    expect(t.first).toBe(1587);
    expect(t.last).toBe(2548);
    expect(Math.round(t.sinceFirst)).toBe(61);
    expect(t.rank).toBeGreaterThanOrEqual(1);
    expect(t.to).toBe(2026);
  });
  it("falls back to the county, and is null for a council not in England", () => {
    expect(councilTaxProfile(tax, "Nowhere District", "Adur").name).toBe("Adur");
    expect(councilTaxProfile(tax, "Aberdeen City")).toBeNull();
  });
  it("starts a newly created council's history at its first bill, instead of showing NaN", () => {
    const t = councilTaxProfile(tax, "Somerset");
    expect(t.start).toBeGreaterThan(0);
    expect(t.from).toBe(2010 + t.start);
    expect(Number.isFinite(t.first)).toBe(true);
    expect(Number.isFinite(t.sinceFirst)).toBe(true);
  });
  it("writes a tax year the way a bill does", () => { expect(taxYear(2026)).toBe("2026 to 27"); });
});

describe("census facts", () => {
  it("gives a region's figures, with the UK's where one exists", () => {
    const f = censusFacts(census, "london");
    expect(f.length).toBeGreaterThanOrEqual(4);
    expect(f.every((x) => typeof x.value === "number")).toBe(true);
  });
  it("gives nothing without a region", () => { expect(censusFacts(census, null)).toEqual([]); });
});

describe("place facts and who does what", () => {
  it("leaves out empty fields and unparished areas", () => {
    const rows = placeFacts({ admin_ward: "St James's", parish: "Westminster, unparished area", pfa: "Metropolitan Police", icb: null, ccg: "NHS West London", national_park: "England (non-National Park)" });
    expect(rows.map((r) => r.label)).toEqual(["Ward", "Police force", "NHS body for your area"]);
    expect(placeFacts({ admin_district: "Adur", admin_county: "West Sussex", lsoa: "Adur 003A" }).map((r) => r.value)).toEqual(["Adur, West Sussex", "Adur 003A"]);
  });
  it("splits services between district and county where there are two councils", () => {
    const w = whoDoesWhat({ council: { name: "Adur" }, county: { name: "West Sussex" }, taxType: "SD" });
    expect(w.rows).toHaveLength(2);
    expect(w.rows[1].does).toMatch(/Roads/);
  });
  it("describes a single council, and mentions the Mayor of London only in London", () => {
    expect(whoDoesWhat({ council: { name: "Leeds" }, county: null, taxType: "MD" }).rows[0].does).not.toMatch(/London/);
    expect(whoDoesWhat({ council: { name: "Hackney" }, county: null, taxType: "ILB" }).rows[0].does).toMatch(/Greater London Authority/);
    expect(whoDoesWhat({ council: null })).toBeNull();
  });
});

describe("responsibilities", () => {
  it("sends roads and schools to the county in a two-tier area and bins to the district", () => {
    const rows = Object.fromEntries(responsibilities({ council: { name: "Adur" }, county: { name: "West Sussex" }, result: { country: "England", pfa: "Sussex Police", icb: "NHS Sussex" } }));
    expect(rows["Bins and recycling"]).toBe("Adur");
    expect(rows["Roads, potholes and street lights"]).toBe("West Sussex");
    expect(rows["Crime and policing"]).toBe("Sussex Police");
  });
  it("gives Northern Ireland its own bodies, because its councils do not run roads or schools", () => {
    const rows = Object.fromEntries(responsibilities({ council: { name: "Belfast" }, county: null, result: { country: "Northern Ireland" } }));
    expect(rows["Roads and street lights"]).toBe("Department for Infrastructure");
    expect(rows["Bins, recycling, parks and leisure centres"]).toBe("Belfast");
  });
  it("names the devolved government for health in Scotland and Wales", () => {
    expect(Object.fromEntries(responsibilities({ council: { name: "Cardiff" }, county: null, result: { country: "Wales", icb: null } }))["GPs and hospitals"]).toMatch(/Welsh Government/);
    expect(Object.fromEntries(responsibilities({ council: { name: "Fife" }, county: null, result: { country: "Scotland" } }))["Crime and policing"]).toBe("Police Scotland");
  });
});

describe("next contests", () => {
  it("keeps contests that have not happened and have not been cancelled, soonest first, up to the limit", () => {
    const list = [{ date: "2026-01-01" }, { date: "2026-11-05", cancelled: true }, { date: "2026-11-06" }, { date: "2027-05-06" }];
    expect(nextContests(list, new Date("2026-10-29T10:00:00Z"), 5).map((c) => c.date)).toEqual(["2026-11-06", "2027-05-06"]);
    expect(nextContests(list, new Date("2026-10-29T10:00:00Z"), 1)).toHaveLength(1);
  });
});

describe("seat map profile", () => {
  const m = seatMapProfile({ hexes: hexData.hexes, seats: seats.constituencies, key: "bristol central" });
  it("draws every seat once and finds the one asked about", () => {
    expect(m.cells).toHaveLength(650);
    expect(m.cells[m.mine].name).toBe("Bristol Central");
    expect(m.box.w).toBeGreaterThan(10);
  });
  it("lists the seats touching it, nearest first, with their MP and party", () => {
    expect(m.neighbours.length).toBeGreaterThanOrEqual(3);
    expect(m.neighbours.length).toBeLessThanOrEqual(6);
    expect(m.neighbours.every((n) => n.name !== "Bristol Central")).toBe(true);
    expect(m.neighbours[0].mp).toBeTruthy();
  });
  it("is null for a seat that is not on the map", () => {
    expect(seatMapProfile({ hexes: hexData.hexes, seats: seats.constituencies, key: "nowhere" })).toBeNull();
    expect(seatMapProfile({ hexes: [], seats: {}, key: "x" })).toBeNull();
  });
});

describe("council years", () => {
  it("keeps the latest years that have seats, oldest first", () => {
    const rows = Array.from({ length: 14 }, (_, i) => ({ year: 2013 + i, total: i === 0 ? 0 : 50 }));
    const y = councilYears(rows, 11);
    expect(y).toHaveLength(11);
    expect(y[0].year).toBe(2016);
    expect(y.at(-1).year).toBe(2026);
    expect(councilYears(null)).toEqual([]);
  });
});

describe("when a seat's saved result was", () => {
  it("says 2024 for the general election and names the month for a by-election", () => {
    expect(electionWhen({ isGeneralElection: true, date: "2024-07-04" }).in).toBe("in 2024");
    expect(electionWhen({ isGeneralElection: false, date: "2026-10-08" }).in).toBe("at the October 2026 by-election");
    expect(electionWhen(undefined).in).toBe("in 2024");
  });
  it("is the by-election for the seats that have voted again", () => {
    const p = seatProfile({ key: "holborn and st pancras", seats: seats.constituencies, summary, history: history.bySeat, elections });
    expect(p.when.byElection).toBe(true);
  });
  it("counts the votes of candidates the saved list leaves out", () => {
    const p = seatProfile({ key: "hackney north and stoke newington", seats: seats.constituencies, summary, history: history.bySeat, elections });
    expect(p.others.votes).toBe(2310);
    expect(p.others.share).toBeGreaterThan(0.05);
  });
});
