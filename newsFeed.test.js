import { describe, expect, it } from "vitest";
import { decodeEntities, looksLikeFeed, parseItems, tidyItems } from "./newsFeed.js";

const item = (title, link, date, source = "The Times") =>
  `<item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate><source url="https://x.test">${source}</source></item>`;
const feed = (...items) => `<?xml version="1.0"?><rss version="2.0"><channel><title>q</title>${items.join("")}</channel></rss>`;

describe("decodeEntities", () => {
  it("handles named, numeric and hex entities and tidies spaces", () => {
    expect(decodeEntities("Tom &amp; Jerry&#39;s &#x2019;day&rsquo;  out")).toBe("Tom & Jerry's ’day’ out");
  });
  it("leaves an invalid number alone instead of throwing", () => {
    expect(decodeEntities("odd &#99999999999; text")).toBe("odd &#99999999999; text");
  });
});

describe("looksLikeFeed", () => {
  it("accepts a feed, even an empty one", () => {
    expect(looksLikeFeed(feed())).toBe(true);
  });
  it("rejects an error or consent page", () => {
    expect(looksLikeFeed("<html><body>Before you continue to Google</body></html>")).toBe(false);
    expect(looksLikeFeed("")).toBe(false);
    expect(looksLikeFeed(undefined)).toBe(false);
  });
});

describe("parseItems", () => {
  it("reads headline, source, link and date, and strips the trailing source", () => {
    const [a] = parseItems(feed(item("Reeves to meet firms - The Times", "https://news.test/a", "Mon, 05 Oct 2026 09:00:00 GMT")));
    expect(a).toEqual({ headline: "Reeves to meet firms", source: "The Times", url: "https://news.test/a", published_date: "2026-10-05T09:00:00.000Z" });
  });
  it("skips items with a bad date, a missing field, or a link that is not a web address", () => {
    const xml = feed(
      item("Bad date", "https://news.test/b", "not a date"),
      item("Script link", "javascript:alert(1)", "Mon, 05 Oct 2026 09:00:00 GMT"),
      "<item><title>No link</title><pubDate>Mon, 05 Oct 2026 09:00:00 GMT</pubDate></item>",
      item("Fine", "https://news.test/c", "Mon, 05 Oct 2026 09:00:00 GMT"),
    );
    expect(parseItems(xml).map((i) => i.headline)).toEqual(["Fine"]);
  });
});

describe("tidyItems", () => {
  const now = Date.parse("2026-10-11T12:00:00Z");
  const make = (headline, url, date) => ({ headline, url, source: "S", published_date: date });
  it("puts the newest first, drops repeats, old items and future-dated items, and keeps the limit", () => {
    const out = tidyItems(
      [
        make("Old story", "https://a.test/1", "2026-09-01T00:00:00Z"),
        make("Same story!", "https://a.test/2", "2026-10-09T00:00:00Z"),
        make("Same story", "https://b.test/2", "2026-10-10T00:00:00Z"),
        make("Future", "https://a.test/3", "2026-11-01T00:00:00Z"),
        make("Newest", "https://a.test/4", "2026-10-11T08:00:00Z"),
        make("Another", "https://a.test/5", "2026-10-08T00:00:00Z"),
        make("One more", "https://a.test/6", "2026-10-07T00:00:00Z"),
      ],
      { now, limit: 3 },
    );
    expect(out.map((i) => i.headline)).toEqual(["Newest", "Same story", "Another"]);
  });
});
