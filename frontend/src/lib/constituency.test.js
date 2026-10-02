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
