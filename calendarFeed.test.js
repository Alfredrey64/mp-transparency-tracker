import { describe, it, expect } from "vitest";
import { buildFeed, buildAllFeeds, escapeText, fold, ukToUtc, FEEDS } from "./calendarFeed.js";

const data = {
  generated: "2026-11-10",
  from: "2026-11-10",
  to: "2026-12-07",
  away: [{ house: "Commons", from: "2026-11-20", to: "2026-11-20", label: "Not sitting" }],
  events: [
    { d: "2026-11-10", h: "L", k: "bill", time: "", t: "Church Appointments Bill", stage: "second reading", url: "https://bills.parliament.uk/Bills/4296" },
    { d: "2026-11-10", h: "C", k: "debate", time: "11:30", where: "Westminster Hall", t: "The matter of anti-social behaviour" },
    { d: "2026-11-10", h: "C", k: "hearing", time: "09:30", t: "Education Committee", about: "AI, and EdTech; in schools" },
    { d: "2026-07-01", h: "C", k: "questions", time: "12:00", t: "Prime Minister's Question Time" },
  ],
};

describe("calendar feed", () => {
  it("is a well-formed calendar with CRLF line endings", () => {
    const text = buildFeed(data, "all");
    expect(text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(text.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect((text.match(/BEGIN:VEVENT/g) ?? []).length).toBe((text.match(/END:VEVENT/g) ?? []).length);
    for (const line of text.split("\r\n")) expect(new TextEncoder().encode(line).length, line).toBeLessThanOrEqual(75);
  });
  it("sends each kind of item to the feeds it belongs in", () => {
    const bills = buildFeed(data, "bills");
    const chambers = buildFeed(data, "chambers");
    const all = buildFeed(data, "all");
    expect(bills).toContain("Church Appointments Bill: second reading");
    expect(bills).not.toContain("anti-social");
    expect(bills).not.toContain("Not sitting");
    expect(chambers).toContain("anti-social behaviour");
    expect(chambers).toContain("Commons: not sitting");
    expect(chambers).not.toContain("Education Committee");
    expect(all).toContain("Education Committee");
    expect(all).toContain("Commons: not sitting");
  });
  it("makes an untimed item an all-day item and a timed item one hour in UTC", () => {
    const text = buildFeed(data, "all");
    expect(text).toContain("DTSTART;VALUE=DATE:20261110\r\nDTEND;VALUE=DATE:20261111");
    // 11:30 on 10 November is GMT; 12:00 on 1 July is BST, an hour behind in UTC.
    expect(text).toContain("DTSTART:20261110T113000Z\r\nDTEND:20261110T123000Z");
    expect(text).toContain("DTSTART:20260701T110000Z");
    expect(text).toContain("shown as one hour");
  });
  it("keeps the same id for the same item every day, and different ids for different items", () => {
    const a = buildFeed(data, "all");
    const b = buildFeed({ ...data, generated: "2026-11-11" }, "all");
    const ids = (t) => t.split("\r\n").filter((l) => l.startsWith("UID:"));
    expect(ids(a)).toEqual(ids(b));
    expect(new Set(ids(a)).size).toBe(ids(a).length);
  });
  it("escapes the characters a calendar file treats as special", () => {
    expect(escapeText("a, b; c\\d\ne")).toBe("a\\, b\\; c\\\\d\\ne");
    expect(buildFeed(data, "all").replace(/\r\n /g, "")).toContain("About: AI\\, and EdTech\\; in schools");
  });
  it("folds long lines without cutting a character in half", () => {
    const long = `SUMMARY:${"é".repeat(60)}`;
    const folded = fold(long);
    expect(folded.split("\r\n ").join("")).toBe(long);
    for (const l of folded.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });
  it("works out UK time in winter and summer", () => {
    expect(ukToUtc("2026-01-15", "09:00").toISOString()).toBe("2026-01-15T09:00:00.000Z");
    expect(ukToUtc("2026-07-15", "09:00").toISOString()).toBe("2026-07-15T08:00:00.000Z");
  });
  it("builds every feed with its own file name", () => {
    expect(buildAllFeeds(data).map((f) => f.file)).toEqual(Object.values(FEEDS).map((f) => f.file));
  });
});
