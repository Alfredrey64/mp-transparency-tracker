import { describe, it, expect } from "vitest";
import { normCouncil, partyDisplay, seatsByParty, majorityOf, nextElectionText, controlGroup, searchCouncils, councilsForCodes, nationalSummary, historyRows, findWard } from "./councils";

const parties = [
  { name: "Labour Party", short: "Labour", colour: "#d50000" },
  { name: "Reform UK", short: "Reform UK", colour: "#12b6cf" },
  { name: "Odd Local Party", short: "Odd Local Party", colour: null },
];
const index = [
  { id: "E1", name: "Adur", total: 29, control: "Labour majority", next: [["2027-05-06", 29]], seats: [[0, 20], [1, 9]] },
  { id: "E2", name: "Hackney & Shoreditch", total: 57, control: "Green elected mayor", next: [["2027-05-06", 19], ["2028-05-04", 19], ["2030-05-02", 19]], seats: [[0, 30], [2, 27]] },
  { id: "E10", name: "Kent", total: 81, control: "No overall control", next: [["2029-05-03", 81]], seats: [[1, 40], [0, 41]] },
  { id: "E3", name: "Coalitionshire", total: 10, control: "Liberal Democrat, Green (partnership)", next: [], seats: [[0, 5], [1, 5]] },
];

describe("names and parties", () => {
  it("compares names without punctuation, case or ampersands", () => {
    expect(normCouncil("Hackney & Shoreditch")).toBe("hackney and shoreditch");
    expect(normCouncil("Kingston upon Hull, City of")).toBe("kingston upon hull city of");
  });
  it("gives a party its colour, or a steady one when it has none", () => {
    expect(partyDisplay(parties, 0)).toMatchObject({ short: "Labour", colour: "#d50000" });
    expect(partyDisplay(parties, 2).colour).toMatch(/^#/);
    expect(partyDisplay(parties, 99).short).toBe("Unknown");
  });
  it("lists seats by party with each share, and the majority line", () => {
    const s = seatsByParty(index[0], parties);
    expect(s.map((p) => [p.short, p.count])).toEqual([["Labour", 20], ["Reform UK", 9]]);
    expect(s[0].pct).toBeCloseTo((20 / 29) * 100, 5);
    expect(majorityOf(57)).toBe(29);
    expect(majorityOf(10)).toBe(6);
  });
});

describe("election dates", () => {
  it("says when a whole council votes, or when a council that elects in parts does", () => {
    expect(nextElectionText(index[0])).toBe("All 29 seats are up on 6 May 2027.");
    expect(nextElectionText(index[1])).toBe("19 of 57 seats are up on 6 May 2027, then more in 2028 and 2030.");
    expect(nextElectionText(index[3])).toBe("No election date is recorded.");
  });
});

describe("control and search", () => {
  it("groups who runs a council", () => {
    expect(controlGroup("Labour majority")).toBe("Labour");
    expect(controlGroup("Green elected mayor")).toBe("Green");
    expect(controlGroup("Reform UK minority")).toBe("Reform UK");
    expect(controlGroup("Liberal Democrat, Green (partnership)")).toBe("A partnership of parties");
    expect(controlGroup("No overall control")).toBe("No overall control");
  });
  it("finds councils by name, best matches first", () => {
    expect(searchCouncils(index, "hack").map((c) => c.name)).toEqual(["Hackney & Shoreditch"]);
    expect(searchCouncils(index, "dur").map((c) => c.name)).toEqual(["Adur"]);
    expect(searchCouncils(index, "h")).toEqual([]);
  });
  it("matches a postcode lookup to its district and county council", () => {
    const r = councilsForCodes(index, { admin_district: "E1", admin_county: "E10" });
    expect(r.district.name).toBe("Adur");
    expect(r.county.name).toBe("Kent");
    expect(councilsForCodes(index, { admin_district: "nope" })).toEqual({ district: null, county: null });
  });
});

describe("national summary", () => {
  const s = nationalSummary(index, parties);
  it("adds up councillors, seats by party and who runs the councils", () => {
    expect(s.councils).toBe(4);
    expect(s.councillors).toBe(29 + 57 + 81 + 10);
    expect(s.byParty[0]).toMatchObject({ short: "Labour", count: 20 + 30 + 41 + 5 });
    expect(Object.fromEntries(s.control.map((c) => [c.group, c.count]))).toEqual({ Labour: 1, Green: 1, "No overall control": 1, "A partnership of parties": 1 });
  });
  it("lists when councils next vote, soonest first, with seats", () => {
    expect(s.nextDates).toEqual([{ date: "2027-05-06", councils: 2, seats: 29 + 19 }, { date: "2029-05-03", councils: 1, seats: 81 }]);
  });
});

describe("history and wards", () => {
  it("turns history rows into objects", () => {
    expect(historyRows({ history: [[2025, 10, 5, 5]] }, ["year", "total", "con", "lab"])).toEqual([{ year: 2025, total: 10, con: 5, lab: 5 }]);
    expect(historyRows(null, ["year"])).toEqual([]);
  });
  it("finds a ward from a postcode lookup despite different spelling", () => {
    const wards = [["St. Mary's & Park", []], ["Hillside", []]];
    expect(findWard(wards, "St Marys and Park")?.[0]).toBe("St. Mary's & Park");
    expect(findWard(wards, "hillside")?.[0]).toBe("Hillside");
    expect(findWard(wards, "Nowhere")).toBeNull();
    expect(findWard(wards, "")).toBeNull();
  });
});
