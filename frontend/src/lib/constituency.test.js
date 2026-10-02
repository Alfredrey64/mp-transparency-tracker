import { describe, it, expect } from "vitest";
import { seatSafety, leadOverSecond, searchSeats, seatKey, ordinal } from "./constituency";

describe("seatSafety", () => {
  it("bands a majority share into marginal, fairly safe or safe", () => {
    expect(seatSafety(0.4).key).toBe("marginal");
    expect(seatSafety(4.99).key).toBe("marginal");
    expect(seatSafety(5).key).toBe("fairly-safe");
    expect(seatSafety(19.9).key).toBe("fairly-safe");
    expect(seatSafety(20).key).toBe("safe");
    expect(seatSafety(55).key).toBe("safe");
  });
  it("says nothing when the figure is missing", () => {
    expect(seatSafety(null)).toBeNull();
    expect(seatSafety(NaN)).toBeNull();
  });
});

describe("leadOverSecond", () => {
  it("measures the lead in votes and points", () => {
    const r = leadOverSecond([{ votes: 20000, share: 0.5 }, { votes: 15000, share: 0.375 }]);
    expect(r.votes).toBe(5000);
    expect(r.points).toBeCloseTo(12.5);
  });
  it("needs at least two candidates", () => {
    expect(leadOverSecond([{ votes: 1 }])).toBeNull();
    expect(leadOverSecond(undefined)).toBeNull();
  });
});

describe("searchSeats", () => {
  const seats = {
    [seatKey("Gainsborough")]: { name: "Gainsborough", mp: { name: "Sir Edward Leigh" } },
    [seatKey("Bexleyheath & Crayford")]: { name: "Bexleyheath & Crayford", mp: { name: "Daniel Francis" } },
    [seatKey("Leigh")]: { name: "Leigh and Atherton", mp: { name: "Jo Platt" } },
    [seatKey("Holborn and St Pancras")]: { name: "Holborn and St Pancras", mp: { name: "Someone Else" } },
  };
  it("finds seats by seat name or MP name, seat-name prefixes first", () => {
    expect(searchSeats(seats, "gains").map((s) => s.name)).toEqual(["Gainsborough"]);
    expect(searchSeats(seats, "leigh").map((s) => s.name)).toEqual(["Leigh and Atherton", "Gainsborough"]);
    expect(searchSeats(seats, "francis")[0].name).toBe("Bexleyheath & Crayford");
  });
  it("matches ampersands and ignores very short or empty searches", () => {
    expect(searchSeats(seats, "bexleyheath and").map((s) => s.name)).toEqual(["Bexleyheath & Crayford"]);
    expect(searchSeats(seats, "g")).toEqual([]);
    expect(searchSeats(seats, "")).toEqual([]);
  });
});

describe("ordinal", () => {
  it("handles the teens and the usual endings", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111, 112, 650].map(ordinal)).toEqual(
      ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th", "112th", "650th"]
    );
  });
});

import { plainEndReason, buildSeatTimeline, spanLabel, majorityStanding, majorityBins } from "./constituency";

describe("plainEndReason", () => {
  it("translates the API's wording and leaves unknown wording alone", () => {
    expect(plainEndReason("Dissolution")).toBe("Left at a general election");
    expect(plainEndReason("Death")).toBe("Died in office");
    expect(plainEndReason("Resignation (Chiltern)")).toBe("Resigned");
    expect(plainEndReason("Recall")).toBe("Removed through a recall petition");
    expect(plainEndReason("Disqualification following imprisonment for more than a year")).toBe("Disqualified from sitting");
    expect(plainEndReason("Something new")).toBe("Something new");
    expect(plainEndReason(null)).toBeNull();
  });
});

describe("buildSeatTimeline", () => {
  const now = new Date("2026-10-02T00:00:00Z");
  const former = [{ id: 1, name: "Newer", party: "Labour", colour: "d50000", start: "2010-05-06", end: "2024-05-30", reason: "Dissolution" }, { id: 2, name: "Older", party: "Conservative", colour: "0063ba", start: "1979-05-03", end: "2010-04-12", reason: "Death" }];
  const t = buildSeatTimeline({ name: "Now", party: "Reform UK", colour: "12b6cf", start: "2024-07-04" }, former, now);
  it("lists the sitting MP first, then former MPs newest first, with years served", () => {
    expect(t.map((e) => e.name)).toEqual(["Now", "Newer", "Older"]);
    expect(t[0].current).toBe(true);
    expect(t[0].years).toBeCloseTo(2.25, 1);
    expect(t[1].years).toBeCloseTo(14.07, 1);
    expect(t[2].reason).toBe("Died in office");
  });
  it("copes with no sitting MP or no history", () => {
    expect(buildSeatTimeline(null, [], now)).toEqual([]);
    expect(buildSeatTimeline({ name: "A" }, [], now)).toHaveLength(1);
  });
  it("labels spans plainly", () => {
    expect(spanLabel(t[0])).toBe("2024 to now");
    expect(spanLabel(t[1])).toBe("2010 to 2024");
    expect(spanLabel({ current: false, start: "2001-01-01", end: "2001-12-01" })).toBe("2001");
  });
});

describe("majority standing", () => {
  const seats = { a: { result: { majorityPct: 1 } }, b: { result: { majorityPct: 10 } }, c: { result: { majorityPct: 30 } }, d: { result: null } };
  it("ranks a seat from the narrowest and says how many seats are more marginal than it", () => {
    expect(majorityStanding(seats, "b")).toEqual({ rankNarrowest: 2, of: 3, moreMarginalThanPct: 33 });
    expect(majorityStanding(seats, "d")).toBeNull();
  });
  it("bins majorities in five-point steps and marks the seat's own bin", () => {
    const { counts, mineBin } = majorityBins(seats, 10);
    expect(counts[0]).toBe(1);
    expect(counts[2]).toBe(1);
    expect(counts[6]).toBe(1);
    expect(mineBin).toBe(2);
  });
});
