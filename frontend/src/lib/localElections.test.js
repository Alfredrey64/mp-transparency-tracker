import { describe, it, expect } from "vitest";
import { nationOf, daysUntil, nextVote, upcomingDates, biggestDate, atStake } from "./localElections";

const today = new Date(Date.UTC(2026, 9, 11));
const parties = [{ name: "Labour Party", short: "Labour", colour: "#d50000" }, { name: "Conservative", short: "Conservative", colour: "#0063ba" }];
const index = [
  { id: "E09000001", name: "Alpha", control: "Labour majority", control_by_seats: "lab", total: 50, next: [["2027-05-06", 50]], seats: [[0, 30], [1, 20]] },
  { id: "E07000002", name: "Beta", control: "No overall control", control_by_seats: "noc", total: 40, next: [["2027-05-06", 13], ["2028-05-04", 14]], seats: [[1, 18], [0, 17]] },
  { id: "S12000003", name: "Gamma", control: "Labour majority", control_by_seats: "lab", total: 30, next: [["2027-03-31", 30]], seats: [[0, 20]] },
  { id: "W06000004", name: "Delta", control: "Labour majority", control_by_seats: "lab", total: 20, next: [["2026-05-07", 20]], seats: [[0, 12]] },
];

describe("local elections", () => {
  it("names the nation from the council code", () => {
    expect(nationOf("E09000001")).toBe("England");
    expect(nationOf("S12000003")).toBe("Scotland");
    expect(nationOf("W06000004")).toBe("Wales");
    expect(nationOf("N09000001")).toBe("Northern Ireland");
  });
  it("counts whole days, and counts today as zero", () => {
    expect(daysUntil("2026-10-11", today)).toBe(0);
    expect(daysUntil("2026-10-12", today)).toBe(1);
    expect(daysUntil("2027-05-06", today)).toBe(207);
  });
  it("skips an election that has already happened", () => {
    expect(nextVote(index[3], today)).toBeNull();
    expect(nextVote(index[1], today).date).toBe("2027-05-06");
  });
  it("groups the upcoming dates, soonest first", () => {
    const d = upcomingDates(index, today);
    expect(d.map((x) => x.date)).toEqual(["2027-03-31", "2027-05-06"]);
    const may = d[1];
    expect(may.councils.map((c) => c.name)).toEqual(["Alpha", "Beta"]);
    expect(may.seats).toBe(63);
    expect(may.nations).toEqual({ England: 2 });
    expect(biggestDate(d).date).toBe("2027-05-06");
  });
  it("says what is at stake", () => {
    const a = atStake(index[0], parties, today);
    expect(a.control).toMatch(/Labour holds 30 of 50 seats, and 26 is a majority/);
    expect(a.scope).toMatch(/All 50 seats are up/);
    const b = atStake(index[1], parties, today);
    expect(b.control).toMatch(/No party holds a majority/);
    expect(b.scope).toMatch(/13 of 40 seats are up/);
    expect(atStake(index[3], parties, today)).toBeNull();
  });
});
