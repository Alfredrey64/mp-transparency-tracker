import { describe, it, expect } from "vitest";
import { parseFeed, inOrder, looksComplete, decode } from "./actsFeed.js";

const entry = (year, n, title, date, summary = "An Act to do a thing.") => `<entry><id>x</id><title>${title}</title><ukm:DocumentMainType Value="UnitedKingdomPublicGeneralAct"/><ukm:Year Value="${year}"/><ukm:Number Value="${n}"/><ukm:CreationDate Date="${date}"/><summary>${summary}</summary></entry>`;
const feed = (entries, more = 0) => `<feed><leg:morePages>${more}</leg:morePages><leg:facets><leg:facetYears><leg:facetYear year="2026" href="h" total="28" value="28"/><leg:facetYear year="2025" href="h" total="36" value="36"/></leg:facetYears></leg:facets>${entries.join("")}</feed>`;

describe("parseFeed", () => {
  it("reads each Act's year, number, title, date and long title", () => {
    const { entries } = parseFeed(feed([entry(2026, 28, "Sovereign Grant Act 2026", "2026-11-02", "An Act to specify the amount &amp; more.")]));
    expect(entries).toEqual([{ year: 2026, number: 28, title: "Sovereign Grant Act 2026", date: "2026-11-02", summary: "An Act to specify the amount & more.", url: "https://www.legislation.gov.uk/ukpga/2026/28" }]);
  });
  it("reads the yearly totals and whether there are more pages", () => {
    const p = parseFeed(feed([], 2));
    expect(p.perYear).toEqual({ 2026: 28, 2025: 36 });
    expect(p.morePages).toBe(2);
  });
  it("skips an entry that is missing something it needs", () => {
    expect(parseFeed(feed([entry(2026, 1, "", "2026-01-01")])).entries).toEqual([]);
  });
  it("turns character references into letters", () => {
    expect(decode("Renters&#8217; Rights &amp; &#x2019;")).toBe("Renters’ Rights & ’");
  });
});

describe("inOrder and looksComplete", () => {
  const a = (n, d) => ({ year: 2026, number: n, title: `Act ${n}`, date: d, summary: "", url: "" });
  it("sorts and drops repeats", () => {
    expect(inOrder([a(2, "2026-02-01"), a(1, "2026-01-01"), a(2, "2026-02-01")]).map((e) => e.number)).toEqual([1, 2]);
  });
  it("accepts a whole year and refuses a gap, a wrong count or dates going backwards", () => {
    expect(looksComplete([a(1, "2026-01-01"), a(2, "2026-02-01")], 2)).toBe(true);
    expect(looksComplete([a(1, "2026-01-01"), a(3, "2026-02-01")], 2)).toBe(false);
    expect(looksComplete([a(1, "2026-01-01")], 2)).toBe(false);
    expect(looksComplete([a(1, "2026-03-01"), a(2, "2026-02-01")], 2)).toBe(false);
    expect(looksComplete([], null)).toBe(false);
  });
});
