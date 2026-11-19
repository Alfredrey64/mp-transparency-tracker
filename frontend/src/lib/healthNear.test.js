import { describe, it, expect } from "vitest";
import { placesWithin, placeView, ratingCounts, waitView, GROUPS } from "./healthNear";

const records = [
  { i: "1", n: "Near GP", t: "GP", o: "G", q: "GGGGG", d: "2025-06", la: 51.46, lo: -2.59 },
  { i: "2", n: "Far GP", t: "GP", o: "O", q: "OOOOO", d: "2020-01", la: 51.9, lo: -2.1 },
  { i: "3", n: "Care home", t: "CH", o: "R", q: "RG-RI", d: "2022-02", la: 51.455, lo: -2.58 },
];
const point = { lat: 51.4545, lon: -2.5879 };

describe("health services near you", () => {
  it("lists the places within the radius, nearest first, filtered by type", () => {
    expect(placesWithin(records, point, 5).map((r) => r.i)).toEqual(["3", "1"]);
    expect(placesWithin(records, point, 5, ["GP"]).map((r) => r.i)).toEqual(["1"]);
  });
  it("covers every type in one of the groups", () => {
    const covered = GROUPS.flatMap((g) => g.types).sort();
    expect(covered).toEqual(["CH", "CO", "GP", "HO", "HS", "MH", "UC"]);
  });
  it("names the rating and questions, and how old the report is", () => {
    const v = placeView(records[2], new Date(Date.UTC(2026, 10, 19)));
    expect(v.overall.name).toBe("Requires improvement");
    expect(v.questions.map((q) => q.letter)).toEqual(["R", "G", "-", "R", "I"]);
    expect(v.questions[2]).toMatchObject({ question: "Caring", rating: "Not rated" });
    expect(v.questions[0]).toMatchObject({ question: "Safe", rating: "Requires improvement" });
    expect(v.months).toBe(57);
    expect(v.old).toBe(true);
    expect(v.age).toBe("4 years ago");
    expect(v.url).toBe("https://www.cqc.org.uk/location/3");
  });
  it("calls a report from the same month 'this month', and a recent one by months", () => {
    expect(placeView({ ...records[0], d: "2026-11" }, new Date(Date.UTC(2026, 10, 19))).age).toBe("this month");
    expect(placeView(records[0], new Date(Date.UTC(2026, 10, 19))).age).toBe("17 months ago");
    expect(placeView(records[0], new Date(Date.UTC(2026, 10, 19))).old).toBe(false);
  });
  it("counts the four ratings", () => { expect(ratingCounts(records)).toEqual({ O: 1, G: 1, R: 1, I: 0 }); });
  it("compares a trust's waits with England's", () => {
    expect(waitView({ total: 100, pct18: 70, median: 10, p92: 30, w52: 4, w65: 1 }, { pct18: 65 }).tone).toBe("#2C7DA0");
    expect(waitView({ total: 100, pct18: 60, median: 10, p92: 30, w52: 4, w65: 1 }, { pct18: 65 }).tone).toBe("#B3262E");
    expect(waitView({ total: 100, pct18: 93, median: 5, p92: 15, w52: 0, w65: 0 }, { pct18: 65 }).tone).toBe("#2F8F6B");
    expect(waitView(undefined, { pct18: 65 })).toBeNull();
  });
});
