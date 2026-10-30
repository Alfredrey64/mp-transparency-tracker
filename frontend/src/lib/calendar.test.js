import { describe, it, expect } from "vitest";
import { buildIcs, electionEvents, icsText, fold } from "./calendar";

const now = new Date("2026-10-30T12:00:00Z");

describe("icsText", () => {
  it("escapes the characters a calendar treats as syntax", () => { expect(icsText("a, b; c\\d\ne")).toBe("a\\, b\\; c\\\\d\\ne"); });
});

describe("fold", () => {
  it("leaves short lines alone and folds long ones at 75 bytes without splitting a character", () => {
    expect(fold("SHORT")).toBe("SHORT");
    const long = fold(`SUMMARY:${"é".repeat(60)}`);
    const parts = long.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => new TextEncoder().encode(p).length <= 75)).toBe(true);
    expect(parts.slice(1).every((p) => p.startsWith(" "))).toBe(true);
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(`SUMMARY:${"é".repeat(60)}`);
  });
});

describe("buildIcs", () => {
  const ics = buildIcs([{ date: "2027-05-06", title: "Polling day, Bristol", note: "Take photo ID.", remindDays: 3 }, { date: "bad", title: "skipped" }], { now });
  it("makes one all-day event with a reminder, and skips a bad date", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(1);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270506");
    expect(ics).toContain("DTEND;VALUE=DATE:20270507");
    expect(ics).toContain("SUMMARY:Polling day\\, Bristol");
    expect(ics).toContain("TRIGGER:-P3D");
    expect(ics).toContain("DTSTAMP:20261030T120000Z");
  });
  it("rolls the end date over a month and year", () => {
    expect(buildIcs([{ date: "2026-12-31", title: "x" }], { now })).toContain("DTEND;VALUE=DATE:20270101");
  });
  it("has no reminder when asked for none", () => { expect(buildIcs([{ date: "2027-01-01", title: "x", remindDays: 0 }], { now })).not.toContain("VALARM"); });
});

describe("electionEvents", () => {
  const contests = [{ date: "2027-05-06", title: "Bristol local election", role: "Local Councillor", voterId: true, deadlines: [
    { key: "close_of_nominations", label: "Nominations close", date: "2027-04-01" }, { key: "registration_deadline", label: "Last day to register to vote", date: "2027-04-16" }, { key: "postal_vote_application_deadline", label: "Last day to apply for a postal vote", date: "2020-01-01" }] }];
  it("lists polling day and the deadlines still ahead, leaving out nominations and past dates", () => {
    const e = electionEvents(contests, null, now);
    expect(e.map((x) => x.date)).toEqual(["2027-04-16", "2027-05-06"]);
    expect(e[1].note).toContain("photo ID");
  });
  it("adds the council's own election when the lookup has not listed it", () => {
    const e = electionEvents([], { name: "Bath", next: [["2027-05-06", 10]] }, now);
    expect(e).toEqual([expect.objectContaining({ date: "2027-05-06", title: "Bath council election" })]);
  });
  it("does not list the council election twice", () => {
    expect(electionEvents(contests, { name: "Bristol", next: [["2027-05-06", 10]] }, now)).toHaveLength(2);
  });
});
