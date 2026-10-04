import { describe, it, expect } from "vitest";
import { monthYear, duration, unionYears, mergeSeats, packRows, buildLanes, chartRange, axisTicks, buildEvents, summarise, careerStory, partyColourByName } from "./careerTimeline";

const NOW = Date.parse("2026-10-01");
const detail = {
  h: [["1997-05-01", "2005-04-11"], ["2010-05-06", null]],
  s: [["Seat A", "1997-05-01", "2001-05-01", 1], ["Seat A", "2001-05-02", "2005-04-11", 1], ["Seat B", "2010-05-06", null, 3]],
  p: [["Conservative", "1997-05-01", "2010-01-01"], ["Independent", "2010-01-01", "2010-09-01"], ["Labour", "2010-09-01", null]],
  g: [["Minister", "Treasury", "2012-01-01", "2013-01-01"], ["Secretary", "Defence", "2012-06-01", "2014-06-01"]],
  o: [["Shadow", "Home Office", "2015-01-01", null]],
  x: [["Chair of a group", "2001-01-01", "2002-01-01"]],
  c: [["Treasury Committee", "2011-01-01", null, "Chair"]],
  l: [["Seat C", "1992-04-09"]],
};

describe("dates", () => {
  it("formats months and durations", () => {
    expect(monthYear("1987-06-11")).toBe("June 1987");
    expect(monthYear(null)).toBe("now");
    expect(duration("2010-01-01", "2012-06-01")).toBe("2 yrs 5 mths");
    expect(duration("2010-01-01", "2010-09-01")).toBe("8 months");
    expect(duration("2010-01-01", "2011-01-01")).toBe("1 yr");
    expect(duration("2010-01-01", "2010-01-20")).toBe("3 weeks");
  });
  it("counts overlapping spells once", () => {
    const years = unionYears([["2010-01-01", "2012-01-01"], ["2011-01-01", "2013-01-01"]], NOW);
    expect(Math.round(years)).toBe(3);
    expect(Math.round(unionYears([["2020-01-01", null]], NOW))).toBe(7);
  });
});

describe("seats and rows", () => {
  it("joins consecutive spells for the same seat", () => {
    expect(mergeSeats(detail.s)).toEqual([
      { name: "Seat A", start: "1997-05-01", end: "2005-04-11", elected: 2 },
      { name: "Seat B", start: "2010-05-06", end: null, elected: 3 },
    ]);
  });
  it("puts overlapping posts in separate rows and reuses a free row", () => {
    const r = packRows([{ from: 0, to: 10 }, { from: 5, to: 15 }, { from: 11, to: 20 }]);
    expect(r.rows).toBe(2);
    expect(r.items.map((i) => i.row)).toEqual([0, 1, 0]);
  });
});

describe("lanes and axis", () => {
  const lanes = buildLanes(detail, NOW);
  it("builds only the lanes that have something in them, with overlapping government posts on two rows", () => {
    expect(lanes.map((l) => l.key)).toEqual(["commons", "seat", "party", "gov", "opp", "other", "committee"]);
    expect(lanes.find((l) => l.key === "gov").rows).toBe(2);
    expect(buildLanes({ h: [], s: [], p: [], g: [], o: [], x: [], c: [], l: [] }, NOW)).toEqual([]);
  });
  it("starts the chart on a round year and ends it today", () => {
    const r = chartRange(lanes, NOW);
    expect(new Date(r.from).getUTCFullYear()).toBe(1995);
    expect(r.to).toBe(NOW);
    const ticks = axisTicks(r);
    expect(ticks[0].year).toBe(1995);
    expect(ticks.every((t) => t.at >= r.from && t.at <= r.to)).toBe(true);
  });
});

describe("events and summary", () => {
  const events = buildEvents(detail, NOW);
  it("lists everything oldest first, including lost elections and party moves", () => {
    expect(events[0]).toMatchObject({ kind: "lost", title: "Stood for Seat C and lost" });
    expect(events.find((e) => e.title === "Joined Conservative")).toBeTruthy();
    expect(events.find((e) => e.title === "Became an independent")).toMatchObject({ sub: "Previously Conservative" });
    expect(events.find((e) => e.title === "Became Labour")).toMatchObject({ ongoing: true });
    expect([...events].sort((a, b) => a.start.localeCompare(b.start))).toEqual(events);
  });
  it("summarises the career", () => {
    const s = summarise(detail, NOW);
    expect(s.firstElected).toBe("1997-05-01");
    expect(s.electionsWon).toBe(5);
    expect(s.electionsLost).toBe(1);
    expect(s.seats).toEqual(["Seat A", "Seat B"]);
    expect(s.governmentPosts).toBe(2);
    expect(s.departments).toBe(2);
    expect(s.partyChanges).toBe(2);
    expect(s.committeesNow).toBe(1);
    expect(s.longestRole.post).toBe("Shadow");
  });
  it("tells the story without pronouns", () => {
    const text = careerStory("Alex Smith", detail, NOW).join(" ");
    expect(text).toContain("Alex Smith has been an MP");
    expect(text).toContain("5 elections won and 1 lost");
    expect(text).not.toMatch(/\b(he|she|his|her|him)\b/i);
  });
  it("copes with nothing", () => {
    const empty = { h: [], s: [], p: [], g: [], o: [], x: [], c: [], l: [] };
    expect(buildEvents(empty, NOW)).toEqual([]);
    expect(careerStory("A", empty, NOW)).toEqual([]);
  });
});

describe("a peer's career", () => {
  const peer = { ...detail, lords: [["2011-06-01", null]], h: [["1997-05-01", "2010-05-01"]], s: [["Seat A", "1997-05-01", "2010-05-01", 3]] };
  it("tells the Lords story first, then the time as an MP", () => {
    const lines = careerStory("Lord Smith", peer, NOW);
    expect(lines[0]).toContain("Lord Smith has sat in the House of Lords since June 2011");
    expect(lines[1]).toContain("Before that, Lord Smith was an MP for Seat A from May 1997 to May 2010");
  });
  it("adds a Lords lane and event, and Lords years to the summary", () => {
    expect(buildLanes(peer, NOW)[0].key).toBe("lords");
    expect(buildEvents(peer).some((e) => e.kind === "lords")).toBe(true);
    const s = summarise(peer, NOW);
    expect(s.lordsFrom).toBe("2011-06-01");
    expect(Math.round(s.yearsInLords)).toBe(15);
    expect(s.inLordsNow).toBe(true);
  });
});

describe("party colours", () => {
  it("knows the main parties and gives others a steady colour", () => {
    expect(partyColourByName("Labour")).toBe("#d50000");
    expect(partyColourByName("Some Old Party")).toBe(partyColourByName("Some Old Party"));
  });
});
