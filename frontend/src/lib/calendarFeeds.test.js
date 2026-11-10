import { describe, it, expect } from "vitest";
import { FEED_LIST, countFor, feedUrls } from "./calendarFeeds";
import { FEEDS, buildFeed } from "../../../calendarFeed.js";
import calendar from "../data/parliamentCalendar.json";

describe("the calendar feeds the page offers", () => {
  it("are the same three the build writes, in the same words and with the same contents", () => {
    expect(FEED_LIST.map((f) => f.file)).toEqual(Object.values(FEEDS).map((f) => f.file));
    for (const f of FEED_LIST) {
      expect(f.kinds, f.key).toEqual(FEEDS[f.key].kinds);
      expect(f.away, f.key).toBe(FEEDS[f.key].away);
    }
  });
  it("count the items each file holds", () => {
    for (const f of FEED_LIST) expect((buildFeed(calendar, f.key).match(/BEGIN:VEVENT/g) ?? []).length, f.key).toBe(countFor(f, calendar));
  });
  it("link to the subscribe, Google and download addresses", () => {
    const u = feedUrls("parliament-bills.ics");
    expect(u.webcal).toBe("webcal://domesdaylive.co.uk/calendar/parliament-bills.ics");
    expect(u.google).toContain("calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fdomesdaylive.co.uk%2Fcalendar%2Fparliament-bills.ics");
    expect(u.https).toBe("https://domesdaylive.co.uk/calendar/parliament-bills.ics");
  });
});
